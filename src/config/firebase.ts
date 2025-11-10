// Configuración de Firebase para BeFast GO
// Nota: En React Native (con @react-native-firebase) NO se usa la config web ni initializeApp manual.
// La app [DEFAULT] se inicializa nativamente leyendo android/app/google-services.json.
import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import messaging from '@react-native-firebase/messaging';
import storage from '@react-native-firebase/storage';
import functions from '@react-native-firebase/functions';

// Colecciones de Firestore (usar exactamente estas)
export const COLLECTIONS = {
  // Conductores
  DRIVERS: 'drivers',
  DRIVER_APPLICATIONS: 'driverApplications',
  
  // Pedidos
  ORDERS: 'orders',
  ORDER_TIMELINE: 'orderTimeline',
  
  // Financiero
  WALLET_TRANSACTIONS: 'walletTransactions',
  CREDIT_TRANSACTIONS: 'creditTransactions',
  
  // Sistema
  SYSTEM_LOGS: 'systemLogs',
  AUDIT_LOGS: 'auditLogs'
};

// Funciones de Cloud Functions
export const CLOUD_FUNCTIONS = {
  VALIDATE_ORDER_ASSIGNMENT: 'validateOrderAssignment',
  PROCESS_ORDER_COMPLETION: 'processOrderCompletion',
  HANDLE_ORDER_WORKFLOW: 'handleOrderWorkflow',
  UPDATE_DRIVER_STATUS: 'updateDriverStatus',
  PROCESS_WITHDRAWAL: 'processWithdrawalRequest',
  PROCESS_DEBT_PAYMENT: 'processDebtPayment',
  SEND_NOTIFICATION: 'sendNotification'
};

// Exportar instancias de Firebase
export { auth, firestore, messaging, storage, functions };

// Función para inicializar Firebase
export const initializeFirebase = async () => {
  try {
    // Tocar la app por defecto para forzar/validar inicialización nativa
    const defaultApp = firebase.app();
    console.log('Firebase default app:', defaultApp.name);
    return true;
  } catch (error) {
    console.error('Error initializing Firebase (default app not available):', error);
    return false;
  }
};

// Función para configurar notificaciones push
export const setupPushNotifications = async () => {
  try {
    // Solicitar permisos
    const authStatus = await messaging().requestPermission();
    
    if (authStatus === messaging.AuthorizationStatus.AUTHORIZED) {
      // Obtener token FCM
      const fcmToken = await messaging().getToken();
      
      // Guardar token en Firestore
      const currentUser = auth().currentUser;
      if (currentUser && fcmToken) {
        await firestore()
          .collection(COLLECTIONS.DRIVERS)
          .doc(currentUser.uid)
          .update({
            fcmToken: fcmToken,
            lastTokenUpdate: firestore.FieldValue.serverTimestamp()
          });
      }
      
      return fcmToken;
    }
    
    return null;
  } catch (error) {
    console.error('Error setting up push notifications:', error);
    return null;
  }
};

// Función para escuchar notificaciones
export const setupNotificationListeners = () => {
  // Notificaciones en primer plano
  messaging().onMessage(async remoteMessage => {
    console.log('Foreground message:', remoteMessage);
    
    if (remoteMessage.data?.type === 'NEW_ORDER') {
      // Mostrar notificación de nuevo pedido
      // Esta función se implementará en el componente correspondiente
    }
  });
  
  // Notificaciones en segundo plano
  messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log('Background message:', remoteMessage);
  });
};
// Configuración de Firebase para BeFast GO - Proyecto: befast-hfkbl
// Integración con ecosistema BeFast existente
import firebase from '@react-native-firebase/app';
import firestore, { FieldValue } from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import functions from '@react-native-firebase/functions';
import messaging from '@react-native-firebase/messaging';
import storage from '@react-native-firebase/storage';

export const firebaseConfig = {
  apiKey: "AIzaSyA53dByYcS4bPBSGGbWDuLlw9Kbb0QAzRI",
  authDomain: 'befast-hfkbl.firebaseapp.com',
  projectId: 'befast-hfkbl',
  storageBucket: 'befast-hfkbl.appspot.com',
  messagingSenderId: '897579485656',
  appId: '1:897579485656:android:abc123def456',
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const COLLECTIONS = {
  DRIVERS: 'drivers',
  DRIVER_APPLICATIONS: 'driverApplications',
  ORDERS: 'orders',
  ORDER_TIMELINE: 'orderTimeline',
  WALLET_TRANSACTIONS: 'walletTransactions',
  CREDIT_TRANSACTIONS: 'creditTransactions',
  BUSINESSES: 'businesses',
  SYSTEM_LOGS: 'systemLogs',
  AUDIT_LOGS: 'auditLogs',
  SHIPDAY_DRIVERS: 'shipdayDrivers',
  SHIPDAY_ORDERS: 'shipdayOrders',
  SHIPDAY_WEBHOOK_LOGS: 'shipdayWebhookLogs',
  USERS: 'users'
};

export const CLOUD_FUNCTIONS = {
  handleAuthOperations: 'handleAuthOperations',
  verifyEmail: 'verifyEmail',
  generateVerificationCode: 'generateVerificationCode',
  resendVerificationCode: 'resendVerificationCode',
  createOrder: 'createOrder',
  validateOrderAssignment: 'validateOrderAssignment',
  processOrderCompletion: 'processOrderCompletion',
  handleOrderWorkflow: 'handleOrderWorkflow',
  onOrderCompleted: 'onOrderCompleted',
  updateDriverStatus: 'updateDriverStatus',
  processDriverApplication: 'processDriverApplication',
  syncDriverToShipday: 'syncDriverToShipday',
  processPayment: 'processPayment',
  transferBenefits: 'transferBenefits',
  manageFinancialOperationsConsolidated: 'manageFinancialOperationsConsolidated',
  classifyDriversMonthly: 'classifyDriversMonthly',
  generateIDSE: 'generateIDSE',
  processMonthlyPayroll: 'processMonthlyPayroll',
  handleShipdayWebhook: 'handleShipdayWebhook',
  requestShipdaySync: 'requestShipdaySync',
  retryFailedWebhooks: 'retryFailedWebhooks',
  businessChatbot: 'businessChatbot',
  driverChatbot: 'driverChatbot',
  adminChatbot: 'adminChatbot',
  processDriverDocuments: 'processDriverDocuments',
  auditFinancialTransaction: 'auditFinancialTransaction'
};

export const initializeFirebase = async () => {
  // Ya inicializado arriba; mantenemos API por compatibilidad
  return true;
};

export const setupPushNotifications = async () => {
  try {
    // Solicitar permisos
    const authStatus = await messaging().requestPermission({
      alert: true,
      announcement: false,
      badge: true,
      carPlay: true,
      provisional: false,
      sound: true,
    });

    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('Authorization status:', authStatus);

      // Obtener token FCM
      const fcmToken = await messaging().getToken();

      if (fcmToken && auth().currentUser) {
        // Guardar token en Firestore
        await firestore()
          .collection(COLLECTIONS.DRIVERS)
          .doc(auth().currentUser.uid)
          .update({
            fcmToken: fcmToken,
            lastTokenUpdate: firestore.FieldValue.serverTimestamp()
          });

        console.log('FCM Token saved:', fcmToken);
      }
    }
  } catch (error) {
    console.error('Error setting up push notifications:', error);
  }
};

export const setupNotificationListeners = () => {
  // Notificaciones en primer plano
  const unsubscribeOnMessage = messaging().onMessage(async remoteMessage => {
    console.log('Foreground message received:', remoteMessage);

    if (remoteMessage.data?.type === 'NEW_ORDER') {
      console.log('New order notification:', remoteMessage.data);
      // Aquí se puede integrar con el store de Redux si es necesario
    }
  });

  // Notificaciones en segundo plano
  messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log('Background message received:', remoteMessage);
  });

  // Notificación tocada cuando la app está en segundo plano
  const unsubscribeOnNotificationOpened = messaging().onNotificationOpenedApp(remoteMessage => {
    console.log('Notification opened app:', remoteMessage);

    if (remoteMessage.data?.type === 'NEW_ORDER') {
      console.log('Opening app from new order notification:', remoteMessage.data);
      // Aquí se puede navegar a la pantalla apropiada
    }
  });

  // App abierta desde notificación (app cerrada completamente)
  messaging()
    .getInitialNotification()
    .then(remoteMessage => {
      if (remoteMessage) {
        console.log('App opened from notification (quit state):', remoteMessage);
      }
    })
    .catch(error => {
      console.error('Error getting initial notification:', error);
    });

  // Retornar función de limpieza
  return () => {
    unsubscribeOnMessage();
    unsubscribeOnNotificationOpened();
  };
};

export { firestore, auth, functions, messaging, storage, setupPushNotifications, setupNotificationListeners };

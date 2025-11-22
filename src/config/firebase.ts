import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import functions from '@react-native-firebase/functions';
import messaging from '@react-native-firebase/messaging';
import storage from '@react-native-firebase/storage';
import type { FirebaseMessagingTypes } from '@react-native-firebase/messaging';

type FirebaseRemoteMessage = FirebaseMessagingTypes.RemoteMessage;

// Firebase se inicializa automáticamente en React Native
// No necesitamos configuración manual

firestore().settings({
  persistence: true,
  cacheSizeBytes: firestore.CACHE_SIZE_UNLIMITED,
});

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
  USERS: 'users',
  NOTIFICATIONS: 'notifications',
  INCIDENTS: 'incidents',
  FORMAL_REVIEWS: 'formalReviews',
};

export const CLOUD_FUNCTIONS = {
  handleAuthOperations: 'handleAuthOperations',
  verifyEmail: 'verifyEmail',
  generateVerificationCode: 'generateVerificationCode',
  resendVerificationCode: 'resendVerificationCode',
  createOrder: 'createOrder',
  getDriverOrders: 'getDriverOrders',
  validateOrderAssignment: 'validateOrderAssignment',
  processOrderCompletion: 'processOrderCompletion',
  handleOrderWorkflow: 'handleOrderWorkflow',
  onOrderCompleted: 'onOrderCompleted',
  updateDriverStatus: 'updateDriverStatus',
  processDriverApplication: 'processDriverApplication',
  processPayment: 'processPayment',
  transferBenefits: 'transferBenefits',
  manageFinancialOperationsConsolidated: 'manageFinancialOperationsConsolidated',
  classifyDriversMonthly: 'classifyDriversMonthly',
  generateIDSE: 'generateIDSE',
  processMonthlyPayroll: 'processMonthlyPayroll',
  businessChatbot: 'businessChatbot',
  driverChatbot: 'driverChatbot',
  adminChatbot: 'adminChatbot',
  processDriverDocuments: 'processDriverDocuments',
  auditFinancialTransaction: 'auditFinancialTransaction',
  // Alias en MAYÚSCULAS usados por otros módulos
  GET_DRIVER_ORDERS: 'getDriverOrders',
  VALIDATE_ORDER_ASSIGNMENT: 'validateOrderAssignment',
  PROCESS_ORDER_COMPLETION: 'processOrderCompletion',
  HANDLE_ORDER_WORKFLOW: 'handleOrderWorkflow',
  UPDATE_DRIVER_STATUS: 'updateDriverStatus',
  PROCESS_WITHDRAWAL: 'processPayment',
  PROCESS_DEBT_PAYMENT: 'processPayment',
  SEND_NOTIFICATION: 'sendNotification',
  GENERATE_WEEKLY_CFDI: 'generateWeeklyCfdi',
  MONTHLY_DRIVER_CLASSIFICATION: 'monthlyDriverClassification',
  GENERATE_MONTHLY_IDSE: 'generateMonthlyIdse',
  TRANSFER_BENEFITS_ONLY: 'transferBenefits',
  PROCESS_INCIDENT: 'processIncident',
  NOTIFY_INCIDENT_CLARIFICATION: 'notifyIncidentClarification',
  INITIATE_FORMAL_REVIEW: 'initiateFormalReview',
  NOTIFY_DRIVER_SUSPENSION: 'notifyDriverSuspension',
  PROCESS_DRIVER_DEACTIVATION: 'processDriverDeactivation',
  NOTIFY_RESCISSION_INTENT: 'notifyRescissionIntent',
};

export const initializeFirebase = async () => {
  // Ya inicializado arriba; mantenemos API por compatibilidad
  return true;
};

export const setupPushNotifications = async (): Promise<void> => {
  try {
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
      const fcmToken = await messaging().getToken();
      const user = auth().currentUser;

      if (fcmToken && user) {
        await firestore()
          .collection(COLLECTIONS.DRIVERS)
          .doc(user.uid)
          .update({
            fcmToken,
            lastTokenUpdate: firestore.FieldValue.serverTimestamp(),
          });
      }
    }
  } catch (error) {
    console.error('[Firebase] Push notification setup error:', error);
  }
};

export const setupNotificationListeners = (): (() => void) => {
  const unsubscribeOnMessage = messaging().onMessage(
    async (remoteMessage: FirebaseRemoteMessage) => {
      if (remoteMessage.data?.type === 'NEW_ORDER') {
        console.log('[Notifications] New order received:', remoteMessage.data);
      }
    }
  );

  messaging().setBackgroundMessageHandler(
    async (remoteMessage: FirebaseRemoteMessage) => {
      console.log('[Notifications] Background message:', remoteMessage.messageId);
    }
  );

  const unsubscribeOnNotificationOpened = messaging().onNotificationOpenedApp(
    (remoteMessage: FirebaseRemoteMessage) => {
      if (remoteMessage.data?.type === 'NEW_ORDER') {
        console.log('[Notifications] App opened from order notification');
      }
    }
  );

  messaging()
    .getInitialNotification()
    .then((remoteMessage: FirebaseRemoteMessage | null) => {
      if (remoteMessage) {
        console.log('[Notifications] App opened from quit state');
      }
    })
    .catch((error: Error) => {
      console.error('[Firebase] Initial notification error:', error);
    });

  return () => {
    unsubscribeOnMessage();
    unsubscribeOnNotificationOpened();
  };
};

export { firestore, auth, functions, messaging, storage };

import messaging from '@react-native-firebase/messaging';
import { store } from '../store';
import { showNewOrderModal } from '../store/slices/notificationsSlice';

class NotificationService {
  async initialize() {
    // Request permission
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('Authorization status:', authStatus);
      await this.setupListeners();
    }
  }

  async setupListeners() {
    // Foreground messages
    messaging().onMessage(async remoteMessage => {
      console.log('Foreground message:', remoteMessage);
      this.handleNewOrderNotification(remoteMessage);
    });

    // Background/Quit state messages
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('Background message:', remoteMessage);
      this.handleNewOrderNotification(remoteMessage);
    });

    // App opened from notification
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('Notification opened app:', remoteMessage);
      this.handleNewOrderNotification(remoteMessage);
    });

    // Check if app was opened from a notification (killed state)
    const initialNotification = await messaging().getInitialNotification();
    if (initialNotification) {
      console.log('Initial notification:', initialNotification);
      this.handleNewOrderNotification(initialNotification);
    }
  }

  handleNewOrderNotification(remoteMessage: any) {
    const { data } = remoteMessage;
    
    if (data?.type === 'NEW_ORDER' && data?.orderId) {
      // Show NewOrderModal with order data
      store.dispatch(showNewOrderModal({
        id: data.orderId,
        storeName: data.storeName || 'Restaurante',
        pickupAddress: data.pickupAddress || '--',
        deliveryAddress: data.deliveryAddress || '--',
        total: parseFloat(data.total || '0'),
        paymentMethod: data.paymentMethod || 'TARJETA',
        distanceKm: parseFloat(data.distanceKm || '0'),
        deliveryFee: parseFloat(data.deliveryFee || '0'),
        tip: parseFloat(data.tip || '0'),
      }));
    }
  }

  async getToken() {
    try {
      const token = await messaging().getToken();
      console.log('FCM Token:', token);
      return token;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }
}

export default new NotificationService();
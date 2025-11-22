import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { auth, firestore, COLLECTIONS } from '../config/firebase';
import { store } from '../store';
import { showNewOrderModal } from '../store/slices/notificationsSlice';
import { NewOrderNotificationPayload } from '../types/index';

class NotificationService {
  private authUnsubscribe: (() => void) | null = null;

  async initialize(): Promise<void> {
    try {
      const permission = await messaging().requestPermission({ alert: true, badge: true, sound: true });
      const enabled =
        permission === messaging.AuthorizationStatus.AUTHORIZED ||
        permission === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        console.warn('Notificaciones no autorizadas por el usuario');
        return;
      }

      await messaging().registerDeviceForRemoteMessages();
      await this.syncTokenWithUser();
      this.subscribeForegroundMessages();
      this.subscribeNotificationOpen();
      await this.checkInitialNotification();
      this.subscribeAuthTokenSync();
    } catch (e) {
      console.error('Error inicializando notificaciones:', e);
    }
  }

  private subscribeForegroundMessages() {
    messaging().onMessage(async remoteMessage => {
      console.log('Foreground message:', remoteMessage);
      this.handleNewOrderNotification(remoteMessage);
    });
  }

  private subscribeNotificationOpen() {
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('App opened from notification:', remoteMessage);
      this.handleNewOrderNotification(remoteMessage);
    });
  }

  private async checkInitialNotification() {
    const initialNotification = await messaging().getInitialNotification();
    if (initialNotification) {
      console.log('Initial notification:', initialNotification);
      this.handleNewOrderNotification(initialNotification);
    }
  }

  private subscribeAuthTokenSync() {
    if (this.authUnsubscribe) this.authUnsubscribe();
    this.authUnsubscribe = auth().onAuthStateChanged(async user => {
      if (!user) return;
      try {
        const token = await messaging().getToken();
        if (!token) return;
        await firestore()
          .collection(COLLECTIONS.DRIVERS)
          .doc(user.uid)
          .set(
            {
              fcmToken: token,
              lastTokenUpdate: firestore.FieldValue.serverTimestamp()
            },
            { merge: true }
          );
        console.log('FCM token sincronizado para usuario', user.uid);
      } catch (err) {
        console.warn('Error sincronizando token FCM:', err);
      }
    });
  }

  private async syncTokenWithUser() {
    const user = auth().currentUser;
    if (!user) return;
    try {
      const token = await messaging().getToken();
      if (!token) return;
      await firestore()
        .collection(COLLECTIONS.DRIVERS)
        .doc(user.uid)
        .set(
          {
            fcmToken: token,
            lastTokenUpdate: firestore.FieldValue.serverTimestamp()
          },
          { merge: true }
        );
    } catch (err) {
      console.warn('No se pudo sincronizar el token inicial:', err);
    }
  }

  async getToken() {
    try {
      const token = await messaging().getToken();
      console.log('FCM Token:', token);
      return token;
    } catch (error) {
      console.error('Error obteniendo token FCM:', error);
      return null;
    }
  }

  private handleNewOrderNotification(remoteMessage: FirebaseMessagingTypes.RemoteMessage | null) {
    if (!remoteMessage?.data) return;

    const { orderId, customerName, pickupAddress, dropoffAddress, total, paymentMethod, distanceKm, deliveryFee, tip } = remoteMessage.data;
    if (!orderId) return;

    const payload: NewOrderNotificationPayload = {
      id: String(orderId),
      storeName: String(customerName || 'Cliente'),
      pickupAddress: typeof pickupAddress === 'string' ? pickupAddress : JSON.stringify(pickupAddress || {}),
      deliveryAddress: typeof dropoffAddress === 'string' ? dropoffAddress : JSON.stringify(dropoffAddress || {}),
      total: Number(total) || 0,
      paymentMethod: (paymentMethod as 'CASH' | 'CARD') || 'CARD',
      distanceKm: Number(distanceKm) || 0,
      deliveryFee: Number(deliveryFee) || 0,
      tip: Number(tip) || 0,
    };

    store.dispatch(showNewOrderModal(payload));
  }
}

export default new NotificationService();
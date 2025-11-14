import messaging from '@react-native-firebase/messaging';
import { store } from '../store';
import { showNewOrderModal } from '../store/slices/notificationsSlice';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { COLLECTIONS } from '../config/firebase';
    // Request permission
    const authStatus = await messaging().requestPermission();
  private authUnsubscribe: (() => void) | null = null;

      authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    try {
      const authStatus = await messaging().requestPermission({
        alert: true, badge: true, sound: true
      });
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    const enabled =
      if (!enabled) {
        console.warn('Notificaciones no autorizadas por el usuario');
        return;
      }

      authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      console.log('Foreground message:', remoteMessage);
      this.subscribeAuthTokenSync();
    } catch (e) {
      console.error('Error inicializando notificaciones:', e);
      this.handleNewOrderNotification(remoteMessage);
    });

  private subscribeAuthTokenSync() {
    // Mantener token actualizado en Firestore cuando hay usuario
    this.authUnsubscribe = auth().onAuthStateChanged(async user => {
      if (!user) return;
      try {
        const token = await messaging().getToken();
        if (!token) return;
        await firestore()
          .collection(COLLECTIONS.DRIVERS)
          .doc(user.uid)
          .set({
            fcmToken: token,
            lastTokenUpdate: firestore.FieldValue.serverTimestamp()
          }, { merge: true });
        console.log('FCM token sincronizado para usuario', user.uid);
      } catch (err) {
        console.warn('Error sincronizando token FCM:', err);
      }
    });
  }
    if (enabled) {
    });

    // App opened from notification
    messaging().onNotificationOpenedApp(remoteMessage => {

    // Check if app was opened from a notification (killed state)
    const initialNotification = await messaging().getInitialNotification();
    if (initialNotification) {
      console.log('Initial notification:', initialNotification);
      this.handleNewOrderNotification(initialNotification);

  async getToken() {
    try {
      const token = await messaging().getToken();
      console.log('FCM Token:', token);
      return token;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    // Check killed state
  }
}

export default new NotificationService();
import React, { useEffect } from 'react';
import { auth, firestore, messaging, setupNotificationListeners, COLLECTIONS } from '../config/firebase';

// Componente global que centraliza handlers de notificaciones y registro de FCM
const NotificationHandler: React.FC = () => {
  useEffect(() => {
    // Configurar listeners de mensajes en primer/segundo plano
    const unsubSetup = setupNotificationListeners();

    // Manejar notificaciones cuando se abre desde background
    const unsubscribeOpened = messaging().onNotificationOpenedApp(remoteMessage => {
      // Aquí podrías enrutar basado en remoteMessage.data
      // p.ej., si es NEW_ORDER, ya se emite EventBus en setupNotificationListeners
      console.log('Notification opened from background:', remoteMessage?.data);
    });

    // Manejar notificación que abrió la app desde estado quitado
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('App opened by notification (quit state):', remoteMessage?.data);
        }
      })
      .catch(() => {});

    // Mantener token FCM actualizado cuando cambia el usuario
    const unsubscribeAuth = auth().onAuthStateChanged(async user => {
      try {
        if (user) {
          const token = await messaging().getToken();
          if (token) {
            await firestore()
              .collection(COLLECTIONS.DRIVERS)
              .doc(user.uid)
              .set(
                {
                  fcmToken: token,
                  lastTokenUpdate: firestore.FieldValue.serverTimestamp(),
                } as any,
                { merge: true }
              );
          }
        }
      } catch (e) {
        console.warn('FCM token update failed:', e);
      }
    });

    return () => {
      try { (unsubSetup as any)?.(); } catch {}
      try { unsubscribeOpened(); } catch {}
      try { unsubscribeAuth(); } catch {}
    };
  }, []);

  return null;
};

export default NotificationHandler;

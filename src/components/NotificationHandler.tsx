import React, { useEffect } from 'react';
import { auth, firestore, messaging, COLLECTIONS } from '../config/firebase';
import { FieldValue } from '@react-native-firebase/firestore';

// Componente global que centraliza handlers de notificaciones y registro de FCM
const NotificationHandler: React.FC = () => {
  useEffect(() => {
    // Actualizar token FCM cuando cambia el usuario
    const unsubscribeAuth = auth.onAuthStateChanged(async user => {
      try {
        if (user) {
          const token = await messaging.getToken();
          if (token) {
            const driverRef = firestore().collection(COLLECTIONS.DRIVERS).doc(user.uid);
            await driverRef.set(
              {
                fcmToken: token,
                lastTokenUpdate: FieldValue.serverTimestamp(),
              },
              { merge: true }
            );
          }
        }
      } catch (e) {
        console.warn('FCM token update failed:', e);
      }
    });

    return () => {
      try { unsubscribeAuth(); } catch {}
    };
  }, []);

  return null;
};

export default NotificationHandler;

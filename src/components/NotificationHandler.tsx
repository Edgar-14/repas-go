// Componente para manejar notificaciones push y en-app
import React, { useEffect } from 'react';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, AndroidStyle, EventType } from '@notifee/react-native';
import Toast from 'react-native-toast-message';
import { Platform, PermissionsAndroid } from 'react-native';

// Configurar canal de notificaciones para Android
const setupNotificationChannel = async () => {
  if (Platform.OS === 'android') {
    await notifee.createChannel({
      id: 'default',
      name: 'Notificaciones de pedidos',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
    });

    await notifee.createChannel({
      id: 'orders',
      name: 'Pedidos',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
    });

    await notifee.createChannel({
      id: 'emergency',
      name: 'Emergencias',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
    });
  }
};

// Solicitar permisos de notificaciones
export const requestNotificationPermissions = async () => {
  try {
    if (Platform.OS === 'android') {
      if (Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
      return true;
    } else {
      const authStatus = await messaging().requestPermission();
      return authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
             authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    }
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
};

// Mostrar notificación local
export const showLocalNotification = async (
  title: string,
  body: string,
  type: 'order' | 'emergency' | 'default' = 'default',
  data?: any
) => {
  try {
    await notifee.displayNotification({
      title,
      body,
      android: {
        channelId: type === 'emergency' ? 'emergency' : type === 'order' ? 'orders' : 'default',
        importance: AndroidImportance.HIGH,
        pressAction: {
          id: 'default',
        },
        sound: 'default',
        vibrationPattern: [300, 500],
        smallIcon: 'ic_launcher',
        color: type === 'emergency' ? '#F44336' : '#667eea',
        style: {
          type: AndroidStyle.BIGTEXT,
          text: body,
        },
      },
      ios: {
        sound: 'default',
        foregroundPresentationOptions: {
          alert: true,
          badge: true,
          sound: true,
        },
      },
      data,
    });
  } catch (error) {
    console.error('Error showing notification:', error);
  }
};

// Mostrar Toast mensaje
export const showToast = (
  type: 'success' | 'error' | 'info' | 'warning',
  title: string,
  message: string
) => {
  Toast.show({
    type,
    text1: title,
    text2: message,
    position: 'top',
    visibilityTime: 4000,
    autoHide: true,
    topOffset: 50,
  });
};

const NotificationHandler: React.FC = () => {
  useEffect(() => {
    setupNotificationChannel();
    requestNotificationPermissions();

    // Manejar notificaciones en primer plano
    const unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
      console.log('Foreground notification:', remoteMessage);

      const { notification, data } = remoteMessage;

      if (notification) {
        // Mostrar notificación local
        await showLocalNotification(
          notification.title || 'BeFast GO',
          notification.body || '',
          data?.type as any || 'default',
          data
        );

        // Mostrar toast para notificaciones de pedidos
        if (data?.type === 'NEW_ORDER') {
          showToast(
            'info',
            '🚀 Nuevo Pedido Disponible',
            notification.body || 'Tienes un nuevo pedido'
          );
        } else if (data?.type === 'ORDER_CANCELLED') {
          showToast(
            'warning',
            '⚠️ Pedido Cancelado',
            notification.body || 'Un pedido ha sido cancelado'
          );
        } else if (data?.type === 'EMERGENCY') {
          showToast(
            'error',
            '🚨 Alerta de Emergencia',
            notification.body || 'Alerta de emergencia'
          );
        }
      }
    });

    // Manejar notificaciones en segundo plano
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('Background notification:', remoteMessage);

      const { notification, data } = remoteMessage;

      if (notification) {
        await showLocalNotification(
          notification.title || 'BeFast GO',
          notification.body || '',
          data?.type as any || 'default',
          data
        );
      }
    });

    // Manejar eventos de notificaciones (cuando el usuario toca)
    const unsubscribeNotifee = notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS) {
        console.log('User pressed notification:', detail.notification);
        
        // Navegar según el tipo de notificación
        const data = detail.notification?.data;
        if (data?.orderId) {
          // Aquí puedes navegar a la pantalla del pedido
          console.log('Navigate to order:', data.orderId);
        }
      }
    });

    return () => {
      unsubscribeForeground();
      unsubscribeNotifee();
    };
  }, []);

  return null; // Este componente no renderiza nada
};

export default NotificationHandler;

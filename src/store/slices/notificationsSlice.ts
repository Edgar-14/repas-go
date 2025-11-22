import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { firestore, messaging, COLLECTIONS } from '../../config/firebase';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'ORDER' | 'PAYMENT' | 'SYSTEM' | 'PROMOTION';
  read: boolean;
  createdAt: any;
  data?: any;
}

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  fcmToken: string | null;
  newOrderToShow: any | null; // Estado para el modal de nuevo pedido
}

const initialState: NotificationsState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  fcmToken: null,
  newOrderToShow: null, // Valor inicial
};

export const initializeFCM = createAsyncThunk<string, string>(
  'notifications/initializeFCM',
  async (driverId: string) => {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                     authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        const token = await messaging().getToken();
        
        // Guardar token en Firestore
        await firestore()
          .collection(COLLECTIONS.DRIVERS)
          .doc(driverId)
          .update({
            fcmToken: token,
            lastTokenUpdate: firestore.FieldValue.serverTimestamp(),
          });

        return token;
      }
      throw new Error('Permission not granted');
    } catch (error: any) {
      throw new Error(error.message || 'FCM initialization failed');
    }
  }
);

export const loadNotifications = createAsyncThunk<Notification[], string>(
  'notifications/loadNotifications',
  async (driverId: string) => {
    try {
      const snapshot = await firestore()
        .collection(COLLECTIONS.NOTIFICATIONS || 'notifications')
        .where('userId', '==', driverId)
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
    } catch (error: any) {
      throw new Error(error.message || 'Failed to load notifications');
    }
  }
);

export const markAsRead = createAsyncThunk<string, string>(
  'notifications/markAsRead',
  async (notificationId: string) => {
    try {
      await firestore()
        .collection(COLLECTIONS.NOTIFICATIONS || 'notifications')
        .doc(notificationId)
        .update({ read: true });

      return notificationId;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to mark as read');
    }
  }
);

export const markAllAsRead = createAsyncThunk<void, string>(
  'notifications/markAllAsRead',
  async (driverId: string) => {
    try {
      const batch = firestore().batch();
      const snapshot = await firestore()
        .collection(COLLECTIONS.NOTIFICATIONS || 'notifications')
        .where('userId', '==', driverId)
        .where('read', '==', false)
        .get();

      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { read: true });
      });

      await batch.commit();
    } catch (error: any) {
      throw new Error(error.message || 'Failed to mark all as read');
    }
  }
);

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.unshift(action.payload);
      if (!action.payload.read) {
        state.unreadCount += 1;
      }
    },
    updateUnreadCount: (state) => {
      state.unreadCount = state.notifications.filter(n => !n.read).length;
    },
    showNewOrderModal: (state, action: PayloadAction<any>) => {
      // Evitar mostrar un nuevo modal si ya hay uno activo
      if (!state.newOrderToShow) {
        state.newOrderToShow = action.payload;
      }
    },
    hideNewOrderModal: (state) => {
      state.newOrderToShow = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeFCM.fulfilled, (state, action: PayloadAction<string>) => {
        state.fcmToken = action.payload;
      })
      .addCase(initializeFCM.rejected, (state, action) => {
        state.error = action.error.message || 'FCM initialization failed';
      })
      .addCase(loadNotifications.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadNotifications.fulfilled, (state, action: PayloadAction<Notification[]>) => {
        state.isLoading = false;
        state.notifications = action.payload;
        state.unreadCount = action.payload.filter(n => !n.read).length;
      })
      .addCase(loadNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to load notifications';
      })
      .addCase(markAsRead.fulfilled, (state, action: PayloadAction<string>) => {
        const notification = state.notifications.find(n => n.id === action.payload);
        if (notification && !notification.read) {
          notification.read = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.notifications.forEach(n => n.read = true);
        state.unreadCount = 0;
      });
  },
});

export const { 
  clearError, 
  addNotification, 
  updateUnreadCount,
  showNewOrderModal,
  hideNewOrderModal
} = notificationsSlice.actions;
export default notificationsSlice.reducer;
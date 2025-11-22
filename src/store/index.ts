// Store principal de Redux para BeFast GO
import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import driverSlice from './slices/driverSlice';
import ordersSlice from './slices/ordersSlice';
import walletSlice from './slices/walletSlice';
import notificationsSlice from './slices/notificationsSlice';
import { isPlain } from '@reduxjs/toolkit';

const isSerializable = (value: any) => {
  if (value == null) return true;
  const t = typeof value;
  if (t === 'string' || t === 'number' || t === 'boolean') return true;
  if (Array.isArray(value)) return value.every(isSerializable);
  if (t === 'object') {
    // Considera Firestore Timestamp como serializable para evitar RedBox en dev
    if (
      Object.prototype.hasOwnProperty.call(value, 'seconds') &&
      Object.prototype.hasOwnProperty.call(value, 'nanoseconds')
    ) {
      return true;
    }
    return isPlain(value);
  }
  return true;
};

export const store = configureStore({
  reducer: {
    auth: authSlice,
    driver: driverSlice,
    orders: ordersSlice,
    wallet: walletSlice,
    notifications: notificationsSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
        ignoredPaths: [
          'auth.driver',
          'driver.currentLocation',
          'orders.activeOrder',
          'orders.availableOrders',
          'orders.assignedOrders',
        ],
        isSerializable,
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
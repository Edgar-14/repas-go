// Store principal de Redux para BeFast GO
import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import driverSlice from './slices/driverSlice';
import ordersSlice from './slices/ordersSlice';
import walletSlice from './slices/walletSlice';
import notificationsSlice from './slices/notificationsSlice';

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
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
// src/store/slices/notificationsSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
// CORRECCIÓN: Importar el tipo de payload
import { NewOrderNotificationPayload } from '../../types/index';

interface NotificationsState {
// CORRECCIÓN: Usar el tipo específico en lugar de 'any'
newOrderToShow: NewOrderNotificationPayload | null;
globalMessage: string | null;
}

const initialState: NotificationsState = {
newOrderToShow: null,
globalMessage: null,
};

const notificationsSlice = createSlice({
name: 'notifications',
initialState,
reducers: {
// CORRECCIÓN: Tipar el payload
showNewOrderModal: (state, action: PayloadAction<NewOrderNotificationPayload>) => {
      state.newOrderToShow = action.payload;
    },
    hideNewOrderModal: (state) => {
      state.newOrderToShow = null;
    },
    setGlobalMessage: (state, action: PayloadAction<string | null>) => {
      state.globalMessage = action.payload;
    },
  },
});

export const { showNewOrderModal, hideNewOrderModal, setGlobalMessage } = notificationsSlice.actions;
export default notificationsSlice.reducer;
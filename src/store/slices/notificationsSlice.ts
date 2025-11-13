import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface NotificationsState {
  newOrderToShow: any | null;
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
    showNewOrderModal: (state, action: PayloadAction<any>) => {
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
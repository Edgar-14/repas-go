import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { firestore, functions, COLLECTIONS, CLOUD_FUNCTIONS } from '../../config/firebase';
import { Order, OrderStatus } from '../../types/index'; 
import Toast from 'react-native-toast-message';
import { Vibration } from 'react-native';

interface OrdersState {
  availableOrders: Order[];
  assignedOrders: Order[];
  activeOrder: Order | null;
  orderHistory: Order[];
  isLoading: boolean;
  error: string | null;
}

const initialState: OrdersState = {
  availableOrders: [],
  assignedOrders: [],
  activeOrder: null,
  orderHistory: [],
  isLoading: false,
  error: null,
};

export const fetchActiveOrder = createAsyncThunk<Order | null, string>(
  'orders/fetchActiveOrder',
  async (driverId: string) => {
    try {
      const snapshot = await firestore()
        .collection(COLLECTIONS.ORDERS)
        .where('driverId', '==', driverId)
        .where('status', 'in', [
          'ASSIGNED',
          'STARTED',
          'PICKED_UP',
          'IN_TRANSIT'
        ])
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Order;
    } catch (error: any) {
      console.error('[Orders] Error fetching active order:', error);
      throw new Error(error.message || 'Error fetching active order');
    }
  }
);


export const loadOrders = createAsyncThunk<
  { availableOrders: Order[]; assignedOrders: Order[] },
  string
>(
  'orders/loadOrders',
  async (driverId: string) => {
    try {
      // Use optimized cloud function to fetch orders
      const callable = functions().httpsCallable(CLOUD_FUNCTIONS.GET_DRIVER_ORDERS);
      const result = await callable({ driverId });
      const data = result.data as any;

      if (!data.success) {
        throw new Error('Failed to fetch orders');
      }

      console.log('[Orders] Loaded orders - Available:', data.counts.available, 'Assigned:', data.counts.assigned);

      return {
        availableOrders: data.availableOrders || [],
        assignedOrders: data.assignedOrders || []
      };
    } catch (error: any) {
      console.error('[Orders] Error loading orders:', error);
      throw new Error(error.message || 'Error loading orders');
    }
  }
);

export const acceptOrder = createAsyncThunk<
  { success: boolean; order: Order },
  { orderId: string; driverId: string },
  { rejectValue: string }
>(
  'orders/acceptOrder',
  async ({ orderId, driverId }, { rejectWithValue }) => {
    try {
      const result = await functions().httpsCallable(CLOUD_FUNCTIONS.VALIDATE_ORDER_ASSIGNMENT)({
        orderId,
        driverId,
        action: 'ACCEPT',
      });

      const data = result.data as any;
      if (data.approved) {
        const orderDoc = await firestore()
          .collection(COLLECTIONS.ORDERS)
          .doc(orderId)
          .get();

        return {
          success: true,
          order: { id: orderDoc.id, ...orderDoc.data() } as Order,
        };
      }
      return rejectWithValue(data.reason || 'Order assignment failed');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Error accepting order');
    }
  }
);

export const updateOrderStatus = createAsyncThunk<
  { orderId: string; status: OrderStatus },
  { orderId: string; status: OrderStatus; driverId: string; reason?: string },
  { rejectValue: string }
>(
  'orders/updateOrderStatus',
  async ({ orderId, status, driverId, reason }, { rejectWithValue }) => {
    try {
      const result = await functions().httpsCallable(CLOUD_FUNCTIONS.HANDLE_ORDER_WORKFLOW)({
        orderId,
        driverId,
        newStatus: status,
        timestamp: new Date().toISOString(),
        ...(reason ? { reason } : {}),
      });

      const data = result.data as any;
      if (data.success) {
        return { orderId, status };
      }
      return rejectWithValue(data.reason || 'Error updating order status');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Error updating order status');
    }
  }
);

export const completeOrder = createAsyncThunk<
  { success: boolean; orderId: string; earnings: number },
  {
    orderId: string;
    driverId: string;
    completionData: {
      photoUrl: string;
      signature?: string;
      customerPin?: string;
      cashReceived?: number;
    };
  },
  { rejectValue: string }
>(
  'orders/completeOrder',
  async ({ orderId, driverId, completionData }, { rejectWithValue }) => {
    try {
      const result = await functions().httpsCallable(CLOUD_FUNCTIONS.PROCESS_ORDER_COMPLETION)({
        orderId,
        driverId,
        photoUrl: completionData.photoUrl,
        signature: completionData.signature,
        customerPin: completionData.customerPin,
        cashReceived: completionData.cashReceived,
      });

      const data = result.data as any;
      if (data.success) {
        return {
          success: true,
          orderId,
          earnings: data.earnings || 0,
        };
      }
      return rejectWithValue(data.reason || 'Error completing order');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Error completing order');
    }
  }
);

export const fetchOrderHistory = createAsyncThunk<Order[], string>(
  'orders/fetchOrderHistory',
  async (driverId: string) => {
    try {
      const snapshot = await firestore()
        .collection(COLLECTIONS.ORDERS)
        .where('driverId', '==', driverId)
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Order[];
    } catch (error: any) {
      throw new Error(error.message || 'Error fetching order history');
    }
  }
);

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setActiveOrder: (state, action: PayloadAction<Order | null>) => {
      state.activeOrder = action.payload;
    },
    updateAvailableOrders: (state, action: PayloadAction<Order[]>) => {
      state.availableOrders = action.payload;
    },
    removeOrderFromAvailable: (state, action: PayloadAction<string>) => {
      state.availableOrders = state.availableOrders.filter(
        order => order.id !== action.payload
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchActiveOrder.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchActiveOrder.fulfilled, (state, action: PayloadAction<Order | null>) => {
        state.isLoading = false;
        state.activeOrder = action.payload;
      })
      .addCase(fetchActiveOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Error fetching active order';
      })
      .addCase(loadOrders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadOrders.fulfilled, (state, action: PayloadAction<{ availableOrders: Order[]; assignedOrders: Order[] }>) => {
        state.isLoading = false;
        state.availableOrders = action.payload.availableOrders;
        state.assignedOrders = action.payload.assignedOrders;
      })
      .addCase(loadOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Error loading orders';
      })
      .addCase(acceptOrder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(acceptOrder.fulfilled, (state, action: PayloadAction<{ success: boolean; order: Order }>) => {
        state.isLoading = false;
        if (action.payload.success) {
          state.activeOrder = action.payload.order;
          state.availableOrders = state.availableOrders.filter((o: Order) => o.id !== action.payload.order.id);
        }
      })
      .addCase(acceptOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Error accepting order';
      })
      .addCase(updateOrderStatus.fulfilled, (state, action: PayloadAction<{ orderId: string; status: OrderStatus }>) => {
        if (state.activeOrder && state.activeOrder.id === action.payload.orderId) {
          state.activeOrder.status = action.payload.status;
          Toast.show({
            type: 'success',
            text1: `Pedido ${action.payload.status === OrderStatus.PICKED_UP ? 'recogido' : 'en destino'}`,
            text2: '¡Excelente trabajo!',
          });
          Vibration.vibrate(300);
        }
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.error = action.payload || 'Error updating order status';
        Toast.show({
          type: 'error',
          text1: 'Error al actualizar estado',
          text2: action.payload || 'Intenta de nuevo.',
        });
        Vibration.vibrate([0, 500, 200, 500]);
      })
      .addCase(completeOrder.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(completeOrder.fulfilled, (state, action: PayloadAction<{ success: boolean; orderId: string; earnings: number }>) => {
        state.isLoading = false;
        if (action.payload.success && state.activeOrder) {
          state.orderHistory.unshift({
            ...state.activeOrder,
            status: OrderStatus.COMPLETED,
          });
          state.activeOrder = null;
        }
      })
      .addCase(completeOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Error completing order';
      })
      .addCase(fetchOrderHistory.fulfilled, (state, action: PayloadAction<Order[]>) => {
        state.orderHistory = action.payload;
      });
  },
});

export const { 
  clearError, 
  setActiveOrder, 
  updateAvailableOrders, 
  removeOrderFromAvailable 
} = ordersSlice.actions;


export default ordersSlice.reducer;
// Slice de pedidos para BeFast GO
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { firestore, functions, COLLECTIONS, CLOUD_FUNCTIONS } from '../../config/firebase';
import { Order, OrderStatus, ValidationResult } from '../../types';

interface OrdersState {
  availableOrders: Order[];
  activeOrder: Order | null;
  orderHistory: Order[];
  isLoading: boolean;
  error: string | null;
}

const initialState: OrdersState = {
  availableOrders: [],
  activeOrder: null,
  orderHistory: [],
  isLoading: false,
  error: null,
};

// Thunk para escuchar pedidos disponibles
export const listenForAvailableOrders = createAsyncThunk(
  'orders/listenForAvailableOrders',
  async (driverId: string) => {
    return new Promise((resolve) => {
      const unsubscribe = firestore()
        .collection(COLLECTIONS.ORDERS)
        .where('status', '==', 'SEARCHING')
        .where('assignedDriverId', '==', null)
        .onSnapshot(snapshot => {
          const availableOrders = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Order[];
          
          resolve(availableOrders as any);
        });
      
      // Guardar unsubscribe para limpieza posterior
      return unsubscribe;
    });
  }
);

// Thunk para aceptar pedido
export const acceptOrder = createAsyncThunk(
  'orders/acceptOrder',
  async ({ orderId, driverId }: { orderId: string; driverId: string }) => {
    try {
      // Llamar a la Cloud Function existente del ecosistema
      const result = await functions().httpsCallable(CLOUD_FUNCTIONS.VALIDATE_ORDER_ASSIGNMENT)({
        orderId,
        driverId,
        action: 'ACCEPT'
      });
      
      if ((result.data as any).approved) {
        // Obtener datos actualizados del pedido
        const orderDoc = await firestore()
          .collection(COLLECTIONS.ORDERS)
          .doc(orderId)
          .get();
        
        return {
          success: true,
          order: { id: orderDoc.id, ...orderDoc.data() } as Order
        };
      } else {
        throw new Error((result.data as any).reason || 'Pedido no pudo ser asignado');
      }
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
);

// Thunk para actualizar estado del pedido
export const updateOrderStatus = createAsyncThunk(
  'orders/updateOrderStatus',
  async ({ orderId, status, driverId }: { orderId: string; status: OrderStatus; driverId: string }) => {
    try {
      const result = await functions().httpsCallable(CLOUD_FUNCTIONS.HANDLE_ORDER_WORKFLOW)({
        orderId,
        driverId,
        newStatus: status,
        timestamp: new Date().toISOString()
      });
      
      if ((result.data as any).success) {
        return { orderId, status };
      } else {
        throw new Error((result.data as any).reason || 'Error al actualizar estado del pedido');
      }
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
);

// Thunk para completar pedido
export const completeOrder = createAsyncThunk(
  'orders/completeOrder',
  async ({ 
    orderId, 
    driverId, 
    completionData 
  }: { 
    orderId: string; 
    driverId: string; 
    completionData: {
      photoUrl: string;
      signature?: string;
      customerPin?: string;
      cashReceived?: number;
    }
  }) => {
    try {
      // Llamar a la Cloud Function existente del ecosistema
      const result = await functions().httpsCallable(CLOUD_FUNCTIONS.PROCESS_ORDER_COMPLETION)({
        orderId,
        driverId,
        photoUrl: completionData.photoUrl,
        signature: completionData.signature,
        customerPin: completionData.customerPin,
        cashReceived: completionData.cashReceived
      });
      
      if ((result.data as any).success) {
        return {
          success: true,
          orderId,
          earnings: (result.data as any).earnings
        };
      } else {
        throw new Error((result.data as any).reason || 'Error al completar pedido');
      }
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
);

// Thunk para obtener historial de pedidos
export const fetchOrderHistory = createAsyncThunk(
  'orders/fetchOrderHistory',
  async (driverId: string) => {
    try {
      const snapshot = await firestore()
        .collection(COLLECTIONS.ORDERS)
        .where('driverId', '==', driverId)
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();
      
      const orders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      
      return orders;
    } catch (error: any) {
      throw new Error(error.message);
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
      // Listen for available orders
      .addCase(listenForAvailableOrders.fulfilled, (state, action) => {
        state.availableOrders = action.payload as any;
      })
      // Accept order
      .addCase(acceptOrder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(acceptOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.success) {
          state.activeOrder = action.payload.order;
          // Remover de pedidos disponibles
          state.availableOrders = state.availableOrders.filter(
            order => order.id !== action.payload.order.id
          );
        }
      })
      .addCase(acceptOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Error al aceptar pedido';
      })
      // Update order status
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        if (state.activeOrder && state.activeOrder.id === action.payload.orderId) {
          state.activeOrder.status = action.payload.status;
        }
      })
      // Complete order
      .addCase(completeOrder.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(completeOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.success) {
          // Mover pedido activo al historial
          if (state.activeOrder) {
            state.orderHistory.unshift({
              ...state.activeOrder,
              status: OrderStatus.COMPLETED
            });
          }
          state.activeOrder = null;
        }
      })
      .addCase(completeOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Error al completar pedido';
      })
      // Fetch order history
      .addCase(fetchOrderHistory.fulfilled, (state, action) => {
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
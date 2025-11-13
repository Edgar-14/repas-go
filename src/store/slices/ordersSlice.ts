// Slice de pedidos para BeFast GO
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { firestore, functions, COLLECTIONS, CLOUD_FUNCTIONS } from '../../config/firebase';
// **CORRECCIÓN: Eliminado 'ValidationResult' que no existe en src/types.ts**
import { Order, OrderStatus } from '../../types'; 

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

// Thunk para buscar un pedido activo al iniciar la app
export const fetchActiveOrder = createAsyncThunk(
  'orders/fetchActiveOrder',
  async (driverId: string) => {
    try {
      // Buscar pedidos que este driverId tenga y que no estén completados
      const snapshot = await firestore()
        .collection(COLLECTIONS.ORDERS)
        .where('driverId', '==', driverId)
        .where('status', 'in', [
          OrderStatus.ACCEPTED,
          OrderStatus.PICKED_UP,
          OrderStatus.ARRIVED,
          OrderStatus.DELIVERED
        ])
        .limit(1)
        .get();
      
      if (snapshot.empty) {
        return null; // No hay pedido activo
      }
      
      const doc = snapshot.docs[0];
      const order = { id: doc.id, ...doc.data() } as Order;
      return order;

    } catch (error: any) {
      console.error("Error fetching active order:", error);
      throw new Error(error.message);
    }
  }
);


// Thunk para cargar pedidos usando Cloud Function
export const loadOrders = createAsyncThunk(
  'orders/loadOrders',
  async (_, { getState }) => {
    const { auth } = getState() as { auth: { user?: { uid: string } } };
    const uid = auth.user?.uid;
    
    if (!uid) {
      throw new Error('Usuario no autenticado');
    }
    
    const { fetchDriverOrders } = await import('../../services/ordersService');
    return await fetchDriverOrders(uid);
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
      // Manejar el pedido activo cargado
      .addCase(fetchActiveOrder.fulfilled, (state, action) => {
        state.activeOrder = action.payload || null;
      })
      .addCase(fetchActiveOrder.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchActiveOrder.rejected, (state) => {
        state.isLoading = false;
      })

      // Load orders
      .addCase(loadOrders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.availableOrders = action.payload.availableOrders;
        state.assignedOrders = action.payload.assignedOrders;
      })
      .addCase(loadOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Error cargando pedidos';
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

export { loadOrders };

export default ordersSlice.reducer;
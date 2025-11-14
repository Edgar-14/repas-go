// Slice de billetera para BeFast GO
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { firestore, functions, COLLECTIONS, CLOUD_FUNCTIONS } from '../../config/firebase';
import { WalletTransaction, TransactionType } from '../../types';

interface WalletState {
  balance: number;
  pendingDebts: number;
  creditLimit: number;
  transactions: WalletTransaction[];
  isLoading: boolean;
  error: string | null;
}

const initialState: WalletState = {
  balance: 0,
  pendingDebts: 0,
  creditLimit: 300, // $300 MXN por defecto
  transactions: [],
  isLoading: false,
  error: null,
};

// Thunk para escuchar saldo en tiempo real
export const listenToWalletBalance = createAsyncThunk(
  'wallet/listenToWalletBalance',
  async (driverId: string) => {
    return new Promise((resolve) => {
      const unsubscribe = firestore()
        .collection(COLLECTIONS.DRIVERS)
        .doc(driverId)
        .onSnapshot(doc => {
          const data = doc.data();
          const walletData = {
            balance: data?.wallet?.balance || 0,
            pendingDebts: data?.wallet?.pendingDebts || 0,
            creditLimit: data?.wallet?.creditLimit || 300
          };
          
          resolve(walletData as any);
        });
      
      return unsubscribe;
    });
  }
);

// Thunk para obtener historial de transacciones
export const fetchTransactionHistory = createAsyncThunk(
  'wallet/fetchTransactionHistory',
  async (driverId: string) => {
    try {
      const snapshot = await firestore()
        .collection(COLLECTIONS.WALLET_TRANSACTIONS)
        .where('driverId', '==', driverId)
        .orderBy('timestamp', 'desc')
        .limit(50)
        .get();
      
      const transactions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as WalletTransaction[];
      
      return transactions;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
);

// Thunk para procesar retiro
export const processWithdrawal = createAsyncThunk(
  'wallet/processWithdrawal',
  async ({ 
    driverId, 
    amount, 
    method 
  }: { 
    driverId: string; 
    amount: number; 
    method: 'bank_transfer' | 'card_deposit' 
  }) => {
    try {
      const result = await functions().httpsCallable(CLOUD_FUNCTIONS.processPayment)({
        operation: 'WITHDRAWAL',
        driverId,
        amount,
        method,
        timestamp: new Date().toISOString()
      });
      
      if ((result.data as any).success) {
        return {
          success: true,
          transactionId: (result.data as any).transactionId,
          newBalance: (result.data as any).newBalance
        };
      } else {
        throw new Error((result.data as any).reason || 'Error al procesar retiro');
      }
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
);

// Thunk para pagar deuda
export const payDebt = createAsyncThunk(
  'wallet/payDebt',
  async ({ 
    driverId, 
    amount, 
    paymentMethod 
  }: { 
    driverId: string; 
    amount: number; 
    paymentMethod: 'bank_transfer' | 'cash_deposit' | 'oxxo' 
  }) => {
    try {
      const result = await functions().httpsCallable(CLOUD_FUNCTIONS.processPayment)({
        operation: 'DEBT_PAYMENT',
        driverId,
        amount,
        paymentMethod,
        timestamp: new Date().toISOString()
      });
      
      if ((result.data as any).success) {
        return {
          success: true,
          receiptNumber: (result.data as any).receiptNumber,
          newDebtAmount: (result.data as any).newDebtAmount
        };
      } else {
        throw new Error((result.data as any).reason || 'Error al procesar pago de deuda');
      }
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
);

// Función para calcular si puede aceptar pedidos en efectivo
export const canAcceptCashOrders = (pendingDebts: number, creditLimit: number): boolean => {
  return pendingDebts < creditLimit;
};

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateWalletData: (state, action: PayloadAction<{
      balance?: number;
      pendingDebts?: number;
      creditLimit?: number;
    }>) => {
      if (action.payload.balance !== undefined) {
        state.balance = action.payload.balance;
      }
      if (action.payload.pendingDebts !== undefined) {
        state.pendingDebts = action.payload.pendingDebts;
      }
      if (action.payload.creditLimit !== undefined) {
        state.creditLimit = action.payload.creditLimit;
      }
    },
    addTransaction: (state, action: PayloadAction<WalletTransaction>) => {
      state.transactions.unshift(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // Listen to wallet balance
      .addCase(listenToWalletBalance.fulfilled, (state, action: any) => {
        state.balance = action.payload.balance;
        state.pendingDebts = action.payload.pendingDebts;
        state.creditLimit = action.payload.creditLimit;
      })
      // Fetch transaction history
      .addCase(fetchTransactionHistory.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchTransactionHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.transactions = action.payload;
      })
      .addCase(fetchTransactionHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Error al cargar transacciones';
      })
      // Process withdrawal
      .addCase(processWithdrawal.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(processWithdrawal.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.success) {
          state.balance = action.payload.newBalance;
        }
      })
      .addCase(processWithdrawal.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Error al procesar retiro';
      })
      // Pay debt
      .addCase(payDebt.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(payDebt.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.success) {
          state.pendingDebts = action.payload.newDebtAmount;
        }
      })
      .addCase(payDebt.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Error al procesar pago';
      });
  },
});

export const { clearError, updateWalletData, addTransaction } = walletSlice.actions;
export default walletSlice.reducer;
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { firestore, functions, COLLECTIONS, CLOUD_FUNCTIONS } from '../../config/firebase';
import type { WalletTransaction } from '../../types/index';

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

export const listenToWalletBalance = createAsyncThunk<
  { balance: number; pendingDebts: number; creditLimit: number },
  string
>(
  'wallet/listenToWalletBalance',
  async (driverId: string) => {
    return new Promise<{ balance: number; pendingDebts: number; creditLimit: number }>((resolve) => {
      firestore()
        .collection(COLLECTIONS.DRIVERS)
        .doc(driverId)
        .onSnapshot((doc) => {
          const data = doc.data() as any;
          resolve({
            balance: data?.wallet?.balance || 0,
            pendingDebts: data?.wallet?.pendingDebts || 0,
            creditLimit: data?.wallet?.creditLimit || 300,
          });
        });
    });
  }
);

export const fetchTransactionHistory = createAsyncThunk<WalletTransaction[], string, { rejectValue: string }>(
  'wallet/fetchTransactionHistory',
  async (driverId: string, { rejectWithValue }) => {
    try {
      const snapshot = await firestore()
        .collection(COLLECTIONS.WALLET_TRANSACTIONS)
        .where('driverId', '==', driverId)
        .orderBy('timestamp', 'desc')
        .limit(50)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as WalletTransaction[];
    } catch (error: any) {
      return rejectWithValue(error.message || 'Error fetching transactions');
    }
  }
);

export const requestWithdrawal = createAsyncThunk<
  { success: boolean; transactionId: string; newBalance: number },
  { driverId: string; amount: number; method?: 'bank_transfer' | 'card_deposit' },
  { rejectValue: string }
>(
  'wallet/requestWithdrawal',
  async ({ driverId, amount, method = 'bank_transfer' }, { rejectWithValue }) => {
    try {
      const result = await functions().httpsCallable(CLOUD_FUNCTIONS.processPayment)({
        operation: 'WITHDRAWAL',
        driverId,
        amount,
        method,
        timestamp: new Date().toISOString(),
      });

      const data = result.data as any;
      if (data.success) {
        return {
          success: true,
          transactionId: data.transactionId,
          newBalance: data.newBalance,
        };
      }
      return rejectWithValue(data.reason || 'Withdrawal failed');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Error processing withdrawal');
    }
  }
);

export const payDebt = createAsyncThunk<
  { success: boolean; receiptNumber: string; newDebtAmount: number },
  { driverId: string; amount: number; paymentMethod: 'bank_transfer' | 'cash_deposit' | 'oxxo' },
  { rejectValue: string }
>(
  'wallet/payDebt',
  async ({ driverId, amount, paymentMethod }, { rejectWithValue }) => {
    try {
      const result = await functions().httpsCallable(CLOUD_FUNCTIONS.processPayment)({
        operation: 'DEBT_PAYMENT',
        driverId,
        amount,
        paymentMethod,
        timestamp: new Date().toISOString(),
      });

      const data = result.data as any;
      if (data.success) {
        return {
          success: true,
          receiptNumber: data.receiptNumber,
          newDebtAmount: data.newDebtAmount,
        };
      }
      return rejectWithValue(data.reason || 'Debt payment failed');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Error processing debt payment');
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
      .addCase(listenToWalletBalance.fulfilled, (state, action: PayloadAction<{ balance: number; pendingDebts: number; creditLimit: number }>) => {
        state.balance = action.payload.balance;
        state.pendingDebts = action.payload.pendingDebts;
        state.creditLimit = action.payload.creditLimit;
      })
      .addCase(fetchTransactionHistory.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchTransactionHistory.fulfilled, (state, action: PayloadAction<WalletTransaction[]>) => {
        state.isLoading = false;
        state.transactions = action.payload;
      })
      .addCase(fetchTransactionHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Error fetching transactions';
      })
      .addCase(requestWithdrawal.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(requestWithdrawal.fulfilled, (state, action: PayloadAction<{ success: boolean; transactionId: string; newBalance: number }>) => {
        state.isLoading = false;
        if (action.payload.success) {
          state.balance = action.payload.newBalance;
        }
      })
      .addCase(requestWithdrawal.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Error processing withdrawal';
      })
      .addCase(payDebt.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(payDebt.fulfilled, (state, action: PayloadAction<{ success: boolean; receiptNumber: string; newDebtAmount: number }>) => {
        state.isLoading = false;
        if (action.payload.success) {
          state.pendingDebts = action.payload.newDebtAmount;
        }
      })
      .addCase(payDebt.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Error processing debt payment';
      });
  },
});

export const { clearError, updateWalletData, addTransaction } = walletSlice.actions;
export default walletSlice.reducer;
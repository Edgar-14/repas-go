import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { firestore, COLLECTIONS } from '../../config/firebase';

interface DriverState {
  isOnline: boolean;
  status: 'ACTIVE' | 'BUSY' | 'OFFLINE' | 'BREAK';
  currentLocation: {
    latitude: number;
    longitude: number;
  } | null;
  stats: {
    totalOrders: number;
    completedOrders: number;
    rating: number;
    totalEarnings: number;
  };
  kpis: {
    acceptanceRate: number;
    completionRate: number;
    onTimeDeliveryRate: number;
    averageDeliveryTime: number;
  };
  isLoading: boolean;
  error: string | null;
}

const initialState: DriverState = {
  isOnline: false,
  status: 'OFFLINE',
  currentLocation: null,
  stats: {
    totalOrders: 0,
    completedOrders: 0,
    rating: 0,
    totalEarnings: 0,
  },
  kpis: {
    acceptanceRate: 0,
    completionRate: 0,
    onTimeDeliveryRate: 0,
    averageDeliveryTime: 0,
  },
  isLoading: false,
  error: null,
};

export const updateDriverStatus = createAsyncThunk<
  { status: 'ACTIVE' | 'BUSY' | 'OFFLINE' | 'BREAK'; isOnline: boolean },
  { driverId: string; status: 'ACTIVE' | 'BUSY' | 'OFFLINE' | 'BREAK'; isOnline: boolean },
  { rejectValue: string }
>(
  'driver/updateDriverStatus',
  async ({ driverId, status, isOnline }, { rejectWithValue }) => {
    try {
      await firestore()
        .collection(COLLECTIONS.DRIVERS)
        .doc(driverId)
        .update({
          'operational.status': status,
          'operational.isOnline': isOnline,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });

      return { status, isOnline };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Error updating driver status');
    }
  }
);

export const updateDriverLocation = createAsyncThunk<
  { latitude: number; longitude: number },
  { driverId: string; latitude: number; longitude: number },
  { rejectValue: string }
>(
  'driver/updateDriverLocation',
  async ({ driverId, latitude, longitude }, { rejectWithValue }) => {
    try {
      await firestore()
        .collection(COLLECTIONS.DRIVERS)
        .doc(driverId)
        .update({
          currentLocation: {
            latitude,
            longitude,
            updatedAt: firestore.FieldValue.serverTimestamp(),
          },
        });

      return { latitude, longitude };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Error updating location');
    }
  }
);

export const fetchDriverStats = createAsyncThunk<
  {
    stats: { totalOrders: number; completedOrders: number; rating: number; totalEarnings: number };
    kpis: { acceptanceRate: number; completionRate: number; onTimeDeliveryRate: number; averageDeliveryTime: number };
  },
  string,
  { rejectValue: string }
>(
  'driver/fetchDriverStats',
  async (driverId: string, { rejectWithValue }) => {
    try {
      const driverDoc = await firestore()
        .collection(COLLECTIONS.DRIVERS)
        .doc(driverId)
        .get();

      const data = driverDoc.data() as any;

      return {
        stats: {
          totalOrders: data?.kpis?.totalOrders || 0,
          completedOrders: data?.kpis?.completedOrders || 0,
          rating: data?.kpis?.averageRating || 0,
          totalEarnings: data?.monthlyGrossIncome || 0,
        },
        kpis: {
          acceptanceRate: data?.kpis?.acceptanceRate || 0,
          completionRate: data?.kpis?.onTimeDeliveryRate || 0,
          onTimeDeliveryRate: data?.kpis?.onTimeDeliveryRate || 0,
          averageDeliveryTime: data?.kpis?.averageDeliveryTime || 0,
        },
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Error fetching driver stats');
    }
  }
);

const driverSlice = createSlice({
  name: 'driver',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
      state.status = action.payload ? 'ACTIVE' : 'OFFLINE';
    },
    setCurrentLocation: (state, action: PayloadAction<{ latitude: number; longitude: number }>) => {
      state.currentLocation = action.payload;
    },
    updateStats: (state, action: PayloadAction<Partial<DriverState['stats']>>) => {
      state.stats = { ...state.stats, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateDriverStatus.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateDriverStatus.fulfilled, (state, action: PayloadAction<{ status: 'ACTIVE' | 'BUSY' | 'OFFLINE' | 'BREAK'; isOnline: boolean }>) => {
        state.isLoading = false;
        state.status = action.payload.status;
        state.isOnline = action.payload.isOnline;
      })
      .addCase(updateDriverStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Error updating driver status';
      })
      .addCase(updateDriverLocation.fulfilled, (state, action: PayloadAction<{ latitude: number; longitude: number }>) => {
        state.currentLocation = action.payload;
      })
      .addCase(updateDriverLocation.rejected, (state, action) => {
        state.error = action.payload || 'Error updating location';
      })
      .addCase(fetchDriverStats.fulfilled, (state, action: PayloadAction<any>) => {
        state.stats = action.payload.stats;
        state.kpis = action.payload.kpis;
      })
      .addCase(fetchDriverStats.rejected, (state, action) => {
        state.error = action.payload || 'Error fetching driver stats';
      });
  },
});

export const { 
  clearError, 
  setOnlineStatus, 
  setCurrentLocation, 
  updateStats 
} = driverSlice.actions;

export default driverSlice.reducer;
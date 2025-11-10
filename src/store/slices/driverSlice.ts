// Slice del conductor para BeFast GO
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { firestore, functions, COLLECTIONS, CLOUD_FUNCTIONS } from '../../config/firebase';

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

// Thunk para actualizar estado del conductor
export const updateDriverStatus = createAsyncThunk(
  'driver/updateDriverStatus',
  async ({ 
    driverId, 
    status, 
    isOnline 
  }: { 
    driverId: string; 
    status: 'ACTIVE' | 'BUSY' | 'OFFLINE' | 'BREAK'; 
    isOnline: boolean 
  }) => {
    try {
      await firestore()
        .collection(COLLECTIONS.DRIVERS)
        .doc(driverId)
        .update({
          'operational.status': status,
          'operational.isOnline': isOnline,
          'operational.lastUpdate': firestore.FieldValue.serverTimestamp()
        });
      
      return { status, isOnline };
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
);

// Thunk para actualizar ubicación
export const updateDriverLocation = createAsyncThunk(
  'driver/updateDriverLocation',
  async ({ 
    driverId, 
    latitude, 
    longitude 
  }: { 
    driverId: string; 
    latitude: number; 
    longitude: number 
  }) => {
    try {
      await firestore()
        .collection(COLLECTIONS.DRIVERS)
        .doc(driverId)
        .update({
          'operational.currentLocation': {
            latitude,
            longitude,
            timestamp: firestore.FieldValue.serverTimestamp()
          }
        });
      
      return { latitude, longitude };
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
);

// Thunk para obtener estadísticas del conductor
export const fetchDriverStats = createAsyncThunk(
  'driver/fetchDriverStats',
  async (driverId: string) => {
    try {
      const driverDoc = await firestore()
        .collection(COLLECTIONS.DRIVERS)
        .doc(driverId)
        .get();
      
      const data = driverDoc.data();
      
      return {
        stats: {
          totalOrders: data?.stats?.totalOrders || 0,
          completedOrders: data?.stats?.completedOrders || 0,
          rating: data?.stats?.rating || 0,
          totalEarnings: data?.stats?.totalEarnings || 0,
        },
        kpis: {
          acceptanceRate: data?.kpis?.acceptanceRate || 0,
          completionRate: data?.kpis?.completionRate || 0,
          onTimeDeliveryRate: data?.kpis?.onTimeDeliveryRate || 0,
          averageDeliveryTime: data?.kpis?.averageDeliveryTime || 0,
        }
      };
    } catch (error: any) {
      throw new Error(error.message);
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
      // Update driver status
      .addCase(updateDriverStatus.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateDriverStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.status = action.payload.status;
        state.isOnline = action.payload.isOnline;
      })
      .addCase(updateDriverStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Error al actualizar estado';
      })
      // Update driver location
      .addCase(updateDriverLocation.fulfilled, (state, action) => {
        state.currentLocation = action.payload;
      })
      // Fetch driver stats
      .addCase(fetchDriverStats.fulfilled, (state, action) => {
        state.stats = action.payload.stats;
        state.kpis = action.payload.kpis;
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
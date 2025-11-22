import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { auth, firestore, COLLECTIONS } from '../../config/firebase';
import { Driver } from '../../types/index';

interface AuthState {
  driver: Driver | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  showDebtWarningModal: boolean;
  showDriverStatusAlertModal: boolean; // Nuevo estado para controlar la visibilidad del modal de alerta de estado
  driverStatusAlertType: 'IMSS' | 'DOCUMENTS' | 'TRAINING' | 'GENERAL' | null; // Tipo de alerta
  driverStatusAlertMessage: string | null; // Mensaje de la alerta
}

const initialState: AuthState = {
  driver: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  showDebtWarningModal: false,
  showDriverStatusAlertModal: false, // Inicialmente oculto
  driverStatusAlertType: null,
  driverStatusAlertMessage: null,
};

export const initializeAuth = createAsyncThunk<Driver | null>(
  'auth/initialize',
  async () => {
    return new Promise<Driver | null>((resolve) => {
      const unsubscribe = auth().onAuthStateChanged(async (user: FirebaseAuthTypes.User | null) => {
        if (user) {
          try {
            const driverDoc = await firestore()
              .collection(COLLECTIONS.DRIVERS)
              .doc(user.uid)
              .get();
            resolve(driverDoc.data() as Driver);
          } catch (error) {
            console.error('[Auth] Error fetching driver data:', error);
            resolve(null);
          }
        } else {
          resolve(null);
        }
        unsubscribe();
      });
    });
  }
);

export const loginUser = createAsyncThunk<
  Driver,
  { email: string; password: string },
  { rejectValue: string }
>(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      const driverDoc = await firestore()
        .collection(COLLECTIONS.DRIVERS)
        .doc(userCredential.user.uid)
        .get();

      const driverData = driverDoc.data() as Driver;
      if (!driverData) {
        return rejectWithValue('Perfil de conductor no encontrado');
      }
      
      // Verificar que el conductor esté activo
      if (driverData.administrative?.befastStatus !== 'ACTIVE') {
        return rejectWithValue('Tu cuenta no está activa. Contacta soporte.');
      }
      
      return driverData;
    } catch (error: any) {
      let errorMessage = 'Error al iniciar sesión';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'Usuario no encontrado';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Contraseña incorrecta';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Email inválido';
      }
      return rejectWithValue(errorMessage);
    }
  }
);

export const logoutUser = createAsyncThunk<void>(
  'auth/logout',
  async () => {
    await auth().signOut();
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    showDebtWarningModal: (state) => {
      state.showDebtWarningModal = true;
    },
    hideDebtWarningModal: (state) => {
      state.showDebtWarningModal = false;
    },
    showDriverStatusAlertModal: (state, action: PayloadAction<{ type: 'IMSS' | 'DOCUMENTS' | 'TRAINING' | 'GENERAL'; message: string }>) => {
      state.showDriverStatusAlertModal = true;
      state.driverStatusAlertType = action.payload.type;
      state.driverStatusAlertMessage = action.payload.message;
    },
    hideDriverStatusAlertModal: (state) => {
      state.showDriverStatusAlertModal = false;
      state.driverStatusAlertType = null;
      state.driverStatusAlertMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(initializeAuth.fulfilled, (state, action: PayloadAction<Driver | null>) => {
        state.isLoading = false;
        state.driver = action.payload;
        state.isAuthenticated = !!action.payload;
      })
      .addCase(initializeAuth.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Initialization failed';
      })
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<Driver>) => {
        state.isLoading = false;
        state.driver = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Login failed';
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.driver = null;
        state.isAuthenticated = false;
        state.error = null;
      });
  },
});

export const { clearError, showDebtWarningModal, hideDebtWarningModal, showDriverStatusAlertModal, hideDriverStatusAlertModal } = authSlice.actions;
export default authSlice.reducer;

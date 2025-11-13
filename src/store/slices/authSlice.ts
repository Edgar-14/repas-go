// Slice de autenticación para BeFast GO
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { auth, firestore, COLLECTIONS } from '../../config/firebase';
import { Driver, ValidationResult } from '../../types';

interface AuthState {
  user: any | null;
  driver: Driver | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  canReceiveOrders: boolean;
  blockingReason?: string;
}

const initialState: AuthState = {
  user: null,
  driver: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  canReceiveOrders: false,
};

// Helper para mapear errores de Firebase Auth a mensajes claros en español
const mapAuthError = (err: any): string => {
  const code = err?.code || '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'Credenciales inválidas. Verifica tu correo y contraseña.';
    case 'auth/user-not-found':
      return 'No existe una cuenta con este correo.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos. Inténtalo de nuevo más tarde o restablece tu contraseña.';
    case 'auth/network-request-failed':
      return 'Error de red. Revisa tu conexión a internet.';
    case 'auth/invalid-email':
      return 'El correo no tiene un formato válido.';
    default:
      return err?.message || 'Error al iniciar sesión. Intenta de nuevo.';
  }
};

// Thunk para login
export const loginDriver = createAsyncThunk(
  'auth/loginDriver',
  async ({ email, password }: { email: string; password: string }) => {
    try {
      const normalizedEmail = (email || '').trim().toLowerCase();
      const userCredential = await auth().signInWithEmailAndPassword(normalizedEmail, password);
      const user = userCredential.user;
      
      // Obtener datos del conductor desde Firestore
      const driverDoc = await firestore()
        .collection(COLLECTIONS.DRIVERS)
        .doc(user.uid)
        .get();
      
      if (!driverDoc.exists) {
        throw new Error('Perfil de conductor no encontrado');
      }
      
      const driverData = driverDoc.data() as Driver;
      
      // Validar habilitación del conductor
      const validation = await validateDriverEligibility(user.uid);
      
      return {
        user: user.toJSON(),
        driver: driverData,
        validation
      };
    } catch (error: any) {
      throw new Error(mapAuthError(error));
    }
  }
);

// Thunk para logout
export const logoutDriver = createAsyncThunk(
  'auth/logoutDriver',
  async () => {
    await auth().signOut();
  }
);

// Función para validar habilitación del conductor
const validateDriverEligibility = async (driverId: string): Promise<ValidationResult> => {
  try {
    const driverDoc = await firestore()
      .collection(COLLECTIONS.DRIVERS)
      .doc(driverId)
      .get();
    
    const data = driverDoc.data();
    
    // Validación IMSS (REQUISITO INDISPENSABLE)
    if (!data?.administrative?.idseApproved) {
      return {
        canReceiveOrders: false,
        blockingReason: 'IDSE_NOT_APPROVED',
        message: 'Tu alta en IMSS está pendiente. Contacta a soporte.'
      };
    }
    
    // Validación de estado
    if (data?.administrative?.befastStatus !== 'ACTIVE') {
      return {
        canReceiveOrders: false,
        blockingReason: 'NOT_ACTIVE',
        message: 'Tu cuenta no está activa. Contacta a soporte.'
      };
    }
    
    // Validación IMSS activo
    if (data?.administrative?.imssStatus !== 'ACTIVO_COTIZANDO') {
      return {
        canReceiveOrders: false,
        blockingReason: 'IMSS_NOT_ACTIVE',
        message: 'Tu estatus en IMSS no está activo. Contacta a soporte.'
      };
    }
    
    // Validación de documentos
    if (data?.administrative?.documentsStatus !== 'APPROVED') {
      return {
        canReceiveOrders: false,
        blockingReason: 'DOCUMENTS_NOT_APPROVED',
        message: 'Tus documentos están pendientes de aprobación.'
      };
    }
    
    return { 
      canReceiveOrders: true,
      approved: true 
    };
  } catch (error) {
    return {
      canReceiveOrders: false,
      blockingReason: 'VALIDATION_ERROR',
      message: 'Error al validar tu cuenta. Intenta de nuevo.'
    };
  }
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateDriverData: (state, action: PayloadAction<Partial<Driver>>) => {
      if (state.driver) {
        state.driver = { ...state.driver, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginDriver.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginDriver.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.driver = action.payload.driver;
        state.isAuthenticated = true;
        state.canReceiveOrders = action.payload.validation.canReceiveOrders || false;
        state.blockingReason = action.payload.validation.blockingReason;
      })
      .addCase(loginDriver.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Error al iniciar sesión';
        state.isAuthenticated = false;
      })
      // Logout
      .addCase(logoutDriver.fulfilled, (state) => {
        state.user = null;
        state.driver = null;
        state.isAuthenticated = false;
        state.canReceiveOrders = false;
        state.blockingReason = undefined;
      });
  },
});

export const { clearError, updateDriverData } = authSlice.actions;
export default authSlice.reducer;
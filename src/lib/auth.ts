"use client";

import {
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth, functions, googleProvider } from "./firebase";
import { httpsCallable } from "firebase/functions";
import { createAuditLog } from "./audit";
import { setAuthCookies, clearAuthCookies } from "./cookies";
// // Firebase Functions imports removed - not needed in frontend
// Removed - not needed in frontend
// --- Helper Functions (Internal Logic) ---

/**
 * Procesa un error de autenticación de Firebase y devuelve un mensaje amigable.
 * @param error - El objeto de error capturado.
 * @returns Un string con el mensaje de error para el usuario.
 * @private
 */
const _handleAuthError = (error: any): string => {
  if (!error.code) {
    return error instanceof Error ? error.message : 'Ocurrió un error desconocido.';
  }

  switch (error.code) {
    case 'auth/user-not-found':
      return 'El correo electrónico no se encuentra registrado.';
    case 'auth/wrong-password':
      return 'La contraseña es incorrecta.';
    case 'auth/invalid-email':
      return 'El formato del correo electrónico no es válido.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos fallidos. Por favor, intenta de nuevo más tarde.';
    case 'auth/user-disabled':
      return 'Esta cuenta ha sido deshabilitada.';
    case 'auth/invalid-credential':
      return 'Las credenciales proporcionadas son inválidas.';
    default:
      return 'Ocurrió un error al intentar iniciar sesión.';
  }
};

/**
 * Lógica genérica de inicio de sesión con Google OAuth.
 * @param allowedRoles - Un array de roles permitidos para este login.
 * @private
 */
const _loginWithGoogle = async (allowedRoles: string[]) => {
  try {
    if (!auth) throw new Error("Firebase Auth no está inicializado");

    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Obtener el token de ID de Google (no el token de Firebase)
    const idToken = await user.getIdToken();
    
    // Enviar el token al backend para verificación
    const backendResponse = await fetch('/api/auth/verify-google-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken })
    });

    if (!backendResponse.ok) {
      throw new Error('Error en la verificación del token con el backend');
    }

    const backendData = await backendResponse.json();
    
    if (!backendData.success) {
      throw new Error(backendData.error || 'Error en la verificación del backend');
    }

    // Forzar la actualización de los custom claims del usuario
    await user.getIdToken(true);
    const tokenResult = await user.getIdTokenResult();
    
    const role = (tokenResult.claims as any).role;

    if (!role || !allowedRoles.includes(role)) {
      await signOut(auth); // Cerrar sesión si no tiene el rol correcto
      throw new Error(`No tienes los permisos requeridos. Se esperaba uno de: ${allowedRoles.join(', ')}`);
    }

    // Escribir cookie inmediatamente para que el middleware la vea en la primera navegación
    try {
      setAuthCookies(tokenResult.token);
    } catch (e) {
      console.warn('No se pudo establecer las cookies inmediatamente tras login (google):', e);
    }

    // Registrar audit log de login exitoso
    await createAuditLog({
      action: 'USER_LOGIN',
      entityType: 'user',
      entityId: user.uid,
      performedBy: user.uid,
      details: {
        email: user.email,
        role: role,
        loginMethod: 'google_oauth',
        timestamp: new Date().toISOString()
      }
    });

    return { success: true, user, tokenResult };
  } catch (error: any) {
    console.error("❌ Error en el proceso de login con Google:", error);
    
    // Registrar audit log de login fallido
    await createAuditLog({
      action: 'USER_LOGIN_FAILED',
      entityType: 'user',
      entityId: 'google_oauth',
      performedBy: 'google_oauth',
      details: {
        email: 'google_oauth',
        error: error.code || error.message,
        loginMethod: 'google_oauth',
        timestamp: new Date().toISOString()
      }
    });
    
    return { success: false, error: _handleAuthError(error) };
  }
};

/**
 * Lógica genérica de inicio de sesión con validación de rol.
 * @param email - El email del usuario.
 * @param password - La contraseña del usuario.
 * @param allowedRoles - Un array de roles permitidos para este login.
 * @private
 */
const _login = async (email: string, password: string, allowedRoles: string[]) => {
  try {
    if (!auth) throw new Error("Firebase Auth no está inicializado");

    const cred = await signInWithEmailAndPassword(auth, email, password);
    const user = cred.user;

    // Forzar la actualización de los custom claims del usuario
    await user.getIdToken(true);
    const tokenResult = await user.getIdTokenResult();
    
    const role = (tokenResult.claims as any).role;

    if (!role || !allowedRoles.includes(role)) {
      await signOut(auth); // Cerrar sesión si no tiene el rol correcto
      throw new Error(`No tienes los permisos requeridos. Se esperaba uno de: ${allowedRoles.join(', ')}`);
    }

    // Escribir cookie inmediatamente para que el middleware la vea en la primera navegación
    try {
      setAuthCookies(tokenResult.token);
    } catch (e) {
      console.warn('No se pudieron establecer las cookies inmediatamente tras login:', e);
    }

    // Registrar audit log de login exitoso
    await createAuditLog({
      action: 'USER_LOGIN',
      entityType: 'user',
      entityId: user.uid,
      performedBy: user.uid,
      details: {
        email: user.email,
        role: role,
        loginMethod: 'email_password',
        timestamp: new Date().toISOString()
      }
    });

    return { success: true, user, tokenResult };
  } catch (error: any) {
    console.error("❌ Error en el proceso de login:", error);
    
    // Registrar audit log de login fallido
    await createAuditLog({
      action: 'USER_LOGIN_FAILED',
      entityType: 'user',
      entityId: email,
      performedBy: email,
      details: {
        email: email,
        error: error.code || error.message,
        loginMethod: 'email_password',
        timestamp: new Date().toISOString()
      }
    });
    
    return { success: false, error: _handleAuthError(error) };
  }
};

// --- Public Authentication Functions ---

/**
 * Autentica a un usuario administrativo (ADMIN, SUPER_ADMIN, CONTADORA).
 * @param email - El email del administrador.
 * @param password - La contraseña del administrador.
 * @returns Un objeto indicando el resultado del inicio de sesión.
 */
export async function loginAdmin(email: string, password: string) {
  const result = await _login(email, password, ["ADMIN", "SUPER_ADMIN", "CONTADORA"]);

  if (result.success) {
    return { success: true, role: result.tokenResult?.claims?.role, claims: result.tokenResult?.claims };
  }
  
  return result;
}

/**
 * Autentica a un usuario de negocio (BUSINESS).
 * @param email - El email del negocio.
 * @param password - La contraseña del negocio.
 * @returns Un objeto indicando el resultado del inicio de sesión.
 */
export async function loginBusiness(email: string, password: string) {
  const result = await _login(email, password, ["BUSINESS"]);
  
  if (result.success) {
    return { success: true, role: result.tokenResult?.claims?.role, claims: result.tokenResult?.claims };
  }
  
  return result;
}

/**
 * Autentica a un usuario repartidor (DRIVER).
 * @param email - El email del repartidor.
 * @param password - La contraseña del repartidor.
 * @returns Un objeto indicando el resultado del inicio de sesión.
 */
export async function loginDriver(email: string, password: string) {
  const result = await _login(email, password, ["DRIVER"]);
  
  if (result.success) {
    return { success: true, role: result.tokenResult?.claims?.role, claims: result.tokenResult?.claims };
  }
  
  return result;
}

// --- Google OAuth Authentication Functions ---

/**
 * Autentica a un usuario administrativo usando Google OAuth.
 * @returns Un objeto indicando el resultado del inicio de sesión.
 */
export async function loginAdminWithGoogle() {
  const result = await _loginWithGoogle(["ADMIN", "SUPER_ADMIN", "CONTADORA"]);

  if (result.success) {
    return { success: true, role: result.tokenResult?.claims?.role, claims: result.tokenResult?.claims };
  }
  
  return result;
}

/**
 * Autentica a un usuario de negocio usando Google OAuth.
 * @returns Un objeto indicando el resultado del inicio de sesión.
 */
export async function loginBusinessWithGoogle() {
  const result = await _loginWithGoogle(["BUSINESS"]);
  
  if (result.success) {
    return { success: true, role: result.tokenResult?.claims?.role, claims: result.tokenResult?.claims };
  }
  
  return result;
}

/**
 * Autentica a un usuario repartidor usando Google OAuth.
 * @returns Un objeto indicando el resultado del inicio de sesión.
 */
export async function loginDriverWithGoogle() {
  const result = await _loginWithGoogle(["DRIVER"]);
  
  if (result.success) {
    return { success: true, role: result.tokenResult?.claims?.role, claims: result.tokenResult?.claims };
  }
  
  return result;
}

/**
 * Cierra la sesión del usuario actual y lo redirige a la página de inicio.
 */
export async function logout() {
  if (!auth) {
    console.warn("Firebase Auth no está disponible para logout.");
    if (typeof window !== 'undefined') window.location.href = "/";
    return;
  }
  
  const user = auth.currentUser;
  const userId = user?.uid;
  const userEmail = user?.email;
  
  await signOut(auth);

  clearAuthCookies();
  
  // Registrar audit log de logout
  if (userId) {
    await createAuditLog({
      action: 'USER_LOGOUT',
      entityType: 'user',
      entityId: userId,
      performedBy: userId,
      details: {
        email: userEmail,
        logoutMethod: 'manual',
        timestamp: new Date().toISOString()
      }
    });
  }
  
  if (typeof window !== 'undefined') window.location.href = "/";
}

/**
 * Envía un correo para restablecer la contraseña.
 * @param email - El email del usuario que necesita restablecer su contraseña.
 * @returns Un objeto indicando si la operación fue exitosa.
 */
export async function resetPassword(email: string) {
  try {
    if (!auth) throw new Error("Firebase Auth no está inicializado");
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error: any) {
    console.error("❌ Error en reset password:", error);
    return { success: false, error: _handleAuthError(error) };
  }
}

/**
 * Obtiene el nombre legible de un rol.
 * @param role - El rol del usuario.
 * @returns El nombre legible del rol.
 */
export const getRoleName = (role: string): string => {
  const roleNames: Record<string, string> = {
    'SUPER_ADMIN': 'Super Administrador',
    'ADMIN': 'Administrador',
    'CONTADORA': 'Contadora',
    'BUSINESS': 'Negocio',
    'DRIVER': 'Repartidor',
  };
  return roleNames[role] || 'Usuario';
};

// Email verification functions
export const resendEmailVerification = async () => {
  if (!auth.currentUser) {
    throw new Error('No hay usuario autenticado');
  }
  
  try {
    await sendPasswordResetEmail(auth, auth.currentUser.email!);
    return { success: true };
  } catch (error) {
    console.error('Error reenviando verificación:', error);
    throw error;
  }
};

export const completeBusinessRegistration = async () => {
  // Placeholder function - implement business registration logic
  return { success: true, message: 'Registro completado' };
};

// Se mantiene la re-exportación del hook useAuth por compatibilidad.
export { useAuth } from '@/hooks/useAuth';
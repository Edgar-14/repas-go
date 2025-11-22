/**
 * @file Provides an authentication context and hook (`useAuth`) for managing user sessions.
 * @author Jules
 */
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { setAuthCookies, clearAuthCookies } from '@/lib/cookies';
import { UserRole as BaseUserRole } from '@/types';

/**
 * Extended user role type that includes frontend-specific roles.
 * Extends the canonical UserRole from @/types with 'CONTADORA' and 'loading'.
 */
export type UserRole = BaseUserRole | 'CONTADORA' | 'loading';

/**
 * A constant array for validating roles obtained from custom claims.
 * Aligned with the canonical UserRole definition plus CONTADORA.
 */
export const VALID_ROLES: Exclude<UserRole, 'loading'>[] = ['ADMIN', 'BUSINESS', 'CONTADORA', 'DRIVER', 'SUPER_ADMIN'];

/**
 * Interface for the user's custom claims stored in their JWT.
 */
interface UserClaims {
  name?: string;
  role?: UserRole;
  permissions?: string[];
  email?: string;
}

/**
 * Interface for the authentication context provided to the application.
 */
interface AuthContextType {
  user: User | null;
  claims: UserClaims | null;
  loading: boolean;
  isAdmin: boolean;
  isBusiness: boolean;
  isDriver: boolean;
  role: UserRole | null;
  permissions: string[];
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * The provider component that wraps the application to make authentication state available.
 * It listens for changes in Firebase Auth state, manages user claims, and handles logout.
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The child components to be rendered within the provider.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [claims, setClaims] = useState<UserClaims | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Verificar si auth está disponible
    if (!auth) {
      console.warn('Firebase Auth no está disponible');
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        try {
          // Obtener claims del token
          const token = await user.getIdTokenResult(true);
          const userClaims = token.claims as UserClaims;
          setClaims(userClaims);
          
          // Obtener permisos del rol
          const userRole = userClaims.role || 'BUSINESS';
          const rolePermissions = getDefaultPermissions(userRole);
          setPermissions(rolePermissions);
          
          // Guardar token en cookie para el middleware con configuración correcta para producción
          setAuthCookies(token.token);
          
          console.info('✅ Usuario autenticado:', {
            email: user.email,
            role: userClaims.role,
            claims: userClaims,
            permissions: rolePermissions
          });
        } catch (error) {
          console.error('Error obteniendo claims:', error);
          setClaims(null);
          setPermissions([]);
          // Limpiar cookie en caso de error con configuración correcta
          clearAuthCookies();
        }
      } else {
        setClaims(null);
        setPermissions([]);
        // Limpiar cookie cuando no hay usuario con configuración correcta
        clearAuthCookies();
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      if (auth) {
        await auth.signOut();
      }
      // Limpiar cookie con configuración correcta
      clearAuthCookies();
      router.push('/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const isAdmin = claims?.role && ['SUPER_ADMIN', 'ADMIN', 'CONTADORA'].includes(claims.role);
  const isBusiness = claims?.role === 'BUSINESS';
  const isDriver = claims?.role === 'DRIVER';
  const role = claims?.role || null;

  const value = {
    user,
    claims,
    loading,
    isAdmin: !!isAdmin,
    isBusiness: !!isBusiness,
    isDriver: !!isDriver,
    role,
    permissions,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * A custom hook to access the authentication context.
 * Must be used within a component wrapped by `AuthProvider`.
 * @returns {AuthContextType} The authentication context, including user, claims, and loading state.
 * @throws Will throw an error if used outside of an `AuthProvider`.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * An auxiliary function that returns a hardcoded list of permissions based on user role.
 *
 * NOTE: This is a potential point of inconsistency. If permissions change in the backend,
 * this function must be updated manually to reflect those changes in the UI.
 *
 * @param {UserRole} role - The role of the user.
 * @returns {string[]} A list of default permissions for the given role.
 */
function getDefaultPermissions(role: UserRole): string[] {
  switch (role) {
    case 'BUSINESS':
      return ['create_orders', 'manage_credits', 'view_reports'];
    case 'DRIVER':
      return ['accept_orders', 'update_location', 'view_earnings'];
    case 'ADMIN':
      return ['manage_users', 'view_all_orders', 'manage_credits', 'view_reports'];
    case 'SUPER_ADMIN':
      return [
        'manage_users', 
        'view_all_orders', 
        'manage_credits', 
        'view_reports', 
        'system_settings'
      ];
    case 'CONTADORA':
      return ['view_reports']; 
    case 'loading':
      return [];
    default:
      console.warn(`Rol desconocido '${role}' recibido, no se asignaron permisos.`);
      return [];
  }
}

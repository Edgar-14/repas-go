'use client';

/**
 * @file Provides a Higher-Order Component (HOC) for route protection based on user authentication and roles.
 * @author Jules
 */
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Configuration options for the withAuth HOC.
 */
interface WithAuthOptions {
  /** A list of roles that are allowed to access the component. If empty, only authentication is required. */
  requiredRoles?: string[];
  /** The path to redirect to if the user is not authenticated. */
  redirectTo?: string;
  /** @deprecated This option is not used. */
  role?: string;
}

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
  </div>
);

/**
 * A Higher-Order Component (HOC) that wraps a page or component to protect it based on
 * authentication status and user role.
 *
 * It uses the global `useAuth` hook to get the user's state. While loading, it displays a
 * spinner. If the user is not authenticated, it redirects them. If role-based access is
 * required, it checks the user's role and redirects to an 'unauthorized' page if they
 * do not have the required role.
 *
 * @template P The props of the component being wrapped.
 * @param {React.ComponentType<P>} WrappedComponent The component to protect.
 * @param {WithAuthOptions} [options={}] Configuration options for the protection logic.
 * @returns {React.ComponentType<P>} A new component that includes the authentication and authorization logic.
 */
export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithAuthOptions = {}
) {
  const { requiredRoles = [], redirectTo = '/delivery/login' } = options;

  return function WithAuthComponent(props: P) {
    const { user, role, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading) {
        if (!user) {
          console.warn('⚠️ withAuth: No hay usuario, redirigiendo a login');
          router.replace(redirectTo);
          return;
        }

        if (requiredRoles.length > 0 && role && !requiredRoles.includes(role)) {
          console.error('❌ withAuth: Rol no autorizado', { 
            userRole: role, 
            requiredRoles 
          });
          router.replace('/unauthorized');
        } else if (requiredRoles.length > 0 && role) {
          console.info('✅ withAuth: Acceso autorizado', { 
            userRole: role, 
            requiredRoles 
          });
        }
      }
    }, [user, role, loading, router]);

    // Mostrar spinner mientras se carga el usuario o el role
    if (loading) {
      console.log('⏳ withAuth: Cargando autenticación...');
      return <LoadingSpinner />;
    }

    if (!user) {
      console.log('⏳ withAuth: No hay usuario, mostrando spinner...');
      return <LoadingSpinner />;
    }

    if (requiredRoles.length > 0 && !role) {
      console.log('⏳ withAuth: Esperando rol del usuario...');
      return <LoadingSpinner />;
    }

    // Bloquear render si el role no es válido
    if (requiredRoles.length > 0 && role && !requiredRoles.includes(role)) {
      console.error('❌ withAuth: Bloqueando render por rol inválido');
      return <LoadingSpinner />;
    }

    console.log('✅ withAuth: Renderizando componente protegido');
    return <WrappedComponent {...props} />;
  };
}

export default withAuth;

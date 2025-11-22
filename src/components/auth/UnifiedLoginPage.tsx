'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { AuthUI } from '@/components/auth/AuthUI';
import { loginDriver, loginBusiness, loginAdmin, getRoleName } from '@/lib/auth';
import { Bike, Store, Shield, AlertCircle } from 'lucide-react';
import { z } from 'zod';
import { WelcomeChatbot } from '@/components/chat';

const formSchema = z.object({
  email: z.string().email({ message: "Por favor, introduce un correo válido." }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
});

type LoginType = 'repartidores' | 'delivery' | 'admin';

interface LoginConfig {
  userType: 'repartidor' | 'delivery' | 'admin';
  title: string;
  description: string;
  icon: React.ElementType;
  loginFn: (email: string, password: string) => Promise<any>;
  redirectPath: string;
  expectedRole: string | string[];
  showAdditionalInfo?: boolean;
}

const LOGIN_CONFIGS: Record<LoginType, LoginConfig> = {
  repartidores: {
    userType: 'repartidor',
    title: 'BeFast Repartidores',
    description: 'Accede a tu cuenta de repartidor',
    icon: Bike,
    loginFn: loginDriver,
    redirectPath: '/repartidores/dashboard',
    expectedRole: 'DRIVER'
  },
  delivery: {
    userType: 'delivery',
    title: 'BeFast Delivery',
    description: 'Accede a tu cuenta de negocio',
    icon: Store,
    loginFn: loginBusiness,
    redirectPath: '/delivery/dashboard',
    expectedRole: 'BUSINESS'
  },
  admin: {
    userType: 'admin',
    title: 'BeFast Admin',
    description: 'Panel de administración',
    icon: Shield,
    loginFn: loginAdmin,
    redirectPath: '/admin/dashboard',
    expectedRole: ['ADMIN', 'SUPER_ADMIN', 'CONTADORA'],
    showAdditionalInfo: true
  }
};

interface UnifiedLoginPageProps {
  type: LoginType;
}

export default function UnifiedLoginPage({ type }: UnifiedLoginPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { user, claims, loading } = useAuth();
  
  const config = LOGIN_CONFIGS[type];

  // Verificar si ya está autenticado
  useEffect(() => {
    if (!loading && user && claims?.role) {
      const expectedRoles = Array.isArray(config.expectedRole) 
        ? config.expectedRole 
        : [config.expectedRole];
      
      if (expectedRoles.includes(claims.role)) {
        router.push(config.redirectPath);
      }
    }
  }, [user, claims, loading, router, config]);

  const handleLogin = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);

    try {
      const result = await config.loginFn(values.email, values.password);

      if (result.success) {
        // Mensaje de éxito específico por portal
        const successMessage = type === 'admin' 
          ? `Bienvenido ${result.role ? getRoleName(result.role) : 'Administrador'}`
          : `Bienvenido a BeFast ${config.userType === 'repartidor' ? 'Repartidores' : 'Delivery'}`;

        toast({
          title: 'Acceso exitoso',
          description: successMessage,
        });
        
        router.push(config.redirectPath);
      } else {
        throw new Error(result.error || 'Error de autenticación');
      }
    } catch (error: any) {
      let errorMessage = 'Credenciales inválidas. Por favor, verifica tu email y contraseña.';
      
      // Manejo específico de errores por tipo
      if (error.code === 'auth/user-not-found') {
        errorMessage = type === 'admin' 
          ? 'Usuario administrador no encontrado'
          : 'Usuario no encontrado. ¿Ya tienes una cuenta?';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Contraseña incorrecta';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Email inválido';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Demasiados intentos fallidos. Intenta más tarde.';
      }

      const toastTitle = type === 'admin' ? 'Error de acceso' : 'Error';

      toast({
        variant: 'destructive',
        title: toastTitle,
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Información adicional para el portal admin
  const getAdditionalInfo = () => {
    if (!config.showAdditionalInfo) return undefined;
    
    return (
      <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
        <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="text-blue-800">
          <p className="font-medium mb-1">Acceso Administrativo</p>
          <p className="text-xs text-blue-600">
            Este portal es exclusivo para personal autorizado de BeFast.
          </p>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <>
      <AuthUI
        userType={config.userType}
        title={config.title}
        description={config.description}
        onSubmit={handleLogin}
        isLoading={isLoading}
        icon={config.icon}
        showSignup={true}
        additionalInfo={getAdditionalInfo()}
      />
      
      {/* Chat de Bienvenida */}
      <WelcomeChatbot />
    </>
  );
}

// Función helper para getRoleName si no existe en auth lib
const getRoleNameFallback = (role: string): string => {
  const roleNames: Record<string, string> = {
    'SUPER_ADMIN': 'Super Administrador',
    'ADMIN': 'Administrador',
    'CONTADORA': 'Contadora',
    'DRIVER': 'Repartidor',
    'BUSINESS': 'Negocio'
  };
  return roleNames[role] || role;
};

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Store, 
  Truck, 
  ShieldCheck, 
  ExternalLink, 
  User,
  ArrowRight,
  LogIn
} from 'lucide-react';

const PORTAL_COLORS = {
  admin: {
    primary: '#3B82F6',
    gradient: 'from-blue-500 to-blue-600'
  },
  delivery: {
    primary: '#FF7300',
    gradient: 'from-orange-500 to-orange-600'
  },
  repartidores: {
    primary: '#10B981',
    gradient: 'from-emerald-500 to-emerald-600'
  }
};

interface PortalCardProps {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  portalType: 'delivery' | 'repartidores' | 'admin';
  external?: boolean;
  requiresAuth?: boolean;
  userRole?: string;
  currentUserRole?: string | null;
}

const PortalCard: React.FC<PortalCardProps> = ({
  title,
  description,
  href,
  icon,
  portalType,
  external = false,
  requiresAuth = false,
  userRole,
  currentUserRole
}) => {
  const isAccessible = !requiresAuth || (currentUserRole && userRole && currentUserRole === userRole);
  const colors = PORTAL_COLORS[portalType];
  
  return (
    <Card className="transition-all duration-300 hover:shadow-lg group border-0 shadow-md">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div 
            className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md bg-gradient-to-r ${colors.gradient}`}
          >
            {icon}
          </div>
          {external && (
            <Badge variant="outline" className="text-xs">
              <ExternalLink className="w-3 h-3 mr-1" />
              Externo
            </Badge>
          )}
          {requiresAuth && (
            <Badge variant="outline" className="text-xs">
              <User className="w-3 h-3 mr-1" />
              {userRole}
            </Badge>
          )}
        </div>
        <CardTitle className={`text-lg font-semibold group-hover:text-[${colors.primary}] transition-colors`}>
          {title}
        </CardTitle>
        <CardDescription className="text-sm text-gray-600">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {isAccessible ? (
          <Link href={href} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined}>
            <Button 
              className={`w-full group bg-gradient-to-r ${colors.gradient} hover:opacity-90 text-white`}
            >
              Acceder
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        ) : (
          <Button variant="ghost" disabled className="w-full">
            <LogIn className="w-4 h-4 mr-2" />
            Requiere autenticación
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

function LoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">Cargando...</p>
      </div>
    </div>
  );
}

export const PortalNavigation: React.FC = () => {
  const { user, loading } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const getUserRole = async () => {
      if (user) {
        try {
          const idTokenResult = await user.getIdTokenResult();
          setUserRole(idTokenResult.claims.role as string);
        } catch (error) {
          console.error('Error getting user role:', error);
        }
      }
      setIsChecking(false);
    };

    if (!loading) {
      getUserRole();
    }
  }, [user, loading]);

  if (loading || isChecking) {
    return <LoadingScreen />;
  }

  const portals = [
    {
      title: 'BeFast Market',
      description: 'Plataforma de pedidos para clientes finales',
      href: 'https://order.befastmarket.com/',
      icon: <Store className="w-6 h-6 text-white" />,
      portalType: 'delivery' as const,
      external: true,
    },
    {
      title: 'Portal Empresas',
      description: 'Gestión de pedidos y facturación para negocios',
      href: userRole === 'BUSINESS' ? '/delivery/dashboard' : '/delivery/login',
      icon: <Store className="w-6 h-6 text-white" />,
      portalType: 'delivery' as const,
      requiresAuth: false,
      userRole: 'BUSINESS',
      currentUserRole: userRole,
    },
    {
      title: 'Portal Repartidores',
      description: 'Dashboard para conductores y gestión de entregas',
      href: userRole === 'DRIVER' ? '/repartidores/dashboard' : '/repartidores/login',
      icon: <Truck className="w-6 h-6 text-white" />,
      portalType: 'repartidores' as const,
      requiresAuth: false,
      userRole: 'DRIVER',
      currentUserRole: userRole,
    },
    {
      title: 'Panel Administración',
      description: 'Control total del sistema y gestión operativa',
      href: userRole && ['ADMIN', 'SUPER_ADMIN', 'CONTADORA'].includes(userRole) ? '/admin/dashboard' : '/admin/login',
      icon: <ShieldCheck className="w-6 h-6 text-white" />,
      portalType: 'admin' as const,
      requiresAuth: false,
      userRole: 'ADMIN',
      currentUserRole: userRole,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
      <div className="container mx-auto p-6 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-orange-500 to-emerald-500 bg-clip-text text-transparent">
            Ecosistema BeFast
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Accede a todos los portales de la plataforma BeFast desde un solo lugar
          </p>
          {user && userRole && (
            <Badge variant="outline" className="text-sm px-4 py-2">
              Conectado como: {userRole}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {portals.map((portal, index) => (
            <PortalCard key={index} {...portal} />
          ))}
        </div>

        {!user && (
          <Card className="max-w-4xl mx-auto shadow-lg border-0">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">¿Eres parte del equipo BeFast?</CardTitle>
              <CardDescription className="text-lg">
                Inicia sesión para acceder directamente a tu portal correspondiente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Link href="/delivery/login" className="w-full">
                  <Button variant="outline" className="w-full h-12 text-orange-600 border-orange-200 hover:bg-orange-50">
                    <Store className="w-4 h-4 mr-2" />
                    Login Empresas
                  </Button>
                </Link>
                <Link href="/repartidores/login" className="w-full">
                  <Button variant="outline" className="w-full h-12 text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                    <Truck className="w-4 h-4 mr-2" />
                    Login Repartidores
                  </Button>
                </Link>
                <Link href="/admin/login" className="w-full">
                  <Button variant="outline" className="w-full h-12 text-blue-600 border-blue-200 hover:bg-blue-50">
                    <ShieldCheck className="w-4 h-4 mr-2" />
                    Login Admin
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="text-center text-sm text-gray-500 max-w-2xl mx-auto">
          <p>
            Si no tienes una cuenta, contacta con el administrador del sistema. 
            Solo los negocios pueden registrarse automáticamente a través del portal de empresas.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PortalNavigation;
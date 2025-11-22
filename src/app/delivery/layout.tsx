'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { NotificationProvider } from '@/context/NotificationContext';
import { PortalSidebarClean } from '@/components/ui/portal-sidebar-clean';
import { DashboardHeader } from '@/components/dashboard/header';
import { ChatWidget } from '@/components/chat/ChatWidget';
import { logout } from '@/lib/auth';
import { useBreakpoints } from '@/hooks/use-mobile';
import { ResponsiveContainer } from '@/components/ui/responsive-container';

const PUBLIC_ROUTES = [
  '/delivery/login',
  '/delivery/signup',
  '/delivery/verify-code',
  '/delivery/forgot-password',
  '/delivery/contract',
  '/delivery/privacy'
];

function LoadingScreen({ message = "Cargando..." }: { message?: string }) {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4" />
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
}

export default function DeliveryLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const { isMobile, isTablet } = useBreakpoints();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      if (PUBLIC_ROUTES.includes(pathname)) {
        setIsChecking(false);
        return;
      }

      if (!user) {
        console.log('🔍 No user found, redirecting to login');
        router.replace('/delivery/login');
        return;
      }

      try {
        const idTokenResult = await user.getIdTokenResult(true); // Force refresh
        const role = idTokenResult.claims.role as string;
        setUserRole(role);

        console.log('🔍 User role check:', { role, emailVerified: user.emailVerified, pathname });

        if (role === 'BUSINESS') {
          setIsChecking(false);
          return;
        }

        if (role === 'DRIVER') {
          console.log('🔍 User is DRIVER, redirecting to repartidores');
          router.replace('/repartidores/dashboard');
          return;
        }

        if (!role && user.emailVerified) {
          console.log('🔍 No role but email verified, setting as BUSINESS');
          setUserRole('BUSINESS');
          setIsChecking(false);
          return;
        }

        if (!role && !user.emailVerified && pathname === '/delivery/verify-code') {
          console.log('🔍 No role, not verified, on verify-code page - allowing');
          setUserRole(null);
          setIsChecking(false);
          return;
        }

        console.log('🔍 User does not have BUSINESS role, redirecting to login');
        router.replace('/delivery/login');
      } catch (error) {
        console.error('Auth check error:', error);
        if (user.emailVerified) {
          setUserRole('BUSINESS');
        } else {
          router.replace('/delivery/login');
          return;
        }
      }

      setIsChecking(false);
    };

    if (!loading) {
      checkAuth();
    }
  }, [user, loading, router, pathname]);

  if (PUBLIC_ROUTES.includes(pathname)) {
    return <>{children}</>;
  }

  if (loading || isChecking) {
    return <LoadingScreen />;
  }

  if (pathname === '/delivery/verify-code' && user && !user.emailVerified) {
    return <>{children}</>;
  }

  if (!user || (userRole && userRole !== 'BUSINESS' && pathname !== '/delivery/verify-code')) {
    return <LoadingScreen message="Redirigiendo..." />;
  }

  const handleSignOut = async () => {
    try {
      await logout();
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <NotificationProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-orange-50 to-orange-100">
        {/* Mobile Overlay */}
        {isMobile && sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Sidebar - Responsive */}
        <div className={`
          ${isMobile ? 'fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out' : 'relative'}
          ${isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'}
          ${!isMobile ? 'w-64' : ''}
        `}>
          <PortalSidebarClean 
            onSignOut={handleSignOut}
            user={user}
            loading={false}
            onClose={() => setSidebarOpen(false)}
            isMobile={isMobile}
          />
        </div>
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          <DashboardHeader 
            onMenuClick={() => setSidebarOpen(!sidebarOpen)}
            showMenuButton={isMobile}
          />
          
          <main className="flex-1 overflow-y-auto">
            <ResponsiveContainer 
              maxWidth="full" 
              padding={isMobile ? 'sm' : 'md'}
              className="py-4"
            >
              {children}
            </ResponsiveContainer>
          </main>
        </div>
        
        {/* AI Chatbot for Business Portal */}
        {user && userRole === 'BUSINESS' && (
          <ChatWidget 
            userRole="BUSINESS" 
            userId={user.uid}
            contextData={{
              portal: 'delivery',
              userRole: userRole,
              userName: user.displayName,
              userEmail: user.email
            }}
          />
        )}
      </div>
    </NotificationProvider>
  );
}
"use client";

// Force dynamic rendering to prevent SSR issues with Firebase
export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { logout } from '@/lib/auth';
import { NotificationProvider } from '@/context/NotificationContext';
import { PortalSidebarClean } from '@/components/ui/portal-sidebar-clean';
import { DashboardHeader } from '@/components/dashboard/header';
import { ChatWidget } from '@/components/chat/ChatWidget';
import { useBreakpoints } from '@/hooks/use-mobile';
import { ResponsiveContainer } from '@/components/ui/responsive-container';

function DriversLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const { isMobile, isTablet } = useBreakpoints();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [checkingRole, setCheckingRole] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Rutas públicas del portal de Repartidores (no requieren auth ni layout)
  const PUBLIC_PATHS = new Set<string>([
    "/repartidores/login",
    "/repartidores/signup",
    "/repartidores/forgot-password",
    "/repartidores/reset-password",
    "/repartidores/solicitud-recibida",
  ]);
  const isPublicPath = (p: string) => PUBLIC_PATHS.has(p) || p.startsWith("/repartidores/signup/step-");

  const handleSignOut = async () => {
    try {
      await logout();
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  useEffect(() => {
    const checkUserRole = async () => {
      // Skip auth checks for public pages
      if (isPublicPath(pathname)) {
        setCheckingRole(false);
        return;
      }

      if (user) {
        try {
          const idTokenResult = await user.getIdTokenResult();
          const role = idTokenResult.claims.role as string;
          setUserRole(role);

          // Redirect if not DRIVER
          if (role !== 'DRIVER') {
            switch (role) {
              case 'BUSINESS':
                router.replace('/delivery/dashboard');
                break;
              case 'ADMIN':
              case 'SUPER_ADMIN':
              case 'CONTADORA':
                router.replace('/admin/dashboard');
                break;
              default:
                router.replace('/repartidores/login');
                break;
            }
          }
        } catch (error) {
          console.error('Error checking user role:', error);
          router.replace('/repartidores/login');
        }
      } else {
        router.replace('/repartidores/login');
      }

      setCheckingRole(false);
    };

    if (!loading) {
      checkUserRole();
    }
  }, [user, loading, router, pathname]);

  // No layout for public driver pages (login/signup/forgot-password/verify-code/reset-password/solicitud-recibida and steps)
  if (isPublicPath(pathname)) {
    return <>{children}</>;
  }

  // Loading state
  if (loading || checkingRole) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span className="text-lg font-bold">Cargando...</span>
      </div>
    );
  }

  // If user not authenticated or wrong role, redirects handled in useEffect
  if (!user || (userRole && userRole !== 'DRIVER')) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span className="text-lg font-bold">Redirigiendo...</span>
      </div>
    );
  }

  return (
    <NotificationProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-emerald-50 to-emerald-100">
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
            loading={loading || checkingRole}
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
        
        {/* AI Chatbot for Driver Portal */}
        {user && userRole === 'DRIVER' && (
          <ChatWidget 
            userRole="DRIVER" 
            userId={user.uid}
            contextData={{
              portal: 'repartidores',
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

export default DriversLayout;

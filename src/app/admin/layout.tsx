'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { PortalSidebarClean } from '@/components/ui/portal-sidebar-clean';
import { DashboardHeader } from '@/components/dashboard/header';
import { ChatWidget } from '@/components/chat/ChatWidget';
import { logout } from '@/lib/auth';
import { useBreakpoints } from '@/hooks/use-mobile';
import { ResponsiveContainer } from '@/components/ui/responsive-container';

const PUBLIC_ROUTES = ['/admin/login', '/admin/forgot-password'];
const ALLOWED_ROLES = ['ADMIN', 'SUPER_ADMIN', 'CONTADORA'];

function LoadingScreen({ message = "Verificando autenticación..." }: { message?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center w-full">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
        router.replace('/admin/login');
        return;
      }

      try {
        const idTokenResult = await user.getIdTokenResult();
        const role = idTokenResult.claims.role as string;
        setUserRole(role);

        if (!role || !ALLOWED_ROLES.includes(role)) {
          const redirectMap: Record<string, string> = {
            'BUSINESS': '/delivery/dashboard',
            'DRIVER': '/repartidores/dashboard',
          };

          if (role && redirectMap[role]) {
            router.replace(redirectMap[role]);
          } else {
            router.replace('/admin/login');
          }
          return;
        }
      } catch (error) {
        console.error('Error checking user role:', error);
        router.replace('/admin/login');
        return;
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

  if (!user || (userRole && !ALLOWED_ROLES.includes(userRole))) {
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
    <div className="min-h-screen flex w-full bg-gradient-to-br from-blue-50 to-blue-100">
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
      
      {/* AI Chatbot for Admin Portal */}
      {user && ALLOWED_ROLES.includes(userRole || '') && (
        <ChatWidget 
          userRole="ADMIN" 
          userId={user.uid}
          contextData={{
            portal: 'admin',
            userRole: userRole,
            userName: user.displayName,
            userEmail: user.email
          }}
        />
      )}
    </div>
  );
}

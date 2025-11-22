'use client';

import React, { useState, useEffect } from 'react';
import { useBreakpoints } from '@/hooks/use-mobile';
import { ResponsiveNavigation } from '@/components/navigation/responsive-navigation';
import { ChatWidget } from '@/components/chat/ChatWidget';
import { cn } from '@/lib/utils';

interface LayoutNavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  children?: LayoutNavItem[];
  permission?: string;
  description?: string;
}

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  portal: 'admin' | 'business' | 'repartidores';
  user?: {
    name: string;
    email: string;
    role?: string;
    avatar?: string;
  };
  navigationItems: LayoutNavItem[];
  onLogout?: () => void;
  className?: string;
  showChatbot?: boolean;
  notifications?: number;
  sidebarCollapsed?: boolean;
  onSidebarToggle?: (collapsed: boolean) => void;
}

export function ResponsiveLayout({
  children,
  portal,
  user,
  navigationItems,
  onLogout,
  className = '',
  showChatbot = true,
  notifications = 0,
  sidebarCollapsed = false,
  onSidebarToggle: _onSidebarToggle
}: ResponsiveLayoutProps) {
  const { isMobile, isTablet } = useBreakpoints();
  const [mounted, setMounted] = useState(false);

  // Handle hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return a loading state that matches the expected layout
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="animate-pulse">
          <div className="h-16 bg-white border-b"></div>
          <div className="flex">
            <div className="w-64 h-screen bg-gray-200 hidden lg:block"></div>
            <div className="flex-1 p-6">
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const portalNames = {
    admin: 'BeFast Admin',
    business: 'BeFast Delivery',
    repartidores: 'BeFast Repartidor'
  };

  const ChatbotComponent = () => {
    if (!showChatbot) return null;

    // Map portal names to userRole for ChatWidget
    const getUserRole = () => {
      switch (portal) {
        case 'admin':
          return 'ADMIN' as const;
        case 'business':
          return 'BUSINESS' as const;
        case 'repartidores':
          return 'DRIVER' as const;
        default:
          return 'WELCOME' as const;
      }
    };

    return (
      <ChatWidget
        userRole={getUserRole()}
        userId={user?.email}
        contextData={{
          portal,
          userRole: user?.role,
          userName: user?.name,
          userEmail: user?.email
        }}
      />
    );
  };

  // Mobile Layout
  if (isMobile) {
    return (
      <div className={cn("min-h-screen bg-gray-50", className)}>
        <ResponsiveNavigation
          items={navigationItems}
          user={user}
          onLogout={onLogout}
          portalName={portalNames[portal]}
          notifications={notifications}
        />
        
        {/* Main Content */}
        <main className="pb-20"> {/* Extra padding for mobile navigation */}
          <div className="container mx-auto px-4 py-4 max-w-full">
            {children}
          </div>
        </main>

        {/* Mobile Chatbot */}
        <ChatbotComponent />
      </div>
    );
  }

  // Tablet Layout
  if (isTablet) {
    return (
      <div className={cn("min-h-screen bg-gray-50", className)}>
        <ResponsiveNavigation
          items={navigationItems}
          user={user}
          onLogout={onLogout}
          portalName={portalNames[portal]}
          notifications={notifications}
        />
        
        {/* Main Content */}
        <main className="lg:ml-64">
          <div className="container mx-auto px-6 py-6 max-w-none">
            {children}
          </div>
        </main>

        {/* Tablet Chatbot */}
        <ChatbotComponent />
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className={cn("min-h-screen bg-gray-50 flex", className)}>
      {/* Sidebar Navigation */}
      <div className={cn(
        "transition-all duration-300 ease-in-out",
        sidebarCollapsed ? "w-16" : "w-64"
      )}>
        <ResponsiveNavigation
          items={navigationItems}
          user={user}
          onLogout={onLogout}
          portalName={portalNames[portal]}
          notifications={notifications}
          className={sidebarCollapsed ? "w-16" : "w-64"}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Header Bar (optional for desktop) */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-gray-900">
                {portalNames[portal]}
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              {user && (
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.role}</p>
                  </div>
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {user.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-none">
            {children}
          </div>
        </main>

        {/* Footer (optional) */}
        <footer className="bg-white border-t border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              © 2024 BeFast. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>Portal {portal}</span>
              <span>•</span>
              <span>Versión 2.0.0</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Desktop Chatbot */}
      <ChatbotComponent />
    </div>
  );
}

// Specific layout components for each portal
interface PortalLayoutProps {
  children: React.ReactNode;
  user?: ResponsiveLayoutProps['user'];
  onLogout?: () => void;
  className?: string;
  showChatbot?: boolean;
  notifications?: number;
}

export function AdminLayout({
  children,
  user,
  onLogout,
  className,
  showChatbot,
  notifications
}: PortalLayoutProps) {
  const adminNavItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      href: '/admin/dashboard',
      icon: ({ className }: { className?: string }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
        </svg>
      )
    },
    {
      id: 'solicitudes',
      label: 'Solicitudes',
      href: '/admin/solicitudes',
      icon: ({ className }: { className?: string }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      badge: '3'
    },
    {
      id: 'management',
      label: 'Gestión',
      href: '#',
      icon: ({ className }: { className?: string }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      children: [
        {
          id: 'repartidores',
          label: 'Repartidores',
          href: '/admin/repartidores',
          icon: ({ className }: { className?: string }) => (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          )
        },
        {
          id: 'negocios',
          label: 'Negocios',
          href: '/admin/negocios',
          icon: ({ className }: { className?: string }) => (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          )
        }
      ]
    },
    {
      id: 'reports',
      label: 'Reportes',
      href: '/admin/reports',
      icon: ({ className }: { className?: string }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    }
  ];

  return (
    <ResponsiveLayout
      portal="admin"
      navigationItems={adminNavItems}
      user={user}
      onLogout={onLogout}
      className={className}
      showChatbot={showChatbot}
      notifications={notifications}
    >
      {children}
    </ResponsiveLayout>
  );
}

export function BusinessLayout({
  children,
  user,
  onLogout,
  className,
  showChatbot,
  notifications
}: PortalLayoutProps) {
  const businessNavItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      href: '/delivery/dashboard',
      icon: ({ className }: { className?: string }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
        </svg>
      )
    },
    {
      id: 'new-order',
      label: 'Nuevo Pedido',
      href: '/delivery/new-order',
      icon: ({ className }: { className?: string }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      )
    },
    {
      id: 'orders',
      label: 'Mis Pedidos',
      href: '/delivery/orders',
      icon: ({ className }: { className?: string }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      id: 'credits',
      label: 'Créditos',
      href: '/delivery/buy-credits',
      icon: ({ className }: { className?: string }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      )
    }
  ];

  return (
    <ResponsiveLayout
      portal="business"
      navigationItems={businessNavItems}
      user={user}
      onLogout={onLogout}
      className={className}
      showChatbot={showChatbot}
      notifications={notifications}
    >
      {children}
    </ResponsiveLayout>
  );
}

export function DriverLayout({
  children,
  user,
  onLogout,
  className,
  showChatbot,
  notifications
}: PortalLayoutProps) {
  const driverNavItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      href: '/repartidores/dashboard',
      icon: ({ className }: { className?: string }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
        </svg>
      )
    },
    {
      id: 'wallet',
      label: 'Mi Billetera',
      href: '/repartidores/wallet',
      icon: ({ className }: { className?: string }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      )
    },
    {
      id: 'reports',
      label: 'Mi Perfil',
      href: '/repartidores/reports',
      icon: ({ className }: { className?: string }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
    {
      id: 'support',
      label: 'Soporte',
      href: '/repartidores/support',
      icon: ({ className }: { className?: string }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ];

  return (
    <ResponsiveLayout
      portal="repartidores"
      navigationItems={driverNavItems}
      user={user}
      onLogout={onLogout}
      className={className}
      showChatbot={showChatbot}
      notifications={notifications}
    >
      {children}
    </ResponsiveLayout>
  );
}
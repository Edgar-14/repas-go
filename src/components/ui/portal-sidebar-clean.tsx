'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { LogOut, Menu, X } from 'lucide-react';
import { usePortalTheme } from '@/hooks/use-portal-theme';
import { getNavigationForPortal } from '@/constants/navigation';
import { cn } from '@/lib/utils';

interface PortalSidebarCleanProps {
  onSignOut: () => void;
  user?: any;
  loading?: boolean;
  onClose?: () => void;
  isMobile?: boolean;
}

const PORTAL_CONFIG = {
  admin: {
    title: 'Panel Administración',
    logo: '/befast-logo-admin.svg',
    colors: {
      primary: '#3B82F6',
      secondary: '#1E40AF',
      light: '#60A5FA',
      background: '#FFFFFF' // Color blanco uniforme
    }
  },
  delivery: {
    title: 'Portal Empresas',
    logo: '/logo-befast-delivery.svg',
    colors: {
      primary: '#FF7300',
      secondary: '#EA580C',
      light: '#FB923C',
      background: '#FFFFFF' // Color blanco uniforme
    }
  },
  repartidores: {
    title: 'Portal Repartidores',
    logo: '/logo-befast-repartidores.svg',
    colors: {
      primary: '#10B981',
      secondary: '#059669',
      light: '#34D399',
      background: '#FFFFFF' // Color blanco uniforme
    }
  }
} as const;

export function PortalSidebarClean({ 
  onSignOut, 
  user, 
  loading, 
  onClose,
  isMobile = false 
}: PortalSidebarCleanProps) {
  const pathname = usePathname();
  const { portal } = usePortalTheme();
  const navigationItems = getNavigationForPortal(portal);
  const config = PORTAL_CONFIG[portal] || PORTAL_CONFIG.admin;
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLinkClick = () => {
    if (isMobile && onClose) {
      onClose();
    }
  };

  return (
    <div 
      className={cn(
        'h-full transition-all duration-300 ease-in-out',
        'flex flex-col shadow-2xl',
        isCollapsed && !isMobile ? 'w-16' : 'w-64',
        isMobile ? 'w-64 overflow-y-auto' : ''
      )}
      style={{
        backgroundColor: config.colors.background,
        color: 'black'
      }}
    >
      {/* Header */}
      <div className="flex items-center p-5 border-b border-blue-200">
        <div className={cn(
          "flex items-center gap-3",
          isCollapsed ? "justify-center w-full" : ""
        )}>
          <div className="w-10 h-10 flex items-center justify-center">
            <Image
              src={config.logo}
              alt={`BeFast ${config.title} Logo`}
              width={40}
              height={40}
              className="w-full h-full object-contain drop-shadow-lg"
              priority
            />
          </div>
          {!isCollapsed && (
            <div>
              <h2 className="text-lg font-semibold text-black">{config.title}</h2>
              <p className="text-sm text-black">
                {user?.displayName || user?.email || 'Usuario'}
              </p>
            </div>
          )}
        </div>
      </div>

        {/* Navigation - Scrollable */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          <ul className="space-y-2">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              const IconComponent = item.icon;
              
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group',
                      isCollapsed ? 'justify-center' : '',
                      isActive 
                        ? 'shadow-lg backdrop-blur-sm' 
                        : 'hover:bg-black/5 hover:shadow-md'
                    )}
                    style={{
                      background: isActive ? `linear-gradient(135deg, ${config.colors.primary} 0%, ${config.colors.secondary} 100%)` : 'transparent',
                      boxShadow: isActive ? `0 4px 12px ${config.colors.primary}40, 0 2px 4px rgba(0,0,0,0.1)` : 'none'
                    }}
                    onClick={handleLinkClick}
                  >
                    <IconComponent 
                      className="w-5 h-5 flex-shrink-0" 
                      style={{
                        color: isActive ? 'white' : config.colors.primary
                      }}
                    />
                    {!isCollapsed && (
                      <span 
                        className="font-medium"
                        style={{
                          color: isActive ? 'white' : config.colors.primary
                        }}
                      >
                        {item.label}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer - Sticky at bottom */}
        <div className="flex-shrink-0 p-4 border-t border-blue-200 bg-white">
          <div className="flex flex-col items-center space-y-4">
            {/* Toggle Icon - Only show on desktop */}
            {!isMobile && (
              <div
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="flex items-center w-8 h-8 cursor-pointer hover:bg-black/5 rounded-lg transition-colors justify-center"
              >
                {isCollapsed ? (
                  <Menu className="w-5 h-5" style={{ color: config.colors.primary }} />
                ) : (
                  <X className="w-5 h-5" style={{ color: config.colors.primary }} />
                )}
              </div>
            )}
            
            {/* Close button for mobile */}
            {isMobile && onClose && (
              <div
                onClick={onClose}
                className="flex items-center w-8 h-8 cursor-pointer hover:bg-black/5 rounded-lg transition-colors justify-center"
              >
                <X className="w-5 h-5" style={{ color: config.colors.primary }} />
              </div>
            )}
            
            {/* Sign Out Icon */}
            <div
              onClick={onSignOut}
              className="flex items-center w-8 h-8 cursor-pointer hover:bg-black/5 rounded-lg transition-colors justify-center"
            >
              <LogOut className="w-5 h-5" style={{ color: config.colors.primary }} />
            </div>
          </div>
        </div>
      </div>
  );
}

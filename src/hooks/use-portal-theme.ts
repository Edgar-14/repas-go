"use client";

import { usePathname } from 'next/navigation';
import { type PortalType, PORTAL_COLORS, generatePortalCSSVars } from '@/constants/portal-colors';
import { useEffect } from 'react';

export function usePortalTheme(): { portal: PortalType; colors: typeof PORTAL_COLORS[PortalType] } {
  const pathname = usePathname();
  
  // Determine current portal based on pathname
  const portal: PortalType = pathname.startsWith('/admin') 
    ? 'admin' 
    : pathname.startsWith('/delivery') 
    ? 'delivery' 
    : pathname.startsWith('/repartidores') 
    ? 'repartidores' 
    : 'delivery'; // default fallback to delivery

  const colors = PORTAL_COLORS[portal];

  // Set CSS custom properties for dynamic theming
  useEffect(() => {
    const root = document.documentElement;
    const cssVars = generatePortalCSSVars(portal);
    
    Object.entries(cssVars).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });

    // Add portal-specific class to body for conditional styling
    document.body.className = document.body.className.replace(/portal-\w+/g, '');
    document.body.classList.add(`portal-${portal}`);

    return () => {
      // Cleanup on unmount
      Object.keys(cssVars).forEach(property => {
        root.style.removeProperty(property);
      });
      document.body.className = document.body.className.replace(/portal-\w+/g, '');
    };
  }, [portal]);

  return { portal, colors };
}
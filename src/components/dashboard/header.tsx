'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import { UserNav } from './user-nav';
import { cn } from '@/lib/utils';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BreadcrumbItem {
  href: string;
  label: string;
  isLast: boolean;
}

const getPortalFromPath = (pathname: string): 'admin' | 'delivery' | 'repartidores' => {
  if (pathname.startsWith('/admin')) return 'admin';
  if (pathname.startsWith('/delivery')) return 'delivery';
  return 'repartidores';
};

const PORTAL_STYLES = {
  admin: {
    header: "bg-blue-50/80 border-blue-200 shadow-blue-200/20"
  },
  delivery: {
    header: "bg-orange-50/80 border-orange-200 shadow-orange-200/20"
  },
  repartidores: {
    header: "bg-emerald-50/80 border-emerald-200 shadow-emerald-200/20"
  }
};

const generateBreadcrumbs = (pathname: string): BreadcrumbItem[] => {
  const pathSegments = pathname.split('/').filter(Boolean);

  const generatedCrumbs = pathSegments
    .map((segment, index) => {
      let label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
      const href = '/' + pathSegments.slice(0, index + 1).join('/');
      const isLast = index === pathSegments.length - 1;

      if (segment === 'admin' && index === 0) return null;
      if (segment === 'delivery' && index === 0) return null;
      if (segment === 'repartidores' && index === 0) return null;
      
      if (segment.length > 20 && !label.includes(' ')) {
        label = 'Detalles';
      }
      
      return { href, label, isLast };
    })
    .filter((item): item is BreadcrumbItem => item !== null);

  if (generatedCrumbs.length > 0 && generatedCrumbs[0]?.label !== 'Dashboard') {
    let rootLabel = 'Dashboard';
    let rootHref = '/dashboard';
    
    if (pathname.startsWith('/admin')) {
      rootLabel = 'Admin';
      rootHref = '/admin/dashboard';
    } else if (pathname.startsWith('/delivery')) {
      rootLabel = 'Delivery';
      rootHref = '/delivery/dashboard';
    } else if (pathname.startsWith('/repartidores')) {
      rootLabel = 'Repartidores';
      rootHref = '/repartidores/dashboard';
    }
    
    return [{ href: rootHref, label: rootLabel, isLast: false }, ...generatedCrumbs];
  }
  
  return generatedCrumbs.length > 0 
    ? generatedCrumbs 
    : [{ href: pathname, label: 'Dashboard', isLast: true }];
};

interface DashboardHeaderProps {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

export function DashboardHeader({ onMenuClick, showMenuButton = false }: DashboardHeaderProps) {
  const pathname = usePathname();
  const portal = getPortalFromPath(pathname);
  const styles = PORTAL_STYLES[portal];
  
  const breadcrumbs = React.useMemo(() => {
    return generateBreadcrumbs(pathname);
  }, [pathname]);

  return (
    <header className={cn(
      "sticky top-0 z-20 flex h-16 items-center gap-4 border-b backdrop-blur-sm shadow-sm",
      showMenuButton ? "px-4" : "pl-5 pr-4",
      styles.header
    )}>
      {/* Mobile Menu Button */}
      {showMenuButton && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuClick}
          className="md:hidden"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      )}

      {/* Breadcrumbs - Hidden on mobile when menu button is shown */}
      <div className={cn(
        "hidden md:block",
        showMenuButton && "ml-2"
      )}>
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={crumb.href}>
                <BreadcrumbItem>
                  {crumb.isLast ? (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link href={crumb.href}>{crumb.label}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Mobile Title - Show current page on mobile */}
      {showMenuButton && (
        <div className="block md:hidden">
          <h1 className="text-lg font-semibold">
            {breadcrumbs[breadcrumbs.length - 1]?.label || 'Dashboard'}
          </h1>
        </div>
      )}
      
      <div className="ml-auto flex items-center gap-4">
        <UserNav />
      </div>
    </header>
  );
}
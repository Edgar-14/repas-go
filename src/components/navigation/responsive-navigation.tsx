'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  Menu, 
  ChevronDown, 
  ChevronRight, 
  Bell,
  User,
  Settings,
  LogOut,
  Search
} from 'lucide-react';
import { useBreakpoints } from '@/hooks/use-mobile';
import { usePortalTheme } from '@/hooks/use-portal-theme';
import { cn } from '@/lib/utils';

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  children?: NavItem[];
  permission?: string;
  description?: string;
}

interface ResponsiveNavigationProps {
  items: NavItem[];
  user?: {
    name: string;
    email: string;
    avatar?: string;
    role?: string;
  };
  onLogout?: () => void;
  className?: string;
  portalName?: string;
  notifications?: number;
}

export function ResponsiveNavigation({
  items,
  user,
  onLogout,
  className = '',
  portalName = 'BeFast',
  notifications = 0
}: ResponsiveNavigationProps) {
  const { isMobile } = useBreakpoints();
  const { portal, colors } = usePortalTheme();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // Auto-close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Auto-expand parent items if child is active
  useEffect(() => {
    const expandedSet = new Set<string>();
    
    const findActiveParent = (navItems: NavItem[], currentPath: string) => {
      navItems.forEach(item => {
        if (item.children) {
          const hasActiveChild = item.children.some(child => child.href === currentPath);
          if (hasActiveChild) {
            expandedSet.add(item.id);
          }
          findActiveParent(item.children, currentPath);
        }
      });
    };

    findActiveParent(items, pathname);
    setExpandedItems(expandedSet);
  }, [items, pathname]);

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const isItemActive = (item: NavItem): boolean => {
    if (item.href === pathname) return true;
    if (item.children) {
      return item.children.some(child => isItemActive(child));
    }
    return pathname.startsWith(item.href) && item.href !== '/';
  };

  const filterItems = (navItems: NavItem[], query: string): NavItem[] => {
    if (!query) return navItems;
    
    return navItems.filter(item => {
      const matchesQuery = item.label.toLowerCase().includes(query.toLowerCase()) ||
                          item.description?.toLowerCase().includes(query.toLowerCase());
      
      if (matchesQuery) return true;
      
      if (item.children) {
        const filteredChildren = filterItems(item.children, query);
        return filteredChildren.length > 0;
      }
      
      return false;
    });
  };

  const filteredItems = filterItems(items, searchQuery);

  const NavItemComponent = ({ 
    item, 
    level = 0, 
    isInSheet = false 
  }: { 
    item: NavItem; 
    level?: number; 
    isInSheet?: boolean;
  }) => {
    const isActive = isItemActive(item);
    const isExpanded = expandedItems.has(item.id);
    const hasChildren = item.children && item.children.length > 0;
    const IndentLevel = level * (isInSheet ? 16 : 12);

    const baseClasses = cn(
      "flex items-center justify-between w-full rounded-lg transition-all duration-200",
      "hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-opacity-50",
      {
        'text-white bg-white bg-opacity-20': isActive && level === 0,
        'text-white bg-white bg-opacity-10': isActive && level > 0,
        'text-white hover:bg-white': !isActive,
        'px-3 py-2': isInSheet,
        'px-4 py-3': !isInSheet,
        'text-sm': isInSheet,
        'text-base': !isInSheet
      }
    );

    const ItemContent = () => (
      <>
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <item.icon className={cn(
            "flex-shrink-0",
            isInSheet ? "h-4 w-4" : "h-5 w-5"
          )} />
          <span className="font-medium truncate">{item.label}</span>
          {item.badge && (
            <Badge 
              variant="secondary" 
              className="ml-2 bg-white bg-opacity-20 text-white border-white border-opacity-30"
            >
              {item.badge}
            </Badge>
          )}
        </div>
        {hasChildren && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleExpanded(item.id);
            }}
            className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        )}
      </>
    );

    return (
      <div style={{ marginLeft: `${IndentLevel}px` }}>
        {hasChildren ? (
          <button
            className={baseClasses}
            onClick={() => toggleExpanded(item.id)}
          >
            <ItemContent />
          </button>
        ) : (
          <Link href={item.href} className={baseClasses}>
            <ItemContent />
          </Link>
        )}
        
        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.children!.map((child) => (
              <NavItemComponent 
                key={child.id} 
                item={child} 
                level={level + 1}
                isInSheet={isInSheet}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const SidebarContent = ({ isInSheet = false }: { isInSheet?: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={cn(
        "p-6 border-b border-white border-opacity-20",
        isInSheet && "p-4"
      )}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">B</span>
          </div>
          <div>
            <h2 className="text-white font-bold text-lg">{portalName}</h2>
            <p className="text-white text-opacity-70 text-xs capitalize">
              Portal {portal}
            </p>
          </div>
        </div>
      </div>

      {/* Search (mobile only) */}
      {isInSheet && (
        <div className="p-4 border-b border-white border-opacity-20">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white text-opacity-70 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white bg-opacity-20 text-white placeholder-white placeholder-opacity-70 rounded-lg border border-white border-opacity-30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
            />
          </div>
        </div>
      )}

      {/* Navigation Items */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-2">
          {filteredItems.map((item) => (
            <NavItemComponent 
              key={item.id} 
              item={item}
              isInSheet={isInSheet}
            />
          ))}
        </div>
      </ScrollArea>

      {/* User Section */}
      {user && (
        <div className={cn(
          "p-4 border-t border-white border-opacity-20",
          isInSheet && "p-3"
        )}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white font-medium text-sm truncate">{user.name}</p>
              <p className="text-white text-opacity-70 text-xs truncate">{user.role}</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-white hover:bg-white hover:bg-opacity-20"
              onClick={() => router.push(`/${portal}/settings`)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Configuración
            </Button>
            {onLogout && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-white hover:bg-white hover:bg-opacity-20"
                onClick={onLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );

  // Mobile Navigation
  if (isMobile) {
    return (
      <>
        {/* Mobile Top Bar */}
        <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent 
                  side="left" 
                  className={`w-80 p-0 ${colors.gradient} border-none`}
                >
                  <SidebarContent isInSheet={true} />
                </SheetContent>
              </Sheet>
              
              <h1 className="font-semibold text-gray-900">{portalName}</h1>
            </div>

            <div className="flex items-center gap-2">
              {notifications > 0 && (
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0">
                    {notifications}
                  </Badge>
                </Button>
              )}
              
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Desktop/Tablet Sidebar
  return (
    <Card className={cn(
      "h-screen w-64 rounded-none border-r",
      colors.gradient,
      className
    )}>
      <CardContent className="p-0 h-full">
        <SidebarContent />
      </CardContent>
    </Card>
  );
}
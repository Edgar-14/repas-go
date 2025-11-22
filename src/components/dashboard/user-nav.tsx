'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { COLLECTIONS } from '@/lib/collections';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { logout } from '@/lib/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type UserRole = 'ADMIN' | 'SUPER_ADMIN' | 'CONTADORA' | 'businesses' | 'DRIVER';

interface UserData {
  name?: string;
  fullName?: string;
  businessName?: string;
  avatarUrl?: string;
}

const useUserData = (user: any, role: string | null) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user || !role || role === 'loading') {
        setIsLoading(false);
        return;
      }

      try {
        let docRef;
        
        if (['ADMIN', 'SUPER_ADMIN', 'CONTADORA'].includes(role)) {
          docRef = doc(db, COLLECTIONS.USERS, user.uid);
        } else if (role === 'DRIVER') {
          docRef = doc(db, 'drivers', user.uid); // Using DRIVERS collection per BEFAST FLUJO FINAL
        } else if (role === 'businesses') {
          docRef = doc(db, 'businesses', user.uid); // Using BUSINESS collection per BEFAST FLUJO FINAL
        }

        if (docRef) {
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserData(docSnap.data() as UserData);
          } else if (role === 'DRIVER') {
            const appDocRef = doc(db, 'driverApplications', user.uid);
            const appDocSnap = await getDoc(appDocRef);
            if (appDocSnap.exists()) {
              setUserData(appDocSnap.data() as UserData);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [user, role]);

  return { userData, isLoading };
};

const getPortalFromPath = (pathname: string): 'admin' | 'delivery' | 'repartidores' | null => {
  if (pathname.startsWith('/admin')) return 'admin';
  if (pathname.startsWith('/delivery')) return 'delivery';
  if (pathname.startsWith('/repartidores')) return 'repartidores';
  return null;
};

const getNavigationLinks = (role: UserRole, portal: string | null) => {
  const baseLinks = {
    profile: '/dashboard/settings',
    settings: '/dashboard/settings'
  };

  if (role === 'DRIVER') {
    return {
      profile: '/repartidores/settings',
      settings: '/repartidores/settings'
    };
  }

  if (['ADMIN', 'SUPER_ADMIN', 'CONTADORA'].includes(role)) {
    return {
      profile: '/admin/settings',
      settings: '/admin/settings'
    };
  }

  if (role === 'businesses') {
    return {
      profile: '/delivery/settings',
      settings: '/delivery/settings'
    };
  }

  return baseLinks;
};

export function UserNav() {
  const pathname = usePathname();
  const { user, role, loading } = useAuth();
  const { userData, isLoading } = useUserData(user, role);
  const portal = getPortalFromPath(pathname);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getFallback = () => {
    const name = userData?.name || userData?.fullName || user?.email || 'U';
    return name.substring(0, 2).toUpperCase();
  };
  
  const getDisplayName = () => {
    return userData?.name || userData?.fullName || userData?.businessName || 'Usuario';
  };

  if (!user || loading || isLoading) {
    return null;
  }

  if (portal === 'delivery') {
    return null;
  }

  const links = getNavigationLinks(role as UserRole, portal);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage 
              src={userData?.avatarUrl || user.photoURL || ''} 
              alt={getDisplayName()} 
            />
            <AvatarFallback>{getFallback()}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{getDisplayName()}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href={links.profile}>
              Mi Perfil
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={links.settings}>
              Ajustes
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleLogout}>
          Cerrar Sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
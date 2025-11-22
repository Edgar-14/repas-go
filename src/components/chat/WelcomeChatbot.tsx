'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChatWidget } from './ChatWidget';
import { useAuth } from '@/hooks/useAuth';

interface WelcomeChatbotProps {
  className?: string;
  position?: 'bottom-right' | 'bottom-left';
  minimized?: boolean;
}

export function WelcomeChatbot({
  className,
  position = 'bottom-right',
  minimized = false
}: WelcomeChatbotProps) {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const [contextData, setContextData] = useState<any>({});

  // Build context data based on user authentication status
  useEffect(() => {
    if (!loading) {
      const userContext = {
        isLoggedIn: !!user,
        userRole: role || 'VISITOR',
        email: user?.email || '',
        displayName: user?.displayName || '',
        uid: user?.uid || '',
        // Add portal redirection capabilities
        availablePortals: getAvailablePortals(user, role),
        currentPage: 'landing'
      };
      setContextData(userContext);
    }
  }, [user, role, loading]);

  // Handle intelligent redirection based on user queries and role
  const handlePortalRedirection = (portalType: string) => {
    switch (portalType.toLowerCase()) {
      case 'business':
      case 'delivery':
      case 'restaurant':
      case 'negocio':
        if (user && role === 'BUSINESS') {
          router.push('/delivery/dashboard');
        } else {
          router.push('/delivery/login');
        }
        break;
      
      case 'driver':
      case 'repartidor':
      case 'conductor':
        if (user && role === 'DRIVER') {
          router.push('/repartidores/dashboard');
        } else {
          router.push('/repartidores/login');
        }
        break;
      
      case 'admin':
      case 'administrator':
        if (user && ['ADMIN', 'SUPER_ADMIN'].includes(role || '')) {
          router.push('/admin/dashboard');
        } else {
          router.push('/admin/login');
        }
        break;
      
      case 'market':
      case 'order':
      case 'comida':
        // External market link
        window.open('https://order.befastmarket.com/', '_blank');
        break;
      
      default:
        console.warn(`Unknown portal type: ${portalType}`);
    }
  };

  // Enhanced context data with redirection capabilities
  const enhancedContextData = {
    ...contextData,
    onPortalRedirect: handlePortalRedirection,
    // Add user-specific welcome message
    welcomeMessage: getPersonalizedWelcomeMessage(user, role)
  };

  if (loading) {
    return null; // Don't render until auth state is determined
  }

  return (
    <ChatWidget
      userRole="WELCOME"
      userId={user?.uid}
      position={position}
      minimized={minimized}
      className={className}
      contextData={enhancedContextData}
      initialMessage=""
    />
  );
}

// Helper function to determine available portals based on user authentication
function getAvailablePortals(user: any, role: string | null) {
  const portals = [];
  
  if (user && role) {
    // Authenticated user - show their specific portal
    switch (role) {
      case 'BUSINESS':
        portals.push({ name: 'BeFast Delivery', url: '/delivery/dashboard', type: 'business' });
        break;
      case 'DRIVER':
        portals.push({ name: 'BeFast Repartidores', url: '/repartidores/dashboard', type: 'driver' });
        break;
      case 'ADMIN':
      case 'SUPER_ADMIN':
        portals.push({ name: 'Panel Administrativo', url: '/admin/dashboard', type: 'admin' });
        break;
    }
  } else {
    // Visitor - show all login portals
    portals.push(
      { name: 'BeFast Market', url: 'https://order.befastmarket.com/', type: 'market', external: true },
      { name: 'BeFast Delivery', url: '/delivery/login', type: 'business' },
      { name: 'BeFast Repartidores', url: '/repartidores/login', type: 'driver' }
    );
  }
  
  return portals;
}

// Helper function to create personalized welcome messages
function getPersonalizedWelcomeMessage(user: any, role: string | null) {
  if (user && role) {
    const name = user.displayName || user.email?.split('@')[0] || 'Usuario';
    switch (role) {
      case 'BUSINESS':
        return `¡Hola ${name}! Soy tu asistente de BeFast. Puedo ayudarte con tu portal de delivery o responder cualquier pregunta sobre nuestros servicios.`;
      case 'DRIVER':
        return `¡Hola ${name}! Soy tu asistente de BeFast. Puedo ayudarte con tu portal de repartidores o cualquier consulta sobre el ecosistema.`;
      case 'ADMIN':
      case 'SUPER_ADMIN':
        return `¡Hola ${name}! Soy tu asistente administrativo de BeFast. Puedo ayudarte con consultas del sistema o guiarte a los diferentes portales.`;
      default:
        return `¡Hola ${name}! Soy tu asistente de BeFast. ¿En qué puedo ayudarte hoy?`;
    }
  }
  
  return `¡Hola! Soy tu asistente oficial de BeFast 🚀. Puedo ayudarte a conocer nuestros servicios, guiarte al portal correcto o responder cualquier pregunta sobre el ecosistema BeFast.`;
}
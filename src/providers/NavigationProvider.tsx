/**
 * NavigationProvider.tsx
 * 
 * Provider para Google Navigation SDK que envuelve la aplicación y proporciona
 * contexto de navegación a todos los componentes hijos.
 * 
 * Este provider maneja:
 * - Inicialización del NavigationController
 * - Configuración de términos y condiciones
 * - Gestión del estado de navegación global
 * - Listeners de eventos de navegación
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Platform } from 'react-native';

// Tipos para el Navigation SDK (serán proporcionados por @googlemaps/react-native-navigation-sdk)
// Por ahora, definimos interfaces básicas que coinciden con la API esperada
interface NavigationController {
  startGuidance: () => Promise<void>;
  stopGuidance: () => Promise<void>;
  isNavigating: () => Promise<boolean>;
  // Más métodos según la documentación del SDK
}

interface MapViewController {
  animateCamera: (camera: any) => Promise<void>;
  setMyLocationEnabled: (enabled: boolean) => Promise<void>;
  // Más métodos según la documentación del SDK
}

interface NavigationContextValue {
  navigationController: NavigationController | null;
  mapViewController: MapViewController | null;
  isNavigationReady: boolean;
  isGuidanceActive: boolean;
  
  // Métodos para actualizar los controladores
  setNavigationController: (controller: NavigationController | null) => void;
  setMapViewController: (controller: MapViewController | null) => void;
  
  // Métodos de navegación
  startNavigation: () => Promise<void>;
  stopNavigation: () => Promise<void>;
}

const NavigationContext = createContext<NavigationContextValue | undefined>(undefined);

interface NavigationProviderProps {
  children: ReactNode;
  termsAndConditions?: {
    title: string;
    companyName: string;
    showOnlyDisclaimer?: boolean;
  };
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({
  children,
  termsAndConditions,
}) => {
  const [navigationController, setNavigationController] = useState<NavigationController | null>(null);
  const [mapViewController, setMapViewController] = useState<MapViewController | null>(null);
  const [isGuidanceActive, setIsGuidanceActive] = useState(false);

  // Determinar si los controladores están listos
  const isNavigationReady = navigationController !== null && mapViewController !== null;

  /**
   * Inicia la guía de navegación
   */
  const startNavigation = useCallback(async () => {
    if (!navigationController) {
      console.warn('[NavigationProvider] NavigationController no disponible');
      return;
    }

    try {
      await navigationController.startGuidance();
      setIsGuidanceActive(true);
      console.log('[NavigationProvider] Guía de navegación iniciada');
    } catch (error) {
      console.error('[NavigationProvider] Error al iniciar navegación:', error);
      throw error;
    }
  }, [navigationController]);

  /**
   * Detiene la guía de navegación
   */
  const stopNavigation = useCallback(async () => {
    if (!navigationController) {
      console.warn('[NavigationProvider] NavigationController no disponible');
      return;
    }

    try {
      await navigationController.stopGuidance();
      setIsGuidanceActive(false);
      console.log('[NavigationProvider] Guía de navegación detenida');
    } catch (error) {
      console.error('[NavigationProvider] Error al detener navegación:', error);
      throw error;
    }
  }, [navigationController]);

  const contextValue: NavigationContextValue = {
    navigationController,
    mapViewController,
    isNavigationReady,
    isGuidanceActive,
    setNavigationController,
    setMapViewController,
    startNavigation,
    stopNavigation,
  };

  return (
    <NavigationContext.Provider value={contextValue}>
      {children}
    </NavigationContext.Provider>
  );
};

/**
 * Hook personalizado para acceder al contexto de navegación
 */
export const useNavigation = (): NavigationContextValue => {
  const context = useContext(NavigationContext);
  
  if (context === undefined) {
    throw new Error('useNavigation debe usarse dentro de un NavigationProvider');
  }
  
  return context;
};

/**
 * Términos y condiciones por defecto para el Navigation SDK
 * Según los requisitos de Google, se debe mostrar un disclaimer
 */
export const DEFAULT_TERMS_AND_CONDITIONS = {
  title: 'Términos y Condiciones de Navegación',
  companyName: 'BeFast GO',
  showOnlyDisclaimer: true,
};

export default NavigationProvider;

/**
 * useGuidedRoute.ts
 * 
 * Hook para gestionar navegación guiada por etapas (pickup → delivery).
 * 
 * Funcionalidades:
 * - Gestiona rutas multi-etapa (conductor → pickup, pickup → delivery)
 * - Calcula rutas usando Google Routes API
 * - Maneja transiciones entre etapas
 * - Actualiza estado del pedido según progreso
 * - Proporciona información de ETA y distancia
 */

import { useState, useCallback, useEffect } from 'react';
import { firestore } from '../config/firebase';
import { OrderStatus } from '../types/order';

export interface RouteLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

export enum DeliveryStage {
  TO_PICKUP = 'TO_PICKUP', // Conductor → Punto de recogida
  TO_DELIVERY = 'TO_DELIVERY', // Pickup → Punto de entrega
  COMPLETED = 'COMPLETED', // Entrega completada
}

export interface RouteInfo {
  distance: number; // En kilómetros
  duration: number; // En minutos
  polyline: string; // Encoded polyline de Google
  coordinates: Array<{ latitude: number; longitude: number }>; // Coordenadas decodificadas
}

export interface UseGuidedRouteOptions {
  orderId: string;
  driverLocation: RouteLocation | null;
  pickupLocation: RouteLocation;
  deliveryLocation: RouteLocation;
  onStageChange?: (stage: DeliveryStage) => void;
  onArrival?: (stage: DeliveryStage) => void;
}

export interface UseGuidedRouteReturn {
  currentStage: DeliveryStage;
  currentRoute: RouteInfo | null;
  isCalculating: boolean;
  error: string | null;
  
  // Métodos de control
  startRoute: () => Promise<void>;
  completePickup: () => Promise<void>;
  completeDelivery: () => Promise<void>;
  recalculateRoute: () => Promise<void>;
  
  // Información adicional
  eta: number | null; // Tiempo estimado de llegada en minutos
  distanceRemaining: number | null; // Distancia restante en km
}

/**
 * Hook para gestionar navegación guiada por etapas
 */
export const useGuidedRoute = (
  options: UseGuidedRouteOptions
): UseGuidedRouteReturn => {
  const {
    orderId,
    driverLocation,
    pickupLocation,
    deliveryLocation,
    onStageChange,
    onArrival,
  } = options;

  const [currentStage, setCurrentStage] = useState<DeliveryStage>(
    DeliveryStage.TO_PICKUP
  );
  const [currentRoute, setCurrentRoute] = useState<RouteInfo | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eta, setEta] = useState<number | null>(null);
  const [distanceRemaining, setDistanceRemaining] = useState<number | null>(null);

  /**
   * Calcular ruta usando Google Routes API (o Directions API como fallback)
   * Nota: En producción, esto debería usar Google Routes API para mejor precisión
   */
  const calculateRoute = useCallback(
    async (origin: RouteLocation, destination: RouteLocation): Promise<RouteInfo | null> => {
      try {
        setIsCalculating(true);
        setError(null);

        // TODO: Implementar llamada a Routes API
        // Por ahora, retornamos estructura mock que será reemplazada
        // con la integración real del Navigation SDK
        
        const mockRoute: RouteInfo = {
          distance: 5.2,
          duration: 15,
          polyline: '', // El Navigation SDK proporcionará esto
          coordinates: [origin, destination],
        };

        console.log(
          `[useGuidedRoute] Ruta calculada: ${mockRoute.distance}km, ${mockRoute.duration}min`
        );

        return mockRoute;
      } catch (err) {
        console.error('[useGuidedRoute] Error calculating route:', err);
        setError('Error al calcular ruta');
        return null;
      } finally {
        setIsCalculating(false);
      }
    },
    []
  );

  /**
   * Iniciar navegación (primera etapa: conductor → pickup)
   */
  const startRoute = useCallback(async () => {
    if (!driverLocation) {
      setError('Ubicación del conductor no disponible');
      return;
    }

    try {
      console.log('[useGuidedRoute] Iniciando ruta a pickup...');

      // Actualizar estado del pedido
      await firestore().collection('orders').doc(orderId).update({
        status: OrderStatus.STARTED,
        'timing.startedAt': firestore.FieldValue.serverTimestamp(),
      });

      // Calcular ruta a pickup
      const route = await calculateRoute(driverLocation, pickupLocation);
      
      if (route) {
        setCurrentRoute(route);
        setEta(route.duration);
        setDistanceRemaining(route.distance);
        setCurrentStage(DeliveryStage.TO_PICKUP);

        if (onStageChange) {
          onStageChange(DeliveryStage.TO_PICKUP);
        }
      }
    } catch (err) {
      console.error('[useGuidedRoute] Error starting route:', err);
      setError('Error al iniciar navegación');
    }
  }, [orderId, driverLocation, pickupLocation, calculateRoute, onStageChange]);

  /**
   * Completar pickup y continuar a delivery
   */
  const completePickup = useCallback(async () => {
    try {
      console.log('[useGuidedRoute] Completando pickup...');

      // Actualizar estado del pedido
      await firestore().collection('orders').doc(orderId).update({
        status: OrderStatus.PICKED_UP,
        'timing.pickedUpAt': firestore.FieldValue.serverTimestamp(),
      });

      // Notificar llegada
      if (onArrival) {
        onArrival(DeliveryStage.TO_PICKUP);
      }

      // Calcular ruta a delivery
      const route = await calculateRoute(pickupLocation, deliveryLocation);
      
      if (route) {
        setCurrentRoute(route);
        setEta(route.duration);
        setDistanceRemaining(route.distance);
        setCurrentStage(DeliveryStage.TO_DELIVERY);

        if (onStageChange) {
          onStageChange(DeliveryStage.TO_DELIVERY);
        }

        // Actualizar estado a IN_TRANSIT
        await firestore().collection('orders').doc(orderId).update({
          status: OrderStatus.IN_TRANSIT,
        });
      }
    } catch (err) {
      console.error('[useGuidedRoute] Error completing pickup:', err);
      setError('Error al completar recogida');
    }
  }, [orderId, pickupLocation, deliveryLocation, calculateRoute, onStageChange, onArrival]);

  /**
   * Completar delivery
   */
  const completeDelivery = useCallback(async () => {
    try {
      console.log('[useGuidedRoute] Completando delivery...');

      // Actualizar estado del pedido
      await firestore().collection('orders').doc(orderId).update({
        status: OrderStatus.ARRIVED,
        'timing.arrivedAt': firestore.FieldValue.serverTimestamp(),
      });

      setCurrentStage(DeliveryStage.COMPLETED);
      setCurrentRoute(null);
      setEta(null);
      setDistanceRemaining(null);

      if (onArrival) {
        onArrival(DeliveryStage.TO_DELIVERY);
      }

      if (onStageChange) {
        onStageChange(DeliveryStage.COMPLETED);
      }

      console.log('[useGuidedRoute] Delivery completado');
    } catch (err) {
      console.error('[useGuidedRoute] Error completing delivery:', err);
      setError('Error al completar entrega');
    }
  }, [orderId, onStageChange, onArrival]);

  /**
   * Recalcular ruta actual
   */
  const recalculateRoute = useCallback(async () => {
    if (!driverLocation) return;

    console.log('[useGuidedRoute] Recalculando ruta...');

    let origin: RouteLocation;
    let destination: RouteLocation;

    if (currentStage === DeliveryStage.TO_PICKUP) {
      origin = driverLocation;
      destination = pickupLocation;
    } else if (currentStage === DeliveryStage.TO_DELIVERY) {
      origin = driverLocation;
      destination = deliveryLocation;
    } else {
      return;
    }

    const route = await calculateRoute(origin, destination);
    
    if (route) {
      setCurrentRoute(route);
      setEta(route.duration);
      setDistanceRemaining(route.distance);
    }
  }, [currentStage, driverLocation, pickupLocation, deliveryLocation, calculateRoute]);

  /**
   * Recalcular ruta cuando cambia la ubicación del conductor
   */
  useEffect(() => {
    if (driverLocation && currentStage !== DeliveryStage.COMPLETED) {
      // Recalcular cada vez que cambia la ubicación
      // En producción, esto debe tener throttling
      recalculateRoute();
    }
  }, [driverLocation, currentStage]);

  return {
    currentStage,
    currentRoute,
    isCalculating,
    error,
    startRoute,
    completePickup,
    completeDelivery,
    recalculateRoute,
    eta,
    distanceRemaining,
  };
};

export default useGuidedRoute;

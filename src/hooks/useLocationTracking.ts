// Hook para tracking de ubicación en tiempo real
import { useState, useEffect, useCallback } from 'react';
import LocationService from '../services/LocationService';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

interface LocationTrackingState {
  location: LocationData | null;
  isTracking: boolean;
  error: string | null;
}

export const useLocationTracking = (driverId: string | null, autoStart: boolean = false) => {
  const [state, setState] = useState<LocationTrackingState>({
    location: null,
    isTracking: false,
    error: null,
  });

  const startTracking = useCallback(async () => {
    if (!driverId) {
      setState(prev => ({
        ...prev,
        error: 'ID de conductor no disponible',
      }));
      return false;
    }

    try {
      const success = await LocationService.startTracking(driverId);
      
      if (success) {
        setState(prev => ({
          ...prev,
          isTracking: true,
          error: null,
        }));
      } else {
        setState(prev => ({
          ...prev,
          error: 'No se pudo iniciar el tracking',
        }));
      }

      return success;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Error al iniciar tracking',
      }));
      return false;
    }
  }, [driverId]);

  const stopTracking = useCallback(() => {
    LocationService.stopTracking();
    setState(prev => ({
      ...prev,
      isTracking: false,
    }));
  }, []);

  const getCurrentLocation = useCallback(async () => {
    try {
      const location = await LocationService.getCurrentLocation();
      
      if (location) {
        setState(prev => ({
          ...prev,
          location,
          error: null,
        }));
      } else {
        setState(prev => ({
          ...prev,
          error: 'No se pudo obtener la ubicación',
        }));
      }

      return location;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Error al obtener ubicación',
      }));
      return null;
    }
  }, []);

  // Auto-start tracking si está habilitado
  useEffect(() => {
    if (autoStart && driverId) {
      startTracking();
    }

    return () => {
      if (state.isTracking) {
        stopTracking();
      }
    };
  }, [autoStart, driverId]);

  return {
    ...state,
    startTracking,
    stopTracking,
    getCurrentLocation,
  };
};

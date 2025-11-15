/**
 * useDriverLocation.ts
 * 
 * Hook personalizado para rastrear y publicar la ubicación del conductor en tiempo real.
 * 
 * Funcionalidades:
 * - Inicia y detiene watchPosition de geolocalización
 * - Publica ubicación a Firestore (drivers/{id}.operational.currentLocation)
 * - Emite ubicación vía socket.io al backend
 * - Maneja permisos de ubicación
 * - Proporciona estado de tracking
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import Geolocation from 'react-native-geolocation-service';
import { Platform, PermissionsAndroid } from 'react-native';
import { firestore } from '../config/firebase';
import { io, Socket } from 'socket.io-client';
import { SOCKET_SERVER_URL } from '@env';

export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number | null;
  heading?: number | null;
  speed?: number | null;
  timestamp?: number;
}

export interface UseDriverLocationOptions {
  driverId: string;
  updateInterval?: number; // En milisegundos, por defecto 5000 (5 segundos)
  enableSocket?: boolean; // Si se debe emitir por socket, por defecto true
  enableFirestore?: boolean; // Si se debe guardar en Firestore, por defecto true
}

export interface UseDriverLocationReturn {
  location: Location | null;
  isTracking: boolean;
  error: string | null;
  startTracking: () => Promise<void>;
  stopTracking: () => void;
  hasPermission: boolean;
}

/**
 * Hook para rastrear ubicación del conductor y publicarla en tiempo real
 */
export const useDriverLocation = (
  options: UseDriverLocationOptions
): UseDriverLocationReturn => {
  const {
    driverId,
    updateInterval = 5000,
    enableSocket = true,
    enableFirestore = true,
  } = options;

  const [location, setLocation] = useState<Location | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const lastUpdateRef = useRef<number>(0);

  /**
   * Solicitar permisos de ubicación
   */
  const requestLocationPermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        ]);

        const hasFine =
          granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] ===
          PermissionsAndroid.RESULTS.GRANTED;
        const hasCoarse =
          granted[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] ===
          PermissionsAndroid.RESULTS.GRANTED;

        const hasPermissionResult = hasFine || hasCoarse;
        setHasPermission(hasPermissionResult);
        return hasPermissionResult;
      } catch (err) {
        console.warn('[useDriverLocation] Error requesting permissions:', err);
        setError('Error solicitando permisos de ubicación');
        return false;
      }
    }

    // iOS: permisos ya configurados en Info.plist
    setHasPermission(true);
    return true;
  }, []);

  /**
   * Publicar ubicación a Firestore
   */
  const publishToFirestore = useCallback(
    async (loc: Location) => {
      if (!enableFirestore || !driverId) return;

      try {
        await firestore().collection('drivers').doc(driverId).update({
          'operational.currentLocation': {
            latitude: loc.latitude,
            longitude: loc.longitude,
            accuracy: loc.accuracy,
            heading: loc.heading,
            speed: loc.speed,
            updatedAt: firestore.FieldValue.serverTimestamp(),
          },
        });
      } catch (err) {
        console.error('[useDriverLocation] Error updating Firestore:', err);
      }
    },
    [driverId, enableFirestore]
  );

  /**
   * Publicar ubicación vía socket
   */
  const publishToSocket = useCallback(
    (loc: Location) => {
      if (!enableSocket || !socketRef.current?.connected) return;

      try {
        socketRef.current.emit('updateLocation', {
          driverId,
          location: {
            latitude: loc.latitude,
            longitude: loc.longitude,
            accuracy: loc.accuracy,
            heading: loc.heading,
            speed: loc.speed,
            timestamp: loc.timestamp,
          },
        });
      } catch (err) {
        console.error('[useDriverLocation] Error emitting to socket:', err);
      }
    },
    [driverId, enableSocket]
  );

  /**
   * Manejar actualización de ubicación
   */
  const handleLocationUpdate = useCallback(
    (position: any) => {
      const now = Date.now();
      
      // Throttle: solo actualizar si ha pasado el intervalo configurado
      if (now - lastUpdateRef.current < updateInterval) {
        return;
      }

      lastUpdateRef.current = now;

      const newLocation: Location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        heading: position.coords.heading,
        speed: position.coords.speed,
        timestamp: position.timestamp,
      };

      setLocation(newLocation);
      setError(null);

      // Publicar ubicación
      publishToFirestore(newLocation);
      publishToSocket(newLocation);
    },
    [updateInterval, publishToFirestore, publishToSocket]
  );

  /**
   * Manejar errores de geolocalización
   */
  const handleLocationError = useCallback((err: any) => {
    console.error('[useDriverLocation] Geolocation error:', err);
    setError(`Error de ubicación: ${err.message || 'Desconocido'}`);
  }, []);

  /**
   * Iniciar tracking de ubicación
   */
  const startTracking = useCallback(async () => {
    if (isTracking) {
      console.log('[useDriverLocation] Ya está rastreando');
      return;
    }

    const permission = await requestLocationPermission();
    if (!permission) {
      setError('Permisos de ubicación denegados');
      return;
    }

    // Conectar socket si está habilitado
    if (enableSocket && !socketRef.current) {
      try {
        socketRef.current = io(SOCKET_SERVER_URL);
        console.log('[useDriverLocation] Socket conectado');
      } catch (err) {
        console.warn('[useDriverLocation] Error conectando socket:', err);
      }
    }

    // Iniciar watchPosition
    try {
      watchIdRef.current = Geolocation.watchPosition(
        handleLocationUpdate,
        handleLocationError,
        {
          enableHighAccuracy: true,
          distanceFilter: 10, // Actualizar cada 10 metros
          interval: updateInterval,
          fastestInterval: Math.floor(updateInterval / 2),
          showLocationDialog: true,
          forceRequestLocation: true,
        }
      );

      setIsTracking(true);
      console.log('[useDriverLocation] Tracking iniciado');
    } catch (err) {
      console.error('[useDriverLocation] Error iniciando watchPosition:', err);
      setError('Error iniciando tracking de ubicación');
    }
  }, [
    isTracking,
    enableSocket,
    updateInterval,
    requestLocationPermission,
    handleLocationUpdate,
    handleLocationError,
  ]);

  /**
   * Detener tracking de ubicación
   */
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      Geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setIsTracking(false);
    console.log('[useDriverLocation] Tracking detenido');
  }, []);

  /**
   * Limpiar al desmontar
   */
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  return {
    location,
    isTracking,
    error,
    startTracking,
    stopTracking,
    hasPermission,
  };
};

export default useDriverLocation;

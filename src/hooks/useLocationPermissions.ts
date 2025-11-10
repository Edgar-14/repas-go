// Hook para gestionar permisos de ubicación
import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { check, request, PERMISSIONS, RESULTS, Permission } from 'react-native-permissions';

interface LocationPermissionsState {
  hasPermission: boolean;
  isLoading: boolean;
  error: string | null;
}

export const useLocationPermissions = () => {
  const [state, setState] = useState<LocationPermissionsState>({
    hasPermission: false,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      const permission = Platform.select({
        android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
        ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
      }) as Permission;

      const result = await check(permission);

      setState({
        hasPermission: result === RESULTS.GRANTED,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState({
        hasPermission: false,
        isLoading: false,
        error: 'Error al verificar permisos',
      });
    }
  };

  const requestPermissions = async (): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      const permission = Platform.select({
        android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
        ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
      }) as Permission;

      const result = await request(permission);
      const granted = result === RESULTS.GRANTED;

      setState({
        hasPermission: granted,
        isLoading: false,
        error: granted ? null : 'Permiso denegado',
      });

      // Si se concedió en iOS, solicitar permiso "siempre"
      if (granted && Platform.OS === 'ios') {
        const alwaysPermission = PERMISSIONS.IOS.LOCATION_ALWAYS;
        await request(alwaysPermission);
      }

      // Si se concedió en Android 10+, solicitar permiso en segundo plano
      if (granted && Platform.OS === 'android' && Platform.Version >= 29) {
        const backgroundPermission = PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION;
        await request(backgroundPermission);
      }

      return granted;
    } catch (error) {
      setState({
        hasPermission: false,
        isLoading: false,
        error: 'Error al solicitar permisos',
      });
      return false;
    }
  };

  return {
    ...state,
    requestPermissions,
    checkPermissions,
  };
};

import { Platform, PermissionsAndroid } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import { firestore, COLLECTIONS } from '../config/firebase';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

interface LocationUpdate {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

class LocationService {
  private watchId: number | null = null;
  private driverId: string | null = null;
  private updateInterval: number = 10000; // 10 segundos

  // Solicitar permisos de ubicación
  async requestLocationPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        const fineLocation = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        
        if (fineLocation !== PermissionsAndroid.RESULTS.GRANTED) {
          return false;
        }

        // Para Android 10+ (API 29+), solicitar permiso de ubicación en segundo plano
        if (Platform.Version >= 29) {
          const backgroundLocation = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION
          );
          return backgroundLocation === PermissionsAndroid.RESULTS.GRANTED;
        }

        return true;
      } else {
        // iOS
        const status = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
        if (status === RESULTS.GRANTED) {
          const alwaysStatus = await request(PERMISSIONS.IOS.LOCATION_ALWAYS);
          return alwaysStatus === RESULTS.GRANTED;
        }
        return false;
      }
    } catch (error) {
      console.error('[LocationService] Error requesting location permissions:', error);
      return false;
    }
  }

  async checkLocationPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        return granted;
      } else {
        const status = await check(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
        return status === RESULTS.GRANTED;
      }
    } catch (error) {
      console.error('[LocationService] Error checking location permissions:', error);
      return false;
    }
  }

  async startTracking(driverId: string): Promise<boolean> {
    this.driverId = driverId;

    // Verificar permisos
    const hasPermission = await this.checkLocationPermissions();
    if (!hasPermission) {
      const granted = await this.requestLocationPermissions();
      if (!granted) {
        console.error('[LocationService] Location permissions not granted');
        return false;
      }
    }

    this.watchId = Geolocation.watchPosition(
      (position) => {
        const locationUpdate: LocationUpdate = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        };

        this.updateDriverLocation(locationUpdate);
      },
      (error) => {
        console.error('[LocationService] Location error:', error);
      },
      {
        accuracy: {
          android: 'high',
          ios: 'best',
        },
        enableHighAccuracy: true,
        distanceFilter: 10, // Actualizar cada 10 metros
        interval: this.updateInterval, // Cada 10 segundos
        fastestInterval: 5000, // Mínimo 5 segundos
        forceRequestLocation: true,
        showLocationDialog: true,
      }
    );

    console.log('[LocationService] Location tracking started for driver:', driverId);
    return true;
  }

  stopTracking(): void {
    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
      console.log('[LocationService] Location tracking stopped');
    }
  }

  private async updateDriverLocation(location: LocationUpdate): Promise<void> {
    if (!this.driverId) {
      return;
    }

    try {
      await firestore()
        .collection(COLLECTIONS.DRIVERS)
        .doc(this.driverId)
        .update({
          'operational.currentLocation': {
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy,
            timestamp: firestore.FieldValue.serverTimestamp(),
          },
          'operational.lastLocationUpdate': firestore.FieldValue.serverTimestamp(),
        });

      console.log('[LocationService] Driver location updated:', location);
    } catch (error) {
      console.error('[LocationService] Error updating driver location:', error);
    }
  }

  // Obtener ubicación actual una sola vez
  async getCurrentLocation(): Promise<LocationUpdate | null> {
    const hasPermission = await this.checkLocationPermissions();
    if (!hasPermission) {
      const granted = await this.requestLocationPermissions();
      if (!granted) {
        return null;
      }
    }

    return new Promise((resolve) => {
      Geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          });
        },
        (error) => {
          console.error('[LocationService] Error getting current location:', error);
          resolve(null);
        },
        {
          accuracy: {
            android: 'high',
            ios: 'best',
          },
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        }
      );
    });
  }

  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

export default new LocationService();

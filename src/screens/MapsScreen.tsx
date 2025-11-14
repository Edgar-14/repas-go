import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  PermissionsAndroid,
  Platform,
  Text,
  Switch,
  SafeAreaView,
  Alert,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';
import MapViewDirections from 'react-native-maps-directions';
import { io, Socket } from 'socket.io-client';
import { GOOGLE_MAPS_API_KEY } from '../config/keys';
import { SOCKET_SERVER_URL } from '@env';

interface LocationCoords {
  latitude: number;
  longitude: number;
}

const MapsScreen = () => {
  const [isOnline, setIsOnline] = useState(false);
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [destination] = useState<LocationCoords>({
    latitude: 37.7749,
    longitude: -122.4194,
  });

  const mapRef = useRef<MapView | null>(null);
  const socket = useRef<Socket | null>(null);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    console.log('[MapsScreen] GOOGLE_MAPS_API_KEY ->', GOOGLE_MAPS_API_KEY ? 'PRESENT' : 'MISSING/EMPTY');
  }, []);

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        ]);
        const fine = granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED;
        const coarse = granted[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED;
        if (!fine && !coarse) {
          Alert.alert('Permiso denegado', 'Necesitamos permiso de ubicación para mostrar el mapa y seguirte.');
        }
        return fine || coarse;
      } catch (err) {
        console.warn('[MapsScreen] requestLocationPermission error', err);
        return false;
      }
    }
    // iOS: Info.plist debe tener NSLocationWhenInUseUsageDescription
    return true;
  };

  useEffect(() => {
    const startWatching = async () => {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        console.warn('[MapsScreen] Permiso de ubicación denegado');
        return;
      }

      try {
        if (watchIdRef.current !== null) {
          Geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }

        watchIdRef.current = Geolocation.watchPosition(
          (position: any) => {
            const { latitude, longitude } = position.coords;
            const newLocation = { latitude, longitude };
            setLocation(newLocation);

            if (socket.current?.connected && isOnline) {
              try {
                socket.current.emit('updateLocation', { driverId: 'driver-123', location: newLocation });
              } catch (e) {
                console.warn('[MapsScreen] Error emitiendo ubicación', e);
              }
            }

            if (mapRef.current) {
              const region: Region = {
                ...newLocation,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              };
              try {
                mapRef.current.animateToRegion(region, 1000);
              } catch (err) {
                console.warn('[MapsScreen] animateToRegion error', err);
              }
            }
          },
          (error) => {
            console.warn('[MapsScreen] watchPosition error', error);
          },
          { enableHighAccuracy: true, distanceFilter: 10, interval: 5000, fastestInterval: 2000 }
        );
      } catch (err) {
        console.warn('[MapsScreen] Excepción al iniciar watchPosition', err);
      }
    };

    if (isOnline) {
      startWatching();
    } else {
      if (watchIdRef.current !== null) {
        Geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    }

    return () => {
      if (watchIdRef.current !== null) {
        Geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [isOnline]);

  useEffect(() => {
    // Ejemplo seguro: conectar socket si lo necesitas
    // socket.current = io(SOCKET_SERVER_URL); // descomenta si el backend está listo
    return () => {
      if (socket.current) {
        try {
          socket.current.disconnect();
        } catch (e) {
          console.warn('[MapsScreen] Error al desconectar socket', e);
        }
      }
    };
  }, []);

  const onMapReady = () => {
    console.log('[MapsScreen] onMapReady');
  };

  return (
    <SafeAreaView style={styles.container}>
      <MapView
        ref={ref => (mapRef.current = ref)}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: location?.latitude ?? 37.78825,
          longitude: location?.longitude ?? -122.4324,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        showsUserLocation={false}
        onMapReady={onMapReady}
      >
        {location && (
          <Marker coordinate={location} title="Tu Posición">
            <View style={styles.driverMarker} />
          </Marker>
        )}

        <Marker coordinate={destination} title="Destino" pinColor="blue" />

        {location && destination && GOOGLE_MAPS_API_KEY && (
          <MapViewDirections
            origin={location}
            destination={destination}
            apikey={GOOGLE_MAPS_API_KEY}
            strokeWidth={5}
            strokeColor="hotpink"
            onError={(err) => console.warn('[MAPS DIRECTIONS] error', err)}
          />
        )}
      </MapView>

      <View style={styles.controls}>
        <Text style={styles.statusText}>{isOnline ? 'EN LÍNEA' : 'OFFLINE'}</Text>
        <Switch
          trackColor={{ false: "#767577", true: "#81b0ff" }}
          thumbColor={isOnline ? "#f5dd4b" : "#f4f3f4"}
          onValueChange={() => setIsOnline(prev => !prev)}
          value={isOnline}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject },
  controls: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 4,
  },
  statusText: { fontWeight: 'bold', fontSize: 16 },
  driverMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'red',
    borderColor: 'white',
    borderWidth: 2,
  },
});

export default MapsScreen;
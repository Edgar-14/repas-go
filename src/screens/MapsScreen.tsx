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
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';
import { io, Socket } from 'socket.io-client';
// import { SOCKET_SERVER_URL } from '@env'; // El backend de socket no está implementado aún

interface LocationCoords {
  latitude: number;
  longitude: number;
}

const DEFAULT_MAP_REGION = {
  latitude: 19.2499, // Colima, México
  longitude: -103.7271,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

const MapsScreen = () => {
  const [isOnline, setIsOnline] = useState(false);
  const [location, setLocation] = useState<LocationCoords | null>(null);
  // Se obtiene el ID del conductor del estado de Redux
  const driverId = useSelector((state: RootState) => state.auth.driver?.uid);

  const mapRef = useRef<MapView | null>(null);
  const socket = useRef<Socket | null>(null);
  const watchIdRef = useRef<number | null>(null);

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
        }

        watchIdRef.current = Geolocation.watchPosition(
          (position: any) => {
            const { latitude, longitude } = position.coords;
            const newLocation = { latitude, longitude };
            setLocation(newLocation);

            // Emitir ubicación si el socket está conectado y el conductor está en línea
            if (socket.current?.connected && isOnline && driverId) {
              try {
                socket.current.emit('updateLocation', { driverId, location: newLocation });
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
      }
    }

    return () => {
      if (watchIdRef.current !== null) {
        Geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [isOnline, driverId]);

  useEffect(() => {
    // La conexión al socket se manejará en un servicio dedicado cuando el backend esté listo
    // socket.current = io(SOCKET_SERVER_URL);
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

  return (
    <SafeAreaView style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={DEFAULT_MAP_REGION}
        showsUserLocation={false}
      >
        {location && (
          <Marker coordinate={location} title="Tu Posición">
            <View style={styles.driverMarker} />
          </Marker>
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
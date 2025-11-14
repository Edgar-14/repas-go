import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  PermissionsAndroid,
  Platform,
  Text,
  Switch,
  SafeAreaView
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';
import MapViewDirections from 'react-native-maps-directions';
import { io, Socket } from "socket.io-client";
import { GOOGLE_MAPS_API_KEY } from '../config/keys'; // Importación segura
import { SOCKET_SERVER_URL } from '@env'; // Importación segura

// --- TIPOS ---
interface LocationCoords {
  latitude: number;
  longitude: number;
}

const MapsScreen = () => {
  const [isOnline, setIsOnline] = useState(false);
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [destination, setDestination] = useState<LocationCoords>({ // Destino de ejemplo
    latitude: 37.7749,
    longitude: -122.4194,
  });

  const mapRef = useRef<MapView>(null);
  const socket = useRef<Socket | null>(null);

  // 1. Pedir permisos de localización
  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Permiso de Geolocalización',
            message: 'Esta app necesita acceso a tu ubicación para el seguimiento.',
            buttonNeutral: 'Pregúntame Después',
            buttonNegative: 'Cancelar',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    // En iOS, los permisos se solicitan desde Info.plist
    return true;
  };

  // 2. Iniciar/detener seguimiento de ubicación
  useEffect(() => {
    let watchId: number | null = null;

    const startWatching = async () => {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) return;

      watchId = Geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newLocation = { latitude, longitude };
          setLocation(newLocation);

          // 3. Enviar ubicación al backend si está online
          if (socket.current?.connected && isOnline) {
            socket.current.emit('updateLocation', { driverId: 'driver-123', location: newLocation });
          }

          // Centrar el mapa en el conductor
          mapRef.current?.animateToRegion({
            ...newLocation,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }, 1000);
        },
        (error) => {
          console.log(error.code, error.message);
        },
        { enableHighAccuracy: true, distanceFilter: 10, interval: 5000, fastestInterval: 2000 }
      );
    };

    if (isOnline) {
      startWatching();
    }

    // Limpieza al desmontar el componente o al pasar a offline
    return () => {
      if (watchId !== null) {
        Geolocation.clearWatch(watchId);
      }
    };
  }, [isOnline]);

  // 4. Conectar y desconectar del servidor de Sockets
  useEffect(() => {
    if (isOnline) {
      // Conectar al servidor
      // Asegúrate de tener SOCKET_SERVER_URL en tu .env
      // ej: SOCKET_SERVER_URL=http://10.0.2.2:3000 (para emulador Android)
      socket.current = io(SOCKET_SERVER_URL || 'http://10.0.2.2:3000');

      socket.current.on('connect', () => {
        console.log('Conectado al servidor de sockets');
        socket.current?.emit('updateStatus', { driverId: 'driver-123', online: true });
      });

      socket.current.on('disconnect', () => {
        console.log('Desconectado del servidor de sockets');
      });
    } else {
      // Desconectar si se pasa a offline
      if (socket.current) {
        socket.current.emit('updateStatus', { driverId: 'driver-123', online: false });
        socket.current.disconnect();
        console.log('Desconectado intencionalmente');
      }
    }

    return () => {
      socket.current?.disconnect();
    };
  }, [isOnline]);


  return (
    <SafeAreaView style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: 37.78825,
          longitude: -122.4324,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        showsUserLocation={false} // Usamos nuestro propio marcador
      >
        {/* Marcador del Repartidor */}
        {location && (
          <Marker coordinate={location} title="Tu Posición">
            {/* Puedes usar una imagen personalizada aquí */}
            <View style={styles.driverMarker} />
          </Marker>
        )}

        {/* Marcador del Destino */}
        {destination && (
          <Marker coordinate={destination} title="Destino" pinColor="blue" />
        )}

        {/* Ruta en el mapa */}
        {location && destination && (
          <MapViewDirections
            origin={location}
            destination={destination}
            apikey={GOOGLE_MAPS_API_KEY}
            strokeWidth={5}
            strokeColor="hotpink"
          />
        )}
      </MapView>

      <View style={styles.controls}>
        <Text style={styles.statusText}>{isOnline ? 'EN LÍNEA' : 'OFFLINE'}</Text>
        <Switch
          trackColor={{ false: "#767577", true: "#81b0ff" }}
          thumbColor={isOnline ? "#f5dd4b" : "#f4f3f4"}
          onValueChange={() => setIsOnline(previousState => !previousState)}
          value={isOnline}
        />
      </View>
    </SafeAreaView>
  );
};

// --- ESTILOS ---
const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject },
  controls: {
    position: 'absolute',
    top: 60, // Ajustado para SafeAreaView
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
  statusText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
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
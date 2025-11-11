// Componente de mapa en tiempo real para tracking de pedidos
import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import Geolocation from 'react-native-geolocation-service';
import { firestore } from '../../config/firebase';

interface Location {
  latitude: number;
  longitude: number;
}

interface TrackingMapProps {
  orderId: string;
  pickupLocation?: Location;
  deliveryLocation: Location;
  driverId?: string | null;
  showRoute?: boolean;
  isPickupPhase?: boolean;
}

const TrackingMap: React.FC<TrackingMapProps> = ({
  orderId,
  pickupLocation,
  deliveryLocation,
  driverId,
  showRoute = true,
  isPickupPhase = false,
}) => {
  const mapRef = useRef<MapView>(null);
  const [driverLocation, setDriverLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState<Region | null>(null);

  // Obtener ubicación del conductor en tiempo real
  useEffect(() => {
    if (!driverId) {
      setLoading(false);
      return;
    }

    // Escuchar cambios en la ubicación del conductor
    const unsubscribe = firestore()
      .collection('drivers')
      .doc(driverId)
      .onSnapshot(
        (doc) => {
          if (doc.exists()) {
            const driverData = doc.data();
            const location = driverData?.operational?.currentLocation;
            
            if (location && location.latitude && location.longitude) {
              setDriverLocation({
                latitude: location.latitude,
                longitude: location.longitude,
              });
            }
          }
          setLoading(false);
        },
        (error) => {
          console.error('Error listening to driver location:', error);
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, [driverId]);

  // Actualizar región del mapa cuando cambian las ubicaciones
  useEffect(() => {
    if (driverLocation && deliveryLocation) {
      // Calcular región que incluya ambos puntos
      const minLat = Math.min(driverLocation.latitude, deliveryLocation.latitude);
      const maxLat = Math.max(driverLocation.latitude, deliveryLocation.latitude);
      const minLng = Math.min(driverLocation.longitude, deliveryLocation.longitude);
      const maxLng = Math.max(driverLocation.longitude, deliveryLocation.longitude);

      const latDelta = (maxLat - minLat) * 1.5; // 1.5x para dar margen
      const lngDelta = (maxLng - minLng) * 1.5;

      const newRegion = {
        latitude: (minLat + maxLat) / 2,
        longitude: (minLng + maxLng) / 2,
        latitudeDelta: Math.max(latDelta, 0.02), // Mínimo zoom
        longitudeDelta: Math.max(lngDelta, 0.02),
      };

      setRegion(newRegion);

      // Animar el mapa a la nueva región
      if (mapRef.current) {
        mapRef.current.animateToRegion(newRegion, 1000);
      }
    } else if (deliveryLocation) {
      // Si solo hay destino, centrar en él
      const newRegion = {
        latitude: deliveryLocation.latitude,
        longitude: deliveryLocation.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
      setRegion(newRegion);
    }
  }, [driverLocation, deliveryLocation]);

  // Obtener destino actual basado en la fase
  const currentDestination = isPickupPhase && pickupLocation ? pickupLocation : deliveryLocation;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Cargando mapa...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={region || {
          latitude: currentDestination.latitude,
          longitude: currentDestination.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={true}
        showsTraffic={true}
        loadingEnabled={true}
      >
        {/* Marcador del destino */}
        <Marker
          coordinate={currentDestination}
          title={isPickupPhase ? 'Punto de recogida' : 'Punto de entrega'}
          description={isPickupPhase ? 'Restaurante' : 'Tu ubicación'}
          pinColor="#4CAF50"
        />

        {/* Marcador del conductor (solo si existe) */}
        {driverLocation && (
          <Marker
            coordinate={driverLocation}
            title="Repartidor"
            description="Ubicación en tiempo real"
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.driverMarker}>
              <View style={styles.driverMarkerInner}>
                <Text style={styles.driverMarkerText}>🚗</Text>
              </View>
            </View>
          </Marker>
        )}

        {/* Ruta entre conductor y destino */}
        {driverLocation && showRoute && (
          <MapViewDirections
            origin={driverLocation}
            destination={currentDestination}
            apikey="AIzaSyAEFo3RDFvqw0-HuSOOBD34NGruHI3hIBQ" // Reemplazar con tu API key
            strokeWidth={4}
            strokeColor="#667eea"
            optimizeWaypoints={true}
            onReady={(result) => {
              console.log(`Distance: ${result.distance} km`);
              console.log(`Duration: ${result.duration} min`);
              
              // Ajustar mapa para mostrar toda la ruta
              if (mapRef.current && result.coordinates.length > 0) {
                mapRef.current.fitToCoordinates(result.coordinates, {
                  edgePadding: {
                    top: 50,
                    right: 50,
                    bottom: 50,
                    left: 50,
                  },
                  animated: true,
                });
              }
            }}
            onError={(error) => {
              console.error('Error calculating route:', error);
            }}
          />
        )}

        {/* Línea directa si no hay ruta de Google */}
        {driverLocation && !showRoute && (
          <Polyline
            coordinates={[driverLocation, currentDestination]}
            strokeColor="#667eea"
            strokeWidth={3}
            lineDashPattern={[10, 5]}
          />
        )}
      </MapView>

      {/* Indicador de actualización en tiempo real */}
      {driverLocation && (
        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>En vivo</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  driverMarker: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverMarkerInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  driverMarkerText: {
    fontSize: 20,
  },
  liveIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 6,
  },
  liveText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
});

export default TrackingMap;

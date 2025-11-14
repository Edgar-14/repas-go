// Componente de mapa en tiempo real para tracking de pedidos
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import MapView, {
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
  Region,
  Heatmap,
} from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { GOOGLE_MAPS_API_KEY } from '../../config/keys';
import { firestore } from '../../config/firebase';

// Alias para evitar error de tipos con Heatmap en algunas versiones
const HeatmapAny = Heatmap as any;

interface Location {
  latitude: number;
  longitude: number;
}

interface ExtraMarker extends Location {
  title?: string;
  description?: string;
  color?: string;
}

interface HeatPoint {
  latitude: number;
  longitude: number;
  weight?: number;
}

interface TrackingMapProps {
  style?: any; // <-- Permite pasar un estilo (ej. flex: 1)
  orderId?: string;
  pickupLocation?: Location;
  deliveryLocation?: Location;
  driverId?: string | null;
  showRoute?: boolean;
  isPickupPhase?: boolean;

  // Props de IA
  customStyle?: any[];
  customMapStyle?: any[]; // alias para compatibilidad con consumidores
  cameraTarget?: {
    latitude: number;
    longitude: number;
    latitudeDelta?: number;
    longitudeDelta?: number;
  } | null;
  customRoute?: { origin: string | Location; destination: string | Location } | null;
  searchResults?: Array<{
    latitude: number;
    longitude: number;
    title: string;
    description?: string;
  }>;

  onRouteReady?: (data: { distanceKm: number; durationMin: number }) => void;
  showUserLocation?: boolean;
  heatmapPoints?: HeatPoint[];
}

const DEFAULT_LOCATION = {
  latitude: 19.2499, // Default a Colima, México
  longitude: -103.7271,
  latitudeDelta: 0.5,
  longitudeDelta: 0.5,
};

const TrackingMap: React.FC<TrackingMapProps> = ({
  style, // <-- Recibir el estilo
  orderId,
  pickupLocation,
  deliveryLocation,
  driverId,
  showRoute = true,
  isPickupPhase = false,
  customStyle,
  customMapStyle,
  cameraTarget,
  customRoute,
  searchResults = [],
  onRouteReady,
  showUserLocation = false,
  heatmapPoints = [],
}) => {
  const mapRef = useRef<MapView>(null);
  const [driverLocation, setDriverLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);

  // Determinar el origen y destino actual para la ruta principal
  const currentOrigin: Location | null = driverLocation || pickupLocation || null;
  const currentDestination: Location | null = deliveryLocation || null;

  // --- EFECTOS ---

  // 1. Obtener ubicación del conductor en tiempo real
  useEffect(() => {
    if (!driverId) {
      setLoading(false);
      return;
    }

    setLoading(true); // Poner loading al empezar a buscar
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
          console.error('[TrackingMap] Error listening to driver location:', error);
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, [driverId]);

  // 2. Reaccionar a cambios de cámara solicitados por la IA (Alta Prioridad)
  useEffect(() => {
    if (cameraTarget && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: cameraTarget.latitude,
          longitude: cameraTarget.longitude,
          latitudeDelta: cameraTarget.latitudeDelta || 0.02,
          longitudeDelta: cameraTarget.longitudeDelta || 0.02,
        },
        1000
      );
    }
  }, [cameraTarget]);

  // 3. Memoizar los puntos que deben caber en la pantalla
  const fitPoints = useMemo(() => {
    const points: Location[] = [];

    if (customRoute) {
      if (typeof customRoute.origin !== 'string' && customRoute.origin)
        points.push(customRoute.origin);
      if (typeof customRoute.destination !== 'string' && customRoute.destination)
        points.push(customRoute.destination);
    } else {
      if (currentOrigin) points.push(currentOrigin);
      if (currentDestination) points.push(currentDestination);
    }

    if (searchResults && searchResults.length) {
      points.push(
        ...searchResults.map((m) => ({
          latitude: m.latitude,
          longitude: m.longitude,
        }))
      );
    }

    return points;
  }, [currentOrigin, currentDestination, searchResults, customRoute]);

  // 4. Ajustar la cámara del mapa cuando los puntos a mostrar cambien
  useEffect(() => {
    if (cameraTarget || !mapRef.current || fitPoints.length === 0) {
      return;
    }

    if (fitPoints.length === 1) {
      mapRef.current.animateToRegion(
        {
          latitude: fitPoints[0].latitude,
          longitude: fitPoints[0].longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        1000
      );
    } else if (fitPoints.length > 1) {
      mapRef.current.fitToCoordinates(fitPoints, {
        edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
        animated: true,
      });
    }
  }, [fitPoints, cameraTarget]);

  // --- MEMOIZACIÓN DE NODOS ---
  const driverMarkerNode = useMemo(
    () => (
      <View style={styles.driverMarker}>
        <View style={styles.driverMarkerInner}>
          <Text style={styles.driverMarkerText}>🚗</Text>
        </View>
      </View>
    ),
    []
  );

  // --- RENDER ---
  if (loading) {
    return (
      <View style={[style, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#00B894" />
        <Text style={styles.loadingText}>Cargando mapa...</Text>
      </View>
    );
  }

  const initialMapRegion =
    currentDestination
      ? {
          latitude: currentDestination.latitude,
          longitude: currentDestination.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }
      : DEFAULT_LOCATION;

  const effectiveCustomStyle = customStyle || customMapStyle;

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map} // Este estilo debe ser { flex: 1 }
        initialRegion={initialMapRegion}
        customMapStyle={effectiveCustomStyle}
        showsUserLocation={showUserLocation}
        showsMyLocationButton={false}
        showsCompass={true}
        showsTraffic={true}
        loadingEnabled={true}
        onMapReady={() => {
          if (!GOOGLE_MAPS_API_KEY) {
            console.warn(
              '[TrackingMap] API key de Google Maps vacía. El cálculo de rutas (Directions) fallará.'
            );
          }
        }}
      >
        {/* Marcador del destino (Entrega) */}
        {currentDestination && (
          <Marker
            coordinate={currentDestination}
            title={isPickupPhase && !deliveryLocation ? 'Punto de recogida' : 'Punto de entrega'}
            description={isPickupPhase && !deliveryLocation ? 'Restaurante' : 'Destino'}
            pinColor="#4CAF50"
          />
        )}

        {/* Marcador del Origen (Conductor o Recogida) */}
        {currentOrigin && (
          <Marker
            coordinate={currentOrigin}
            title={orderId ? (pickupLocation ? 'Punto de recogida' : 'Repartidor') : 'Mi ubicación'}
            description={orderId ? (pickupLocation ? 'Origen del pedido' : 'Ubicación en tiempo real') : 'Ubicación actual'}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            {driverMarkerNode}
          </Marker>
        )}

        {/* Marcadores de búsqueda de IA */}
        {searchResults.map((place, index) => (
          <Marker
            key={`ai-search-${index}`}
            coordinate={{
              latitude: place.latitude,
              longitude: place.longitude,
            }}
            title={place.title}
            description={place.description}
            pinColor="#3498db"
          />
        ))}

        {/* Ruta principal del pedido (si aplica) */}
        {showRoute && currentOrigin && currentDestination && GOOGLE_MAPS_API_KEY && (
          <MapViewDirections
            origin={currentOrigin}
            destination={currentDestination}
            apikey={GOOGLE_MAPS_API_KEY}
            strokeWidth={4}
            strokeColor="#1E90FF"
            optimizeWaypoints={true}
            onReady={(result) => {
              if (onRouteReady) {
                onRouteReady({
                  distanceKm: result.distance,
                  durationMin: result.duration,
                });
              }
            }}
            onError={(error) => {
              console.error('[TrackingMap] Error calculating main route:', error);
            }}
          />
        )}

        {/* Ruta Personalizada por IA (Directions) */}
        {customRoute && GOOGLE_MAPS_API_KEY && (
          <MapViewDirections
            origin={customRoute.origin}
            destination={customRoute.destination}
            apikey={GOOGLE_MAPS_API_KEY}
            strokeWidth={4}
            strokeColor="#AA00FF"
            optimizeWaypoints={true}
            onReady={(result) => {
              if (mapRef.current && result.coordinates.length > 0) {
                mapRef.current.fitToCoordinates(result.coordinates, {
                  edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                  animated: true,
                });
              }
            }}
            onError={(error) => {
              console.error('[TrackingMap] Error calculating AI route:', error);
            }}
          />
        )}

        {/* Línea directa (fallback) si no hay ruta de Google */}
        {currentOrigin && currentDestination && !showRoute && (
          <Polyline
            coordinates={[currentOrigin, currentDestination]}
            strokeColor="#667eea"
            strokeWidth={3}
            lineDashPattern={[10, 5]}
          />
        )}

        {/* Heatmap de puntos de demanda */}
        {heatmapPoints.length > 0 && (
          <HeatmapAny
            points={heatmapPoints}
            radius={40}
            opacity={0.7}
            gradient={{
              colors: ['#00B894', '#FFA726', '#EF5350'],
              startPoints: [0.1, 0.5, 0.9],
              colorMapSize: 256,
            }}
          />
        )}
      </MapView>

      {/* Indicador de actualización en tiempo real */}
      {driverId && driverLocation && (
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
    backgroundColor: '#00B894',
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

export default React.memo(TrackingMap);


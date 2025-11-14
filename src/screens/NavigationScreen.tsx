import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
// CORRECCIÓN: Importar tipos desde el index central
import { Order, OrderStatus, MapLocation, MapAction } from '../types';
import { firestore, COLLECTIONS } from '../config/firebase';
import { updateOrderStatus } from '../store/slices/ordersSlice';
import eventBus from '../utils/EventBus';
import TrackingMap from '../components/map/TrackingMap';
import MapsApiService from '../services/MapsApiService';
import PricingService from '../services/PricingService';
import { auth } from '../config/firebase';
import MapErrorBoundary from '../components/map/MapErrorBoundary';

// **INICIO DE CORRECCIÓN DE TIPOS**
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { StackScreenProps } from '@react-navigation/stack';

// Stack principal (de AppNavigator)
// CORRECCIÓN: Usar los tipos de RootStackParamList de src/types/index.ts
type RootStackParamList = {
  Main: undefined;
  Login: undefined;
  OrderDetail: { orderId: string };
  OrderCompletion: { orderId: string };
  Navigation: { orderId?: string };
  // ... (agrega otras pantallas del Stack si es necesario)
};

// Tab principal (de AppNavigator)
type MainTabParamList = {
  Dashboard: undefined;
  Orders: undefined;
  Navigation: { orderId?: string }; // <-- Esta pantalla recibe un orderId opcional
  Payments: undefined;
  Notifications: undefined;
  Profile: undefined;
};

// Props compuestas para esta pantalla
type NavigationScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Navigation'>,
  StackScreenProps<RootStackParamList>
>;
// **FIN DE CORRECCIÓN DE TIPOS**


const NavigationScreen: React.FC<NavigationScreenProps> = ({ navigation, route }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { activeOrder } = useSelector((state: RootState) => state.orders);
  const { user } = useSelector((state: RootState) => state.auth);

  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState<Order | null>(null);
  const [searchResults, setSearchResults] = useState<MapLocation[]>([]);
  const [routeOrigin, setRouteOrigin] = useState<{ latitude: number; longitude: number } | null>(null);
  const [routeDestination, setRouteDestination] = useState<{ latitude: number; longitude: number } | null>(null);
  const [customMapStyle, setCustomMapStyle] = useState<any[] | undefined>(undefined);
  const [routeInfo, setRouteInfo] = useState<{ distanceKm: number; durationMin: number } | null>(null);
  const [driverCenter, setDriverCenter] = useState<{ latitude: number; longitude: number } | null>(null);
  const [realCost, setRealCost] = useState<{ total: number; totalBeforeTip: number } | null>(null);
  const [heatmapPoints, setHeatmapPoints] = useState<any[]>([]);

  const orderId = (route.params as any)?.orderId || activeOrder?.id;

  useEffect(() => {
    if (!orderId) {
      setOrderData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = firestore()
      .collection(COLLECTIONS.ORDERS)
      .doc(orderId)
      .onSnapshot((doc) => {
        if (doc.exists) {
          const data: any = doc.data();
          const pickupLoc = data?.restaurant?.coordinates ? { latitude: data.restaurant.coordinates.lat, longitude: data.restaurant.coordinates.lng } : data?.pickup?.location;
          const deliveryLoc = data?.customer?.coordinates ? { latitude: data.customer.coordinates.lat, longitude: data.customer.coordinates.lng } : data?.delivery?.location;

          // CORRECCIÓN: Usar el tipo Order de src/types/index.ts
          const order: Order = {
            id: doc.id,
            status: data.status,
            earnings: data.pricing?.totalAmount || data.earnings || data.estimatedEarnings || 0,
            payment: { method: (data.paymentMethod === 'CARD' ? 'TARJETA' : 'EFECTIVO'), tip: data.pricing?.tip },
            distance: data.logistics?.distance || data.distance || 0,
            pickup: { name: data.restaurant?.name || data.pickup?.name || 'Recogida', location: pickupLoc },
            customer: { name: data.customer?.name || data.customerName || 'Cliente', location: deliveryLoc },
            timestamps: { created: data.timing?.createdAt?.toDate ? data.timing.createdAt.toDate() : (data.createdAt?.toDate ? data.createdAt.toDate() : new Date()) },
            driverId: data.assignedDriverId || data.driverId,
            ...data, // Incluir otros campos por si acaso
          };
          setOrderData(order);
        } else {
          Alert.alert('Error', 'No se encontró el pedido.');
          setOrderData(null);
        }
        setLoading(false);
      });

    return () => unsubscribe();
  }, [orderId]);

  useEffect(() => {
    // Si no hay pedido, centrar mapa en ubicación del conductor
    if (!orderId && user?.uid) {
      const unsub = firestore()
        .collection(COLLECTIONS.DRIVERS)
        .doc(user.uid)
        .onSnapshot((doc) => {
          const data: any = doc.data();
          const loc = data?.operational?.currentLocation;
          if (loc?.latitude && loc?.longitude) {
            setDriverCenter({ latitude: loc.latitude, longitude: loc.longitude });
          }
        });
      return () => unsub();
    }
  }, [orderId, user?.uid]);

  useEffect(() => {
    // Suscripción a acciones de mapa (desde chat u otras partes)
    const off = eventBus.on('MAP_ACTION', async (payload: MapAction) => {
      try {
        if (!payload) return;
        if (payload.intent === 'CLEAR') {
          setSearchResults([]);
          setRouteDestination(null);
          setRouteOrigin(null);
          return;
        }
        if (payload.intent === 'VIEW_LOCATION') {
          const loc = await MapsApiService.geocodeAddress(payload.params.query);
            if (loc) {
              setRouteDestination(loc);
              setSearchResults([{ ...loc, title: payload.params.query, description: 'Ubicación' }]);
            }
          return;
        }
        if (payload.intent === 'SEARCH_PLACES') {
          const base = orderData?.pickup?.location || orderData?.customer?.location;
          if (base) {
            // CORRECCIÓN: MapsApiService.searchNearby espera LatLng
            const results = await MapsApiService.searchNearby(base, payload.params.keyword, payload.params.radius || 1500);
            setSearchResults(results.map(r => ({ latitude: r.location.latitude, longitude: r.location.longitude, title: r.name, description: r.address })));
          }
          return;
        }
        if (payload.intent === 'DIRECTIONS') {
          if (typeof payload.params.origin !== 'string') setRouteOrigin(payload.params.origin);
          if (typeof payload.params.destination !== 'string') setRouteDestination(payload.params.destination);
          return;
        }
      } catch (e) {
        console.warn('MAP_ACTION failed', e);
      }
    });
    return () => off();
  }, [orderData]);

  const handleUpdateStatus = (newStatus: OrderStatus) => {
    if (!orderId || !user?.uid) return;
    dispatch(updateOrderStatus({ orderId, status: newStatus, driverId: user.uid }));
  };

  // Cuando tengamos métrica de ruta real, calcular costo real (según PricingService)
  useEffect(() => {
    if (routeInfo) {
      const tip = orderData?.payment?.tip || 0;
      const pricing = PricingService.calculateOrderTotal(routeInfo.distanceKm, tip);
      setRealCost({ total: pricing.total, totalBeforeTip: pricing.totalBeforeTip });
    } else {
      setRealCost(null);
    }
  }, [routeInfo, orderData]);

  useEffect(() => {
    // Mock: generar puntos de demanda cerca del destino para heatmap
    if (orderData?.pickup?.location || orderData?.customer?.location) {
      const base = (orderData.pickup?.location || orderData.customer?.location);
      if (base?.latitude && base?.longitude) {
        const pts = Array.from({ length: 20 }).map((_, i) => ({
          latitude: base.latitude + (Math.random() - 0.5) * 0.01,
          longitude: base.longitude + (Math.random() - 0.5) * 0.01,
          weight: 1 + Math.random() * 2,
        }));
        setHeatmapPoints(pts);
      }
    } else {
      setHeatmapPoints([]);
    }
  }, [orderData]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#00B894" /></View>;
  }

  // Búsqueda simple de lugares cerca del pickup/delivery
  const handleSearchNearby = async (keyword: string) => {
    try {
      // CORRECCIÓN: La base debe ser la ubicación del conductor si no hay pedido
      const base = orderData?.pickup?.location || orderData?.customer?.location || driverCenter;
      if (!base) return;
      const results = await MapsApiService.searchNearby({ latitude: base.latitude, longitude: base.longitude }, keyword, 1500);
      setSearchResults(results.map(r => ({ latitude: r.location.latitude, longitude: r.location.longitude, title: r.name, description: r.address })));
    } catch (e) {
      console.warn('Search nearby failed', e);
    }
  };

  // Siempre renderizar el mapa; si no hay pedido, mostrar mapa centrado en conductor sin ruta
  if (!orderData) {
    return (
      <View style={styles.container}>
        <View style={{ paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#fff', borderBottomColor: '#E2E8F0', borderBottomWidth: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: '#2D3748', fontWeight: '700' }}>Mapa</Text>
            <TouchableOpacity onPress={() => handleSearchNearby('cafetería')}>
              <Text style={{ color: '#00B894', fontWeight: '600' }}>Buscar cerca</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* CORRECCIÓN DE LAYOUT: Añadido style={styles.map} */}
        <MapErrorBoundary>
          {driverCenter ? (
            <TrackingMap
              style={styles.map}
              orderId={'no-order'}
              deliveryLocation={driverCenter}
              driverId={user?.uid}
              showRoute={false}
              isPickupPhase={false}
              extraMarkers={searchResults}
              customMapStyle={customMapStyle as any}
              showUserLocation={true}
            />
          ) : (
            <TrackingMap
              style={styles.map}
              orderId={'no-order'}
              deliveryLocation={{ latitude: 19.2433, longitude: -103.7240 }} // Default Colima
              driverId={user?.uid}
              showRoute={false}
              isPickupPhase={false}
              extraMarkers={searchResults}
              customMapStyle={customMapStyle as any}
              showUserLocation={true}
            />
          )}
        </MapErrorBoundary>

        <View style={{ position: 'absolute', top: 60, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}>
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Sin pedido activo</Text>
        </View>
      </View>
    );
  }


  const isPickupPhase = orderData?.status === OrderStatus.ACCEPTED || orderData?.status === OrderStatus.ASSIGNED;

  const QUICK_CANCEL_REASONS = [
    'Muy lejos del punto de recogida',
    'Tráfico o cierre de calles',
    'Problema con el vehículo',
    'Restaurante saturado o cerrado',
    'Otro'
  ];

  const cancelOrder = async (reason: string) => {
    if (!orderData?.id || !user?.uid) return;
    // CORRECCIÓN: updateOrderStatus es el thunk, no 'updateStatus'
    await dispatch(updateOrderStatus({ orderId: orderData.id, status: OrderStatus.CANCELLED, driverId: user.uid, reason }));
    // Opcional: navegar atrás o limpiar estado
  };

  return (
    <View style={styles.container}>
      {/* Barra de acciones del mapa */}
      <View style={{ paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#fff', borderBottomColor: '#E2E8F0', borderBottomWidth: 1 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => setRouteOrigin(undefined)}>
            <Text style={{ color: '#00B894', fontWeight: '600' }}>Desde mi ubicación</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleSearchNearby('tienda oxxo')}>
            <Text style={{ color: '#00B894', fontWeight: '600' }}>Buscar OXXO</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setSearchResults([]); setRouteDestination(null); }}>
            <Text style={{ color: '#00B894', fontWeight: '600' }}>Limpiar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* CORRECCIÓN DE LAYOUT: Añadido style={styles.map} y MapErrorBoundary */}
      <MapErrorBoundary>
        <TrackingMap
          style={styles.map}
          orderId={orderData.id}
          pickupLocation={orderData?.pickup?.location}
          deliveryLocation={orderData?.customer?.location}
          driverId={orderData.driverId}
          showRoute={true}
          isPickupPhase={isPickupPhase}
          customMapStyle={customMapStyle as any}
          searchResults={searchResults}
          customRoute={routeOrigin && routeDestination ? { origin: routeOrigin, destination: routeDestination } : null}
          onRouteReady={(data) => setRouteInfo(data)}
          heatmapPoints={heatmapPoints}
        />
      </MapErrorBoundary>

      {/* Panel de métricas en vivo (distancia/tiempo) */}
      {routeInfo && (
        <View style={styles.metricsPanel}>
          <Text style={styles.metricsText}>Distancia: {routeInfo.distanceKm.toFixed(1)} km</Text>
          <Text style={styles.metricsText}>ETA: {Math.round(routeInfo.durationMin)} min</Text>
          {realCost && (
            <Text style={styles.metricsText}>Costo real: ${realCost.totalBeforeTip.toFixed(2)}{orderData?.payment?.tip ? ` + propina = $${realCost.total.toFixed(2)}` : ''}</Text>
          )}
        </View>
      )}

      {/* Acciones del pedido */}
      <View style={styles.actionsContainer}>
        {(orderData.status === OrderStatus.ACCEPTED || orderData.status === OrderStatus.ASSIGNED) && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleUpdateStatus(OrderStatus.PICKED_UP)}
          >
            <Text style={styles.buttonText}>Marcar como Recogido</Text>
          </TouchableOpacity>
        )}
        {(orderData.status === OrderStatus.PICKED_UP || orderData.status === OrderStatus.IN_TRANSIT) && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleUpdateStatus(OrderStatus.ARRIVED)}
          >
            <Text style={styles.buttonText}>Llegué al Destino</Text>
          </TouchableOpacity>
        )}
        {([
          OrderStatus.ACCEPTED,
          OrderStatus.PICKED_UP,
          OrderStatus.IN_TRANSIT,
          OrderStatus.ARRIVED,
          OrderStatus.ASSIGNED, // Añadido ASSIGNED
        ]).includes(orderData.status) && (
          <View style={{ marginTop: 8 }}>
            <Text style={{ color: '#2D3748', fontWeight: '700', marginBottom: 8 }}>Cancelar pedido (motivo rápido)</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {QUICK_CANCEL_REASONS.map((r, idx) => (
                <TouchableOpacity key={idx} style={styles.quickChip} onPress={() => cancelOrder(r)}>
                  <Text style={styles.quickChipText}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  // CORRECCIÓN DE LAYOUT: Definición de estilo para el mapa
  map: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noOrderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3748',
    textAlign: 'center',
  },
  noOrderSubtitle: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    marginTop: 8,
  },
  actionsContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  actionButton: {
    backgroundColor: '#00B894',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  completeButton: {
    backgroundColor: '#2196F3',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  metricsPanel: {
    position: 'absolute',
    // CORRECCIÓN: Subir el panel para que no choque con la barra de acciones
    top: 60,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 12,
  },
  metricsText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  quickChip: { backgroundColor: '#EDF2F7', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6, marginRight: 8, marginBottom: 8 },
  quickChipText: { color: '#2D3748', fontWeight: '600', fontSize: 12 },
});

export default NavigationScreen;
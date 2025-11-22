import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { Order, OrderStatus } from '../types/index';
import { firestore, COLLECTIONS } from '../config/firebase';
import { updateOrderStatus } from '../store/slices/ordersSlice';
import TrackingMap from '../components/map/TrackingMap';
import PricingService from '../services/PricingService';

const NavigationScreen: React.FC<any> = ({ route }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { activeOrder } = useSelector((state: RootState) => state.orders);
  const { driver } = useSelector((state: RootState) => state.auth);

  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState<Order | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distanceKm: number; durationMin: number } | null>(null);
  const [driverCenter, setDriverCenter] = useState<{ latitude: number; longitude: number } | null>(null);
  const [realCost, setRealCost] = useState<{ total: number; totalBeforeTip: number } | null>(null);

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
        if (doc.exists()) {
          const data: any = doc.data();
          const order: Order = {
            id: doc.id,
            orderNumber: data.orderNumber || '',
            status: data.status,
            earnings: data.earnings || 0,
            payment: { method: data.paymentMethod === 'CARD' ? 'TARJETA' : 'EFECTIVO', tip: data.tip },
            distance: data.distance || 0,
            pickup: { name: data.pickup?.name || 'Recogida', coordinates: data.pickup?.coordinates },
            customer: { name: data.customer?.name || 'Cliente', coordinates: data.customer?.coordinates },
            timestamps: { created: data.createdAt || new Date() },
            driverId: data.driverId,
            paymentMethod: data.paymentMethod,
            ...data,
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
    if (!orderId && driver?.uid) {
      const unsub = firestore()
        .collection(COLLECTIONS.DRIVERS)
        .doc(driver.uid)
        .onSnapshot((doc) => {
          const data: any = doc.data();
          const loc = data?.operational?.currentLocation;
          if (loc?.latitude && loc?.longitude) {
            setDriverCenter({ latitude: loc.latitude, longitude: loc.longitude });
          }
        });
      return () => unsub();
    }
  }, [orderId, driver?.uid]);

  useEffect(() => {
    if (routeInfo && orderData?.payment?.tip) {
      const pricing = PricingService.calculateOrderTotal(routeInfo.distanceKm, orderData.payment.tip);
      setRealCost({ total: pricing.total, totalBeforeTip: pricing.totalBeforeTip });
    } else {
      setRealCost(null);
    }
  }, [routeInfo, orderData]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#00B894" /></View>;
  }

  const handleUpdateStatus = (newStatus: OrderStatus) => {
    if (!orderId || !driver?.uid) return;
    dispatch(updateOrderStatus({ orderId, status: newStatus, driverId: driver.uid }));
  };

  const cancelOrder = async (reason: string) => {
    if (!orderData?.id || !driver?.uid) return;
    await dispatch(updateOrderStatus({ orderId: orderData.id, status: OrderStatus.CANCELLED, driverId: driver.uid }));
  };

  const QUICK_CANCEL_REASONS = [
    'Muy lejos del punto de recogida',
    'Tráfico o cierre de calles',
    'Problema con el vehículo',
    'Restaurante saturado o cerrado',
    'Otro'
  ];

  if (!orderData) {
    return (
      <View style={styles.container}>
        <View style={{ paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#fff', borderBottomColor: '#E2E8F0', borderBottomWidth: 1 }}>
          <Text style={{ color: '#2D3748', fontWeight: '700' }}>Mapa</Text>
        </View>

        <TrackingMap
          style={styles.map}
          orderId="no-order"
          deliveryLocation={driverCenter || { latitude: 19.2433, longitude: -103.7240 }}
          driverId={driver?.uid}
          showRoute={false}
          isPickupPhase={false}
          showUserLocation={true}
        />

        <View style={{ position: 'absolute', top: 60, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}>
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Sin pedido activo</Text>
        </View>
      </View>
    );
  }

  const isPickupPhase = orderData.status === OrderStatus.ASSIGNED || orderData.status === OrderStatus.ACCEPTED;

  return (
    <View style={styles.container}>
      <View style={{ paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#fff', borderBottomColor: '#E2E8F0', borderBottomWidth: 1 }}>
        <Text style={{ color: '#2D3748', fontWeight: '700' }}>Pedido #{orderData.id.slice(-6)}</Text>
      </View>

      <TrackingMap
        style={styles.map}
        orderId={orderData.id}
        pickupLocation={orderData.pickup?.coordinates}
        deliveryLocation={orderData.customer?.coordinates}
        driverId={orderData.driverId}
        showRoute={true}
        isPickupPhase={isPickupPhase}
        onRouteReady={(data) => setRouteInfo(data)}
      />

      {routeInfo && (
        <View style={styles.metricsPanel}>
          <Text style={styles.metricsText}>Distancia: {routeInfo.distanceKm.toFixed(1)} km</Text>
          <Text style={styles.metricsText}>ETA: {Math.round(routeInfo.durationMin)} min</Text>
          {realCost && (
            <Text style={styles.metricsText}>Costo: ${realCost.totalBeforeTip.toFixed(2)}</Text>
          )}
        </View>
      )}

      <View style={styles.actionsContainer}>
        {(orderData.status === OrderStatus.ASSIGNED || orderData.status === OrderStatus.ACCEPTED) && (
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
        {[OrderStatus.ASSIGNED, OrderStatus.ACCEPTED, OrderStatus.PICKED_UP, OrderStatus.IN_TRANSIT, OrderStatus.ARRIVED].includes(orderData.status) && (
          <View style={{ marginTop: 8 }}>
            <Text style={{ color: '#2D3748', fontWeight: '700', marginBottom: 8 }}>Cancelar pedido</Text>
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
  map: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  metricsPanel: {
    position: 'absolute',
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
  quickChip: {
    backgroundColor: '#EDF2F7',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8
  },
  quickChipText: {
    color: '#2D3748',
    fontWeight: '600',
    fontSize: 12
  },
});

export default NavigationScreen;

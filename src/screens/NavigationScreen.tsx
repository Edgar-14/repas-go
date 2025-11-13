import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { Order, OrderStatus } from '../types';
import { firestore, COLLECTIONS } from '../config/firebase';
import { updateOrderStatus } from '../store/slices/ordersSlice';
// Asumo que tienes un componente de mapa aquí
// import TrackingMap from '../components/map/TrackingMap';

// **INICIO DE CORRECCIÓN DE TIPOS**
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { StackScreenProps } from '@react-navigation/stack';

// Stack principal (de AppNavigator)
type RootStackParamList = {
  Main: undefined;
  Login: undefined;
  OrderDetail: { orderId: string };
  OrderCompletion: { orderId: string };
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
        // **FIX 1 (Error 2774): doc.exists es una función doc.exists()**
        if (doc.exists()) {
          // **FIX 2 (Error 2352): Mapear TODOS los campos de 'Order' de src/types.ts**
          const data: any = doc.data();
          const order: Order = {
            id: doc.id,
            status: data.status,
            earnings: data.earnings || data.estimatedEarnings || 0,
            payment: data.payment || { method: 'TARJETA' },
            distance: data.distance || 0,
            pickup: data.pickup || { name: 'Recogida' },
            customer: data.customer || { name: 'Cliente' },
            timestamps: data.timestamps || { created: data.createdAt?.toDate ? data.createdAt.toDate() : new Date() },
          };
          setOrderData(order);
        } else {
          Alert.alert("Error", "No se encontró el pedido.");
          setOrderData(null);
        }
        setLoading(false);
      });

    return () => unsubscribe();
  }, [orderId]);

  const handleUpdateStatus = (newStatus: OrderStatus) => {
    if (!orderId || !user?.uid) return;
    
    dispatch(updateOrderStatus({ orderId, status: newStatus, driverId: user.uid }));
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#00B894" /></View>;
  }

  if (!orderData) {
    return (
      <View style={styles.center}>
        <Text style={styles.noOrderText}>No hay ningún pedido activo.</Text>
        <Text style={styles.noOrderSubtitle}>El mapa se activará cuando aceptes un pedido.</Text>
      </View>
    );
  }

  // Define los 'markers' para el mapa basados en el pedido
  // const markers = [
  //   { id: 'pickup', latlng: orderData.pickup.latlng, title: 'Recoger', description: orderData.pickup.name },
  //   { id: 'delivery', latlng: orderData.customer.latlng, title: 'Entregar', description: orderData.customer.name }
  // ];

  return (
    <View style={styles.container}>
      {/* <TrackingMap
        driverLocation={orderData.driverLocation} // Esta prop no está en tu tipo Order
        markers={markers}
        orderStatus={orderData.status}
      /> */}
      <View style={styles.center}>
        <Text style={styles.noOrderText}>Componente de Mapa (TrackingMap) iría aquí</Text>
        <Text>Pedido: {orderData.id}</Text>
        <Text>Estado: {orderData.status}</Text>
      </View>
      
      {/* Acciones del pedido */}
      <View style={styles.actionsContainer}>
        {orderData.status === OrderStatus.ACCEPTED && (
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => handleUpdateStatus(OrderStatus.PICKED_UP)}
          >
            <Text style={styles.buttonText}>Marcar como Recogido</Text>
          </TouchableOpacity>
        )}
        {orderData.status === OrderStatus.PICKED_UP && (
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => handleUpdateStatus(OrderStatus.ARRIVED)}
          >
            <Text style={styles.buttonText}>Llegué al Destino</Text>
          </TouchableOpacity>
        )}
        {orderData.status === OrderStatus.ARRIVED && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.completeButton]} 
            onPress={() => navigation.navigate('OrderCompletion', { orderId: orderData.id })}
          >
            <Text style={styles.buttonText}>Completar Entrega</Text>
          </TouchableOpacity>
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
});

export default NavigationScreen;
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { firestore, COLLECTIONS } from '../config/firebase';
import { Order, OrderStatus } from '../types';
import SimpleIcon from '../components/ui/SimpleIcon';

// **INICIO DE CORRECCIÓN DE TIPOS**
import { StackScreenProps } from '@react-navigation/stack';

// Stack principal (de AppNavigator)
type RootStackParamList = {
  Main: undefined;
  Login: undefined;
  OrderDetail: { orderId: string }; // <-- Esta pantalla recibe un orderId
  Navigation: { orderId: string };
  // ... (agrega otras pantallas del Stack si es necesario)
};

// Props para esta pantalla
type Props = StackScreenProps<RootStackParamList, 'OrderDetail'>;
// **FIN DE CORRECCIÓN DE TIPOS**


const OrderDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { orderId } = route.params;
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    const unsubscribe = firestore()
      .collection(COLLECTIONS.ORDERS)
      .doc(orderId)
      .onSnapshot((doc) => {
        // **FIX: doc.exists es una función doc.exists()**
        if (doc.exists()) {
          // **FIX: Mapear TODOS los campos de 'Order' de src/types.ts**
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
          setOrder(order);
        } else {
          Alert.alert("Error", "No se pudo cargar el pedido.");
          navigation.goBack();
        }
        setLoading(false);
      });

    return () => unsubscribe();
  }, [orderId, navigation]);

  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING: return 'Pendiente';
      case OrderStatus.ACCEPTED: return 'Aceptado';
      case OrderStatus.PICKED_UP: return 'Recogido';
      case OrderStatus.ARRIVED: return 'En destino';
      case OrderStatus.DELIVERED: return 'Entregado';
      case OrderStatus.COMPLETED: return 'Completado';
      default: return status;
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#00B894" /></View>;
  }

  if (!order) {
    return <View style={styles.center}><Text>Pedido no encontrado.</Text></View>;
  }

  // Usar order.payment.method y 'EFECTIVO' de src/types.ts
  const isCash = order.payment.method === 'EFECTIVO';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.orderId}>Pedido #{order.id.slice(-6)}</Text>
        <View style={[styles.statusBadge, { backgroundColor: '#FF6B35' }]}>
          <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
        </View>
      </View>

      {/* Navegación */}
      {order.status !== OrderStatus.COMPLETED && order.status !== OrderStatus.PENDING && (
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigation.navigate('Navigation', { orderId: order.id })}
        >
          <SimpleIcon type="navigation" size={20} color="white" />
          <Text style={styles.navButtonText}>Ver en Mapa</Text>
        </TouchableOpacity>
      )}

      {/* Usar solo 'customer.name' como define src/types.ts */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Detalles del Cliente</Text>
        <View style={styles.infoRow}>
          {/* **FIX (Error 2322): Cambiado 'user' por 'account'** */}
          <SimpleIcon type="account" size={20} color="#718096" />
          <Text style={styles.infoText}>{order.customer.name || 'Cliente'}</Text>
        </View>
      </View>

      {/* Usar solo 'pickup.name' como define src/types.ts */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Detalles de Recogida</Text>
        <View style={styles.infoRow}>
           {/* **FIX (Error 2322): Cambiado 'store' por 'package'** */}
          <SimpleIcon type="package" size={20} color="#718096" />
          <Text style={styles.infoText}>{order.pickup.name || 'Tienda'}</Text>
        </View>
      </View>

      {/* Usar 'order.earnings' y quitar 'payment.total' */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Resumen Financiero</Text>
        <View style={styles.financialRow}>
          <Text style={styles.financialLabel}>Ganancia</Text>
          <Text style={styles.financialValue}>${order.earnings?.toFixed(2) || '0.00'}</Text>
        </View>
        <View style={styles.financialRow}>
          <Text style={styles.financialLabel}>Propina</Text>
          <Text style={styles.financialValue}>${order.payment?.tip?.toFixed(2) || '0.00'}</Text>
        </View>
        <View style={styles.financialRow}>
          <Text style={styles.financialLabel}>Método de Pago</Text>
          <Text style={[styles.financialValue, isCash ? styles.cash : styles.cardText]}>
            {isCash ? '💵 Efectivo' : '💳 Tarjeta'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: 'white',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  orderId: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3748',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  navButton: {
    backgroundColor: '#00B894',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    margin: 16,
    borderRadius: 12,
    elevation: 2,
  },
  navButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#4A5568',
    marginLeft: 12,
    flex: 1,
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  financialLabel: {
    fontSize: 14,
    color: '#718096',
  },
  financialValue: {
    fontSize: 14,
    color: '#2D3748',
    fontWeight: '600',
  },
  cash: { color: '#38A169' },
  cardText: { color: '#3182CE' },
  totalLabel: {
    fontSize: 16,
    color: '#2D3748',
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 16,
    color: '#38A169',
    fontWeight: 'bold',
  },
});

export default OrderDetailScreen;
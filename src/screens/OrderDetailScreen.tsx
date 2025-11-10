// Pantalla de detalles del pedido para BeFast GO
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { acceptOrder } from '../store/slices/ordersSlice';
import { firestore, COLLECTIONS } from '../config/firebase';
import { NavigationProps, Order } from '../types';

interface OrderDetailScreenProps extends NavigationProps {
  route: {
    params: {
      orderId: string;
    };
  };
}

const OrderDetailScreen: React.FC<OrderDetailScreenProps> = ({ navigation, route }) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const wallet = useSelector((state: RootState) => state.wallet);
  const { pendingDebts, creditLimit } = wallet as any;

  useEffect(() => {
    loadOrderDetails();
  }, [orderId]);

  const loadOrderDetails = async () => {
    try {
      const orderDoc = await firestore()
        .collection(COLLECTIONS.ORDERS)
        .doc(orderId)
        .get();

      if (orderDoc.exists()) {
        const orderData = { id: orderDoc.id, ...orderDoc.data() } as Order;
        setOrder(orderData);
      } else {
        Alert.alert('Error', 'Pedido no encontrado');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading order:', error);
      Alert.alert('Error', 'No se pudo cargar el pedido');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOrder = async () => {
    if (!order || !user?.uid) return;

    // Validar si puede aceptar pedidos en efectivo
    if (order.paymentMethod === 'CASH' && pendingDebts >= creditLimit) {
      Alert.alert(
        'Límite de deuda alcanzado',
        `Has alcanzado tu límite de deuda de $${creditLimit}. Paga tu deuda pendiente para aceptar pedidos en efectivo.`,
        [
          {
            text: 'Ir a Billetera',
            onPress: () => navigation.navigate('Payments')
          },
          { text: 'Cancelar', style: 'cancel' }
        ]
      );
      return;
    }

    setAccepting(true);

    try {
      const result = await dispatch(acceptOrder({
        orderId: order.id,
        driverId: user.uid
      }));

      if ((acceptOrder as any).fulfilled.match(result)) {
        Alert.alert(
          '¡Pedido aceptado!',
          'Has aceptado el pedido exitosamente. Dirígete al punto de recogida.',
          [
            {
              text: 'Navegar',
              onPress: () => navigation.replace('Navigation', { orderId: order.id })
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error accepting order:', error);
    } finally {
      setAccepting(false);
    }
  };

  const handleRejectOrder = () => {
    Alert.alert(
      'Rechazar pedido',
      '¿Por qué rechazas este pedido?',
      [
        { text: 'Muy lejos', onPress: () => rejectWithReason('Muy lejos') },
        { text: 'Mal pagado', onPress: () => rejectWithReason('Mal pagado') },
        { text: 'Fuera de mi zona', onPress: () => rejectWithReason('Fuera de mi zona') },
        { text: 'No tengo tiempo', onPress: () => rejectWithReason('No tengo tiempo') },
        { text: 'Cancelar', style: 'cancel' }
      ]
    );
  };

  const rejectWithReason = (reason: string) => {
    // Aquí se podría registrar la razón del rechazo para analytics
    console.log('Order rejected with reason:', reason);
    navigation.goBack();
  };

  const handleCallCustomer = () => {
    if (order?.customer.phone) {
      Linking.openURL(`tel:${order.customer.phone}`);
    }
  };

  const openInMaps = (latitude: number, longitude: number, label: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}&query_place_id=${label}`;
    Linking.openURL(url);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Cargando detalles del pedido...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Pedido no encontrado</Text>
      </View>
    );
  }

  const canAcceptCashOrder = order.paymentMethod === 'CARD' || pendingDebts < creditLimit;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header del pedido */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.orderId}>Pedido #{order.id.slice(-6)}</Text>
            <Text style={styles.distance}>{order.distance.toFixed(1)} km</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.earnings}>${order.estimatedEarnings}</Text>
            <Text style={styles.earningsLabel}>Ganancia estimada</Text>
          </View>
        </View>

        {/* Información del cliente */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Cliente</Text>
          <View style={styles.customerInfo}>
            <View style={styles.customerDetails}>
              <Text style={styles.customerName}>{order.customer.name}</Text>
              <Text style={styles.customerPhone}>{order.customer.phone}</Text>
            </View>
            <TouchableOpacity
              style={styles.callButton}
              onPress={handleCallCustomer}
            >
              <Text style={styles.callButtonText}>📞 Llamar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Punto de recogida */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Punto de Recogida</Text>
          <View style={styles.locationCard}>
            <View style={styles.locationInfo}>
              <Text style={styles.businessName}>{order.pickup.businessName}</Text>
              <Text style={styles.address}>{order.pickup.address}</Text>
              {order.pickup.specialInstructions && (
                <Text style={styles.instructions}>
                  💡 {order.pickup.specialInstructions}
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.mapButton}
              onPress={() => openInMaps(
                order.pickup.location.latitude,
                order.pickup.location.longitude,
                order.pickup.businessName
              )}
            >
              <Text style={styles.mapButtonText}>🗺️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Punto de entrega */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏠 Punto de Entrega</Text>
          <View style={styles.locationCard}>
            <View style={styles.locationInfo}>
              <Text style={styles.address}>{order.delivery.address}</Text>
            </View>
            <TouchableOpacity
              style={styles.mapButton}
              onPress={() => openInMaps(
                order.delivery.location.latitude,
                order.delivery.location.longitude,
                'Destino'
              )}
            >
              <Text style={styles.mapButtonText}>🗺️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Items del pedido */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📦 Items del Pedido</Text>
          {order.delivery.items.map((item, index) => (
            <View key={index} style={styles.itemCard}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemQuantity}>Cantidad: {item.quantity}</Text>
                {item.notes && (
                  <Text style={styles.itemNotes}>Nota: {item.notes}</Text>
                )}
              </View>
              <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Información de pago */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💳 Información de Pago</Text>
          <View style={styles.paymentCard}>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Método de pago:</Text>
              <Text style={styles.paymentValue}>
                {order.paymentMethod === 'CASH' ? '💵 Efectivo' : '💳 Tarjeta'}
              </Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Total del pedido:</Text>
              <Text style={styles.paymentValue}>${order.total.toFixed(2)}</Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Comisión plataforma:</Text>
              <Text style={styles.paymentValue}>${order.platformFee.toFixed(2)}</Text>
            </View>
            {order.tip && (
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Propina:</Text>
                <Text style={styles.paymentValue}>${order.tip.toFixed(2)}</Text>
              </View>
            )}
            <View style={[styles.paymentRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Tu ganancia:</Text>
              <Text style={styles.totalValue}>${order.estimatedEarnings.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Información de tiempo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⏱️ Tiempo Estimado</Text>
          <View style={styles.timeCard}>
            <Text style={styles.timeText}>
              Tiempo total estimado: {order.estimatedTime} minutos
            </Text>
          </View>
        </View>

        {/* Advertencia para pedidos en efectivo */}
        {order.paymentMethod === 'CASH' && !canAcceptCashOrder && (
          <View style={styles.warningCard}>
            <Text style={styles.warningText}>
              ⚠️ No puedes aceptar pedidos en efectivo porque has alcanzado tu límite de deuda de ${creditLimit}.
            </Text>
            <TouchableOpacity
              style={styles.payDebtButton}
              onPress={() => navigation.navigate('Payments')}
            >
              <Text style={styles.payDebtButtonText}>Pagar deuda</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Botones de acción */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.rejectButton}
          onPress={handleRejectOrder}
        >
          <Text style={styles.rejectButtonText}>Rechazar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.acceptButton,
            (!canAcceptCashOrder || accepting) && styles.acceptButtonDisabled
          ]}
          onPress={handleAcceptOrder}
          disabled={!canAcceptCashOrder || accepting}
        >
          {accepting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.acceptButtonText}>Aceptar Pedido</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerLeft: {
    flex: 1,
  },
  orderId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  distance: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  earnings: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  earningsLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#FFFFFF',
    margin: 10,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  customerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  customerPhone: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  callButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  callButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  locationCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  instructions: {
    fontSize: 14,
    color: '#FF6B35',
    fontStyle: 'italic',
  },
  mapButton: {
    backgroundColor: '#2196F3',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapButtonText: {
    fontSize: 18,
  },
  itemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  itemQuantity: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  itemNotes: {
    fontSize: 12,
    color: '#FF6B35',
    marginTop: 2,
    fontStyle: 'italic',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  paymentCard: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentLabel: {
    fontSize: 14,
    color: '#666',
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 8,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  timeCard: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  timeText: {
    fontSize: 14,
    color: '#666',
  },
  warningCard: {
    backgroundColor: '#FFF3E0',
    margin: 10,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  warningText: {
    fontSize: 14,
    color: '#E65100',
    marginBottom: 12,
  },
  payDebtButton: {
    backgroundColor: '#FF9800',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  payDebtButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 10,
  },
  rejectButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  acceptButton: {
    flex: 2,
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButtonDisabled: {
    backgroundColor: '#CCC',
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default OrderDetailScreen;
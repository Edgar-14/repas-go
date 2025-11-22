import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { loadOrders, fetchOrderHistory, acceptOrder } from '../store/slices/ordersSlice';
import { Order, OrderStatus } from '../types/index';

interface NavigationProps {
  navigation: any;
  route?: any;
}

const OrdersScreen: React.FC<NavigationProps> = ({ navigation, route }) => {
  const initialTab = route?.params?.initialTab || 'available';
  const [activeTab, setActiveTab] = useState<'available' | 'history'>(initialTab);
  const [refreshing, setRefreshing] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const { driver } = useSelector((state: RootState) => state.auth);
  const orders = useSelector((state: RootState) => state.orders);
  const driverState = useSelector((state: RootState) => state.driver);

  const availableOrders = orders.availableOrders || [];
  const assignedOrders = orders.assignedOrders || [];
  const orderHistory = orders.orderHistory || [];
  const activeOrder = orders.activeOrder;
  const isOnline = driver?.operational?.status === 'ACTIVE' && driver?.operational?.isOnline;

  const convertTimestampToDate = (timestamp: any): Date => {
    if (!timestamp) return new Date();
    if (timestamp instanceof Date) return timestamp;
    if (timestamp.seconds) return new Date(timestamp.seconds * 1000);
    return new Date();
  };

  useEffect(() => {
    if (!driver?.uid) return;

    if (activeTab === 'available') {
      dispatch(loadOrders(driver.uid));
    } else if (activeTab === 'history') {
      dispatch(fetchOrderHistory(driver.uid));
    }
  }, [dispatch, driver?.uid, activeTab]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (driver?.uid) {
      if (activeTab === 'available') {
        await dispatch(loadOrders(driver.uid));
      } else if (activeTab === 'history') {
        await dispatch(fetchOrderHistory(driver.uid));
      }
    }
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
      case 'CREATED': return '#9E9E9E';
      case 'SEARCHING_DRIVER': return '#FF9800';
      case 'ASSIGNED': return '#3F51B5';
      case 'STARTED':
      case 'PICKED_UP': return '#FF9800';
      case 'IN_TRANSIT': return '#2196F3';
      case 'COMPLETED': return '#4CAF50';
      case 'CANCELLED': return '#F44336';
      case 'FAILED': return '#D32F2F';
      default: return '#616161';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Pendiente';
      case 'CREATED': return 'Creado';
      case 'SEARCHING_DRIVER': return 'Buscando conductor';
      case 'ASSIGNED': return 'Asignado';
      case 'STARTED': return 'Iniciado';
      case 'PICKED_UP': return 'Recogido';
      case 'IN_TRANSIT': return 'En tránsito';
      case 'COMPLETED': return 'Completado';
      case 'CANCELLED': return 'Cancelado';
      case 'FAILED': return 'Fallido';
      default: return status || 'Desconocido';
    }
  };

  const handleAcceptOrder = (orderId: string) => {
    if (!driver?.uid) return;
    
    Alert.alert(
      'Aceptar Pedido',
      '¿Estás seguro de que quieres aceptar este pedido?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aceptar',
          onPress: () => {
            dispatch(acceptOrder({ orderId, driverId: driver.uid }));
          }
        }
      ]
    );
  };

  const renderAvailableOrder = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => handleAcceptOrder(item.id)}
    >
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderId}>#{item.orderNumber || item.id.slice(-6)}</Text>
          <Text style={styles.orderDistance}>{(item.distance || 0).toFixed(1)} km</Text>
        </View>
        <View style={styles.orderEarnings}>
          <Text style={styles.earningsAmount}>${(item.deliveryFee || item.earnings || 0).toFixed(2)}</Text>
          <Text style={styles.earningsLabel}>Ganancia</Text>
        </View>
      </View>
      <View style={styles.orderLocations}>
        <Text style={styles.pickup}>📍 {item.pickup?.name || item.pickup?.businessName || 'Recogida'}</Text>
        <Text style={styles.delivery}>🏠 {item.customer?.address || item.customer?.name || 'Entrega'}</Text>
      </View>
      <View style={styles.orderFooter}>
        <Text style={styles.paymentMethod}>
          {item.paymentMethod === 'CASH' ? '💵 Efectivo' : '💳 Tarjeta'}
        </Text>
        <Text style={styles.totalAmount}>Total: ${(item.totalAmount || item.total || 0).toFixed(2)}</Text>
      </View>
      <TouchableOpacity style={styles.acceptButton}>
        <Text style={styles.acceptButtonText}>Tocar para Aceptar</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderHistoryOrder = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.historyCard}
      onPress={() => {
        Alert.alert(
          `Pedido #${item.orderNumber || item.id.slice(-6)}`,
          `Estado: ${getStatusText(item.status)}\nGanancia: ${(item.deliveryFee || item.earnings || 0).toFixed(2)}\nFecha: ${item.createdAt ? convertTimestampToDate(item.createdAt).toLocaleDateString() : 'Sin fecha'}`
        );
      }}
    >
      <View style={styles.historyHeader}>
        <View style={styles.historyInfo}>
          <Text style={styles.historyId}>#{item.orderNumber || item.id.slice(-6)}</Text>
          <Text style={styles.historyDate}>
            {item.createdAt ? convertTimestampToDate(item.createdAt).toLocaleDateString() : 'Sin fecha'}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>
      <Text style={styles.historyAddress}>
        📍 {item.pickup?.name || item.pickup?.businessName || 'Recogida'} → 🏠 {item.customer?.name || item.customer?.address || 'Entrega'}
      </Text>
      <View style={styles.historyFooter}>
        <Text style={styles.historyEarnings}>${(item.deliveryFee || item.earnings || 0).toFixed(2)}</Text>
        <Text style={styles.historyPayment}>
          {item.paymentMethod === 'CASH' ? '💵' : '💳'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyAvailable = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📦</Text>
      <Text style={styles.emptyTitle}>
        {!isOnline ? 'Estás desconectado' : 'No hay pedidos disponibles'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {!isOnline
          ? 'Conéctate para ver pedidos disponibles'
          : 'Te notificaremos cuando haya nuevos pedidos cerca'
        }
      </Text>
    </View>
  );

  const renderEmptyHistory = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={styles.emptyTitle}>Sin historial</Text>
      <Text style={styles.emptySubtitle}>
        Aquí aparecerán tus pedidos completados
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {activeOrder && (
        <TouchableOpacity
          style={styles.activeOrderBanner}
          onPress={() => navigation.navigate('Navigation', { orderId: activeOrder.id })}
        >
          <Text style={styles.activeOrderText}>
            🚚 Pedido activo: #{activeOrder.orderNumber || activeOrder.id.slice(-6)}
          </Text>
          <Text style={styles.activeOrderStatus}>
            {getStatusText(activeOrder.status)}
          </Text>
        </TouchableOpacity>
      )}

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'available' && styles.activeTab]}
          onPress={() => setActiveTab('available')}
        >
          <Text style={[styles.tabText, activeTab === 'available' && styles.activeTabText]}>
            Disponibles ({availableOrders.length + assignedOrders.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
            Historial ({orderHistory.length})
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={activeTab === 'available' ? [...availableOrders, ...assignedOrders] : orderHistory}
        renderItem={activeTab === 'available' ? renderAvailableOrder : renderHistoryOrder}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={activeTab === 'available' ? renderEmptyAvailable : renderEmptyHistory}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  activeOrderBanner: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2196F3',
  },
  activeOrderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  activeOrderStatus: {
    fontSize: 14,
    color: '#1976D2',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#FF6B35',
  },
  tabText: {
    fontSize: 16,
    color: '#666666',
  },
  activeTabText: {
    color: '#FF6B35',
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3748',
  },
  orderDistance: {
    fontSize: 14,
    color: '#718096',
    marginTop: 2,
  },
  orderEarnings: {
    alignItems: 'flex-end',
  },
  earningsAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00B894',
  },
  earningsLabel: {
    fontSize: 12,
    color: '#718096',
  },
  orderLocations: {
    marginBottom: 12,
  },
  pickup: {
    fontSize: 14,
    color: '#2D3748',
    marginBottom: 4,
  },
  delivery: {
    fontSize: 14,
    color: '#2D3748',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentMethod: {
    fontSize: 14,
    color: '#718096',
  },
  totalAmount: {
    fontSize: 14,
    color: '#718096',
    fontWeight: 'bold',
  },
  acceptButton: {
    backgroundColor: '#00B894',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyInfo: {
    flex: 1,
  },
  historyId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3748',
  },
  historyDate: {
    fontSize: 12,
    color: '#718096',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  historyAddress: {
    fontSize: 14,
    color: '#2D3748',
    marginBottom: 8,
  },
  historyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyEarnings: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00B894',
  },
  historyPayment: {
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});

export default OrdersScreen;

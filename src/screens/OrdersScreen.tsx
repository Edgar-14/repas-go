// Pantalla de lista de pedidos para BeFast GO
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
import { listenForAvailableOrders, fetchOrderHistory } from '../store/slices/ordersSlice';
import { NavigationProps, Order, OrderStatus } from '../types';

const OrdersScreen: React.FC<NavigationProps> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<'available' | 'history'>('available');
  const [refreshing, setRefreshing] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const orders = useSelector((state: RootState) => state.orders);
  const driver = useSelector((state: RootState) => state.driver);
  const { availableOrders, orderHistory, activeOrder } = orders as any;
  const { isOnline } = driver as any;

  useEffect(() => {
    if (user?.uid) {
      if (isOnline && activeTab === 'available') {
        dispatch(listenForAvailableOrders(user.uid));
      }
      if (activeTab === 'history') {
        dispatch(fetchOrderHistory(user.uid));
      }
    }
  }, [dispatch, user?.uid, isOnline, activeTab]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (user?.uid) {
      if (activeTab === 'available' && isOnline) {
        dispatch(listenForAvailableOrders(user.uid));
      } else if (activeTab === 'history') {
        dispatch(fetchOrderHistory(user.uid));
      }
    }
    setRefreshing(false);
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING: return '#9E9E9E';
      case OrderStatus.SEARCHING: return '#FFC107';
      case OrderStatus.ASSIGNED: return '#2196F3';
      case OrderStatus.ACCEPTED: return '#3F51B5';
      case OrderStatus.PICKED_UP: return '#FF9800';
      case OrderStatus.IN_TRANSIT: return '#FF5722';
      case OrderStatus.ARRIVED: return '#8BC34A';
      case OrderStatus.DELIVERED: return '#4CAF50';
      case OrderStatus.COMPLETED: return '#2E7D32';
      case OrderStatus.FAILED: return '#F44336';
      case OrderStatus.CANCELLED: return '#616161';
      default: return '#9E9E9E';
    }
  };

  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING: return 'Pendiente';
      case OrderStatus.SEARCHING: return 'Buscando repartidor';
      case OrderStatus.ASSIGNED: return 'Asignado';
      case OrderStatus.ACCEPTED: return 'Aceptado';
      case OrderStatus.PICKED_UP: return 'Recogido';
      case OrderStatus.IN_TRANSIT: return 'En camino';
      case OrderStatus.ARRIVED: return 'Llegó al destino';
      case OrderStatus.DELIVERED: return 'Entregado';
      case OrderStatus.COMPLETED: return 'Completado';
      case OrderStatus.FAILED: return 'Fallido';
      case OrderStatus.CANCELLED: return 'Cancelado';
      default: return status;
    }
  };

  const renderAvailableOrder = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
    >
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderId}>#{item.id.slice(-6)}</Text>
          <Text style={styles.orderDistance}>{item.distance.toFixed(1)} km</Text>
        </View>
        <View style={styles.orderEarnings}>
          <Text style={styles.earningsAmount}>${item.estimatedEarnings}</Text>
          <Text style={styles.earningsLabel}>Ganancia</Text>
        </View>
      </View>

      <View style={styles.orderLocations}>
        <Text style={styles.pickup}>📍 {item.pickup.businessName}</Text>
        <Text style={styles.delivery}>🏠 {item.delivery.address}</Text>
      </View>

      <View style={styles.orderFooter}>
        <Text style={styles.paymentMethod}>
          {item.paymentMethod === 'CASH' ? '💵 Efectivo' : '💳 Tarjeta'}
        </Text>
        <Text style={styles.estimatedTime}>⏱️ {item.estimatedTime} min</Text>
      </View>
    </TouchableOpacity>
  );

  const renderHistoryOrder = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.historyCard}
      onPress={() => {
        // Mostrar detalles del pedido histórico
        Alert.alert(
          `Pedido #${item.id.slice(-6)}`,
          `Estado: ${getStatusText(item.status)}\nGanancia: $${item.estimatedEarnings}\nFecha: ${new Date(item.createdAt).toLocaleDateString()}`
        );
      }}
    >
      <View style={styles.historyHeader}>
        <View style={styles.historyInfo}>
          <Text style={styles.historyId}>#{item.id.slice(-6)}</Text>
          <Text style={styles.historyDate}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      <Text style={styles.historyAddress}>
        📍 {item.pickup.businessName} → 🏠 {item.delivery.address}
      </Text>

      <View style={styles.historyFooter}>
        <Text style={styles.historyEarnings}>${item.estimatedEarnings}</Text>
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
      {/* Pedido activo (si existe) */}
      {activeOrder && (
        <TouchableOpacity
          style={styles.activeOrderBanner}
          onPress={() => navigation.navigate('Navigation', { orderId: activeOrder.id })}
        >
          <Text style={styles.activeOrderText}>
            🚚 Pedido activo: #{activeOrder.id.slice(-6)}
          </Text>
          <Text style={styles.activeOrderStatus}>
            {getStatusText(activeOrder.status)}
          </Text>
        </TouchableOpacity>
      )}

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'available' && styles.activeTab]}
          onPress={() => setActiveTab('available')}
        >
          <Text style={[styles.tabText, activeTab === 'available' && styles.activeTabText]}>
            Disponibles ({availableOrders.length})
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

      {/* Lista de pedidos */}
      <FlatList
        data={activeTab === 'available' ? availableOrders : orderHistory}
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
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#FF6B35',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#FF6B35',
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
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
    color: '#333',
  },
  orderDistance: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  orderEarnings: {
    alignItems: 'flex-end',
  },
  earningsAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  earningsLabel: {
    fontSize: 12,
    color: '#666',
  },
  orderLocations: {
    marginBottom: 12,
  },
  pickup: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  delivery: {
    fontSize: 14,
    color: '#333',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentMethod: {
    fontSize: 14,
    color: '#666',
  },
  estimatedTime: {
    fontSize: 14,
    color: '#666',
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
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
    color: '#333',
  },
  historyDate: {
    fontSize: 12,
    color: '#666',
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
    fontWeight: '600',
  },
  historyAddress: {
    fontSize: 14,
    color: '#333',
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
    color: '#4CAF50',
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
    color: '#333',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

export default OrdersScreen;
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
import { loadOrders, fetchOrderHistory } from '../store/slices/ordersSlice';
import { Order, OrderStatus } from '../types';
import { firestore, COLLECTIONS } from '../config/firebase';

interface NavigationProps {
  navigation: any;
  route?: any;
}

const OrdersScreen: React.FC<NavigationProps> = ({ navigation, route }) => {
  const initialTab = route?.params?.initialTab || 'available';
  const [activeTab, setActiveTab] = useState<'available' | 'history'>(initialTab);
  const [refreshing, setRefreshing] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const orders = useSelector((state: RootState) => state.orders);
  const driver = useSelector((state: RootState) => state.driver);
  
  const availableOrders = orders.availableOrders || [];
  const assignedOrders = orders.assignedOrders || [];
  const orderHistory = orders.orderHistory || [];
  const activeOrder = orders.activeOrder;
  const isOnline = driver.isOnline;

  useEffect(() => {
    if (!user?.uid) return;

    if (activeTab === 'available') {
      // Cargar pedidos usando Cloud Function
      dispatch(loadOrders());
    } else if (activeTab === 'history') {
      dispatch(fetchOrderHistory(user.uid));
    }
  }, [dispatch, user?.uid, activeTab]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (user?.uid) {
      if (activeTab === 'available') {
        await dispatch(loadOrders());
      } else if (activeTab === 'history') {
        await dispatch(fetchOrderHistory(user.uid));
      }
    }
    setRefreshing(false);
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING: return '#9E9E9E';
      case OrderStatus.ACCEPTED: return '#3F51B5';
      case OrderStatus.PICKED_UP: return '#FF9800';
      case OrderStatus.ARRIVED: return '#8BC34A';
      case OrderStatus.DELIVERED: return '#4CAF50';
      case OrderStatus.COMPLETED: return '#2E7D32';
      default: return '#616161';
    }
  };

  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING: return 'Pendiente';
      case OrderStatus.ACCEPTED: return 'Aceptado';
      case OrderStatus.PICKED_UP: return 'Recogido';
      case OrderStatus.ARRIVED: return 'Llegó al destino';
      case OrderStatus.DELIVERED: return 'Entregado';
      case OrderStatus.COMPLETED: return 'Completado';
      case 'SEARCHING' as any: return 'Buscando';
      case 'CANCELLED' as any: return 'Cancelado';
      case 'FAILED' as any: return 'Fallido';
      default: return (status as string) || 'Desconocido';
    }
  };

  const renderAvailableOrder = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => Alert.alert(
        `Pedido #${item.id.slice(-6)}`,
        `${item.pickup?.businessName || 'Tienda'}\n→\n${item.delivery?.address || 'Cliente'}\n\nGanancia: $${item.estimatedEarnings || 0}`
      )}
    >
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderId}>#{item.id.slice(-6)}</Text>
          <Text style={styles.orderDistance}>{(item.distance || 0).toFixed(1)} km</Text>
        </View>
        <View style={styles.orderEarnings}>
          <Text style={styles.earningsAmount}>${item.estimatedEarnings || 0}</Text>
          <Text style={styles.earningsLabel}>Ganancia</Text>
        </View>
      </View>
      <View style={styles.orderLocations}>
        <Text style={styles.pickup}>📍 {item.pickup?.businessName || 'Recogida'}</Text>
        <Text style={styles.delivery}>🏠 {item.delivery?.address || 'Entrega'}</Text>
      </View>
      <View style={styles.orderFooter}>
        <Text style={styles.paymentMethod}>
          {item.paymentMethod === 'CASH' ? '💵 Efectivo' : '💳 Tarjeta'}
        </Text>
        <Text style={styles.estimatedTime}>⏱️ {item.estimatedTime || '?'} min</Text>
      </View>
    </TouchableOpacity>
  );

  const renderHistoryOrder = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.historyCard}
      onPress={() => {
        Alert.alert(
          `Pedido #${item.id.slice(-6)}`,
          `Estado: ${getStatusText(item.status as OrderStatus)}\nGanancia: $${item.estimatedEarnings || 0}\nFecha: ${item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Sin fecha'}`
        );
      }}
    >
      <View style={styles.historyHeader}>
        <View style={styles.historyInfo}>
          <Text style={styles.historyId}>#{item.id.slice(-6)}</Text>
          <Text style={styles.historyDate}>
            {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Sin fecha'}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status as OrderStatus) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status as OrderStatus)}</Text>
        </View>
      </View>
      <Text style={styles.historyAddress}>
        📍 {item.pickup?.businessName || 'Recogida'} → 🏠 {item.delivery?.address || 'Entrega'}
      </Text>
      <View style={styles.historyFooter}>
        <Text style={styles.historyEarnings}>${item.estimatedEarnings || 0}</Text>
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
            🚚 Pedido activo: #{activeOrder.id.slice(-6)}
          </Text>
          <Text style={styles.activeOrderStatus}>
            {getStatusText(activeOrder.status as OrderStatus)}
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
  estimatedTime: {
    fontSize: 14,
    color: '#718096',
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
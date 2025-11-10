// Pantalla principal Dashboard para BeFast GO
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
  Switch,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { updateDriverStatus, fetchDriverStats } from '../store/slices/driverSlice';
import { listenForAvailableOrders } from '../store/slices/ordersSlice';
import { listenToWalletBalance } from '../store/slices/walletSlice';
import { NavigationProps, Order } from '../types';

const DashboardScreen: React.FC<NavigationProps> = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  
  const dispatch = useDispatch<AppDispatch>();
  const { user, driver: authDriver } = useSelector((state: RootState) => state.auth);
  const driverState = useSelector((state: RootState) => state.driver);
  const orders = useSelector((state: RootState) => state.orders);
  const wallet = useSelector((state: RootState) => state.wallet);
  
  const { isOnline, status, stats } = driverState as any;
  const { availableOrders, activeOrder } = orders as any;
  const { balance, pendingDebts } = wallet as any;

  useEffect(() => {
    if (user?.uid) {
      // Cargar datos iniciales
      dispatch(fetchDriverStats(user.uid));
      dispatch(listenToWalletBalance(user.uid));
      
      // Si está online, escuchar pedidos disponibles
      if (isOnline) {
        dispatch(listenForAvailableOrders(user.uid));
      }
    }
  }, [dispatch, user?.uid, isOnline]);

  const handleToggleOnline = async () => {
    if (!user?.uid) return;

    const newOnlineStatus = !isOnline;
    const newStatus = newOnlineStatus ? 'ACTIVE' : 'OFFLINE';

    try {
      await dispatch(updateDriverStatus({
        driverId: user.uid,
        status: newStatus,
        isOnline: newOnlineStatus
      }));

      if (newOnlineStatus) {
        // Comenzar a escuchar pedidos disponibles
        dispatch(listenForAvailableOrders(user.uid));
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo cambiar el estado');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (user?.uid) {
      await dispatch(fetchDriverStats(user.uid));
    }
    setRefreshing(false);
  };

  const getStatusColor = () => {
    switch (status) {
      case 'ACTIVE': return '#4CAF50';
      case 'BUSY': return '#FF9800';
      case 'BREAK': return '#2196F3';
      default: return '#9E9E9E';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'ACTIVE': return 'Disponible';
      case 'BUSY': return 'Ocupado';
      case 'BREAK': return 'En descanso';
      default: return 'Desconectado';
    }
  };

  const renderOrderCard = (order: Order) => (
    <TouchableOpacity
      key={order.id}
      style={styles.orderCard}
      onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.orderDistance}>{order.distance.toFixed(1)} km</Text>
        <Text style={styles.orderEarnings}>${order.estimatedEarnings}</Text>
      </View>
      
      <Text style={styles.orderPickup}>
        📍 {order.pickup.businessName}
      </Text>
      <Text style={styles.orderDelivery}>
        🏠 {order.delivery.address}
      </Text>
      
      <View style={styles.orderFooter}>
        <Text style={styles.orderPayment}>
          {order.paymentMethod === 'CASH' ? '💵 Efectivo' : '💳 Tarjeta'}
        </Text>
        <Text style={styles.orderTime}>
          ⏱️ {order.estimatedTime} min
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header con estado */}
      <View style={styles.header}>
        <View style={styles.statusContainer}>
          <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>
        
        <View style={styles.onlineToggle}>
          <Text style={styles.onlineLabel}>
            {isOnline ? 'En línea' : 'Desconectado'}
          </Text>
          <Switch
            value={isOnline}
            onValueChange={handleToggleOnline}
            trackColor={{ false: '#767577', true: '#4CAF50' }}
            thumbColor={isOnline ? '#FFFFFF' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Saludo personalizado */}
      <View style={styles.greetingContainer}>
        <Text style={styles.greeting}>
          ¡Hola, {authDriver?.personalData?.fullName?.split(' ')[0] || 'Conductor'}! 👋
        </Text>
        <Text style={styles.subGreeting}>
          {isOnline ? 'Listo para recibir pedidos' : 'Conéctate para recibir pedidos'}
        </Text>
      </View>

      {/* Métricas del día */}
      <View style={styles.metricsContainer}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{stats.completedOrders}</Text>
          <Text style={styles.metricLabel}>Pedidos Hoy</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>${stats.totalEarnings.toFixed(0)}</Text>
          <Text style={styles.metricLabel}>Ganancias</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{stats.rating.toFixed(1)} ⭐</Text>
          <Text style={styles.metricLabel}>Calificación</Text>
        </View>
      </View>

      {/* Billetera rápida */}
      <TouchableOpacity
        style={styles.walletCard}
        onPress={() => navigation.navigate('Payments')}
      >
        <View style={styles.walletHeader}>
          <Text style={styles.walletTitle}>💰 Mi Billetera</Text>
          <Text style={styles.walletBalance}>${balance.toFixed(2)}</Text>
        </View>
        {pendingDebts > 0 && (
          <Text style={styles.walletDebt}>
            Deuda pendiente: ${pendingDebts.toFixed(2)}
          </Text>
        )}
      </TouchableOpacity>

      {/* Pedido activo */}
      {activeOrder && (
        <View style={styles.activeOrderContainer}>
          <Text style={styles.sectionTitle}>🚚 Pedido Activo</Text>
          <TouchableOpacity
            style={styles.activeOrderCard}
            onPress={() => navigation.navigate('Navigation', { orderId: activeOrder.id })}
          >
            <Text style={styles.activeOrderStatus}>
              Estado: {activeOrder.status}
            </Text>
            <Text style={styles.activeOrderAddress}>
              📍 {activeOrder.delivery.address}
            </Text>
            <Text style={styles.activeOrderEarnings}>
              Ganancia: ${activeOrder.estimatedEarnings}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Pedidos disponibles */}
      {isOnline && !activeOrder && (
        <View style={styles.ordersContainer}>
          <Text style={styles.sectionTitle}>
            📦 Pedidos Disponibles ({availableOrders.length})
          </Text>
          
          {availableOrders.length === 0 ? (
            <View style={styles.noOrdersContainer}>
              <Text style={styles.noOrdersText}>
                No hay pedidos disponibles en este momento
              </Text>
              <Text style={styles.noOrdersSubtext}>
                Te notificaremos cuando haya nuevos pedidos cerca
              </Text>
            </View>
          ) : (
            availableOrders.slice(0, 3).map(renderOrderCard)
          )}
          
          {availableOrders.length > 3 && (
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => navigation.navigate('Orders')}
            >
              <Text style={styles.viewAllText}>
                Ver todos los pedidos ({availableOrders.length})
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Mensaje cuando está offline */}
      {!isOnline && (
        <View style={styles.offlineContainer}>
          <Text style={styles.offlineTitle}>📴 Estás desconectado</Text>
          <Text style={styles.offlineText}>
            Activa el modo en línea para comenzar a recibir pedidos
          </Text>
        </View>
      )}

      {/* Accesos rápidos */}
      <View style={styles.quickActionsContainer}>
        <Text style={styles.sectionTitle}>Accesos Rápidos</Text>
        
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.quickActionIcon}>👤</Text>
            <Text style={styles.quickActionText}>Perfil</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('Documents')}
          >
            <Text style={styles.quickActionIcon}>📄</Text>
            <Text style={styles.quickActionText}>Documentos</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('Emergency')}
          >
            <Text style={styles.quickActionIcon}>🚨</Text>
            <Text style={styles.quickActionText}>Emergencia</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={styles.quickActionIcon}>⚙️</Text>
            <Text style={styles.quickActionText}>Configuración</Text>
          </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  onlineToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  greetingContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 14,
    color: '#666',
  },
  metricsContainer: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 0,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  walletCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    marginTop: 10,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  walletTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  walletBalance: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  walletDebt: {
    fontSize: 14,
    color: '#FF5722',
    marginTop: 8,
  },
  activeOrderContainer: {
    margin: 20,
    marginTop: 0,
  },
  activeOrderCard: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  activeOrderStatus: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
    marginBottom: 8,
  },
  activeOrderAddress: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  activeOrderEarnings: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  ordersContainer: {
    margin: 20,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
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
    marginBottom: 8,
  },
  orderDistance: {
    fontSize: 14,
    color: '#666',
  },
  orderEarnings: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  orderPickup: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  orderDelivery: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderPayment: {
    fontSize: 12,
    color: '#666',
  },
  orderTime: {
    fontSize: 12,
    color: '#666',
  },
  noOrdersContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  noOrdersText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  noOrdersSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  viewAllButton: {
    backgroundColor: '#FF6B35',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  viewAllText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  offlineContainer: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  offlineTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  offlineText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  quickActionsContainer: {
    margin: 20,
    marginTop: 0,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    backgroundColor: '#FFFFFF',
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
});

export default DashboardScreen;
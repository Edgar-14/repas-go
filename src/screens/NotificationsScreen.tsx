// Pantalla de notificaciones para BeFast GO
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { 
  markAsRead, 
  markAllAsRead, 
  removeNotification, 
  clearAllNotifications,
  Notification 
} from '../store/slices/notificationsSlice';
import { NavigationProps } from '../types';

const NotificationsScreen: React.FC<NavigationProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const notificationsState = useSelector((state: RootState) => state.notifications);
  const { notifications, unreadCount } = notificationsState as any;

  const handleMarkAsRead = (notificationId: string) => {
    dispatch(markAsRead(notificationId));
  };

  const handleMarkAllAsRead = () => {
    if (unreadCount > 0) {
      dispatch(markAllAsRead());
    }
  };

  const handleRemoveNotification = (notificationId: string) => {
    dispatch(removeNotification(notificationId));
  };

  const handleClearAll = () => {
    Alert.alert(
      'Limpiar notificaciones',
      '¿Estás seguro de que quieres eliminar todas las notificaciones?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar todas',
          style: 'destructive',
          onPress: () => dispatch(clearAllNotifications())
        }
      ]
    );
  };

  const handleNotificationPress = (notification: Notification) => {
    // Marcar como leída
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }

    // Navegar según el tipo de notificación
    switch (notification.type) {
      case 'NEW_ORDER':
        if (notification.data?.orderId) {
          navigation.navigate('OrderDetail', { orderId: notification.data.orderId });
        }
        break;
      case 'ORDER_UPDATE':
        if (notification.data?.orderId) {
          navigation.navigate('Navigation', { orderId: notification.data.orderId });
        }
        break;
      case 'PAYMENT':
        navigation.navigate('Payments');
        break;
      case 'EMERGENCY':
        navigation.navigate('Emergency');
        break;
      default:
        // Para notificaciones del sistema, solo mostrar el contenido
        break;
    }
  };

  const getNotificationIcon = (type: string, priority: string) => {
    if (priority === 'URGENT') return '🚨';
    
    switch (type) {
      case 'NEW_ORDER': return '📦';
      case 'ORDER_UPDATE': return '🔄';
      case 'PAYMENT': return '💰';
      case 'SYSTEM': return 'ℹ️';
      case 'EMERGENCY': return '🚨';
      default: return '📢';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return '#F44336';
      case 'HIGH': return '#FF9800';
      case 'MEDIUM': return '#2196F3';
      case 'LOW': return '#4CAF50';
      default: return '#9E9E9E';
    }
  };

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    
    return new Date(timestamp).toLocaleDateString();
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[
        styles.notificationCard,
        !item.read && styles.unreadNotification
      ]}
      onPress={() => handleNotificationPress(item)}
      onLongPress={() => {
        Alert.alert(
          'Opciones',
          'Selecciona una opción',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: item.read ? 'Marcar como no leída' : 'Marcar como leída',
              onPress: () => handleMarkAsRead(item.id)
            },
            {
              text: 'Eliminar',
              style: 'destructive',
              onPress: () => handleRemoveNotification(item.id)
            }
          ]
        );
      }}
    >
      <View style={styles.notificationHeader}>
        <View style={styles.notificationLeft}>
          <Text style={styles.notificationIcon}>
            {getNotificationIcon(item.type, item.priority)}
          </Text>
          <View style={styles.notificationContent}>
            <Text style={[
              styles.notificationTitle,
              !item.read && styles.unreadTitle
            ]}>
              {item.title}
            </Text>
            <Text style={styles.notificationMessage} numberOfLines={2}>
              {item.message}
            </Text>
          </View>
        </View>
        
        <View style={styles.notificationRight}>
          <Text style={styles.notificationTime}>
            {formatTime(item.timestamp)}
          </Text>
          {!item.read && <View style={styles.unreadDot} />}
          <View style={[
            styles.priorityIndicator,
            { backgroundColor: getPriorityColor(item.priority) }
          ]} />
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🔔</Text>
      <Text style={styles.emptyTitle}>No hay notificaciones</Text>
      <Text style={styles.emptySubtitle}>
        Aquí aparecerán tus notificaciones de pedidos, pagos y sistema
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header con acciones */}
      {notifications.length > 0 && (
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {notifications.length} notificaciones
            {unreadCount > 0 && ` (${unreadCount} sin leer)`}
          </Text>
          
          <View style={styles.headerActions}>
            {unreadCount > 0 && (
              <TouchableOpacity
                style={styles.headerButton}
                onPress={handleMarkAllAsRead}
              >
                <Text style={styles.headerButtonText}>Marcar todas</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleClearAll}
            >
              <Text style={styles.headerButtonText}>Limpiar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Lista de notificaciones */}
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* Filtros rápidos */}
      {notifications.length > 0 && (
        <View style={styles.filtersContainer}>
          <Text style={styles.filtersTitle}>Filtros rápidos:</Text>
          <View style={styles.filtersRow}>
            <TouchableOpacity style={styles.filterButton}>
              <Text style={styles.filterButtonText}>📦 Pedidos</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.filterButton}>
              <Text style={styles.filterButtonText}>💰 Pagos</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.filterButton}>
              <Text style={styles.filterButtonText}>ℹ️ Sistema</Text>
            </TouchableOpacity>
          </View>
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
  header: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  headerButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 8,
  },
  headerButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B35',
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  notificationLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  notificationIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  unreadTitle: {
    fontWeight: 'bold',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  notificationRight: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B35',
    marginBottom: 4,
  },
  priorityIndicator: {
    width: 3,
    height: 20,
    borderRadius: 1.5,
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
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  filtersTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  filtersRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  filterButton: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#666',
  },
});

export default NotificationsScreen;
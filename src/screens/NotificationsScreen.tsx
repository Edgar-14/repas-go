import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { firestore, COLLECTIONS } from '../config/firebase';
import { NavigationProps } from '../types/index';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'ORDER' | 'PAYMENT' | 'SYSTEM' | 'PROMOTION';
  read: boolean;
  createdAt: any;
  data?: any;
}

const NotificationsScreen: React.FC<NavigationProps> = ({ navigation }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { driver } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (driver?.uid) {
      loadNotifications();
    }
  }, [driver?.uid]);

  const loadNotifications = async () => {
    if (!driver?.uid) return;
    
    try {
      const snapshot = await firestore()
        .collection(COLLECTIONS.NOTIFICATIONS || 'notifications')
        .where('userId', '==', driver.uid)
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();
      
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      
      setNotifications(notifs);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await firestore()
        .collection(COLLECTIONS.NOTIFICATIONS || 'notifications')
        .doc(notificationId)
        .update({ read: true });
      
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ORDER': return '📦';
      case 'PAYMENT': return '💰';
      case 'SYSTEM': return '⚙️';
      case 'PROMOTION': return '🎉';
      default: return '🔔';
    }
  };

  const getTimeAgo = (timestamp: any) => {
    if (!timestamp) return 'Hace un momento';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins}m`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    return `Hace ${diffDays}d`;
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity 
      style={[styles.notificationCard, !item.read && styles.unreadCard]}
      onPress={() => {
        if (!item.read) {
          markAsRead(item.id);
        }
        // Navegar según el tipo de notificación
        if (item.type === 'ORDER' && item.data?.orderId) {
          navigation.navigate('OrderDetail', { orderId: item.data.orderId });
        }
      }}
    >
      <View style={styles.notificationHeader}>
        <View style={styles.notificationLeft}>
          <Text style={styles.notificationIcon}>{getNotificationIcon(item.type)}</Text>
          <View style={styles.notificationContent}>
            <Text style={[styles.notificationTitle, !item.read && styles.unreadTitle]}>
              {item.title}
            </Text>
            <Text style={styles.notificationMessage}>{item.message}</Text>
          </View>
        </View>
        <View style={styles.notificationRight}>
          <Text style={styles.notificationTime}>{getTimeAgo(item.createdAt)}</Text>
          {!item.read && <View style={styles.unreadDot} />}
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
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
};

// ... (Estilos permanecen iguales)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#00B894',
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
    color: '#2D3748',
    marginBottom: 4,
  },
  unreadTitle: {
    fontWeight: 'bold',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#718096',
    lineHeight: 20,
  },
  notificationRight: {
    alignItems: 'flex-end',
  },
  notificationTime: {
    fontSize: 12,
    color: '#A0AEC0',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00B894',
    marginTop: 4,
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

export default NotificationsScreen;
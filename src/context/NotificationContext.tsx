"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, limit, Timestamp } from 'firebase/firestore';
import { COLLECTIONS } from '@/lib/collections';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Bell, AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';
// // Firebase Functions imports removed - not needed in frontend
// Removed - not needed in frontend
interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  timestamp: Timestamp;
  targetRole?: string;
  targetUser?: string;
  read?: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    let unsubscribe: (() => void) | undefined;

    const setupNotificationListener = async () => {
      try {
        const idTokenResult = await user.getIdTokenResult();
        const userRole = idTokenResult.claims.role as string;
        
        // Query for notifications targeted to user's role or specific user
        const notificationQuery = query(
          collection(db, COLLECTIONS.NOTIFICATIONS),
          where('targetRole', 'in', [userRole, 'ALL']),
          orderBy('timestamp', 'desc'),
          limit(50)
        );

        unsubscribe = onSnapshot(notificationQuery, (snapshot) => {
          const newNotifications: Notification[] = [];
          let newUnreadCount = 0;

          snapshot.docs.forEach(doc => {
            const data = doc.data();
            const notification: Notification = {
              id: doc.id,
              title: data.title,
              message: data.message,
              type: data.type || 'info',
              timestamp: data.timestamp,
              targetRole: data.targetRole,
              targetUser: data.targetUser,
              read: data.readBy && data.readBy.includes(user.uid),
              priority: data.priority || 'medium'
            };

            newNotifications.push(notification);
            if (!notification.read) {
              newUnreadCount++;
            }
          });

          // Check for new high-priority notifications and show toast
          newNotifications.forEach(notification => {
            if (!notification.read && (notification.priority === 'high' || notification.priority === 'critical')) {
              const isNewNotification = !notifications.find(n => n.id === notification.id);
              if (isNewNotification) {
                showNotificationToast(notification);
              }
            }
          });

          setNotifications(newNotifications);
          setUnreadCount(newUnreadCount);
        });
      } catch (error) {
        console.error('Error setting up notification listener:', error);
      }
    };

    setupNotificationListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user, notifications]);

  const showNotificationToast = (notification: Notification) => {
    const getIcon = () => {
      switch (notification.type) {
        case 'success':
          return <CheckCircle className="w-4 h-4" />;
        case 'error':
          return <XCircle className="w-4 h-4" />;
        case 'warning':
          return <AlertTriangle className="w-4 h-4" />;
        default:
          return <Info className="w-4 h-4" />;
      }
    };

    toast({
      title: notification.title,
      description: notification.message,
      variant: notification.type === 'error' ? 'destructive' : 'default',
    });
  };

  const markAsRead = async (notificationId: string) => {
    if (!user) return;

    try {
      // Update local state immediately
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

      // Update database
      const { doc, updateDoc, arrayUnion } = await import('firebase/firestore');
      await updateDoc(doc(db, 'notifications', notificationId), {
        readBy: arrayUnion(user.uid)
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const addNotification = async (notificationData: Omit<Notification, 'id' | 'timestamp'>) => {
    try {
      const { addDoc } = await import('firebase/firestore');
      await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), {
        ...notificationData,
        timestamp: Timestamp.now(),
        readBy: []
      });
    } catch (error) {
      console.error('Error adding notification:', error);
    }
  };

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    markAsRead,
    addNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Component to show notifications bell with count
export const NotificationBell: React.FC = () => {
  const { unreadCount } = useNotifications();

  return (
    <div className="relative">
      <Bell className="w-5 h-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </div>
  );
};
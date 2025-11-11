import { useState, useCallback, useEffect } from 'react';
import { Driver, Order } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Mock authenticated
  const [activeOrder, setActiveOrderState] = useState<Order | null>(null);
  const [driver, setDriver] = useState<Driver>({
    uid: 'driver123',
    email: 'driver@befast.com',
    personalData: {
      fullName: 'Juan Pérez',
      phone: '+52 55 1234 5678',
      rfc: 'PEJX800101XXX',
      curp: 'PEJX800101HDFXXX01',
      nss: '12345678901'
    },
    administrative: {
      befastStatus: 'ACTIVE',
      imssStatus: 'ACTIVO_COTIZANDO',
      documentsStatus: 'APPROVED',
      trainingStatus: 'COMPLETED',
      idseApproved: true
    },
    operational: {
      isOnline: false,
      status: 'OFFLINE',
      currentOrderId: null
    },
    wallet: {
      balance: 1250.75,
      pendingDebts: 85.50,
      creditLimit: 5000
    },
    stats: {
      totalOrders: 150,
      completedOrders: 145,
      rating: 4.9,
      totalEarnings: 25000,
      acceptanceRate: 92,
      onTimeRate: 98,
      cancellationRate: 2,
      level: 12,
      xp: 1850,
      xpGoal: 2500,
      rank: 'Diamante'
    }
  });

  useEffect(() => {
    loadAuthState();
  }, []);

  const loadAuthState = async () => {
    try {
      const savedOrder = await AsyncStorage.getItem('activeOrder');
      if (savedOrder) {
        setActiveOrderState(JSON.parse(savedOrder));
      }
    } catch (error) {
      console.error('Error loading auth state:', error);
    }
  };

  const updateStatus = useCallback((newStatus: boolean) => {
    setLoading(true);
    setTimeout(() => {
      setDriver(prev => ({
        ...prev,
        operational: { 
          ...prev.operational,
          isOnline: newStatus,
          status: newStatus ? 'ACTIVE' : 'OFFLINE'
        },
      }));
      setLoading(false);
    }, 500);
  }, []);

  const setActiveOrder = useCallback(async (order: Order | null) => {
    try {
      if (order) {
        await AsyncStorage.setItem('activeOrder', JSON.stringify(order));
      } else {
        await AsyncStorage.removeItem('activeOrder');
      }
      setActiveOrderState(order);
    } catch (error) {
      console.error('Error saving active order:', error);
    }
  }, []);

  const login = useCallback(async (driverData: Driver) => {
    setDriver(driverData);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.multiRemove(['activeOrder']);
    setActiveOrderState(null);
    setIsAuthenticated(false);
  }, []);

  return { 
    driver, 
    loading, 
    isAuthenticated,
    activeOrder,
    updateStatus,
    setActiveOrder,
    login,
    logout
  };
};

export { useAuth };
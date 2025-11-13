import { useState, useCallback, useEffect } from 'react';
import { Driver, Order } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, firestore, COLLECTIONS } from '../config/firebase';

const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeOrder, setActiveOrderState] = useState<Order | null>(null);
  const [driver, setDriver] = useState<Driver | any>(null);

  useEffect(() => {
    const unsub = auth().onAuthStateChanged(async (user) => {
      if (user) {
        setIsAuthenticated(true);
        try {
          const doc = await firestore().collection(COLLECTIONS.DRIVERS).doc(user.uid).get();
          if (doc.exists) {
            setDriver(doc.data() as Driver);
          } else {
            setDriver(null);
          }
        } catch (e) {
          // Silenciar errores
        }
      } else {
        setIsAuthenticated(false);
        setDriver(null);
      }
    });
    loadAuthState();
    return () => unsub();
  }, []);

  const loadAuthState = async () => {
    try {
      const savedOrder = await AsyncStorage.getItem('activeOrder');
      if (savedOrder) {
        setActiveOrderState(JSON.parse(savedOrder));
      }
    } catch (error) {
      // Silenciar errores
    }
  };

  const updateStatus = useCallback(async (newStatus: boolean) => {
    const uid = auth().currentUser?.uid;
    if (!uid) return;
    setLoading(true);
    try {
      await firestore().collection(COLLECTIONS.DRIVERS).doc(uid).set({
        operational: {
          isOnline: newStatus,
          status: newStatus ? 'ACTIVE' : 'OFFLINE',
        }
      }, { merge: true });
    } catch (e) {
      // Silenciar errores
    } finally {
      setLoading(false);
    }
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
      // Silenciar errores
    }
  }, []);

  const login = useCallback(async (_driverData: Driver) => {
    setIsAuthenticated(!!auth().currentUser);
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.multiRemove(['activeOrder']);
    setActiveOrderState(null);
    await auth().signOut();
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
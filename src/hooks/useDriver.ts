import { useState, useCallback } from 'react';
import { Driver } from '../types';

const useDriver = () => {
  const [loading, setLoading] = useState(false);
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

  return { driver, loading, updateStatus };
};

export default useDriver;

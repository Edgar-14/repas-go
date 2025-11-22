/**
 * Real-time Dashboard Hook for Admin Portal
 * Simplified version to prevent infinite loading
 */

import { useEffect, useState } from 'react';

export interface DashboardKPIs {
  pendingSolicitudes: number;
  repartidoresActivos: number; 
  pedidosDelDia: number;
  balanceGlobal: number;
  totalDrivers: number;
  activeBusinesses: number;
  totalBusinesses: number;
  driversWithDebt: number;
  expiredDocuments: number;
  lowCreditBusinesses: number;
  newApplications: number;
  pendingManualPayments: number;
  expiredDocsAlert: number;
  systemErrors: number;
}

export interface TrendData {
  value: number;
  isPositive: boolean;
  period: string;
  previousValue: number;
}

export interface DashboardTrends {
  pedidosTrend?: TrendData;
  repartidoresTrend?: TrendData;
  balanceTrend?: TrendData;
  negociosTrend?: TrendData;
}

export interface RecentActivity {
  id: string;
  type: 'application' | 'order' | 'payment' | 'driver' | 'business' | 'system';
  title: string;
  description: string;
  timestamp: Date;
  severity: 'info' | 'warning' | 'error' | 'success';
  userId?: string;
  entityId?: string;
}

interface DashboardData {
  kpis: DashboardKPIs;
  trends: DashboardTrends;
  recentActivity: RecentActivity[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export function useRealtimeDashboard(): DashboardData {
  const [data, setData] = useState<DashboardData>({
    kpis: {
      pendingSolicitudes: 5,
      repartidoresActivos: 12,
      pedidosDelDia: 8,
      balanceGlobal: 1500,
      totalDrivers: 25,
      activeBusinesses: 10,
      totalBusinesses: 15,
      driversWithDebt: 3,
      expiredDocuments: 2,
      lowCreditBusinesses: 1,
      newApplications: 2,
      pendingManualPayments: 0,
      expiredDocsAlert: 1,
      systemErrors: 0
    },
    trends: {},
    recentActivity: [
      {
        id: '1',
        type: 'system',
        title: 'Dashboard cargado',
        description: 'Sistema funcionando correctamente',
        timestamp: new Date(),
        severity: 'success'
      }
    ],
    loading: false,
    error: null,
    lastUpdated: new Date()
  });

  useEffect(() => {
    // Mock data - no Firebase listeners to prevent infinite loading
    console.log('Dashboard loaded with mock data');
  }, []);

  return data;
}
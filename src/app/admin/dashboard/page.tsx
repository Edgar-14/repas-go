'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { usePayrollActions } from '@/hooks/useButtonActions';
import { 
  Users, Package, AlertCircle, DollarSign, Loader2, FileText
} from 'lucide-react';
import ExportOrdersButton from '@/components/ExportOrdersButton';
import ExportDriversButton from '@/components/ExportDriversButton';
import { Section, PageToolbar } from '@/components/layout/primitives';
import {
  MetricCard,
  DriverMetricCard,
  OrderMetricCard,
  RevenueMetricCard,
  BalanceMetricCard,
  BusinessMetricCard,
  AlertMetricCard
} from '@/components/ui/metric-card';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { ResponsiveGrid, ResponsiveContainer } from '@/components/ui/responsive-container';
import { useBreakpoints } from '@/hooks/use-mobile';
import { useRealtimeDashboard } from '@/hooks/useRealtimeDashboard';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * A local authentication hook specific to this component.
 *
 * **WARNING:** This is a critical code duplication. It reimplements the entire authentication
 * flow which is already handled by the global `useAuth` hook in `src/hooks/useAuth.tsx`.
 * This should be removed and the global hook should be used instead.
 *
 * @returns {{ user: User | null, userRole: string | null, authLoading: boolean }} The authentication state.
 */
const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const idTokenResult = await firebaseUser.getIdTokenResult(true);
          const role = idTokenResult.claims.role as string;
          
          const allowedRoles = ['ADMIN', 'SUPER_ADMIN', 'CONTADORA'];
          
          if (role && allowedRoles.includes(role)) {
            setUser(firebaseUser);
            setUserRole(role);
          } else {
            toast({
              title: 'Acceso Denegado',
              description: 'No tienes los permisos necesarios para ver esta página.',
              variant: 'destructive'
            });
            router.push('/admin/login');
          }
        } catch (error) {
          console.error('Error verificando los permisos del usuario:', error);
          router.push('/admin/login');
        }
      } else {
        router.push('/admin/login');
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [router, toast]);

  return { user, userRole, authLoading };
};

/**
 * The main component for the administrator's dashboard page.
 *
 * This component displays key performance indicators (KPIs), trends, and quick actions
 * for managing the system. It uses a custom `useRealtimeDashboard` hook to fetch
 * and display live data.
 */
export default function AdminDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const { processPayroll, generateIDSE } = usePayrollActions();
  const { isMobile, isTablet } = useBreakpoints();
  
  const { user, userRole, authLoading } = useAuth();
  
  // 🔥 NUEVO: Hook de dashboard en tiempo real según documentación
  const { 
    kpis, 
    trends, 
    recentActivity, 
    loading: dashboardLoading, 
    error: dashboardError,
    lastUpdated 
  } = useRealtimeDashboard();

  if (authLoading || dashboardLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-600">
            {authLoading ? 'Verificando permisos...' : 'Cargando datos en tiempo real...'}
          </p>
        </div>
      </div>
    );
  }

  if (dashboardError) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <p className="text-red-600">{dashboardError}</p>
          <Button onClick={() => window.location.reload()}>
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-5 min-h-screen px-3 sm:px-6 lg:px-8 py-2 sm:py-4">
      <Section className="pt-0">
        <PageToolbar
          left={
            <div className="grid w-full grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              <ExportDriversButton className="w-full min-w-0 text-xs sm:text-sm" size="sm" />
              <ExportOrdersButton className="w-full min-w-0 text-xs sm:text-sm" size="sm" />
            </div>
          }
        />
      </Section>

      {/* 🚨 Alertas Críticas - Según documentación */}
      {(kpis.driversWithDebt > 5 || kpis.expiredDocsAlert > 0) && (
        <div className="space-y-3">
          {kpis.driversWithDebt > 5 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">
                  💰 Repartidores con deuda ({kpis.driversWithDebt})
                </p>
                <p className="text-sm text-red-700 mt-1">
                  Varios repartidores necesitan liquidar sus deudas.
                </p>
                <Button 
                  size="sm" 
                  variant="secondary" 
                  className="mt-2"
                  onClick={() => router.push('/admin/repartidores?filter=debt')}
                >
                  Ver repartidores
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <ResponsiveGrid 
        cols={{ mobile: 1, tablet: 2, desktop: 5 }}
        gap="md"
        className="mb-6"
      >
        <Button 
          onClick={() => router.push('/admin/solicitudes')}
          className="btn-mobile touch-target flex flex-col items-center justify-center space-y-1"
        >
          <Users />
          <span className="text-center leading-tight text-xs sm:text-sm">
            Revisar Solicitudes
            {kpis.pendingSolicitudes > 0 && (
              <span className="block text-xs font-bold text-yellow-200">
                ({kpis.pendingSolicitudes})
              </span>
            )}
          </span>
        </Button>
        
        <Button 
          onClick={() => router.push('/admin/repartidores')}
          variant="outline"
          className="btn-mobile touch-target flex flex-col items-center justify-center space-y-1"
        >
          <Package />
          <span className="text-center leading-tight text-xs sm:text-sm">
            Gestionar Repartidores
          </span>
        </Button>
        
        <Button 
          onClick={async () => {
            const currentDate = new Date();
            const month = currentDate.toLocaleString('es-MX', { month: 'long' });
            const year = currentDate.getFullYear();
            await processPayroll(month, year);
          }}
          variant="outline"
          className="btn-mobile touch-target flex flex-col items-center justify-center space-y-1"
        >
          <DollarSign />
          <span className="text-center leading-tight text-xs sm:text-sm">Procesar Nómina</span>
        </Button>
        
        <Button 
          onClick={async () => {
            const currentDate = new Date();
            const month = currentDate.toLocaleString('es-MX', { month: 'long' });
            const year = currentDate.getFullYear();
            await generateIDSE(month, year);
          }}
          variant="outline"
          className="btn-mobile touch-target flex flex-col items-center justify-center space-y-1"
        >
          <FileText />
          <span className="text-center leading-tight text-xs sm:text-sm">Generar IDSE</span>
        </Button>
        
        <Button 
          onClick={() => router.push('/admin/compliance-center')}
          variant="outline"
          className="btn-mobile flex flex-col items-center justify-center space-y-1"
        >
          <FileText />
          <span className="text-center leading-tight text-xs sm:text-sm">Centro de Cumplimiento</span>
        </Button>
      </ResponsiveGrid>

      {/* 📊 KPIs Operativos en Tiempo Real - Según documentación */}
      <ResponsiveGrid 
        cols={{ mobile: 1, tablet: 2, desktop: 4 }}
        gap="md"
      >
        {/* 1. Solicitudes Pendientes */}
        <MetricCard
          title="Solicitudes Pendientes"
          value={kpis.pendingSolicitudes}
          description={kpis.newApplications > 0 ? `${kpis.newApplications} nuevas hoy` : 'Nuevos repartidores'}
          icon={<Users className="h-4 w-4" />}
          onClick={() => router.push('/admin/solicitudes')}
          className={kpis.pendingSolicitudes > 5 ? 'ring-2 ring-yellow-400' : ''}
        />

        {/* 2. Repartidores Activos */}
        <DriverMetricCard
          activeDrivers={kpis.repartidoresActivos}
          totalDrivers={kpis.totalDrivers}
          trend={trends.repartidoresTrend}
          onClick={() => router.push('/admin/repartidores')}
        />
        
        {/* 3. Pedidos del Día */}
        <MetricCard
          title="Pedidos del Día"
          value={kpis.pedidosDelDia}
          description="En proceso actualmente"
          icon={<Package className="h-4 w-4" />}
          trend={trends.pedidosTrend}
          onClick={() => router.push('/admin/pedidos')}
        />
        
        {/* 4. Balance Global - NUEVO según documentación */}
        <BalanceMetricCard
          balance={kpis.balanceGlobal}
          trend={trends.balanceTrend}
          onClick={() => router.push('/admin/reports')}
        />
      </ResponsiveGrid>

      {/* Métricas Adicionales de Negocios */}
      <ResponsiveGrid 
        cols={{ mobile: 1, tablet: 2, desktop: 3 }}
        gap="md"
      >
        <BusinessMetricCard
          activeBusinesses={kpis.activeBusinesses}
          totalBusinesses={kpis.totalBusinesses}
          trend={trends.negociosTrend}
          onClick={() => router.push('/admin/negocios')}
        />
        
        <AlertMetricCard
          alertCount={kpis.driversWithDebt}
          alertType="Repartidores con deuda"
          onClick={() => router.push('/admin/repartidores?filter=debt')}
        />
        
        <AlertMetricCard
          alertCount={kpis.lowCreditBusinesses}
          alertType="Negocios con pocos créditos"
          onClick={() => router.push('/admin/negocios?filter=low-credit')}
        />
      </ResponsiveGrid>

    </div>
  );
}

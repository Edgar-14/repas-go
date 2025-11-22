'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  Wallet,
  Package,
  Star,
  Target,
  TrendingUp,
  AlertCircle,
  DollarSign,
  Clock,
  CheckCircle,
  Loader2,
  Phone,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Smartphone,
  Download
} from 'lucide-react';

// Firebase
import { doc, getDoc, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { COLLECTIONS } from '@/lib/collections';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import * as XLSX from 'xlsx';
// Integrate realtime driver hook
import { useDriverData } from '@/hooks/useRealtimeData';

// Componente para documentos firmados
function SignedDocumentsSection({ driverEmail }: { driverEmail?: string }) {
  const [signedDocs, setSignedDocs] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!driverEmail) return;

    const fetchSignedDocuments = async () => {
      try {
        const docRef = doc(db, 'signedDocuments', driverEmail);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setSignedDocs(docSnap.data());
        }
      } catch (error) {
        console.error('Error fetching signed documents:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSignedDocuments();
  }, [driverEmail]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="animate-spin text-gray-400" />
      </div>
    );
  }

  if (!signedDocs) {
    return (
      <div className="text-center py-8">
        <FileText className="mx-auto text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          No hay documentos firmados aún
        </p>
      </div>
    );
  }

  const documents = [
    { key: 'contractInstructions', name: 'Instructivo de Llenado', icon: '📋' },
    { key: 'algorithmicPolicy', name: 'Política Algorítmica', icon: '🤖' },
    { key: 'driverContract', name: 'Contrato de Trabajo', icon: '📄' }
  ];

  return (
    <div className="space-y-3">
      {documents.map((docItem) => {
        const docData = signedDocs.documents?.[docItem.key];
        return (
          <div key={docItem.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-lg">{docItem.icon}</span>
              <div>
                <p className="font-medium text-sm">{docItem.name}</p>
                {docData?.signedAt && (
                  <p className="text-xs text-gray-600">
                    Firmado: {docData.signedAt.toDate().toLocaleDateString('es-MX')}
                  </p>
                )}
              </div>
            </div>
            <Badge variant={docData ? 'default' : 'secondary'}>
              {docData ? 'Firmado' : 'Pendiente'}
            </Badge>
          </div>
        );
      })}
      
      {signedDocs.signedBy && (
        <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
          <p className="text-sm text-emerald-800">
            <strong>Firmado por:</strong> {signedDocs.signedBy}
          </p>
          {signedDocs.createdAt && (
            <p className="text-xs text-emerald-600 mt-1">
              {signedDocs.createdAt.toDate().toLocaleString('es-MX')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Helper functions
function getTransactionTypeText(type: string): string {
  const types: Record<string, string> = {
    'CARD_ORDER_TRANSFER': 'Transferencia de pedido con tarjeta',
    'CASH_ORDER_ADEUDO': 'Adeudo de pedido en efectivo',
    'DEBT_PAYMENT': 'Pago de deuda',
    'ADJUSTMENT': 'Ajuste manual'
  };
  return types[type] || type;
}

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    'ACTIVE': 'default',
    'ALTA_PROVISIONAL': 'secondary',
    'ACTIVO_COTIZANDO': 'default',
    'SUSPENDED': 'destructive',
    'BAJA': 'destructive'
  };
  return variants[status] || 'secondary';
}

function getStatusText(status: string): string {
  const texts: Record<string, string> = {
    'ACTIVE': 'Activo',
    'ALTA_PROVISIONAL': 'Alta Provisional',
    'ACTIVO_COTIZANDO': 'Activo Cotizando',
    'SUSPENDED': 'Suspendido',
    'BAJA': 'Baja'
  };
  return texts[status] || status;
}

function getIMSSVariant(status?: string): "default" | "secondary" | "destructive" | "outline" {
  if (!status) return 'secondary';
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    'ACTIVE': 'default',
    'PENDING': 'secondary',
    'INACTIVE': 'destructive'
  };
  return variants[status] || 'secondary';
}

function getIMSSText(status?: string): string {
  if (!status) return 'No Disponible';
  const texts: Record<string, string> = {
    'ACTIVE': 'Activo',
    'PENDING': 'Pendiente',
    'INACTIVE': 'Inactivo'
  };
  return texts[status] || status;
}

export default function RepartidoresDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [todayStats, setTodayStats] = useState({
    ordersCompleted: 0,
    earnings: 0,
    averageRating: 0,
    onTimeDeliveries: 0,
    lateDeliveries: 0,
    failedDeliveries: 0,
    avgDeliveryTime: 0,
    totalDistance: 0
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [dailyGoal, setDailyGoal] = useState(10);
  const [isExporting, setIsExporting] = useState(false);

  // Hook: realtime driver, orders and wallet transactions
  const { driver: driverData, transactions: walletTransactions, orders, loading, error: rtError } = useDriverData(user?.uid || null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      router.push('/repartidores/login');
    }
  }, [user, router]);

  // Surface realtime errors
  useEffect(() => {
    if (rtError) {
      toast({ variant: 'destructive', title: 'Error', description: rtError });
    }
  }, [rtError, toast]);

  // Export driver performance report to Excel
  const exportDriverReport = async () => {
    if (!user || !driverData) return;
    
    try {
      setIsExporting(true);
      
      const ordersQuery = query(
        collection(db, COLLECTIONS.ORDERS),
        where('driverId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      
      const ordersSnapshot = await getDocs(ordersQuery);
      const allOrders = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const workbook = XLSX.utils.book_new();
      
      const summaryData = [
        ['Reporte de Repartidor BeFast'],
        [''],
        ['Nombre', driverData.fullName || 'N/A'],
        ['Email', driverData.email || 'N/A'],
        ['Teléfono', driverData.phone || 'N/A'],
        ['Estado', driverData.status || 'N/A'],
        ['Saldo Actual', `$${driverData.walletBalance || 0}`],
        [''],
        ['=== KPIs de Rendimiento ==='],
        ['Total de Pedidos', driverData.kpis?.totalOrders || 0],
        ['Tasa de Entregas a Tiempo', `${driverData.kpis?.onTimeDeliveryRate || 0}%`],
        ['Calificación Promedio', driverData.kpis?.averageRating || 0],
        ['Ganancias Totales', `$${driverData.totalEarnings || 0}`],
        ['Distancia Total', `${driverData.kpis?.totalDistance || 0} km`],
        [''],
        ['=== Estadísticas de Hoy ==='],
        ['Pedidos Completados Hoy', todayStats.ordersCompleted],
        ['Ganancias Hoy', `$${todayStats.earnings}`],
        ['Calificación Promedio Hoy', todayStats.averageRating],
        ['Entregas a Tiempo Hoy', todayStats.onTimeDeliveries],
        [''],
        ['Fecha de Generación', new Date().toLocaleDateString('es-MX')],
        ['']
      ];

      const ordersData = [
        ['ID', 'Estado', 'Monto', 'Comisión', 'Dirección', 'Fecha Creación', 'Fecha Completado', 'Calificación'],
        ...allOrders.map(order => [
          order.id,
          (order as any).status || 'N/A',
          (order as any).montoPagar || 0,
          (order as any).driverCommission || 0,
          (order as any).direccionEntrega || 'N/A',
          (order as any).createdAt?.toDate?.()?.toLocaleDateString('es-MX') || 'N/A',
          (order as any).completedAt?.toDate?.()?.toLocaleDateString('es-MX') || 'N/A',
          (order as any).driverRating || 'Sin calificar'
        ])
      ];

      const transactionsData = [
        ['ID', 'Tipo', 'Descripción', 'Monto', 'Nuevo Saldo', 'Fecha'],
        ...walletTransactions.map(transaction => [
          transaction.id,
          transaction.type || 'N/A',
          transaction.description || 'N/A',
          transaction.amount || 0,
          transaction.newBalance || 0,
          transaction.createdAt?.toDate?.()?.toLocaleDateString('es-MX') || 'N/A'
        ])
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      const ordersSheet = XLSX.utils.aoa_to_sheet(ordersData);
      const transactionsSheet = XLSX.utils.aoa_to_sheet(transactionsData);
      
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');
      XLSX.utils.book_append_sheet(workbook, ordersSheet, 'Pedidos');
      XLSX.utils.book_append_sheet(workbook, transactionsSheet, 'Transacciones');

      const fileName = `reporte-repartidor-${driverData.name?.replace(/\s+/g, '-') || 'driver'}-${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      toast({
        title: 'Reporte exportado',
        description: `Se ha descargado el reporte: ${fileName}`,
      });
      
    } catch (error) {
      console.error('Error exporting driver report:', error);
      toast({
        title: 'Error al exportar',
        description: 'No se pudo generar el reporte Excel',
        variant: 'destructive'
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Calculate today's stats and recent orders from the orders provided by the hook
  useEffect(() => {
    if (!orders || orders.length === 0) {
      setTodayStats({
        ordersCompleted: 0,
        earnings: 0,
        averageRating: driverData?.kpis?.averageRating || 5.0,
        onTimeDeliveries: 0,
        lateDeliveries: 0,
        failedDeliveries: 0,
        avgDeliveryTime: 0,
        totalDistance: 0
      });
      setRecentOrders([]);
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter today's orders
    const todayOrders = orders.filter(order => {
      if (!order.completedAt) return false;
      const completedDate = order.completedAt.toDate ? order.completedAt.toDate() : new Date(order.completedAt);
      return completedDate >= today;
    });

    const stats = todayOrders.reduce((acc, order) => {
      if (order.status === 'DELIVERED' || order.status === 'COMPLETED') {
        acc.ordersCompleted++;
        acc.earnings += order.driverEarnings || order.driverCommission || 0;
        
        // Rating
        if (order.rating?.score) {
          acc.totalRating += order.rating.score;
          acc.ratedOrders++;
        }
        
        // Calculate delivery time metrics
        if (order.deliveryTime && order.estimatedDeliveryTime) {
          const actualTime = new Date(order.deliveryTime);
          const estimatedTime = new Date(order.estimatedDeliveryTime);
          const timeDiff = actualTime.getTime() - estimatedTime.getTime();
          
          // On time = within 10 minutes of estimated time
          if (timeDiff <= (10 * 60 * 1000)) {
            acc.onTimeDeliveries++;
          } else {
            acc.lateDeliveries++;
          }
          
          // Calculate actual delivery duration
          if (order.pickedUpAt || order.assignedAt) {
            const startTime = order.pickedUpAt ? new Date(order.pickedUpAt) : new Date(order.assignedAt);
            const deliveryDuration = (actualTime.getTime() - startTime.getTime()) / (1000 * 60); // in minutes
            acc.totalDeliveryTime += deliveryDuration;
            acc.deliveryCount++;
          }
        }
        
        // Calculate distance if available
        if (order.distance) {
          acc.totalDistance += order.distance;
        }
      } else if (order.status === 'FAILED_DELIVERY' || order.status === 'CANCELLED') {
        acc.failedDeliveries++;
      }
      
      return acc;
    }, {
      ordersCompleted: 0,
      earnings: 0,
      totalRating: 0,
      ratedOrders: 0,
      onTimeDeliveries: 0,
      lateDeliveries: 0,
      failedDeliveries: 0,
      totalDeliveryTime: 0,
      deliveryCount: 0,
      totalDistance: 0
    });

    setTodayStats({
      ordersCompleted: stats.ordersCompleted,
      earnings: stats.earnings,
      averageRating: stats.ratedOrders > 0 ? stats.totalRating / stats.ratedOrders : driverData?.kpis?.averageRating || 5.0,
      onTimeDeliveries: stats.onTimeDeliveries,
      lateDeliveries: stats.lateDeliveries,
      failedDeliveries: stats.failedDeliveries,
      avgDeliveryTime: stats.deliveryCount > 0 ? stats.totalDeliveryTime / stats.deliveryCount : 0,
      totalDistance: stats.totalDistance
    });

    // Set recent orders (first 5 from the already sorted orders)
    setRecentOrders(orders.slice(0, 5));
  }, [orders, driverData?.kpis?.averageRating]);

  const checkExpiredDocuments = useCallback((documents: any) => {
    if (!documents) return;

    const expiredDocs: string[] = [];
    const expiringDocs: string[] = [];
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    Object.entries(documents).forEach(([key, docData]: [string, any]) => {
      if (docData.expiryDate) {
        const expiryDate = docData.expiryDate.toDate();
        if (expiryDate < new Date()) {
          expiredDocs.push(key);
        } else if (expiryDate < thirtyDaysFromNow) {
          expiringDocs.push(key);
        }
      }
    });

    if (expiredDocs.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Documentos vencidos',
        description: `Tienes ${expiredDocs.length} documento(s) vencido(s). Actualízalos para seguir trabajando.`,
        action: (
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/repartidores/documents')}
          >
            Actualizar
          </Button>
        ),
      });
    } else if (expiringDocs.length > 0) {
      toast({
        title: 'Documentos por vencer',
        description: `${expiringDocs.length} documento(s) vencerán pronto.`,
      });
    }
  }, [toast, router]);

  // Check expired documents when driver data changes
  useEffect(() => {
    if (driverData?.documents) {
      checkExpiredDocuments(driverData.documents);
    }
  }, [driverData?.documents, checkExpiredDocuments]);

  const handleLiquidateDebt = () => {
    if (!driverData || driverData.walletBalance >= 0) {
      toast({
        title: 'Sin deuda',
        description: 'No tienes deuda pendiente.',
      });
      return;
    }
    
    router.push('/repartidores/liquidate-debt');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  if (!driverData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="text-red-500" />
        <p className="text-lg text-gray-600">Error al cargar tu información</p>
        <Button onClick={() => window.location.reload()}>
          Reintentar
        </Button>
      </div>
    );
  }

  const canWork = ['ACTIVE', 'ACTIVO_COTIZANDO', 'ALTA_PROVISIONAL'].includes(driverData.status);
  const hasDebt = (driverData.pendingDebts || 0) > 0;
  const debtPercentage = Math.min((driverData.pendingDebts || 0) / (driverData.driverDebtLimit || 300) * 100, 100);

  return (
    <div className="space-y-6">
      {!canWork && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">
              Tu cuenta está {getStatusText(driverData.status)}
            </p>
            <p className="text-sm text-red-700 mt-1">
              No puedes recibir pedidos hasta que se resuelva tu situación.
            </p>
            <Button 
              variant="outline" 
              size="sm"
              className="mt-2"
              onClick={() => router.push('/repartidores/support')}
            >
              Contactar soporte
            </Button>
          </div>
        </div>
      )}

      {/* Métricas principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Actual</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${hasDebt ? 'text-red-600' : 'text-green-600'}`}>
              ${(driverData.walletBalance || 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">MXN disponible</p>
            {hasDebt && (
              <Button 
                className="w-full mt-3 flex items-center justify-center gap-2"
                size="sm"
                variant={debtPercentage > 80 ? 'destructive' : 'default'}
                onClick={handleLiquidateDebt}
              >
                <DollarSign className="h-4 w-4" />
                Liquidar
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos Hoy</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayStats.ordersCompleted}</div>
            <p className="text-xs text-muted-foreground">Completados exitosamente</p>
            <Progress value={(todayStats.ordersCompleted / dailyGoal) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ganancias Hoy</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${todayStats.earnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">MXN en efectivo y tarjeta</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calificación</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-1">
              {todayStats.averageRating.toFixed(1)} 
              <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
            </div>
            <p className="text-xs text-muted-foreground">Promedio general</p>
          </CardContent>
        </Card>
      </div>

      {/* Métricas de desempeño detalladas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entregas a Tiempo</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{todayStats.onTimeDeliveries}</div>
            <p className="text-xs text-muted-foreground">Dentro del tiempo estimado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entregas Tardías</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{todayStats.lateDeliveries}</div>
            <p className="text-xs text-muted-foreground">Fuera del tiempo estimado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entregas Fallidas</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{todayStats.failedDeliveries}</div>
            <p className="text-xs text-muted-foreground">Canceladas o fallidas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiempo Promedio</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{todayStats.avgDeliveryTime.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">Minutos por entrega</p>
          </CardContent>
        </Card>
      </div>

      {/* Métricas adicionales */}
      {todayStats.totalDistance > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Métricas Adicionales del Día</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Target className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium">Distancia Total</p>
                    <p className="text-xs text-muted-foreground">Recorrida hoy</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{todayStats.totalDistance.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">km</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">Eficiencia</p>
                    <p className="text-xs text-muted-foreground">Entregas a tiempo</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">
                    {todayStats.ordersCompleted > 0 
                      ? ((todayStats.onTimeDeliveries / todayStats.ordersCompleted) * 100).toFixed(0)
                      : '0'}%
                  </p>
                  <p className="text-xs text-muted-foreground">tasa de éxito</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Descarga de App Móvil */}
      {canWork && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="text-blue-600" />
              App Móvil de Reparto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex-shrink-0">
                <img 
                  src="/qr descarga.svg" 
                  alt="QR para descargar la app de reparto" 
                  className="w-32 h-32 border-2 border-blue-200 rounded-lg"
                />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Descarga la App de Reparto
                </h3>
                <p className="text-gray-600 mb-4">
                  Escanea el código QR con tu teléfono para descargar la aplicación móvil 
                  y recibir pedidos directamente en tu dispositivo.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button 
                    className="flex items-center gap-2"
                    onClick={() => window.open('https://www.ordertracking.io/driver-app', '_blank')}
                  >
                    <Download className="h-4 w-4" />
                    Descargar App
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => router.push('/repartidores/support')}
                  >
                    ¿Necesitas ayuda?
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grid de información */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Transacciones recientes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transacciones Recientes</CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.push('/repartidores/wallet')}
            >
              Ver todas
            </Button>
          </CardHeader>
          <CardContent>
            {walletTransactions.length === 0 ? (
              <div className="text-center py-8">
                <Wallet className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                  No hay transacciones aún
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {walletTransactions.map((transaction) => (
                  <div 
                    key={transaction.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        transaction.amount > 0 ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {transaction.amount > 0 
                          ? <ArrowUpRight className="h-4 w-4 text-green-600" />
                          : <ArrowDownRight className="h-4 w-4 text-red-600" />
                        }
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {getTransactionTypeText(transaction.type)}
                        </p>
                        <p className="text-xs text-gray-600">
                          {transaction.createdAt?.toDate().toLocaleString('es-MX', {
                            dateStyle: 'short',
                            timeStyle: 'short'
                          })}
                        </p>
                      </div>
                    </div>
                    <p className={`font-bold text-sm ${
                      transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Documentos Firmados */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <FileText className="h-4 w-4" />
              Documentos Firmados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SignedDocumentsSection driverEmail={user?.email ?? undefined} />
          </CardContent>
        </Card>

        {/* Estado del perfil */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estado del Perfil</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-gray-400" />
                  <span>Estado BeFast</span>
                </div>
                <Badge variant={getStatusVariant(driverData.status)}>
                  {getStatusText(driverData.status)}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <span>Documentos</span>
                </div>
                <Badge variant="outline">
                  {Object.values(driverData.documents || {}).filter((doc: any) => doc.status === 'APPROVED').length} de {Object.keys(driverData.documents || {}).length}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span>Estado IMSS</span>
                </div>
                <Badge variant={getIMSSVariant(driverData.imssStatus)}>
                  {getIMSSText(driverData.imssStatus)}
                </Badge>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <Button 
                variant="outline" 
                className="w-full flex items-center gap-2"
                onClick={exportDriverReport}
                disabled={isExporting}
              >
                {isExporting 
                  ? <Loader2 className="h-4 w-4 animate-spin" /> 
                  : <Download className="h-4 w-4" />
                }
                {isExporting ? 'Exportando...' : 'Exportar Reporte'}
              </Button>
              <Button 
                variant="outline" 
                className="w-full flex items-center gap-2"
                onClick={() => router.push('/repartidores/support')}
              >
                <Phone className="h-4 w-4" />
                Contactar Soporte
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useBusinessData, Order } from '@/hooks/useRealtimeData';
import { BusinessMetricsService } from '@/lib/services/businessMetricsService';
import type { Order as SharedOrder } from '@/types';
import { shipdayTrackingService } from '@/lib/services/shipdayTrackingService';
import {
  Package, Clock, AlertCircle, Loader2, Plus, Eye, DollarSign, Download, Wallet,
  CheckCircle, Timer, Star, TrendingUp, TrendingDown, Minus, BarChart3
} from 'lucide-react';

const LOW_CREDITS_THRESHOLD = 5;

// --- CORRECCIÓN ---
// Esta función ahora agrupa correctamente los 10+ estados de la API
const statusCategory = (status: string | undefined): string => {
  const s = String(status || '').toLowerCase();
  
  // Pendientes (API: ACTIVE, NOT_ASSIGNED, NOT_ACCEPTED, NOT_STARTED_YET)
  if (['pending', 'broadcasted', 'searching', 'not_assigned', 'not_accepted', 'not_started_yet', 'active'].includes(s)) return 'pendiente';
  
  // Asignados (API: STARTED)
  if (['assigned', 'started', 'accepted'].includes(s)) return 'asignado';
  
  // Recogidos (API: PICKED_UP)
  if (['picked_up', 'pickedup'].includes(s)) return 'recogido';
  
  // En Tránsito (API: READY_TO_DELIVER)
  if (['in_transit', 'ready_to_deliver', 'on_the_way'].includes(s)) return 'en_transito';
  
  // Entregados (API: ALREADY_DELIVERED)
  if (['delivered', 'already_delivered', 'completed', 'finished', 'complete', 'succeeded'].includes(s)) return 'entregado';
  
  // Cancelados (API: FAILED_DELIVERY, INCOMPLETE)
  if (['cancelled', 'failed', 'failed_delivery', 'incomplete'].includes(s)) return 'cancelado';
  
  return 'otros';
};

// --- CORRECCIÓN ---
// Restauramos tu función original que produce la insignia naranja
const getStatusBadgeVariant = (status?: string): "default" | "secondary" | "destructive" | "outline" => {
  const category = statusCategory(status);
  switch (category) {
    case 'entregado': return 'default'; // 'default' es la insignia naranja en tu proyecto
    case 'cancelado': return 'destructive';
    case 'pendiente': return 'secondary';
    default: return 'outline';
  }
};

export default function DeliveryDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const { business, orders, loading, error, refreshData } = useBusinessData(user?.uid || null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const smartAutoRefresh = async () => {
      if (document.hidden || !orders || orders.length === 0) return;

      const activeOrders = orders.filter(o => {
        const cat = statusCategory(o.status);
        return !['entregado', 'cancelado'].includes(cat);
      });

      try {
        if (activeOrders.length > 0) {
          await shipdayTrackingService.updateRecentOrdersTracking(activeOrders as any);
        }
        await refreshData();
      } catch (err) {
        console.error("Error en la actualización automática del dashboard:", err);
      }
    };

    const intervalId = setInterval(smartAutoRefresh, 20000);
    return () => clearInterval(intervalId);
  }, [orders, refreshData]);

  const stats = useMemo(() => {
    if (!business || !orders) {
      return {
        availableCredits: 0, totalOrders: 0, todayOrders: 0, pendingOrders: 0,
        completedOrders: 0, cancelledOrders: 0, totalSpent: 0, successRate: 0,
        avgDeliveryTime: 0, onTimePercentage: 0, avgRating: 0, revenueLast7Days: 0,
        revenueLast30Days: 0, orderTrend: 'stable', deliveryPerformance: 'fair'
      };
    }
    const adaptedBusiness = { ...business, availableCredits: business.credits || 0, totalCreditsUsed: 0 };
    return BusinessMetricsService.calculateMetrics(adaptedBusiness, orders as unknown as SharedOrder[]);
  }, [business, orders]);

  const recentOrders = useMemo(() => {
    if (!orders) return [];
    return [...orders].sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)).slice(0, 5);
  }, [orders]);

  const formatDate = (date: any): string => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const exportBusinessReport = async () => {
    if (!user || !business || !orders) return;
    setIsExporting(true);
    try {
      const workbook = XLSX.utils.book_new();
      const summaryData = [
        ['Reporte de Negocio BeFast'],
        ['Créditos Disponibles', stats.availableCredits],
        ['Total de Pedidos', stats.totalOrders],
        ['Pedidos Hoy', stats.todayOrders],
        ['Pedidos Pendientes', stats.pendingOrders],
        ['Pedidos Completados', stats.completedOrders],
        ['Total Gastado', `$${stats.totalSpent}`],
        ['Estado', business.status || 'N/A'],
        ['Fecha de Generación', new Date().toLocaleDateString('es-MX')],
      ];
      const ordersData = [
        ['ID', 'Número de Orden', 'Estado', 'Monto', 'Repartidor', 'Fecha Creación'],
        ...orders.map(order => [
          order.id, order.shipdayOrderNumber || order.id || 'N/A', order.status || 'N/A',
          order.totalOrderValue || 0, order.driverId || 'N/A', formatDate(order.createdAt),
        ])
      ];
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(summaryData), 'Resumen');
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(ordersData), 'Pedidos');
      const fileName = `reporte-negocio-${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      toast({ title: 'Reporte exportado', description: `Se ha descargado el reporte: ${fileName}` });
    } catch (err) {
      toast({ title: 'Error al exportar', description: 'No se pudo generar el reporte Excel', variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  if (!user) {
    router.push('/delivery/login');
    return null;
  }

  const LoadingState = () => (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-orange-600 mx-auto" />
      <p className="mt-4 text-muted-foreground">Cargando dashboard...</p>
    </div>
  );

  const ErrorState = () => (
    <div className="min-h-screen flex items-center justify-center flex-col">
      <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
      <p className="mt-4 text-muted-foreground">Error: {error}</p>
      <Button onClick={() => window.location.reload()} className="mt-4">Intentar de nuevo</Button>
    </div>
  );

  const NoBusinessState = () => (
    <div className="min-h-screen flex items-center justify-center flex-col">
      <AlertCircle className="w-8 h-8 text-yellow-600 mx-auto" />
      <p className="mt-4 text-muted-foreground">No se encontraron datos del negocio</p>
      <Button onClick={() => router.push('/delivery/signup')} className="mt-4">Registrar Negocio</Button>
    </div>
  );

  if (loading && !business) return <LoadingState />;
  if (error) return <ErrorState />;
  if (!business) return <NoBusinessState />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Bienvenido, {business.businessName}</h1>
              <p className="text-gray-500">Aquí tienes un resumen de la actividad de tu negocio.</p>
            </div>
            <div className="flex gap-2 items-center">
              <Button variant="outline" size="sm" onClick={exportBusinessReport} disabled={isExporting}>
                {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                Exportar Reporte
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="lg:col-span-2 bg-gradient-to-br from-orange-50 to-white border-orange-200 shadow-orange-200/20">
              <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-orange-700">Créditos Disponibles</p>
                  <p className="text-3xl font-bold text-orange-600">{stats.availableCredits}</p>
                  {stats.availableCredits < LOW_CREDITS_THRESHOLD && (<p className="text-xs text-orange-600 mt-1">Créditos bajos</p>)}
                </div>
                <Wallet className="h-10 w-10 text-orange-600" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 sm:p-6">
                <p className="text-sm font-medium text-gray-500">Pedidos Hoy</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-800">{stats.todayOrders}</p>
                <p className="text-xs text-gray-500 mt-1">{stats.pendingOrders} pendientes</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 sm:p-6">
                <p className="text-sm font-medium text-gray-500">Total Pedidos</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-800">{stats.totalOrders}</p>
                <p className="text-xs text-gray-500 mt-1">{stats.completedOrders} completados</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Últimos Pedidos</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((order, index) => (
                    <TableRow key={order.id || `order-${index}-${Date.now()}`}>
                      <TableCell>
                        <div className="font-medium text-gray-800">{order.shipdayOrderNumber || (order.id ? order.id.substring(0, 6) : `N/A-${index}`)}</div>
                        <div className="text-xs text-gray-500">{formatDate(order.createdAt)}</div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{order.customer?.name || 'N/A'}</TableCell>
                      
                      {/* --- CORRECCIÓN ---
                          Restauramos la lógica original que usa el 'variant' y el texto 'order.status'
                          Esto producirá la insignia naranja con el texto "ALREADY_DELIVERED"
                      */}
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(order.status)}>
                          {order.status || 'N/A'}
                        </Badge>
                      </TableCell>
                      {/* --- FIN CORRECCIÓN --- */}

                      <TableCell className="text-right font-medium">${(order.totalOrderValue || 0).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="space-y-2">
            <Link href="/delivery/new-order">
              <Button size="lg" className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700">
                <Plus className="h-5 w-5 mr-2" /> Crear Nuevo Pedido
              </Button>
            </Link>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/delivery/history"><Button size="sm" variant="outline" className="w-full"><Eye className="h-4 w-4 mr-2" /> Ver Pedidos</Button></Link>
              <Link href="/delivery/billing"><Button size="sm" variant="outline" className="w-full"><Wallet className="h-4 w-4 mr-2" /> Comprar Créditos</Button></Link>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-500 px-2">Rendimiento</h3>
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-gray-500">Tasa de Éxito</p>
                  <p className="text-xl font-bold">{stats.successRate.toFixed(1)}%</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-gray-500">A Tiempo</p>
                  <p className="text-xl font-bold">{stats.onTimePercentage.toFixed(1)}%</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-gray-500">Tiempo Promedio</p>
                  <p className="text-xl font-bold">{stats.avgDeliveryTime.toFixed(0)} <span className="text-sm font-normal">min</span></p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-gray-500">Calificación</p>
                  <p className="text-xl font-bold">{stats.avgRating.toFixed(1)} <span className="text-sm font-normal">/ 5</span></p>
                </CardContent>
              </Card>
            </div>
          </div>

          {stats.availableCredits < LOW_CREDITS_THRESHOLD && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-orange-900">Créditos bajos</h3>
                    <p className="text-sm text-orange-800 mt-1">Te quedan {stats.availableCredits} créditos.</p>
                    <Link href="/delivery/billing"><Button size="sm" className="mt-2">Comprar Créditos</Button></Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

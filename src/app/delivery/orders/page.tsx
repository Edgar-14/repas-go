'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useBusinessData, Order } from '@/hooks/useRealtimeData';
import { shipdayTrackingService } from '@/lib/services/shipdayTrackingService';
import {
  Package, Loader2, RefreshCw, User, MapPin, Clock, Plus, BarChart3,
  CheckCircle, TrendingUp, AlertCircle, UserCheck, Truck, XCircle, Archive
} from 'lucide-react';

const statusCategory = (status: string | undefined): 'pendiente' | 'asignado' | 'recogido' | 'en_transito' | 'entregado' | 'cancelado' | 'otros' => {
  const s = String(status || '').toLowerCase();
  // Basado en los valores de orderState de la documentación de Shipday
  if (['active', 'not_assigned', 'not_accepted', 'not_started_yet'].includes(s)) return 'pendiente'; //
  if (['started', 'assigned', 'accepted'].includes(s)) return 'asignado'; // 'STARTED' está documentado
  if (['picked_up', 'pickedup'].includes(s)) return 'recogido'; // 'PICKED_UP' está documentado
  if (['ready_to_deliver', 'in_transit', 'on_the_way'].includes(s)) return 'en_transito'; // 'READY_TO_DELIVER' está documentado
  if (['already_delivered', 'delivered', 'completed', 'finished', 'complete', 'succeeded'].includes(s)) return 'entregado'; // 'ALREADY_DELIVERED' está documentado
  if (['failed_delivery', 'incomplete', 'failed', 'cancelled'].includes(s)) return 'cancelado'; // 'FAILED_DELIVERY' e 'INCOMPLETE' están documentados
  return 'otros';
};

// Helper functions to map order status to UI representations
const getOrderStatusUI = (status?: string) => {
  const category = statusCategory(status);
  switch (category) {
    case 'pendiente': return { color: 'bg-blue-100 text-blue-700', label: 'Pendiente' };
    case 'asignado': return { color: 'bg-indigo-100 text-indigo-700', label: 'Asignado' };
    case 'recogido': return { color: 'bg-amber-100 text-amber-700', label: 'Recogido' };
    case 'en_transito': return { color: 'bg-purple-100 text-purple-700', label: 'En tránsito' };
    case 'entregado': return { color: 'bg-green-100 text-green-700', label: 'Entregado' };
    case 'cancelado': return { color: 'bg-red-100 text-red-700', label: 'Cancelado' };
    default: return { color: 'bg-gray-100 text-gray-700', label: 'Desconocido' };
  }
};

const getOrderStatusLabel = (status?: string) => getOrderStatusUI(status).label;
const getOrderStatusColor = (status?: string) => getOrderStatusUI(status).color;

const getOrderStatusIcon = (status?: string) => {
  const category = statusCategory(status);
  switch (category) {
    case 'pendiente': return Clock;
    case 'asignado': return UserCheck;
    case 'recogido': return Archive;
    case 'en_transito': return Truck;
    case 'entregado': return CheckCircle;
    case 'cancelado': return XCircle;
    default: return Package;
  }
};

interface ShipdayTracking {
  trackingLink?: string | null;
  status?: string;
  driverName?: string;
}

const ORDERS_PER_PAGE = 10;

const formatDisplayOrderNumber = (order: Order): string => {
  // Usar el número de pedido tal como viene, sin modificaciones
  return String(order.orderNumber || order.shipdayOrderNumber || order.orderId || `#${order.id.substring(0, 8)}`);
};

export default function OrdersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const { orders, loading, error, refreshData } = useBusinessData(user?.uid || null);

  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [shipdayTracking, setShipdayTracking] = useState<Record<string, ShipdayTracking>>({});
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pendiente' | 'asignado' | 'recogido' | 'en_transito' | 'entregado' | 'cancelado'>('todos');
  const [currentPage, setCurrentPage] = useState(1);

  const counts = useMemo(() => {
    return orders.reduce((acc, o) => {
      const c = statusCategory(o.status);
      acc[c] = (acc[c] || 0) + 1;
      return acc;
    }, { pendiente: 0, asignado: 0, recogido: 0, en_transito: 0, entregado: 0, cancelado: 0, otros: 0 } as Record<string, number>);
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const filtered = statusFilter === 'todos'
      ? orders
      : orders.filter(o => statusCategory(o.status) === statusFilter);

    return [...filtered].sort((a, b) => {
      const toMs = (d: any) => (d?.toDate ? d.toDate().getTime() : new Date(d as any).getTime());
      return toMs(b.createdAt) - toMs(a.createdAt);
    });
  }, [orders, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ORDERS_PER_PAGE));

  const paginatedOrders = useMemo(() => {
    return filteredOrders.slice((currentPage - 1) * ORDERS_PER_PAGE, currentPage * ORDERS_PER_PAGE);
  }, [filteredOrders, currentPage]);

  useEffect(() => {
    const smartAutoRefresh = async () => {
      if (document.hidden) return; // No refrescar si la pestaña no está visible

      const activeOrders = orders.filter(o => {
        const cat = statusCategory(o.status);
        return !['entregado', 'cancelado'].includes(cat);
      });

      if (activeOrders.length > 0) {
        try {
          await shipdayTrackingService.updateRecentOrdersTracking(activeOrders);
          await refreshData();
        } catch (err) {
          console.error("Error en la actualización automática:", err);
        }
      } else {
        await refreshData();
      }
    };

    const intervalId = setInterval(smartAutoRefresh, 20000); // 20 segundos
    return () => clearInterval(intervalId);
  }, [orders, refreshData]);

  useEffect(() => {
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error });
    }
  }, [error, toast]);

  const formatCurrency = (value: number) => (value ?? 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
  const formatDate = (date: any) => date?.toDate ? date.toDate().toLocaleString('es-MX') : new Date(date).toLocaleString('es-MX');

  const handleUpdateTracking = async (order: Order) => {
    try {
      const trackingData = await shipdayTrackingService.getOrderTracking(order);
      setShipdayTracking(prev => ({ ...prev, [order.id]: trackingData }));
      await refreshData();
      toast({ title: 'Estado Actualizado', description: 'Se ha sincronizado el estado más reciente del pedido.' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error al Actualizar', description: 'No se pudo obtener el estado más reciente.' });
    }
  };

  const handleManualRefresh = async () => {
    setIsManualRefreshing(true);
    await refreshData();
    setIsManualRefreshing(false);
    toast({ title: 'Página Actualizada', description: 'Se han cargado los pedidos más recientes.' });
  };

  const OrderStatusIndicator = ({ status }: { status?: string }) => {
    const category = statusCategory(status);
    let IconComponent;
    let text;
    let colorClass;

    switch (category) {
      case 'pendiente': IconComponent = Clock; text = 'Repartidor Asignado'; colorClass = 'text-blue-600'; break;
      case 'asignado': IconComponent = UserCheck; text = 'Repartidor Asignado'; colorClass = 'text-indigo-600'; break;
      case 'recogido': IconComponent = Archive; text = 'Paquete Recogido'; colorClass = 'text-amber-600'; break;
      case 'en_transito': IconComponent = Truck; text = 'En Camino al Destino'; colorClass = 'text-purple-600'; break;
      case 'entregado': IconComponent = CheckCircle; text = 'Entregado Exitosamente'; colorClass = 'text-green-600'; break;
      case 'cancelado': IconComponent = XCircle; text = 'Pedido Cancelado'; colorClass = 'text-red-600'; break;
      default: return null;
    }

    return (
      <div className={`flex items-center gap-3 rounded-lg bg-gray-50 p-3 mb-4 ${colorClass}`}>
        <IconComponent className="h-5 w-5 flex-shrink-0" />
        <p className="text-sm font-medium">{text}</p>
      </div>
    );
  };

  if (!user) {
    router.push('/delivery/login');
    return null;
  }

  if (loading && orders.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-orange-600 mx-auto" />
          <p className="mt-4 text-muted-foreground">Cargando pedidos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2 items-center">
          {[
            { key: 'todos', label: 'Todos' }, { key: 'pendiente', label: 'Pendientes' },
            { key: 'asignado', label: 'Asignados' }, { key: 'recogido', label: 'Recogidos' },
            { key: 'en_transito', label: 'En tránsito' }, { key: 'entregado', label: 'Entregados' },
            { key: 'cancelado', label: 'Cancelados' },
          ].map(f => (
            <Button
              key={f.key}
              variant={statusFilter === f.key ? 'default' : 'outline'}
              size="sm"
              className={statusFilter === f.key ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white' : ''}
              onClick={() => { setStatusFilter(f.key as any); setCurrentPage(1); }}
            >
              {f.label}
            </Button>
          ))}
        </div>
        <div className="flex gap-2 items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isManualRefreshing || loading}
          >
            {(isManualRefreshing || loading) ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            {(isManualRefreshing || loading) ? 'Actualizando...' : 'Actualizar'}
          </Button>
          <Link href="/delivery/new-order">
            <Button size="sm" className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 flex items-center gap-1">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nuevo Pedido</span>
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-green-50 to-white border-green-200 shadow-green-200/20">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-green-700 truncate">Total de Pedidos</p>
                <p className="text-lg sm:text-2xl font-bold text-green-600">{orders.length}</p>
              </div>
              <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200 shadow-blue-200/20">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-blue-700 truncate">Pendientes</p>
                <p className="text-lg sm:text-2xl font-bold text-blue-600">{counts.pendiente}</p>
              </div>
              <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-200 shadow-purple-200/20">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-purple-700 truncate">En Progreso</p>
                <p className="text-lg sm:text-2xl font-bold text-purple-600">{counts.asignado + counts.recogido + counts.en_transito}</p>
              </div>
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-white border-orange-200 shadow-orange-200/20">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-orange-700 truncate">Entregados</p>
                <p className="text-lg sm:text-2xl font-bold text-orange-600">{counts.entregado}</p>
              </div>
              <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {paginatedOrders.length === 0 ? (
          <Card className="border-gray-200 bg-gray-50">
            <CardContent className="p-8 text-center flex flex-col items-center">
              <Package className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No hay pedidos en esta categoría
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Prueba a seleccionar otro filtro o crea un nuevo pedido para empezar.
              </p>
              <Link href="/delivery/new-order">
                <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700">
                  <Plus className="mr-2 h-4 w-4" /> Crear Primer Pedido
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {paginatedOrders.map((order) => {
              const tracking = shipdayTracking[order.id] || {};
              const statusUI = getOrderStatusUI(order.status);
              
              // const statusConfig = getStatusBadgeConfig(order.status); // función no definida, se usa statusUI en su lugar

              return (
                <Card key={order.id} className="hover:shadow-lg transition-shadow duration-300 flex flex-col">
                  <div className="border-b p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${statusUI.color.split(' ')[0]}`}>
                          <Package className={`w-5 h-5 ${statusUI.color.split(' ')[1]}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            Pedido #{formatDisplayOrderNumber(order)}
                          </h3>
                          <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-4 flex-grow flex flex-col">
                    <OrderStatusIndicator status={order.status} />

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Cliente</p>
                        <p className="text-sm font-medium truncate">{order.customer?.name || 'Cliente'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Total</p>
                        <p className="text-sm font-medium">{formatCurrency(order.totalOrderValue || 0)}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-gray-500 mb-1">Dirección de entrega</p>
                        <div className="text-sm flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                          <span>{typeof order.customer?.address === 'string' ? order.customer.address : 'No disponible'}</span>
                        </div>
                      </div>
                    </div>

                    {(tracking.driverName || order.driverId) && (
                      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg mb-4">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">
                          Repartidor: <span className="font-medium">{tracking.driverName || order.driverId}</span>
                        </span>
                      </div>
                    )}
                    <div className="flex justify-end gap-2 mt-auto pt-4">
                      {order.shipdayOrderId && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-orange-600 border-orange-200 hover:bg-orange-50"
                          onClick={() => {
                            // Usar nuestra página de tracking personalizada
                            const trackingUrl = `/tracking/${order.orderNumber}`;
                            window.open(trackingUrl, '_blank');
                          }}
                        >
                          Ver Tracking
                        </Button>
                      )}
                      {order.shipdayOrderId && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleUpdateTracking(order)}
                        >
                          Actualizar Estado
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {filteredOrders.length > ORDERS_PER_PAGE && (
          <div className="flex items-center justify-center gap-3 pt-4">
            <Button
              variant="outline" size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(c => c - 1)}
            >
              Anterior
            </Button>
            <span className="text-sm text-gray-600">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline" size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(c => c + 1)}
            >
              Siguiente
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
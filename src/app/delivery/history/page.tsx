'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import AnalyticsCharts from '@/components/delivery/AnalyticsCharts';
import { Search, Calendar as CalendarIcon, Download, Package, TrendingUp, DollarSign, Clock, Loader2, AlertCircle, MapPin } from 'lucide-react';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';
import { useBusinessData, Order as AppOrder } from '@/hooks/useRealtimeData';
import { Section, PageToolbar } from '@/components/layout/primitives';
import { StatusBadge } from '@/components/ui/badge';
import { getSpanishStatusText, getAvailableStatuses } from '@/lib/delivery/orderUtils';
import { Timestamp } from 'firebase/firestore';
import { Address } from '@/lib/types/Order';

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#6366F1', '#8B5CF6', '#F97316'];

const getAddressText = (address: string | Address | undefined): string => {
  if (!address) return '';
  if (typeof address === 'string') return address;

  const parts = [
    address.street,
    address.city,
    address.state,
    address.postalCode,
    address.country,
  ].filter(Boolean);

  return parts.join(', ');
};

export default function DeliveryHistoryPage() {
  const { user } = useAuth();
  const { orders: rawOrders, loading, error } = useBusinessData(user?.uid || null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateOption, setDateOption] = useState<string>('30days');
  const [customDateFrom, setCustomDateFrom] = useState<Date | undefined>(subDays(new Date(), 29));
  const [customDateTo, setCustomDateTo] = useState<Date | undefined>(new Date());

  const orders = useMemo((): AppOrder[] => {
    if (!rawOrders) return [];
    return rawOrders;
  }, [rawOrders]);

  const filteredOrders = useMemo(() => {
    let filtered = [...orders];

    if (searchTerm) {
        const lowercasedFilter = searchTerm.toLowerCase();
        filtered = filtered.filter(order => {
          const addressText = getAddressText(order.customer?.address).toLowerCase();
          return (
            (order.shipdayOrderNumber || order.id || '').toLowerCase().includes(lowercasedFilter) ||
            (order.customer?.name || '').toLowerCase().includes(lowercasedFilter) ||
            (order.customer?.phone || '').toLowerCase().includes(lowercasedFilter) ||
            addressText.includes(lowercasedFilter)
          );
        });
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    const now = new Date();
    let startDate: Date | undefined;
    let endDate: Date | undefined = now;

    switch (dateOption) {
      case '7days': startDate = subDays(now, 6); endDate = now; break;
      case '30days': startDate = subDays(now, 29); endDate = now; break;
      case '3months': startDate = subMonths(now, 3); endDate = now; break;
      case 'thisWeek': startDate = startOfWeek(now, { locale: es }); endDate = endOfWeek(now, { locale: es }); break;
      case 'thisMonth': startDate = startOfMonth(now); endDate = endOfMonth(now); break;
      case 'custom': startDate = customDateFrom; endDate = customDateTo; break;
      default: startDate = subDays(now, 29); endDate = now;
    }

    if (startDate && endDate) {
      const start = startDate.setHours(0, 0, 0, 0);
      const end = endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(order => {
        const orderDate = order.createdAt?.toDate().getTime();
        return orderDate && orderDate >= start && orderDate <= end;
      });
    }

    return filtered;
  }, [orders, searchTerm, statusFilter, dateOption, customDateFrom, customDateTo]);

  const analytics = useMemo(() => {
    if (!filteredOrders.length) {
      return { totalOrders: 0, completedOrders: 0, totalRevenue: 0, averageOrderValue: 0, completionRate: 0, averageDeliveryTime: 0 };
    }
    const completed = filteredOrders.filter(o => ['delivered', 'completed', 'DELIVERED', 'COMPLETED'].includes(o.status || ''));
    const totalRevenue = completed.reduce((sum, order) => sum + (order.deliveryFee || 0), 0);
    const averageOrderValue = completed.length > 0 ? totalRevenue / completed.length : 0;
    const completionRate = filteredOrders.length > 0 ? (completed.length / filteredOrders.length) * 100 : 0;
    const deliveryTimes = completed.map(o => o.deliveryTime || 30).filter(t => t > 0);
    const averageDeliveryTime = deliveryTimes.length > 0 ? deliveryTimes.reduce((sum, time) => sum + time, 0) / deliveryTimes.length : 0;

    return {
      totalOrders: filteredOrders.length, completedOrders: completed.length, totalRevenue,
      averageOrderValue, completionRate, averageDeliveryTime
    };
  }, [filteredOrders]);

  const chartData = useMemo(() => {
    if (!filteredOrders.length) return { daily: [], status: [] };
    const dailyData = filteredOrders.reduce((acc, order) => {
      const dateKey = format(order.createdAt.toDate(), 'yyyy-MM-dd');
      if (!acc[dateKey]) acc[dateKey] = { date: dateKey, orders: 0, revenue: 0 };
      acc[dateKey].orders++;
      if (['delivered', 'completed'].includes(order.status || '')) acc[dateKey].revenue += (order.deliveryFee || 0);
      return acc;
    }, {} as Record<string, { date: string; orders: number; revenue: number }>);
    
    const statusCounts = filteredOrders.reduce((acc, order) => {
      const statusLabel = getSpanishStatusText(order.status);
      acc[statusLabel] = (acc[statusLabel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const statusData = Object.entries(statusCounts).map(([name, value], index) => ({ name, value, color: COLORS[index % COLORS.length] }));

    return {
      daily: Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date)),
      status: statusData.filter(item => item.value > 0),
    };
  }, [filteredOrders]);
  
  const exportToCSV = () => {
    const headers = ['ID Pedido', 'Fecha', 'Cliente', 'Teléfono', 'Dirección', 'Monto Cobrado', 'Costo Envío', 'Estado'];
    const csvData = filteredOrders.map(order => {
      const addressText = getAddressText(order.customer?.address) || 'N/A';
      return [
        order.shipdayOrderNumber || order.id,
        format(order.createdAt.toDate(), 'dd/MM/yyyy HH:mm'),
        order.customer?.name || 'N/A',
        order.customer?.phone || 'N/A',
        `"${addressText.replace(/"/g, '""')}"`,
        order.totalOrderValue || 0,
        order.deliveryFee || 0,
        getSpanishStatusText(order.status),
      ];
    });
    const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `historial-pedidos-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-orange-600" /></div>
  );
  if (error) return (
    <div className="flex h-screen flex-col items-center justify-center text-red-600"><AlertCircle className="h-8 w-8 mb-2"/> Error: {error}</div>
  );
  
  const datePickerRange = { from: customDateFrom, to: customDateTo };
  const handleDateRangeSelect = (range: any) => {
    if (range) {
      setCustomDateFrom(range.from);
      setCustomDateTo(range.to);
      setDateOption('custom');
    }
  };
  
  return (
    <div className="space-y-6">
      <Section>
        <PageToolbar
          left={<h1 className="text-2xl font-bold">Historial y Analíticas</h1>}
          right={<Button onClick={exportToCSV} size="sm"><Download className="h-4 w-4 mr-2"/> Exportar CSV</Button>}
        />
      </Section>

      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por cliente, teléfono, ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue placeholder="Filtrar por estado..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {getAvailableStatuses().map((s) => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}
              </SelectContent>
            </Select>
            <Select value={dateOption} onValueChange={setDateOption}>
              <SelectTrigger><SelectValue placeholder="Filtrar por fecha..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Últimos 7 días</SelectItem>
                <SelectItem value="30days">Últimos 30 días</SelectItem>
                <SelectItem value="3months">Últimos 3 meses</SelectItem>
                <SelectItem value="thisWeek">Esta semana</SelectItem>
                <SelectItem value="thisMonth">Este mes</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} className="justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {customDateFrom && customDateTo ? `${format(customDateFrom, "LLL dd, y")} - ${format(customDateTo, "LLL dd, y")}`: <span>Elige un rango</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="range" selected={datePickerRange} onSelect={handleDateRangeSelect} numberOfMonths={2} locale={es} />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200 shadow-blue-200/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-blue-800">Total de Pedidos</CardTitle><Package className="h-4 w-4 text-blue-600"/></CardHeader>
          <CardContent><div className="text-2xl font-bold text-blue-900">{analytics.totalOrders}</div></CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-white border-green-200 shadow-green-200/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-green-800">Ingresos por Envío</CardTitle><DollarSign className="h-4 w-4 text-green-600"/></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-900">${analytics.totalRevenue.toLocaleString('es-MX')}</div></CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-200 shadow-purple-200/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-purple-800">Tasa de Éxito</CardTitle><TrendingUp className="h-4 w-4 text-purple-600"/></CardHeader>
          <CardContent><div className="text-2xl font-bold text-purple-900">{analytics.completionRate.toFixed(1)}%</div></CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-200 shadow-amber-200/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-amber-800">Tiempo Promedio</CardTitle><Clock className="h-4 w-4 text-amber-600"/></CardHeader>
          <CardContent><div className="text-2xl font-bold text-amber-900">{analytics.averageDeliveryTime.toFixed(0)} min</div></CardContent>
        </Card>
      </div>

      <Suspense fallback={<div className="h-96 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div>}>
        <AnalyticsCharts dailyData={chartData.daily} statusData={chartData.status} revenueData={chartData.daily} />
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle>Pedidos del Período ({filteredOrders.length})</CardTitle>
          <CardDescription>Mostrando los 15 pedidos más recientes del rango seleccionado.</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredOrders.length > 0 ? (
            <div className="space-y-4">
              {filteredOrders.slice(0, 15).map((order) => (
                <div key={order.id} className="border rounded-lg p-4 grid grid-cols-2 md:grid-cols-5 gap-4 items-center">
                  <div>
                    <p className="font-semibold">{order.customer?.name || 'N/A'}</p>
                    <p className="text-xs text-gray-500">{order.shipdayOrderNumber || order.id}</p>
                  </div>
                  <div className="text-sm text-gray-600 col-span-2 hidden md:flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-1 flex-shrink-0" />
                    <span>{getAddressText(order.customer?.address) || 'N/A'}</span>
                  </div>
                  <div className="text-center">
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${(order.totalOrderValue || 0).toFixed(2)}</p>
                    <p className="text-xs text-gray-500">{format(order.createdAt.toDate(), 'dd MMM, HH:mm', { locale: es })}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">No se encontraron pedidos con los filtros seleccionados.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

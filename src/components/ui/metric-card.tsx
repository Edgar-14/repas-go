import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, Users, Package, DollarSign, Store, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
    period: string;
  };
  className?: string;
  onClick?: () => void;
  loading?: boolean;
}

/**
 * 📊 Componente MetricCard Reutilizable
 * 
 * Tarjeta animada para mostrar KPIs y métricas importantes
 * con indicadores de tendencia y estados de carga
 */
export function MetricCard({
  title,
  value,
  description,
  icon,
  trend,
  className,
  onClick,
  loading = false
}: MetricCardProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      // Formatear números grandes con separadores
      if (val >= 1000000) {
        return `${(val / 1000000).toFixed(1)}M`;
      } else if (val >= 1000) {
        return `${(val / 1000).toFixed(1)}K`;
      }
      return val.toLocaleString();
    }
    return val;
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    
    if (trend.value === 0) {
      return <Minus className="h-3 w-3 text-gray-500" />;
    }
    
    return trend.isPositive ? (
      <TrendingUp className="h-3 w-3 text-green-500" />
    ) : (
      <TrendingDown className="h-3 w-3 text-red-500" />
    );
  };

  const getTrendColor = () => {
    if (!trend) return '';
    if (trend.value === 0) return 'text-gray-500';
    return trend.isPositive ? 'text-green-500' : 'text-red-500';
  };

  return (
    <div
      className={cn(
        "transition-all duration-200 hover:shadow-md cursor-pointer hover:scale-[1.02]",
        onClick && "hover:bg-gray-50/50",
        className
      )}
      onClick={onClick}
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            {title}
          </CardTitle>
          {icon && (
            <div className="h-8 w-8 text-gray-400">
              {icon}
            </div>
          )}
        </CardHeader>
        
        <CardContent>
          <div className="space-y-1">
            {/* Valor principal */}
            <div className="text-2xl font-bold">
              {loading ? (
                <div className="h-8 w-20 bg-gray-200 animate-pulse rounded" />
              ) : (
                formatValue(value)
              )}
            </div>
            
            {/* Descripción y tendencia */}
            <div className="flex items-center justify-between">
              {description && (
                <p className="text-xs text-gray-500">
                  {description}
                </p>
              )}
              
              {trend && (
                <div className={cn(
                  "flex items-center space-x-1 text-xs font-medium",
                  getTrendColor()
                )}>
                  {getTrendIcon()}
                  <span>
                    {Math.abs(trend.value)}% {trend.period}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Variantes predefinidas para casos comunes
export function DriverMetricCard({ 
  activeDrivers, 
  totalDrivers, 
  trend,
  onClick,
  isLoading
}: {
  activeDrivers: number;
  totalDrivers: number;
  trend?: MetricCardProps['trend'];
  onClick?: () => void;
  isLoading?: boolean;
}) {
  return (
    <MetricCard
      title="Repartidores Activos"
      value={activeDrivers}
      description={`de ${totalDrivers} totales`}
      icon={<Users className="h-4 w-4" />}
      trend={trend}
      onClick={onClick}
      loading={isLoading}
    />
  );
}

export function OrderMetricCard({ 
  todayOrders, 
  pendingOrders,
  trend,
  onClick,
  isLoading
}: {
  todayOrders: number;
  pendingOrders: number;
  trend?: MetricCardProps['trend'];
  onClick?: () => void;
  isLoading?: boolean;
}) {
  return (
    <MetricCard
      title="Órdenes Hoy"
      value={todayOrders}
      description={`${pendingOrders} pendientes`}
      icon={<Package className="h-4 w-4" />}
      trend={trend}
      onClick={onClick}
      loading={isLoading}
    />
  );
}

export function RevenueMetricCard({ 
  revenue, 
  currency = '$',
  trend,
  onClick,
  isLoading
}: {
  revenue: number;
  currency?: string;
  trend?: MetricCardProps['trend'];
  onClick?: () => void;
  isLoading?: boolean;
}) {
  return (
    <MetricCard
      title="Ingresos del Día"
      value={`${currency}${revenue.toLocaleString()}`}
      description="Total facturado"
      icon={<DollarSign className="h-4 w-4" />}
      trend={trend}
      onClick={onClick}
      loading={isLoading}
    />
  );
}

export function BalanceMetricCard({ 
  balance, 
  currency = '$',
  trend,
  onClick,
  isLoading
}: {
  balance: number;
  currency?: string;
  trend?: MetricCardProps['trend'];
  onClick?: () => void;
  isLoading?: boolean;
}) {
  return (
    <MetricCard
      title="Balance Global"
      value={`${currency}${balance.toLocaleString()}`}
      description="Estado financiero del sistema"
      icon={<DollarSign className="h-4 w-4" />}
      trend={trend}
      onClick={onClick}
      loading={isLoading}
    />
  );
}

export function BusinessMetricCard({ 
  activeBusinesses, 
  totalBusinesses,
  trend,
  onClick,
  isLoading
}: {
  activeBusinesses: number;
  totalBusinesses: number;
  trend?: MetricCardProps['trend'];
  onClick?: () => void;
  isLoading?: boolean;
}) {
  return (
    <MetricCard
      title="Negocios Activos"
      value={activeBusinesses}
      description={`de ${totalBusinesses} registrados`}
      icon={<Store className="h-4 w-4" />}
      trend={trend}
      onClick={onClick}
      loading={isLoading}
    />
  );
}

export function AlertMetricCard({ 
  alertCount, 
  alertType = "alertas",
  onClick,
  isLoading
}: {
  alertCount: number;
  alertType?: string;
  onClick?: () => void;
  isLoading?: boolean;
}) {
  return (
    <MetricCard
      title={`${alertType.charAt(0).toUpperCase() + alertType.slice(1)}`}
      value={alertCount}
      description={alertCount > 0 ? "Requieren atención" : "Todo en orden"}
      icon={<AlertCircle className={cn(
        "h-4 w-4",
        alertCount > 0 ? "text-red-500" : "text-green-500"
      )} />}
      className={alertCount > 0 ? "border-red-200 bg-red-50/50" : ""}
      onClick={onClick}
      loading={isLoading}
    />
  );
}

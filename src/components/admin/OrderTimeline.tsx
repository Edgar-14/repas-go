'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Clock,
  Package,
  Truck,
  CheckCircle,
  User,
  MapPin
} from 'lucide-react';
import { Order, OrderItem } from '@/lib/types/Order';
import { UnifiedOrderStatusService } from '@/lib/delivery/orderUtils';

type TimelineEvent = {
  timestamp: any;
  label: string;
  status: 'completed' | 'current' | 'pending';
  icon: React.ReactNode;
};

type TimelineExtras = {
  timeline?: {
    placementTime?: string;
    assignedTime?: string;
    pickedupTime?: string;
    deliveryTime?: string;
  };
};

type OrderWithDetails = Order & TimelineExtras & {
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string | Order['customer'];
  businessName?: string;
  businessAddress?: string | Order['pickup'];
  driverName?: string;
  driverPhone?: string;
  items?: OrderItem[];
};

interface OrderTimelineProps {
  order: OrderWithDetails;
}

export function OrderTimeline({ order }: OrderTimelineProps) {
  const formatTime = (timestamp: any) => {
    if (!timestamp) return null;
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return null;
    }
  };

  const normalizedStatus = UnifiedOrderStatusService.normalizeStatus(order.status);
  const getCurrentStatus = () => {
    const config = UnifiedOrderStatusService.getStatusConfig(normalizedStatus);
    if (config.category === 'completed') return 'completed';
    if (config.category === 'in_progress') return 'in_progress';
    return 'pending';
  };

  const hasStatus = (...statusKeys: string[]) => {
    const normalizedSet = statusKeys.map(key => UnifiedOrderStatusService.normalizeStatus(key));
    return normalizedSet.includes(normalizedStatus);
  };

  const events: TimelineEvent[] = [
    {
      timestamp: order.createdAt || order.timeline?.placementTime,
      label: 'Pedido Creado',
      status: 'completed',
      icon: <Package className="h-4 w-4" />
    },
    {
      timestamp: order.assignedAt || order.timeline?.assignedTime,
      label: 'Repartidor Asignado',
      status: order.assignedAt || order.timeline?.assignedTime ? 'completed' :
             hasStatus('ASSIGNED', 'IN_PROGRESS', 'AT_PICKUP', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED') ? 'completed' : 'pending',
      icon: <User className="h-4 w-4" />
    },
    {
      timestamp: order.pickedUpAt || order.timeline?.pickedupTime,
      label: 'Pedido Recogido',
      status: order.pickedUpAt || order.timeline?.pickedupTime ? 'completed' :
             hasStatus('PICKED_UP', 'READY_TO_DELIVER', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED') ? 'completed' : 'pending',
      icon: <Truck className="h-4 w-4" />
    },
    {
      timestamp: order.deliveredAt || order.timeline?.deliveryTime,
      label: 'Pedido Entregado',
      status: order.deliveredAt || order.timeline?.deliveryTime ? 'completed' :
             hasStatus('DELIVERED', 'ALREADY_DELIVERED', 'COMPLETED') ? 'completed' : 'pending',
      icon: <CheckCircle className="h-4 w-4" />
    }
  ];

  return (
    <div className="space-y-4">
      {events.map((event, index) => {
        const time = formatTime(event.timestamp);
        const isCompleted = event.status === 'completed';
        const isPending = event.status === 'pending';
        
        return (
          <div key={index} className="flex items-center space-x-4">
            {/* Timeline line */}
            <div className="flex flex-col items-center">
              <div className={`
                flex items-center justify-center w-8 h-8 rounded-full border-2
                ${isCompleted 
                  ? 'bg-green-100 border-green-500 text-green-700' 
                  : isPending 
                    ? 'bg-gray-100 border-gray-300 text-gray-500'
                    : 'bg-blue-100 border-blue-500 text-blue-700'
                }
              `}>
                {event.icon}
              </div>
              {index < events.length - 1 && (
                <div className={`
                  w-0.5 h-8 mt-2
                  ${isCompleted ? 'bg-green-300' : 'bg-gray-200'}
                `} />
              )}
            </div>
            
            {/* Event content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className={`
                  text-sm font-medium
                  ${isCompleted ? 'text-green-700' : isPending ? 'text-gray-500' : 'text-blue-700'}
                `}>
                  {event.label}
                </p>
                {time && (
                  <Badge className={`text-xs ${isCompleted ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                    {time}
                  </Badge>
                )}
              </div>
              {!time && !isPending && (
                <p className="text-xs text-muted-foreground">
                  En proceso...
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function OrderDetailsCard({ order }: OrderTimelineProps) {
  const stringifyAddress = (value: unknown): string => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
      const candidate = value as Record<string, unknown>;
      if (typeof candidate.address === 'string') {
        return candidate.address;
      }
      const parts = [
        candidate.street,
        candidate.city,
        candidate.state,
        candidate.postalCode,
        candidate.country
      ]
        .map(part => (typeof part === 'string' ? part : undefined))
        .filter(Boolean) as string[];
      if (parts.length > 0) {
        return parts.join(', ');
      }
    }
    return '';
  };

  const getCustomerInfo = () => {
    const customer = order.customer as any;
    const name = order.customerName
      ?? (customer && typeof customer === 'object' ? customer.name : undefined)
      ?? '';
    const phone = order.customerPhone
      ?? (customer && typeof customer === 'object' ? customer.phone : undefined)
      ?? '';
    const addressCandidate = order.customerAddress ?? (customer && typeof customer === 'object' ? customer.address : undefined);
    const address = stringifyAddress(addressCandidate);
    return { name, phone, address };
  };

  const getBusinessInfo = () => {
    const pickup = order.pickup as any;
    const name = order.businessName
      ?? (pickup && typeof pickup === 'object' ? pickup.name : undefined)
      ?? '';
    const addressCandidate = order.businessAddress ?? (pickup && typeof pickup === 'object' ? (pickup.address ?? pickup) : undefined);
    const address = stringifyAddress(addressCandidate);
    return { name, address };
  };

  const customerInfo = getCustomerInfo();
  const businessInfo = getBusinessInfo();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const getSourceBadge = (source: Order['source'] | undefined, orderType?: Order['orderType']) => {
    const normalizedSource = (source ?? (orderType === 'MARKET' ? 'MARKET' : 'BEFAST')).toUpperCase();
    if (normalizedSource === 'MARKET') {
      return (
        <Badge className="bg-purple-100 text-purple-800 border-0">
          🛒 Market
        </Badge>
      );
    }
    if (normalizedSource === 'SHIPDAY') {
      return (
        <Badge className="bg-sky-100 text-sky-800 border-0">
          🚚 Shipday
        </Badge>
      );
    }
    return (
      <Badge className="bg-blue-100 text-blue-800 border-0">
        🚚 Delivery
      </Badge>
    );
  };

  const normalizedPayment = String(order.paymentMethod ?? '').toUpperCase();
  const isCard = normalizedPayment === 'CARD';
  const paymentLabel = isCard ? '💳 Tarjeta' : '💵 Efectivo';
  const normalizedSource = (order.source ?? (order.orderType === 'MARKET' ? 'MARKET' : 'BEFAST')).toUpperCase();
  const isMarket = normalizedSource === 'MARKET' || order.orderType === 'MARKET';

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Información del pedido */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Pedido {order.orderNumber}</span>
            {getSourceBadge(order.source, order.orderType)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Cliente */}
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-2">Cliente</h4>
            <div className="space-y-1">
              <p className="font-medium">{customerInfo.name || 'N/A'}</p>
              <p className="text-sm text-muted-foreground">{customerInfo.phone || 'N/A'}</p>
              <p className="text-sm text-muted-foreground flex items-start gap-1">
                <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                {customerInfo.address || 'Sin dirección disponible'}
              </p>
            </div>
          </div>

          {/* Negocio */}
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-2">Negocio</h4>
            <div className="space-y-1">
              <p className="font-medium">{businessInfo.name || 'N/A'}</p>
              <p className="text-sm text-muted-foreground flex items-start gap-1">
                <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                {businessInfo.address || 'Sin dirección disponible'}
              </p>
            </div>
          </div>

          {/* Repartidor */}
          {order.driverName && (
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-2">Repartidor</h4>
              <div className="space-y-1">
                <p className="font-medium">{order.driverName}</p>
                <p className="text-sm text-muted-foreground">{order.driverPhone}</p>
              </div>
            </div>
          )}

          {/* Información financiera */}
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-2">Financiero</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Costo de envío:</span>
                <span className="text-sm font-medium">{formatCurrency(order.deliveryFee ?? 0)}</span>
              </div>
              {order.tip && order.tip > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm">Propina:</span>
                  <span className="text-sm font-medium">{formatCurrency(order.tip)}</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-2">
                <span className="font-medium">Total:</span>
                <span className="font-bold">{formatCurrency(order.totalAmount ?? 0)}</span>
              </div>
              <Badge className={isCard ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}>
                {paymentLabel}
              </Badge>
            </div>
          </div>

          {/* Items (solo para Market) */}
          {order.items && order.items.length > 0 && isMarket && (
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-2">Productos</h4>
              <div className="space-y-1">
                {order.items.map((item, index) => (
                  <div key={index} className="text-sm">
                    <span className="font-medium">{item.quantity || 1}x</span> {item.name || 'Producto'}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Timeline del Pedido
          </CardTitle>
        </CardHeader>
        <CardContent>
          <OrderTimeline order={order} />
        </CardContent>
      </Card>
    </div>
  );
}
// Tipos completos de Pedido basados en BEFAST_GO_CONFIGURACION_COMPLETA.md

export enum OrderStatus {
  PENDING = 'PENDING',
  CREATED = 'CREATED',
  SEARCHING = 'SEARCHING',
  ASSIGNED = 'ASSIGNED',
  ACCEPTED = 'ACCEPTED',
  STARTED = 'STARTED',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  ARRIVED = 'ARRIVED',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export const ORDER_STATUS_LABELS: Record<OrderStatus,string> = {
  [OrderStatus.PENDING]: 'Pendiente',
  [OrderStatus.CREATED]: 'Creado',
  [OrderStatus.SEARCHING]: 'Buscando repartidor',
  [OrderStatus.ASSIGNED]: 'Asignado',
  [OrderStatus.ACCEPTED]: 'Aceptado',
  [OrderStatus.STARTED]: 'En camino al restaurante',
  [OrderStatus.PICKED_UP]: 'Recogido',
  [OrderStatus.IN_TRANSIT]: 'En camino al cliente',
  [OrderStatus.ARRIVED]: 'En el destino',
  [OrderStatus.DELIVERED]: 'Entregado',
  [OrderStatus.COMPLETED]: 'Completado',
  [OrderStatus.FAILED]: 'Fallido',
  [OrderStatus.CANCELLED]: 'Cancelado'
};

export interface LatLng { lat: number; lng: number; }

export interface OrderPricing {
  subtotal: number;
  deliveryFee: number;
  tip: number;
  tax: number;
  discount: number;
  totalAmount: number;
}

export interface OrderTiming {
  createdAt: any;
  expectedPickupTime?: any;
  expectedDeliveryTime: any;
  assignedAt?: any;
  acceptedAt?: any;
  startedAt?: any;
  pickedUpAt?: any;
  arrivedAt?: any;
  deliveredAt?: any;
  completedAt?: any;
}

export interface OrderLogistics {
  distance: number;
  estimatedDuration: number;
  actualDuration?: number;
}

export interface OrderCustomer {
  name: string;
  address: string;
  phoneNumber: string;
  email?: string;
  coordinates: LatLng;
  deliveryInstructions?: string;
}

export interface OrderRestaurant {
  name: string;
  address: string;
  phoneNumber: string;
  coordinates: LatLng;
  pickupInstructions?: string;
}

export interface OrderItem {
  name: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

export interface OrderProofOfDelivery {
  photoUrl: string;
  signature?: string;
  customerPin?: string;
  deliveryNotes?: string;
}

export interface OrderRating {
  score: number;
  comment?: string;
  ratedAt: any;
}

export interface ShipdayInfo {
  orderId: number;
  status: string;
  lastSync: any;
}

export interface OrderDocument {
  id: string;
  orderNumber: string;
  businessId: string;
  source: 'BEFAST_DELIVERY' | 'BEFAST_MARKET';
  status: OrderStatus;
  assignedDriverId: string | null;
  customer: OrderCustomer;
  restaurant: OrderRestaurant;
  items: OrderItem[];
  pricing: OrderPricing;
  paymentMethod: 'CASH' | 'CARD';
  timing: OrderTiming;
  logistics: OrderLogistics;
  proofOfDelivery?: OrderProofOfDelivery;
  rating?: OrderRating;
  shipday?: ShipdayInfo;
}

// Adaptación para componentes existentes (usa pickup/delivery.location)
export function adaptOrderForLegacy(order: OrderDocument) {
  const pickupLocation = order.restaurant?.coordinates
    ? { latitude: order.restaurant.coordinates.lat, longitude: order.restaurant.coordinates.lng }
    : undefined;
  const deliveryLocation = order.customer?.coordinates
    ? { latitude: order.customer.coordinates.lat, longitude: order.customer.coordinates.lng }
    : undefined;
  return {
    id: order.id,
    status: order.status,
    earnings: order.pricing?.totalAmount ?? 0,
    payment: { method: order.paymentMethod === 'CARD' ? 'TARJETA' : 'EFECTIVO', tip: order.pricing?.tip },
    distance: order.logistics?.distance || 0,
    pickup: { name: order.restaurant?.name || 'Restaurante', location: pickupLocation },
    customer: { name: order.customer?.name || 'Cliente', location: deliveryLocation },
    timestamps: { created: order.timing?.createdAt },
    driverId: order.assignedDriverId,
    _raw: order,
  };
}

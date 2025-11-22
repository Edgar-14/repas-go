/**
 * @fileoverview Definición canónica y única para la estructura de datos de un Pedido (Order).
 * ÚNICA FUENTE DE VERDAD para todo el ecosistema BeFast.
 * 
 * Los estados están basados estrictamente en los valores 'orderState' de la API oficial de Shipday
 * según documentado en docs/shipday.md
 */

// Basado estricta y únicamente en los valores 'orderState' de la API oficial de Shipday
// Incluye estados adicionales usados en el sistema BeFast
export const CANONICAL_ORDER_STATUSES = [
  'ACTIVE', 'NOT_ASSIGNED', 'NOT_ACCEPTED', 'NOT_STARTED_YET',
  'STARTED', 'PICKED_UP', 'READY_TO_DELIVER', 'ALREADY_DELIVERED',
  'FAILED_DELIVERY', 'INCOMPLETE',
  'CANCELLED', 'DELIVERED', 'COMPLETED' // Estados adicionales del sistema
] as const;

export type OrderStatus = typeof CANONICAL_ORDER_STATUSES[number];
// Para casos legacy, usa un tipo separado:
export type OrderStatusLegacy = OrderStatus | string;

export type PaymentMethod = 'CASH' | 'CARD' | 'UNKNOWN';

/**
 * Normaliza valores de método de pago a mayúsculas y mapea valores no reconocidos a 'UNKNOWN'
 */
export function normalizePaymentMethod(value: string | undefined | null): PaymentMethod {
  if (!value) return 'UNKNOWN';
  const normalized = value.toString().toUpperCase();
  return normalized === 'CASH' || normalized === 'CARD' ? normalized as PaymentMethod : 'UNKNOWN';
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  coordinates?: { lat: number; lng: number };
  reference?: string;
}

// Legacy customer info format (still in use in some parts of the system)
export interface LegacyCustomerInfo {
  name: string;
  phone: string;
  email?: string;
  address: string;
  coordinates?: { latitude: number; longitude: number };
}

export interface CustomerInfo {
  name: string;
  phone: string;
  email?: string;
  address: Address | string; // Allow string for gradual migration
}

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

/**
 * Interfaz canónica de Order - ÚNICA FUENTE DE VERDAD
 * Todos los archivos del proyecto DEBEN importar esta interfaz
 */
export interface Order {
  // --- Identificadores Core ---
  id: string; // ID de Firestore
  orderNumber: string; // Número de pedido de BeFast (ej. BF-12345)
  businessId: string;
  
  // --- Información del Pedido ---
  // Support both new structured format and legacy flat format
  customer: CustomerInfo | LegacyCustomerInfo | {
    name: string;
    phone: string;
    email?: string;
    address: string;
    coordinates?: { lat?: number; lng?: number; latitude?: number; longitude?: number };
  };
  pickup: { 
    id?: number; // ID del restaurante en Shipday
    name: string; 
    address: string; 
    coordinates: { lat: number; lng: number }; 
    phone?: string;
  };
  items: OrderItem[];
  deliveryInstructions?: string;
  pickupInstruction?: string;
  
  // --- Estado y Flujo ---
  status: OrderStatus;
  source: 'BEFAST' | 'SHIPDAY' | 'MARKET';
  orderType: 'DELIVERY' | 'PICKUP' | 'MARKET';
  
  // --- Precios y Pagos ---
  paymentMethod: PaymentMethod;
  totalOrderValue: number;
  deliveryFee: number;
  tip: number;
  tax: number;
  discount: number;
  totalAmount: number;
  amountToCollect: number;
  
  // --- Asignación ---
  driverId?: string;
  driverName?: string; // Nombre del repartidor asignado en BeFast
  
  // --- Integración con Shipday ---
  shipdayOrderId?: number; // ID numérico de Shipday
  shipdayOrderNumber?: string;
  shipdayCarrierId?: string; // ID del carrier en Shipday (término oficial de Shipday)
  shipdayCarrierName?: string; // Nombre del carrier en Shipday
  trackingLink?: string;
  lastShipdaySync?: any; // Timestamp de Firestore
  
  // --- Datos de Shipday para métricas ---
  activityLog?: {
    placementTime?: string;
    expectedPickupTime?: string;
    expectedDeliveryDate?: string;
    expectedDeliveryTime?: string;
    assignedTime?: string;
    startTime?: string;
    pickedUpTime?: string;
    arrivedTime?: string;
    deliveryTime?: string;
  };
  feedback?: number; // Calificación 1-5 de Shipday
  distance?: number;
  schedule?: boolean;
  etaTime?: string;
  proofOfDelivery?: {
    signaturePath?: string;
    latitude?: number;
    longitude?: number;
    imageUrls?: string[];
  };
  
  // --- Timestamps ---
  createdAt: any; // Timestamp de Firestore
  updatedAt: any; // Timestamp de Firestore
  assignedAt?: any;
  pickedUpAt?: any;
  completedAt?: any;
  
  // --- Flexibilidad para campos adicionales (sin perder type safety en campos críticos) ---
  [key: string]: any;
}
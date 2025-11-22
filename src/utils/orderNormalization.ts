/**
 * ====================================================================
 * NORMALIZACIÓN DE DATOS DE PEDIDOS
 * ====================================================================
 * 
 * PROPÓSITO:
 * - Transformar datos legacy de Firestore al modelo canónico en memoria
 * - Garantizar retrocompatibilidad total con datos antiguos
 * - Proporcionar defaults seguros para campos faltantes
 * - Normalizar formatos de datos inconsistentes
 * 
 * USO:
 * - Llamar desde hooks de lectura de datos (useRealtimeOrders, etc.)
 * - Aplicar antes de renderizar en UI
 * - Usar en servicios que procesen datos de pedidos
 * 
 * PRINCIPIOS:
 * - No muta datos en Firestore (solo en memoria)
 * - Siempre retorna datos en formato canónico
 * - Maneja gracefully todos los casos edge
 */

import { Order, OrderStatus, CANONICAL_ORDER_STATUSES, Address, CustomerInfo } from '@/lib/types/Order';
import type { Timestamp as FirestoreTimestamp } from 'firebase/firestore';

/**
 * Normaliza un pedido de Firestore al modelo canónico de Order
 * Maneja datos legacy y formatos inconsistentes
 */
export function normalizeOrderData(rawOrder: any): Order {
  // Si ya está en formato canónico completo, retornar
  if (isCanonicalOrder(rawOrder)) {
    return rawOrder as Order;
  }
  
  const normalized: Order = {
    // --- Identificadores Core ---
    id: rawOrder.id || rawOrder.shipdayOrderId || 'unknown',
    orderNumber: rawOrder.orderNumber || rawOrder.order_number || rawOrder.befastOrderId || 'N/A',
    businessId: rawOrder.businessId || rawOrder.business_id || rawOrder.negocioId || 'unknown',
    
    // --- Información del Cliente ---
    customer: normalizeCustomerInfo(rawOrder),
    
    // --- Pickup (Restaurant/Business) ---
    pickup: normalizePickupInfo(rawOrder),
    
    // --- Items ---
    items: normalizeItems(rawOrder),
    
    // --- Instrucciones de entrega ---
    deliveryInstructions: rawOrder.deliveryInstructions 
      || rawOrder.delivery_instructions 
      || rawOrder.notas 
      || rawOrder.specialInstructions 
      || '',
    
    // --- Estado y Flujo ---
    status: normalizeStatus(rawOrder),
    source: normalizeSource(rawOrder),
    orderType: normalizeOrderType(rawOrder),
    
    // --- Precios y Pagos ---
    paymentMethod: normalizePaymentMethod(rawOrder),
    totalOrderValue: normalizeNumber(rawOrder.totalOrderValue || rawOrder.total_order_value || rawOrder.montoACobrar) || 0,
    deliveryFee: normalizeNumber(rawOrder.deliveryFee || rawOrder.delivery_fee || rawOrder.costoEntrega) || 0,
    tip: normalizeNumber(rawOrder.tip || rawOrder.propina) || 0,
    tax: normalizeNumber(rawOrder.tax || rawOrder.impuesto) || 0,
    discount: normalizeNumber(rawOrder.discount || rawOrder.descuento || rawOrder.discountAmount) || 0,
    totalAmount: 0, // Calculated below
    amountToCollect: normalizeNumber(rawOrder.amountToCollect || rawOrder.amount_to_collect || rawOrder.montoACobrar) || 0,
    
    // --- Asignación ---
    driverId: rawOrder.driverId || rawOrder.driver_id || rawOrder.repartidorId || undefined,
    
    // --- Integración con Shipday ---
    shipdayOrderId: normalizeNumber(rawOrder.shipdayOrderId || rawOrder.shipday_order_id),
    shipdayOrderNumber: rawOrder.shipdayOrderNumber || rawOrder.shipday_order_number || undefined,
    trackingLink: rawOrder.trackingLink || rawOrder.tracking_link || undefined,
    lastShipdaySync: rawOrder.lastShipdaySync || rawOrder.last_shipday_sync || undefined,
    
    // --- Timestamps ---
    createdAt: rawOrder.createdAt || rawOrder.created_at || rawOrder.fecha,
    updatedAt: rawOrder.updatedAt || rawOrder.updated_at || rawOrder.fecha,
    assignedAt: rawOrder.assignedAt || rawOrder.assigned_at || undefined,
    pickedUpAt: rawOrder.pickedUpAt || rawOrder.picked_up_at || undefined,
    completedAt: rawOrder.completedAt || rawOrder.completed_at || rawOrder.entregadoAt || undefined,
  };
  
  // Calcular totalAmount si no está presente
  normalized.totalAmount = normalizeNumber(rawOrder.totalAmount || rawOrder.total_amount) 
    || (normalized.totalOrderValue + normalized.deliveryFee + normalized.tip + normalized.tax - normalized.discount);
  
  return normalized;
}

/**
 * Normaliza la información del cliente
 */
function normalizeCustomerInfo(rawOrder: any): CustomerInfo {
  // Si ya está en formato canónico
  if (rawOrder.customer && typeof rawOrder.customer === 'object') {
    const customer = rawOrder.customer;
    
    // Normalizar dirección si es string
    if (typeof customer.address === 'string') {
      return {
        ...customer,
        address: customer.address
      };
    }
    
    return customer;
  }
  
  // Construir desde campos legacy
  const address = rawOrder.direccionEntrega 
    || rawOrder.delivery_address 
    || rawOrder.customerAddress 
    || rawOrder.customer_address 
    || 'N/A';
  
  // Intentar obtener coordenadas de entrega
  const deliveryCoords = normalizeCoordinates(rawOrder, 'delivery');
  
  return {
    name: rawOrder.clienteNombre || rawOrder.cliente_nombre || rawOrder.customerName || rawOrder.customer_name || 'N/A',
    phone: rawOrder.clienteTelefono || rawOrder.cliente_telefono || rawOrder.customerPhone || rawOrder.customer_phone || 'N/A',
    email: rawOrder.clienteEmail || rawOrder.cliente_email || rawOrder.customerEmail || rawOrder.customer_email || undefined,
    address: address,
    // Incluir coordenadas si están disponibles para compatibilidad con CustomerInfo completa
    ...(deliveryCoords && { coordinates: deliveryCoords })
  };
}

/**
 * Normaliza la información de pickup
 */
function normalizePickupInfo(rawOrder: any): Order['pickup'] {
  if (rawOrder.pickup && typeof rawOrder.pickup === 'object') {
    return rawOrder.pickup;
  }
  
  const coords = normalizeCoordinates(rawOrder, 'pickup');
  
  return {
    name: rawOrder.restaurantName || rawOrder.restaurant_name || rawOrder.negocio || 'Restaurant',
    address: rawOrder.restaurantAddress || rawOrder.restaurant_address || rawOrder.negocioAddress || 'N/A',
    coordinates: coords || { lat: 0, lng: 0 }, // Provide default coordinates if none found
    phone: rawOrder.restaurantPhone || rawOrder.restaurant_phone || undefined
  };
}

/**
 * Normaliza coordenadas geográficas
 */
function normalizeCoordinates(rawOrder: any, type: 'delivery' | 'pickup'): { lat: number; lng: number } | undefined {
  const prefix = type === 'delivery' ? 'dropoff' : 'pickup';
  
  // Intentar desde campo específico
  let lat = rawOrder[`${prefix}Lat`] || rawOrder[`${prefix}_lat`];
  let lng = rawOrder[`${prefix}Lng`] || rawOrder[`${prefix}_lng`];
  
  // Intentar desde objeto coordinates
  if (!lat || !lng) {
    const coords = rawOrder[`${prefix}Coordinates`] || rawOrder[`${prefix}_coordinates`];
    if (coords) {
      lat = coords.lat || coords.latitude;
      lng = coords.lng || coords.longitude;
    }
  }
  
  // Validar y retornar
  if (typeof lat === 'number' && typeof lng === 'number' && lat !== 0 && lng !== 0) {
    return { lat, lng };
  }
  
  return undefined;
}

/**
 * Normaliza items del pedido
 */
function normalizeItems(rawOrder: any): Order['items'] {
  if (Array.isArray(rawOrder.items)) {
    return rawOrder.items.map((item: any) => ({
      name: item.name || item.nombre || 'Item',
      quantity: normalizeNumber(item.quantity || item.cantidad) || 1,
      price: normalizeNumber(item.price || item.precio) || 0,
      notes: item.notes || item.notas || undefined
    }));
  }
  
  // Si no hay items, retornar array vacío
  return [];
}

/**
 * Normaliza el estado del pedido al sistema canónico
 */
function normalizeStatus(rawOrder: any): OrderStatus {
  const status = (rawOrder.status || rawOrder.estado || 'ACTIVE').toUpperCase();
  
  // Si ya es un estado canónico, retornar
  if ((CANONICAL_ORDER_STATUSES as readonly string[]).includes(status)) {
    return status as OrderStatus;
  }
  
  // Mapear estados legacy a canónicos
  const statusMap: Record<string, OrderStatus> = {
    'PENDIENTE': 'ACTIVE',
    'PENDING': 'ACTIVE',
    'BUSCANDO': 'NOT_ASSIGNED',
    'SEARCHING': 'NOT_ASSIGNED',
    'ASIGNADO': 'STARTED',
    'ASSIGNED': 'STARTED',
    'EN_CAMINO': 'PICKED_UP',
    'IN_TRANSIT': 'PICKED_UP',
    'ENTREGADO': 'ALREADY_DELIVERED',
    'DELIVERED': 'ALREADY_DELIVERED',
    'COMPLETADO': 'ALREADY_DELIVERED',
    'COMPLETED': 'ALREADY_DELIVERED',
    'CANCELADO': 'CANCELLED',
    'CANCELED': 'CANCELLED',
    'FALLIDO': 'FAILED_DELIVERY',
    'FAILED': 'FAILED_DELIVERY'
  };
  
  return statusMap[status] || 'ACTIVE';
}

/**
 * Normaliza la fuente del pedido
 */
function normalizeSource(rawOrder: any): Order['source'] {
  const source = (rawOrder.source || rawOrder.origen || 'BEFAST').toUpperCase();
  
  if (source.includes('MARKET')) return 'MARKET';
  if (source.includes('SHIPDAY')) return 'SHIPDAY';
  return 'BEFAST';
}

/**
 * Normaliza el tipo de pedido
 */
function normalizeOrderType(rawOrder: any): Order['orderType'] {
  const orderType = (rawOrder.orderType || rawOrder.order_type || rawOrder.tipo || '').toUpperCase();
  
  if (orderType.includes('MARKET')) return 'MARKET';
  if (orderType.includes('PICKUP')) return 'PICKUP';
  return 'DELIVERY';
}

/**
 * Normaliza el método de pago
 */
function normalizePaymentMethod(rawOrder: any): Order['paymentMethod'] {
  const method = (rawOrder.paymentMethod || rawOrder.payment_method || rawOrder.metodoPago || 'CASH').toUpperCase();
  
  if (method === 'TARJETA' || method === 'CARD' || method === 'CREDIT_CARD' || method === 'CREDIT') {
    return 'CARD';
  }
  
  if (method === 'EFECTIVO' || method === 'CASH') {
    return 'CASH';
  }
  
  return 'UNKNOWN';
}

/**
 * Normaliza un valor numérico, manejando strings y valores nulos
 */
function normalizeNumber(value: any): number | undefined {
  if (typeof value === 'number') {
    return value;
  }
  
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? undefined : parsed;
  }
  
  return undefined;
}

/**
 * Verifica si un pedido ya está en formato canónico completo
 */
function isCanonicalOrder(order: any): boolean {
  return (
    order &&
    typeof order.id === 'string' &&
    typeof order.orderNumber === 'string' &&
    typeof order.businessId === 'string' &&
    order.customer &&
    order.pickup &&
    Array.isArray(order.items) &&
    typeof order.status === 'string' &&
    typeof order.source === 'string' &&
    typeof order.orderType === 'string' &&
    typeof order.paymentMethod === 'string' &&
    typeof order.totalAmount === 'number'
  );
}

/**
 * Normaliza un array de pedidos
 */
export function normalizeOrdersArray(rawOrders: any[]): Order[] {
  if (!Array.isArray(rawOrders)) {
    console.warn('normalizeOrdersArray received non-array:', typeof rawOrders);
    return [];
  }
  
  return rawOrders.map(normalizeOrderData);
}

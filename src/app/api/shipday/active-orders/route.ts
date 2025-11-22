/**
 * API endpoint para obtener pedidos activos con información enriquecida
 * Combina datos de Firestore + Shipday y devuelve información en español
 */

import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/collections';
import { getSpanishStatus, getSpanishStatusFromEvent } from '@/constants/enums';
import withAuth from '@/components/auth/withAuth';

interface ActiveOrderFilters {
  status?: string[];
  businessId?: string;
  driverId?: string;
  source?: 'DELIVERY' | 'MARKET';
  limit?: number;
}

/**
 * Función helper para formatear timestamps a formato legible
 */
function formatTimestamp(timestamp: any): string | null {
  if (!timestamp) return null;

  try {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate().toLocaleString('es-MX', {
        timeZone: 'America/Mexico_City',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    }

    if (timestamp._seconds) {
      return new Date(timestamp._seconds * 1000).toLocaleString('es-MX', {
        timeZone: 'America/Mexico_City'
      });
    }

    return new Date(timestamp).toLocaleString('es-MX', {
      timeZone: 'America/Mexico_City'
    });
  } catch (error) {
    console.error('Error formateando timestamp:', error);
    return null;
  }
}

/**
 * Función helper para formatear moneda
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(amount || 0);
}

/**
 * Función helper para calcular tiempo transcurrido
 */
function getTimeElapsed(createdAt: any): string {
  if (!createdAt) return 'Tiempo desconocido';

  try {
    const createdDate = createdAt instanceof Timestamp
      ? createdAt.toDate()
      : new Date(createdAt._seconds * 1000 || createdAt);

    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60));

    if (diffMinutes < 60) {
      return `${diffMinutes} min`;
    } else if (diffMinutes < 1440) {
      const hours = Math.floor(diffMinutes / 60);
      return `${hours}h ${diffMinutes % 60}m`;
    } else {
      const days = Math.floor(diffMinutes / 1440);
      return `${days} día${days > 1 ? 's' : ''}`;
    }
  } catch (error) {
    return 'Tiempo desconocido';
  }
}

/**
 * Función helper para obtener progreso del pedido
 */
function getOrderProgress(order: any): number {
  const statusProgress: Record<string, number> = {
    'PENDING': 10,
    'NOT_ASSIGNED': 5,
    'NOT_ACCEPTED': 5,
    'NOT_STARTED_YET': 15,
    'STARTED': 20,
    'ASSIGNED': 25,
    'IN_PROGRESS': 30,
    'AT_PICKUP': 35,
    'READY_FOR_PICKUP': 40,
    'PICKED_UP': 75,
    'READY_TO_DELIVER': 80,
    'IN_TRANSIT': 85,
    'DELIVERED': 100,
    'COMPLETED': 100,
    'CANCELLED': 0,
    'FAILED': 0
  };

  return statusProgress[order.status] || 0;
}

/**
 * Función helper para enriquecer datos del pedido
 */
function enrichOrderData(order: any) {
  const enrichedOrder = {
    // Información básica
    id: order.id,
    orderNumber: order.orderNumber || order.shipdayOrderId || 'N/A',
    source: order.source || 'BeFast Delivery',
    orderType: order.orderType || order.source,
    status: order.status || 'PENDING',
    statusEs: getSpanishStatus(order.status) || 'Pendiente',
    statusColor: getOrderStatusColor(order.status),
    statusIcon: getOrderStatusIcon(order.status),

    // Información financiera
    deliveryFee: order.deliveryFee || 0,
    tip: order.tip || 0,
    discountAmount: order.discountAmount || 0,
    tax: order.tax || 0,
    subtotal: order.subtotal || order.deliveryFee || 0,
    totalAmount: order.totalAmount || (order.deliveryFee + (order.tip || 0)) || 0,
    paymentMethod: order.paymentMethod || 'CASH',
    paymentMethodLabel: order.paymentMethod === 'CARD' ? 'Tarjeta' : 'Efectivo',

    // Información del cliente
    customerInfo: order.customerInfo || {
      name: order.customerName || order.customer_name || 'Cliente',
      phone: order.customerPhone || order.customer_phone || '',
      address: order.customerAddress || order.customer_address || order.deliveryAddress || order.delivery_address || ''
    },

    // Información del negocio
    businessInfo: order.businessInfo || {
      name: order.businessName || order.business_name || 'Negocio',
      phone: order.businessPhone || order.business_phone || '',
      address: order.businessAddress || order.business_address || order.pickupAddress || order.pickup_address || ''
    },

    // Información del conductor
    driverInfo: order.driverId ? {
      id: order.driverId,
      name: order.driverName || order.driver_name || 'Conductor',
      phone: order.driverPhone || order.driver_phone || ''
    } : null,

    // Información de ubicación
    pickupAddress: order.pickupAddress || order.businessInfo?.address || '',
    deliveryAddress: order.deliveryAddress || order.customerInfo?.address || '',

    // Información de Shipday
    shipdayOrderId: order.shipdayOrderId,
    shipdayOrderNumber: order.shipdayOrderNumber,
    shipdayStatus: order.shipdayStatus,
    shipdayTrackingLink: order.shipdayTrackingLink,
    trackingLink: order.trackingLink,
    proofOfDelivery: order.proofOfDelivery,

    // Información de timeline
    createdAt: formatTimestamp(order.createdAt),
    updatedAt: formatTimestamp(order.updatedAt),
    assignedAt: formatTimestamp(order.assignedAt),
    pickedUpAt: formatTimestamp(order.pickedUpAt),
    readyToDeliverAt: formatTimestamp(order.readyToDeliverAt),
    deliveredAt: formatTimestamp(order.deliveredAt),
    completedAt: formatTimestamp(order.completedAt),
    placementTime: formatTimestamp(order.placementTime),
    assignedTime: formatTimestamp(order.assignedTime),
    pickedupTime: formatTimestamp(order.pickedupTime),
    deliveryTime: formatTimestamp(order.deliveryTime),
    estimatedDeliveryTime: formatTimestamp(order.estimatedDeliveryTime),
    actualDeliveryTime: formatTimestamp(order.actualDeliveryTime),

    // Información de tiempo
    timeElapsed: getTimeElapsed(order.createdAt),
    progress: getOrderProgress(order),

    // Información adicional
    priority: order.priority || 'normal',
    priorityLabel: order.priority === 'high' ? 'Alta' : order.priority === 'urgent' ? 'Urgente' : 'Normal',
    specialInstructions: order.specialInstructions || '',
    notes: order.notes || '',
    items: order.items || [],

    // Información técnica
    lastShipdaySync: formatTimestamp(order.lastShipdaySync),
    financialProcessed: order.financialProcessed || false,
    tags: order.tags || [],

    // Información para el frontend
    canCancel: ['PENDING', 'ASSIGNED', 'NOT_ASSIGNED'].includes(order.status),
    canReassign: ['ASSIGNED', 'IN_PROGRESS'].includes(order.status),
    isActive: !['COMPLETED', 'CANCELLED', 'FAILED'].includes(order.status),
    isCompleted: order.status === 'COMPLETED',
    isProblematic: ['FAILED', 'CANCELLED'].includes(order.status)
  };

  return enrichedOrder;
}

/**
 * Función helper para obtener colores de estado
 */
function getOrderStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    'PENDING': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'NOT_ASSIGNED': 'bg-gray-100 text-gray-800 border-gray-200',
    'NOT_ACCEPTED': 'bg-orange-100 text-orange-800 border-orange-200',
    'NOT_STARTED_YET': 'bg-blue-100 text-blue-800 border-blue-200',
    'STARTED': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    'ASSIGNED': 'bg-blue-100 text-blue-800 border-blue-200',
    'IN_PROGRESS': 'bg-purple-100 text-purple-800 border-purple-200',
    'AT_PICKUP': 'bg-cyan-100 text-cyan-800 border-cyan-200',
    'READY_FOR_PICKUP': 'bg-teal-100 text-teal-800 border-teal-200',
    'PICKED_UP': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    'READY_TO_DELIVER': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'IN_TRANSIT': 'bg-purple-100 text-purple-800 border-purple-200',
    'DELIVERED': 'bg-green-100 text-green-800 border-green-200',
    'COMPLETED': 'bg-green-100 text-green-800 border-green-200',
    'CANCELLED': 'bg-gray-100 text-gray-800 border-gray-200',
    'FAILED': 'bg-red-100 text-red-800 border-red-200',
    'INCOMPLETE': 'bg-orange-100 text-orange-800 border-orange-200'
  };

  return colorMap[status] || 'bg-gray-100 text-gray-800 border-gray-200';
}

/**
 * Función helper para obtener íconos de estado
 */
function getOrderStatusIcon(status: string): string {
  const iconMap: Record<string, string> = {
    'PENDING': '⏳',
    'NOT_ASSIGNED': '⭕',
    'NOT_ACCEPTED': '❌',
    'NOT_STARTED_YET': '🔄',
    'STARTED': '▶️',
    'ASSIGNED': '👤',
    'IN_PROGRESS': '🔄',
    'AT_PICKUP': '📍',
    'READY_FOR_PICKUP': '📦',
    'PICKED_UP': '✅',
    'READY_TO_DELIVER': '🚚',
    'IN_TRANSIT': '🚚',
    'DELIVERED': '✅',
    'COMPLETED': '✅',
    'CANCELLED': '❌',
    'FAILED': '⚠️',
    'INCOMPLETE': '⚠️'
  };

  return iconMap[status] || '❓';
}

/**
 * GET /api/shipday/active-orders
 * Obtiene pedidos activos con información enriquecida en español
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Extraer parámetros de consulta
    const status = searchParams.get('status')?.split(',') || [];
    const businessId = searchParams.get('businessId');
    const driverId = searchParams.get('driverId');
    const source = searchParams.get('source') as 'DELIVERY' | 'MARKET' | null;
    const limitParam = parseInt(searchParams.get('limit') || '50');

    // Construir consulta Firestore
    let q = query(collection(db, COLLECTIONS.ORDERS));

    // Aplicar filtros
    if (status.length > 0) {
      q = query(q, where('status', 'in', status));
    } else {
      // Por defecto, mostrar pedidos activos
      const activeStatuses = [
        'PENDING', 'NOT_ASSIGNED', 'NOT_ACCEPTED', 'NOT_STARTED_YET',
        'STARTED', 'ASSIGNED', 'IN_PROGRESS', 'AT_PICKUP', 'READY_FOR_PICKUP',
        'PICKED_UP', 'READY_TO_DELIVER', 'IN_TRANSIT'
      ];
      q = query(q, where('status', 'in', activeStatuses));
    }

    if (businessId) {
      q = query(q, where('businessId', '==', businessId));
    }

    if (driverId) {
      q = query(q, where('driverId', '==', driverId));
    }

    if (source) {
      q = query(q, where('source', '==', source));
    }

    // Ordenar por fecha de creación (más recientes primero)
    q = query(q, orderBy('createdAt', 'desc'));

    // Aplicar límite
    const limitValue = Math.min(limitParam, 100); // Máximo 100 pedidos
    q = query(q, limit(limitValue));

    // Ejecutar consulta
    const querySnapshot = await getDocs(q);

    // Procesar resultados
    const orders = querySnapshot.docs.map(doc => {
      const orderData = { id: doc.id, ...doc.data() };
      return enrichOrderData(orderData);
    });

    // Respuesta exitosa
    return NextResponse.json({
      success: true,
      data: {
        orders,
        total: orders.length,
        filters: {
          status: status.length > 0 ? status : 'active',
          businessId,
          driverId,
          source,
          limit: limitValue
        }
      },
      message: `Se encontraron ${orders.length} pedidos activos`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error obteniendo pedidos activos:', error);

    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      message: error instanceof Error ? error.message : 'Error desconocido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * POST /api/shipday/active-orders
 * Búsqueda avanzada de pedidos activos con filtros adicionales
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      status,
      businessId,
      driverId,
      source,
      dateFrom,
      dateTo,
      minAmount,
      maxAmount,
      paymentMethod,
      priority,
      searchTerm,
      limit = 50
    } = body;

    // Construir consulta Firestore
    let q = query(collection(db, COLLECTIONS.ORDERS));

    // Aplicar filtros básicos
    if (status && status.length > 0) {
      q = query(q, where('status', 'in', status));
    } else {
      // Por defecto, mostrar pedidos activos
      const activeStatuses = [
        'PENDING', 'NOT_ASSIGNED', 'NOT_ACCEPTED', 'NOT_STARTED_YET',
        'STARTED', 'ASSIGNED', 'IN_PROGRESS', 'AT_PICKUP', 'READY_FOR_PICKUP',
        'PICKED_UP', 'READY_TO_DELIVER', 'IN_TRANSIT'
      ];
      q = query(q, where('status', 'in', activeStatuses));
    }

    if (businessId) {
      q = query(q, where('businessId', '==', businessId));
    }

    if (driverId) {
      q = query(q, where('driverId', '==', driverId));
    }

    if (source) {
      q = query(q, where('source', '==', source));
    }

    if (paymentMethod && paymentMethod.length > 0) {
      q = query(q, where('paymentMethod', 'in', paymentMethod));
    }

    if (priority && priority.length > 0) {
      q = query(q, where('priority', 'in', priority));
    }

    // Filtros de fecha
    if (dateFrom) {
      q = query(q, where('createdAt', '>=', Timestamp.fromDate(new Date(dateFrom))));
    }

    if (dateTo) {
      q = query(q, where('createdAt', '<=', Timestamp.fromDate(new Date(dateTo))));
    }

    // Filtros de monto
    if (minAmount) {
      q = query(q, where('totalAmount', '>=', minAmount));
    }

    if (maxAmount) {
      q = query(q, where('totalAmount', '<=', maxAmount));
    }

    // Ordenar por fecha de creación (más recientes primero)
    q = query(q, orderBy('createdAt', 'desc'));

    // Aplicar límite
    const limitValue = Math.min(limit, 200); // Máximo 200 pedidos para búsquedas avanzadas
    q = query(q, limit(limitValue));

    // Ejecutar consulta
    const querySnapshot = await getDocs(q);

    // Procesar resultados
    let orders = querySnapshot.docs.map(doc => {
      const orderData = { id: doc.id, ...doc.data() };
      return enrichOrderData(orderData);
    });

    // Aplicar filtro de búsqueda por texto si se proporciona
    if (searchTerm && searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      orders = orders.filter(order =>
        order.customerInfo.name.toLowerCase().includes(searchLower) ||
        order.customerInfo.phone.includes(searchTerm) ||
        order.businessInfo.name.toLowerCase().includes(searchLower) ||
        order.orderNumber.toLowerCase().includes(searchLower) ||
        (order.driverInfo?.name.toLowerCase().includes(searchLower)) ||
        order.specialInstructions.toLowerCase().includes(searchLower)
      );
    }

    // Respuesta exitosa
    return NextResponse.json({
      success: true,
      data: {
        orders,
        total: orders.length,
        filters: {
          status,
          businessId,
          driverId,
          source,
          dateFrom,
          dateTo,
          minAmount,
          maxAmount,
          paymentMethod,
          priority,
          searchTerm,
          limit: limitValue
        }
      },
      message: `Búsqueda completada: ${orders.length} pedidos encontrados`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error en búsqueda avanzada de pedidos:', error);

    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      message: error instanceof Error ? error.message : 'Error desconocido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

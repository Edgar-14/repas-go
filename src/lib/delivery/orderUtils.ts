/**
 * @file Provides a centralized service and utility functions for handling order status logic in the frontend.
 * @author Jules
 */

import { getSpanishStatus } from '@/constants/enums';
import { normalizeOrderStatus } from '@/utils/orderStatusHelpers';
import {
  ORDER_STATUS_DEFINITIONS,
  SHIPDAY_EVENT_DEFINITIONS,
  OrderStatusDefinition,
  OrderStatusKey
} from '../../../shared/orderStatusDefinitions';

/**
 * A centralized service for managing and interpreting order statuses consistently.
 *
 * NOTE: This service is the intended single source of truth for order status logic
 * in the frontend. However, its functionality is duplicated in other components (e.g.,
 * `src/app/delivery/orders/page.tsx`), leading to inconsistencies.
 */
export class UnifiedOrderStatusService {
  /**
   * Normalizes any given status string to a standardized, uppercase format.
   * @param {string | undefined | null} status - The raw status string.
   * @returns {OrderStatusKey} The normalized status key.
   */
  static normalizeStatus(status: string | undefined | null): OrderStatusKey {
    if (!status) return 'PENDING';
    return normalizeOrderStatus(status.toUpperCase());
  }

  /**
   * Obtiene el texto en español para cualquier estado
   */
  static getSpanishStatus(status: string | undefined | null): string {
    const normalized = this.normalizeStatus(status);
    const definition = ORDER_STATUS_DEFINITIONS.find(def => def.key === normalized);
    return definition?.spanishLabel || 'Estado Desconocido';
  }

  /**
   * Obtiene la configuración completa de un estado (español, color, ícono)
   */
  static getStatusConfig(status: string | undefined | null): {
    status: OrderStatusKey;
    spanish: string;
    color: string;
    icon: string;
    progress: number;
    category: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled' | 'unknown';
  } {
    const normalized = this.normalizeStatus(status);
    const definition = ORDER_STATUS_DEFINITIONS.find(def => def.key === normalized);

    if (!definition) {
      return {
        status: normalized,
        spanish: 'Estado Desconocido',
        color: 'bg-gray-100 text-gray-800 border-gray-300',
        icon: '⏳',
        progress: 0,
        category: 'unknown'
      };
    }

    // Determinar categoría
    let category: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled' | 'unknown' = 'unknown';
    if (definition.isFinal) {
      if (['CANCELLED', 'FAILED', 'FAILED_DELIVERY', 'INCOMPLETE'].includes(definition.key)) {
        category = 'cancelled';
      } else {
        category = 'completed';
      }
    } else if (['PENDING', 'NOT_ASSIGNED', 'NOT_ACCEPTED', 'NOT_STARTED_YET'].includes(definition.key)) {
      category = 'pending';
    } else {
      category = 'in_progress';
    }

    return {
      status: definition.key,
      spanish: definition.spanishLabel,
      color: definition.color,
      icon: definition.icon,
      progress: definition.progress,
      category
    };
  }

  /**
   * Determina si un pedido está activo (no completado/cancelado/fallido)
   */
  static isOrderActive(status: string | undefined | null): boolean {
    const config = this.getStatusConfig(status);
    return config.category === 'pending' || config.category === 'in_progress';
  }

  /**
   * Determina si un pedido está completado
   */
  static isOrderCompleted(status: string | undefined | null): boolean {
    const config = this.getStatusConfig(status);
    return config.category === 'completed';
  }

  /**
   * Determina si un pedido puede ser cancelado
   */
  static canCancelOrder(status: string | undefined | null): boolean {
    const config = this.getStatusConfig(status);
    return config.category === 'pending';
  }

  /**
   * Obtiene el progreso del pedido (0-100)
   */
  static getOrderProgress(status: string | undefined | null): number {
    const config = this.getStatusConfig(status);
    return config.progress;
  }

  /**
   * Obtiene categorías de estado para filtros
   */
  static getStatusCategories(): Array<{
    key: string;
    label: string;
    statuses: OrderStatusKey[];
  }> {
    return [
      {
        key: 'pendiente',
        label: 'Pendientes',
        statuses: ['PENDING', 'NOT_ASSIGNED', 'NOT_ACCEPTED', 'NOT_STARTED_YET']
      },
      {
        key: 'asignado',
        label: 'Asignados',
        statuses: ['ASSIGNED', 'STARTED', 'IN_PROGRESS']
      },
      {
        key: 'recogido',
        label: 'Recogidos',
        statuses: ['AT_PICKUP', 'READY_FOR_PICKUP', 'PICKED_UP']
      },
      {
        key: 'en_transito',
        label: 'En Tránsito',
        statuses: ['READY_TO_DELIVER', 'IN_TRANSIT']
      },
      {
        key: 'entregado',
        label: 'Entregados',
        statuses: ['DELIVERED', 'COMPLETED', 'ALREADY_DELIVERED']
      },
      {
        key: 'cancelado',
        label: 'Cancelados',
        statuses: ['CANCELLED', 'FAILED', 'FAILED_DELIVERY', 'INCOMPLETE']
      }
    ];
  }
}

// ===========================
// UNIFIED ORDER INTERFACE
// ===========================
export interface UnifiedOrder {
  id: string;
  orderNumber?: string;
  status: string;
  businessId: string;
  businessName?: string;
  driverId?: string;
  driverName?: string;
  customerName?: string;
  customerPhone?: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  totalAmount?: number;
  deliveryFee?: number;
  paymentMethod?: 'CASH' | 'CARD';
  createdAt: any;
  updatedAt?: any;
  assignedAt?: Date;
  pickedUpAt?: Date;
  deliveredAt?: Date;
  completedAt?: Date;
  trackingLink?: string;
  notes?: string;
  shipdayOrderId?: string | number;
  shipdayOrderNumber?: string;
}

// ===========================
// UNIFIED STATUS CONFIGURATION
// ===========================
type IconName = 'Clock' | 'Timer' | 'User' | 'Package' | 'Truck' | 'CheckCircle' | 'AlertCircle' | 'MapPin';

type StatusCategory = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled' | 'unknown';

interface UnifiedStatusConfigEntry {
  spanish: string;
  color: string;
  icon: IconName;
  progress: number;
  category: StatusCategory;
  definition?: OrderStatusDefinition;
}

const DEFAULT_ICON: IconName = 'Clock';

const STATUS_ICON_OVERRIDES: Partial<Record<OrderStatusKey, IconName>> = {
  PENDING: 'Clock',
  NOT_ASSIGNED: 'Clock',
  NOT_ACCEPTED: 'Clock',
  NOT_STARTED_YET: 'Timer',
  STARTED: 'User',
  ASSIGNED: 'User',
  IN_PROGRESS: 'User',
  AT_PICKUP: 'MapPin',
  READY_FOR_PICKUP: 'Package',
  PICKED_UP: 'Package',
  READY_TO_DELIVER: 'Truck',
  IN_TRANSIT: 'Truck',
  DELIVERED: 'CheckCircle',
  ALREADY_DELIVERED: 'CheckCircle',
  COMPLETED: 'CheckCircle',
  FAILED: 'AlertCircle',
  FAILED_DELIVERY: 'AlertCircle',
  INCOMPLETE: 'AlertCircle',
  CANCELLED: 'AlertCircle'
};

const PENDING_STATUS_KEYS = new Set<OrderStatusKey>(['PENDING', 'NOT_ASSIGNED', 'NOT_ACCEPTED', 'NOT_STARTED_YET']);
const FAILED_STATUS_KEYS = new Set<OrderStatusKey>(['FAILED', 'FAILED_DELIVERY', 'INCOMPLETE']);
const CANCELLED_STATUS_KEYS = new Set<OrderStatusKey>(['CANCELLED']);

const determineCategory = (definition: OrderStatusDefinition): StatusCategory => {
  if (CANCELLED_STATUS_KEYS.has(definition.key)) {
    return 'cancelled';
  }
  if (FAILED_STATUS_KEYS.has(definition.key)) {
    return 'failed';
  }
  if (definition.isFinal) {
    return 'completed';
  }
  if (PENDING_STATUS_KEYS.has(definition.key)) {
    return 'pending';
  }
  return 'in_progress';
};

const STATUS_CONFIG_BY_KEY = ORDER_STATUS_DEFINITIONS.reduce<Record<OrderStatusKey, UnifiedStatusConfigEntry>>(
  (accumulator, definition) => {
    const icon = STATUS_ICON_OVERRIDES[definition.key] ?? DEFAULT_ICON;
    accumulator[definition.key] = {
      spanish: definition.spanishLabel,
      color: definition.color,
      icon,
      progress: definition.progress,
      category: determineCategory(definition),
      definition
    };
    return accumulator;
  },
  {} as Record<OrderStatusKey, UnifiedStatusConfigEntry>
);

export const UNIFIED_STATUS_CONFIG = STATUS_CONFIG_BY_KEY;

const SHIPDAY_EVENT_STATUS_LOOKUP = SHIPDAY_EVENT_DEFINITIONS.reduce<Record<string, OrderStatusKey>>(
  (accumulator, definition) => {
    accumulator[definition.event] = definition.befastStatus;
    accumulator[definition.event.toUpperCase()] = definition.befastStatus;
    accumulator[definition.event.toLowerCase()] = definition.befastStatus;
    return accumulator;
  },
  {}
);

// ===========================
// UNIFIED HELPER FUNCTIONS
// ===========================

/**
 * Obtiene la configuración unificada de un estado
 */
/**
 * Retrieves the complete display configuration for a given order status.
 * This is a standalone helper function that duplicates the logic within the UnifiedOrderStatusService.
 *
 * @param {string} status - The raw status string.
 * @returns {UnifiedStatusConfigEntry} The full configuration object for the status.
 */
export const getStatusConfig = (status: string): UnifiedStatusConfigEntry => {
  const normalized = normalizeOrderStatus(status) as OrderStatusKey;
  const config = UNIFIED_STATUS_CONFIG[normalized];

  if (config) {
    return config;
  }

  return {
    spanish: getSpanishStatus(status ?? normalized),
    color: 'bg-gray-100 text-gray-800 border-gray-300',
    icon: DEFAULT_ICON,
    progress: 0,
    category: 'unknown'
  };
};

/**
 * Obtiene solo el texto en español de un estado
 */
export const getSpanishStatusText = (status: string): string => {
  const config = getStatusConfig(status);
  return config.spanish;
};

/**
 * Obtiene la configuración de badge para un estado (sin JSX)
 */
export const getStatusBadgeConfig = (status: string) => {
  const config = getStatusConfig(status);
  return {
    spanish: config.spanish,
    color: config.color,
    icon: config.icon,
    progress: config.progress,
    category: config.category
  };
};

/**
 * Calcula el porcentaje de progreso de una orden
 */
export const getOrderProgress = (status: string): number => {
  const config = getStatusConfig(status);
  return config.progress;
};

/**
 * Determina si una orden está completada
 */
export const isOrderCompleted = (status: string): boolean => {
  const config = getStatusConfig(status);
  return config.category === 'completed';
};

/**
 * Determina si una orden está pendiente
 */
export const isOrderPending = (status: string): boolean => {
  const config = getStatusConfig(status);
  return config.category === 'pending';
};

/**
 * Determina si una orden está en progreso
 */
export const isOrderInProgress = (status: string): boolean => {
  const config = getStatusConfig(status);
  return config.category === 'in_progress';
};

/**
 * Determina si una orden falló o fue cancelada
 */
export const isOrderFailed = (status: string): boolean => {
  const config = getStatusConfig(status);
  return config.category === 'failed' || config.category === 'cancelled';
};

/**
 * Obtiene todos los estados disponibles para filtros
 */
export const getAvailableStatuses = () => {
  return ORDER_STATUS_DEFINITIONS.map((definition) => {
    const config = getStatusConfig(definition.key);
    return {
      value: definition.key,
      label: config.spanish,
      category: config.category
    };
  });
};

/**
 * Filtra órdenes por estado
 */
export const filterOrdersByStatus = (orders: UnifiedOrder[], statusFilter: string): UnifiedOrder[] => {
  if (statusFilter === 'ALL' || statusFilter === 'all') {
    return orders;
  }

  const normalizedFilter = normalizeOrderStatus(statusFilter);

  return orders.filter((order) => normalizeOrderStatus(order.status) === normalizedFilter);
};

/**
 * Filtra órdenes por categoría (pending, in_progress, completed, etc.)
 */
export const filterOrdersByCategory = (orders: UnifiedOrder[], category: string): UnifiedOrder[] => {
  return orders.filter(order => {
    const config = getStatusConfig(order.status);
    return config.category === category;
  });
};

/**
 * Formatea fecha de manera consistente
 */
export const formatOrderDate = (date: any): string => {
  if (!date) return 'N/A';
  
  if (date.toDate) {
    return date.toDate().toLocaleString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  return new Date(date).toLocaleString('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Calcula estadísticas de órdenes
 */
export const calculateOrderStats = (orders: UnifiedOrder[]) => {
  const total = orders.length;
  const pending = filterOrdersByCategory(orders, 'pending').length;
  const inProgress = filterOrdersByCategory(orders, 'in_progress').length;
  const completed = filterOrdersByCategory(orders, 'completed').length;
  const failed = filterOrdersByCategory(orders, 'failed').length + filterOrdersByCategory(orders, 'cancelled').length;
  
  return {
    total,
    pending,
    inProgress,
    completed,
    failed,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
  };
};

/**
 * Mapea eventos de Shipday a estados BeFast
 */
export const mapShipdayEventToStatus = (event: string): string => {
  if (!event) {
    return 'PENDING';
  }

  const normalized = event.toUpperCase();

  return (
    SHIPDAY_EVENT_STATUS_LOOKUP[event] ||
    SHIPDAY_EVENT_STATUS_LOOKUP[normalized] ||
    'PENDING'
  );
};

/**
 * 🚨 CRÍTICO: Determina si un pedido es de tipo Market
 * Basado en campos canónicos (orderType, source) en lugar de heurísticas
 * NO usar startsWith('#') ya que es poco confiable
 */
/**
 * Determines if an order is a 'Market' order based on its properties.
 * NOTE: This is a duplication of business logic that also exists in the backend.
 *
 * @param {UnifiedOrder | any} order - The order object to check.
 * @returns {boolean} True if the order is identified as a Market order.
 */
export const isMarketOrder = (order: UnifiedOrder | any): boolean => {
  // Método 1: Verificar orderType (más confiable)
  if (order.orderType) {
    return order.orderType.toUpperCase() === 'MARKET';
  }
  
  // Método 2: Verificar source
  if (order.source) {
    const source = order.source.toUpperCase();
    return source.includes('MARKET');
  }
  
  // Método 3: Verificar businessId (market orders tienen businessId especial)
  if (order.businessId) {
    const businessId = order.businessId.toLowerCase();
    return businessId === 'befast_market' || businessId === 'market';
  }
  
  // Por defecto, asumir que NO es market order
  return false;
};

/**
 * Normaliza el número de pedido para mostrar consistentemente
 * Elimina prefijos inconsistentes y formatea de manera uniforme
 */
export const normalizeOrderNumber = (orderNumber: string | undefined): string => {
  if (!orderNumber) return 'N/A';
  
  // Si ya tiene formato BF-, retornar tal cual
  if (orderNumber.startsWith('BF-')) {
    return orderNumber;
  }
  
  // Si tiene formato #, quitar el #
  if (orderNumber.startsWith('#')) {
    return orderNumber.substring(1);
  }
  
  // Si es solo número, retornar tal cual
  return orderNumber;
};

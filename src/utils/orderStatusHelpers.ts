import {
  ORDER_STATUS_DEFINITIONS,
  ORDER_STATUS_LOOKUP,
  OrderStatusKey,
  OrderStatusDefinition
} from '../../shared/orderStatusDefinitions';

/**
 * Helper functions para manejar estados de pedidos consistentemente
 * IMPORTANTE: Todos los estados deben estar en MAYÚSCULAS
 * Incluye estados completos para integración Shipday
 */

export type OrderStatus = OrderStatusKey;

const STATUS_BY_KEY = ORDER_STATUS_DEFINITIONS.reduce<Record<OrderStatus, OrderStatusDefinition>>(
  (accumulator, definition) => {
    accumulator[definition.key] = definition;
    return accumulator;
  },
  {} as Record<OrderStatus, OrderStatusDefinition>
);

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = ORDER_STATUS_DEFINITIONS.reduce(
  (accumulator, definition) => {
    accumulator[definition.key] = definition.spanishLabel;
    return accumulator;
  },
  {} as Record<OrderStatus, string>
);

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = ORDER_STATUS_DEFINITIONS.reduce(
  (accumulator, definition) => {
    accumulator[definition.key] = definition.color;
    return accumulator;
  },
  {} as Record<OrderStatus, string>
);

export const ORDER_STATUS_ICONS: Record<OrderStatus, string> = ORDER_STATUS_DEFINITIONS.reduce(
  (accumulator, definition) => {
    accumulator[definition.key] = definition.icon;
    return accumulator;
  },
  {} as Record<OrderStatus, string>
);

/**
 * Normaliza el estado a mayúsculas
 * Maneja casos legacy con minúsculas o mixed case
 */
export function normalizeOrderStatus(status: string | undefined | null): OrderStatus {
  if (!status) return 'PENDING';
  const normalized = status.toUpperCase();
  const definition = ORDER_STATUS_LOOKUP[normalized];

  return definition?.key ?? 'PENDING';
}

/**
 * Obtiene el label en español para un estado
 */
export function getOrderStatusLabel(status: string | undefined | null): string {
  const normalized = normalizeOrderStatus(status);
  return ORDER_STATUS_LABELS[normalized];
}

/**
 * Obtiene las clases CSS para un estado
 */
export function getOrderStatusColor(status: string | undefined | null): string {
  const normalized = normalizeOrderStatus(status);
  return ORDER_STATUS_COLORS[normalized];
}

/**
 * Obtiene el icono para un estado
 */
export function getOrderStatusIcon(status: string | undefined | null): string {
  const normalized = normalizeOrderStatus(status);
  return ORDER_STATUS_ICONS[normalized];
}

/**
 * Determina si un pedido está activo (no completado/cancelado/fallido)
 */
export function isOrderActive(status: string | undefined | null): boolean {
  const normalized = normalizeOrderStatus(status);
  return STATUS_BY_KEY[normalized]?.isActive ?? false;
}

/**
 * Determina si un pedido puede ser cancelado
 */
export function canCancelOrder(status: string | undefined | null): boolean {
  const normalized = normalizeOrderStatus(status);
  return ['PENDING', 'ASSIGNED'].includes(normalized);
}

/**
 * Obtiene el progreso del pedido (0-100)
 */
export function getOrderProgress(status: string | undefined | null): number {
  const normalized = normalizeOrderStatus(status);
  return STATUS_BY_KEY[normalized]?.progress ?? 0;
}

/**
 * @fileoverview Tipos para el sistema de auditoría y logs de BeFast.
 * ÚNICA FUENTE DE VERDAD para registros de auditoría.
 */

import { Timestamp } from 'firebase/firestore';

/**
 * Entrada del log de auditoría
 */
export interface AuditLogEntry {
  id: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  action: string;
  resource?: string;
  resourceId?: string;
  timestamp: string | Timestamp | Date;
  details?: string;
  metadata?: {
    ip?: string;
    userAgent?: string;
    previousValue?: any;
    newValue?: any;
    [key: string]: any;
  };
}

/**
 * Tipos de acciones de auditoría
 */
export const AUDIT_ACTIONS = {
  // Usuario y Autenticación
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED',
  USER_DELETED: 'USER_DELETED',
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',
  PASSWORD_RESET: 'PASSWORD_RESET',
  
  // Pedidos
  ORDER_CREATED: 'ORDER_CREATED',
  ORDER_UPDATED: 'ORDER_UPDATED',
  ORDER_CANCELLED: 'ORDER_CANCELLED',
  ORDER_COMPLETED: 'ORDER_COMPLETED',
  ORDER_ASSIGNED: 'ORDER_ASSIGNED',
  
  // Repartidores
  DRIVER_CREATED: 'DRIVER_CREATED',
  DRIVER_UPDATED: 'DRIVER_UPDATED',
  DRIVER_APPROVED: 'DRIVER_APPROVED',
  DRIVER_REJECTED: 'DRIVER_REJECTED',
  DRIVER_SUSPENDED: 'DRIVER_SUSPENDED',
  DRIVER_ACTIVATED: 'DRIVER_ACTIVATED',
  
  // Negocios
  BUSINESS_CREATED: 'BUSINESS_CREATED',
  BUSINESS_UPDATED: 'BUSINESS_UPDATED',
  BUSINESS_SUSPENDED: 'BUSINESS_SUSPENDED',
  BUSINESS_ACTIVATED: 'BUSINESS_ACTIVATED',
  
  // Créditos y Pagos
  CREDITS_PURCHASED: 'CREDITS_PURCHASED',
  CREDITS_ADDED: 'CREDITS_ADDED',
  CREDITS_DEDUCTED: 'CREDITS_DEDUCTED',
  PAYMENT_PROCESSED: 'PAYMENT_PROCESSED',
  
  // Billetera
  WALLET_DEPOSIT: 'WALLET_DEPOSIT',
  WALLET_WITHDRAWAL: 'WALLET_WITHDRAWAL',
  DEBT_PAYMENT: 'DEBT_PAYMENT',
  
  // Sistema
  SYSTEM_CONFIG_UPDATED: 'SYSTEM_CONFIG_UPDATED',
  BACKUP_CREATED: 'BACKUP_CREATED',
  DATA_EXPORTED: 'DATA_EXPORTED',
  DATA_IMPORTED: 'DATA_IMPORTED',
} as const;

export type AuditAction = typeof AUDIT_ACTIONS[keyof typeof AUDIT_ACTIONS];

/**
 * Filtros para consultas de auditoría
 */
export interface AuditLogFilters {
  userId?: string;
  action?: AuditAction | string;
  resource?: string;
  startDate?: Date | Timestamp;
  endDate?: Date | Timestamp;
  limit?: number;
}

/**
 * Resultado de consulta de logs de auditoría
 */
export interface AuditLogQueryResult {
  entries: AuditLogEntry[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}

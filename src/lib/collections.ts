/**
 * 🎯 BEFAST UNIFIED COLLECTIONS CONSTANTS
 * 
 * Constantes unificadas para nombres de colecciones Firestore
 * Usar estas constantes en lugar de strings hardcodeados para:
 * - Evitar typos
 * - Mantener consistencia
 * - Facilitar refactoring
 * - Garantizar mismos datos en todas las páginas
 */

// Local ESM definition to avoid importing from functions (CJS) in Edge/Frontend
export const COLLECTIONS = {
  // 🎯 Core Business Entities (según colecciones.md)
  USERS: 'users',
  BUSINESSES: 'businesses', 
  DRIVERS: 'drivers',
  ORDERS: 'orders',

  // 📋 Applications & Requests
  DRIVER_APPLICATIONS: 'driverApplications',
  CREDIT_PURCHASE_REQUESTS: 'creditPurchaseRequests',
  
  // 💰 Financial Operations
  WALLET_TRANSACTIONS: 'walletTransactions',
  CREDIT_TRANSACTIONS: 'creditTransactions',
  STRIPE_PAYMENTS: 'stripePayments',
  STRIPE_DISPUTES: 'stripeDisputes',
  DRIVER_PAYROLLS: 'payroll',
  CLASIFICACIONES_MENSUALES: 'clasificaciones_mensuales',
  DEBT_PAYMENTS: 'debtPayments',

  // 📊 Shipday Integration & ETL
  SHIPDAY_DRIVERS: 'shipdayDrivers',
  SHIPDAY_ORDERS: 'shipdayOrders',
  DRIVER_PERFORMANCE_METRICS: 'driverPerformanceMetrics',
  DRIVER_PAYMENT_TRACKING: 'driverPaymentTracking', 
  DRIVER_SHIFT_TRACKING: 'driverShiftTracking',

  // 📧 Communications
  NOTIFICATIONS: 'notifications',
  MAIL_QUEUE: 'mailQueue',
  VERIFICATION_CODES: 'verificationCodes',

  // 📄 Documents & Files
  DOCUMENTS: 'documents',
  IDSE_FILES: 'idseFiles',
  CFDI_RECORDS: 'cfdiRecords',

  // 🔍 System & Monitoring
  AUDIT_LOGS: 'auditLogs',
  SYSTEM_LOGS: 'systemLogs',
  SYSTEM_METRICS: 'metrics',
  SYSTEM_ALERTS: 'systemAlerts',
  ACTIVITY: 'activity',
  REPORTS: 'reports',
  SUPPORT_TICKETS: 'supportTickets',
  ROLES: 'roles',
  EMAIL_TEMPLATES: 'emailTemplates',
  PASSWORD_RESETS: 'passwordResets',
  SETTINGS: 'settings',
  INCENTIVES: 'incentives',
  TRAINING: 'training',
  PAYROLL: 'payroll',
} as const;

export type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS];

/* Legacy local export kept for type references (do not diverge). */
/* eslint-disable @typescript-eslint/no-unused-vars */
const __DO_NOT_USE_LOCAL_COLLECTIONS = {
  // 🎯 Core Business Entities (según colecciones.md)
  USERS: 'users',
  BUSINESSES: 'businesses', 
  DRIVERS: 'drivers',
  ORDERS: 'orders',

  // 📋 Applications & Requests
  DRIVER_APPLICATIONS: 'driverApplications',
  CREDIT_PURCHASE_REQUESTS: 'creditPurchaseRequests',
  
  // 💰 Financial Operations
  WALLET_TRANSACTIONS: 'walletTransactions',
  CREDIT_TRANSACTIONS: 'creditTransactions',
  STRIPE_PAYMENTS: 'stripePayments',
  STRIPE_DISPUTES: 'stripeDisputes',
  DRIVER_PAYROLLS: 'payroll',
  CLASIFICACIONES_MENSUALES: 'clasificaciones_mensuales',
  DEBT_PAYMENTS: 'debtPayments',

  // 📊 Shipday Integration & ETL
  SHIPDAY_DRIVERS: 'shipdayDrivers',
  SHIPDAY_ORDERS: 'shipdayOrders',
  DRIVER_PERFORMANCE_METRICS: 'driverPerformanceMetrics',
  DRIVER_PAYMENT_TRACKING: 'driverPaymentTracking', 
  DRIVER_SHIFT_TRACKING: 'driverShiftTracking',

  // 📧 Communications
  NOTIFICATIONS: 'notifications',
  MAIL_QUEUE: 'mailQueue',
  VERIFICATION_CODES: 'verificationCodes',

  // 📄 Documents & Files
  DOCUMENTS: 'documents',
  IDSE_FILES: 'idseFiles',
  CFDI_RECORDS: 'cfdiRecords',

  // 🔍 System & Monitoring
  AUDIT_LOGS: 'auditLogs',
  SYSTEM_LOGS: 'systemLogs',
  SYSTEM_METRICS: 'metrics', // Corregido de 'systemMetrics' a 'metrics'
  ACTIVITY: 'activity',
  REPORTS: 'reports',
  SUPPORT_TICKETS: 'supportTickets',
  ROLES: 'roles', // Añadido
  EMAIL_TEMPLATES: 'emailTemplates', // Añadido
  PASSWORD_RESETS: 'passwordResets', // Añadido
  SETTINGS: 'settings', // Añadido
  INCENTIVES: 'incentives', // Añadido
  TRAINING: 'training', // Añadido
  PAYROLL: 'payroll', // Corregido de 'driver_payrolls' a 'payroll'
  SYSTEM_ALERTS: 'systemAlerts', // Añadido para alertas del sistema
} as const;

/**
 * Helper function to get collection reference with type safety
 */
export function getCollectionName(key: keyof typeof COLLECTIONS): string {
  return COLLECTIONS[key];
}

/**
 * 🚨 DEPRECATED COLLECTION NAMES - DO NOT USE
 * These are the old inconsistent names that caused data fragmentation
 */
export const DEPRECATED_COLLECTIONS = {
  // ❌ Old UPPERCASE names that caused inconsistencies
  BUSINESS: 'BUSINESS',           // → Use COLLECTIONS.BUSINESSES
  DRIVER: 'DRIVERS',              // → Use COLLECTIONS.DRIVERS  
  ORDERS_OLD: 'ORDERS',           // → Use COLLECTIONS.ORDERS
  DRIVER_APPLICATIONS_OLD: 'DRIVER_APPLICATIONS', // → Use COLLECTIONS.DRIVER_APPLICATIONS
  
  // ❌ Other inconsistent variations found in codebase
  EMAIL_QUEUE: 'emailQueue',      // → Use COLLECTIONS.MAIL_QUEUE
  DRIVERS_PAYROLL: 'driversPayroll', // → Use COLLECTIONS.PAYROLL
} as const;

/**
 * 📋 MIGRATION MAP - Old to New Collection Names
 */
export const MIGRATION_MAP = {
  'BUSINESS': COLLECTIONS.BUSINESSES,
  'DRIVERS': COLLECTIONS.DRIVERS,
  'ORDERS': COLLECTIONS.ORDERS,
  'DRIVER_APPLICATIONS': COLLECTIONS.DRIVER_APPLICATIONS,
  'emailQueue': COLLECTIONS.MAIL_QUEUE,
  'driversPayroll': COLLECTIONS.PAYROLL,
} as const;

/**
 * 🎯 USAGE EXAMPLE:
 * 
 * ✅ CORRECT:
 * import { COLLECTIONS } from '@/lib/collections';
 * collection(db, COLLECTIONS.BUSINESSES)
 * 
 * ❌ INCORRECT:
 * collection(db, COLLECTIONS.BUSINESSES)
 * collection(db, 'businesses') 
 */

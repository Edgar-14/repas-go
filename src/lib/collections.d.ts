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
export declare const COLLECTIONS: {
    readonly USERS: "users";
    readonly BUSINESSES: "businesses";
    readonly DRIVERS: "drivers";
    readonly ORDERS: "orders";
    readonly DRIVER_APPLICATIONS: "driverApplications";
    readonly CREDIT_PURCHASE_REQUESTS: "creditPurchaseRequests";
    readonly WALLET_TRANSACTIONS: "walletTransactions";
    readonly CREDIT_TRANSACTIONS: "creditTransactions";
    readonly STRIPE_PAYMENTS: "stripePayments";
    readonly STRIPE_DISPUTES: "stripeDisputes";
    readonly DRIVER_PAYROLLS: "payroll";
    readonly CLASIFICACIONES_MENSUALES: "clasificaciones_mensuales";
    readonly SHIPDAY_DRIVERS: "shipdayDrivers";
    readonly SHIPDAY_ORDERS: "shipdayOrders";
    readonly DRIVER_PERFORMANCE_METRICS: "driverPerformanceMetrics";
    readonly DRIVER_PAYMENT_TRACKING: "driverPaymentTracking";
    readonly DRIVER_SHIFT_TRACKING: "driverShiftTracking";
    readonly NOTIFICATIONS: "notifications";
    readonly MAIL_QUEUE: "mailQueue";
    readonly VERIFICATION_CODES: "verificationCodes";
    readonly DOCUMENTS: "documents";
    readonly IDSE_FILES: "idseFiles";
    readonly CFDI_RECORDS: "cfdiRecords";
    readonly AUDIT_LOGS: "auditLogs";
    readonly SYSTEM_LOGS: "systemLogs";
    readonly SYSTEM_METRICS: "metrics";
    readonly ACTIVITY: "activity";
    readonly REPORTS: "reports";
    readonly SUPPORT_TICKETS: "supportTickets";
    readonly ROLES: "roles";
    readonly EMAIL_TEMPLATES: "emailTemplates";
    readonly PASSWORD_RESETS: "passwordResets";
    readonly SETTINGS: "settings";
    readonly INCENTIVES: "incentives";
    readonly TRAINING: "training";
    readonly PAYROLL: "payroll";
};
/**
 * Type-safe collection names
 */
export type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS];
/**
 * Helper function to get collection reference with type safety
 */
export declare function getCollectionName(key: keyof typeof COLLECTIONS): string;
/**
 * 🚨 DEPRECATED COLLECTION NAMES - DO NOT USE
 * These are the old inconsistent names that caused data fragmentation
 */
export declare const DEPRECATED_COLLECTIONS: {
    readonly BUSINESS: "BUSINESS";
    readonly DRIVER: "DRIVERS";
    readonly ORDERS_OLD: "ORDERS";
    readonly DRIVER_APPLICATIONS_OLD: "DRIVER_APPLICATIONS";
    readonly EMAIL_QUEUE: "emailQueue";
    readonly DRIVERS_PAYROLL: "driversPayroll";
};
/**
 * 📋 MIGRATION MAP - Old to New Collection Names
 */
export declare const MIGRATION_MAP: {
    readonly BUSINESS: "businesses";
    readonly DRIVERS: "drivers";
    readonly ORDERS: "orders";
    readonly DRIVER_APPLICATIONS: "driverApplications";
    readonly emailQueue: "mailQueue";
    readonly driversPayroll: "payroll";
};
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
//# sourceMappingURL=collections.d.ts.map
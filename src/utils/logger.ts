/**
 * 🚨 UNIVERSAL LOGGING SYSTEM
 * Sistema centralizado para sustituir todos los console.log
 * Integra con auditLogs de Firestore y logger de Functions
 */

import { COLLECTIONS } from '@/lib/collections';

// Dynamic imports to avoid client/server conflicts
let db: any = null;
let addDoc: any = null;
let collection: any = null;

// Initialize Firebase only on client side
const initializeClientFirebase = async () => {
  if (typeof window !== 'undefined' && !db) {
    try {
      const { db: clientDb } = await import('@/lib/firebase');
      const { collection: clientCollection, addDoc: clientAddDoc } = await import('firebase/firestore');
      db = clientDb;
      addDoc = clientAddDoc;
      collection = clientCollection;
    } catch (error) {
      console.warn('Failed to load client Firebase for logging:', error);
    }
  }
};

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  action?: string;
  userId?: string;
  userEmail?: string;
  metadata?: any;
  timestamp: Date;
  source: 'CLIENT' | 'SERVER';
  component?: string;
  stackTrace?: string;
}

class UniversalLogger {
  private static instance: UniversalLogger;
  private isClient: boolean;

  private constructor() {
    this.isClient = typeof window !== 'undefined';
  }

  public static getInstance(): UniversalLogger {
    if (!UniversalLogger.instance) {
      UniversalLogger.instance = new UniversalLogger();
    }
    return UniversalLogger.instance;
  }

  private async saveToFirestore(entry: LogEntry) {
    try {
      // Solo en el cliente, guardar logs críticos en Firestore
      if (this.isClient && (entry.level === LogLevel.ERROR || entry.level === LogLevel.CRITICAL)) {
        await initializeClientFirebase();
        if (db && addDoc && collection) {
          await addDoc(collection(db, COLLECTIONS.SYSTEM_LOGS), {
            ...entry,
            timestamp: new Date(),
            source: 'CLIENT'
          });
        }
      }
    } catch (error) {
      // Fallback a console si falla Firestore
      console.error('Failed to save log to Firestore:', error);
    }
  }

  private formatMessage(level: LogLevel, message: string, component?: string): string {
    const timestamp = new Date().toISOString();
    const emoji = this.getLevelEmoji(level);
    const comp = component ? `[${component}]` : '';
    return `${emoji} ${timestamp} ${comp} ${message}`;
  }

  private getLevelEmoji(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG: return '🔍';
      case LogLevel.INFO: return 'ℹ️';
      case LogLevel.WARN: return '⚠️';
      case LogLevel.ERROR: return '❌';
      case LogLevel.CRITICAL: return '🚨';
      default: return '📝';
    }
  }

  public async log(
    level: LogLevel,
    message: string,
    action?: string,
    metadata?: any,
    component?: string,
    userId?: string,
    userEmail?: string
  ) {
    const entry: LogEntry = {
      level,
      message,
      action,
      userId,
      userEmail,
      metadata,
      timestamp: new Date(),
      source: this.isClient ? 'CLIENT' : 'SERVER',
      component,
      stackTrace: level === LogLevel.ERROR || level === LogLevel.CRITICAL ? new Error().stack : undefined
    };

    // Siempre log to console para desarrollo
    const formattedMessage = this.formatMessage(level, message, component);

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage, metadata);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage, metadata);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage, metadata);
        break;
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        console.error(formattedMessage, metadata);
        await this.saveToFirestore(entry);
        break;
    }
  }

  // Métodos de conveniencia
  public debug(message: string, metadata?: any, component?: string) {
    return this.log(LogLevel.DEBUG, message, undefined, metadata, component);
  }

  public info(message: string, action?: string, metadata?: any, component?: string) {
    return this.log(LogLevel.INFO, message, action, metadata, component);
  }

  public warn(message: string, action?: string, metadata?: any, component?: string) {
    return this.log(LogLevel.WARN, message, action, metadata, component);
  }

  public error(message: string, error?: Error | any, component?: string, userId?: string) {
    const metadata = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : error;

    return this.log(LogLevel.ERROR, message, 'ERROR_OCCURRED', metadata, component, userId);
  }

  public critical(message: string, error?: Error | any, component?: string, userId?: string) {
    const metadata = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : error;

    return this.log(LogLevel.CRITICAL, message, 'CRITICAL_ERROR', metadata, component, userId);
  }

  // Métodos específicos para operaciones de negocio
  public auditAction(action: string, userId?: string, userEmail?: string, metadata?: any, component?: string) {
    return this.log(LogLevel.INFO, `Action performed: ${action}`, action, metadata, component, userId, userEmail);
  }

  public trackUserAction(action: string, userId: string, userEmail?: string, metadata?: any, component?: string) {
    return this.log(LogLevel.INFO, `User action: ${action}`, action, metadata, component, userId, userEmail);
  }

  public trackBusinessOperation(operation: string, businessId?: string, metadata?: any) {
    return this.log(LogLevel.INFO, `Business operation: ${operation}`, operation, metadata, 'BUSINESS', businessId);
  }

  public trackDriverOperation(operation: string, driverId?: string, metadata?: any) {
    return this.log(LogLevel.INFO, `Driver operation: ${operation}`, operation, metadata, 'DRIVER', driverId);
  }

  public trackShipdayOperation(operation: string, orderId?: string, metadata?: any) {
    return this.log(LogLevel.INFO, `Shipday operation: ${operation}`, operation, metadata, 'SHIPDAY', undefined, undefined);
  }
}

// Exportar instancia singleton
export const logger = UniversalLogger.getInstance();

// Helpers para migración gradual desde console.log
export const logInfo = (message: string, metadata?: any, component?: string) => {
  logger.info(message, undefined, metadata, component);
};

export const logError = (message: string, error?: any, component?: string) => {
  logger.error(message, error, component);
};

export const logWarn = (message: string, metadata?: any, component?: string) => {
  logger.warn(message, undefined, metadata, component);
};

export const logDebug = (message: string, metadata?: any, component?: string) => {
  logger.debug(message, metadata, component);
};

// Para uso directo en reemplazo de console.log
export const befastLog = {
  log: (message: string, metadata?: any) => logger.info(message, undefined, metadata),
  info: (message: string, metadata?: any) => logger.info(message, undefined, metadata),
  warn: (message: string, metadata?: any) => logger.warn(message, undefined, metadata),
  error: (message: string, error?: any) => logger.error(message, error),
  debug: (message: string, metadata?: any) => logger.debug(message, metadata)
};

// Standardized enums and constants for BeFast Ecosystem
// This ensures consistency across the entire codebase

import {
  ORDER_STATUS_DEFINITIONS,
  SHIPDAY_EVENT_DEFINITIONS,
  OrderStatusKey
} from '../../shared/orderStatusDefinitions';

export const ORDER_STATUS = Object.freeze(
  ORDER_STATUS_DEFINITIONS.reduce<Record<OrderStatusKey, OrderStatusKey>>(
    (accumulator, definition) => {
      accumulator[definition.key] = definition.key;
      return accumulator;
    },
    {} as Record<OrderStatusKey, OrderStatusKey>
  )
);

export type OrderStatus = OrderStatusKey;

// Unified payment methods - no more CASH vs cash inconsistencies
export const PAYMENT_METHOD = {
  CASH: 'CASH',
  CARD: 'CARD',
  WALLET: 'WALLET',
  BANK_TRANSFER: 'BANK_TRANSFER',
  DIGITAL_WALLET: 'DIGITAL_WALLET'
} as const;

export type PaymentMethod = typeof PAYMENT_METHOD[keyof typeof PAYMENT_METHOD];

// User roles for the system
export const USER_ROLE = {
  ADMIN: 'ADMIN',
  BUSINESS: 'BUSINESS',
  DRIVER: 'DRIVER',
  CUSTOMER: 'CUSTOMER',
  SUPER_ADMIN: 'SUPER_ADMIN'
} as const;

export type UserRole = typeof USER_ROLE[keyof typeof USER_ROLE];

// Driver status constants
export const DRIVER_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
  PENDING: 'PENDING',
  ACTIVO_COTIZANDO: 'ACTIVO_COTIZANDO',
  ALTA_PROVISIONAL: 'ALTA_PROVISIONAL',
  BAJA: 'BAJA',
  PENDING_DOCUMENTS: 'PENDING_DOCUMENTS',
  BLOCKED: 'BLOCKED'
} as const;

export type DriverStatus = typeof DRIVER_STATUS[keyof typeof DRIVER_STATUS];

// Financial constants
export const FINANCIAL_CONSTANTS = {
  AUTO_LIQUIDATE_DEBTS: true,
  DEFAULT_DRIVER_COMMISSION: 0.15, // 15%
  DEFAULT_DEBT_LIMIT: 500,
  MINIMUM_WALLET_BALANCE: 0,
  MAXIMUM_WALLET_BALANCE: 10000,
  TRANSACTION_FEE: 0.029, // 2.9%
  IVA_RATE: 0.16 // 16%
} as const;

export type FinancialConstants = typeof FINANCIAL_CONSTANTS[keyof typeof FINANCIAL_CONSTANTS];

// IMSS status constants
export const IMSS_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  PENDING: 'PENDING',
  PROVISIONAL: 'PROVISIONAL',
  SUSPENDED: 'SUSPENDED',
  CANCELLED: 'CANCELLED'
} as const;

export type ImssStatus = typeof IMSS_STATUS[keyof typeof IMSS_STATUS];

// Shipday status mapping to Spanish for client display
export const SHIPDAY_STATUS_TO_SPANISH = ORDER_STATUS_DEFINITIONS.reduce<Record<string, string>>(
  (accumulator, definition) => {
    accumulator[definition.key] = definition.spanishLabel;
    if (definition.shipdayStatus) {
      accumulator[definition.shipdayStatus] = definition.spanishLabel;
    }
    return accumulator;
  },
  {}
);

// Shipday events to Spanish status mapping
export const SHIPDAY_EVENT_TO_SPANISH = SHIPDAY_EVENT_DEFINITIONS.reduce<Record<string, string>>(
  (accumulator, definition) => {
    accumulator[definition.event] = definition.spanishLabel;
    return accumulator;
  },
  {}
);

// Helper function to get Spanish status
export const getSpanishStatus = (status: string): string => {
  return SHIPDAY_STATUS_TO_SPANISH[status as keyof typeof SHIPDAY_STATUS_TO_SPANISH] || status;
};

// Helper function to get Spanish status from event
export const getSpanishStatusFromEvent = (event: string): string => {
  return SHIPDAY_EVENT_TO_SPANISH[event as keyof typeof SHIPDAY_EVENT_TO_SPANISH] || event;
};

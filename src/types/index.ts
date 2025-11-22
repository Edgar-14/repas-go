/**
 * @fileoverview Punto de entrada central para todos los tipos canónicos de BeFast.
 * ÚNICA FUENTE DE VERDAD - Todos los archivos deben importar tipos desde aquí.
 * 
 * Estructura:
 * - Order: Tipos relacionados con pedidos (src/lib/types/Order.ts)
 * - Driver: Tipos relacionados con repartidores (src/lib/types/Driver.ts)
 * - Business: Tipos relacionados con negocios (src/types/business.ts)
 * - Wallet: Tipos relacionados con billetera y transacciones (src/types/wallet.ts)
 */

// --- TIPOS DE PEDIDOS (ORDER) ---
export * from '../lib/types/Order';

// --- TIPOS DE REPARTIDORES (DRIVER) ---
export * from '../lib/types/Driver';

// --- TIPOS DE NEGOCIOS (BUSINESS) ---
export * from './business';

// --- TIPOS DE BILLETERA Y TRANSACCIONES (WALLET) ---
export * from './wallet';

// --- TIPOS DE AUDITORÍA ---
export * from './audit';

// --- CONSTANTES Y ENUMS ---
// Note: Only export constants/types from '../constants/enums' that do NOT have the same name as any export from '../lib/types/Order'.
// Before adding new exports here, check '../lib/types/Order' for naming conflicts to avoid accidental overwrites or type collisions.
export {
  ORDER_STATUS,
  PAYMENT_METHOD,
  USER_ROLE,
  DRIVER_STATUS,
  FINANCIAL_CONSTANTS,
  IMSS_STATUS,
  SHIPDAY_STATUS_TO_SPANISH,
  SHIPDAY_EVENT_TO_SPANISH,
  getSpanishStatus,
  getSpanishStatusFromEvent,
  type UserRole,
  type DriverStatus,
  type FinancialConstants,
  type ImssStatus
} from '../constants/enums';

export * from '../constants/business';

// --- DEFINICIONES DE ESTADOS (SHARED) ---
export type { OrderStatusDefinition, OrderStatusKey } from '../../shared/orderStatusDefinitions';
export { ORDER_STATUS_DEFINITIONS, SHIPDAY_EVENT_DEFINITIONS } from '../../shared/orderStatusDefinitions';

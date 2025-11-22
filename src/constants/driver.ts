// src/constants/driver.ts
// Updated to use standardized enums

import { DRIVER_STATUS, FINANCIAL_CONSTANTS, IMSS_STATUS } from './enums';

export const DRIVER_STATES = [
  DRIVER_STATUS.ACTIVE,
  DRIVER_STATUS.ACTIVO_COTIZANDO,
  DRIVER_STATUS.ALTA_PROVISIONAL,
  // Add other states as needed
] as const;

export const BILLETERA_ACTIVE = [
  DRIVER_STATUS.ACTIVE,
  DRIVER_STATUS.ACTIVO_COTIZANDO,
  DRIVER_STATUS.ALTA_PROVISIONAL
] as const;

export const CAN_GENERATE_CFDI = [
  DRIVER_STATUS.ACTIVO_COTIZANDO,
  DRIVER_STATUS.ACTIVE
] as const;

export const REQUIRES_IMSS = [
  DRIVER_STATUS.ACTIVO_COTIZANDO,
  DRIVER_STATUS.ACTIVE
] as const;

export const VALID_FOR_WORK = [
  DRIVER_STATUS.ACTIVE,
  DRIVER_STATUS.ACTIVO_COTIZANDO,
  DRIVER_STATUS.ALTA_PROVISIONAL
] as const;

// Use standardized financial constants
export const FINANCIAL = {
  autoLiquidateDebts: FINANCIAL_CONSTANTS.AUTO_LIQUIDATE_DEBTS,
  baseCommission: FINANCIAL_CONSTANTS.DEFAULT_DRIVER_COMMISSION,
  driverDebtLimit: FINANCIAL_CONSTANTS.DEFAULT_DEBT_LIMIT
} as const;

export const IMSS = {
  provisionalPeriodDays: 30,
  salarioBaseIMSS: 141.7,
  umaDaily: 108.57
} as const;

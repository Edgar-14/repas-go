/**
 * @fileoverview Definiciones canónicas para Wallet y transacciones financieras.
 * ÚNICA FUENTE DE VERDAD para el sistema de billetera BeFast.
 */

import { Timestamp } from 'firebase/firestore';

/**
 * Tipos de transacciones de la billetera del repartidor
 */
export const WALLET_TRANSACTION_TYPES = {
  // Adeudos por pedidos en efectivo (repartidor debe a BeFast)
  CASH_ORDER_DEBT: 'CASH_ORDER_ADEUDO',
  
  // Transferencias por pedidos con tarjeta (BeFast transfiere al repartidor)
  CARD_ORDER_TRANSFER: 'CARD_ORDER_TRANSFER',
  
  // Transferencias de propinas con tarjeta
  TIP_CARD_TRANSFER: 'TIP_CARD_TRANSFER',
  
  // Pagos de deuda del repartidor
  DEBT_PAYMENT: 'DEBT_PAYMENT',
  
  // Transferencias de beneficios
  BENEFITS_TRANSFER: 'BENEFITS_TRANSFER',
  
  // Comisiones de Market
  MARKET_COMMISSION: 'MARKET_COMMISSION',
  
  // Bonos por distancia
  DISTANCE_BONUS: 'DISTANCE_BONUS',
  
  // Bonos por tiempo
  TIME_BONUS: 'TIME_BONUS',
  
  // Retiros
  WITHDRAWAL: 'WITHDRAWAL',
  
  // Ajustes manuales
  MANUAL_ADJUSTMENT: 'MANUAL_ADJUSTMENT',
} as const;

export type WalletTransactionType = typeof WALLET_TRANSACTION_TYPES[keyof typeof WALLET_TRANSACTION_TYPES];

/**
 * Interfaz canónica de WalletTransaction - ÚNICA FUENTE DE VERDAD
 */
export interface WalletTransaction {
  // --- Identificadores ---
  id: string;
  driverId: string;
  orderId?: string;
  
  // --- Información de la Transacción ---
  type: WalletTransactionType;
  amount: number; // Positivo = ingreso, Negativo = egreso/deuda
  description: string;
  
  // --- Balances ---
  previousBalance: number;
  newBalance: number;
  
  // --- Timestamps ---
  createdAt: Timestamp | Date | any;
  processedAt?: Timestamp | Date | any;
  
  // --- Metadatos adicionales ---
  metadata?: {
    paymentMethod?: string;
    orderNumber?: string;
    businessId?: string;
    proofUrl?: string;
    processedBy?: string;
    notes?: string;
    [key: string]: any;
  };
}

/**
 * Resumen de la billetera del repartidor
 */
export interface WalletSummary {
  currentBalance: number;
  pendingDebts: number;
  totalEarnings: number;
  weeklyEarnings: number;
  monthlyEarnings: number;
  lastTransactionDate?: Date;
}

/**
 * Datos para actualizar la billetera
 */
export interface WalletUpdateData {
  driverId: string;
  amount: number;
  type: WalletTransactionType;
  orderId?: string;
  description: string;
  metadata?: Record<string, any>;
}

/**
 * Solicitud de pago de deuda
 */
export interface DebtPaymentRequest {
  id: string;
  driverId: string;
  driverName: string;
  amountPaid: number;
  proofUrl: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestDate: Timestamp | Date | any;
  processedAt?: Timestamp | Date | any;
  processedBy?: string;
  rejectionReason?: string;
}

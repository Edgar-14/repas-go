// Tipos de transacciones
export enum TransactionType {
  CARD_ORDER_TRANSFER = 'CARD_ORDER_TRANSFER',
  CASH_ORDER_ADEUDO = 'CASH_ORDER_ADEUDO',
  TIP_CARD_TRANSFER = 'TIP_CARD_TRANSFER',
  DEBT_PAYMENT = 'DEBT_PAYMENT',
  BENEFITS_TRANSFER = 'BENEFITS_TRANSFER',
  ADJUSTMENT = 'ADJUSTMENT',
  PENALTY = 'PENALTY',
  BONUS = 'BONUS'
}
export interface WalletTransactionDocument {
  driverId: string;
  orderId?: string;
  type: TransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  notes?: string;
  metadata?: { paymentMethod?: string; orderNumber?: string; businessName?: string };
  timestamp: any;
  processedAt: any;
}


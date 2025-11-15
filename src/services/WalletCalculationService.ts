/**
 * WalletCalculationService.ts
 * 
 * Servicio para cálculos financieros precisos de la billetera del conductor.
 * 
 * REGLAS FINANCIERAS:
 * - CARD: Conductor recibe totalAmount - commission (BeFast toma commission)
 * - CASH: Conductor debe $15 por pedido (delivery fee)
 * - Propinas siempre van 100% al conductor
 * - Deuda máxima: $500 (configurable)
 * - Si excede deuda, se bloquea aceptación de pedidos CASH
 */

import { firestore } from '../config/firebase';
import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

export interface OrderPricing {
  totalAmount: number;
  deliveryFee: number;
  tip: number;
  discount: number;
  subtotal: number;
}

export interface EarningsCalculation {
  orderId: string;
  paymentMethod: 'CARD' | 'CASH';
  
  // Montos del pedido
  totalAmount: number;
  deliveryFee: number;
  tip: number;
  
  // Cálculos
  befastCommission: number;
  driverEarnings: number; // Lo que gana el conductor
  driverDebt: number; // Lo que debe (si CASH)
  
  // Resultado
  netAmount: number; // Earnings - Debt
  transferAmount: number; // Lo que se transfiere a wallet
}

export interface WalletBalance {
  available: number; // Dinero disponible para retiro
  pending: number; // Pendiente de liquidación
  debt: number; // Deuda total de efectivo
  total: number; // available - debt
}

export interface DebtStatus {
  currentDebt: number;
  maxDebt: number;
  canAcceptCash: boolean;
  blockedReason?: string;
}

class WalletCalculationService {
  // Configuración financiera
  private readonly BEFAST_COMMISSION_RATE = 0.15; // 15% commission
  private readonly CASH_DELIVERY_FEE = 15; // $15 por pedido en efectivo
  private readonly MAX_DEBT = 500; // Límite de deuda en efectivo
  private readonly MIN_WITHDRAWAL = 100; // Mínimo para retirar
  
  /**
   * Calcula las ganancias de un pedido según el método de pago
   */
  calculateOrderEarnings(
    orderId: string,
    paymentMethod: 'CARD' | 'CASH',
    pricing: OrderPricing
  ): EarningsCalculation {
    const { totalAmount, deliveryFee, tip } = pricing;
    
    if (paymentMethod === 'CARD') {
      // CARD: BeFast toma commission, conductor recibe el resto + propina
      const befastCommission = totalAmount * this.BEFAST_COMMISSION_RATE;
      const driverEarnings = totalAmount - befastCommission + tip;
      
      return {
        orderId,
        paymentMethod,
        totalAmount,
        deliveryFee,
        tip,
        befastCommission,
        driverEarnings,
        driverDebt: 0,
        netAmount: driverEarnings,
        transferAmount: driverEarnings, // Se transfiere inmediatamente
      };
    } else {
      // CASH: Conductor tiene el dinero, pero debe delivery fee a BeFast
      const driverEarnings = totalAmount + tip; // Tiene todo el efectivo
      const driverDebt = this.CASH_DELIVERY_FEE; // Debe $15
      const befastCommission = 0; // BeFast cobra via delivery fee
      const netAmount = driverEarnings - driverDebt;
      
      return {
        orderId,
        paymentMethod,
        totalAmount,
        deliveryFee: this.CASH_DELIVERY_FEE,
        tip,
        befastCommission,
        driverEarnings,
        driverDebt,
        netAmount,
        transferAmount: 0, // No se transfiere (conductor tiene el efectivo)
      };
    }
  }
  
  /**
   * Aplica las ganancias/deuda a la billetera del conductor
   */
  async applyEarnings(
    driverId: string,
    calculation: EarningsCalculation
  ): Promise<void> {
    try {
      const driverRef = firestore().collection('drivers').doc(driverId);
      
      // Crear transacción en Firestore
      const transaction: any = {
        orderId: calculation.orderId,
        type: calculation.paymentMethod === 'CARD' ? 'EARNINGS' : 'CASH_DEBT',
        amount: calculation.netAmount,
        paymentMethod: calculation.paymentMethod,
        details: {
          totalAmount: calculation.totalAmount,
          tip: calculation.tip,
          commission: calculation.befastCommission,
          debt: calculation.driverDebt,
        },
        createdAt: firestore.FieldValue.serverTimestamp(),
        status: 'COMPLETED',
      };
      
      // Guardar transacción
      await firestore()
        .collection('walletTransactions')
        .add(transaction);
      
      // Actualizar balance del conductor
      if (calculation.paymentMethod === 'CARD') {
        // Incrementar saldo disponible
        await driverRef.update({
          'wallet.available': firestore.FieldValue.increment(calculation.transferAmount),
          'wallet.lastUpdated': firestore.FieldValue.serverTimestamp(),
        });
      } else {
        // Incrementar deuda
        await driverRef.update({
          'wallet.debt': firestore.FieldValue.increment(calculation.driverDebt),
          'wallet.lastUpdated': firestore.FieldValue.serverTimestamp(),
        });
      }
      
      console.log(`[WalletService] Applied earnings for order ${calculation.orderId}`);
    } catch (error) {
      console.error('[WalletService] Error applying earnings:', error);
      throw error;
    }
  }
  
  /**
   * Obtiene el balance actual de la billetera
   */
  async getWalletBalance(driverId: string): Promise<WalletBalance> {
    try {
      const driverDoc = await firestore()
        .collection('drivers')
        .doc(driverId)
        .get();
      
      if (!driverDoc.exists) {
        throw new Error('Driver not found');
      }
      
      const wallet = driverDoc.data()?.wallet || {};
      
      const balance: WalletBalance = {
        available: wallet.available || 0,
        pending: wallet.pending || 0,
        debt: wallet.debt || 0,
        total: (wallet.available || 0) - (wallet.debt || 0),
      };
      
      return balance;
    } catch (error) {
      console.error('[WalletService] Error getting balance:', error);
      throw error;
    }
  }
  
  /**
   * Verifica el estado de deuda y si puede aceptar pedidos CASH
   */
  async checkDebtStatus(driverId: string): Promise<DebtStatus> {
    try {
      const balance = await this.getWalletBalance(driverId);
      
      const status: DebtStatus = {
        currentDebt: balance.debt,
        maxDebt: this.MAX_DEBT,
        canAcceptCash: balance.debt < this.MAX_DEBT,
      };
      
      if (!status.canAcceptCash) {
        status.blockedReason = `Has alcanzado el límite de deuda ($${this.MAX_DEBT}). ` +
          `Por favor, liquida tu deuda actual de $${balance.debt} para poder aceptar más pedidos en efectivo.`;
      }
      
      return status;
    } catch (error) {
      console.error('[WalletService] Error checking debt status:', error);
      throw error;
    }
  }
  
  /**
   * Procesa un pago manual (transferencia) para liquidar deuda
   */
  async processManualPayment(
    driverId: string,
    amount: number,
    reference: string,
    receiptUrl?: string
  ): Promise<void> {
    try {
      // Crear registro de pago pendiente
      const paymentDoc = await firestore()
        .collection('manualPayments')
        .add({
          driverId,
          amount,
          reference,
          receiptUrl,
          status: 'PENDING',
          createdAt: firestore.FieldValue.serverTimestamp(),
          type: 'DEBT_PAYMENT',
        });
      
      // Crear transacción en wallet (pendiente)
      await firestore()
        .collection('walletTransactions')
        .add({
          driverId,
          type: 'DEBT_PAYMENT',
          amount,
          status: 'PENDING',
          reference: paymentDoc.id,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
      
      console.log(`[WalletService] Manual payment registered: ${paymentDoc.id}`);
    } catch (error) {
      console.error('[WalletService] Error processing manual payment:', error);
      throw error;
    }
  }
  
  /**
   * Aprueba un pago manual (solo admins)
   */
  async approveManualPayment(paymentId: string): Promise<void> {
    try {
      const paymentDoc = await firestore()
        .collection('manualPayments')
        .doc(paymentId)
        .get();
      
      if (!paymentDoc.exists) {
        throw new Error('Payment not found');
      }
      
      const payment = paymentDoc.data();
      if (!payment) return;
      
      // Actualizar deuda del conductor
      await firestore()
        .collection('drivers')
        .doc(payment.driverId)
        .update({
          'wallet.debt': firestore.FieldValue.increment(-payment.amount),
          'wallet.lastUpdated': firestore.FieldValue.serverTimestamp(),
        });
      
      // Actualizar estado del pago
      await paymentDoc.ref.update({
        status: 'APPROVED',
        approvedAt: firestore.FieldValue.serverTimestamp(),
      });
      
      // Actualizar transacción
      const transactionsQuery = await firestore()
        .collection('walletTransactions')
        .where('reference', '==', paymentId)
        .where('type', '==', 'DEBT_PAYMENT')
        .get();
      
      transactionsQuery.forEach(async (doc) => {
        await doc.ref.update({
          status: 'COMPLETED',
          completedAt: firestore.FieldValue.serverTimestamp(),
        });
      });
      
      console.log(`[WalletService] Payment approved: ${paymentId}`);
    } catch (error) {
      console.error('[WalletService] Error approving payment:', error);
      throw error;
    }
  }
  
  /**
   * Obtiene el historial de transacciones
   */
  async getTransactionHistory(
    driverId: string,
    limit: number = 50
  ): Promise<any[]> {
    try {
      const snapshot = await firestore()
        .collection('walletTransactions')
        .where('driverId', '==', driverId)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('[WalletService] Error getting transaction history:', error);
      return [];
    }
  }
  
  /**
   * Calcula earnings proyectados para un pedido (antes de aceptarlo)
   */
  calculateProjectedEarnings(
    paymentMethod: 'CARD' | 'CASH',
    totalAmount: number,
    tip: number = 0
  ): { earnings: number; debt: number; net: number } {
    if (paymentMethod === 'CARD') {
      const commission = totalAmount * this.BEFAST_COMMISSION_RATE;
      const earnings = totalAmount - commission + tip;
      return {
        earnings,
        debt: 0,
        net: earnings,
      };
    } else {
      return {
        earnings: totalAmount + tip,
        debt: this.CASH_DELIVERY_FEE,
        net: totalAmount + tip - this.CASH_DELIVERY_FEE,
      };
    }
  }
  
  /**
   * Verifica si el conductor puede realizar un retiro
   */
  async canWithdraw(driverId: string, amount: number): Promise<{ can: boolean; reason?: string }> {
    try {
      const balance = await this.getWalletBalance(driverId);
      
      if (amount < this.MIN_WITHDRAWAL) {
        return {
          can: false,
          reason: `El monto mínimo de retiro es $${this.MIN_WITHDRAWAL}`,
        };
      }
      
      if (amount > balance.available) {
        return {
          can: false,
          reason: `No tienes suficiente saldo disponible ($${balance.available})`,
        };
      }
      
      if (balance.debt > 0) {
        return {
          can: false,
          reason: `Primero debes liquidar tu deuda de $${balance.debt}`,
        };
      }
      
      return { can: true };
    } catch (error) {
      return {
        can: false,
        reason: 'Error verificando saldo',
      };
    }
  }
}

export default new WalletCalculationService();

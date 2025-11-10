// Servicio de Billetera Digital para BeFast GO
import { firestore, functions, COLLECTIONS, CLOUD_FUNCTIONS } from '../config/firebase';
import PricingService from './PricingService';

/**
 * Tipos de transacciones según documento oficial
 */
export enum TransactionType {
  CASH_ORDER_ADEUDO = 'CASH_ORDER_ADEUDO',           // Deuda por pedido en efectivo
  CARD_ORDER_TRANSFER = 'CARD_ORDER_TRANSFER',       // Ganancia por pedido con tarjeta
  TIP_CARD_TRANSFER = 'TIP_CARD_TRANSFER',           // Propina de pedido con tarjeta (100% al conductor)
  DEBT_PAYMENT = 'DEBT_PAYMENT',                     // Pago manual de deuda
  BENEFITS_TRANSFER = 'BENEFITS_TRANSFER',           // Prestaciones IMSS mensuales
  ADJUSTMENT = 'ADJUSTMENT',                         // Ajuste manual
  PENALTY = 'PENALTY',                               // Penalización
  BONUS = 'BONUS'                                    // Bonificación
}

/**
 * Información bancaria oficial de BeFast
 */
const BEFAST_BANK_INFO = {
  bank: 'BBVA MÉXICO',
  accountNumber: '0123456789',
  clabe: '012345678901234567',
  beneficiary: 'Rosio Arisema Uribe Macias'
};

/**
 * Servicio de gestión de billetera digital
 * Implementa toda la lógica financiera del sistema BeFast
 */
class WalletService {
  /**
   * Procesa la transacción financiera de un pedido completado
   * Lógica CORRECTA según documento:
   * - Tarjeta: REGISTRA movimiento en billetera (Total - 15 MXN) + 100% propina - deuda automática
   *   Si tiene deuda, se descuenta del monto a registrar
   *   NO SE TRANSFIERE AL MOMENTO - solo se registra el movimiento
   * - Efectivo: REGISTRA deuda de 15 MXN (conductor ya tiene el efectivo)
   *   NO SE TRANSFIERE NADA - solo se registra el movimiento
   * 
   * IMPORTANTE: Las transferencias bancarias ocurren en días específicos de pago,
   * NO al momento de completar el pedido. Aquí solo se REGISTRAN los movimientos.
   */
  async processOrderCompletion(
    orderId: string,
    driverId: string,
    orderTotal: number,
    tipAmount: number,
    paymentMethod: 'CASH' | 'CARD'
  ): Promise<{
    success: boolean;
    transactions: any[];
    newBalance: number;
    newDebt: number;
    debtDeducted: number;
    finalTransferAmount: number;
    auditResult: 'MATCH' | 'MISMATCH';
    message?: string;
  }> {
    try {
      // Obtener deuda actual del conductor
      const driverDoc = await firestore()
        .collection(COLLECTIONS.DRIVERS)
        .doc(driverId)
        .get();
      
      const currentDebt = driverDoc.data()?.wallet?.pendingDebts || 0;

      // Calcular ganancias del conductor
      const earnings = PricingService.calculateDriverEarnings(
        orderTotal,
        tipAmount,
        paymentMethod
      );

      // Llamar a Cloud Function con auditoría "Doble Contador" (Vertex AI)
      const result = await functions().httpsCallable(CLOUD_FUNCTIONS.PROCESS_ORDER_COMPLETION)({
        orderId,
        driverId,
        orderTotal,
        tipAmount,
        paymentMethod,
        earnings,
        currentDebt,
        timestamp: new Date().toISOString()
      });

      const data = result.data as any;

      // Verificar que la auditoría de Vertex AI coincida
      if (data.auditResult !== 'MATCH') {
        console.error('Audit mismatch detected:', data);
        return {
          success: false,
          transactions: [],
          newBalance: 0,
          newDebt: 0,
          debtDeducted: 0,
          finalTransferAmount: 0,
          auditResult: 'MISMATCH',
          message: 'Auditoría de transacción falló. Contacta a soporte.'
        };
      }

      return {
        success: true,
        transactions: data.transactions || [],
        newBalance: data.newBalance || 0,
        newDebt: data.newDebt || 0,
        debtDeducted: data.debtDeducted || 0,
        finalTransferAmount: data.finalTransferAmount || 0,
        auditResult: 'MATCH',
        message: 'Transacción procesada exitosamente'
      };
    } catch (error: any) {
      console.error('Error processing order completion:', error);
      throw new Error(error.message || 'Error al procesar transacción');
    }
  }

  /**
   * Registra una transacción en walletTransactions
   * Todas las transacciones deben pasar por aquí
   */
  async recordTransaction(
    driverId: string,
    type: TransactionType,
    amount: number,
    description: string,
    orderId?: string,
    metadata?: any
  ): Promise<string> {
    try {
      const transactionRef = await firestore()
        .collection(COLLECTIONS.WALLET_TRANSACTIONS)
        .add({
          driverId,
          type,
          amount,
          description,
          orderId: orderId || null,
          metadata: metadata || {},
          timestamp: firestore.FieldValue.serverTimestamp(),
          status: 'COMPLETED',
          createdAt: firestore.FieldValue.serverTimestamp()
        });

      return transactionRef.id;
    } catch (error) {
      console.error('Error recording transaction:', error);
      throw error;
    }
  }

  /**
   * Actualiza el saldo y deuda del conductor en Firestore
   */
  async updateDriverWallet(
    driverId: string,
    balanceChange: number,
    debtChange: number
  ): Promise<void> {
    try {
      const driverRef = firestore().collection(COLLECTIONS.DRIVERS).doc(driverId);

      await driverRef.update({
        'wallet.balance': firestore.FieldValue.increment(balanceChange),
        'wallet.pendingDebts': firestore.FieldValue.increment(debtChange),
        'wallet.lastUpdated': firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating driver wallet:', error);
      throw error;
    }
  }

  /**
   * Aplica recuperación automática de deuda
   * Regla: SI walletBalance > 0 Y pendingDebts > 0 ENTONCES walletBalance -= pendingDebts Y pendingDebts = 0
   */
  async applyAutoDebtRecovery(driverId: string): Promise<{
    applied: boolean;
    amountRecovered: number;
    newBalance: number;
    newDebt: number;
  }> {
    try {
      const driverDoc = await firestore()
        .collection(COLLECTIONS.DRIVERS)
        .doc(driverId)
        .get();

      const data = driverDoc.data();
      const currentBalance = data?.wallet?.balance || 0;
      const currentDebt = data?.wallet?.pendingDebts || 0;

      if (currentBalance > 0 && currentDebt > 0) {
        const amountToRecover = Math.min(currentBalance, currentDebt);
        const newBalance = currentBalance - amountToRecover;
        const newDebt = currentDebt - amountToRecover;

        // Actualizar wallet
        await this.updateDriverWallet(driverId, -amountToRecover, -amountToRecover);

        // Registrar transacción
        await this.recordTransaction(
          driverId,
          TransactionType.DEBT_PAYMENT,
          amountToRecover,
          'Recuperación automática de deuda',
          undefined,
          { auto: true }
        );

        return {
          applied: true,
          amountRecovered: amountToRecover,
          newBalance,
          newDebt
        };
      }

      return {
        applied: false,
        amountRecovered: 0,
        newBalance: currentBalance,
        newDebt: currentDebt
      };
    } catch (error) {
      console.error('Error applying auto debt recovery:', error);
      throw error;
    }
  }

  /**
   * Verifica si el conductor puede recibir pedidos en efectivo
   * Regla de bloqueo: SI pendingDebts >= driverDebtLimit ENTONCES bloquear_asignacion_pedidos_efectivo
   */
  async canAcceptCashOrders(driverId: string): Promise<{
    canAccept: boolean;
    currentDebt: number;
    debtLimit: number;
    reason?: string;
  }> {
    try {
      const driverDoc = await firestore()
        .collection(COLLECTIONS.DRIVERS)
        .doc(driverId)
        .get();

      const data = driverDoc.data();
      const currentDebt = data?.wallet?.pendingDebts || 0;
      const debtLimit = data?.wallet?.creditLimit || 300; // Default: 300 MXN

      const canAccept = currentDebt < debtLimit;

      return {
        canAccept,
        currentDebt,
        debtLimit,
        reason: canAccept 
          ? undefined 
          : `Deuda actual ($${currentDebt}) excede o iguala el límite ($${debtLimit})`
      };
    } catch (error) {
      console.error('Error checking cash orders eligibility:', error);
      return {
        canAccept: false,
        currentDebt: 0,
        debtLimit: 300,
        reason: 'Error al verificar elegibilidad'
      };
    }
  }

  /**
   * Solicita un retiro de saldo
   * Llama a Cloud Function para procesar retiro
   */
  async requestWithdrawal(
    driverId: string,
    amount: number,
    bankAccount: {
      clabe: string;
      bankName: string;
      accountHolder: string;
    }
  ): Promise<{
    success: boolean;
    withdrawalId?: string;
    message: string;
  }> {
    try {
      // Validar saldo disponible
      const driverDoc = await firestore()
        .collection(COLLECTIONS.DRIVERS)
        .doc(driverId)
        .get();

      const currentBalance = driverDoc.data()?.wallet?.balance || 0;

      if (amount > currentBalance) {
        return {
          success: false,
          message: `Saldo insuficiente. Disponible: $${currentBalance}`
        };
      }

      if (amount < 100) {
        return {
          success: false,
          message: 'El monto mínimo de retiro es $100 MXN'
        };
      }

      // Llamar Cloud Function para procesar retiro
      const result = await functions().httpsCallable(CLOUD_FUNCTIONS.PROCESS_WITHDRAWAL)({
        driverId,
        amount,
        bankAccount,
        timestamp: new Date().toISOString()
      });

      const data = result.data as any;

      if (data.success) {
        return {
          success: true,
          withdrawalId: data.withdrawalId,
          message: 'Solicitud de retiro procesada. Recibirás tu pago en 1-2 días hábiles.'
        };
      } else {
        return {
          success: false,
          message: data.message || 'Error al procesar retiro'
        };
      }
    } catch (error: any) {
      console.error('Error requesting withdrawal:', error);
      return {
        success: false,
        message: error.message || 'Error al solicitar retiro'
      };
    }
  }

  /**
   * Procesa un pago manual de deuda
   * El conductor paga su deuda en efectivo o transferencia
   */
  async processDebtPayment(
    driverId: string,
    amount: number,
    paymentMethod: 'CASH' | 'TRANSFER',
    receiptUrl?: string
  ): Promise<{
    success: boolean;
    newDebt: number;
    message: string;
  }> {
    try {
      // Validar monto
      if (amount <= 0) {
        return {
          success: false,
          newDebt: 0,
          message: 'Monto inválido'
        };
      }

      // Llamar Cloud Function para procesar pago
      const result = await functions().httpsCallable(CLOUD_FUNCTIONS.PROCESS_DEBT_PAYMENT)({
        driverId,
        amount,
        paymentMethod,
        receiptUrl,
        timestamp: new Date().toISOString()
      });

      const data = result.data as any;

      if (data.success) {
        return {
          success: true,
          newDebt: data.newDebt || 0,
          message: 'Pago procesado exitosamente'
        };
      } else {
        return {
          success: false,
          newDebt: 0,
          message: data.message || 'Error al procesar pago'
        };
      }
    } catch (error: any) {
      console.error('Error processing debt payment:', error);
      return {
        success: false,
        newDebt: 0,
        message: error.message || 'Error al procesar pago'
      };
    }
  }

  /**
   * Obtiene el historial de transacciones del conductor
   */
  async getTransactionHistory(
    driverId: string,
    limit: number = 50
  ): Promise<any[]> {
    try {
      const snapshot = await firestore()
        .collection(COLLECTIONS.WALLET_TRANSACTIONS)
        .where('driverId', '==', driverId)
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting transaction history:', error);
      return [];
    }
  }

  /**
   * Calcula las ganancias totales de un período
   */
  async calculatePeriodEarnings(
    driverId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalEarnings: number;
    cardOrders: number;
    tips: number;
    bonuses: number;
    penalties: number;
    netEarnings: number;
  }> {
    try {
      const snapshot = await firestore()
        .collection(COLLECTIONS.WALLET_TRANSACTIONS)
        .where('driverId', '==', driverId)
        .where('timestamp', '>=', startDate)
        .where('timestamp', '<=', endDate)
        .get();

      let cardOrders = 0;
      let tips = 0;
      let bonuses = 0;
      let penalties = 0;

      snapshot.forEach(doc => {
        const data = doc.data();
        const amount = data.amount || 0;

        switch (data.type) {
          case TransactionType.CARD_ORDER_TRANSFER:
            cardOrders += amount;
            break;
          case TransactionType.TIP_CARD_TRANSFER:
            tips += amount;
            break;
          case TransactionType.BONUS:
            bonuses += amount;
            break;
          case TransactionType.PENALTY:
            penalties += Math.abs(amount);
            break;
        }
      });

      const totalEarnings = cardOrders + tips + bonuses;
      const netEarnings = totalEarnings - penalties;

      return {
        totalEarnings,
        cardOrders,
        tips,
        bonuses,
        penalties,
        netEarnings
      };
    } catch (error) {
      console.error('Error calculating period earnings:', error);
      return {
        totalEarnings: 0,
        cardOrders: 0,
        tips: 0,
        bonuses: 0,
        penalties: 0,
        netEarnings: 0
      };
    }
  }

  /**
   * Obtiene información bancaria de BeFast
   */
  getBeFastBankInfo() {
    return { ...BEFAST_BANK_INFO };
  }
}

// Exportar instancia singleton
export default new WalletService();

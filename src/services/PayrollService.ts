// Servicio de Nómina y Clasificación Laboral para BeFast GO
import { firestore, functions, COLLECTIONS, CLOUD_FUNCTIONS } from '../config/firebase';
import PricingService from './PricingService';

/**
 * Estados de clasificación laboral del conductor
 */
export enum LaborClassification {
  PERSONA_TRABAJADORA_PLATAFORMA = 'PERSONA_TRABAJADORA_PLATAFORMA', // Primer mes
  EMPLEADO_COTIZANTE = 'EMPLEADO_COTIZANTE',                         // Ingreso > 8,364 MXN neto
  TRABAJADOR_INDEPENDIENTE = 'TRABAJADOR_INDEPENDIENTE'              // Ingreso < 8,364 MXN neto
}

/**
 * Servicio de gestión de nómina y clasificación laboral
 * Implementa los ciclos semanales y mensuales según documento oficial
 */
class PayrollService {
  private pricingService: PricingService;

  constructor() {
    this.pricingService = new PricingService();
  }

  /**
   * CICLO SEMANAL: Genera recibo de pago y lo timbra (CFDI)
   * Se ejecuta cada viernes para formalizar ganancias de la semana
   * IMPORTANTE: Solo GENERA el recibo y lo timbra.
   * Los movimientos ya están REGISTRADOS en la billetera desde que se completaron los pedidos.
   * Las transferencias bancarias reales ocurren en días específicos de pago.
   */
  async generateWeeklyReceipt(
    driverId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    success: boolean;
    receiptId: string;
    totalEarnings: number;
    cardEarnings: number;
    tips: number;
    debts: number;
    cfdiUuid?: string;
    pdfUrl?: string;
  }> {
    try {
      // Obtener todas las transacciones de la semana
      const transactions = await this.getWeeklyTransactions(driverId, startDate, endDate);

      // Calcular totales
      const cardEarnings = transactions
        .filter(t => t.type === 'CARD_ORDER_TRANSFER')
        .reduce((sum, t) => sum + t.amount, 0);

      const tips = transactions
        .filter(t => t.type === 'TIP_CARD_TRANSFER')
        .reduce((sum, t) => sum + t.amount, 0);

      const debts = transactions
        .filter(t => t.type === 'CASH_ORDER_ADEUDO')
        .reduce((sum, t) => sum + t.amount, 0);

      const totalEarnings = cardEarnings + tips;

      // Llamar a Cloud Function para generar y timbrar CFDI
      const result = await functions().httpsCallable(CLOUD_FUNCTIONS.GENERATE_WEEKLY_CFDI)({
        driverId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        cardEarnings,
        tips,
        debts,
        totalEarnings
      });

      const data = result.data as any;

      return {
        success: data.success,
        receiptId: data.receiptId,
        totalEarnings,
        cardEarnings,
        tips,
        debts,
        cfdiUuid: data.cfdiUuid,
        pdfUrl: data.pdfUrl
      };
    } catch (error) {
      console.error('Error generating weekly receipt:', error);
      throw new Error('Error al generar recibo semanal');
    }
  }

  /**
   * CICLO MENSUAL: Clasificación laboral del conductor
   * Se ejecuta el día 1 de cada mes para determinar clasificación
   */
  async performMonthlyClassification(
    driverId: string,
    month: number,
    year: number
  ): Promise<{
    classification: LaborClassification;
    grossIncome: number;
    netIncome: number;
    exceedsMinimum: boolean;
    vehicleType: string;
    exclusionFactor: number;
    message: string;
  }> {
    try {
      // Obtener datos del conductor
      const driverDoc = await firestore()
        .collection(COLLECTIONS.DRIVERS)
        .doc(driverId)
        .get();

      const driverData = driverDoc.data();
      const vehicleType = driverData?.vehicle?.type || 'MOTO';
      const registrationDate = driverData?.createdAt?.toDate();

      // Calcular ingresos brutos del mes
      const grossIncome = await this.calculateMonthlyIncome(driverId, month, year);

      // Calcular clasificación laboral
      const classification = this.pricingService.calculateLaborClassification(
        grossIncome,
        vehicleType
      );

      // Determinar clasificación final
      let finalClassification: LaborClassification;
      let message: string;

      // Si es su primer mes, siempre es Persona Trabajadora de Plataforma
      const isFirstMonth = this.isFirstMonth(registrationDate, month, year);

      if (isFirstMonth) {
        finalClassification = LaborClassification.PERSONA_TRABAJADORA_PLATAFORMA;
        message = 'Primer mes de trabajo - Persona Trabajadora de Plataforma Digital';
      } else {
        finalClassification = classification.exceedsMinimum
          ? LaborClassification.EMPLEADO_COTIZANTE
          : LaborClassification.TRABAJADOR_INDEPENDIENTE;
        message = classification.exceedsMinimum
          ? 'Clasificado como Empleado Cotizante (ingreso neto >= $8,364 MXN)'
          : 'Clasificado como Trabajador Independiente (ingreso neto < $8,364 MXN)';
      }

      // Actualizar clasificación en Firestore
      await firestore()
        .collection(COLLECTIONS.DRIVERS)
        .doc(driverId)
        .update({
          'administrative.laborClassification': finalClassification,
          'administrative.lastClassificationDate': firestore.FieldValue.serverTimestamp(),
          'administrative.lastClassificationMonth': `${year}-${String(month).padStart(2, '0')}`
        });

      // Llamar a Cloud Function para clasificación mensual
      await functions().httpsCallable(CLOUD_FUNCTIONS.MONTHLY_DRIVER_CLASSIFICATION)({
        driverId,
        month,
        year,
        classification: finalClassification,
        grossIncome,
        netIncome: classification.netIncome
      });

      return {
        classification: finalClassification,
        grossIncome: classification.grossIncome,
        netIncome: classification.netIncome,
        exceedsMinimum: classification.exceedsMinimum,
        vehicleType,
        exclusionFactor: classification.exclusionFactor,
        message
      };
    } catch (error) {
      console.error('Error performing monthly classification:', error);
      throw new Error('Error al realizar clasificación mensual');
    }
  }

  /**
   * CICLO MENSUAL: Genera archivo IDSE para movimientos afiliatorios
   * Se ejecuta días 2-5 del mes para trabajadores cotizantes
   */
  async generateIDSEFile(
    month: number,
    year: number
  ): Promise<{
    success: boolean;
    fileUrl: string;
    driversProcessed: number;
    movements: any[];
  }> {
    try {
      // Llamar a Cloud Function para generar archivo IDSE
      const result = await functions().httpsCallable(CLOUD_FUNCTIONS.GENERATE_MONTHLY_IDSE)({
        month,
        year
      });

      const data = result.data as any;

      return {
        success: data.success,
        fileUrl: data.fileUrl,
        driversProcessed: data.driversProcessed,
        movements: data.movements || []
      };
    } catch (error) {
      console.error('Error generating IDSE file:', error);
      throw new Error('Error al generar archivo IDSE');
    }
  }

  /**
   * CICLO MENSUAL: Registra prestaciones de ley a trabajadores cotizantes
   * Se ejecuta días 10-17 del mes
   * IMPORTANTE: Solo REGISTRA el movimiento en la billetera.
   * La transferencia bancaria real ocurre en los días de pago designados.
   */
  async registerBenefits(
    driverId: string,
    month: number,
    year: number
  ): Promise<{
    success: boolean;
    benefitsAmount: number;
    transactionId: string;
    transferScheduled: Date;
  }> {
    try {
      // Verificar que sea trabajador cotizante
      const driverDoc = await firestore()
        .collection(COLLECTIONS.DRIVERS)
        .doc(driverId)
        .get();

      const classification = driverDoc.data()?.administrative?.laborClassification;

      if (classification !== LaborClassification.EMPLEADO_COTIZANTE) {
        throw new Error('Solo los trabajadores cotizantes reciben prestaciones');
      }

      // Llamar a Cloud Function para REGISTRAR prestaciones (no transferir al momento)
      const result = await functions().httpsCallable(CLOUD_FUNCTIONS.TRANSFER_BENEFITS_ONLY)({
        driverId,
        month,
        year
      });

      const data = result.data as any;

      return {
        success: data.success,
        benefitsAmount: data.benefitsAmount,
        transactionId: data.transactionId,
        transferScheduled: data.transferScheduled
      };
    } catch (error) {
      console.error('Error registering benefits:', error);
      throw new Error('Error al registrar prestaciones');
    }
  }

  /**
   * Obtiene transacciones de la semana
   */
  private async getWeeklyTransactions(
    driverId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    const snapshot = await firestore()
      .collection(COLLECTIONS.WALLET_TRANSACTIONS)
      .where('driverId', '==', driverId)
      .where('timestamp', '>=', firestore.Timestamp.fromDate(startDate))
      .where('timestamp', '<=', firestore.Timestamp.fromDate(endDate))
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  /**
   * Calcula ingresos brutos del mes
   */
  private async calculateMonthlyIncome(
    driverId: string,
    month: number,
    year: number
  ): Promise<number> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const transactions = await this.getWeeklyTransactions(driverId, startDate, endDate);

    // Sumar solo ingresos por pedidos con tarjeta (efectivo no cuenta como ingreso registrado)
    const totalIncome = transactions
      .filter(t => t.type === 'CARD_ORDER_TRANSFER' || t.type === 'TIP_CARD_TRANSFER')
      .reduce((sum, t) => sum + t.amount, 0);

    return totalIncome;
  }

  /**
   * Verifica si es el primer mes del conductor
   */
  private isFirstMonth(registrationDate: Date, month: number, year: number): boolean {
    if (!registrationDate) return false;

    const regMonth = registrationDate.getMonth() + 1;
    const regYear = registrationDate.getFullYear();

    return regMonth === month && regYear === year;
  }
}

export default new PayrollService();

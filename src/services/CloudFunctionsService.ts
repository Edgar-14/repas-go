// Servicio para llamadas a Cloud Functions del ecosistema BeFast
import { functions, CLOUD_FUNCTIONS } from '../config/firebase';

export interface CloudFunctionResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class CloudFunctionsService {
  // Validar asignación de pedido
  async validateOrderAssignment(orderId: string, driverId: string): Promise<CloudFunctionResponse> {
    try {
      const result = await functions().httpsCallable(CLOUD_FUNCTIONS.validateOrderAssignment)({
        orderId,
        driverId,
        action: 'ACCEPT'
      });
      
      return result.data as CloudFunctionResponse;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Error al validar asignación de pedido'
      };
    }
  }

  // Procesar finalización de pedido
  async processOrderCompletion(
    orderId: string, 
    driverId: string, 
    completionData: {
      photoUrl: string;
      signature?: string;
      customerPin?: string;
      cashReceived?: number;
      location?: { latitude: number; longitude: number };
    }
  ): Promise<CloudFunctionResponse> {
    try {
      const result = await functions().httpsCallable(CLOUD_FUNCTIONS.processOrderCompletion)({
        orderId,
        driverId,
        ...completionData,
        timestamp: new Date().toISOString()
      });
      
      return result.data as CloudFunctionResponse;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Error al completar pedido'
      };
    }
  }

  // Manejar flujo de pedido
  async handleOrderWorkflow(
    orderId: string, 
    driverId: string, 
    newStatus: string,
    additionalData?: any
  ): Promise<CloudFunctionResponse> {
    try {
      const result = await functions().httpsCallable(CLOUD_FUNCTIONS.handleOrderWorkflow)({
        orderId,
        driverId,
        newStatus,
        timestamp: new Date().toISOString(),
        ...additionalData
      });
      
      return result.data as CloudFunctionResponse;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Error en flujo de pedido'
      };
    }
  }

  // Actualizar estado del conductor
  async updateDriverStatus(
    driverId: string, 
    status: 'ACTIVE' | 'BUSY' | 'OFFLINE' | 'BREAK',
    location?: { latitude: number; longitude: number }
  ): Promise<CloudFunctionResponse> {
    try {
      const result = await functions().httpsCallable(CLOUD_FUNCTIONS.updateDriverStatus)({
        driverId,
        status,
        location,
        timestamp: new Date().toISOString()
      });
      
      return result.data as CloudFunctionResponse;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Error al actualizar estado del conductor'
      };
    }
  }

  // Procesar solicitud de retiro
  async processWithdrawal(
    driverId: string, 
    amount: number, 
    method: 'BANK_TRANSFER' | 'CASH'
  ): Promise<CloudFunctionResponse> {
    try {
      const result = await functions().httpsCallable(CLOUD_FUNCTIONS.PROCESS_WITHDRAWAL)({
        driverId,
        amount,
        method,
        timestamp: new Date().toISOString()
      });
      
      return result.data as CloudFunctionResponse;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Error al procesar retiro'
      };
    }
  }

  // Procesar pago de deuda
  async processDebtPayment(
    driverId: string, 
    amount: number, 
    paymentMethod: 'CASH' | 'TRANSFER'
  ): Promise<CloudFunctionResponse> {
    try {
      const result = await functions().httpsCallable(CLOUD_FUNCTIONS.PROCESS_DEBT_PAYMENT)({
        driverId,
        amount,
        paymentMethod,
        timestamp: new Date().toISOString()
      });
      
      return result.data as CloudFunctionResponse;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Error al procesar pago de deuda'
      };
    }
  }

  // Enviar notificación
  async sendNotification(
    recipientId: string, 
    type: 'ORDER_UPDATE' | 'PAYMENT_UPDATE' | 'SYSTEM_ALERT',
    title: string,
    message: string,
    data?: any
  ): Promise<CloudFunctionResponse> {
    try {
      const result = await functions().httpsCallable(CLOUD_FUNCTIONS.SEND_NOTIFICATION)({
        recipientId,
        type,
        title,
        message,
        data,
        timestamp: new Date().toISOString()
      });
      
      return result.data as CloudFunctionResponse;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Error al enviar notificación'
      };
    }
  }
}

export default new CloudFunctionsService();
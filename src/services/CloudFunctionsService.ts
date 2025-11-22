import { functions, CLOUD_FUNCTIONS } from '../config/firebase';

export interface CloudFunctionResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class CloudFunctionsService {
  async validateOrderAssignment(orderId: string, driverId: string): Promise<CloudFunctionResponse> {
    try {
      const result = await functions().httpsCallable(CLOUD_FUNCTIONS.validateOrderAssignment)({
        orderId,
        driverId,
        action: 'ACCEPT',
      });

      return result.data as CloudFunctionResponse;
    } catch (error: any) {
      console.error('[CloudFunctions] validateOrderAssignment error:', error);
      return {
        success: false,
        error: error.message || 'Error validating order assignment',
      };
    }
  }

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
        timestamp: new Date().toISOString(),
      });

      return result.data as CloudFunctionResponse;
    } catch (error: any) {
      console.error('[CloudFunctions] processOrderCompletion error:', error);
      return {
        success: false,
        error: error.message || 'Error completing order',
      };
    }
  }

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
        ...additionalData,
      });

      return result.data as CloudFunctionResponse;
    } catch (error: any) {
      console.error('[CloudFunctions] handleOrderWorkflow error:', error);
      return {
        success: false,
        error: error.message || 'Error in order workflow',
      };
    }
  }

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
        timestamp: new Date().toISOString(),
      });

      return result.data as CloudFunctionResponse;
    } catch (error: any) {
      console.error('[CloudFunctions] updateDriverStatus error:', error);
      return {
        success: false,
        error: error.message || 'Error updating driver status',
      };
    }
  }

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
        timestamp: new Date().toISOString(),
      });

      return result.data as CloudFunctionResponse;
    } catch (error: any) {
      console.error('[CloudFunctions] processWithdrawal error:', error);
      return {
        success: false,
        error: error.message || 'Error processing withdrawal',
      };
    }
  }

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
        timestamp: new Date().toISOString(),
      });

      return result.data as CloudFunctionResponse;
    } catch (error: any) {
      console.error('[CloudFunctions] processDebtPayment error:', error);
      return {
        success: false,
        error: error.message || 'Error processing debt payment',
      };
    }
  }

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
        timestamp: new Date().toISOString(),
      });

      return result.data as CloudFunctionResponse;
    } catch (error: any) {
      console.error('[CloudFunctions] sendNotification error:', error);
      return {
        success: false,
        error: error.message || 'Error sending notification',
      };
    }
  }
}

export default new CloudFunctionsService();

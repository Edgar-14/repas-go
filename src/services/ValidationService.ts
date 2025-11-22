import { firestore, functions, COLLECTIONS, CLOUD_FUNCTIONS } from '../config/firebase';
import { ValidationResult, CriticalValidation } from '../types/index';

class ValidationService {
  async validateDriverForOrderAssignment(driverId: string): Promise<ValidationResult> {
    try {
      const driverDoc = await firestore()
        .collection(COLLECTIONS.DRIVERS)
        .doc(driverId)
        .get();
      
      if (!driverDoc.exists()) {
        return {
          canReceiveOrders: false,
          blockingReason: 'DRIVER_NOT_FOUND',
          message: 'Perfil de conductor no encontrado',
        };
      }
      
      const data = driverDoc.data();
      
      // 1. VALIDACIÓN IMSS/IDSE (REQUISITO INDISPENSABLE)
      if (!data?.administrative?.idseApproved) {
        return {
          canReceiveOrders: false,
          blockingReason: 'IDSE_NOT_APPROVED',
          message: 'Tu alta en IMSS está pendiente. No puedes recibir pedidos hasta que se apruebe tu Acta IDSE.',
        };
      }
      
      // 2. VALIDACIÓN DE ESTADO BEFASTGO
      if (data?.administrative?.befastStatus !== 'ACTIVE') {
        return {
          canReceiveOrders: false,
          blockingReason: 'NOT_ACTIVE',
          message: `Tu cuenta está en estado: ${data?.administrative?.befastStatus}. Contacta a soporte.`,
        };
      }
      
      // 3. VALIDACIÓN IMSS ACTIVO COTIZANDO
      if (data?.administrative?.imssStatus !== 'ACTIVO_COTIZANDO') {
        return {
          canReceiveOrders: false,
          blockingReason: 'IMSS_NOT_ACTIVE',
          message: 'Tu estatus en IMSS no está activo. Debes estar cotizando para recibir pedidos.',
        };
      }
      
      // 4. VALIDACIÓN DE DOCUMENTOS
      if (data?.administrative?.documentsStatus !== 'APPROVED') {
        return {
          canReceiveOrders: false,
          blockingReason: 'DOCUMENTS_NOT_APPROVED',
          message: 'Tus documentos están pendientes de aprobación o han expirado.',
        };
      }
      
      // 5. VALIDACIÓN DE CAPACITACIÓN
      if (data?.administrative?.trainingStatus === 'EXPIRED') {
        return {
          canReceiveOrders: false,
          blockingReason: 'TRAINING_EXPIRED',
          message: 'Tu capacitación ha expirado. Completa la capacitación de renovación.',
        };
      }
      
      // 6. VALIDACIÓN DE DEUDAS
      const debtLimit = data?.wallet?.creditLimit || 300;
      const currentDebt = data?.wallet?.pendingDebts || 0;
      
      if (currentDebt > debtLimit) {
        return {
          canReceiveOrders: false,
          blockingReason: 'DEBT_LIMIT_EXCEEDED',
          message: `Tu deuda actual ($${currentDebt}) excede el límite permitido ($${debtLimit}). Realiza un pago para continuar.`,
        };
      }
      
      // 7. VALIDACIÓN DE ESTADO OPERACIONAL
      if (data?.operational?.status === 'OFFLINE') {
        return {
          canReceiveOrders: false,
          blockingReason: 'DRIVER_OFFLINE',
          message: 'Debes estar en línea para recibir pedidos.',
        };
      }
      
      if (data?.operational?.status === 'BUSY') {
        return {
          canReceiveOrders: false,
          blockingReason: 'DRIVER_BUSY',
          message: 'Ya tienes un pedido activo. Complétalo antes de aceptar otro.',
        };
      }
      
      // ✅ TODAS LAS VALIDACIONES PASADAS
      return {
        canReceiveOrders: true,
        approved: true,
        message: 'Validación exitosa. Puedes recibir pedidos.',
      };
    } catch (error: any) {
      console.error('[ValidationService] Error en validación de conductor:', error);
      return {
        canReceiveOrders: false,
        blockingReason: 'VALIDATION_ERROR',
        message: 'Error al validar tu cuenta. Intenta de nuevo.',
      };
    }
  }

  /**
   * Validación específica de IMSS/IDSE
   * Verifica que el conductor tenga su alta aprobada
   */
  async validateIMSS(driverId: string): Promise<boolean> {
    try {
      const driverDoc = await firestore()
        .collection(COLLECTIONS.DRIVERS)
        .doc(driverId)
        .get();
      
      const data = driverDoc.data();
      
      return (
        data?.administrative?.idseApproved === true &&
        data?.administrative?.imssStatus === 'ACTIVO_COTIZANDO'
      );
    } catch (error) {
      console.error('[ValidationService] Error validando IMSS:', error);
      return false;
    }
  }

  /**
   * Llamar a Cloud Function de validación de asignación de pedido
   * Esta es la función oficial del ecosistema BeFast
   */
  async callValidateOrderAssignment(
    orderId: string,
    driverId: string,
    action: 'ACCEPT' | 'REJECT'
  ): Promise<ValidationResult> {
    try {
      const result = await functions().httpsCallable(CLOUD_FUNCTIONS.VALIDATE_ORDER_ASSIGNMENT)({
        orderId,
        driverId,
        action,
        timestamp: new Date().toISOString(),
      });
      
      const data = result.data as any;
      
      return {
        approved: data.approved,
        canReceiveOrders: data.approved,
        reason: data.reason,
        message: data.message,
        blockingReason: data.blockingReason,
      };
    } catch (error: any) {
      console.error('[ValidationService] Error calling validateOrderAssignment:', error);
      return {
        approved: false,
        canReceiveOrders: false,
        reason: 'CLOUD_FUNCTION_ERROR',
        message: error.message || 'Error al validar asignación de pedido',
      };
    }
  }

  /**
   * Validación crítica completa para mostrar en UI
   * Retorna objeto con todas las validaciones desglosadas
   */
  async getCriticalValidationStatus(driverId: string): Promise<CriticalValidation> {
    try {
      const driverDoc = await firestore()
        .collection(COLLECTIONS.DRIVERS)
        .doc(driverId)
        .get();
      
      const data = driverDoc.data();
      
      return {
        imssValidation: {
          idseApproved: data?.administrative?.idseApproved || false,
          imssStatus: data?.administrative?.imssStatus || 'PENDING',
          nssValid: !!(data?.personalData?.nss),
        },
        operationalValidation: {
          befastStatus: data?.administrative?.befastStatus || 'PENDING',
          documentsValid: data?.administrative?.documentsStatus === 'APPROVED',
          trainingCurrent: data?.administrative?.trainingStatus !== 'EXPIRED',
          debtWithinLimit: (data?.wallet?.pendingDebts || 0) <= (data?.wallet?.creditLimit || 300),
        },
      };
    } catch (error) {
      console.error('[ValidationService] Error getting validation status:', error);
      throw error;
    }
  }

  /**
   * Verificar si el conductor puede iniciar sesión y operar
   */
  async canDriverOperate(driverId: string): Promise<{
    canOperate: boolean;
    reason?: string;
    validations: {
      idseApproved: boolean;
      isActive: boolean;
      imssActive: boolean;
      documentsApproved: boolean;
    };
  }> {
    try {
      const driverDoc = await firestore()
        .collection(COLLECTIONS.DRIVERS)
        .doc(driverId)
        .get();
      
      const data = driverDoc.data();
      
      const validations = {
        idseApproved: data?.administrative?.idseApproved === true,
        isActive: data?.administrative?.befastStatus === 'ACTIVE',
        imssActive: data?.administrative?.imssStatus === 'ACTIVO_COTIZANDO',
        documentsApproved: data?.administrative?.documentsStatus === 'APPROVED',
      };
      
      // Determinar si puede operar
      const canOperate = Object.values(validations).every(v => v === true);
      
      let reason: string | undefined;
      if (!validations.idseApproved) {
        reason = 'Alta IMSS (IDSE) pendiente de aprobación';
      } else if (!validations.isActive) {
        reason = 'Cuenta no está activa';
      } else if (!validations.imssActive) {
        reason = 'Estatus IMSS no es ACTIVO_COTIZANDO';
      } else if (!validations.documentsApproved) {
        reason = 'Documentos pendientes de aprobación';
      }
      
      return {
        canOperate,
        reason,
        validations,
      };
    } catch (error) {
      console.error('[ValidationService] Error checking if driver can operate:', error);
      return {
        canOperate: false,
        reason: 'Error al verificar estado del conductor',
        validations: {
          idseApproved: false,
          isActive: false,
          imssActive: false,
          documentsApproved: false,
        },
      };
    }
  }
}

// Exportar instancia singleton
export default new ValidationService();

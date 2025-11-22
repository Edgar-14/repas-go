/**
 * 🎯 BeFast System Hook - Conecta todos los portales con el backend
 * Este hook maneja TODAS las operaciones del sistema de forma unificada
 */

import { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { toast } from 'react-hot-toast';
// // Firebase Functions imports removed - not needed in frontend
// Removed - not needed in frontend
interface BeFastSystemRequest {
  action: string;
  data?: Record<string, unknown>;
  userRole?: string;
  userId?: string;
}

interface BeFastSystemResponse {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
  [key: string]: unknown;
}

export function useBeFastSystem() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const functions = getFunctions();
  const befastMainSystem = httpsCallable<BeFastSystemRequest, BeFastSystemResponse>(functions, 'befastMainSystem');

  const executeAction = async (action: string, data?: Record<string, unknown>, options?: { 
    showSuccessToast?: boolean;
    showErrorToast?: boolean;
    successMessage?: string;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      console.info(`🎯 Ejecutando acción: ${action}`, data);
      
      const result = await befastMainSystem({
        action,
        data,
        userRole: data?.userRole as string,
        userId: data?.userId as string
      });

      console.info(`✅ Acción ${action} completada:`, result.data);

      // Mostrar toast de éxito si está habilitado
      if (options?.showSuccessToast !== false) {
        toast.success(options?.successMessage || result.data.message || 'Operación exitosa');
      }

      return result.data;

    } catch (error: unknown) {
      console.error(`❌ Error en acción ${action}:`, error);
      
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(errorMessage);

      // Mostrar toast de error si está habilitado
      if (options?.showErrorToast !== false) {
        toast.error(errorMessage);
      }

      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // 🚴 ACCIONES DEL PORTAL DE REPARTIDORES
  const driverActions = {
    submitApplication: (applicationData: any) =>
      executeAction('DRIVER_SUBMIT_APPLICATION', applicationData, {
        successMessage: 'Solicitud enviada exitosamente'
      }),

    updateDocuments: (documents: any) =>
      executeAction('DRIVER_UPDATE_DOCUMENTS', { documents }, {
        successMessage: 'Documentos actualizados correctamente'
      }),

    requestPayment: (paymentData: any) =>
      executeAction('DRIVER_REQUEST_PAYMENT', paymentData, {
        successMessage: 'Solicitud de pago enviada'
      }),

    reportEmergency: (emergencyData: any) =>
      executeAction('DRIVER_EMERGENCY_REPORT', emergencyData, {
        successMessage: 'Emergencia reportada. Los administradores han sido notificados.'
      }),

    submitSupportTicket: (ticketData: any) =>
      executeAction('DRIVER_SUBMIT_SUPPORT_TICKET', ticketData, {
        successMessage: 'Ticket de soporte creado exitosamente'
      }),

    getDashboard: () =>
      executeAction('GET_DASHBOARD_DATA', { userRole: 'DRIVER' }, {
        showSuccessToast: false
      })
  };

  // 🏢 ACCIONES DEL PORTAL DE NEGOCIOS
  const businessActions = {
    createOrder: (orderData: any) =>
      executeAction('BUSINESS_CREATE_ORDER', orderData, {
        successMessage: 'Orden creada exitosamente'
      }),

    buyCredits: (purchaseData: any) =>
      executeAction('BUSINESS_BUY_CREDITS', purchaseData, {
        successMessage: 'Compra procesada exitosamente'
      }),

    updateProfile: (profileData: any) =>
      executeAction('BUSINESS_UPDATE_PROFILE', profileData, {
        successMessage: 'Perfil actualizado correctamente'
      }),

    submitSupportTicket: (ticketData: any) =>
      executeAction('BUSINESS_SUBMIT_SUPPORT_TICKET', ticketData, {
        successMessage: 'Ticket de soporte creado exitosamente'
      }),

    getDashboard: () =>
      executeAction('GET_DASHBOARD_DATA', { userRole: 'BUSINESS' }, {
        showSuccessToast: false
      }),

    getOrders: (filters?: any) =>
      executeAction('GET_ORDERS_LIST', { userRole: 'BUSINESS', ...filters }, {
        showSuccessToast: false
      })
  };

  // ⚙️ ACCIONES DEL PORTAL DE ADMIN
  const adminActions = {
    approveDriver: (applicationData: any) =>
      executeAction('ADMIN_APPROVE_DRIVER', applicationData, {
        successMessage: 'Repartidor aprobado exitosamente'
      }),

    rejectDriver: (rejectionData: any) =>
      executeAction('ADMIN_REJECT_DRIVER', rejectionData, {
        successMessage: 'Solicitud rechazada'
      }),

    addCredits: (creditData: any) =>
      executeAction('ADMIN_ADD_CREDITS', creditData, {
        successMessage: `${creditData.credits} créditos agregados exitosamente`
      }),

    processPayroll: (payrollData: any) =>
      executeAction('ADMIN_PROCESS_PAYROLL', payrollData, {
        successMessage: 'Nómina iniciada exitosamente'
      }),

    createIncentive: (incentiveData: any) =>
      executeAction('ADMIN_CREATE_INCENTIVE', incentiveData, {
        successMessage: 'Campaña de incentivos creada exitosamente'
      }),

    resolveTicket: (ticketData: any) =>
      executeAction('ADMIN_RESOLVE_TICKET', ticketData, {
        successMessage: 'Ticket resuelto exitosamente'
      }),

    getDashboard: () =>
      executeAction('GET_DASHBOARD_DATA', { userRole: 'ADMIN' }, {
        showSuccessToast: false
      }),

    getDriverProfile: (driverId: string) =>
      executeAction('GET_DRIVER_PROFILE', { driverId }, {
        showSuccessToast: false
      }),

    getBusinessProfile: (businessId: string) =>
      executeAction('GET_BUSINESS_PROFILE', { businessId }, {
        showSuccessToast: false
      })
  };

  // 📊 ACCIONES GENERALES
  const generalActions = {
    getOrdersList: (filters?: any, userRole?: string) =>
      executeAction('GET_ORDERS_LIST', { ...filters, userRole }, {
        showSuccessToast: false
      })
  };

  return {
    // Estados
    isLoading,
    error,
    
    // Función genérica
    executeAction,
    
    // Acciones por portal
    driver: driverActions,
    business: businessActions,
    admin: adminActions,
    general: generalActions
  };
}

// 🎯 Hook específico para cada portal
export function useDriverSystem() {
  const { isLoading, error, driver } = useBeFastSystem();
  return { isLoading, error, ...driver };
}

export function useBusinessSystem() {
  const { isLoading, error, business } = useBeFastSystem();
  return { isLoading, error, ...business };
}

export function useAdminSystem() {
  const { isLoading, error, admin } = useBeFastSystem();
  return { isLoading, error, ...admin };
}

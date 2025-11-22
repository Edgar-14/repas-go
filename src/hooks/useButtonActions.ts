"use client";

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/lib/firebase';

export interface ButtonActionOptions {
  onSuccess?: (data?: any) => void;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
  redirectTo?: string;
  confirmMessage?: string;
}

export const useButtonActions = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const executeAction = useCallback(async (
    action: () => Promise<any>,
    options: ButtonActionOptions = {}
  ) => {
    const {
      onSuccess,
      onError,
      successMessage,
      errorMessage,
      redirectTo,
      confirmMessage
    } = options;

    // Show confirmation if required
    if (confirmMessage && !window.confirm(confirmMessage)) {
      return;
    }

    setLoading(true);
    
    try {
      const result = await action();
      
      if (successMessage) {
        toast({
          title: "Éxito",
          description: successMessage,
          variant: "default",
        });
      }
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      if (redirectTo) {
        router.push(redirectTo);
      }
      
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      
      if (errorMessage) {
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: errorMsg,
          variant: "destructive",
        });
      }
      
      if (onError) {
        onError(error instanceof Error ? error : new Error(errorMsg));
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast, router]);

  const navigateTo = useCallback((path: string) => {
    router.push(path);
  }, [router]);

  const showConfirm = useCallback((message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const result = window.confirm(message);
      resolve(result);
    });
  }, []);

  const showToast = useCallback((title: string, description: string, variant: "default" | "destructive" = "default") => {
    toast({
      title,
      description,
      variant,
    });
  }, [toast]);

  return {
    executeAction,
    navigateTo,
    showConfirm,
    showToast,
    loading,
  };
};

// Specific hooks for common actions
export const useOrderActions = () => {
  const { executeAction, navigateTo } = useButtonActions();

  const createOrder = useCallback(async (orderData: any) => {
    return executeAction(
      async () => {
        const functions = getFunctions(app);
        const manageBusinessOperations = httpsCallable(functions, 'manageBusinessOperations');
        
        const result = await manageBusinessOperations({
          action: 'createOrder',
          payload: {
            orderData
          }
        });
        
        return result.data;
      },
      {
        successMessage: 'Pedido creado exitosamente',
        errorMessage: 'Error al crear el pedido',
        redirectTo: '/delivery/orders'
      }
    );
  }, [executeAction]);

  const cancelOrder = useCallback(async (orderId: string, reason: string) => {
    return executeAction(
      async () => {
        const functions = getFunctions(app);
        const handleOrderWorkflow = httpsCallable(functions, 'handleOrderWorkflow');
        
        const result = await handleOrderWorkflow({
          action: 'cancelOrder',
          payload: {
            orderId,
            reason
          }
        });
        
        return result.data;
      },
      {
        successMessage: 'Pedido cancelado exitosamente',
        errorMessage: 'Error al cancelar el pedido',
        confirmMessage: '¿Estás seguro de que quieres cancelar este pedido?'
      }
    );
  }, [executeAction]);

  return {
    createOrder,
    cancelOrder,
    navigateTo,
  };
};

export const useDriverActions = () => {
  const { executeAction, navigateTo } = useButtonActions();

  const updateDriverStatus = useCallback(async (driverId: string, status: string) => {
    return executeAction(
      async () => {
        const functions = getFunctions(app);
        const manageDriverLifecycle = httpsCallable(functions, 'manageDriverLifecycle');
        
        const result = await manageDriverLifecycle({
          action: 'updateStatus',
          payload: {
            driverId,
            status,
            reason: `Estado actualizado a ${status} desde dashboard administrativo`
          }
        });
        
        return result.data;
      },
      {
        successMessage: 'Estado del repartidor actualizado',
        errorMessage: 'Error al actualizar el estado del repartidor'
      }
    );
  }, [executeAction]);

  const approveDriver = useCallback(async (driverId: string) => {
    return executeAction(
      async () => {
        const functions = getFunctions(app);
        const manageDriverLifecycle = httpsCallable(functions, 'manageDriverLifecycle');
        
        const result = await manageDriverLifecycle({
          action: 'approveApplication',
          payload: {
            driverId,
            status: 'ACTIVE',
            imssStatus: 'ALTA_PROVISIONAL',
            reason: 'Aprobado desde dashboard administrativo'
          }
        });
        
        return result.data;
      },
      {
        successMessage: 'Repartidor aprobado exitosamente',
        errorMessage: 'Error al aprobar el repartidor',
        confirmMessage: '¿Estás seguro de que quieres aprobar este repartidor?'
      }
    );
  }, [executeAction]);

  const rejectDriver = useCallback(async (driverId: string, reason?: string) => {
    return executeAction(
      async () => {
        const functions = getFunctions(app);
        const manageDriverLifecycle = httpsCallable(functions, 'manageDriverLifecycle');
        
        const result = await manageDriverLifecycle({
          action: 'rejectApplication',
          payload: {
            driverId,
            status: 'REJECTED',
            reason: reason || 'Rechazado desde dashboard administrativo'
          }
        });
        
        return result.data;
      },
      {
        successMessage: 'Repartidor rechazado',
        errorMessage: 'Error al rechazar el repartidor',
        confirmMessage: '¿Estás seguro de que quieres rechazar este repartidor?'
      }
    );
  }, [executeAction]);

  return {
    updateDriverStatus,
    approveDriver,
    rejectDriver,
    navigateTo,
  };
};

export const usePayrollActions = () => {
  const { executeAction } = useButtonActions();

  const processPayroll = useCallback(async (month: string, year: number) => {
    return executeAction(
      async () => {
        const functions = getFunctions(app);
        const processMonthlyPayrollFunction = httpsCallable(functions, 'processMonthlyPayroll');
        
        const result = await processMonthlyPayrollFunction({
          month,
          year,
          forceProcess: true
        });
        
        return result.data;
      },
      {
        successMessage: 'Nómina procesada exitosamente',
        errorMessage: 'Error al procesar la nómina',
        confirmMessage: '¿Estás seguro de que quieres procesar la nómina? Esta acción no se puede deshacer.'
      }
    );
  }, [executeAction]);

  const generateCFDI = useCallback(async (driverId: string, period: string) => {
    return executeAction(
      async () => {
        const functions = getFunctions(app);
        const processCompletePayroll = httpsCallable(functions, 'processCompletePayroll');
        
        const result = await processCompletePayroll({
          action: 'generateCFDI',
          payload: {
            driverId,
            period
          }
        });
        
        return result.data;
      },
      {
        successMessage: 'CFDI generado exitosamente',
        errorMessage: 'Error al generar CFDI'
      }
    );
  }, [executeAction]);

  const generateIDSE = useCallback(async (month: string, year: number) => {
    return executeAction(
      async () => {
        const functions = getFunctions(app);
        const generateIDSEFunction = httpsCallable(functions, 'generateIDSE');
        
        const result = await generateIDSEFunction({
          month,
          year
        });
        
        return result.data;
      },
      {
        successMessage: 'Archivo IDSE generado exitosamente',
        errorMessage: 'Error al generar archivo IDSE'
      }
    );
  }, [executeAction]);

  return {
    processPayroll,
    generateCFDI,
    generateIDSE,
  };
};
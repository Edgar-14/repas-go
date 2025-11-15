/**
 * useOrderReassignment.ts
 * 
 * Hook para integrar el servicio de reasignación en la app
 */

import { useEffect, useCallback } from 'react';
import OrderReassignmentService from '../services/OrderReassignmentService';

export interface UseOrderReassignmentOptions {
  enableMonitoring?: boolean; // Habilitar monitoreo automático
}

export const useOrderReassignment = (
  options: UseOrderReassignmentOptions = {}
) => {
  const { enableMonitoring = false } = options;

  /**
   * Inicia el monitoreo automático de reasignaciones
   */
  useEffect(() => {
    if (!enableMonitoring) return;

    console.log('[useOrderReassignment] Starting automatic monitoring');
    const stopMonitoring = OrderReassignmentService.startMonitoring();

    return () => {
      stopMonitoring();
    };
  }, [enableMonitoring]);

  /**
   * Verifica si un pedido necesita reasignarse
   */
  const checkReassignment = useCallback(async (orderId: string) => {
    return await OrderReassignmentService.checkForReassignment(orderId);
  }, []);

  /**
   * Maneja la cancelación de un conductor
   */
  const handleDriverCancellation = useCallback(
    async (orderId: string, driverId: string, reason: string) => {
      await OrderReassignmentService.handleDriverCancellation(
        orderId,
        driverId,
        reason
      );
    },
    []
  );

  /**
   * Maneja cuando un conductor se queda offline
   */
  const handleDriverOffline = useCallback(async (driverId: string) => {
    await OrderReassignmentService.handleDriverOffline(driverId);
  }, []);

  return {
    checkReassignment,
    handleDriverCancellation,
    handleDriverOffline,
  };
};

export default useOrderReassignment;

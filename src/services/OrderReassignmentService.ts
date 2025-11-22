/**
 * OrderReassignmentService.ts
 * 
 * Servicio para reasignación automática de pedidos cuando:
 * - El conductor no acepta en tiempo límite
 * - El conductor cancela
 * - El conductor queda offline
 * - Falla la validación (IMSS, deuda, documentos)
 */

import { firestore } from '../config/firebase';
import { OrderStatus } from '../types/order';
import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

export interface ReassignmentReason {
  type: 'TIMEOUT' | 'CANCELLED' | 'OFFLINE' | 'VALIDATION_FAILED' | 'MANUAL';
  details: string;
  previousDriverId?: string;
}

export interface DriverCandidate {
  id: string;
  name: string;
  distance: number; // km desde el pickup
  rating: number;
  activeOrders: number;
  availableForCash: boolean;
  imssStatus: 'ACTIVE' | 'INACTIVE';
}

class OrderReassignmentService {
  private readonly ACCEPTANCE_TIMEOUT = 120; // 2 minutos en segundos
  private readonly MAX_REASSIGNMENT_ATTEMPTS = 3;
  private readonly SEARCH_RADIUS_KM = 5; // Radio de búsqueda inicial
  
  /**
   * Detecta si un pedido necesita reasignarse
   */
  async checkForReassignment(orderId: string): Promise<boolean> {
    try {
      const orderDoc = await firestore().collection('orders').doc(orderId).get();
      
      if (!orderDoc.exists) return false;
      
      const order = orderDoc.data();
      if (!order) return false;
      
      // Verificar si ya está siendo reasignado
      if (order.reassignmentInProgress) {
        console.log(`[Reassignment] Order ${orderId} already being reassigned`);
        return false;
      }
      
      // Verificar timeout de aceptación
      if (order.status === OrderStatus.ASSIGNED && order.timing?.assignedAt) {
        const assignedAt = order.timing.assignedAt.toDate();
        const now = new Date();
        const secondsSinceAssigned = (now.getTime() - assignedAt.getTime()) / 1000;
        
        if (secondsSinceAssigned > this.ACCEPTANCE_TIMEOUT) {
          console.log(`[Reassignment] Order ${orderId} timeout - ${secondsSinceAssigned}s`);
          await this.initiateReassignment(orderId, {
            type: 'TIMEOUT',
            details: `Conductor no aceptó en ${this.ACCEPTANCE_TIMEOUT}s`,
            previousDriverId: order.assignedDriverId,
          });
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('[Reassignment] Error checking for reassignment:', error);
      return false;
    }
  }
  
  /**
   * Inicia el proceso de reasignación
   */
  async initiateReassignment(
    orderId: string,
    reason: ReassignmentReason
  ): Promise<boolean> {
    try {
      console.log(`[Reassignment] Initiating for order ${orderId}:`, reason);
      
      const orderRef = firestore().collection('orders').doc(orderId);
      const orderDoc = await orderRef.get();
      
      if (!orderDoc.exists) {
        throw new Error('Order not found');
      }
      
      const order = orderDoc.data();
      if (!order) return false;
      
      // Verificar límite de intentos
      const reassignmentAttempts = order.reassignmentAttempts || 0;
      if (reassignmentAttempts >= this.MAX_REASSIGNMENT_ATTEMPTS) {
        console.error(`[Reassignment] Max attempts reached for order ${orderId}`);
        await this.failOrder(orderId, 'No se encontró conductor disponible');
        return false;
      }
      
      // Marcar como en proceso de reasignación
      await orderRef.update({
        reassignmentInProgress: true,
        reassignmentAttempts: firestore.FieldValue.increment(1),
        'reassignmentHistory': firestore.FieldValue.arrayUnion({
          timestamp: firestore.FieldValue.serverTimestamp(),
          reason,
          attempt: reassignmentAttempts + 1,
        }),
      });
      
      // Buscar nuevo conductor
      const newDriver = await this.findAvailableDriver(order);
      
      if (newDriver) {
        await this.assignToNewDriver(orderId, newDriver, order);
        return true;
      } else {
        // No hay conductores disponibles, expandir radio de búsqueda
        await orderRef.update({
          reassignmentInProgress: false,
          status: OrderStatus.SEARCHING,
          assignedDriverId: null,
        });
        return false;
      }
    } catch (error) {
      console.error('[Reassignment] Error initiating reassignment:', error);
      return false;
    }
  }
  
  /**
   * Busca un conductor disponible cercano
   */
  private async findAvailableDriver(order: any): Promise<DriverCandidate | null> {
    try {
      const pickupLocation = order.restaurant?.coordinates || order.pickup?.location;
      
      if (!pickupLocation) {
        console.error('[Reassignment] No pickup location in order');
        return null;
      }
      
      // Obtener conductores activos
      const driversSnapshot = await firestore()
        .collection('drivers')
        .where('operational.status', '==', 'ACTIVE')
        .where('operational.available', '==', true)
        .get();
      
      const candidates: DriverCandidate[] = [];
      
      for (const driverDoc of driversSnapshot.docs) {
        const driver = driverDoc.data();
        
        // Verificar IMSS activo
        if (!driver.compliance?.imss?.status || driver.compliance.imss.status !== 'ACTIVE') {
          continue;
        }
        
        // Verificar documentos aprobados
        if (driver.documents?.status !== 'APPROVED') {
          continue;
        }
        
        // Verificar deuda si el pedido es en efectivo
        if (order.paymentMethod === 'CASH') {
          const currentDebt = driver.wallet?.debt || 0;
          const maxDebt = 500;
          if (currentDebt >= maxDebt) {
            continue;
          }
        }
        
        // Calcular distancia (simplificado - en producción usar Distance Matrix API)
        const driverLocation = driver.operational?.currentLocation;
        if (!driverLocation) continue;
        
        const distance = this.calculateDistance(
          driverLocation.latitude,
          driverLocation.longitude,
          pickupLocation.lat,
          pickupLocation.lng
        );
        
        // Filtrar por radio de búsqueda
        if (distance > this.SEARCH_RADIUS_KM) continue;
        
        candidates.push({
          id: driverDoc.id,
          name: `${driver.personalInfo?.firstName || ''} ${driver.personalInfo?.lastName || ''}`.trim(),
          distance,
          rating: driver.kpis?.rating || 0,
          activeOrders: driver.operational?.activeOrders || 0,
          availableForCash: order.paymentMethod === 'CASH' ? (driver.wallet?.debt || 0) < 500 : true,
          imssStatus: driver.compliance?.imss?.status || 'INACTIVE',
        });
      }
      
      // Ordenar por: menos pedidos activos, mejor rating, menor distancia
      candidates.sort((a, b) => {
        if (a.activeOrders !== b.activeOrders) return a.activeOrders - b.activeOrders;
        if (a.rating !== b.rating) return b.rating - a.rating;
        return a.distance - b.distance;
      });
      
      console.log(`[Reassignment] Found ${candidates.length} candidates`);
      
      return candidates.length > 0 ? candidates[0] : null;
    } catch (error) {
      console.error('[Reassignment] Error finding driver:', error);
      return null;
    }
  }
  
  /**
   * Asigna el pedido a un nuevo conductor
   */
  private async assignToNewDriver(
    orderId: string,
    driver: DriverCandidate,
    order: any
  ): Promise<void> {
    try {
      console.log(`[Reassignment] Assigning order ${orderId} to driver ${driver.id}`);
      
      await firestore().collection('orders').doc(orderId).update({
        assignedDriverId: driver.id,
        status: OrderStatus.ASSIGNED,
        reassignmentInProgress: false,
        'timing.assignedAt': firestore.FieldValue.serverTimestamp(),
        'timing.lastReassignedAt': firestore.FieldValue.serverTimestamp(),
      });
      
      // Enviar notificación push al nuevo conductor
      // (esto se maneja via Cloud Function onUpdate trigger)
      
      console.log(`[Reassignment] Successfully assigned to ${driver.name}`);
    } catch (error) {
      console.error('[Reassignment] Error assigning to new driver:', error);
      throw error;
    }
  }
  
  /**
   * Marca el pedido como fallido después de múltiples intentos
   */
  private async failOrder(orderId: string, reason: string): Promise<void> {
    try {
      await firestore().collection('orders').doc(orderId).update({
        status: OrderStatus.FAILED,
        failureReason: reason,
        'timing.failedAt': firestore.FieldValue.serverTimestamp(),
        reassignmentInProgress: false,
      });
      
      console.log(`[Reassignment] Order ${orderId} marked as FAILED: ${reason}`);
    } catch (error) {
      console.error('[Reassignment] Error failing order:', error);
    }
  }
  
  /**
   * Calcula distancia entre dos puntos (Haversine)
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  
  private toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }
  
  /**
   * Monitorea todos los pedidos para detectar necesidad de reasignación
   */
  startMonitoring(): () => void {
    console.log('[Reassignment] Starting monitoring service');
    
    // Revisar pedidos asignados cada 30 segundos
    const interval = setInterval(async () => {
      try {
        const snapshot = await firestore()
          .collection('orders')
          .where('status', '==', OrderStatus.ASSIGNED)
          .get();
        
        for (const doc of snapshot.docs) {
          await this.checkForReassignment(doc.id);
        }
      } catch (error) {
        console.error('[Reassignment] Error in monitoring:', error);
      }
    }, 30000); // 30 segundos
    
    // Retornar función para detener el monitoreo
    return () => {
      console.log('[Reassignment] Stopping monitoring service');
      clearInterval(interval);
    };
  }
  
  /**
   * Maneja cancelación manual por parte del conductor
   */
  async handleDriverCancellation(orderId: string, driverId: string, reason: string): Promise<void> {
    await this.initiateReassignment(orderId, {
      type: 'CANCELLED',
      details: reason,
      previousDriverId: driverId,
    });
  }
  
  /**
   * Maneja conductor que se queda offline
   */
  async handleDriverOffline(driverId: string): Promise<void> {
    try {
      // Buscar pedidos activos del conductor
      const ordersSnapshot = await firestore()
        .collection('orders')
        .where('assignedDriverId', '==', driverId)
        .where('status', 'in', [
          OrderStatus.ASSIGNED,
          OrderStatus.ACCEPTED,
          OrderStatus.STARTED,
        ])
        .get();
      
      for (const doc of ordersSnapshot.docs) {
        await this.initiateReassignment(doc.id, {
          type: 'OFFLINE',
          details: 'Conductor quedó offline',
          previousDriverId: driverId,
        });
      }
    } catch (error) {
      console.error('[Reassignment] Error handling offline driver:', error);
    }
  }
}

export default new OrderReassignmentService();

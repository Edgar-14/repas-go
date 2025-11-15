/**
 * MetricsService.ts
 * 
 * Servicio para calcular y trackear métricas y KPIs del conductor:
 * - Tiempos efectivos de entrega
 * - Duración de cada pedido por etapa
 * - Distancia real vs estimada
 * - Velocidad promedio
 * - Tasa de aceptación
 * - Entregas a tiempo
 */

import { firestore } from '../config/firebase';
import { OrderStatus } from '../types/order';
import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

export interface OrderMetrics {
  orderId: string;
  driverId: string;
  
  // Tiempos (en minutos)
  timeToAccept: number; // Desde ASSIGNED hasta ACCEPTED
  timeToPickup: number; // Desde ACCEPTED hasta PICKED_UP
  timeInTransit: number; // Desde PICKED_UP hasta ARRIVED
  totalTime: number; // Tiempo total del pedido
  
  // Distancias (en kilómetros)
  estimatedDistance: number;
  actualDistance: number;
  distanceDeviation: number; // Diferencia entre real y estimado
  
  // Velocidades (km/h)
  averageSpeed: number;
  
  // Eficiencia
  onTime: boolean; // Si llegó antes del ETA
  acceptanceRate: number; // % de pedidos aceptados vs ofrecidos
}

export interface DriverKPIs {
  driverId: string;
  period: 'daily' | 'weekly' | 'monthly';
  periodStart: Date;
  periodEnd: Date;
  
  // Métricas de productividad
  totalOrders: number;
  completedOrders: number;
  canceledOrders: number;
  
  // Tiempos promedio
  avgTimeToAccept: number;
  avgTimeToPickup: number;
  avgTimeInTransit: number;
  avgTotalTime: number;
  
  // Distancias
  totalDistance: number;
  avgDistance: number;
  avgSpeed: number;
  
  // Eficiencia
  onTimeRate: number; // % de entregas a tiempo
  acceptanceRate: number; // % de pedidos aceptados
  completionRate: number; // % de pedidos completados vs cancelados
  
  // Financiero
  totalEarnings: number;
  avgEarningsPerOrder: number;
  totalTips: number;
  
  // Rating
  averageRating: number;
  totalRatings: number;
}

class MetricsService {
  /**
   * Calcula las métricas de un pedido completado
   */
  async calculateOrderMetrics(orderId: string): Promise<OrderMetrics | null> {
    try {
      const orderDoc = await firestore().collection('orders').doc(orderId).get();
      
      if (!orderDoc.exists) {
        console.error('[MetricsService] Order not found:', orderId);
        return null;
      }
      
      const order = orderDoc.data();
      if (!order) return null;
      
      const timing = order.timing || {};
      const logistics = order.logistics || {};
      
      // Calcular tiempos entre estados
      const timeToAccept = this.calculateTimeDifference(timing.assignedAt, timing.acceptedAt);
      const timeToPickup = this.calculateTimeDifference(timing.acceptedAt, timing.pickedUpAt);
      const timeInTransit = this.calculateTimeDifference(timing.pickedUpAt, timing.arrivedAt);
      const totalTime = this.calculateTimeDifference(timing.assignedAt, timing.arrivedAt);
      
      // Distancias
      const estimatedDistance = logistics.distance || 0;
      const actualDistance = order.actualDistance || estimatedDistance; // Si se trackea GPS
      const distanceDeviation = Math.abs(actualDistance - estimatedDistance);
      
      // Velocidad promedio (km/h)
      const averageSpeed = totalTime > 0 ? (actualDistance / (totalTime / 60)) : 0;
      
      // Eficiencia
      const estimatedDuration = logistics.estimatedDuration || 0;
      const onTime = totalTime <= estimatedDuration;
      
      const metrics: OrderMetrics = {
        orderId,
        driverId: order.assignedDriverId || '',
        timeToAccept,
        timeToPickup,
        timeInTransit,
        totalTime,
        estimatedDistance,
        actualDistance,
        distanceDeviation,
        averageSpeed,
        onTime,
        acceptanceRate: 1, // Se calcula a nivel de driver
      };
      
      // Guardar métricas en Firestore
      await firestore()
        .collection('orderMetrics')
        .doc(orderId)
        .set({
          ...metrics,
          calculatedAt: firestore.FieldValue.serverTimestamp(),
        });
      
      // Actualizar KPIs del conductor
      await this.updateDriverKPIs(order.assignedDriverId, metrics);
      
      return metrics;
    } catch (error) {
      console.error('[MetricsService] Error calculating metrics:', error);
      return null;
    }
  }
  
  /**
   * Actualiza los KPIs del conductor
   */
  private async updateDriverKPIs(driverId: string, orderMetrics: OrderMetrics): Promise<void> {
    try {
      const driverRef = firestore().collection('drivers').doc(driverId);
      
      // Actualizar contadores y promedios
      await driverRef.update({
        'kpis.totalOrders': firestore.FieldValue.increment(1),
        'kpis.completedOrders': firestore.FieldValue.increment(1),
        'kpis.totalDistance': firestore.FieldValue.increment(orderMetrics.actualDistance),
        'kpis.onTimeDeliveries': orderMetrics.onTime ? firestore.FieldValue.increment(1) : firestore.FieldValue.increment(0),
        'kpis.lastUpdated': firestore.FieldValue.serverTimestamp(),
      });
      
      // Recalcular promedios
      await this.recalculateDriverAverages(driverId);
    } catch (error) {
      console.error('[MetricsService] Error updating driver KPIs:', error);
    }
  }
  
  /**
   * Recalcula los promedios del conductor
   */
  private async recalculateDriverAverages(driverId: string): Promise<void> {
    try {
      // Obtener todas las métricas del conductor del último mes
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const metricsSnapshot = await firestore()
        .collection('orderMetrics')
        .where('driverId', '==', driverId)
        .where('calculatedAt', '>=', thirtyDaysAgo)
        .get();
      
      if (metricsSnapshot.empty) return;
      
      let totalTimeToAccept = 0;
      let totalTimeToPickup = 0;
      let totalTimeInTransit = 0;
      let totalTime = 0;
      let totalSpeed = 0;
      let onTimeCount = 0;
      let count = 0;
      
      metricsSnapshot.forEach(doc => {
        const metrics = doc.data() as OrderMetrics;
        totalTimeToAccept += metrics.timeToAccept;
        totalTimeToPickup += metrics.timeToPickup;
        totalTimeInTransit += metrics.timeInTransit;
        totalTime += metrics.totalTime;
        totalSpeed += metrics.averageSpeed;
        if (metrics.onTime) onTimeCount++;
        count++;
      });
      
      const avgTimeToAccept = totalTimeToAccept / count;
      const avgTimeToPickup = totalTimeToPickup / count;
      const avgTimeInTransit = totalTimeInTransit / count;
      const avgTotalTime = totalTime / count;
      const avgSpeed = totalSpeed / count;
      const onTimeRate = (onTimeCount / count) * 100;
      
      // Actualizar en Firestore
      await firestore()
        .collection('drivers')
        .doc(driverId)
        .update({
          'kpis.avgTimeToAccept': avgTimeToAccept,
          'kpis.avgTimeToPickup': avgTimeToPickup,
          'kpis.avgTimeInTransit': avgTimeInTransit,
          'kpis.avgTotalTime': avgTotalTime,
          'kpis.avgSpeed': avgSpeed,
          'kpis.onTimeRate': onTimeRate,
        });
    } catch (error) {
      console.error('[MetricsService] Error recalculating averages:', error);
    }
  }
  
  /**
   * Obtiene los KPIs del conductor para un período
   */
  async getDriverKPIs(driverId: string, period: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<DriverKPIs | null> {
    try {
      const { start, end } = this.getPeriodRange(period);
      
      // Obtener todas las órdenes del conductor en el período
      const ordersSnapshot = await firestore()
        .collection('orders')
        .where('assignedDriverId', '==', driverId)
        .where('timing.completedAt', '>=', start)
        .where('timing.completedAt', '<=', end)
        .get();
      
      // Obtener métricas del período
      const metricsSnapshot = await firestore()
        .collection('orderMetrics')
        .where('driverId', '==', driverId)
        .where('calculatedAt', '>=', start)
        .where('calculatedAt', '<=', end)
        .get();
      
      // Calcular KPIs
      let totalOrders = ordersSnapshot.size;
      let completedOrders = 0;
      let canceledOrders = 0;
      let totalEarnings = 0;
      let totalTips = 0;
      let totalRatings = 0;
      let sumRatings = 0;
      
      ordersSnapshot.forEach(doc => {
        const order = doc.data();
        if (order.status === OrderStatus.COMPLETED || order.status === OrderStatus.DELIVERED) {
          completedOrders++;
          totalEarnings += order.pricing?.totalAmount || 0;
          totalTips += order.pricing?.tip || 0;
          
          if (order.rating?.score) {
            totalRatings++;
            sumRatings += order.rating.score;
          }
        } else if (order.status === OrderStatus.CANCELLED || order.status === OrderStatus.FAILED) {
          canceledOrders++;
        }
      });
      
      // Calcular promedios de métricas
      let totalDistance = 0;
      let avgTimeToAccept = 0;
      let avgTimeToPickup = 0;
      let avgTimeInTransit = 0;
      let avgTotalTime = 0;
      let avgSpeed = 0;
      let onTimeCount = 0;
      
      metricsSnapshot.forEach(doc => {
        const metrics = doc.data() as OrderMetrics;
        totalDistance += metrics.actualDistance;
        avgTimeToAccept += metrics.timeToAccept;
        avgTimeToPickup += metrics.timeToPickup;
        avgTimeInTransit += metrics.timeInTransit;
        avgTotalTime += metrics.totalTime;
        avgSpeed += metrics.averageSpeed;
        if (metrics.onTime) onTimeCount++;
      });
      
      const metricsCount = metricsSnapshot.size || 1;
      
      const kpis: DriverKPIs = {
        driverId,
        period,
        periodStart: start,
        periodEnd: end,
        totalOrders,
        completedOrders,
        canceledOrders,
        avgTimeToAccept: avgTimeToAccept / metricsCount,
        avgTimeToPickup: avgTimeToPickup / metricsCount,
        avgTimeInTransit: avgTimeInTransit / metricsCount,
        avgTotalTime: avgTotalTime / metricsCount,
        totalDistance,
        avgDistance: totalDistance / metricsCount,
        avgSpeed: avgSpeed / metricsCount,
        onTimeRate: (onTimeCount / metricsCount) * 100,
        acceptanceRate: 100, // Se calcula por separado
        completionRate: totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0,
        totalEarnings,
        avgEarningsPerOrder: completedOrders > 0 ? totalEarnings / completedOrders : 0,
        totalTips,
        averageRating: totalRatings > 0 ? sumRatings / totalRatings : 0,
        totalRatings,
      };
      
      return kpis;
    } catch (error) {
      console.error('[MetricsService] Error getting driver KPIs:', error);
      return null;
    }
  }
  
  /**
   * Calcula la diferencia de tiempo en minutos entre dos timestamps
   */
  private calculateTimeDifference(
    start: FirebaseFirestoreTypes.Timestamp | Date | undefined,
    end: FirebaseFirestoreTypes.Timestamp | Date | undefined
  ): number {
    if (!start || !end) return 0;
    
    const startDate = start instanceof Date ? start : (start as FirebaseFirestoreTypes.Timestamp).toDate();
    const endDate = end instanceof Date ? end : (end as FirebaseFirestoreTypes.Timestamp).toDate();
    
    const diffMs = endDate.getTime() - startDate.getTime();
    return diffMs / (1000 * 60); // Convertir a minutos
  }
  
  /**
   * Obtiene el rango de fechas para un período
   */
  private getPeriodRange(period: 'daily' | 'weekly' | 'monthly'): { start: Date; end: Date } {
    const end = new Date();
    const start = new Date();
    
    switch (period) {
      case 'daily':
        start.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        start.setDate(start.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        break;
      case 'monthly':
        start.setDate(start.getDate() - 30);
        start.setHours(0, 0, 0, 0);
        break;
    }
    
    return { start, end };
  }
  
  /**
   * Trackea el inicio de un pedido (cuando el conductor lo acepta)
   */
  async trackOrderStart(orderId: string, driverId: string): Promise<void> {
    try {
      await firestore()
        .collection('orderTracking')
        .doc(orderId)
        .set({
          orderId,
          driverId,
          startedAt: firestore.FieldValue.serverTimestamp(),
          checkpoints: [],
        });
    } catch (error) {
      console.error('[MetricsService] Error tracking order start:', error);
    }
  }
  
  /**
   * Trackea un checkpoint del pedido
   */
  async trackCheckpoint(orderId: string, checkpoint: string, location?: { latitude: number; longitude: number }): Promise<void> {
    try {
      await firestore()
        .collection('orderTracking')
        .doc(orderId)
        .update({
          checkpoints: firestore.FieldValue.arrayUnion({
            checkpoint,
            timestamp: new Date(),
            location,
          }),
        });
    } catch (error) {
      console.error('[MetricsService] Error tracking checkpoint:', error);
    }
  }
}

export default new MetricsService();

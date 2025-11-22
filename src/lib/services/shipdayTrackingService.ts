/**
 * Servicio optimizado para tracking con Shipday
 * Implementa caché, rate limiting y manejo inteligente de errores
 */

import { Order } from '@/hooks/useRealtimeData';

export interface ShipdayTrackingData {
  trackingLink?: string | null;
  status?: string;
  driverName?: string;
  estimatedDeliveryTime?: string;
  lastUpdated?: Date;
  progressPercentage?: number;
}

export interface ShipdayTrackingCache {
  [orderId: string]: {
    data: ShipdayTrackingData;
    timestamp: number;
    ttl: number; // Time to live in milliseconds
  };
}

class ShipdayTrackingService {
  private cache: ShipdayTrackingCache = {};
  private readonly CACHE_TTL = 30000; // 30 segundos para datos de tracking
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 segundo
  private requestQueue: Map<string, Promise<ShipdayTrackingData>> = new Map();

  /**
   * Obtiene información de tracking optimizada para un pedido
   */
  async getOrderTracking(order: Order): Promise<ShipdayTrackingData> {
    const cacheKey = order.id;
    
    // Verificar caché primero
    const cachedData = this.getFromCache(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // Verificar si ya hay una solicitud en curso para este pedido
    if (this.requestQueue.has(cacheKey)) {
      return this.requestQueue.get(cacheKey)!;
    }

    // Crear nueva solicitud
    const trackingPromise = this.fetchOrderTrackingWithRetry(order);
    this.requestQueue.set(cacheKey, trackingPromise);

    try {
      const result = await trackingPromise;
      this.addToCache(cacheKey, result);
      return result;
    } finally {
      this.requestQueue.delete(cacheKey);
    }
  }

  /**
   * Obtiene tracking para múltiples pedidos de forma optimizada
   */
  async getBulkTracking(orders: Order[]): Promise<Record<string, ShipdayTrackingData>> {
    const results: Record<string, ShipdayTrackingData> = {};
    const ordersToFetch: Order[] = [];

    // Primero verificar caché
    for (const order of orders) {
      const cachedData = this.getFromCache(order.id);
      if (cachedData) {
        results[order.id] = cachedData;
      } else {
        ordersToFetch.push(order);
      }
    }

    // Procesar pedidos restantes en lotes con delays
    const batchSize = 3;
    for (let i = 0; i < ordersToFetch.length; i += batchSize) {
      const batch = ordersToFetch.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (order, index) => {
        // Stagger requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, index * 300));
        
        try {
          const trackingData = await this.getOrderTracking(order);
          results[order.id] = trackingData;
        } catch (error) {
          console.error(`Error fetching tracking for order ${order.id}:`, error);
          results[order.id] = this.getFallbackTrackingData(order);
        }
      });

      await Promise.all(batchPromises);
    }

    return results;
  }

  /**
   * Actualiza tracking para pedidos recientes de forma inteligente
   */
  async updateRecentOrdersTracking(orders: Order[], maxRecent: number = 5): Promise<Record<string, ShipdayTrackingData>> {
    // Filtrar pedidos recientes y que necesiten actualización
    const recentOrders = orders
      .filter(order => {
        const cached = this.getFromCache(order.id);
        return !cached || this.shouldUpdateTracking(order, cached);
      })
      .sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, maxRecent);

    return this.getBulkTracking(recentOrders);
  }

  /**
   * Determina si un pedido necesita actualización de tracking
   */
  private shouldUpdateTracking(order: Order, cachedData: ShipdayTrackingData): boolean {
    const now = Date.now();
    const cacheEntry = this.cache[order.id];
    
    if (!cacheEntry) return true;
    
    // Actualizar más frecuentemente pedidos en tránsito
    const isActiveOrder = order.status && ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(order.status);
    const ttl = isActiveOrder ? this.CACHE_TTL / 2 : this.CACHE_TTL;
    
    return now - cacheEntry.timestamp > ttl;
  }

  private async fetchOrderTrackingWithRetry(order: Order, retryCount = 0): Promise<ShipdayTrackingData> {
    try {
      return await this.fetchOrderTracking(order);
    } catch (error) {
      if (retryCount < this.MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * Math.pow(2, retryCount)));
        return this.fetchOrderTrackingWithRetry(order, retryCount + 1);
      }
      throw error;
    }
  }

  private async fetchOrderTracking(order: Order): Promise<ShipdayTrackingData> {
    try {
      // CORRECCIÓN: Buscar por múltiples identificadores
      // Prioridad: shipdayOrderId > orderNumber original > orderNumber actual
      const identifiers = [
        order.shipdayOrderId,
        order.orderNumber
      ].filter(Boolean);

      for (const identifier of identifiers) {
        try {
          const trackingRes = await fetch(`/api/tracking/${identifier}`);
          if (trackingRes.ok) {
            const trackingData = await trackingRes.json();
            if (trackingData && trackingData.orderNumber) {
              return {
                trackingLink: trackingData.trackingLink || null,
                status: trackingData.status || order.status || 'pending',
                driverName: trackingData.driver?.name || 'Por asignar',
                lastUpdated: new Date(),
                progressPercentage: this.calculateFallbackProgress(trackingData.status || order.status)
              };
            }
          }
        } catch (err) {
          console.debug(`Failed to fetch tracking for identifier ${identifier}:`, err);
          continue;
        }
      }

      return this.getFallbackTrackingData(order);

    } catch (error) {
      console.error('Error obteniendo seguimiento de Shipday:', error);
      return this.getFallbackTrackingData(order);
    }
  }

  private calculateProgressPercentage(progress: any): number {
    if (!progress?.dynamicData?.orderStatus?.status) return 0;

    const status = progress.dynamicData.orderStatus.status;
    const statusProgress = {
      'pending': 10,
      'searching': 25,
      'assigned': 40,
      'picked_up': 75,
      'in_transit': 90,
      'delivered': 100,
      'completed': 100,
      'cancelled': 0,
      'failed': 0
    };

    return statusProgress[status.toLowerCase() as keyof typeof statusProgress] || 0;
  }

  private getFallbackTrackingData(order: Order): ShipdayTrackingData {
    return {
      status: order.status || 'pending',
      driverName: 'Conductor no asignado',  // Terminología correcta: conductor/carrier
      lastUpdated: new Date(),
      progressPercentage: this.calculateFallbackProgress(order.status)
    };
  }

  private calculateFallbackProgress(status?: string): number {
    const statusProgress = {
      'PENDING': 10,
      'SEARCHING': 25,
      'ASSIGNED': 40,
      'PICKED_UP': 75,
      'IN_TRANSIT': 90,
      'DELIVERED': 100,
      'COMPLETED': 100,
      'CANCELLED': 0,
      'FAILED': 0
    };

    return statusProgress[status as keyof typeof statusProgress] || 0;
  }

  private getFromCache(orderId: string): ShipdayTrackingData | null {
    const cacheEntry = this.cache[orderId];
    if (!cacheEntry) return null;

    const now = Date.now();
    if (now - cacheEntry.timestamp > cacheEntry.ttl) {
      delete this.cache[orderId];
      return null;
    }

    return cacheEntry.data;
  }

  private addToCache(orderId: string, data: ShipdayTrackingData): void {
    this.cache[orderId] = {
      data,
      timestamp: Date.now(),
      ttl: this.CACHE_TTL
    };
  }

  private resolveTrackingId(order: Order): string | null {
    const sanitize = (value: string | null | undefined): string | null => {
      if (!value) return null;
      const sanitized = value.split(/[?&]/)[0];
      return sanitized && sanitized !== '#' ? sanitized : null;
    };

    const directId = sanitize(order.trackingId as string | null);
    if (directId) {
      return directId;
    }

    const link = order.trackingLink;
    if (!link || link === '#') {
      return null;
    }

    try {
      const url = new URL(link);
      const paramKeys = ['trackingId', 'id', 'tracking_id'];
      for (const key of paramKeys) {
        const paramValue = sanitize(url.searchParams.get(key));
        if (paramValue) {
          return paramValue;
        }
      }

      const pathSegment = sanitize(url.pathname.split('/').filter(Boolean).pop());
      if (pathSegment) {
        return pathSegment;
      }
    } catch (error) {
      console.debug('No se pudo parsear trackingLink como URL, aplicando fallback básico', error);
    }

    return sanitize(link.split('/').pop());
  }

  /**
   * Limpia el caché para un pedido específico o todo el caché
   */
  clearCache(orderId?: string): void {
    if (orderId) {
      delete this.cache[orderId];
    } else {
      this.cache = {};
    }
  }

  /**
   * Obtiene estadísticas del caché
   */
  getCacheStats(): { size: number; hits: number } {
    return {
      size: Object.keys(this.cache).length,
      hits: Object.values(this.cache).length
    };
  }
}

// Exportar instancia singleton
export const shipdayTrackingService = new ShipdayTrackingService();
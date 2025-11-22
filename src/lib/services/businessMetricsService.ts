import { Business, Order } from '@/types';
import { normalizeOrderStatus } from '@/utils/orderStatusHelpers';

export interface BusinessMetrics {
  availableCredits: number;
  totalOrders: number;
  todayOrders: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalSpent: number;
  successRate: number;
  avgDeliveryTime: number;
  onTimePercentage: number;
  avgRating: number;
  revenueLast7Days: number;
  revenueLast30Days: number;
  orderTrend: 'up' | 'down' | 'stable';
  deliveryPerformance: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface OrderAnalytics {
  statusDistribution: {
    pending: number;
    assigned: number;
    picked_up: number;
    delivered: number;
    cancelled: number;
  };
  timeDistribution: {
    morning: number;
    afternoon: number;
    evening: number;
    night: number;
  };
  avgOrderValue: number;
  peakHours: string[];
}

export class BusinessMetricsService {
  static calculateMetrics(business: any | null, orders: Order[]): BusinessMetrics {
    if (!business) {
      return this.getDefaultMetrics();
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const todayOrders = orders.filter(order => {
      const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
      return orderDate >= today;
    });

    const last7DaysOrders = orders.filter(order => {
      const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
      return orderDate >= sevenDaysAgo;
    });

    const last30DaysOrders = orders.filter(order => {
      const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
      return orderDate >= thirtyDaysAgo;
    });

    const completedOrders = orders.filter(order => {
      const status = normalizeOrderStatus(order.status || '');
      return status === 'DELIVERED' || status === 'ALREADY_DELIVERED' || status === 'COMPLETED';
    });

    const pendingOrders = orders.filter(order => {
      const status = normalizeOrderStatus(order.status || '');
      return ['PENDING', 'NOT_ASSIGNED', 'NOT_ACCEPTED', 'NOT_STARTED_YET'].includes(status);
    });

    const cancelledOrders = orders.filter(order => normalizeOrderStatus(order.status || '') === 'CANCELLED');

    const totalSpent = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const revenueLast7Days = last7DaysOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const revenueLast30Days = last30DaysOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    const successfulDeliveries = completedOrders.length;
    const totalAttempted = orders.filter(order => normalizeOrderStatus(order.status || '') !== 'CANCELLED').length;
    const successRate = totalAttempted > 0 ? (successfulDeliveries / totalAttempted) * 100 : 0;

    // Calcular métricas de tiempo usando campos de Shipday activityLog
    const deliveriesWithTime = completedOrders.filter(order => 
      order.activityLog?.deliveryTime && order.activityLog?.placementTime
    );
    
    const deliveryTimes = deliveriesWithTime.map(order => {
      const deliveryTime = new Date(order.activityLog!.deliveryTime!).getTime();
      const placementTime = new Date(order.activityLog!.placementTime!).getTime();
      return Math.round((deliveryTime - placementTime) / (1000 * 60)); // minutos
    });
    
    const avgDeliveryTime = deliveryTimes.length > 0 
      ? deliveryTimes.reduce((sum, time) => sum + time, 0) / deliveryTimes.length 
      : 0;

    // Calcular entregas a tiempo usando expectedDeliveryTime de Shipday
    const onTimeDeliveries = deliveriesWithTime.filter(order => {
      if (!order.activityLog?.expectedDeliveryTime) return false;
      
      const deliveryTime = new Date(order.activityLog.deliveryTime!).getTime();
      const expectedTime = new Date(order.activityLog.expectedDeliveryTime).getTime();
      return deliveryTime <= expectedTime + (15 * 60 * 1000); // 15 min tolerancia
    }).length;

    const onTimePercentage = deliveriesWithTime.length > 0 
      ? (onTimeDeliveries / deliveriesWithTime.length) * 100 
      : 0;

    // Calcular calificación promedio usando feedback de Shipday
    const ratedOrders = completedOrders.filter(order => 
      order.feedback && typeof order.feedback === 'number' && order.feedback > 0
    );
    const avgRating = ratedOrders.length > 0 
      ? ratedOrders.reduce((sum, order) => sum + (order.feedback || 0), 0) / ratedOrders.length 
      : 0;

    // Calculate order trend
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayOrders = orders.filter(order => {
      const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
      return orderDate >= yesterday && orderDate < today;
    });

    const orderTrend = todayOrders.length > yesterdayOrders.length ? 'up' 
      : todayOrders.length < yesterdayOrders.length ? 'down' 
      : 'stable';

    // Delivery performance rating
    let deliveryPerformance: BusinessMetrics['deliveryPerformance'] = 'fair';
    if (onTimePercentage >= 90) deliveryPerformance = 'excellent';
    else if (onTimePercentage >= 75) deliveryPerformance = 'good';
    else if (onTimePercentage >= 60) deliveryPerformance = 'fair';
    else deliveryPerformance = 'poor';

    return {
      availableCredits: business.availableCredits || business.credits || 0,
      totalOrders: orders.length,
      todayOrders: todayOrders.length,
      pendingOrders: pendingOrders.length,
      completedOrders: completedOrders.length,
      cancelledOrders: cancelledOrders.length,
      totalSpent,
      successRate: Math.round(successRate * 100) / 100,
      avgDeliveryTime: Math.round(avgDeliveryTime),
      onTimePercentage: Math.round(onTimePercentage * 100) / 100,
      avgRating: Math.round(avgRating * 10) / 10,
      revenueLast7Days,
      revenueLast30Days,
      orderTrend,
      deliveryPerformance
    };
  }

  static analyzeOrders(orders: Order[]): OrderAnalytics {
    const statusDistribution = {
      pending: orders.filter(order => {
        const status = normalizeOrderStatus(order.status || '');
        return ['PENDING', 'NOT_ASSIGNED', 'NOT_ACCEPTED', 'NOT_STARTED_YET'].includes(status);
      }).length,
      assigned: orders.filter(order => {
        const status = normalizeOrderStatus(order.status || '');
        return ['ASSIGNED', 'STARTED'].includes(status);
      }).length,
      picked_up: orders.filter(order => {
        const status = normalizeOrderStatus(order.status || '');
        return ['PICKED_UP', 'READY_FOR_PICKUP', 'AT_PICKUP'].includes(status);
      }).length,
      delivered: orders.filter(order => {
        const status = normalizeOrderStatus(order.status || '');
        return ['DELIVERED', 'ALREADY_DELIVERED', 'COMPLETED'].includes(status);
      }).length,
      cancelled: orders.filter(order => normalizeOrderStatus(order.status || '') === 'CANCELLED').length,
    };

    const timeDistribution = {
      morning: 0,
      afternoon: 0,
      evening: 0,
      night: 0,
    };

    const hourlyCount: number[] = new Array(24).fill(0);

    orders.forEach(order => {
      const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
      const hour = orderDate.getHours();
      
      hourlyCount[hour]++;
      
      if (hour >= 6 && hour < 12) timeDistribution.morning++;
      else if (hour >= 12 && hour < 18) timeDistribution.afternoon++;
      else if (hour >= 18 && hour < 22) timeDistribution.evening++;
      else timeDistribution.night++;
    });

    const maxOrders = Math.max(...hourlyCount);
    const peakHours = hourlyCount
      .map((count, hour) => ({ hour, count }))
      .filter(item => item.count === maxOrders)
      .map(item => `${item.hour}:00`);

    const totalAmount = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const avgOrderValue = orders.length > 0 ? totalAmount / orders.length : 0;

    return {
      statusDistribution,
      timeDistribution,
      avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      peakHours
    };
  }

  static getPerformanceColor(performance: BusinessMetrics['deliveryPerformance']): string {
    switch (performance) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-green-500';
      case 'fair': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  }

  static getPerformanceIcon(performance: BusinessMetrics['deliveryPerformance']): string {
    switch (performance) {
      case 'excellent': return '🚀';
      case 'good': return '👍';
      case 'fair': return '⚠️';
      case 'poor': return '❌';
      default: return '📊';
    }
  }

  private static getDefaultMetrics(): BusinessMetrics {
    return {
      availableCredits: 0,
      totalOrders: 0,
      todayOrders: 0,
      pendingOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0,
      totalSpent: 0,
      successRate: 0,
      avgDeliveryTime: 0,
      onTimePercentage: 0,
      avgRating: 0,
      revenueLast7Days: 0,
      revenueLast30Days: 0,
      orderTrend: 'stable',
      deliveryPerformance: 'fair'
    };
  }
}
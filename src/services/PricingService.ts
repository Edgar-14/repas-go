// Servicio de Cálculo de Precios y Ganancias para BeFast GO
import { firestore, COLLECTIONS } from '../config/firebase';

/**
 * Configuración de tarifas según documento oficial
 * - Tarifa base: 45.0 MXN (hasta 3.0 km)
 * - Tarifa adicional: 2.5 MXN por km (después de 3.0 km)
 * - Propinas: 100% al conductor
 * - Comisión BeFast: 15.0 MXN por pedido
 */
interface PricingConfig {
  baseFee: number;
  baseFeeDistance: number;
  perKmFee: number;
  tipPercentage: number;
  befastCommission: number;
}

const DEFAULT_PRICING: PricingConfig = {
  baseFee: 45.0,           // MXN
  baseFeeDistance: 3.0,    // km
  perKmFee: 2.5,           // MXN/km
  tipPercentage: 100.0,    // % al conductor
  befastCommission: 15.0   // MXN fijo por pedido
};

/**
 * Factores de exclusión por tipo de vehículo del REPARTIDOR
 * Para clasificación laboral (cálculo de ingresos netos)
 * Según documento oficial BeFast
 */
const VEHICLE_EXCLUSION_FACTORS = {
  'AUTO': 0.36,       // Auto (4 ruedas): 36%
  'MOTO': 0.30,       // Moto (2 ruedas): 30%
  'SCOOTER': 0.30,    // Scooter (2 ruedas): 30%
  'BICICLETA': 0.12,  // Bicicleta: 12%
  'PIE': 0.12         // A pie: 12%
};

/**
 * Servicio de cálculo de precios, ganancias y clasificación laboral
 */
class PricingService {
  private pricingConfig: PricingConfig;

  constructor() {
    this.pricingConfig = DEFAULT_PRICING;
  }

  /**
   * Calcula el precio total del pedido basado en la distancia
   * Fórmula: (45 MXN hasta 3 km) + (2.5 MXN/km después de 3 km) + propina
   */
  calculateOrderTotal(distanceKm: number, tipAmount: number = 0): {
    baseFee: number;
    distanceFee: number;
    tip: number;
    totalBeforeTip: number;
    total: number;
  } {
    const { baseFee, baseFeeDistance, perKmFee } = this.pricingConfig;
    
    let distanceFee = 0;
    
    // Si la distancia excede la distancia base, calcular tarifa adicional
    if (distanceKm > baseFeeDistance) {
      const extraDistance = distanceKm - baseFeeDistance;
      distanceFee = extraDistance * perKmFee;
    }
    
    const totalBeforeTip = baseFee + distanceFee;
    const total = totalBeforeTip + tipAmount;
    
    return {
      baseFee,
      distanceFee: parseFloat(distanceFee.toFixed(2)),
      tip: tipAmount,
      totalBeforeTip: parseFloat(totalBeforeTip.toFixed(2)),
      total: parseFloat(total.toFixed(2))
    };
  }

  /**
   * Calcula la ganancia neta del conductor
   * - Pedido con tarjeta: Total - Comisión BeFast (15 MXN) + 100% propina
   * - Pedido en efectivo: El conductor ya tiene el efectivo, solo se registra deuda de 15 MXN
   */
  calculateDriverEarnings(
    orderTotal: number,
    tipAmount: number,
    paymentMethod: 'CASH' | 'CARD'
  ): {
    grossAmount: number;
    befastCommission: number;
    netEarnings: number;
    tipEarnings: number;
    totalDriverEarnings: number;
    debtAmount: number;
  } {
    const { befastCommission } = this.pricingConfig;
    
    if (paymentMethod === 'CARD') {
      // Pedido con tarjeta: BeFast cobra al cliente
      const grossAmount = orderTotal - tipAmount;
      const netEarnings = grossAmount - befastCommission;
      const tipEarnings = tipAmount; // 100% al conductor
      const totalDriverEarnings = netEarnings + tipEarnings;
      
      return {
        grossAmount: parseFloat(grossAmount.toFixed(2)),
        befastCommission,
        netEarnings: parseFloat(netEarnings.toFixed(2)),
        tipEarnings: parseFloat(tipEarnings.toFixed(2)),
        totalDriverEarnings: parseFloat(totalDriverEarnings.toFixed(2)),
        debtAmount: 0
      };
    } else {
      // Pedido en efectivo: Conductor cobra al cliente
      // No se transfiere dinero, solo se registra deuda
      return {
        grossAmount: orderTotal,
        befastCommission,
        netEarnings: 0, // No se transfiere
        tipEarnings: 0, // Ya lo tiene en efectivo
        totalDriverEarnings: 0, // Ya lo tiene en efectivo
        debtAmount: befastCommission // Deuda de 15 MXN
      };
    }
  }

  /**
   * Calcula la clasificación laboral del REPARTIDOR
   * Basado en ingresos del primer mes y factor de exclusión por tipo de vehículo
   * 
   * Fórmula según documento oficial:
   * Ingreso Neto = Ingreso Bruto Mensual - (Ingreso Bruto Mensual * Factor de Exclusión)
   * 
   * Factores de Exclusión:
   * - Auto (4 ruedas): 36%
   * - Moto / Scooter (2 ruedas): 30%
   * - Bicicleta / Pie: 12%
   */
  calculateLaborClassification(
    grossMonthlyIncome: number,
    vehicleType: string
  ): {
    grossIncome: number;
    exclusionFactor: number;
    netIncome: number;
    minimumWage: number;
    classification: 'EMPLEADO_COTIZANTE' | 'TRABAJADOR_INDEPENDIENTE';
    exceedsMinimum: boolean;
  } {
    const minimumWageReference = 8364; // MXN (Salario mínimo de referencia según documento)
    
    // Obtener factor de exclusión según tipo de vehículo del repartidor
    const vehicleTypeUpper = vehicleType.toUpperCase();
    const exclusionFactor = VEHICLE_EXCLUSION_FACTORS[vehicleTypeUpper] || 0.30;
    
    // Cálculo: Ingreso Neto = Ingreso Bruto - (Ingreso Bruto * Factor de Exclusión)
    const netIncome = grossMonthlyIncome - (grossMonthlyIncome * exclusionFactor);
    
    // Comparar con salario mínimo
    const exceedsMinimum = netIncome >= minimumWageReference;
    
    const classification = exceedsMinimum 
      ? 'EMPLEADO_COTIZANTE' 
      : 'TRABAJADOR_INDEPENDIENTE';
    
    return {
      grossIncome: parseFloat(grossMonthlyIncome.toFixed(2)),
      exclusionFactor,
      netIncome: parseFloat(netIncome.toFixed(2)),
      minimumWage: minimumWageReference,
      classification,
      exceedsMinimum
    };
  }

  /**
   * Calcula la distancia entre dos puntos usando Google Maps Distance Matrix API
   * CRÍTICO: Debe usar Google Maps para evitar discrepancias con los cálculos del cliente
   * Retorna la distancia en kilómetros
   */
  async calculateDistance(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number
  ): Promise<number> {
    try {
      // Usar Google Maps Distance Matrix API para obtener la distancia real de ruta
      const apiKey = 'YOUR_GOOGLE_MAPS_API_KEY'; // Debe configurarse
      const origin = `${originLat},${originLng}`;
      const destination = `${destLat},${destLng}`;
      
      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destination}&key=${apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK' && data.rows[0]?.elements[0]?.status === 'OK') {
        const distanceInMeters = data.rows[0].elements[0].distance.value;
        const distanceInKm = distanceInMeters / 1000;
        return parseFloat(distanceInKm.toFixed(2));
      } else {
        throw new Error('No se pudo calcular la distancia con Google Maps');
      }
    } catch (error) {
      console.error('Error calculating distance with Google Maps:', error);
      throw new Error('Error al calcular distancia. Verifica la configuración de Google Maps API.');
    }
  }

  /**
   * Calcula la distancia total del pedido (pickup -> delivery) usando Google Maps
   * CRÍTICO: Usa Google Maps Distance Matrix API para coincidir con cálculos del cliente
   */
  async calculateOrderDistance(
    pickupLat: number,
    pickupLon: number,
    deliveryLat: number,
    deliveryLon: number
  ): Promise<number> {
    return await this.calculateDistance(pickupLat, pickupLon, deliveryLat, deliveryLon);
  }

  /**
   * Calcula la distancia del conductor al punto de recogida usando Google Maps
   */
  async calculateDriverToPickupDistance(
    driverLat: number,
    driverLon: number,
    pickupLat: number,
    pickupLon: number
  ): Promise<number> {
    return await this.calculateDistance(driverLat, driverLon, pickupLat, pickupLon);
  }

  /**
   * Estima el tiempo de entrega basado en la distancia
   * Asume velocidad promedio de 30 km/h en ciudad
   */
  estimateDeliveryTime(distanceKm: number): number {
    const averageSpeedKmh = 30;
    const timeInHours = distanceKm / averageSpeedKmh;
    const timeInMinutes = Math.ceil(timeInHours * 60);
    
    return timeInMinutes;
  }

  /**
   * Calcula el score de asignación basado en varios factores
   * - Distancia al pickup (más cerca es mejor)
   * - Número de pedidos activos (menos es mejor)
   * - Rating del conductor (más alto es mejor)
   */
  calculateAssignmentScore(
    driverToPickupKm: number,
    activeOrdersCount: number,
    driverRating: number,
    maxActiveOrders: number = 3
  ): number {
    // Factor de distancia (0-1, más cerca es mejor)
    const maxReasonableDistance = 10; // km
    const distanceFactor = Math.max(0, 1 - (driverToPickupKm / maxReasonableDistance));
    
    // Factor de carga (0-1, menos pedidos es mejor)
    const loadFactor = Math.max(0, 1 - (activeOrdersCount / maxActiveOrders));
    
    // Factor de rating (0-1)
    const ratingFactor = driverRating / 5.0;
    
    // Score final (promedio ponderado)
    const score = (
      distanceFactor * 0.5 +  // 50% peso en distancia
      loadFactor * 0.3 +       // 30% peso en carga
      ratingFactor * 0.2       // 20% peso en rating
    );
    
    return parseFloat(score.toFixed(3));
  }

  /**
   * Convierte grados a radianes
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Actualiza la configuración de precios
   * (para casos especiales o promociones)
   */
  updatePricingConfig(config: Partial<PricingConfig>): void {
    this.pricingConfig = {
      ...this.pricingConfig,
      ...config
    };
  }

  /**
   * Obtiene la configuración actual de precios
   */
  getPricingConfig(): PricingConfig {
    return { ...this.pricingConfig };
  }
}

// Exportar instancia singleton
export default new PricingService();

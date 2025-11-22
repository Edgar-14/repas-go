import { firestore, COLLECTIONS } from '../config/firebase';

interface PricingConfig {
  baseFee: number;
  baseFeeDistance: number;
  perKmFee: number;
  tipPercentage: number;
  befastCommission: number;
}

const DEFAULT_PRICING: PricingConfig = {
  baseFee: 45.0,
  baseFeeDistance: 3.0,
  perKmFee: 2.5,
  tipPercentage: 100.0,
  befastCommission: 15.0
};

const VEHICLE_EXCLUSION_FACTORS = {
  'AUTO': 0.36,
  'MOTO': 0.30,
  'SCOOTER': 0.30,
  'BICICLETA': 0.12,
  'PIE': 0.12
};

class PricingService {
  private pricingConfig: PricingConfig;

  constructor() {
    this.pricingConfig = DEFAULT_PRICING;
  }

  calculateOrderTotal(distanceKm: number, tipAmount: number = 0) {
    const { baseFee, baseFeeDistance, perKmFee } = this.pricingConfig;
    
    let distanceFee = 0;
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

  calculateDriverEarnings(orderTotal: number, tipAmount: number, paymentMethod: 'CASH' | 'CARD') {
    const { befastCommission } = this.pricingConfig;
    
    if (paymentMethod === 'CARD') {
      const grossAmount = orderTotal - tipAmount;
      const netEarnings = grossAmount - befastCommission;
      const tipEarnings = tipAmount;
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
      return {
        grossAmount: orderTotal,
        befastCommission,
        netEarnings: 0,
        tipEarnings: 0,
        totalDriverEarnings: 0,
        debtAmount: befastCommission
      };
    }
  }

  calculateLaborClassification(grossMonthlyIncome: number, vehicleType: string) {
    const minimumWageReference = 8364;
    const vehicleTypeUpper = vehicleType.toUpperCase() as keyof typeof VEHICLE_EXCLUSION_FACTORS;
    const exclusionFactor = VEHICLE_EXCLUSION_FACTORS[vehicleTypeUpper] || 0.30;
    
    const netIncome = grossMonthlyIncome - (grossMonthlyIncome * exclusionFactor);
    const exceedsMinimum = netIncome >= minimumWageReference;
    const classification = exceedsMinimum ? 'EMPLEADO_COTIZANTE' : 'TRABAJADOR_INDEPENDIENTE';
    
    return {
      grossIncome: parseFloat(grossMonthlyIncome.toFixed(2)),
      exclusionFactor,
      netIncome: parseFloat(netIncome.toFixed(2)),
      minimumWage: minimumWageReference,
      classification,
      exceedsMinimum
    };
  }

  estimateDeliveryTime(distanceKm: number): number {
    const averageSpeedKmh = 30;
    const timeInHours = distanceKm / averageSpeedKmh;
    return Math.ceil(timeInHours * 60);
  }

  calculateAssignmentScore(driverToPickupKm: number, activeOrdersCount: number, driverRating: number, maxActiveOrders: number = 3): number {
    const maxReasonableDistance = 10;
    const distanceFactor = Math.max(0, 1 - (driverToPickupKm / maxReasonableDistance));
    const loadFactor = Math.max(0, 1 - (activeOrdersCount / maxActiveOrders));
    const ratingFactor = driverRating / 5.0;
    
    const score = (distanceFactor * 0.5) + (loadFactor * 0.3) + (ratingFactor * 0.2);
    return parseFloat(score.toFixed(3));
  }

  updatePricingConfig(config: Partial<PricingConfig>): void {
    this.pricingConfig = { ...this.pricingConfig, ...config };
  }

  getPricingConfig(): PricingConfig {
    return { ...this.pricingConfig };
  }
}

export default new PricingService();

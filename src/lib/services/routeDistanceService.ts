/**
 * Route Distance Service
 * Manages distance calculations using Google Maps Directions API
 * 
 * CRITICAL: Uses same API as Shipday (Google Maps) to ensure ZERO discrepancies
 * NO FALLBACK to straight-line distance - that causes variable price differences
 * 
 * WHY THIS MATTERS:
 * - Shipday uses Google Maps Directions API internally
 * - Straight-line distance ignores actual road network
 * - Discrepancy varies by route complexity (can be $2, $4, $10+ depending on detours)
 * - Using same API = same distance = same price
 * 
 * PROBLEM: Previously used Haversine (straight-line) fallback causing discrepancies
 * SOLUTION: Always use Google Maps Directions API (same as Shipday uses internally)
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface DistanceCalculationResult {
  distanceKm: number;
  deliveryFee: number;
  calculationMethod: 'google-maps-directions';
  calculatedAt: Date;
  warning?: string;
}

/**
 * REMOVED: Haversine formula (straight-line distance)
 * REASON: Causes variable discrepancies vs Shipday's actual routing
 * 
 * Straight-line distance ignores:
 * - Actual roads and streets (increases distance 20-50% typically)
 * - Traffic patterns and optimal routes
 * - One-way streets
 * - Construction detours
 * - Geographic obstacles (rivers, buildings, mountains, etc.)
 * 
 * IMPACT: Price differences vary by route:
 * - Simple grid routes: $1-2 difference
 * - Complex urban routes: $3-5 difference  
 * - Routes with obstacles: $5-10+ difference
 * 
 * This was causing inconsistent pricing errors in production.
 */

/**
 * Calculate delivery fee based on distance
 * Algorithm matches Shipday's pricing model exactly
 */
export function calculateDeliveryFeeFromDistance(distanceKm: number): number {
  const BASE_FEE = 45; // Base fee in MXN
  const EXTRA_FEE_PER_KM = 2.5; // Extra fee per km after limit  
  const DISTANCE_LIMIT = 3; // Free distance limit in km

  let total = BASE_FEE;
  
  // Use exact distance (not rounded up) to match Shipday
  if (distanceKm > DISTANCE_LIMIT) {
    const extraDistance = distanceKm - DISTANCE_LIMIT;
    total += extraDistance * EXTRA_FEE_PER_KM;
  }
  
  // Round to nearest cent like Shipday does
  return Math.round(total * 100) / 100;
}

/**
 * Get distance and fee calculation using Google Maps Directions API
 * @param pickupCoords - Pickup location coordinates
 * @param deliveryCoords - Delivery location coordinates
 * @returns Distance calculation result (or throws error)
 */
export async function calculateRouteDistance(
  pickupCoords: Coordinates,
  deliveryCoords: Coordinates
): Promise<DistanceCalculationResult> {
  try {
    // Use Google Maps Directions API (same as Shipday uses internally)
    const response = await fetch('/api/shipday/calculate-fee', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ pickupCoords, deliveryCoords })
    });

    if (response.ok) {
      const result = await response.json();
      
      if (result.success && result.data) {
        console.log('✅ Route distance calculated using Google Maps Directions API (real driving distance)');
        return {
          distanceKm: result.data.distanceKm,
          deliveryFee: result.data.deliveryFee,
          calculationMethod: 'google-maps-directions',
          calculatedAt: new Date()
        };
      }
    }

    throw new Error(`API unavailable or returned error: ${response.status}`);

  } catch (error) {
    // NO FALLBACK - Better to show error than wrong price
    console.error('❌ Cannot calculate route distance - Google Maps API unavailable:', error);
    throw new Error('No se pudo calcular la distancia de la ruta. Por favor intenta de nuevo.');
  }
}

/**
 * Validate that distance calculation is reasonable
 * Helps detect errors in coordinate data
 */
export function validateDistanceCalculation(result: DistanceCalculationResult): {
  valid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  
  // Check for suspiciously short distances (< 100m)
  if (result.distanceKm < 0.1) {
    warnings.push('Distancia muy corta (< 100m). Verificar coordenadas.');
  }
  
  // Check for suspiciously long distances (> 50km)
  if (result.distanceKm > 50) {
    warnings.push('Distancia muy larga (> 50km). Verificar coordenadas.');
  }
  
  return {
    valid: warnings.length === 0,
    warnings
  };
}

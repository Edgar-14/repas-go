// Pricing Service for BeFast Delivery
// Handles delivery fee calculations based on distance
// UPDATED: Algoritmo ajustado para coincidir exactamente con Shipday

// Calculate delivery fee based on distance in kilometers
// Algoritmo ajustado para coincidir con el cálculo de Shipday
export function calculateDeliveryFee(distanceKm: number): number {
  const BASE_FEE = 45; // Base fee in MXN
  const EXTRA_FEE_PER_KM = 2.5; // Extra fee per km after limit  
  const DISTANCE_LIMIT = 3; // Free distance limit in km

  let total = BASE_FEE;
  
  // Shipday usa distancia exacta (no redondeada hacia arriba)
  if (distanceKm > DISTANCE_LIMIT) {
    const extraDistance = distanceKm - DISTANCE_LIMIT; // Sin Math.ceil
    total += extraDistance * EXTRA_FEE_PER_KM;
  }
  
  // Redondear al centavo más cercano como hace Shipday
  return Math.round(total * 100) / 100;
}

// Función para obtener cálculo usando Google Maps Directions API
// USA LA MISMA API QUE SHIPDAY: Google Maps para distancia real de conducción
// NO HAY FALLBACK con distancia en línea recta - eso causa discrepancias variables en el precio
export async function calculateDeliveryFeeWithShipday(
  pickupCoords: {lat: number, lng: number}, 
  deliveryCoords: {lat: number, lng: number}
): Promise<{fee: number, source: 'google-maps-directions' | 'error', distanceKm: number}> {
  try {
    // Usar Google Maps Directions API (misma que Shipday usa internamente)
    const response = await fetch('/api/shipday/calculate-fee', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ pickupCoords, deliveryCoords })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Using Google Maps Directions API (real driving distance)');
      return {
        fee: result.data.deliveryFee,
        source: 'google-maps-directions',
        distanceKm: result.data.distanceKm
      };
    }
    
    throw new Error(`API returned ${response.status}`);
  } catch (error) {
    // NO USAR FALLBACK - Mejor mostrar error que dar precio incorrecto
    console.error('❌ Cannot calculate delivery fee - Google Maps API unavailable:', error);
    throw new Error('No se pudo calcular la tarifa de envío. Por favor intenta de nuevo.');
  }
}

/**
 * Get pricing breakdown for transparency
 * @param distanceKm - Distance in kilometers
 * @returns Detailed pricing breakdown
 */
export function getPricingBreakdown(distanceKm: number) {
  const BASE_FEE = 45;
  const EXTRA_FEE_PER_KM = 2.5;
  const DISTANCE_LIMIT = 3;

  // CORREGIDO: Usar distancia exacta sin redondear
  const extraDistance = Math.max(0, distanceKm - DISTANCE_LIMIT);
  const extraFee = extraDistance * EXTRA_FEE_PER_KM;
  const total = BASE_FEE + extraFee;

  return {
    distanceKm: Number(distanceKm.toFixed(2)),
    baseFee: BASE_FEE,
    extraDistance: Number(extraDistance.toFixed(2)),
    extraFee: Number(extraFee.toFixed(2)),
    total: Math.round(total * 100) / 100 // Redondear al centavo más cercano
  };
}
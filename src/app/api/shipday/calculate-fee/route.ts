/**
 * Shipday Calculate Fee API
 * Calcula distancia real usando Google Maps Directions API
 * 
 * CRITICAL: Debe usar la misma fuente de distancia que Shipday para evitar discrepancias
 * - Shipday usa Google Maps internamente para calcular rutas
 * - Distancia en línea recta (Haversine) causa errores variables en el costo
 * - La diferencia depende de la complejidad de la ruta (calles, tráfico, desvíos)
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { pickupCoords, deliveryCoords } = await request.json();
    
    console.log('🧮 Calculating delivery fee with Google Maps Directions API...');
    
    if (!pickupCoords || !deliveryCoords) {
      return NextResponse.json({
        success: false,
        error: 'Missing coordinates',
        details: 'Both pickupCoords and deliveryCoords are required'
      }, { status: 400 });
    }

    const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!googleMapsApiKey) {
      throw new Error('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY no está configurado');
    }

    // USAR GOOGLE MAPS DIRECTIONS API para obtener distancia REAL de conducción
    // Esto es lo mismo que usa Shipday internamente, por lo que evita discrepancias
    console.log('📍 Calculating route with Google Maps Directions API:', {
      pickup: pickupCoords,
      delivery: deliveryCoords
    });

    const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${pickupCoords.lat},${pickupCoords.lng}&destination=${deliveryCoords.lat},${deliveryCoords.lng}&mode=driving&key=${googleMapsApiKey}`;
    
    const directionsResponse = await fetch(directionsUrl);
    
    if (!directionsResponse.ok) {
      throw new Error(`Google Maps API error: ${directionsResponse.status}`);
    }

    const directionsData = await directionsResponse.json();
    
    if (directionsData.status !== 'OK' || !directionsData.routes || directionsData.routes.length === 0) {
      throw new Error(`No se pudo calcular la ruta: ${directionsData.status}`);
    }

    // Obtener distancia real de la ruta (en metros)
    const distanceInMeters = directionsData.routes[0]?.legs[0]?.distance?.value;
    
    if (typeof distanceInMeters !== 'number') {
      throw new Error('No se pudo obtener la distancia de la ruta');
    }

    const distanceKm = distanceInMeters / 1000;
    
    console.log(`✅ Real driving distance calculated: ${distanceKm.toFixed(2)} km`);

    // Calcular tarifa usando el mismo algoritmo que Shipday
    const BASE_FEE = 45;
    const EXTRA_FEE_PER_KM = 2.5;
    const DISTANCE_LIMIT = 3;
    
    let deliveryFee = BASE_FEE;
    if (distanceKm > DISTANCE_LIMIT) {
      const extraDistance = distanceKm - DISTANCE_LIMIT;
      deliveryFee += extraDistance * EXTRA_FEE_PER_KM;
    }
    
    deliveryFee = Math.round(deliveryFee * 100) / 100; // Redondear a 2 decimales

    return NextResponse.json({
      success: true,
      data: {
        distanceKm: distanceKm,
        deliveryFee: deliveryFee,
        calculation: 'google-maps-directions',
        coordinates: {
          pickup: pickupCoords,
          delivery: deliveryCoords
        }
      },
      message: 'Tarifa calculada usando distancia real de Google Maps (mismo que Shipday)'
    });

  } catch (error: any) {
    console.error('❌ Error calculating delivery fee:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to calculate delivery fee',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
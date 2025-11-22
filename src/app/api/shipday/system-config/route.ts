/**
 * Shipday System Configuration API
 * Verifica la configuración del sistema: país, divisa, zona horaria, unidades
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔧 Getting system configuration...');
    
    // Configuración actual del sistema BeFast
    const systemConfig = {
      country: {
        name: 'México',
        code: 'MX',
        iso: 'MEX'
      },
      currency: {
        name: 'Mexican Peso',
        code: 'MXN',
        symbol: '$',
        shipdayCode: 484 // Código ISO 4217 para peso mexicano
      },
      timezone: {
        name: 'America/Mexico_City',
        offset: 'UTC-06:00',
        displayName: 'Hora del Centro de México',
        currentTime: new Date().toLocaleString('es-MX', { 
          timeZone: 'America/Mexico_City',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        })
      },
      distanceUnit: {
        primary: 'kilometers',
        symbol: 'km',
        shipdayUnit: 'km'
      },
      locale: {
        language: 'es-MX',
        numberFormat: 'es-MX',
        currencyFormat: 'es-MX'
      },
      shipday: {
        currencyCode: 484, // Peso mexicano
        countryCode: 484,  // México
        timezone: 'America/Mexico_City',
        distanceUnit: 'km'
      }
    };
    
    console.log('✅ System configuration retrieved successfully');
    
    return NextResponse.json({
      success: true,
      data: systemConfig,
      message: 'Configuración del sistema obtenida exitosamente',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Error getting system configuration:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get system configuration',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
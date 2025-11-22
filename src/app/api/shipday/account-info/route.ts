/**
 * Shipday Account Information API
 * Obtiene la información real de la cuenta de Shipday incluyendo configuración del sistema
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔧 Getting account information from Shipday...');
    
    const apiKey = process.env.SHIPDAY_API_KEY;
    if (!apiKey) {
      throw new Error('SHIPDAY_API_KEY no está configurado');
    }

    // Obtener información de la cuenta consultando los carriers (que incluye info de company)
    const carriersResponse = await fetch('https://api.shipday.com/carriers', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Basic ${apiKey}`,
      },
    });

    if (!carriersResponse.ok) {
      throw new Error(`Error ${carriersResponse.status}: ${carriersResponse.statusText}`);
    }

    const carriersData = await carriersResponse.json();
    
    // También intentar obtener una orden reciente para ver la configuración de company
    let companyConfig = null;
    try {
      const ordersResponse = await fetch('https://api.shipday.com/orders', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Basic ${apiKey}`,
        },
      });

      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        // Si hay órdenes, extraer la configuración de company de la primera orden
        if (ordersData && ordersData.length > 0 && ordersData[0].companyId) {
          companyConfig = {
            companyId: ordersData[0].companyId,
            // La configuración completa vendría en webhooks, pero podemos inferir algunos datos
          };
        }
      }
    } catch (error) {
      console.log('No se pudieron obtener órdenes para extraer configuración de company');
    }

    // Mapear códigos conocidos
    const currencyMap: { [key: number]: string } = {
      484: 'MXN', // Peso mexicano
      840: 'USD', // Dólar estadounidense
      124: 'CAD', // Dólar canadiense
    };

    const countryMap: { [key: number]: string } = {
      134: 'México',
      840: 'Estados Unidos',
      124: 'Canadá',
    };

    const accountInfo = {
      carriers: {
        total: carriersData?.length || 0,
        active: carriersData?.filter((c: any) => c.isActive)?.length || 0,
        list: carriersData?.slice(0, 3) || [] // Primeros 3 para verificar
      },
      company: companyConfig,
      systemConfig: {
        // Basado en la documentación, estos son los valores esperados para México
        expectedCurrencyCode: 484, // Peso mexicano
        expectedCountryCode: 134,  // México (basado en el ejemplo de la documentación)
        expectedTimezone: 'America/Mexico_City',
        expectedDistanceUnit: 'kilometers',
        
        // Configuración actual detectada del sistema
        detectedLocale: 'es-MX',
        detectedTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
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
      verification: {
        apiKeyConfigured: !!apiKey,
        carriersAccessible: carriersResponse.ok,
        totalCarriers: carriersData?.length || 0
      }
    };
    
    console.log('✅ Account information retrieved successfully');
    
    return NextResponse.json({
      success: true,
      data: accountInfo,
      message: 'Información de cuenta obtenida exitosamente',
      note: 'Para ver la configuración completa de currency_code y country, revisa los webhooks de órdenes completadas',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Error getting account information from Shipday:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get account information from Shipday',
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
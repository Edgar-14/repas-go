/**
 * Shipday Drivers API
 * Obtiene y gestiona repartidores de Shipday
 */
import { NextRequest, NextResponse } from 'next/server';
import { getShipdayService } from '@/lib/services/shipdayService';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Getting drivers from Shipday...');
    
    const shipdayService = getShipdayService();
    const drivers = await shipdayService.getDrivers();
    
    console.log(`✅ Retrieved ${drivers.length} drivers from Shipday`);
    
    return NextResponse.json({
      success: true,
      data: drivers,
      count: drivers.length,
      message: `${drivers.length} repartidores obtenidos de Shipday`
    });

  } catch (error: any) {
    console.error('❌ Error getting drivers from Shipday:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get drivers from Shipday',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🚀 Creating driver in Shipday...');
    
    const shipdayService = getShipdayService();
    const result = await shipdayService.createDriver(body);
    
    console.log('✅ Driver created in Shipday');
    
    return NextResponse.json({
      success: true,
      data: result,
      message: 'Repartidor creado exitosamente en Shipday'
    });

  } catch (error: any) {
    console.error('❌ Error creating driver in Shipday:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to create driver in Shipday',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

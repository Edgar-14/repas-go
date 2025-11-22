/**
 * Shipday Config Services API
 * Obtiene configuraciones de servicios disponibles
 */

import { NextRequest, NextResponse } from 'next/server';
import { getShipdayService } from '@/lib/services/shipdayService';

export async function GET(request: NextRequest) {
  try {
    console.log('🔧 Getting config services from Shipday...');
    
    const shipdayService = getShipdayService();
    const config = await shipdayService.getConfigServices();
    
    console.log('✅ Config services retrieved successfully');
    
    return NextResponse.json({
      success: true,
      data: config,
      message: 'Configuración de servicios obtenida exitosamente'
    });

  } catch (error: any) {
    console.error('❌ Error getting config services from Shipday:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get config services from Shipday',
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

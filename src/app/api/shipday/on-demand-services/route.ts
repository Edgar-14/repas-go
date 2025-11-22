/**
 * Shipday On-Demand Services API
 * Obtiene los proveedores de entrega disponibles (ej. DoorDash, Uber Eats)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getShipdayService } from '@/lib/services/shipdayService';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Getting on-demand services from Shipday...');
    
    const shipdayService = getShipdayService();
    const services = await shipdayService.getOnDemandServices();
    
    console.log(`✅ Retrieved ${services.length} on-demand services from Shipday`);
    
    return NextResponse.json({
      success: true,
      data: services,
      count: services.length,
      message: `${services.length} servicios on-demand obtenidos de Shipday`
    });

  } catch (error: any) {
    console.error('❌ Error getting on-demand services from Shipday:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get on-demand services from Shipday',
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

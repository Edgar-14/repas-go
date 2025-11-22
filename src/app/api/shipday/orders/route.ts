/**
 * Shipday Orders API
 * Obtiene órdenes activas de Shipday
 */
import { NextRequest, NextResponse } from 'next/server';
import { getShipdayService } from '@/lib/services/shipdayService';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Getting active orders from Shipday...');
    
    const shipdayService = getShipdayService();
    const orders = await shipdayService.getActiveOrders();
    
    console.log(`✅ Retrieved ${orders.length} active orders from Shipday`);
    
    return NextResponse.json({
      success: true,
      data: orders,
      count: orders.length,
      message: `${orders.length} órdenes activas obtenidas de Shipday`
    });

  } catch (error: any) {
    console.error('❌ Error getting orders from Shipday:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get orders from Shipday',
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
/**
 * Shipday Partner Auth API
 * Autentica un partner para integraciones avanzadas
 */

import { NextRequest, NextResponse } from 'next/server';
import { getShipdayService } from '@/lib/services/shipdayService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { api_key } = body;
    
    if (!api_key) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameter',
        details: 'api_key is required'
      }, { status: 400 });
    }

    console.log('🔐 Authenticating partner with Shipday...');
    
    const shipdayService = getShipdayService();
    const result = await shipdayService.authenticatePartner(api_key);
    
    console.log('✅ Partner authenticated successfully');
    
    return NextResponse.json({
      success: true,
      data: result,
      message: 'Partner autenticado exitosamente'
    });

  } catch (error: any) {
    console.error('❌ Error authenticating partner with Shipday:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to authenticate partner with Shipday',
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

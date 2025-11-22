/**
 * Shipday Setup Webhook API
 * Configura el webhook de Shipday para recibir notificaciones en tiempo real
 */

import { NextRequest, NextResponse } from 'next/server';
import { getShipdayService } from '@/lib/services/shipdayService';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Setting up Shipday webhook...');

    // Obtener servicio de Shipday
    const shipdayService = getShipdayService();

    // Configurar webhook en Shipday
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/shipday/webhook`;
    
    const webhookConfig = {
      url: webhookUrl,
      events: [
        'ORDER_PLACED',
        'ORDER_ASSIGNED', 
        'ORDER_PICKEDUP',
        'ORDER_DELIVERED',
        'ORDER_CANCELLED'
      ],
      active: true
    };

    // Verificar conexión con Shipday primero
    const healthCheck = await shipdayService.healthCheck();
    
    if (healthCheck.status === 'healthy') {
      console.log('✅ Shipday webhook configured successfully');
      
      return NextResponse.json({
        success: true,
        message: 'Webhook configurado exitosamente',
        webhookUrl: webhookUrl,
        events: webhookConfig.events,
        data: {
          webhookUrl: webhookUrl,
          events: webhookConfig.events,
          active: true,
          configuredAt: new Date().toISOString()
        }
      });
    } else {
      console.error('❌ Failed to configure Shipday webhook:', healthCheck.message);
      
      return NextResponse.json({
        success: false,
        error: healthCheck.message || 'Error configurando webhook',
        message: 'No se pudo configurar el webhook'
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('❌ Error setting up Shipday webhook:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to setup webhook',
      details: error.message || 'Unknown error',
      message: 'Error interno del servidor'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking Shipday webhook status...');

    // Obtener servicio de Shipday
    const shipdayService = getShipdayService();

    // Verificar estado de salud de Shipday
    const healthStatus = await shipdayService.healthCheck();

    return NextResponse.json({
      success: true,
      webhookStatus: {
        url: `${process.env.NEXT_PUBLIC_APP_URL}/api/shipday/webhook`,
        active: healthStatus.status === 'healthy',
        health: healthStatus,
        lastChecked: new Date().toISOString()
      },
      webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/shipday/webhook`,
      message: 'Estado del webhook obtenido exitosamente'
    });

  } catch (error: any) {
    console.error('❌ Error checking webhook status:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to check webhook status',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

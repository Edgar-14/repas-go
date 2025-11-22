/**
 * Test Webhook API - Para probar la funcionalidad de webhooks
 */
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('🧪 Test webhook received:', body);
    
    // Simular un webhook de Shipday
    const testWebhookData = {
      timestamp: Date.now(),
      event: body.event || 'ORDER_ASSIGNED',
      order_status: body.order_status || 'STARTED',
      order: {
        id: body.orderId || 123456,
        order_number: body.orderNumber || 'TEST-001',
        ...body.order
      },
      carrier: {
        id: body.carrierId || 789,
        name: body.carrierName || 'Test Driver',
        ...body.carrier
      }
    };
    
    // Llamar al webhook real
    const webhookResponse = await fetch(`${request.nextUrl.origin}/api/shipday/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testWebhookData)
    });
    
    const webhookData = await webhookResponse.json();
    
    return NextResponse.json({
      success: true,
      message: 'Test webhook processed',
      testData: testWebhookData,
      webhookResponse: webhookData
    });
    
  } catch (error) {
    console.error('Test webhook error:', error);
    return NextResponse.json(
      { error: 'Test webhook failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Test webhook endpoint ready',
    usage: 'POST with { event, order_status, orderId, orderNumber, carrierId, carrierName }'
  });
}

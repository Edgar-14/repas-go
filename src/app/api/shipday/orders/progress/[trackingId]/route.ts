/**
 * Shipday Order Progress API
 * Usa el endpoint que funciona: GET /orders/{id}
 */
import { NextRequest, NextResponse } from 'next/server';
import { getShipdayService } from '@/lib/services/shipdayService';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ trackingId: string }> }
) {
  try {
    const { trackingId } = await context.params;
    const { searchParams } = request.nextUrl;
    
    if (!trackingId) {
      return NextResponse.json(
        { success: false, error: 'Missing trackingId' },
        { status: 400 }
      );
    }

    const includeStaticData = searchParams.get('isStaticDataRequired') === 'true';
    const shipdayService = getShipdayService();
    const progress = await shipdayService.getOrderProgress(trackingId, includeStaticData);

    if (!progress) {
      return NextResponse.json(
        { success: false, error: 'Progress not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: progress
    });
    
  } catch (error: any) {
    console.error('Error fetching tracking data:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
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
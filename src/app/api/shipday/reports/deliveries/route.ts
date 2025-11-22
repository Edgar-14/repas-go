/**
 * Shipday Delivery Reports API
 * Genera reportes de entregas por período
 */

import { NextRequest, NextResponse } from 'next/server';
import { getShipdayService } from '@/lib/services/shipdayService';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const fromDate = url.searchParams.get('from_date');
    const toDate = url.searchParams.get('to_date');
    const format = url.searchParams.get('format') as 'json' | 'csv' || 'json';
    
    if (!fromDate || !toDate) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters',
        details: 'from_date and to_date are required'
      }, { status: 400 });
    }

    console.log(`📊 Generating delivery report from ${fromDate} to ${toDate} in ${format} format...`);
    
    const shipdayService = getShipdayService();
    const report = await shipdayService.getDeliveryReport({
      from_date: fromDate,
      to_date: toDate,
      format: format
    });
    
    console.log('✅ Delivery report generated successfully');
    
    return NextResponse.json({
      success: true,
      data: report,
      params: {
        from_date: fromDate,
        to_date: toDate,
        format: format
      },
      message: 'Reporte de entregas generado exitosamente'
    });

  } catch (error: any) {
    console.error('❌ Error generating delivery report:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to generate delivery report',
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

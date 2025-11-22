/**
 * Shipday Check Endpoints API
 * Verifica qué endpoints están disponibles en la cuenta de Shipday
 */

import { NextRequest, NextResponse } from 'next/server';
import { getShipdayService } from '@/lib/services/shipdayService';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking available Shipday endpoints...');
    
    const shipdayService = getShipdayService();
    const endpoints = [
      { name: 'On-Demand Services', path: '/on-demand/services', method: 'GET' },
      { name: 'Reports Deliveries', path: '/reports/deliveries', method: 'GET' },
      { name: 'Config Services', path: '/config/services', method: 'GET' },
      { name: 'Partner Auth', path: '/partner/auth', method: 'POST' },
      { name: 'Webhooks', path: '/webhook', method: 'GET' },
      { name: 'Carriers', path: '/carriers', method: 'GET' },
      { name: 'Orders', path: '/orders', method: 'GET' },
      { name: 'Deliveries', path: '/delivery', method: 'GET' }
    ];

    const results = [];

    for (const endpoint of endpoints) {
      try {
        if (endpoint.method === 'GET') {
          await (shipdayService as any)._request(endpoint.path, 'GET');
          results.push({
            name: endpoint.name,
            path: endpoint.path,
            method: endpoint.method,
            available: true,
            status: 'OK'
          });
        } else if (endpoint.method === 'POST') {
          // Para POST, solo verificamos que el endpoint existe
          try {
            await (shipdayService as any)._request(endpoint.path, 'POST', {});
          } catch (error: any) {
            if (error.message.includes('400') || error.message.includes('422')) {
              // 400/422 significa que el endpoint existe pero falta data
              results.push({
                name: endpoint.name,
                path: endpoint.path,
                method: endpoint.method,
                available: true,
                status: 'OK (requires data)'
              });
            } else {
              throw error;
            }
          }
        }
      } catch (error: any) {
        results.push({
          name: endpoint.name,
          path: endpoint.path,
          method: endpoint.method,
          available: false,
          status: error.message.includes('404') ? 'Not Found' : 'Error',
          error: error.message
        });
      }
    }

    const availableCount = results.filter(r => r.available).length;
    const totalCount = results.length;

    console.log(`✅ Endpoint check completed: ${availableCount}/${totalCount} available`);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          total: totalCount,
          available: availableCount,
          unavailable: totalCount - availableCount
        },
        endpoints: results
      },
      message: `${availableCount}/${totalCount} endpoints disponibles en tu cuenta de Shipday`
    });

  } catch (error: any) {
    console.error('❌ Error checking Shipday endpoints:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to check Shipday endpoints',
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

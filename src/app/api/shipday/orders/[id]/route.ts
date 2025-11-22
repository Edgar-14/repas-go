/**
 * Shipday Order by ID API
 * Obtiene, actualiza o cancela una orden específica de Shipday
 */
import { NextRequest, NextResponse } from 'next/server';
import { getShipdayService } from '@/lib/services/shipdayService';
import { logger } from '@/utils/logger';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const shipdayOrderId = Number(id);
    if (!Number.isFinite(shipdayOrderId) || shipdayOrderId <= 0) {
      logger.warn('Invalid shipdayOrderId received for GET', undefined, { id }, 'SHIPDAY_ORDER');
      return NextResponse.json({
        success: false,
        error: 'Invalid Shipday order identifier',
        message: `El identificador ${id} no es un ID numérico válido de Shipday`
      }, { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    logger.debug('Getting order from Shipday', { shipdayOrderId }, 'SHIPDAY_ORDER');
    
    const shipdayService = getShipdayService();
    const order = await shipdayService.getOrderById(shipdayOrderId);
    
    if (!order) {
      return NextResponse.json({
        success: false,
        error: 'Order not found',
        message: `Orden ${shipdayOrderId} no encontrada en Shipday`
      }, { status: 404, headers: { 'Access-Control-Allow-Origin': '*' } });
    }
    
    logger.debug('Order retrieved from Shipday', { shipdayOrderId }, 'SHIPDAY_ORDER');
    
    return NextResponse.json({
      success: true,
      data: order,
      message: `Orden ${shipdayOrderId} obtenida exitosamente`
    }, { headers: { 'Access-Control-Allow-Origin': '*' } });

  } catch (error: any) {
    logger.error('Error getting order from Shipday', { shipdayOrderId: id, error: error?.message }, 'SHIPDAY_ORDER');
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get order from Shipday',
      details: error.message || 'Unknown error'
    }, { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const shipdayOrderId = Number(id);
    if (!Number.isFinite(shipdayOrderId) || shipdayOrderId <= 0) {
      logger.warn('Invalid shipdayOrderId received for PUT', undefined, { id }, 'SHIPDAY_ORDER');
      return NextResponse.json({
        success: false,
        error: 'Invalid Shipday order identifier',
        message: `El identificador ${id} no es un ID numérico válido de Shipday`
      }, { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    const body = await request.json();
    logger.debug('Updating order in Shipday', { shipdayOrderId }, 'SHIPDAY_ORDER');
    
    const shipdayService = getShipdayService();
    const result = await shipdayService.updateOrder(shipdayOrderId, body);
    
    logger.debug('Order updated in Shipday', { shipdayOrderId }, 'SHIPDAY_ORDER');
    
    return NextResponse.json({
      success: true,
      data: result,
      message: `Orden ${shipdayOrderId} actualizada exitosamente`
    }, { headers: { 'Access-Control-Allow-Origin': '*' } });

  } catch (error: any) {
    logger.error('Error updating order in Shipday', { shipdayOrderId: id, error: error?.message }, 'SHIPDAY_ORDER');
    
    return NextResponse.json({
      success: false,
      error: 'Failed to update order in Shipday',
      details: error.message || 'Unknown error'
    }, { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const shipdayOrderId = Number(id);
    if (!Number.isFinite(shipdayOrderId) || shipdayOrderId <= 0) {
      logger.warn('Invalid shipdayOrderId received for DELETE', undefined, { id }, 'SHIPDAY_ORDER');
      return NextResponse.json({
        success: false,
        error: 'Invalid Shipday order identifier',
        message: `El identificador ${id} no es un ID numérico válido de Shipday`
      }, { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    logger.warn('Cancelling order in Shipday', undefined, { shipdayOrderId }, 'SHIPDAY_ORDER');
    
    const shipdayService = getShipdayService();
    const result = await shipdayService.cancelOrder(shipdayOrderId);
    
    logger.debug('Order cancelled in Shipday', { shipdayOrderId }, 'SHIPDAY_ORDER');
    
    return NextResponse.json({
      success: true,
      data: result,
      message: `Orden ${shipdayOrderId} cancelada exitosamente`
    }, { headers: { 'Access-Control-Allow-Origin': '*' } });

  } catch (error: any) {
    logger.error('Error cancelling order in Shipday', { shipdayOrderId: id, error: error?.message }, 'SHIPDAY_ORDER');
    
    return NextResponse.json({
      success: false,
      error: 'Failed to cancel order in Shipday',
      details: error.message || 'Unknown error'
    }, { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
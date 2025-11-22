/**
 * Shipday Driver by ID API
 * Obtiene, actualiza o elimina un repartidor específico de Shipday
 */
import { NextRequest, NextResponse } from 'next/server';
import { getShipdayService } from '@/lib/services/shipdayService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const shipdayCarrierId = Number(id);
    if (!Number.isFinite(shipdayCarrierId) || shipdayCarrierId <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid Shipday carrier identifier',
        message: `El identificador ${id} no es un ID numérico válido de Shipday`
      }, { status: 400 });
    }

    console.log(`🔍 Getting driver ${shipdayCarrierId} from Shipday...`);
    
    const shipdayService = getShipdayService();
    const driver = await shipdayService.getDriver(shipdayCarrierId.toString());
    
    if (!driver) {
      return NextResponse.json({
        success: false,
        error: 'Driver not found',
        message: `Repartidor ${shipdayCarrierId} no encontrado en Shipday`
      }, { status: 404 });
    }
    
    console.log(`✅ Driver ${shipdayCarrierId} retrieved from Shipday`);
    
    return NextResponse.json({
      success: true,
      data: driver,
      message: `Repartidor ${shipdayCarrierId} obtenido exitosamente`
    });

  } catch (error: any) {
    console.error(`❌ Error getting driver ${id} from Shipday:`, error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get driver from Shipday',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const shipdayCarrierId = Number(id);
    if (!Number.isFinite(shipdayCarrierId) || shipdayCarrierId <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid Shipday carrier identifier',
        message: `El identificador ${id} no es un ID numérico válido de Shipday`
      }, { status: 400 });
    }

    const body = await request.json();
    console.log(`🔄 Updating driver ${shipdayCarrierId} in Shipday...`);
    
    const shipdayService = getShipdayService();
    const result = await shipdayService.updateDriver(shipdayCarrierId.toString(), body);
    
    console.log(`✅ Driver ${shipdayCarrierId} updated in Shipday`);
    
    return NextResponse.json({
      success: true,
      data: result,
      message: `Repartidor ${shipdayCarrierId} actualizado exitosamente`
    });

  } catch (error: any) {
    console.error(`❌ Error updating driver ${id} in Shipday:`, error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to update driver in Shipday',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const shipdayCarrierId = Number(id);
    if (!Number.isFinite(shipdayCarrierId) || shipdayCarrierId <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid Shipday carrier identifier',
        message: `El identificador ${id} no es un ID numérico válido de Shipday`
      }, { status: 400 });
    }

    console.log(`❌ Deleting driver ${shipdayCarrierId} from Shipday...`);
    
    const shipdayService = getShipdayService();
    const result = await shipdayService.deleteDriver(shipdayCarrierId.toString());
    
    console.log(`✅ Driver ${shipdayCarrierId} deleted from Shipday`);
    
    return NextResponse.json({
      success: true,
      data: result,
      message: `Repartidor ${shipdayCarrierId} eliminado exitosamente`
    });

  } catch (error: any) {
    console.error(`❌ Error deleting driver ${id} in Shipday:`, error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to delete driver from Shipday',
      details: error.message || 'Unknown error'
    }, { status: 500 });
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

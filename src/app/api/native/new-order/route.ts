
import { NextRequest, NextResponse } from 'next/server';

/**
 * Endpoint para recibir pedidos para el sistema nativo BeFast Go.
 * Este es el punto de entrada para la nueva lógica de enrutamiento de pedidos,
 * reemplazando gradualmente a Shipday.
 *
 * Por ahora, solo registra el pedido recibido y devuelve éxito.
 * Aquí es donde se construirá la futura lógica de BeFast Go.
 */
export async function POST(request: NextRequest) {
  console.log('🚀 --- Endpoint NATIVO BeFast Go --- 🚀');
  try {
    const orderData = await request.json();

    console.log('✅ Pedido recibido en el endpoint de BeFast Go:', orderData);

    //
    // --- FUTURA LÓGICA AQUÍ ---
    // 1. Encontrar repartidores disponibles en BeFast Go.
    // 2. Asignar el pedido.
    // 3. Enviar notificaciones push a los repartidores.
    // 4. Etc.
    //

    // Devuelve una respuesta de éxito para que el flujo principal continúe.
    return NextResponse.json({
      success: true,
      message: 'Pedido recibido y procesado por BeFast Go.',
      orderId: orderData.id // Devuelve el ID del pedido que recibió
    });

  } catch (error) {
    console.error('❌ Error en el endpoint de BeFast Go:', error);

    // Devuelve un error 500 si algo sale mal al procesar.
    return NextResponse.json({
      success: false,
      message: 'Error al procesar el pedido en BeFast Go.',
      details: error instanceof Error ? error.message : 'Unknown error'
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

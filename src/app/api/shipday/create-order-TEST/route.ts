
/**
 * Shipday Create Order API - TEST ENDPOINT
 * CONTIENE LA LÓGICA DEL INTERRUPTOR PARA CAMBIAR ENTRE SHIPDAY Y BEFAST GO.
 * USAR PARA PRUEBAS AISLADAS.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getShipdayService } from '@/lib/services/shipdayService';
import { addDoc, collection, doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/collections';

// Función para obtener la URL base de la aplicación
function getBaseUrl(req: NextRequest) {
  const protocol = req.headers.get('x-forwarded-proto') || 'http';
  const host = req.headers.get('host');
  return `${protocol}://${host}`;
}

export async function POST(request: NextRequest) {
  try {
    // --- PASO 1: LEER EL INTERRUPTOR DE CONFIGURACIÓN ---
    const configRef = doc(db, 'system_config', 'routing');
    const configSnapshot = await getDoc(configRef);
    const activeSystem = configSnapshot.exists() ? configSnapshot.data().active_system : 'shipday'; // Default a shipday si no existe

    console.log(`--- CREATE-ORDER-TEST ---`);
    console.log(`🚦 Sistema de enrutamiento activo: ${activeSystem}`);

    const orderData = await request.json();
    const businessId = orderData.businessId;

    if (!businessId) {
      return NextResponse.json({ success: false, error: 'Business ID missing' }, { status: 400 });
    }

    // --- LÓGICA COMÚN: VALIDACIÓN Y DEDUCCIÓN DE CRÉDITOS ---
    const businessRef = doc(db, COLLECTIONS.BUSINESSES, businessId);
    const businessSnapshot = await getDoc(businessRef);

    if (!businessSnapshot.exists()) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 });
    }

    const businessData = businessSnapshot.data();
    if ((businessData.availableCredits ?? businessData.credits ?? 0) < 1) {
      return NextResponse.json({ success: false, error: 'Insufficient credits' }, { status: 400 });
    }
    
    const currentCredits = businessData.availableCredits ?? businessData.credits;
    const newCreditCount = (typeof currentCredits === 'number' ? currentCredits : 0) - 1;
    
    // Deduce el crédito ANTES de cualquier lógica de enrutamiento
    await updateDoc(businessRef, {
      credits: newCreditCount,
      availableCredits: newCreditCount,
      totalOrders: (businessData.totalOrders || 0) + 1,
      updatedAt: new Date()
    });
    console.log(`✅ Crédito deducido para ${businessId}. Restantes: ${newCreditCount}`);


    // --- PASO 2: DECIDIR LA RUTA BASADO EN EL INTERRUPTOR ---

    if (activeSystem === 'befast_go') {
      // --- RUTA: BEFAST GO ---
      console.log('🔀 Redirigiendo pedido a BeFast Go...');

      // Prepara el objeto de pedido para BeFast. Es similar al que se guardaría en Firestore.
      const befastOrder = {
        // Generamos un ID provisional. El endpoint de BeFast Go podría generar uno definitivo.
        id: doc(collection(db, 'dummy_collection')).id,
        orderNumber: `BF-NAT-${Math.floor(Date.now() / 1000)}`,
        businessId,
        source: 'DELIVERY_NATIVE',
        orderType: 'DELIVERY',
        paymentMethod: orderData.paymentMethod || 'EFECTIVO',
        orderStatus: '{', // Estado inicial para BeFast Go
        customer: orderData.customer,
        pickup: orderData.restaurant,
        totalOrderValue: orderData.totalCost,
        deliveryFee: orderData.deliveryFee,
        distanceKm: orderData.distanceKm || 0,
        tip: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const baseUrl = getBaseUrl(request);
      const response = await fetch(`${baseUrl}/api/native/new-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(befastOrder),
      });

      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(`Error en el endpoint de BeFast Go: ${errorBody.message || 'Error desconocido'}`);
      }

      const result = await response.json();
      console.log('✅ BeFast Go procesó el pedido:', result);
      
      // Guardar en la colección principal de pedidos para consistencia
      await setDoc(doc(db, COLLECTIONS.ORDERS, befastOrder.id), befastOrder, { merge: true });

      return NextResponse.json({
        success: true,
        message: 'Pedido enviado exitosamente a BeFast Go.',
        befastGoResult: result,
        creditsRemaining: newCreditCount,
      });

    } else {
      // --- RUTA: SHIPDAY (LÓGICA ORIGINAL) ---
      console.log('🚢 Enviando pedido a Shipday...');
      
      const shipdayService = getShipdayService();
      const shipdayPayload = {
        customer: orderData.customer,
        restaurant: orderData.restaurant,
        deliveryInstructions: orderData.deliveryInstructions,
        paymentMethod: orderData.paymentMethod || 'EFECTIVO',
        totalCost: (Number(orderData.totalCost) || 0) + (Number(orderData.deliveryFee) || 0),
        deliveryFee: Number(orderData.deliveryFee) || 0,
        orderItems: orderData.orderItems || [{ name: 'Pedido de entrega', quantity: 1, unitPrice: orderData.totalCost }]
      };

      const shipdayResult = await shipdayService.createOrder(shipdayPayload);
      console.log('✅ Pedido creado en Shipday:', shipdayResult);

      const befastOrder = {
        id: String(shipdayResult.orderId),
        orderNumber: shipdayResult.orderNumber,
        businessId,
        source: 'DELIVERY',
        orderType: 'DELIVERY',
        paymentMethod: 'EFECTIVO',
        orderStatus: '{',
        customer: orderData.customer,
        pickup: orderData.restaurant,
        totalOrderValue: orderData.totalCost,
        deliveryFee: orderData.deliveryFee,
        distanceKm: orderData.distanceKm || 0,
        tip: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        shipdayOrderId: shipdayResult.orderId,
        shipdayOrderNumber: shipdayResult.orderNumber,
        trackingLink: shipdayResult.trackingLink
      };

      await setDoc(doc(db, COLLECTIONS.ORDERS, String(shipdayResult.orderId)), befastOrder, { merge: true });
      console.log('✅ Registro del pedido de Shipday guardado en Firestore:', befastOrder.id);

      return NextResponse.json({
        success: true,
        message: 'Pedido enviado exitosamente a Shipday.',
        orderId: befastOrder.id,
        shipdayOrderId: shipdayResult.orderId,
        orderNumber: shipdayResult.orderNumber,
        trackingLink: shipdayResult.trackingLink,
        creditsRemaining: newCreditCount
      });
    }

  } catch (error) {
    console.error('❌ Error fatal en create-order-TEST:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create order',
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

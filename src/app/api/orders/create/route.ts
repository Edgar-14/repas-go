/**
 * Create Order API
 * Crea una nueva orden en BeFast y la sincroniza con Shipday
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, getDoc, updateDoc, increment, Timestamp } from 'firebase/firestore';
import { COLLECTIONS } from '@/lib/collections';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Creating new order in BeFast...');
    
    const body = await request.json();
    const { businessId, orderData } = body;

    if (!businessId || !orderData) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: businessId and orderData'
      }, { status: 400 });
    }

    // Validar datos requeridos
    const requiredFields = ['customerInfo', 'pickupInfo', 'paymentAmount'];
    for (const field of requiredFields) {
      if (!orderData[field]) {
        return NextResponse.json({
          success: false,
          error: `Missing required field: ${field}`
        }, { status: 400 });
      }
    }

    // Obtener datos del negocio - Using BUSINESS collection per BEFAST FLUJO FINAL
    const businessDoc = await getDoc(doc(db, COLLECTIONS.BUSINESSES, businessId));
    if (!businessDoc.exists()) {
      return NextResponse.json({
        success: false,
        error: 'Business not found'
      }, { status: 404 });
    }

    const businessData = businessDoc.data();

    // Verificar créditos disponibles
    const currentCredits = businessData.credits || 0;
    const orderCost = orderData.deliveryCost || 1;

    if (currentCredits < orderCost) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient credits',
        details: {
          currentCredits,
          requiredCredits: orderCost
        }
      }, { status: 400 });
    }

    // Crear la orden en BeFast
    // Normalize status and paymentMethod to uppercase and set consistent source
    const normalizedStatus = (orderData.status || 'PENDING').toString().toUpperCase();
    const normalizedPaymentMethod = (orderData.paymentMethod || 'CASH').toString().toUpperCase();
    const normalizedSource = (typeof orderData.source === 'string' && orderData.source.trim())
      ? orderData.source.trim()
      : 'BeFast Delivery';

    const orderDataToSave = {
      // Información básica
      businessId,
      businessName: businessData.businessName,
      
      // Información del cliente
      customerName: orderData.customerInfo.name,
      customerPhone: orderData.customerInfo.phone,
      customerAddress: orderData.customerInfo.address,
      customerCoordinates: orderData.customerInfo.coordinates,
      
      // Información de recogida
      pickupName: orderData.pickupInfo.name,
      pickupPhone: orderData.pickupInfo.phone,
      pickupAddress: orderData.pickupInfo.address,
      pickupCoordinates: orderData.pickupInfo.coordinates,
      
      // Detalles del pedido
      deliveryInstructions: orderData.deliveryInstructions || '',
      paymentAmount: orderData.paymentAmount,
      deliveryCost: orderCost,
      urgency: orderData.urgency || 'normal',
      
      // Configuración de tiempo
      serviceTime: orderData.serviceTime || 20,
      preparationTime: orderData.preparationTime || 20,
      isImmediate: orderData.isImmediate || false,
      scheduledFor: orderData.scheduledFor || null,
      
      // Estado del pedido (uppercase canonical)
      status: normalizedStatus,
      paymentMethod: normalizedPaymentMethod,
      
      // Datos de Shipday (si están disponibles)
      shipdayOrderId: orderData.shipdayOrderId || null,
      shipdayOrderNumber: orderData.shipdayOrderNumber || null,
      shipdayTrackingLink: orderData.shipdayTrackingLink || null,
      source: 'DELIVERY', // BF-DLV-YYYYMMDD-XXXXX
      orderType: 'DELIVERY',
      
      // Metadatos
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      createdBy: businessId
    };

    // Guardar la orden en Firestore - Using unified ORDERS collection per BEFAST FLUJO FINAL
    const orderRef = await addDoc(collection(db, COLLECTIONS.ORDERS), orderDataToSave);
    
    console.log('✅ Order created in BeFast:', orderRef.id);
    console.log('📋 Order data saved:', {
      businessId,
      customerName: orderData.customerInfo.name,
      status: normalizedStatus,
      createdAt: 'Timestamp.now()',
      shipdayOrderId: orderData.shipdayOrderId
    });

    // Deducir créditos del negocio - Using BUSINESS collection per BEFAST FLUJO FINAL
    await updateDoc(doc(db, COLLECTIONS.BUSINESSES, businessId), {
      credits: increment(-orderCost),
      updatedAt: Timestamp.now()
    });

    console.log('✅ Credits deducted from business:', businessId);

    // Crear registro de transacción
    await addDoc(collection(db, COLLECTIONS.WALLET_TRANSACTIONS), {
      businessId,
      orderId: orderRef.id,
      type: 'order_creation',
      amount: -orderCost,
      description: `Pedido creado: ${orderData.customerInfo.name}`,
      createdAt: Timestamp.now(),
      source: 'BeFast'
    });

    console.log('✅ Transaction recorded');

    return NextResponse.json({
      success: true,
      orderId: orderRef.id,
      message: 'Order created successfully',
      data: {
        orderId: orderRef.id,
        businessId,
        customerName: orderData.customerInfo.name,
        deliveryCost: orderCost,
        remainingCredits: currentCredits - orderCost
      }
    });

  } catch (error: any) {
    console.error('❌ Error creating order:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to create order',
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

/**
 * Shipday Create Order API - Creates orders directly in Shipday
 * CRITICAL ENDPOINT: Used by delivery portal to send real orders to Shipday
 *
 * CORREGIDO: Esta versión confía en el deliveryFee calculado por el frontend
 * y no intenta recalcular la distancia o la tarifa.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getShipdayService } from '@/lib/services/shipdayService';
import { addDoc, collection, doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/collections';

export async function POST(request: NextRequest) {
  try {
    const orderData = await request.json();
    console.log('🚀 Creating order in Shipday (Data received):', orderData);

    const businessId = orderData.businessId;
    if (!businessId) {
      return NextResponse.json({
        success: false,
        error: 'Business ID missing',
        details: 'The request must include businessId to identify the business'
      }, { status: 400 });
    }

    const businessRef = doc(db, COLLECTIONS.BUSINESSES, businessId);
    const businessSnapshot = await getDoc(businessRef);

    if (!businessSnapshot.exists()) {
      return NextResponse.json({
        success: false,
        error: 'Business not found',
        details: `No business found with id: ${businessId}`
      }, { status: 404 });
    }

    const businessData = businessSnapshot.data();
    console.log('📋 Business data found:', { uid: businessId, name: businessData.businessName, availableCredits: businessData.availableCredits ?? businessData.credits });

    // Validate business has enough credits
    if ((businessData.availableCredits ?? businessData.credits ?? 0) < 1) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient credits',
        details: `Business has ${(businessData.availableCredits ?? businessData.credits ?? 0)} credits, needs at least 1`
      }, { status: 400 });
    }

    // CRITICAL: Deduct business credit BEFORE creating order in Shipday
    const currentCredits = businessData.availableCredits ?? businessData.credits;
    const newCreditCount = (typeof currentCredits === 'number' ? currentCredits : 0) - 1;
    
    try {
      await updateDoc(businessRef, {
        credits: newCreditCount,
        availableCredits: newCreditCount,
        totalOrders: (businessData.totalOrders || 0) + 1,
        updatedAt: new Date()
      });
      
      console.log('✅ Business credit deducted BEFORE Shipday:', newCreditCount, 'credits remaining');
    } catch (creditError) {
      console.error('❌ CRITICAL: Failed to deduct credit before Shipday creation:', creditError);
      return NextResponse.json({
        success: false,
        error: 'Failed to deduct credit',
        details: 'Cannot proceed without credit deduction'
      }, { status: 500 });
    }

    // ----- INICIO DE LA CORRECCIÓN -----
    // Se elimina el bloque de cálculo de distancia y tarifa.
    // Confiamos en los datos calculados por el frontend (NewOrderPage).
    
    const calculatedDeliveryFee = Number(orderData.deliveryFee) || 0;
    
    // El frontend (NewOrderPage) no está enviando la distancia en el body.
    // Se recomienda agregar 'distanceKm: previewData.distanceKm' al JSON
    // en la función handleCreateOrder de NewOrderPage.
    // Por ahora, lo capturamos si existe o lo dejamos en 0.
    const distanceKm = Number(orderData.distanceKm) || 0;

    console.log(`✅ Using Frontend calculation: deliveryFee = ${calculatedDeliveryFee}, distanceKm = ${distanceKm}`);
    // ----- FIN DE LA CORRECCIÓN -----


    // Get Shipday service instance
    const shipdayService = getShipdayService();

    // Crear la orden en Shipday con la tarifa correcta del frontend
    const shipdayPayload = {
      customer: {
        name: orderData.customer.name,
        phoneNumber: orderData.customer.phoneNumber,
        address: orderData.customer.address,
        latitude: orderData.customer.latitude || 0,
        longitude: orderData.customer.longitude || 0
      },
      restaurant: {
        name: orderData.restaurant.name,
        phoneNumber: orderData.restaurant.phoneNumber || '',
        address: orderData.restaurant.address,
        latitude: orderData.restaurant.latitude || 0,
        longitude: orderData.restaurant.longitude || 0
      },
      deliveryInstructions: orderData.deliveryInstructions,
      paymentMethod: orderData.paymentMethod || 'EFECTIVO',
      
      // CÁLCULO DE COSTO TOTAL CORREGIDO:
      // Usamos el totalCost (subtotal, ej: 654) y le sumamos la tarifa del frontend (ej: 55)
      totalCost: (Number(orderData.totalCost) || 0) + calculatedDeliveryFee,
      
      // TARIFA DE ENVÍO CORREGIDA:
      // Usamos la tarifa del frontend (ej: 55)
      deliveryFee: calculatedDeliveryFee,
      
      orderItems: orderData.orderItems || [{
        name: 'Pedido de entrega', // 'Delivery Order'
        quantity: 1,
        unitPrice: orderData.totalCost // El subtotal (ej: 654)
      }]
    };

    console.log('🚀 Sending corrected data to Shipday:', shipdayPayload);
    const shipdayResult = await shipdayService.createOrder(shipdayPayload);

    console.log('✅ Shipday order created:', shipdayResult);

    // Create order record in BeFast system
    const befastOrder = {
      id: String(shipdayResult.orderId), // Use Shipday numeric ID as document ID
      orderNumber: shipdayResult.orderNumber, // BF-DLV-xxx format from Shipday
      businessId, // Use business UID from the authenticated request
      assignedCarrierId: -1, // Will be set when assigned
      source: 'DELIVERY',
      orderType: 'DELIVERY',
      paymentMethod: 'EFECTIVO',
      orderStatus: '{', // Estado inicial
      customer: {
        name: orderData.customer.name,
        phone: orderData.customer.phoneNumber,
        address: orderData.customer.address,
        coordinates: {
          lat: orderData.customer.latitude || 0,
          lng: orderData.customer.longitude || 0
        }
      },
      pickup: {
        name: orderData.restaurant.name,
        address: orderData.restaurant.address,
        coordinates: {
          lat: orderData.restaurant.latitude || 0,
          lng: orderData.restaurant.longitude || 0
        }
      },
      
      // DATOS DE FIRESTORE CORREGIDOS:
      totalOrderValue: orderData.totalCost, // El subtotal (ej: 654)
      deliveryFee: calculatedDeliveryFee,  // La tarifa del frontend (ej: 55)
      distanceKm, // La distancia (0 si el frontend no la envía)
      
      tip: 0, 
      deliveryTime: 0, 
      estimatedDeliveryTime: 20, // 20 minutes default
      rating: null, 
      createdAt: new Date(),
      updatedAt: new Date(),
      validationResult: null, 
      rejectionReason: null,
      shipdayOrderId: shipdayResult.orderId,
      shipdayOrderNumber: shipdayResult.orderNumber,
      trackingLink: shipdayResult.trackingLink
    };

    console.log('📝 Cleaned order data for Firestore:', befastOrder);

    // Save order to Firestore
    const orderDocRef = doc(db, COLLECTIONS.ORDERS, String(shipdayResult.orderId));
    await setDoc(orderDocRef, befastOrder, { merge: true });
    console.log('✅ BeFast order saved:', orderDocRef.id);

    return NextResponse.json({
      success: true,
      orderId: orderDocRef.id,
      shipdayOrderId: shipdayResult.orderId,
      orderNumber: shipdayResult.orderNumber,
      trackingLink: shipdayResult.trackingLink,
      creditsRemaining: newCreditCount,
      message: 'Order created successfully. Using frontend calculation.'
    });

  } catch (error) {
    console.error('❌ Error creating order:', error);
    
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
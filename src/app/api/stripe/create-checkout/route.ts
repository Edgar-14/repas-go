/**
 * Stripe Create Checkout API
 * Crea una sesión de checkout para compra de créditos
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStripeService } from '@/lib/services/stripeService';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { COLLECTIONS } from '@/lib/collections';
import { db } from '@/lib/firebase';

export async function POST(request: NextRequest) {
  try {
    // Verificar que el request tenga contenido
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json({
        success: false,
        error: 'Content-Type must be application/json'
      }, { status: 400 });
    }

    // Leer el body con validación
    let body;
    try {
      const text = await request.text();
      if (!text || text.trim() === '') {
        return NextResponse.json({
          success: false,
          error: 'Request body is empty'
        }, { status: 400 });
      }
      body = JSON.parse(text);
    } catch (parseError) {
      console.error('❌ Error parsing JSON:', parseError);
      return NextResponse.json({
        success: false,
        error: 'Invalid JSON format'
      }, { status: 400 });
    }

    console.log('🚀 Creating Stripe checkout session:', body);

    // Validar datos requeridos
    const { businessId, packageId, packageName, credits, bonusCredits, priceInMXN, isFirstPurchase } = body;

    if (!businessId || !packageId || !packageName || !credits || !priceInMXN) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 });
    }

    // Validar que el precio sea válido
    if (priceInMXN <= 0 || priceInMXN > 100000) {
      return NextResponse.json({
        success: false,
        error: 'Invalid price amount'
      }, { status: 400 });
    }

    // Validar que los créditos sean válidos
    if (credits <= 0 || credits > 10000) {
      return NextResponse.json({
        success: false,
        error: 'Invalid credits amount'
      }, { status: 400 });
    }

    // Obtener servicio de Stripe
    const stripeService = getStripeService();

    // Crear sesión de checkout
    const session = await stripeService.createCheckoutSession(businessId, {
      name: packageName,
      credits: parseInt(credits),
      priceInMXN: parseFloat(priceInMXN),
      bonusCredits: parseInt(bonusCredits) || 0,
      isFirstPurchase: Boolean(isFirstPurchase)
    });

    // Registrar la sesión en Firestore para tracking - Using BUSINESS collection per BEFAST FLUJO FINAL
    try {
      await updateDoc(doc(db, COLLECTIONS.BUSINESSES, businessId), {
        'billing.pendingCheckout': {
          sessionId: session.id,
          packageId,
          packageName,
          credits: parseInt(credits),
          bonusCredits: parseInt(bonusCredits) || 0,
          priceInMXN: parseFloat(priceInMXN),
          isFirstPurchase: Boolean(isFirstPurchase),
          createdAt: new Date()
        }
      });
      console.log('✅ Pending checkout registered in Firestore');
    } catch (firestoreError) {
      console.warn('⚠️ Could not register pending checkout in Firestore:', firestoreError);
      // No fallar la operación por esto, solo loggear
    }

    console.log('✅ Stripe checkout session created successfully:', session.id);

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
      message: 'Checkout session created successfully'
    });

  } catch (error: any) {
    console.error('❌ Error creating Stripe checkout session:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to create checkout session',
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

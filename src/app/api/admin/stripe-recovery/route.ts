/**
 * Stripe Recovery API
 * Busca y recupera pagos perdidos de Stripe
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStripeService } from '@/lib/services/stripeService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, paymentIntentId } = body;

    if (action === 'SEARCH_PAYMENT') {
      if (!paymentIntentId) {
        return NextResponse.json({
          success: false,
          error: 'Payment Intent ID is required'
        }, { status: 400 });
      }

      // Buscar el payment intent en Stripe
      const stripeService = getStripeService();
      
      try {
        // Usar la instancia de Stripe directamente para buscar el payment intent
        const stripe = stripeService.getStripeInstance();
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        // También buscar la sesión de checkout asociada si existe
        let checkoutSession = null;
        if (paymentIntent.metadata?.session_id) {
          try {
            checkoutSession = await stripe.checkout.sessions.retrieve(paymentIntent.metadata.session_id);
          } catch (sessionError) {
            console.warn('Could not retrieve checkout session:', sessionError);
          }
        }

        // Si no hay session_id en metadata, buscar por payment_intent
        if (!checkoutSession) {
          try {
            const sessions = await stripe.checkout.sessions.list({
              payment_intent: paymentIntentId,
              limit: 1
            });
            if (sessions.data.length > 0) {
              checkoutSession = sessions.data[0];
            }
          } catch (sessionError) {
            console.warn('Could not find checkout session by payment_intent:', sessionError);
          }
        }

        // Combinar metadata del payment intent y la sesión
        const combinedMetadata = {
          ...paymentIntent.metadata,
          ...(checkoutSession?.metadata || {})
        };

        const paymentData = {
          id: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: paymentIntent.status,
          created: paymentIntent.created,
          metadata: combinedMetadata,
          customer_email: paymentIntent.receipt_email || checkoutSession?.customer_email,
          session_id: checkoutSession?.id
        };

        console.log('✅ Payment found:', paymentIntentId);
        console.log('📋 Payment metadata:', combinedMetadata);

        return NextResponse.json({
          success: true,
          payment: paymentData,
          session: checkoutSession ? {
            id: checkoutSession.id,
            amount_total: checkoutSession.amount_total,
            metadata: checkoutSession.metadata
          } : null
        });

      } catch (stripeError: any) {
        console.error('❌ Stripe error:', stripeError);
        
        if (stripeError.code === 'resource_missing') {
          return NextResponse.json({
            success: false,
            error: 'Payment not found in Stripe'
          }, { status: 404 });
        }

        return NextResponse.json({
          success: false,
          error: `Stripe error: ${stripeError.message}`
        }, { status: 400 });
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 });

  } catch (error: any) {
    console.error('❌ Error in stripe recovery API:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
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
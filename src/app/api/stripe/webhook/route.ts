/**
 * Stripe Webhook API
 * Procesa eventos de Stripe para actualizar el estado de pagos
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStripeService } from '@/lib/services/stripeService';
import { doc, updateDoc, increment, collection, addDoc } from 'firebase/firestore';
import { COLLECTIONS } from '@/lib/collections';
import { db } from '@/lib/firebase';
import { logger } from '@/utils/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      logger.error('Missing Stripe signature', undefined, 'STRIPE_WEBHOOK');
      return NextResponse.json({
        error: 'Missing signature'
      }, { status: 400 });
    }

    // Procesar webhook con Stripe
    const stripeService = getStripeService();
    const event = await stripeService.processWebhook(body, signature);

    logger.debug('Stripe webhook received', { type: event.type }, 'STRIPE_WEBHOOK');

    // Manejar diferentes tipos de eventos
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      case 'charge.dispute.created':
        await handleDisputeCreated(event.data.object);
        break;

      default:
        logger.warn('Unhandled event type', undefined, { type: event.type }, 'STRIPE_WEBHOOK');
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully'
    });

  } catch (error: any) {
    logger.error('Error processing Stripe webhook', error, 'STRIPE_WEBHOOK');

    return NextResponse.json({
      error: 'Webhook processing failed',
      details: error.message
    }, { status: 400 });
  }
}

/**
 * Maneja el evento de checkout completado
 */
async function handleCheckoutCompleted(session: any) {
  try {
    logger.debug('Checkout session completed', { sessionId: session.id }, 'STRIPE_WEBHOOK');

    const { businessId, packageName, credits, bonusCredits, totalCredits, isFirstPurchase } = session.metadata;

    if (!businessId) {
      logger.error('No businessId in session metadata', undefined, 'STRIPE_WEBHOOK');
      return;
    }

    const creditsToAdd = parseInt(totalCredits) || (parseInt(credits) + parseInt(bonusCredits || 0));
    const isFirst = isFirstPurchase === 'true';

    // Actualizar créditos del negocio - Using BUSINESS collection per BEFAST FLUJO FINAL
    await updateDoc(doc(db, COLLECTIONS.BUSINESSES, businessId), {
      availableCredits: increment(creditsToAdd),
      'billing.lastPurchaseDate': new Date(),
      'billing.lastPurchaseAmount': session.amount_total / 100, // Convertir de centavos
      'billing.totalPurchases': increment(1),
      'billing.pendingCheckout': null // Limpiar checkout pendiente
    });

    // Registrar la transacción
    await addDoc(collection(db, COLLECTIONS.CREDIT_TRANSACTIONS), {
      businessId,
      type: 'CREDIT_PURCHASE',
      amount: session.amount_total / 100,
      credits: creditsToAdd,
      packageName,
      stripeSessionId: session.id,
      stripePaymentIntentId: session.payment_intent,
      status: 'COMPLETED',
      isFirstPurchase: isFirst,
      createdAt: new Date(),
      metadata: {
        currency: session.currency,
        paymentMethod: 'STRIPE_CARD'
      }
    });

    logger.debug('Credits added to business', { businessId, creditsToAdd }, 'STRIPE_WEBHOOK');

  } catch (error) {
    logger.error('Error handling checkout completed', error, 'STRIPE_WEBHOOK');
    throw error;
  }
}

/**
 * Maneja el evento de pago exitoso
 */
async function handlePaymentSucceeded(paymentIntent: any) {
  try {
    logger.debug('Payment succeeded', { paymentIntentId: paymentIntent.id }, 'STRIPE_WEBHOOK');

    // Aquí podrías agregar lógica adicional si necesitas manejar
    // eventos de payment_intent.succeeded por separado

  } catch (error) {
    logger.error('Error handling payment succeeded', error, 'STRIPE_WEBHOOK');
    throw error;
  }
}

/**
 * Maneja el evento de pago fallido
 */
async function handlePaymentFailed(paymentIntent: any) {
  try {
    logger.warn('Payment failed', undefined, { paymentIntentId: paymentIntent.id }, 'STRIPE_WEBHOOK');

    // Buscar la sesión de checkout asociada
    const stripeService = getStripeService();
    const sessions = await stripeService.getCheckoutSession(paymentIntent.metadata?.session_id || '');

    if (sessions && sessions.metadata?.businessId) {
      const businessId = sessions.metadata.businessId;

      // Limpiar checkout pendiente - Using BUSINESS collection per BEFAST FLUJO FINAL
      await updateDoc(doc(db, COLLECTIONS.BUSINESSES, businessId), {
        'billing.pendingCheckout': null
      });

      // Registrar transacción fallida
      await addDoc(collection(db, COLLECTIONS.CREDIT_TRANSACTIONS), {
        businessId,
        type: 'CREDIT_PURCHASE_FAILED',
        amount: paymentIntent.amount / 100,
        stripePaymentIntentId: paymentIntent.id,
        status: 'FAILED',
        failureReason: paymentIntent.last_payment_error?.message || 'Payment failed',
        createdAt: new Date(),
        metadata: {
          currency: paymentIntent.currency
        }
      });

      logger.warn('Payment failure recorded for business', undefined, { businessId }, 'STRIPE_WEBHOOK');
    }

  } catch (error) {
    logger.error('Error handling payment failed', error, 'STRIPE_WEBHOOK');
    throw error;
  }
}

/**
 * Maneja el evento de disputa creado
 */
async function handleDisputeCreated(dispute: any) {
  try {
    logger.warn('Dispute created', undefined, { disputeId: dispute.id }, 'STRIPE_WEBHOOK');

    // Registrar disputa
    await addDoc(collection(db, COLLECTIONS.STRIPE_DISPUTES), {
      stripeDisputeId: dispute.id,
      amount: dispute.amount / 100,
      currency: dispute.currency,
      reason: dispute.reason,
      status: dispute.status,
      createdAt: new Date(),
      metadata: {
        chargeId: dispute.charge,
        paymentIntentId: dispute.payment_intent
      }
    });

    logger.warn('Dispute recorded', undefined, { disputeId: dispute.id }, 'STRIPE_WEBHOOK');

  } catch (error) {
    logger.error('Error handling dispute created', error, 'STRIPE_WEBHOOK');
    throw error;
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Stripe-Signature',
    },
  });
}

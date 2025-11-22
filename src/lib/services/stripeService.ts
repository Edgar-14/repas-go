/**
 * Stripe Service - Manejo de pagos y transferencias
 * Integración completa con Stripe para procesamiento de pagos
 */

import Stripe from 'stripe';

export class StripeService {
  private stripe: Stripe;

  constructor() {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }

    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      // Usa una versión estable soportada por el SDK (según tipos instalados)
      apiVersion: '2024-04-10'
    });
  }

  /**
   * Obtiene la instancia de Stripe para uso directo
   */
  getStripeInstance(): Stripe {
    return this.stripe;
  }

  /**
   * Crea una sesión de checkout para compra de créditos
   */
  async createCheckoutSession(
    businessId: string,
    packageData: {
      name: string;
      credits: number;
      priceInMXN: number;
      bonusCredits: number;
      isFirstPurchase?: boolean;
    }
  ): Promise<Stripe.Checkout.Session> {
    try {
      const totalCredits = packageData.credits + (packageData.isFirstPurchase ? packageData.bonusCredits : 0);
      
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'mxn',
            product_data: {
              name: `Paquete ${packageData.name} - BeFast`,
              description: `${packageData.credits} créditos${packageData.bonusCredits > 0 && packageData.isFirstPurchase ? ` + ${packageData.bonusCredits} gratis` : ''}`,
              metadata: {
                packageId: packageData.name.toLowerCase(),
                credits: packageData.credits.toString(),
                bonusCredits: packageData.bonusCredits.toString()
              }
            },
            unit_amount: packageData.priceInMXN * 100 // Stripe usa centavos
          },
          quantity: 1
        }],
        mode: 'payment',
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/delivery/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/delivery/billing?cancelled=true`,
        metadata: {
          businessId,
          packageName: packageData.name,
          credits: packageData.credits.toString(),
          bonusCredits: packageData.bonusCredits.toString(),
          totalCredits: totalCredits.toString(),
          isFirstPurchase: packageData.isFirstPurchase?.toString() || 'false'
        },
        customer_email: undefined, // Se puede agregar si tenemos el email del negocio
        allow_promotion_codes: false
      });

      console.log('✅ Stripe checkout session created:', session.id);
      return session;

    } catch (error) {
      console.error('❌ Error creating Stripe checkout session:', error);
      throw new Error(`Failed to create checkout session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Crea una transferencia a un conductor
   */
  async createTransfer(
    driverId: string,
    amount: number,
    stripeAccountId: string,
    description?: string
  ): Promise<Stripe.Transfer> {
    try {
      const transfer = await this.stripe.transfers.create({
        amount: Math.round(amount * 100), // Convertir a centavos
        currency: 'mxn',
        destination: stripeAccountId,
        description: description || `Pago a conductor ${driverId}`,
        metadata: {
          driverId,
          type: 'payroll',
          source: 'befast'
        }
      });

      console.log('✅ Stripe transfer created:', transfer.id);
      return transfer;

    } catch (error) {
      console.error('❌ Error creating Stripe transfer:', error);
      throw new Error(`Failed to create transfer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Procesa un webhook de Stripe
   */
  async processWebhook(payload: string, signature: string): Promise<Stripe.Event> {
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!endpointSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
    }

    let event: Stripe.Event;
    
    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, endpointSecret);
      console.log('✅ Stripe webhook processed:', event.type);
      return event;
    } catch (err: any) {
      console.error('❌ Webhook signature verification failed:', err.message);
      throw new Error(`Webhook signature verification failed: ${err.message}`);
    }
  }

  /**
   * Recupera una sesión de checkout por ID
   */
  async getCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session> {
    try {
      const session = await this.stripe.checkout.sessions.retrieve(sessionId);
      return session;
    } catch (error) {
      console.error('❌ Error retrieving checkout session:', error);
      throw new Error(`Failed to retrieve checkout session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Crea un reembolso
   */
  async createRefund(paymentIntentId: string, amount?: number, reason?: string): Promise<Stripe.Refund> {
    try {
      const refundData: Stripe.RefundCreateParams = {
        payment_intent: paymentIntentId,
        reason: reason as Stripe.RefundCreateParams.Reason || 'requested_by_customer'
      };

      if (amount) {
        refundData.amount = Math.round(amount * 100);
      }

      const refund = await this.stripe.refunds.create(refundData);
      console.log('✅ Stripe refund created:', refund.id);
      return refund;

    } catch (error) {
      console.error('❌ Error creating refund:', error);
      throw new Error(`Failed to create refund: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Instancia singleton del servicio
let stripeServiceInstance: StripeService | null = null;

export function getStripeService(): StripeService {
  if (!stripeServiceInstance) {
    stripeServiceInstance = new StripeService();
  }
  return stripeServiceInstance;
}

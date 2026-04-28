'use server'

import { stripe } from '@/lib/stripe'
import { getPlanById } from '@/lib/products'

/**
 * Create a Stripe Embedded Checkout session for a subscription plan.
 * Returns the client_secret needed to mount EmbeddedCheckout.
 */
export async function startSubscriptionCheckout(
  planId: string,
  userId?: string,
  metadata?: { earlyAccess?: boolean; foundingContractor?: boolean },
): Promise<string> {
  const plan = getPlanById(planId)
  if (!plan) {
    throw new Error(`Plan "${planId}" not found`)
  }

  const session = await stripe.checkout.sessions.create({
    ui_mode: 'embedded',
    redirect_on_completion: 'never',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `HomeBids ${plan.name} Plan`,
            description: plan.description,
          },
          unit_amount: plan.priceInCents,
          recurring: {
            interval: 'month',
          },
        },
        quantity: 1,
      },
    ],
    mode: 'subscription',
    subscription_data: {
      trial_period_days: 3,
      // Pass userId + planId through so the webhook can link the subscription
      // back to the correct Supabase user without relying on the browser session.
      metadata: {
        userId: userId ?? '',
        planId,
        userType: plan.userType,
        ...(metadata?.earlyAccess && { early_access: 'true' }),
        ...(metadata?.foundingContractor && { founding_contractor: 'true' }),
      },
    },
    // Also store on the session itself for checkout.session.completed events.
    metadata: {
      userId: userId ?? '',
      planId,
      userType: plan.userType,
      ...(metadata?.earlyAccess && { early_access: 'true' }),
      ...(metadata?.foundingContractor && { founding_contractor: 'true' }),
    },
    payment_method_types: [
      'card',
      'link',
    ],
  })

  if (!session.client_secret) {
    throw new Error('Failed to create checkout session')
  }

  return session.client_secret
}

/**
 * Create a Stripe Payment Intent for a one-time bid fee.
 * Returns the client_secret needed to confirm the payment.
 */
export async function createBidFeePaymentIntent(planId: string): Promise<string> {
  const plan = getPlanById(planId)
  if (!plan || plan.bidFeeInCents === 0) {
    throw new Error(`Invalid plan for bid fee: "${planId}"`)
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: plan.bidFeeInCents,
    currency: 'usd',
    automatic_payment_methods: { enabled: true },
    description: `HomeBids bid fee – ${plan.name} plan`,
    metadata: { planId },
  })

  if (!paymentIntent.client_secret) {
    throw new Error('Failed to create payment intent')
  }

  return paymentIntent.client_secret
}

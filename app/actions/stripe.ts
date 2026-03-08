'use server'

import { stripe } from '@/lib/stripe'
import { getPlanById } from '@/lib/products'

/**
 * Create a Stripe Embedded Checkout session for a subscription plan.
 * Returns the client_secret needed to mount EmbeddedCheckout.
 */
export async function startSubscriptionCheckout(planId: string): Promise<string> {
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
    },
    // Stripe's embedded checkout automatically surfaces Apple Pay and
    // Google Pay based on the customer's browser/device. Link enables
    // one-click checkout for returning Stripe customers.
    // Note: cashapp requires a redirect and is incompatible with embedded checkout.
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

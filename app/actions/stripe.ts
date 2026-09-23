'use server'

import { stripe } from '@/lib/stripe'
import { getPlanById } from '@/lib/products'

/**
 * Create a Stripe Embedded Checkout session for a subscription plan.
 * Returns the client_secret needed to mount EmbeddedCheckout.
 * Throws "SIGN_IN_REQUIRED" if userId is missing — the UI should prevent this.
 */
export async function startSubscriptionCheckout(
  planId: string,
  userId?: string,
): Promise<string> {
  if (!userId) {
    throw new Error('SIGN_IN_REQUIRED')
  }

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
            name: 'HomeBids Pro', // Tim (Sep 24): was "HomeBids HomeBids AI Growth Tools Plan" on the Stripe sheet
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
      // Pass userId + planId through so the webhook can link the subscription
      // back to the correct Supabase user without relying on the browser session.
      metadata: {
        userId,
        planId,
        userType: plan.userType,
      },
    },
    // Also store on the session itself for checkout.session.completed events.
    metadata: {
      userId,
      planId,
      userType: plan.userType,
    },
  })

  if (!session.client_secret) {
    throw new Error('Failed to create checkout session')
  }

  return session.client_secret
}

/**
 * A2 PHONEUNLOCK (Sep 23): account-less upgrade for texting contractors.
 * Wall/countdown texts link to /upgrade?p=<phone>. This creates an embedded
 * checkout session keyed by PHONE in metadata; the Stripe webhook then writes
 * a phone-keyed subscriptions row and check_bid_allowance v3 unlocks by digit
 * match. No account, no sign-in — the card form renders immediately.
 */
export async function startPhoneUpgradeCheckout(rawPhone: string): Promise<string> {
  const digits = String(rawPhone || '').replace(/\D/g, '')
  const ten = digits.slice(-10)
  if (ten.length < 10) {
    throw new Error('INVALID_PHONE')
  }
  const phone = '+1' + ten

  const plan = getPlanById('contractor-growth')
  if (!plan) {
    throw new Error('Plan "contractor-growth" not found')
  }

  const session = await stripe.checkout.sessions.create({
    ui_mode: 'embedded',
    redirect_on_completion: 'never',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'HomeBids Pro', // Tim (Sep 24): was "HomeBids HomeBids AI Growth Tools Plan" on the Stripe sheet
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
      // Phone travels in metadata so the webhook can unlock the gate
      // without any Supabase user existing yet.
      metadata: { phone, planId: plan.id, userType: 'contractor', flow: 'phone_upgrade' },
    },
    metadata: { phone, planId: plan.id, userType: 'contractor', flow: 'phone_upgrade' },
  })

  if (!session.client_secret) {
    throw new Error('Failed to create checkout session')
  }

  return session.client_secret
}

// Bid fees are not charged — HomeBids uses a flat $99/month subscription.
// Contractors can bid on unlimited projects with no per-bid charges.

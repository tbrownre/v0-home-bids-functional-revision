'use server'

import { headers } from 'next/headers'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { getPlanById } from '@/lib/products'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const EXPECTED_PRICE_AMOUNT = 9900
const EXPECTED_PRICE_CURRENCY = 'usd'

async function getValidatedContractorPrice(): Promise<Stripe.Price> {
  const priceId = process.env.STRIPE_CONTRACTOR_PRICE_ID
  if (!priceId || !priceId.startsWith('price_')) {
    throw new Error('STRIPE_CONTRACTOR_PRICE_ID must be configured with a valid Stripe Price ID')
  }

  const price = await stripe.prices.retrieve(priceId, { expand: ['product'] })
  const product = price.product as Stripe.Product
  const keyIsLive = process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_') ?? false

  if (
    !price.active ||
    price.unit_amount !== EXPECTED_PRICE_AMOUNT ||
    price.currency !== EXPECTED_PRICE_CURRENCY ||
    price.recurring?.interval !== 'month' ||
    price.recurring.interval_count !== 1 ||
    !product.active ||
    price.livemode !== keyIsLive
  ) {
    throw new Error('STRIPE_CONTRACTOR_PRICE_ID does not match the active $99/month HomeBids contractor plan')
  }

  return price
}

async function getCheckoutOrigin(): Promise<string> {
  const requestHeaders = await headers()
  const host = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host')
  const protocol = requestHeaders.get('x-forwarded-proto') ?? 'https'
  if (!host) throw new Error('Unable to determine the checkout return URL')
  return `${protocol}://${host}`
}

/**
 * Create one reusable Stripe Embedded Checkout session for the authenticated
 * contractor. The server, not the browser, is authoritative for user identity.
 */
export async function startSubscriptionCheckout(planId: string): Promise<string> {
  const plan = getPlanById(planId)
  if (!plan || plan.userType !== 'contractor') {
    throw new Error(`Contractor plan "${planId}" not found`)
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('You must be signed in to start contractor checkout')

  const price = await getValidatedContractorPrice()
  const { data: storedSubscription } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id, stripe_subscription_id, status')
    .eq('user_id', user.id)
    .maybeSingle()

  if (storedSubscription?.stripe_subscription_id && ['active', 'trialing', 'past_due', 'unpaid'].includes(storedSubscription.status)) {
    throw new Error('This contractor already has a Stripe subscription')
  }

  let customerId = storedSubscription?.stripe_customer_id ?? null
  if (customerId) {
    const customer = await stripe.customers.retrieve(customerId)
    if (customer.deleted) customerId = null
  }

  if (!customerId) {
    const matchingCustomers = await stripe.customers.search({
      query: `metadata['homebids_user_id']:'${user.id}'`,
      limit: 1,
    })
    customerId = matchingCustomers.data[0]?.id ?? null
  }

  if (!customerId) {
    const customer = await stripe.customers.create(
      {
        email: user.email,
        metadata: { homebids_user_id: user.id, userType: 'contractor' },
      },
      { idempotencyKey: `homebids-contractor-customer-${user.id}` },
    )
    customerId = customer.id
  }

  const existingSubscriptions = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 10 })
  if (existingSubscriptions.data.some((subscription) => ['active', 'trialing', 'past_due', 'unpaid'].includes(subscription.status))) {
    throw new Error('This contractor already has a Stripe subscription')
  }

  const origin = await getCheckoutOrigin()
  const metadata = { userId: user.id, planId, userType: 'contractor' }
  const session = await stripe.checkout.sessions.create(
    {
      ui_mode: 'embedded',
      return_url: `${origin}/onboarding/complete?session_id={CHECKOUT_SESSION_ID}`,
      redirect_on_completion: 'always',
      customer: customerId,
      line_items: [{ price: price.id, quantity: 1 }],
      mode: 'subscription',
      payment_method_collection: 'always',
      subscription_data: {
        trial_period_days: 3,
        metadata,
      },
      metadata,
    },
  )

  if (!session.client_secret) throw new Error('Failed to create checkout session')

  const admin = createAdminClient()
  const { error: persistError } = await admin.from('subscriptions').upsert({
    user_id: user.id,
    plan_id: planId,
    status: 'incomplete',
    stripe_customer_id: customerId,
    stripe_checkout_session_id: session.id,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })
  if (persistError) throw new Error('Failed to save checkout progress')

  await admin.from('contractor_profiles').update({
    onboarding_step: 2,
    onboarding_updated_at: new Date().toISOString(),
  }).eq('id', user.id)
  await admin.from('onboarding_events').insert({
    user_id: user.id,
    event_type: 'checkout_started',
    metadata: { checkout_session_id: session.id, plan_id: planId },
  })

  return session.client_secret
}

// Bid fees are not charged — HomeBids uses a flat $99/month subscription.
// Contractors can bid on unlimited projects with no per-bid charges.

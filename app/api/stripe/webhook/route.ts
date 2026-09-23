import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Service-role Supabase client — only used server-side in this route handler.
 * Never expose SUPABASE_SERVICE_ROLE_KEY to the browser.
 */
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    )
  } catch (err) {
    console.error('[stripe-webhook] Signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = getServiceClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session, supabase)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(subscription, supabase)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription, supabase)
        break
      }

      default:
        // Acknowledge unhandled events without erroring.
        break
    }
  } catch (err) {
    console.error(`[stripe-webhook] Error handling ${event.type}:`, err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  supabase: SupabaseClient,
) {
  const userId = session.metadata?.userId
  const planId = session.metadata?.planId
  const userType = session.metadata?.userType
  const phone = session.metadata?.phone

  // A2 PHONEUNLOCK (Sep 23): account-less upgrade — phone in metadata, no userId.
  if (!userId && phone) {
    await handlePhoneCheckoutCompleted(session, phone, planId, supabase)
    return
  }

  if (!userId) {
    console.warn('[stripe-webhook] checkout.session.completed missing userId metadata — skipping DB write')
    return
  }

  const customerId = typeof session.customer === 'string'
    ? session.customer
    : session.customer?.id ?? null

  const subscriptionId = typeof session.subscription === 'string'
    ? session.subscription
    : session.subscription?.id ?? null

  // Fetch full subscription to get period dates and status.
  // As of the 2025-03-31.basil API, current_period_end moved to items.data[x].current_period_end.
  let periodEnd: string | null = null
  let subStatus: string = 'active'
  if (subscriptionId) {
    const sub = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['items'],
    })
    subStatus = sub.status
    const firstItem = sub.items?.data?.[0]
    const rawEnd = (firstItem as { current_period_end?: number })?.current_period_end ?? null
    periodEnd = rawEnd ? new Date(rawEnd * 1000).toISOString() : null
  }

  // Upsert subscription record.
  const { error: subError } = await supabase
    .from('subscriptions')
    .upsert(
      {
        user_id: userId,
        plan_id: planId ?? 'unknown',
        status: subStatus,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        current_period_end: periodEnd,
      },
      { onConflict: 'user_id' },
    )

  if (subError) {
    console.error('[stripe-webhook] Failed to upsert subscription:', subError)
    throw subError
  }

  // If this is a contractor, mark them as approved in contractor_profiles.
  // contractor_profiles.id = auth.users.id (there is no user_id column).
  if (userType === 'contractor') {
    const { error: cpError } = await supabase
      .from('contractor_profiles')
      .update({ approval_status: 'approved', is_approved: true })
      .eq('id', userId)

    if (cpError) {
      console.error('[stripe-webhook] Failed to approve contractor_profile:', cpError)
      // Non-fatal — log and continue.
    }
  }
}

/**
 * A2 PHONEUNLOCK: write a phone-keyed subscription row (no account) and
 * queue Tim's "You're officially Pro" text via the notify worker.
 * check_bid_allowance v3 unlocks this phone by digit match immediately.
 */
async function handlePhoneCheckoutCompleted(
  session: Stripe.Checkout.Session,
  rawPhone: string,
  planId: string | undefined,
  supabase: SupabaseClient,
) {
  const digits = String(rawPhone).replace(/\D/g, '').slice(-10)
  if (digits.length < 10) {
    console.warn('[stripe-webhook] phone_upgrade with invalid phone — skipping')
    return
  }
  const e164 = '+1' + digits

  const customerId = typeof session.customer === 'string'
    ? session.customer
    : session.customer?.id ?? null

  const subscriptionId = typeof session.subscription === 'string'
    ? session.subscription
    : session.subscription?.id ?? null

  let periodEnd: string | null = null
  let subStatus: string = 'active'
  if (subscriptionId) {
    const sub = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['items'],
    })
    subStatus = sub.status
    const firstItem = sub.items?.data?.[0]
    const rawEnd = (firstItem as { current_period_end?: number })?.current_period_end ?? null
    periodEnd = rawEnd ? new Date(rawEnd * 1000).toISOString() : null
  }

  const row = {
    user_id: null as string | null,
    phone: e164,
    plan_id: planId ?? 'contractor-growth',
    status: subStatus,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscriptionId,
    stripe_checkout_session_id: session.id,
    current_period_end: periodEnd,
  }

  const { error: subError } = subscriptionId
    ? await supabase.from('subscriptions').upsert(row, { onConflict: 'stripe_subscription_id' })
    : await supabase.from('subscriptions').insert(row)

  if (subError) {
    console.error('[stripe-webhook] Failed to write phone subscription:', subError)
    throw subError
  }

  // A3: Tim's verbatim Pro confirmation, from the Bid Builder number,
  // through the notify worker (alerts never ride direct sends).
  const { error: notifyError } = await supabase.from('notify_outbox').insert({
    to_number: e164,
    from_number: '+12832291348',
    body: "You're officially Pro 🚀\n\nUnlimited bids are unlocked.\n\nWhenever you're ready, just text me your next job.",
    dedupe_key: 'pro-' + digits,
  })
  if (notifyError) {
    // Unlock already happened — never fail the webhook over the text.
    console.error('[stripe-webhook] Failed to queue Pro confirmation text:', notifyError)
  }
}

async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
  supabase: SupabaseClient,
) {
  const userId = subscription.metadata?.userId
  const phone = subscription.metadata?.phone

  // current_period_end moved to items level in the 2025-03-31.basil API.
  const firstItem = subscription.items?.data?.[0]
  const rawEnd = (firstItem as { current_period_end?: number })?.current_period_end ?? null
  const periodEnd = rawEnd ? new Date(rawEnd * 1000).toISOString() : null

  // A2 PHONEUNLOCK rows have no user_id — key on the Stripe subscription id.
  if (!userId && phone) {
    const { error: phoneUpdError } = await supabase
      .from('subscriptions')
      .update({ status: subscription.status, current_period_end: periodEnd })
      .eq('stripe_subscription_id', subscription.id)
    if (phoneUpdError) {
      console.error('[stripe-webhook] Failed to update phone subscription:', phoneUpdError)
      throw phoneUpdError
    }
    return
  }

  if (!userId) return

  const { error: updError } = await supabase
    .from('subscriptions')
    .update({
      status: subscription.status,
      stripe_subscription_id: subscription.id,
      current_period_end: periodEnd,
    })
    .eq('user_id', userId)

  if (updError) {
    console.error('[stripe-webhook] Failed to update subscription:', updError)
    throw updError
  }
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  supabase: SupabaseClient,
) {
  const userId = subscription.metadata?.userId
  const phone = subscription.metadata?.phone

  // A2 PHONEUNLOCK rows have no user_id — cancel by Stripe subscription id.
  if (!userId && phone) {
    const { error: phoneDelError } = await supabase
      .from('subscriptions')
      .update({ status: 'canceled' })
      .eq('stripe_subscription_id', subscription.id)
    if (phoneDelError) {
      console.error('[stripe-webhook] Failed to cancel phone subscription:', phoneDelError)
      throw phoneDelError
    }
    return
  }

  if (!userId) return

  const { error: delError } = await supabase
    .from('subscriptions')
    .update({ status: 'canceled' })
    .eq('user_id', userId)

  if (delError) {
    console.error('[stripe-webhook] Failed to cancel subscription:', delError)
    throw delError
  }
}

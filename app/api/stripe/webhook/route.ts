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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
) {
  const userId = session.metadata?.userId
  const planId = session.metadata?.planId
  const userType = session.metadata?.userType

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
    const firstItem = sub.items?.data?.[0] as any
    const rawEnd = firstItem?.current_period_end ?? null
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

  console.log(`[stripe-webhook] checkout.session.completed processed for user ${userId}`)
}

async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
) {
  const userId = subscription.metadata?.userId
  if (!userId) return

  // current_period_end moved to items level in the 2025-03-31.basil API.
  const firstItem = (subscription.items?.data?.[0] as any)
  const rawEnd = firstItem?.current_period_end ?? null
  const periodEnd = rawEnd ? new Date(rawEnd * 1000).toISOString() : null

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
) {
  const userId = subscription.metadata?.userId
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

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'

type AdminClient = ReturnType<typeof createAdminClient>

function isoFromUnix(value: number | null | undefined) {
  return value ? new Date(value * 1000).toISOString() : null
}

function getPeriodEnd(subscription: Stripe.Subscription) {
  const item = subscription.items.data[0] as Stripe.SubscriptionItem & { current_period_end?: number }
  return isoFromUnix(item?.current_period_end)
}

async function resolveUserId(subscription: Stripe.Subscription, supabase: AdminClient) {
  if (subscription.metadata?.userId) return subscription.metadata.userId
  const { data } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscription.id)
    .maybeSingle()
  return data?.user_id ?? null
}

async function queueMessage(
  supabase: AdminClient,
  userId: string,
  templateKey: string,
  dedupeKey: string,
  scheduledFor = new Date(),
) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('email, phone, full_name, marketing_email_consent, marketing_sms_consent')
    .eq('id', userId)
    .maybeSingle()

  if (!profile) return
  const messages = []
  if (profile.marketing_email_consent && profile.email) {
    messages.push({
      user_id: userId,
      channel: 'email',
      template_key: templateKey,
      recipient: profile.email,
      scheduled_for: scheduledFor.toISOString(),
      dedupe_key: `${dedupeKey}:email`,
      payload: { first_name: profile.full_name?.split(' ')[0] ?? 'there' },
    })
  }
  if (profile.marketing_sms_consent && profile.phone) {
    messages.push({
      user_id: userId,
      channel: 'sms',
      template_key: templateKey,
      recipient: profile.phone,
      scheduled_for: scheduledFor.toISOString(),
      dedupe_key: `${dedupeKey}:sms`,
      payload: { first_name: profile.full_name?.split(' ')[0] ?? 'there' },
    })
  }
  if (messages.length) {
    await supabase.from('communication_outbox').upsert(messages, {
      onConflict: 'dedupe_key',
      ignoreDuplicates: true,
    })
  }
}

async function syncSubscription(subscription: Stripe.Subscription, supabase: AdminClient) {
  const userId = await resolveUserId(subscription, supabase)
  if (!userId) return null

  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer.id
  const { error } = await supabase.from('subscriptions').upsert({
    user_id: userId,
    plan_id: subscription.metadata?.planId ?? 'contractor-monthly',
    status: subscription.status,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    current_period_end: getPeriodEnd(subscription),
    trial_end: isoFromUnix(subscription.trial_end),
    cancel_at_period_end: subscription.cancel_at_period_end,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })
  if (error) throw error
  return userId
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature')
  if (!signature) return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      await request.text(),
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    )
  } catch (error) {
    console.error('[stripe-webhook] Signature verification failed:', error)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data: priorEvent } = await supabase
    .from('stripe_webhook_events')
    .select('event_id')
    .eq('event_id', event.id)
    .maybeSingle()
  if (priorEvent) return NextResponse.json({ received: true, duplicate: true })

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const userId = session.metadata?.userId
        const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id
        if (userId && subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId, { expand: ['items'] })
          await syncSubscription(subscription, supabase)
          await supabase.from('subscriptions').update({ stripe_checkout_session_id: session.id }).eq('user_id', userId)
          await supabase.from('contractor_profiles').update({
            onboarding_step: 3,
            onboarding_completed_at: new Date().toISOString(),
            onboarding_updated_at: new Date().toISOString(),
            approval_status: 'approved',
            is_approved: true,
          }).eq('id', userId)
          await supabase.rpc('cancel_pending_communications', { target_user_id: userId })
          await supabase.from('onboarding_events').insert({
            user_id: userId,
            event_type: 'trial_started',
            metadata: { checkout_session_id: session.id, subscription_id: subscriptionId },
          })
          await queueMessage(supabase, userId, 'trial_started', `trial-started:${subscriptionId}`)
        }
        break
      }
      case 'checkout.session.expired': {
        const session = event.data.object
        if (session.metadata?.userId) {
          await supabase.from('onboarding_events').insert({
            user_id: session.metadata.userId,
            event_type: 'checkout_expired',
            metadata: { checkout_session_id: session.id },
          })
        }
        break
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object
        const userId = await syncSubscription(subscription, supabase)
        if (userId && subscription.cancel_at_period_end) {
          await queueMessage(supabase, userId, 'subscription_canceling', `subscription-canceling:${subscription.id}`)
        }
        break
      }
      case 'customer.subscription.trial_will_end': {
        const subscription = event.data.object
        const userId = await syncSubscription(subscription, supabase)
        if (userId) await queueMessage(supabase, userId, 'trial_ending', `trial-ending:${subscription.id}`)
        break
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        const userId = await syncSubscription(subscription, supabase)
        if (userId) await queueMessage(supabase, userId, 'subscription_ended', `subscription-ended:${subscription.id}`)
        break
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object
        const subscriptionId = typeof invoice.parent?.subscription_details?.subscription === 'string'
          ? invoice.parent.subscription_details.subscription
          : invoice.parent?.subscription_details?.subscription?.id
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          const userId = await syncSubscription(subscription, supabase)
          if (userId) {
            await supabase.from('subscriptions').update({ last_payment_error: 'Payment failed' }).eq('user_id', userId)
            await queueMessage(supabase, userId, 'payment_failed', `payment-failed:${invoice.id}`)
          }
        }
        break
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object
        const subscriptionId = typeof invoice.parent?.subscription_details?.subscription === 'string'
          ? invoice.parent.subscription_details.subscription
          : invoice.parent?.subscription_details?.subscription?.id
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          const userId = await syncSubscription(subscription, supabase)
          if (userId) await supabase.from('subscriptions').update({ last_payment_error: null }).eq('user_id', userId)
        }
        break
      }
      default:
        break
    }

    const { error: eventError } = await supabase.from('stripe_webhook_events').insert({
      event_id: event.id,
      event_type: event.type,
    })
    if (eventError && eventError.code !== '23505') throw eventError
  } catch (error) {
    console.error(`[stripe-webhook] Error handling ${event.type}:`, error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

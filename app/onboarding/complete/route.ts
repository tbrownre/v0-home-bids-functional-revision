import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('session_id')
  if (!sessionId?.startsWith('cs_')) {
    return NextResponse.redirect(new URL('/subscribe?type=contractor', request.url))
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(new URL('/subscribe?type=contractor', request.url))
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId)
  if (session.metadata?.userId !== user.id || session.status !== 'complete') {
    return NextResponse.redirect(new URL(`/subscribe?type=contractor&userId=${user.id}`, request.url))
  }

  const admin = createAdminClient()
  const subscriptionId = typeof session.subscription === 'string'
    ? session.subscription
    : session.subscription?.id
  if (subscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, { expand: ['items'] })
    const item = subscription.items.data[0] as typeof subscription.items.data[number] & { current_period_end?: number }
    await admin.from('subscriptions').upsert({
      user_id: user.id,
      plan_id: session.metadata?.planId ?? 'contractor-monthly',
      status: subscription.status,
      stripe_customer_id: typeof session.customer === 'string' ? session.customer : session.customer?.id,
      stripe_subscription_id: subscription.id,
      stripe_checkout_session_id: session.id,
      current_period_end: item.current_period_end ? new Date(item.current_period_end * 1000).toISOString() : null,
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    await admin.from('contractor_profiles').update({
      onboarding_step: 3,
      onboarding_completed_at: new Date().toISOString(),
      onboarding_updated_at: new Date().toISOString(),
    }).eq('id', user.id)
    await admin.rpc('cancel_pending_communications', { target_user_id: user.id })
  }

  return NextResponse.redirect(new URL('/contractors/dashboard?onboarding=complete', request.url))
}

import { redirect } from 'next/navigation'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export default async function OnboardingCompletePage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id: sessionId } = await searchParams
  if (!sessionId?.startsWith('cs_')) redirect('/contractors/signup')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in?redirect=/onboarding/complete')

  const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['customer'] })
  if (session.status !== 'complete' || session.metadata?.supabase_user_id !== user.id) {
    redirect('/contractors/signup?checkout=canceled')
  }

  const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id
  if (!subscriptionId) redirect('/contractors/signup?checkout=canceled')

  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['default_payment_method', 'customer'],
  })
  if (!['trialing', 'active'].includes(subscription.status)) redirect('/contractors/signup?checkout=canceled')

  const customer = subscription.customer as Stripe.Customer
  const hasPaymentMethod = Boolean(subscription.default_payment_method || customer.invoice_settings.default_payment_method)
  if (!hasPaymentMethod) redirect('/contractors/signup?checkout=canceled')

  const item = subscription.items.data[0] as typeof subscription.items.data[number] & { current_period_end?: number }
  const admin = createAdminClient()
  const { error: subscriptionError } = await admin.from('subscriptions').upsert({
    user_id: user.id,
    plan_id: session.metadata?.planId ?? 'contractor-monthly',
    status: subscription.status,
    stripe_customer_id: customer.id,
    stripe_subscription_id: subscription.id,
    stripe_checkout_session_id: session.id,
    current_period_end: item.current_period_end ? new Date(item.current_period_end * 1000).toISOString() : null,
    trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
    trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
    cancel_at_period_end: subscription.cancel_at_period_end,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })
  if (subscriptionError) throw new Error('Unable to save verified Stripe subscription')

  const now = new Date().toISOString()
  const { error: onboardingError } = await admin.from('contractor_profiles').update({
    onboarding_step: 3,
    onboarding_status: 'onboarding_complete',
    onboarding_completed_at: now,
    onboarding_updated_at: now,
  }).eq('id', user.id)
  if (onboardingError) throw new Error('Unable to complete contractor onboarding')

  await admin.rpc('cancel_pending_communications', { target_user_id: user.id })
  redirect('/contractors/dashboard?onboarding=complete')
}

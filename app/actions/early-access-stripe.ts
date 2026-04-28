'use server'

import { stripe } from '@/lib/stripe'
import { getPlanById } from '@/lib/products'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Create a Stripe Embedded Checkout session with Early Access metadata
 */
export async function startEarlyAccessCheckout(
  planId: string,
  role: 'homeowner' | 'contractor',
  userId?: string,
): Promise<string> {
  const plan = getPlanById(planId)
  if (!plan) {
    throw new Error(`Plan "${planId}" not found`)
  }

  // Verify user auth if userId provided
  let metadata: Record<string, string> = {
    planId,
    userType: role,
    early_access: 'true',
    founding_contractor: role === 'contractor' ? 'true' : 'false',
  }

  if (userId) {
    metadata.userId = userId
  }

  const session = await stripe.checkout.sessions.create({
    ui_mode: 'embedded',
    redirect_on_completion: 'if_required',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `HomeBids ${plan.name} Plan - Early Access`,
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
      trial_period_days: plan.hasTrial !== false ? 3 : 0,
      metadata,
    },
    metadata,
    payment_method_types: ['card', 'link'],
  })

  if (!session.client_secret) {
    throw new Error('Failed to create checkout session')
  }

  return session.client_secret
}

/**
 * Mark contractor as founding contractor after successful payment
 */
export async function markFoundingContractor(userId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('contractor_profiles')
    .update({
      is_founding_contractor: true,
      founding_timestamp: new Date().toISOString(),
    })
    .eq('user_id', userId)

  if (error) {
    console.error('[v0] Error marking founding contractor:', error)
    // Non-blocking - don't fail payment if this fails
  }

  revalidatePath('/dashboard')
}

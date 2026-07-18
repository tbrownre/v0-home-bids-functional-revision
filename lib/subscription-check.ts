'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Check if a contractor has an active or trialing subscription.
 * Returns { hasValidSubscription: boolean, error?: string }.
 * Admins (is_admin = true) always pass.
 */
export async function checkContractorSubscription(userId: string) {
  try {
    const supabase = await createClient()

    // First check if the user is an admin — admins bypass the gate
    const { data: profile, error: profileError } = await supabase
      .from('contractor_profiles')
      .select('is_admin')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('[subscription-check] Failed to fetch contractor profile:', profileError)
      return { hasValidSubscription: false, error: 'Failed to verify subscription status' }
    }

    if (profile?.is_admin) {
      return { hasValidSubscription: true }
    }

    // Check subscription status in the subscriptions table
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', userId)
      .single()

    if (subError) {
      // No subscription found is treated as invalid
      console.warn(`[subscription-check] No subscription found for user ${userId}`)
      return { hasValidSubscription: false }
    }

    // Only 'active' and 'trialing' statuses are valid
    const isValid = subscription?.status === 'active' || subscription?.status === 'trialing'
    return { hasValidSubscription: isValid }
  } catch (e) {
    console.error('[subscription-check] Error:', e)
    return { hasValidSubscription: false, error: (e as Error).message ?? 'Unknown error' }
  }
}

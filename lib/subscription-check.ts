'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { findSubscriptionForUser } from '@/lib/supabase/my-subscription'

/**
 * Check if a contractor has an active or trialing subscription.
 * Returns { hasValidSubscription: boolean, error?: string }.
 * Admins (is_admin = true) always pass.
 */
export async function checkContractorSubscription(userId: string) {
  try {
    const supabase = await createClient()

    // First check if the user is an admin — admins bypass the gate
    // Use maybeSingle() so a missing profile row doesn't block paying subscribers
    const { data: profile, error: profileError } = await supabase
      .from('contractor_profiles')
      .select('is_admin')
      .eq('id', userId)
      .maybeSingle()

    if (profileError) {
      console.error('[subscription-check] Failed to fetch contractor profile:', profileError)
      // Don't deny access on profile fetch errors — continue to subscription check
    }

    if (profile?.is_admin) {
      return { hasValidSubscription: true }
    }

    // Check subscription status — by user_id, else the phone-keyed row from a phone-first checkout
    // (SUBLINK, Oct 8; orphan rows are not visible under RLS, so this goes through the service role).
    const subscription = await findSubscriptionForUser(createAdminClient(), userId)

    if (!subscription) {
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

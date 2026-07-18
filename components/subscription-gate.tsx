'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { checkContractorSubscription } from '@/lib/subscription-check'

interface SubscriptionGateProps {
  children: React.ReactNode
  userType: 'contractor'
}

/**
 * Client-side subscription gate for contractor routes.
 * Checks if the user has an active or trialing subscription.
 * Redirects to /subscribe?type=contractor if not.
 */
export function SubscriptionGate({ children, userType }: SubscriptionGateProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    const checkAccess = async () => {
      let userId: string | null = null
      try {
        const supabase = createClient()

        // Get the current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
          // Not signed in — redirect to sign-in
          router.push('/sign-in')
          return
        }

        userId = user.id

        // Skip the gate for signup routes — they have their own guards
        if (pathname?.includes('/contractors/signup')) {
          setAuthorized(true)
          setLoading(false)
          return
        }

        // Check subscription for all other contractor routes
        const { hasValidSubscription } = await checkContractorSubscription(user.id)

        if (!hasValidSubscription) {
          // No valid subscription — redirect to payment with userId
          router.push(`/subscribe?type=contractor&userId=${user.id}`)
          return
        }

        setAuthorized(true)
      } catch (e) {
        console.error('[subscription-gate] Access check failed:', e)
        // If we have a userId, include it in the redirect so the webhook can link the subscription
        if (userId) {
          router.push(`/subscribe?type=contractor&userId=${userId}`)
        } else {
          router.push('/subscribe?type=contractor')
        }
      } finally {
        setLoading(false)
      }
    }

    checkAccess()
  }, [pathname, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!authorized) {
    return null
  }

  return children
}

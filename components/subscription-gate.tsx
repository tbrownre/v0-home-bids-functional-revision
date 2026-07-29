'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface SubscriptionGateProps {
  children: React.ReactNode
  userType: 'contractor'
}

/**
 * Client-side access gate for contractor routes (freemium model).
 * Allows all logged-in contractors to access dashboard pages.
 * Admin bypass still applies. Redirects only logged-out users to sign-in.
 */
export function SubscriptionGate({ children, userType }: SubscriptionGateProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const supabase = createClient()

        // Get the current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
          // Not signed in — redirect to sign-in
          router.push(`/auth/sign-in?redirect=${pathname}`)
          return
        }

        // Logged-in contractors can access all dashboard pages (freemium)
        setAuthorized(true)
      } catch (e) {
        console.error('[subscription-gate] Access check failed:', e)
        router.push(`/auth/sign-in?redirect=${pathname}`)
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

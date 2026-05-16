'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { startSubscriptionCheckout } from '@/app/actions/stripe'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface SubscriptionCheckoutProps {
  planId: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function SubscriptionCheckout({ planId, onSuccess, onCancel }: SubscriptionCheckoutProps) {
  const searchParams = useSearchParams()
  const [isComplete, setIsComplete] = useState(false)
  const [userId, setUserId] = useState<string | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)

  // Resolve the current user once so the fetchClientSecret callback can
  // include it in the Stripe session metadata for the webhook to use.
  useEffect(() => {
    const sb = createClient()
    sb.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id)
    }).catch(err => {
      console.error('[SubscriptionCheckout] Auth check failed:', err)
      setError("We couldn't verify your account. Please try again.")
    })
  }, [])

  // Keep the latest onSuccess in a ref so the stable onComplete callback
  // can call it without ever changing its own identity — Stripe forbids
  // mutating options (including onComplete) after the first render.
  const onSuccessRef = useRef(onSuccess)
  useEffect(() => { onSuccessRef.current = onSuccess }, [onSuccess])

  const fetchClientSecret = useCallback(
    async () => {
      try {
        return await startSubscriptionCheckout(planId, userId)
      } catch (err) {
        console.error('[SubscriptionCheckout] Failed to start checkout:', err)
        setError("We couldn't start checkout. Please try again.")
        throw err
      }
    },
    [planId, userId],
  )

  // Stable reference — created once per mount, never recreated.
  const handleComplete = useCallback(() => {
    setIsComplete(true)
  }, [])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 border border-destructive/30">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h3 className="mt-4 text-xl font-semibold text-foreground">Something went wrong</h3>
        <p className="mt-2 text-muted-foreground">{error}</p>
        <Button className="mt-6" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    )
  }

  if (isComplete) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="mt-4 text-xl font-semibold text-foreground">Subscription Active!</h3>
        <p className="mt-2 text-muted-foreground">
          Your 3-day free trial has started. Welcome to HomeBids.
        </p>
        <Button className="mt-6" onClick={() => onSuccessRef.current?.()}>
          Get Started
        </Button>
      </div>
    )
  }

  return (
    <div id="checkout">
      <EmbeddedCheckoutProvider
        stripe={stripePromise}
        options={{
          fetchClientSecret,
          onComplete: handleComplete,
        }}
      >
        <EmbeddedCheckout className="rounded-xl" />
      </EmbeddedCheckoutProvider>
    </div>
  )
}

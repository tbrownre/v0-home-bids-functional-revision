'use client'

import { useCallback, useState } from 'react'
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { AlertCircle } from 'lucide-react'
import { startSubscriptionCheckout } from '@/app/actions/stripe'
import { Button } from '@/components/ui/button'

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
const stripePromise = publishableKey ? loadStripe(publishableKey) : null
const failureMessage = "We couldn’t open secure checkout. Your account and information are saved. Please try again."

export function SubscriptionCheckout({ planId }: { planId: string; onSuccess?: () => void; onCancel?: () => void }) {
  const [attempt, setAttempt] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const fetchClientSecret = useCallback(async () => {
    setError(null)
    try {
      return await startSubscriptionCheckout(planId)
    } catch (err) {
      console.error('[SubscriptionCheckout] Failed to open secure checkout:', err)
      setError(failureMessage)
      throw err
    }
  }, [planId, attempt])

  if (!stripePromise) {
    return <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{failureMessage}</div>
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <AlertCircle className="h-8 w-8 text-destructive" aria-hidden="true" />
        <p className="max-w-md text-sm text-destructive" role="alert">{error}</p>
        <Button onClick={() => { setError(null); setAttempt((value) => value + 1) }}>Try Again</Button>
      </div>
    )
  }

  return (
    <div id="checkout" aria-label="Secure Stripe checkout">
      <EmbeddedCheckoutProvider key={attempt} stripe={stripePromise} options={{ fetchClientSecret }}>
        <EmbeddedCheckout className="rounded-xl" />
      </EmbeddedCheckoutProvider>
    </div>
  )
}

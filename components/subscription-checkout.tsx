'use client'

import { useCallback, useState } from 'react'
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { startSubscriptionCheckout } from '@/app/actions/stripe'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface SubscriptionCheckoutProps {
  planId: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function SubscriptionCheckout({ planId, onSuccess, onCancel }: SubscriptionCheckoutProps) {
  const [isComplete, setIsComplete] = useState(false)

  const fetchClientSecret = useCallback(
    () => startSubscriptionCheckout(planId),
    [planId],
  )

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
        {onSuccess && (
          <Button className="mt-6" onClick={onSuccess}>
            Get Started
          </Button>
        )}
      </div>
    )
  }

  return (
    <div id="checkout">
      <EmbeddedCheckoutProvider
        stripe={stripePromise}
        options={{
          fetchClientSecret,
          onComplete: () => setIsComplete(true),
        }}
      >
        <EmbeddedCheckout className="rounded-xl" />
      </EmbeddedCheckoutProvider>
    </div>
  )
}

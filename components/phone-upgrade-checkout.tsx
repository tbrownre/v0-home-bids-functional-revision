'use client'

import { useCallback, useState } from 'react'
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { startPhoneUpgradeCheckout } from '@/app/actions/stripe'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Defer Stripe initialization — same pattern as SubscriptionCheckout.
const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
const stripePromise = stripeKey ? loadStripe(stripeKey) : null

interface PhoneUpgradeCheckoutProps {
  /** The contractor's phone (any format — digits are normalized server-side). */
  phone: string
}

/**
 * A2 PHONEUNLOCK: account-less HomeBids Pro checkout for texting contractors.
 * No sign-in gate — the phone from the upgrade link IS the identity. The
 * Stripe webhook unlocks bidding for this number the moment payment lands,
 * and texts the "You're officially Pro" confirmation from the Bid Builder.
 */
export function PhoneUpgradeCheckout({ phone }: PhoneUpgradeCheckoutProps) {
  const [isComplete, setIsComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchClientSecret = useCallback(async () => {
    try {
      return await startPhoneUpgradeCheckout(phone)
    } catch (err) {
      console.error('[PhoneUpgradeCheckout] Failed to start checkout:', err)
      setError("We couldn't start checkout. Please try again.")
      throw err
    }
  }, [phone])

  // Stable reference — Stripe forbids mutating onComplete after first render.
  const handleComplete = useCallback(() => {
    setIsComplete(true)
  }, [])

  if (!stripeKey) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-destructive/30 bg-destructive/10">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h3 className="mt-4 text-xl font-semibold text-foreground">Payments not configured</h3>
        <p className="mt-2 text-muted-foreground">
          Checkout is temporarily unavailable. Please try again shortly.
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-destructive/30 bg-destructive/10">
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
        <h3 className="mt-4 text-2xl font-bold text-foreground">You&apos;re officially Pro 🚀</h3>
        <p className="mt-2 text-lg text-foreground">Unlimited bids are unlocked.</p>
        <p className="mt-1 text-muted-foreground">
          Whenever you&apos;re ready, just text your next job — a confirmation text is on its way to your phone.
        </p>
        <Button asChild className="mt-6 h-12 gap-2 rounded-full px-8 text-base font-semibold">
          <a href="sms:+12832291348?body=Let%27s%20create%20a%20new%20bid!">Text your next job</a>
        </Button>
      </div>
    )
  }

  return (
    <div id="phone-upgrade-checkout">
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

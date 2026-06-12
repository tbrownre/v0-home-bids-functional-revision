import 'server-only'

import Stripe from 'stripe'

function getStripeKey(): string {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY environment variable is not set')
  }
  return key
}

// Lazy singleton — key is validated at request time, not build time.
let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(getStripeKey())
  }
  return _stripe
}

// Backwards-compatible named export for existing call sites.
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop]
  },
})

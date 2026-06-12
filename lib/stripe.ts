import 'server-only'

import Stripe from 'stripe'

const key = process.env.STRIPE_SECRET_KEY

if (!key && process.env.NODE_ENV === 'production') {
  throw new Error('STRIPE_SECRET_KEY environment variable is not set')
}

export const stripe = new Stripe(key ?? 'sk_placeholder_not_set')

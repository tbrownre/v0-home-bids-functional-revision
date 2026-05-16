import 'server-only'

import Stripe from 'stripe'

const key = process.env.STRIPE_SECRET_KEY ?? 'sk_placeholder_not_set'

export const stripe = new Stripe(key)

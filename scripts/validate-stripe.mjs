import Stripe from 'stripe'

const secretKey = process.env.STRIPE_SECRET_KEY
const priceId = process.env.STRIPE_CONTRACTOR_PRICE_ID
if (!secretKey) throw new Error('STRIPE_SECRET_KEY is not configured')
if (!priceId?.startsWith('price_')) throw new Error('STRIPE_CONTRACTOR_PRICE_ID must begin with price_')

const stripe = new Stripe(secretKey)
const price = await stripe.prices.retrieve(priceId, { expand: ['product'] })
const product = price.product
const keyIsLive = secretKey.startsWith('sk_live_')

const checks = {
  authenticated: Boolean(price.id),
  amount: price.unit_amount === 9900,
  currency: price.currency === 'usd',
  recurring: price.recurring?.interval === 'month' && price.recurring.interval_count === 1,
  priceActive: price.active,
  productActive: typeof product !== 'string' && !product.deleted && product.active,
  modeMatchesKey: price.livemode === keyIsLive,
}

const matches = await stripe.prices.list({ lookup_keys: ['homebids_contractor_monthly_99'], active: true, limit: 100 })
checks.noDuplicateMatchingPrices = matches.data.filter((candidate) =>
  candidate.unit_amount === 9900 &&
  candidate.currency === 'usd' &&
  candidate.recurring?.interval === 'month'
).length <= 1

const failures = Object.entries(checks).filter(([, passed]) => !passed).map(([name]) => name)
if (failures.length) throw new Error(`Stripe validation failed: ${failures.join(', ')}`)

console.log(JSON.stringify({
  environment: price.livemode ? 'live' : 'test',
  productId: typeof product === 'string' ? product : product.id,
  priceId: price.id,
  checks,
}, null, 2))

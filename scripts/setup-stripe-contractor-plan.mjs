import Stripe from 'stripe'

const secretKey = process.env.STRIPE_SECRET_KEY
if (!secretKey) throw new Error('STRIPE_SECRET_KEY is not configured')
const stripe = new Stripe(secretKey)

const lookupKey = 'homebids_contractor_monthly_99'
const prices = await stripe.prices.list({ lookup_keys: [lookupKey], active: true, expand: ['data.product'], limit: 100 })
let price = prices.data.find((candidate) => {
  const product = candidate.product
  return candidate.unit_amount === 9900 &&
    candidate.currency === 'usd' &&
    candidate.recurring?.interval === 'month' &&
    candidate.recurring.interval_count === 1 &&
    typeof product !== 'string' &&
    !product.deleted &&
    product.active &&
    product.name === 'HomeBids Pro'
})

let product
if (price) {
  product = price.product
} else {
  const products = await stripe.products.search({ query: "active:'true' AND metadata['app']:'homebids' AND metadata['plan']:'contractor_pro'", limit: 100 })
  product = products.data.find((candidate) => candidate.name === 'HomeBids Pro')
  if (!product) {
    product = await stripe.products.create({
      name: 'HomeBids Pro',
      description: 'Unlimited AI-powered bid creation for home service contractors.',
      metadata: { app: 'homebids', plan: 'contractor_pro', billing_model: 'monthly_subscription' },
    })
  }
  price = await stripe.prices.create({
    product: product.id,
    unit_amount: 9900,
    currency: 'usd',
    recurring: { interval: 'month', interval_count: 1 },
    nickname: 'HomeBids Pro Monthly',
    lookup_key: lookupKey,
    metadata: { app: 'homebids', plan: 'contractor_pro', amount: '99', billing_interval: 'month' },
  })
}

console.log(JSON.stringify({
  environment: price.livemode ? 'live' : 'test',
  productId: typeof product === 'string' ? product : product.id,
  priceId: price.id,
  reused: prices.data.some((candidate) => candidate.id === price.id),
}, null, 2))

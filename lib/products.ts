// HomeBids subscription plans and bid fees
// These are the source of truth for all pricing logic.
// Server-side price validation is done against these values.

export interface SubscriptionPlan {
  id: string
  name: string
  description: string
  priceInCents: number // per month
  bidFeeInCents: number // per bid, 0 for homeowners
  features: string[]
  userType: 'homeowner' | 'contractor'
  highlighted?: boolean
  hasTrial?: boolean // defaults to true if omitted
  savingsCallout?: string
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  // Homeowner plan
  {
    id: 'homeowner-monthly',
    name: 'Property Owner',
    description: 'Post your project and receive bids from verified local contractors.',
    priceInCents: 999, // $9.99/month
    bidFeeInCents: 0,
    userType: 'homeowner',
    features: [
      'Post unlimited home projects',
      'Receive bids from verified contractors',
      'Compare quotes before hiring',
      'Direct messaging with contractors',
      'Simple project dashboard',
      '3-day free trial',
    ],
  },

  // Contractor plans
  {
    id: 'contractor-starter',
    name: 'Starter',
    description: 'Good for trying the platform.',
    priceInCents: 999, // $9.99/month
    bidFeeInCents: 1000, // $10 per bid
    userType: 'contractor',
    features: [
      'Marketplace access',
      'Direct homeowner messaging',
      'Basic contractor profile',
      'Bid on open jobs',
    ],
  },
  {
    id: 'contractor-pro',
    name: 'Pro',
    description: 'For contractors actively winning jobs.',
    priceInCents: 2900, // $29/month
    bidFeeInCents: 700, // $7 per bid
    userType: 'contractor',
    highlighted: true,
    hasTrial: false,
    features: [
      'Everything in Starter +',
      'Instant job alerts',
      'AI bid templates',
      'Enhanced contractor profile',
      'Priority placement in search',
      'Job recommendations',
    ],
    savingsCallout: 'Save 30% on every bid',
  },
  {
    id: 'contractor-elite',
    name: 'Elite',
    description: 'Maximum visibility and lowest bid costs.',
    priceInCents: 7900, // $79/month
    bidFeeInCents: 400, // $4 per bid
    userType: 'contractor',
    hasTrial: false,
    features: [
      'Everything in Pro +',
      'Early access to new jobs',
      'SMS instant job alerts (coming soon)',
      'AI bid generator',
      'Top placement in search',
      'Job value estimates',
      'Advanced contractor analytics',
      'Elite contractor badge',
    ],
    savingsCallout: 'Save 60% on bid fees',
  },
]

export function getPlanById(id: string): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find((p) => p.id === id)
}

export function getContractorPlans(): SubscriptionPlan[] {
  return SUBSCRIPTION_PLANS.filter((p) => p.userType === 'contractor')
}

export function getHomeownerPlan(): SubscriptionPlan {
  return SUBSCRIPTION_PLANS.find((p) => p.userType === 'homeowner')!
}

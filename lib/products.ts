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
      'Up to 100 matching contractors contacted',
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
    description: 'Maximum visibility. Zero dollars per bid.',
    priceInCents: 7900, // $79/month
    bidFeeInCents: 0, // $0 per bid
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
      'Zero cost per bid',
    ],
    savingsCallout: 'Bid unlimited for $79/month',
  },
  {
    id: 'contractor-founding',
    name: 'Founding Contractor',
    description: 'Presale offer: $10/month locked for life.',
    priceInCents: 1000, // $10/month
    bidFeeInCents: 0, // $0 per bid
    userType: 'contractor',
    hasTrial: false,
    features: [
      'Everything in Elite +',
      'Unlimited bidding on all projects',
      'Featured placement on homeowner jobs',
      'Founding Contractor badge',
      'Priority support',
      'Lifetime price lock at $10/month',
      'Private Founding Contractor community',
      'Facebook Group growth playbook',
      'Market dominance strategy calls',
    ],
    savingsCallout: 'Lock in $10/month for life (87% off regular pricing)',
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

// HomeBids subscription plans.
// Contractors pay a flat $99/month — no bid fees, no per-lead charges.
// Server-side price validation is done against these values.

export interface SubscriptionPlan {
  id: string
  name: string
  description: string
  priceInCents: number // per month
  features: string[]
  userType: 'homeowner' | 'contractor'
  highlighted?: boolean
  hasTrial?: boolean // defaults to true if omitted
  savingsCallout?: string
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  // Homeowner plan — FREE, no payment required
  {
    id: 'homeowner-monthly',
    name: 'Homeowner',
    description: 'Post your project for free and receive bids from verified local contractors.',
    priceInCents: 0,
    userType: 'homeowner',
    hasTrial: false,
    features: [
      'Post your project — completely free',
      'No credit card required',
      'Up to 100 matching contractors contacted',
      'Receive bids from verified contractors',
      'Compare quotes before hiring',
      'Direct messaging with contractors',
      'Simple project dashboard',
    ],
  },

  // Contractor plan — flat $99/month, unlimited bids, no per-bid fees
  {
    id: 'contractor-growth',
    name: 'HomeBids AI Growth Tools',
    description: 'Unlimited bidding + AI tools to estimate faster, respond better, and win more jobs.',
    priceInCents: 9900, // $99/month
    userType: 'contractor',
    highlighted: true,
    hasTrial: true,
    features: [
      'Unlimited bids — no bid fees, ever',
      'No pay-per-lead charges',
      'AI Estimate Assistant',
      'AI Price Check / Bid Defense Tool',
      'AI Response Assistant',
      'Unlimited AI usage during beta',
      'SMS-first workflow',
      'Pipeline & job tracking',
      'Mobile-first contractor dashboard',
      '3-day free trial included',
    ],
    savingsCallout: '3-day free trial',
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

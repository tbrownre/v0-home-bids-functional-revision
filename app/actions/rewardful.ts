'use server'

/**
 * Rewardful affiliate signup (replaces the Whop API for NEW affiliates, Sep 26).
 * One server call: POST /v1/affiliates with the person's email. Rewardful
 * returns their referral link (homebids.ai/?via=<token>) — the same rail the
 * site's tracking script and Stripe client_reference_id credit on.
 * REWARDFUL_API_SECRET lives ONLY in Vercel env vars — never chat/code.
 */

export interface RewardfulAffiliateResult {
  ok: boolean
  link?: string
  token?: string
  error?: 'not_configured' | 'invalid_email' | 'email_exists' | 'api_error' | 'network'
}

export async function createRewardfulAffiliate(email: string): Promise<RewardfulAffiliateResult> {
  const secret = process.env.REWARDFUL_API_SECRET
  if (!secret) {
    return { ok: false, error: 'not_configured' }
  }

  const clean = String(email || '').trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
    return { ok: false, error: 'invalid_email' }
  }

  // Rewardful requires first/last name; derive a sensible pair from the email
  // (the affiliate can polish it later — the link works either way).
  const local = clean.split('@')[0].replace(/[^a-z0-9]+/gi, ' ').trim()
  const firstName = (local.split(' ')[0] || 'HomeBids').replace(/^\w/, (c) => c.toUpperCase())
  const lastName = 'Partner'

  try {
    const body = new URLSearchParams({
      first_name: firstName,
      last_name: lastName,
      email: clean,
    })

    const res = await fetch('https://api.getrewardful.com/v1/affiliates', {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(secret + ':').toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
      cache: 'no-store',
    })

    const data: unknown = await res.json().catch(() => null)
    const d = data as {
      details?: string[]
      error?: string
      links?: Array<{ url?: string; token?: string }>
    } | null

    if (!res.ok) {
      const msg = (d && (d.details?.join(' ') || d.error)) || 'http_' + res.status
      if (String(msg).toLowerCase().includes('taken') || String(msg).toLowerCase().includes('already')) {
        return { ok: false, error: 'email_exists' }
      }
      console.warn('[createRewardfulAffiliate] API error:', msg)
      return { ok: false, error: 'api_error' }
    }

    const first = d && Array.isArray(d.links) && d.links.length ? d.links[0] : null
    const token = first?.token || ''
    const link = first?.url || (token ? 'https://homebids.ai/?via=' + encodeURIComponent(token) : '')

    if (!link) {
      console.warn('[createRewardfulAffiliate] No link in response')
      return { ok: false, error: 'api_error' }
    }

    return { ok: true, link, token }
  } catch (err) {
    console.warn('[createRewardfulAffiliate] Network error:', err)
    return { ok: false, error: 'network' }
  }
}

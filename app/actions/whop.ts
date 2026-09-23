'use server'

/**
 * G2 — on-site Whop affiliate signup (Tim's mock, Sep 23).
 * One server call: POST /api/v1/affiliates with our company id + the person's
 * email. Whop links (or invites) the user and returns their username — which
 * is exactly the ?a= code our proven referral rail tracks and pays on.
 * Keys live ONLY in Vercel env vars (WHOP_API_KEY / WHOP_ACCOUNT_ID).
 */

export interface WhopAffiliateResult {
  ok: boolean
  username?: string
  link?: string
  portal: string
  error?: string
}

const PORTAL = 'https://whop.com/homebids/affiliates'

export async function createWhopAffiliate(email: string): Promise<WhopAffiliateResult> {
  const key = process.env.WHOP_API_KEY
  const account = process.env.WHOP_ACCOUNT_ID

  if (!key || !account) {
    return { ok: false, portal: PORTAL, error: 'not_configured' }
  }

  const clean = String(email || '').trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
    return { ok: false, portal: PORTAL, error: 'invalid_email' }
  }

  try {
    const res = await fetch('https://api.whop.com/api/v1/affiliates', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ account_id: account, user_identifier: clean }),
      cache: 'no-store',
    })

    const data = await res.json().catch(() => null)

    if (!res.ok) {
      const msg =
        data && (data.message || data.error)
          ? String(data.message || data.error)
          : 'http_' + res.status
      console.warn('[createWhopAffiliate] Whop API error:', msg)
      return { ok: false, portal: PORTAL, error: msg }
    }

    const username: string = data?.user?.username || ''
    if (!username) {
      return { ok: false, portal: PORTAL, error: 'no_username_in_response' }
    }

    return {
      ok: true,
      username,
      link: 'https://whop.com/homebids/homebids-pro?a=' + encodeURIComponent(username),
      portal: PORTAL,
    }
  } catch (err) {
    console.warn('[createWhopAffiliate] Network error:', err)
    return { ok: false, portal: PORTAL, error: 'network' }
  }
}

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
  /** Rewardful affiliate id (UUID) — needed for the magic-link dashboard login. */
  id?: string
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
      id?: string
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

    return { ok: true, link, token, id: typeof d?.id === 'string' ? d.id : undefined }
  } catch (err) {
    console.warn('[createRewardfulAffiliate] Network error:', err)
    return { ok: false, error: 'network' }
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * v3 SSO (Tim, Sep 29: "View my dashboard" -> Rewardful 404): Rewardful's magic
 * link — GET /v1/affiliates/:id/sso — logs the affiliate straight into their
 * dashboard, no password, no guessed portal URL. The link is single-use and
 * expires after one minute, so it is fetched at click time, never rendered early.
 * Only callable with the affiliate's UUID (returned to the person who just
 * created the account) — never by email, so nobody can open someone else's dashboard.
 */
export async function getAffiliateDashboardLink(
  affiliateId: string,
): Promise<{ ok: boolean; url?: string; error?: 'not_configured' | 'invalid_id' | 'api_error' | 'network' }> {
  const secret = process.env.REWARDFUL_API_SECRET
  if (!secret) return { ok: false, error: 'not_configured' }
  const id = String(affiliateId || '').trim()
  if (!UUID_RE.test(id)) return { ok: false, error: 'invalid_id' }
  try {
    const res = await fetch('https://api.getrewardful.com/v1/affiliates/' + encodeURIComponent(id) + '/sso', {
      method: 'GET',
      headers: { Authorization: 'Basic ' + Buffer.from(secret + ':').toString('base64') },
      cache: 'no-store',
    })
    const data: unknown = await res.json().catch(() => null)
    const url = (data as { sso?: { url?: string } } | null)?.sso?.url
    if (!res.ok || !url || !/^https:\/\//.test(url)) {
      console.warn('[getAffiliateDashboardLink] API error:', res.status)
      return { ok: false, error: 'api_error' }
    }
    return { ok: true, url }
  } catch (err) {
    console.warn('[getAffiliateDashboardLink] Network error:', err)
    return { ok: false, error: 'network' }
  }
}

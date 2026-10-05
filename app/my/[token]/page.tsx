import type { Metadata } from 'next'
import { HomeownerInbox } from '@/components/my/homeowner-inbox'

interface PageProps {
  params: Promise<{ token: string }>
}

// OGFIX (Tim, Oct 6: "/my link preview had no contractor name — thought we fixed that"): the /p bid link had the
// custom card, /my never did. Same rule as /p: company name only — never the project title or a dollar amount.
async function latestBidCompany(token: string): Promise<string | null> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key || !token) return null
    const h = { apikey: key, Authorization: `Bearer ${key}` }
    const jobs = (await (
      await fetch(`${url}/rest/v1/jobs?owner_token=eq.${encodeURIComponent(token)}&select=id&limit=1`, { headers: h, cache: 'no-store' })
    ).json()) as Array<{ id: string }>
    if (!Array.isArray(jobs) || !jobs.length) return null
    const props = (await (
      await fetch(
        `${url}/rest/v1/proposals?job_id=eq.${jobs[0].id}&contractor_company_name=not.is.null&select=contractor_company_name&order=created_at.desc&limit=1`,
        { headers: h, cache: 'no-store' },
      )
    ).json()) as Array<{ contractor_company_name: string | null }>
    const name = Array.isArray(props) && props.length ? String(props[0].contractor_company_name ?? '').trim() : ''
    return name || null
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params
  const company = await latestBidCompany(token)
  const title = company ? `${company} sent you a bid | HomeBids` : 'Your HomeBids project'
  const description = company
    ? 'Review the price, ask questions, or approve it from your private HomeBids page.'
    : 'Your private HomeBids project — review bids, schedule estimates, and hire a pro.'
  return {
    title,
    description,
    openGraph: { title, description, type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
    robots: { index: false, follow: false },
  }
}

export default async function HomeownerInboxPage({ params }: PageProps) {
  const { token } = await params
  return <HomeownerInbox token={token} />
}

export const dynamic = 'force-dynamic'

import { HomeownerInbox } from '@/components/my/homeowner-inbox'

interface PageProps {
  params: Promise<{ token: string }>
}

export default async function HomeownerInboxPage({ params }: PageProps) {
  const { token } = await params
  return <HomeownerInbox token={token} />
}

export const metadata = {
  title: 'Your HomeBids project',
  description: 'Your private HomeBids project — review bids, schedule estimates, and hire a pro.',
}

export const dynamic = 'force-dynamic'

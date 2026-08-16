import { HomeownerInbox } from '@/components/my/homeowner-inbox'

interface PageProps {
  params: Promise<{ token: string }>
}

export default async function HomeownerInboxPage({ params }: PageProps) {
  const { token } = await params
  return <HomeownerInbox token={token} />
}

export const metadata = {
  title: 'Job Inbox | HomeBids',
  description: 'Review bids, questions, and visit offers for your HomeBids job.',
}

export const dynamic = 'force-dynamic'

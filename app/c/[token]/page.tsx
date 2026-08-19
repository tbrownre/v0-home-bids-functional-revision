import { ContractorThread } from '@/components/contractor/contractor-thread'

interface PageProps {
  params: Promise<{ token: string }>
}

export default async function ContractorThreadPage({ params }: PageProps) {
  const { token } = await params
  return <ContractorThread token={token} />
}

export const metadata = {
  title: 'Your Job Workspace | HomeBids',
  description: 'Track your bid, message the homeowner, and follow the job in one place.',
}

export const dynamic = 'force-dynamic'

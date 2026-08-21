import { ContractorThread } from '@/components/contractor/contractor-thread'

interface PageProps {
  params: Promise<{ token: string }>
}

export default async function ContractorThreadPage({ params }: PageProps) {
  const { token } = await params
  return <ContractorThread token={token} />
}

export const metadata = {
  title: 'Your HomeBids lead',
  description: 'Your private HomeBids lead — act on this job, offer estimates, and follow it to close.',
}

export const dynamic = 'force-dynamic'

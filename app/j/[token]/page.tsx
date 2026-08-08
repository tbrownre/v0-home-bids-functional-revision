import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';
import { JobPageContent } from '@/components/job/job-page-content';
import { JobPageClosed } from '@/components/job/job-page-closed';
import { JobPage404 } from '@/components/job/job-page-404';

interface PageProps {
  params: Promise<{ token: string }>;
}

export const revalidate = 60; // Cache for 60 seconds

async function getJobByToken(token: string) {
  try {
    // Use service-role client for server-side reads (bypasses RLS)
    const supabase = createAdminClient();

    // Fetch job with required columns
    const { data: job, error } = await supabase
      .from('jobs')
      .select('id, title, description, category, location, zip_code, urgency, budget_min, budget_max, images, created_at, job_ref, status, homeowner_id')
      .eq('share_token', token)
      .maybeSingle();

    if (error) {
      console.error('[job-page] Query error:', error);
      return { job: null, homeownerFirstName: null, error: error.message };
    }

    if (!job) {
      return { job: null, homeownerFirstName: null, error: null };
    }

    // Fetch homeowner's first name only
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', job.homeowner_id)
      .maybeSingle();

    const homeownerFirstName = profile?.full_name?.split(' ')[0] || 'Homeowner';

    return {
      job,
      homeownerFirstName,
      error: null,
    };
  } catch (e) {
    console.error('[job-page] Fetch error:', e);
    return { job: null, homeownerFirstName: null, error: 'Failed to load job' };
  }
}

function getTradeAndCity(category: string | null, location: string | null, title: string | null) {
  const source = location || title || '';
  const cityMatch = source.match(/(?:in|near|of)\s+([A-Za-z][A-Za-z .'-]+?)(?:,\s*[A-Z]{2}|\s+AZ|$)/i);
  const commaMatch = source.match(/,\s*([^,]+?)(?:,\s*[A-Z]{2}|$)/);
  const city = cityMatch?.[1]?.trim() || commaMatch?.[1]?.trim() || 'your area';

  return {
    trade: category?.trim().toLowerCase() || 'a local pro',
    city,
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  const { job } = await getJobByToken(token);
  const { trade, city } = getTradeAndCity(job?.category ?? null, job?.location ?? null, job?.title ?? null);
  const title = `Looking for a ${trade} in ${city}?`;
  const description = `A homeowner in ${city}, AZ is taking bids. Free to bid.`;
  const image = `/j/${encodeURIComponent(token)}/opengraph-image`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
    robots: { index: true, follow: true },
  };
}

export default async function JobPage({ params }: PageProps) {
  const { token } = await params;
  const { job, homeownerFirstName } = await getJobByToken(token);

  if (!job) {
    return <JobPage404 />;
  }

  // Soft state for closed/cancelled/archived jobs
  if (job.status === 'cancelled' || job.status === 'completed') {
    return <JobPageClosed />;
  }

  return <JobPageContent job={job} homeownerFirstName={homeownerFirstName || 'Homeowner'} />;
}

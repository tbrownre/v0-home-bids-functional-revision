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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  const { job } = await getJobByToken(token);

  if (!job) {
    return {
      title: 'Job — HomeBids',
      description: 'View job details and submit a bid.',
    };
  }

  // Extract city from location (if it's a full address, just use zip_code)
  const cityDisplay = job.zip_code || 'Your area';
  const title = `${job.title} — ${cityDisplay} · HomeBids`;
  const description = job.description.slice(0, 140) + (job.description.length > 140 ? '...' : '');

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: job.images?.[0] ? [{ url: job.images[0] }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: job.images?.[0] ? [job.images[0]] : undefined,
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

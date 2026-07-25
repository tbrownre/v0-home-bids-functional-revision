import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';
import { EstimatePageContent } from '@/components/pro/estimate-page-content';
import { EstimatePage404 } from '@/components/pro/estimate-page-404';
import { EstimatePagePaused } from '@/components/pro/estimate-page-paused';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 60; // Cache for 60 seconds

async function getContractorLandingPage(slug: string) {
  try {
    // Use service-role client for server-side reads (bypasses RLS)
    const supabase = createAdminClient();

    // Fetch landing page with minimal columns
    const { data: landingPage, error } = await supabase
      .from('contractor_landing_pages')
      .select('id, slug, status, config, contractor_id')
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      console.error('[estimate-page] Query error:', error);
      return { page: null, error: error.message };
    }

    if (!landingPage) {
      return { page: null, error: null };
    }

    // Fetch contractor profile (RLS would block anon client)
    const { data: profile } = await supabase
      .from('contractor_profiles')
      .select('business_name, contractor_logo_url')
      .eq('id', landingPage.contractor_id)
      .maybeSingle();

    return {
      page: {
        ...landingPage,
        contractor_profiles: profile || undefined,
      },
      error: null,
    };
  } catch (e) {
    console.error('[estimate-page] Fetch error:', e);
    return { page: null, error: 'Failed to load page' };
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { page } = await getContractorLandingPage(slug);

  if (!page) {
    return {
      title: 'Estimate — HomeBids',
      description: 'Get an estimate from a verified contractor.',
    };
  }

  const config = page.config as any;
  const companyName = page.contractor_profiles?.business_name || 'Contractor';
  const headline = config?.copy?.headline || `Get an estimate from ${companyName}`;
  const subhead = config?.copy?.subhead || '';

  return {
    title: `${companyName} — Get an estimate`,
    description: subhead || headline,
    openGraph: {
      title: `${companyName} — Get an estimate`,
      description: subhead || headline,
      type: 'website',
    },
    robots: { index: true, follow: true },
  };
}

export default async function ContractorEstimatePage({ params }: PageProps) {
  const { slug } = await params;
  const { page } = await getContractorLandingPage(slug);

  if (!page) {
    return <EstimatePage404 />;
  }

  if (page.status === 'paused') {
    return <EstimatePagePaused />;
  }

  if (page.status !== 'published') {
    return <EstimatePage404 />;
  }

  return <EstimatePageContent page={page} />;
}

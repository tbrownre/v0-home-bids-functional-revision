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

    // Fetch contractor profile (RLS would block anon client).
    // Oct 3: the column is logo_url — 'contractor_logo_url' lives on bids/proposals, so this select
    // had been erroring silently and the profile (and its business name) never loaded.
    const { data: profileRow, error: profileErr } = await supabase
      .from('contractor_profiles')
      .select('business_name, logo_url, google_review_link')
      .eq('id', landingPage.contractor_id)
      .maybeSingle();
    if (profileErr) console.error('[estimate-page] Profile query error:', profileErr.message);
    const profile = profileRow
      ? { business_name: (profileRow.business_name as string | null) ?? undefined, contractor_logo_url: (profileRow.logo_url as string | null) ?? undefined }
      : null;

    // LIVE NAME (Tim, Oct 2 Trello: "Wrong company name in OG preview"): config.brand.company_name is a
    // snapshot taken when the page was published, so a renamed business kept showing the old name in the
    // title/iMessage preview and on the page. The contractor's current business name wins everywhere
    // (title, OG, H1). The demo account keeps its demo brand.
    const config = (landingPage.config && typeof landingPage.config === 'object' ? landingPage.config : {}) as Record<string, any>;
    const liveName = String(profile?.business_name ?? '').trim();
    const isDemo = /^0{8}-/.test(String(landingPage.contractor_id ?? ''));
    if (liveName && !isDemo) {
      config.brand = { ...(config.brand || {}), company_name: liveName };
    }
    // GREVIEWS (Tim, Oct 7 Trello "Show Google Reviews Across Homeowner-Facing Experience"): the profile's
    // Google Review link is the single source of truth. It overlays whatever the publish snapshot carried, and a
    // blank profile field hides the link (never a stale or placeholder URL). The demo page keeps its demo config.
    if (!isDemo) {
      const liveReviews = String((profileRow as { google_review_link?: string | null } | null)?.google_review_link ?? '').trim();
      const trust = { ...((config.trust as Record<string, unknown>) || {}) };
      if (/^https?:\/\//i.test(liveReviews)) trust.google_reviews_url = liveReviews;
      else delete trust.google_reviews_url;
      config.trust = trust;
    }

    return {
      page: {
        ...landingPage,
        config,
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
  const companyName = config?.brand?.company_name || page.contractor_profiles?.business_name || 'Your Local Pro';
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

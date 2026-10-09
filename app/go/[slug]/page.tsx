import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdLanding } from "@/components/ads/ad-landing";
import { MetaPixel } from "@/components/ads/meta-pixel";
import { LANDING_SLUGS, getLandingPage } from "@/lib/ads/landing-pages";
import { OG_IMAGE, SITE_URL } from "@/lib/seo";

/**
 * ADLAND (Tim + Abir, Oct 9): /go/<slug> — one static landing page per ad creative (see lib/ads/landing-pages.ts).
 * Statically generated for every listed slug; anything else is a 404 (dynamicParams off), so nothing from the URL
 * can change what is rendered. noindex: these are paid-traffic pages, not search pages.
 */

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return LANDING_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = getLandingPage(slug);
  if (!page) return { title: "HomeBids", robots: { index: false, follow: false } };
  const title = `${page.headline[0]} ${page.headline[1]} — HomeBids`;
  const description = page.sub;
  const url = `${SITE_URL}/go/${page.slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: { index: false, follow: false },
    openGraph: { title, description, url, siteName: "HomeBids", type: "website", images: [OG_IMAGE] },
    twitter: { card: "summary_large_image", title, description, images: [OG_IMAGE.url] },
    other: { "format-detection": "telephone=no" },
  };
}

export default async function GoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = getLandingPage(slug);
  if (!page) notFound();
  return (
    <>
      <MetaPixel />
      <AdLanding page={page} />
    </>
  );
}

import type { Metadata } from "next";

/**
 * SEO (Tim/Abir, Oct 4): one place for the site-wide tags. Marketing pages build their metadata
 * with pageMeta() so every page carries a full Open Graph + Twitter set (title, description,
 * canonical, siteName, image). Next.js replaces a parent's `openGraph` object wholesale when a
 * page defines its own, so the image must be repeated here — otherwise a page that sets only an
 * OG title loses the share image entirely.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.homebids.ai";
export const SITE_NAME = "HomeBids";
export const TAGLINE = "Better bids. Better homes.";

export const DEFAULT_DESCRIPTION =
  "HomeBids is the AI bid assistant for home-service contractors: text the job, get a professional bid with PDF and online link in minutes, plus your own landing page and lead intake by SMS/iMessage. Free for homeowners. 14-day free trial for contractors.";

export const OG_IMAGE = {
  url: `${SITE_URL}/opengraph-image?v=6`,
  width: 1200,
  height: 630,
  alt: `${SITE_NAME} — ${TAGLINE}`,
};

export function pageMeta(opts: {
  title: string;
  description: string;
  path: string; // "/contractors"
  ogDescription?: string;
  noindex?: boolean;
}): Metadata {
  const { title, description, path, ogDescription, noindex } = opts;
  return {
    title,
    description,
    alternates: { canonical: path },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      title,
      description: ogDescription || description,
      url: path,
      siteName: SITE_NAME,
      locale: "en_US",
      type: "website",
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: ogDescription || description,
      images: [OG_IMAGE.url.replace("/opengraph-image", "/twitter-image")],
    },
  };
}

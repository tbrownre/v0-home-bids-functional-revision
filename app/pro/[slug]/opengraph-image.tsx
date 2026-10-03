import { renderLandingCard, OG_SIZE } from "@/components/pro/landing-og-card";

// Link-preview image for /pro/<slug> (iMessage, Facebook, Slack…). Until now this
// route had no image, so previews showed the site-wide HomeBids card. Shared
// renderer lives in components/pro/landing-og-card.tsx; the bid card (/p) is separate.
export const runtime = "nodejs";
export const alt = "Get an estimate by text";
export const size = OG_SIZE;
export const contentType = "image/png";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return renderLandingCard(slug);
}

import { renderLandingCard, OG_SIZE } from "@/components/pro/landing-og-card";

// Same contractor card for X/Twitter previews (twitter:image).
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

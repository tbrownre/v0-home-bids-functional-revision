import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Affiliate Program | HomeBids — Earn $19.80/Month Per Contractor",
  description:
    "Refer contractors to HomeBids and earn 20% recurring commission on every active subscription. No cap. Cancel-proof income from a tool contractors love using every day.",
  openGraph: {
    title: "Affiliate Program | HomeBids",
    description:
      "Earn 20% recurring commission per contractor you refer. No cap.",
    url: "https://homebids.ai/affiliates",
  },
};

export default function AffiliatesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

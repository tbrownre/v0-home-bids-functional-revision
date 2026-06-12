import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "For Homeowners | HomeBids — Free Competitive Bids on Any Project",
  description:
    "Describe your home project and get real bids from verified contractors in your area. Completely free for homeowners. No sign-up required to get started.",
  openGraph: {
    title: "For Homeowners | HomeBids",
    description:
      "Get real, competitive bids on any home project. Free for homeowners.",
    url: "https://homebids.ai/homeowners",
  },
};

export default function HomeownersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

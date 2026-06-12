import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About | HomeBids — Built for Contractors, Free for Homeowners",
  description:
    "HomeBids is an AI-powered bidding platform that helps contractors win more work and homeowners get real competitive bids — fast, fair, and simple.",
  openGraph: {
    title: "About HomeBids",
    description:
      "AI-powered bidding: faster for contractors, fairer for homeowners.",
    url: "https://homebids.ai/about",
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

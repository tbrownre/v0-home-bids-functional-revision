import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How It Works | HomeBids — Simple Bids for Homeowners & Contractors",
  description:
    "Homeowners describe their project and get competitive bids. Contractors use AI to respond in minutes. See exactly how HomeBids works for both sides.",
  openGraph: {
    title: "How It Works | HomeBids",
    description:
      "Post a project, get competitive bids, hire with confidence. See how HomeBids works.",
    url: "https://homebids.ai/how-it-works",
  },
};

export default function HowItWorksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

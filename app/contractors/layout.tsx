import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "For Contractors | HomeBids — Win More Jobs with AI-Powered Bids",
  description:
    "Build professional bids in 3 minutes, respond to homeowners faster, and win more jobs. $99/month, all-in. No commissions. Cancel anytime.",
  openGraph: {
    title: "For Contractors | HomeBids",
    description:
      "Build professional bids in 3 minutes with AI. $99/month, all-in.",
    url: "https://homebids.ai/contractors",
  },
};

export default function ContractorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

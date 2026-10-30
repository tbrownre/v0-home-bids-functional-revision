import { pageMeta } from "@/lib/seo";

// SEO — Oct 31, 2026 (Tim's "Find opportunities. Send more bids." landing: Lead Radar front and center):
// Lead Radar + text-first contractor page + AI Bid Builder, 14-day free trial, $99/mo after.
export const metadata = pageMeta({
  title: "HomeBids — Find opportunities. Send more bids.",
  description:
    "Find local jobs, turn website visitors into text conversations, and build professional bids—all in one place. Lead Radar watches up to 25 local Facebook groups and texts you matching projects; your contractor page captures leads through iMessage/SMS; the AI Bid Builder turns job details into professional bids. 14 days free, then $99/month. Cancel anytime.",
  ogDescription: "Lead Radar alerts, a text-first contractor page and unlimited AI bids. 14 days free, then $99/month.",
  path: "/contractors",
});

export default function ContractorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

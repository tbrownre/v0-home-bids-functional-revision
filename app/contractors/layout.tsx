import { pageMeta } from "@/lib/seo";

// SEO (Oct 4): matches the live offer — AI bids by text, own landing page, 14-day free trial, $99/mo after.
export const metadata = pageMeta({
  title: "AI Bid Builder for Contractors — 14-Day Free Trial | HomeBids",
  description:
    "Text the job, get a professional bid in minutes — PDF + online link with your branding. Unlimited bids, your own contractor landing page, and lead intake by SMS/iMessage. Try everything free for 14 days, then $99/month. Cancel anytime.",
  ogDescription: "Build professional bids by text in minutes. Unlimited bids + your own landing page. 14 days free, then $99/month.",
  path: "/contractors",
});

export default function ContractorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

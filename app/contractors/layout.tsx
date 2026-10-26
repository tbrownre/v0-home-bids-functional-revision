import { pageMeta } from "@/lib/seo";

// SEO (Oct 17, Tim: "change our messaging from bid builder to assistant"): a contractor's 24/7 assistant by text —
// answers inquiries, collects job details, builds estimates, follows up. 14-day free trial, $99/mo after.
export const metadata = pageMeta({
  title: "Your 24/7 Contractor Assistant — 14-Day Free Trial | HomeBids",
  description:
    "Meet your new 24/7 assistant. It answers new inquiries, collects job details, builds professional estimates, follows up, and helps turn bids into approved jobs — all through text. Unlimited bids, your own contractor page, lead intake by SMS/iMessage. 14 days free, then $99/month. Cancel anytime.",
  ogDescription: "Your next employee costs $99/month. A 24/7 assistant by text: inquiries, job details, estimates, follow-ups. 14 days free.",
  path: "/contractors",
});

export default function ContractorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

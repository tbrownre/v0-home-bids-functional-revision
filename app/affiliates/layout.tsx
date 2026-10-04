import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "HomeBids Affiliate Program — Earn 20% Recurring Per Contractor",
  description:
    "Refer contractors to HomeBids and earn 20% recurring commission ($19.80/month) on every active $99 subscription, for as long as they stay. No cap. Free to join.",
  ogDescription: "Earn 20% recurring commission on every contractor you refer. No cap. Free to join.",
  path: "/affiliates",
});

export default function AffiliatesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

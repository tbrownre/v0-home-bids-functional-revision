import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Get Contractor Bids by Text — Free for Homeowners | HomeBids",
  description:
    "Text us your home project and get real, competitive bids from local contractors — no forms, no fees, no sign-up to start. Compare bids, ask questions, and hire with confidence.",
  ogDescription: "Text your project, get real bids from local pros. Always free for homeowners.",
  path: "/homeowners",
});

export default function HomeownersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "How HomeBids Works — Bids by Text for Homeowners & Contractors",
  description:
    "Homeowners text their project and get competitive bids. Contractors text the job details and get a professional bid built by AI in minutes. See exactly how HomeBids works on both sides.",
  ogDescription: "Text a project, get competitive bids, hire with confidence. See how HomeBids works.",
  path: "/how-it-works",
});

export default function HowItWorksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

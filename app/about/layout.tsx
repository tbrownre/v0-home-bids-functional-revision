import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "About HomeBids — Built for Contractors, Free for Homeowners",
  description:
    "HomeBids is an AI-powered bidding platform from Gilbert, Arizona: contractors build professional bids by text in minutes, homeowners get real competitive bids for free — fast, fair, and simple.",
  ogDescription: "AI-powered bidding: faster for contractors, free for homeowners. Built in Gilbert, AZ.",
  path: "/about",
});

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

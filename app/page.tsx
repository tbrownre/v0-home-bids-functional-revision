import { GatewayLanding } from "@/components/gateway-landing";
import { pageMeta } from "@/lib/seo";

// SEO (Oct 4): homepage = the brand + both audiences; canonical so /gateway (same page) doesn't compete.
export const metadata = pageMeta({
  title: "HomeBids — Better bids. Better homes.",
  description:
    "Homeowners: text your project and get real bids from local pros — free. Contractors: build professional bids by text in minutes with AI, get your own landing page, and win more jobs. 14-day free trial.",
  ogDescription: "Text your project, get real bids — free for homeowners. Contractors build pro bids by text in minutes. 14-day free trial.",
  path: "/",
});

export default function HomePage() {
  return <GatewayLanding />;
}

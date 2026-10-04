import { GatewayLanding } from "@/components/gateway-landing";
import { pageMeta } from "@/lib/seo";

// Same page as "/" — canonical to the homepage, kept out of the index.
export const metadata = pageMeta({
  title: "HomeBids — Better bids. Better homes.",
  description:
    "Homeowners: text your project and get real bids from local pros — free. Contractors: build professional bids by text in minutes with AI. 14-day free trial.",
  path: "/",
  noindex: true,
});

export default function GatewayPage() {
  return <GatewayLanding />;
}

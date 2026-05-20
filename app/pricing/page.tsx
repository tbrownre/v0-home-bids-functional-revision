import { redirect } from "next/navigation";

// /pricing is canonically /subscribe — redirect permanently
export default function PricingPage() {
  redirect("/subscribe");
}

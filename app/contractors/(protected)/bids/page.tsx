import { redirect } from "next/navigation";

// /contractors/bids now lives inside the dashboard Bid Builder tab.
export default function ContractorBidsRedirect() {
  redirect("/contractors/dashboard?tab=ai");
}

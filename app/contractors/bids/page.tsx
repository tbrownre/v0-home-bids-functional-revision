import { redirect } from "next/navigation";

// /contractors/bids now lives inside the dashboard AI Tools tab.
export default function ContractorBidsRedirect() {
  redirect("/contractors/dashboard?tab=ai");
}

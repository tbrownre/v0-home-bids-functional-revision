import { redirect } from "next/navigation";

// /contractors/bids redirects to dashboard
export default function ContractorBidsRedirect() {
  redirect("/contractors/dashboard");
}

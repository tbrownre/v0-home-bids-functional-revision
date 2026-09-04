import { redirect } from "next/navigation";

// The marketplace (Available Jobs) is disabled for launch. Send contractors
// back to their dashboard.
export default function ContractorJobsPage() {
  redirect("/contractors/dashboard");
}

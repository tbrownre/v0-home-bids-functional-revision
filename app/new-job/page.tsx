import { redirect } from "next/navigation";

// /new-job (old web demo intake) is retired — homeowners create jobs by texting Ava.
// Direct visits land on the homepage, which carries the SMS start CTA.
export default function NewJobRedirect() {
  redirect("/");
}

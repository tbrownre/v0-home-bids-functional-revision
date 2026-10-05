"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Job card for a contractor's message thread (Tim, Oct 6: "let the contractor open up job details
 * from messages so they know what job they're discussing — these messages appear blind").
 *
 * Scope: the signed-in contractor must actually be ON this job — a message thread, a sent bid, or
 * the job came from their own page. Homeowner contact is NOT returned here (marketplace privacy:
 * phone unlocks in the thread once a visit is scheduled or they're hired).
 */
export interface ThreadJobCard {
  job_ref: string | null;
  title: string;
  category: string | null;
  description: string | null;
  urgency: string | null;
  budget_min: number | null;
  budget_max: number | null;
  images: string[];
  location: string | null;
  zip_code: string | null;
  created_at: string;
  homeowner_first: string | null;
}

const last10 = (v: unknown) => String(v ?? "").replace(/\D/g, "").slice(-10);

export async function getThreadJobCard(jobRef: string): Promise<{ job: ThreadJobCard | null; error: string | null }> {
  const ref = String(jobRef ?? "").trim();
  if (!ref) return { job: null, error: "No job ref" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { job: null, error: "Not authenticated" };

  const admin = createAdminClient();

  const { data: jobs, error } = await admin
    .from("jobs")
    .select("id, job_ref, title, category, description, urgency, budget_min, budget_max, images, location, zip_code, created_at, homeowner_id, source_contractor_id")
    .eq("job_ref", ref)
    .limit(1);
  if (error) return { job: null, error: error.message };
  const job = (jobs ?? [])[0] as Record<string, unknown> | undefined;
  if (!job) return { job: null, error: "Job not found" };

  // ── Access: own-page lead, a bid on this job, or a message thread on this job ──
  let allowed = String(job.source_contractor_id || "") === user.id;

  if (!allowed) {
    const { data: prop } = await admin
      .from("proposals")
      .select("id")
      .eq("job_id", job.id as string)
      .eq("contractor_id", user.id)
      .limit(1);
    allowed = !!(prop && prop.length);
  }

  if (!allowed) {
    const { data: profile } = await admin.from("profiles").select("phone").eq("id", user.id).maybeSingle();
    const mine = last10(profile?.phone);
    if (mine) {
      const { data: th } = await admin
        .from("contractor_threads")
        .select("contractor_phone")
        .eq("job_id", job.id as string)
        .limit(50);
      allowed = (th ?? []).some((t) => last10((t as { contractor_phone?: string }).contractor_phone) === mine);
    }
  }

  if (!allowed) return { job: null, error: "Not your job" };

  let homeownerFirst: string | null = null;
  try {
    const { data: owner } = await admin.from("profiles").select("full_name").eq("id", job.homeowner_id as string).maybeSingle();
    const first = String(owner?.full_name ?? "").trim().split(/\s+/)[0] || "";
    homeownerFirst = first && !/^(homeowner|unknown|n\/a|null)$/i.test(first) ? first : null;
  } catch {
    /* name is a nicety, never fatal */
  }

  return {
    job: {
      job_ref: (job.job_ref as string | null) ?? null,
      title: String(job.title || job.category || "Project"),
      category: (job.category as string | null) ?? null,
      description: String(job.description ?? "").trim() || null,
      urgency: (job.urgency as string | null) ?? null,
      budget_min: typeof job.budget_min === "number" ? job.budget_min : null,
      budget_max: typeof job.budget_max === "number" ? job.budget_max : null,
      images: Array.isArray(job.images) ? (job.images as unknown[]).map(String).filter((u) => /^https?:\/\//.test(u)) : [],
      location: (job.location as string | null) ?? null,
      zip_code: (job.zip_code as string | null) ?? null,
      created_at: String(job.created_at),
      homeowner_first: homeownerFirst,
    },
    error: null,
  };
}

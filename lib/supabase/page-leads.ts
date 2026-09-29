"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Leads that came in through a contractor's own /pro landing page.
 *
 * The Page Lead Direct workflow stamps such jobs with
 * `source = 'pro-page:<slug>'` and `source_contractor_id = <contractor>` and
 * texts the contractor on the Bid Builder line. Until now that text was the
 * only place a page lead existed (Tim/Abir, Sep 28: "where are those? I don't
 * find them in a dashboard"). This reads them back for the dashboard.
 *
 * Reads go through the service-role client because `jobs` rows belong to the
 * homeowner under RLS; the query is scoped to the signed-in contractor's id.
 */

export interface PageLeadBid {
  share_token: string;
  status: string | null;
  total_price: number | null;
}

export interface PageLead {
  id: string;
  job_ref: string | null;
  title: string;
  category: string | null;
  location: string | null;
  zip_code: string | null;
  status: string | null;
  created_at: string;
  bid: PageLeadBid | null;
}

const digits10 = (v: unknown) => String(v ?? "").replace(/\D/g, "").slice(-10);

export async function getMyPageLeads(limit = 20): Promise<{ leads: PageLead[]; error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { leads: [], error: "Not authenticated" };

  let admin;
  try {
    admin = createAdminClient();
  } catch (e) {
    return { leads: [], error: e instanceof Error ? e.message : "admin client unavailable" };
  }

  const { data: jobs, error } = await admin
    .from("jobs")
    .select("id, job_ref, title, category, location, zip_code, status, created_at")
    .eq("source_contractor_id", user.id)
    .order("created_at", { ascending: false })
    .limit(Math.max(1, Math.min(500, Math.floor(limit))));
  if (error) return { leads: [], error: error.message };

  const rows = (jobs ?? []) as Array<Record<string, unknown>>;
  if (!rows.length) return { leads: [], error: null };

  // This contractor's bids on those jobs (by account id, or by the phone the bid was built from).
  const { data: profile } = await admin.from("profiles").select("phone").eq("id", user.id).maybeSingle();
  const myPhone = digits10((profile as { phone?: string | null } | null)?.phone);

  const ids = rows.map((j) => String(j.id));
  const { data: props } = await admin
    .from("proposals")
    .select("job_id, share_token, status, total_price, contractor_id, contractor_phone, created_at")
    .in("job_id", ids)
    .order("created_at", { ascending: false });

  const bidByJob = new Map<string, PageLeadBid>();
  for (const p of (props ?? []) as Array<Record<string, unknown>>) {
    const mine = p.contractor_id === user.id || (myPhone.length === 10 && digits10(p.contractor_phone) === myPhone);
    if (!mine) continue;
    const jobId = String(p.job_id);
    if (bidByJob.has(jobId)) continue; // newest first — keep the latest bid
    bidByJob.set(jobId, {
      share_token: String(p.share_token ?? ""),
      status: (p.status as string | null) ?? null,
      total_price: typeof p.total_price === "number" ? p.total_price : p.total_price != null ? Number(p.total_price) : null,
    });
  }

  const leads: PageLead[] = rows.map((j) => ({
    id: String(j.id),
    job_ref: (j.job_ref as string | null) ?? null,
    title: String(j.title || j.category || "New project"),
    category: (j.category as string | null) ?? null,
    location: (j.location as string | null) ?? null,
    zip_code: (j.zip_code as string | null) ?? null,
    status: (j.status as string | null) ?? null,
    created_at: String(j.created_at),
    bid: bidByJob.get(String(j.id)) ?? null,
  }));

  return { leads, error: null };
}

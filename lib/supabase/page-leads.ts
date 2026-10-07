"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cleanIntakeLine } from "@/lib/intake-clean";

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

export interface PageLeadHomeowner {
  name: string | null;
  phone: string | null; // E.164 when known
  email: string | null; // null for the synthetic <digits>@sms.homebids.ai accounts
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
  // Lead details (Tim, Oct 5: "we want the contractor to open up the job details/scope,
  // time frame/pics and all contact info we collected during the lead intake")
  description: string | null;
  urgency: string | null; // asap | within_week | within_month | flexible
  budget_min: number | null;
  budget_max: number | null;
  images: string[];
  homeowner: PageLeadHomeowner;
  // JOBSUMMARY (Tim, Oct 7): the AI brief written at intake (Ava v17.10 <JOB> block → jobs.intake_project /
  // jobs.intake_notes). Null for leads created before that - the page falls back to the service label and hides Notes.
  brief_project: string | null;
  brief_notes: string | null;
  // The homeowner's own texts to Ava during this intake, oldest first, CLEANED: Ava channel only (never the
  // contractor's Bid Builder texts from the same phone), no [AVA CONTEXT …] brackets, no "(Ref: …)" setup lines,
  // no repeats. Shown only behind "View original conversation".
  conversation: string[];
}
const digits10 = (v: unknown) => String(v ?? "").replace(/\D/g, "").slice(-10);
const normalizePhone = (v: unknown): string | null => {
  const d = String(v ?? "").replace(/\D/g, "");
  if (d.length < 10) return null;
  return "+" + (d.length === 10 ? "1" + d : d);
};

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
    .select("id, job_ref, title, category, location, zip_code, status, created_at, description, urgency, budget_min, budget_max, images, homeowner_id")
    .eq("source_contractor_id", user.id)
    .order("created_at", { ascending: false })
    .limit(Math.max(1, Math.min(500, Math.floor(limit))));
  if (error) return { leads: [], error: error.message };

  const rows = (jobs ?? []) as Array<Record<string, unknown>>;
  if (!rows.length) return { leads: [], error: null };

  // JOBSUMMARY: the AI brief columns are read in their own query so the leads list keeps working even on a
  // database that does not have them yet (the column migration and this code can ship in either order).
  const briefByJob = new Map<string, { project: string | null; notes: string | null }>();
  try {
    const { data: briefs, error: briefErr } = await admin
      .from("jobs")
      .select("id, intake_project, intake_notes")
      .in("id", rows.map((j) => String(j.id)));
    if (!briefErr) {
      for (const b of (briefs ?? []) as Array<Record<string, unknown>>) {
        briefByJob.set(String(b.id), {
          project: String(b.intake_project ?? "").trim() || null,
          notes: String(b.intake_notes ?? "").trim() || null,
        });
      }
    }
  } catch {
    /* columns not there yet - fall back to the service label, no Notes line */
  }

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

  // Homeowner contact for each lead. A page lead is exclusive to this contractor, so the
  // name + phone the homeowner gave Ava are theirs to see (no scrub — unlike marketplace jobs).
  const homeownerIds = Array.from(new Set(rows.map((j) => String(j.homeowner_id || "")).filter(Boolean)));
  const ownerById = new Map<string, PageLeadHomeowner>();
  if (homeownerIds.length) {
    const { data: owners } = await admin.from("profiles").select("id, full_name, phone, email").in("id", homeownerIds);
    for (const o of (owners ?? []) as Array<Record<string, unknown>>) {
      const email = String(o.email ?? "").trim();
      ownerById.set(String(o.id), {
        name: String(o.full_name ?? "").trim() || null,
        phone: normalizePhone(o.phone),
        email: email && !/@sms\.homebids\.ai$/i.test(email) ? email : null,
      });
    }
  }

  // What the homeowner actually told Ava during the intake (their own texts, oldest first).
  // JOBSUMMARY: Ava channel only - Tim tests contractor + homeowner from one phone and the contractor's
  // Bid Builder texts ("bid JB-…") were showing up as "what they told us" (JB-9F54: 43 rows, 22 Ava's).
  const notesByJob = new Map<string, string[]>();
  const phones = Array.from(new Set(Array.from(ownerById.values()).map((o) => o.phone).filter(Boolean))) as string[];
  if (phones.length) {
    const times = rows.map((j) => new Date(String(j.created_at)).getTime()).filter((t) => Number.isFinite(t));
    const from = new Date(Math.min(...times) - 36 * 3600 * 1000).toISOString();
    const to = new Date(Math.max(...times) + 10 * 60 * 1000).toISOString();
    const { data: msgs } = await admin
      .from("messages")
      .select("phone, role, content, created_at")
      .in("phone", phones)
      .eq("role", "user")
      .eq("channel", "ava")
      .gte("created_at", from)
      .lte("created_at", to)
      .order("created_at", { ascending: true })
      .limit(2000);
    const byPhone = new Map<string, Array<{ t: number; c: string }>>();
    for (const m of (msgs ?? []) as Array<Record<string, unknown>>) {
      const ph = normalizePhone(m.phone);
      const c = cleanIntakeLine(m.content);
      if (!ph || !c) continue;
      if (!byPhone.has(ph)) byPhone.set(ph, []);
      byPhone.get(ph)!.push({ t: new Date(String(m.created_at)).getTime(), c });
    }
    for (const j of rows) {
      const owner = ownerById.get(String(j.homeowner_id || ""));
      const ph = owner?.phone;
      if (!ph) continue;
      const created = new Date(String(j.created_at)).getTime();
      const win = (byPhone.get(ph) ?? []).filter((m) => m.t >= created - 36 * 3600 * 1000 && m.t <= created + 10 * 60 * 1000);
      // repeats collapse to the first occurrence ("Yes" / "yes." / "Yes!" are one answer)
      const seen = new Set<string>();
      const unique: string[] = [];
      for (const m of win) {
        const key = m.c.toLowerCase().replace(/[^a-z0-9]+/g, "");
        if (!key || seen.has(key)) continue;
        seen.add(key);
        unique.push(m.c);
      }
      notesByJob.set(String(j.id), unique.slice(-12));
    }
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
    description: String(j.description ?? "").trim() || null,
    urgency: (j.urgency as string | null) ?? null,
    budget_min: typeof j.budget_min === "number" ? j.budget_min : null,
    budget_max: typeof j.budget_max === "number" ? j.budget_max : null,
    images: Array.isArray(j.images) ? (j.images as unknown[]).map(String).filter((u) => /^https?:\/\//.test(u)) : [],
    homeowner: ownerById.get(String(j.homeowner_id || "")) ?? { name: null, phone: null, email: null },
    brief_project: briefByJob.get(String(j.id))?.project ?? null,
    brief_notes: briefByJob.get(String(j.id))?.notes ?? null,
    conversation: notesByJob.get(String(j.id)) ?? [],
  }));

  return { leads, error: null };
}

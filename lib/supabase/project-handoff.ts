"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Approved Project handoff (Tim, Oct 6): everything the contractor needs to go from
 * approval → scheduling → done, in one place. Contact info is released here because
 * the homeowner ACCEPTED this contractor's bid — never for pending bids.
 */
export interface ApprovedProject {
  // bid
  share_token: string;
  project_title: string;
  project_summary: string | null;
  scope_items: Array<{ description?: string | null; amount?: number | null } | string>;
  add_ons: Array<{ description?: string | null; amount?: number | null } | string>;
  total_price: number | null;
  price_note: string | null;
  timeline_completion: string | null;
  pdf_url: string | null;
  accepted_at: string | null;
  // job
  job_ref: string | null;
  category: string | null;
  description: string | null;
  location: string | null;
  zip_code: string | null;
  images: string[];
  // homeowner (released on acceptance)
  homeowner_name: string | null;
  homeowner_phone: string | null;
  homeowner_email: string | null;
  // thread
  c_token: string | null;
}

const last10 = (v: unknown) => String(v ?? "").replace(/\D/g, "").slice(-10);

export async function getApprovedProject(shareToken: string): Promise<{ project: ApprovedProject | null; error: string | null }> {
  const token = String(shareToken ?? "").trim();
  if (!token) return { project: null, error: "No token" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { project: null, error: "Not authenticated" };

  const admin = createAdminClient();
  const { data: rows, error } = await admin
    .from("proposals")
    .select("share_token, contractor_id, contractor_phone, homeowner_name, homeowner_phone, project_title, project_summary, scope_items, add_ons, total_price, price_note, timeline_completion, pdf_url, status, job_id, updated_at")
    .eq("share_token", token)
    .limit(1);
  if (error) return { project: null, error: error.message };
  const p = (rows ?? [])[0] as Record<string, unknown> | undefined;
  if (!p) return { project: null, error: "Bid not found" };

  // ── ownership: the signed-in contractor, by id or by their profile phone ──
  const { data: me } = await admin.from("profiles").select("phone").eq("id", user.id).maybeSingle();
  const mine = last10(me?.phone);
  const owns = String(p.contractor_id || "") === user.id || (!!mine && last10(p.contractor_phone) === mine);
  if (!owns) return { project: null, error: "Not your bid" };
  if (String(p.status) !== "accepted") return { project: null, error: "This bid isn't accepted yet" };

  // ── job + homeowner ──
  let job: Record<string, unknown> = {};
  if (p.job_id) {
    const { data: j } = await admin
      .from("jobs")
      .select("job_ref, category, description, location, zip_code, images, homeowner_id")
      .eq("id", p.job_id as string)
      .maybeSingle();
    job = (j as Record<string, unknown>) ?? {};
  }

  let hoName = (p.homeowner_name as string | null) ?? null;
  let hoPhone = (p.homeowner_phone as string | null) ?? null;
  let hoEmail: string | null = null;
  if (job.homeowner_id) {
    const { data: owner } = await admin.from("profiles").select("full_name, phone, email").eq("id", job.homeowner_id as string).maybeSingle();
    if (owner) {
      hoName = hoName || (String(owner.full_name ?? "").trim() || null);
      hoPhone = hoPhone || (String(owner.phone ?? "").trim() || null);
      const em = String(owner.email ?? "").trim();
      hoEmail = em && !/@sms\.homebids\.ai$/i.test(em) ? em : null;
    }
  }
  if (hoPhone) {
    const d = String(hoPhone).replace(/\D/g, "");
    hoPhone = d.length >= 10 ? "+1" + d.slice(-10) : hoPhone;
  }

  // ── thread workspace token (correspondence lives there) ──
  let cToken: string | null = null;
  if (p.job_id) {
    const { data: th } = await admin
      .from("contractor_threads")
      .select("c_token, contractor_phone")
      .eq("job_id", p.job_id as string)
      .limit(50);
    const hit = (th ?? []).find((t) => last10((t as { contractor_phone?: string }).contractor_phone) === last10(p.contractor_phone) || (!!mine && last10((t as { contractor_phone?: string }).contractor_phone) === mine));
    cToken = (hit as { c_token?: string } | undefined)?.c_token ?? null;
  }

  const arr = (v: unknown) => (Array.isArray(v) ? v : []);
  return {
    project: {
      share_token: String(p.share_token),
      project_title: String(p.project_title || "Project"),
      project_summary: (p.project_summary as string | null) ?? null,
      scope_items: arr(p.scope_items) as ApprovedProject["scope_items"],
      add_ons: arr(p.add_ons) as ApprovedProject["add_ons"],
      total_price: typeof p.total_price === "number" ? p.total_price : null,
      price_note: (p.price_note as string | null) ?? null,
      timeline_completion: (p.timeline_completion as string | null) ?? null,
      pdf_url: (p.pdf_url as string | null) ?? null,
      accepted_at: (p.updated_at as string | null) ?? null,
      job_ref: (job.job_ref as string | null) ?? null,
      category: (job.category as string | null) ?? null,
      description: String(job.description ?? "").trim() || null,
      location: (job.location as string | null) ?? null,
      zip_code: (job.zip_code as string | null) ?? null,
      images: arr(job.images).map(String).filter((u) => /^https?:\/\//.test(u)),
      homeowner_name: hoName,
      homeowner_phone: hoPhone,
      homeowner_email: hoEmail,
      c_token: cToken,
    },
    error: null,
  };
}

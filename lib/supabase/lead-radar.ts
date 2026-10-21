"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Lead Radar (Tim/Abir, Oct 21): a contractor registers up to 25 PUBLIC Facebook
 * groups; the radar (n8n "HomeBids - Lead Radar") scans them, keeps the homeowner
 * "looking for a pro" posts, and texts the contractor each matching lead with the
 * post link + a ready-to-paste comment. Nothing is ever posted from anyone's
 * Facebook account - the contractor posts the comment himself.
 *
 * Everything here goes through SECURITY DEFINER RPCs scoped to auth.uid()
 * (radar_overview / radar_add_groups / radar_remove_group / radar_set_group /
 * radar_set_settings / radar_set_lead_status on dpaj). The radar_* tables have
 * RLS on and no policies, so the signed-in session can only reach its own rows
 * through these functions.
 */

export interface RadarGroup {
  id: string;
  url: string;
  name: string | null;
  city: string | null;
  enabled: boolean;
  last_scraped_at: string | null;
  last_post_count: number | null;
  last_error: string | null;
  created_at: string;
}

export interface RadarSettings {
  categories: string[] | null; // null = every homeowner request in my groups
  paused: boolean;
}

export interface RadarLeadPost {
  url: string | null;
  text: string | null;
  author: string | null;
  posted_at: string | null;
  group_name: string | null;
  group_url: string | null;
  category: string | null;
  city: string | null;
  urgency: string | null; // asap | within_week | within_month | flexible
  homeowner_first: string | null;
}

export interface RadarLead {
  id: string;
  status: "new" | "contacted" | "skipped";
  created_at: string;
  texted_at: string | null;
  comment: string | null;
  post: RadarLeadPost;
}

export interface RadarOverview {
  max_groups: number;
  settings: RadarSettings | null;
  profile: { company: string | null; specialties: string[] | null; phone: string | null } | null;
  groups: RadarGroup[];
  leads: RadarLead[];
}

export interface AddGroupsResult {
  ok: boolean;
  added: number;
  duplicates: number;
  invalid: string[];
  total: number;
  max_groups: number;
}

type Result<T> = { data: T; error: null } | { data: null; error: string };

async function rpc<T>(fn: string, args?: Record<string, unknown>): Promise<Result<T>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "Not authenticated" };
  const { data, error } = await supabase.rpc(fn, args ?? {});
  if (error) return { data: null, error: error.message };
  return { data: data as T, error: null };
}

/** Everything the /contractors/lead-radar page shows, in one call. */
export async function getRadarOverview(): Promise<Result<RadarOverview>> {
  return rpc<RadarOverview>("radar_overview");
}

/** Add public group links (any facebook.com/groups/<slug> form; duplicates and junk are reported, never fatal). */
export async function addRadarGroups(urls: string[]): Promise<Result<AddGroupsResult>> {
  const clean = Array.from(
    new Set(
      (urls ?? [])
        .map((u) => String(u ?? "").trim())
        .filter(Boolean)
        .slice(0, 100),
    ),
  );
  if (!clean.length) return { data: { ok: true, added: 0, duplicates: 0, invalid: [], total: 0, max_groups: 25 }, error: null };
  return rpc<AddGroupsResult>("radar_add_groups", { p_urls: clean });
}

export async function removeRadarGroup(id: string): Promise<Result<{ ok: boolean }>> {
  return rpc<{ ok: boolean }>("radar_remove_group", { p_id: id });
}

/** Pause/resume one group, or set the city it should assume when a post names none. */
export async function setRadarGroup(id: string, enabled: boolean | null, city?: string | null): Promise<Result<{ ok: boolean }>> {
  return rpc<{ ok: boolean }>("radar_set_group", { p_id: id, p_enabled: enabled, p_city: city ?? null });
}

/** Which trades this contractor wants texted about (empty/null = all homeowner requests) and the global pause. */
export async function setRadarSettings(categories: string[] | null, paused?: boolean | null): Promise<Result<{ ok: boolean }>> {
  const cats = (categories ?? []).map((c) => String(c).trim()).filter(Boolean);
  return rpc<{ ok: boolean }>("radar_set_settings", { p_categories: cats.length ? cats : null, p_paused: paused ?? null });
}

export async function setRadarLeadStatus(id: string, status: "new" | "contacted" | "skipped"): Promise<Result<{ ok: boolean }>> {
  return rpc<{ ok: boolean }>("radar_set_lead_status", { p_id: id, p_status: status });
}

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
 *
 * v2 (Oct 26): matching + alerts moved into Postgres (radar_match_post /
 * radar_lead_alert, fired by triggers on radar_posts / radar_leads), so leads and
 * texts/emails happen no matter who inserts the posts. Settings grew custom
 * trades + email alerts.
 *
 * v3 (Tim, Oct 27 "Can we modify the opportunities CTA's to this?" - Build Bid /
 * Open Post / Hide / Skip): every lead carries a short ref (LR-XXXX, assigned at
 * birth). "Build Bid" opens a text to the Bid Builder line pre-filled with that ref and
 * stamps the lead (radar_start_bid); Bid Builder looks the ref up in Supabase
 * (radar_lead_for_bid) so the assistant already knows the Facebook post, and the
 * proposal it builds is linked back to the lead by trigger (lead.proposal).
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
  custom_trades: string[] | null; // free-text trades ("Pool service") matched against the post text
  email_alerts: boolean;
  alert_email: string | null;
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

export type RadarLeadStatus = "new" | "contacted" | "skipped" | "hidden" | "bid";

export interface RadarLeadProposal {
  id: string;
  share_token: string;
  status: string | null; // draft | sent | viewed | accepted ...
  total_price: number | null;
  created_at: string;
}

export interface RadarLead {
  id: string;
  status: RadarLeadStatus;
  created_at: string;
  texted_at: string | null;
  emailed_at: string | null;
  comment: string | null;
  bid_ref: string | null; // LR-XXXX - what the contractor texts the Bid Builder line to build the bid from this post
  bid_started_at: string | null;
  proposal: RadarLeadProposal | null; // the bid the assistant built from this post, once there is one
  post: RadarLeadPost;
}

export interface StartBidResult {
  ok: boolean;
  error?: string;
  ref?: string;
  sms_body?: string;
  first?: string | null;
  city?: string | null;
  trade?: string | null;
  group_name?: string | null;
}

export interface RadarOverview {
  max_groups: number;
  settings: RadarSettings | null;
  profile: { company: string | null; specialties: string[] | null; phone: string | null; email: string | null } | null;
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

/**
 * Which trades this contractor wants alerts about (empty/null = all homeowner requests), the global pause, the custom
 * trades and the email alert switch. Pass `null`/`undefined` for anything that should stay as it is — only
 * `categories` is always written.
 */
export async function setRadarSettings(
  categories: string[] | null,
  paused?: boolean | null,
  customTrades?: string[] | null,
  emailAlerts?: boolean | null,
  alertEmail?: string | null,
): Promise<Result<{ ok: boolean }>> {
  const cats = (categories ?? []).map((c) => String(c).trim()).filter(Boolean);
  const custom = customTrades == null ? null : customTrades.map((c) => String(c).trim()).filter(Boolean).slice(0, 10);
  return rpc<{ ok: boolean }>("radar_set_settings", {
    p_categories: cats.length ? cats : null,
    p_paused: paused ?? null,
    p_custom_trades: custom,
    p_email_alerts: emailAlerts ?? null,
    p_alert_email: alertEmail === undefined ? null : alertEmail,
  });
}

export async function setRadarLeadStatus(id: string, status: "new" | "contacted" | "skipped" | "hidden"): Promise<Result<{ ok: boolean }>> {
  return rpc<{ ok: boolean }>("radar_set_lead_status", { p_id: id, p_status: status });
}

/**
 * "Build Bid" on an opportunity: stamps the lead (status `bid`, bid_started_at) and returns its LR- ref plus the text
 * to send the Bid Builder line ("Build a bid for my Facebook lead LR-XXXX"). Idempotent - tapping again keeps the same ref.
 */
export async function startRadarBid(id: string): Promise<Result<StartBidResult>> {
  return rpc<StartBidResult>("radar_start_bid", { p_id: id });
}

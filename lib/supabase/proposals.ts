"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Hosted Proposal data-access layer.
 *
 * IMPORTANT ARCHITECTURE NOTE:
 * The AI Bid Builder that *generates* proposals lives in an EXTERNAL workflow
 * (outside v0). That workflow writes/updates rows in the `proposals` table in
 * Supabase. This module only READS those rows for display and performs
 * lightweight view/CTA tracking. It does not generate proposal content.
 *
 * Public reads + event logging go through SECURITY DEFINER RPCs
 * (`get_proposal_by_share_token`, `log_proposal_view`, `log_proposal_action`)
 * so anonymous homeowners can view a single proposal by its unguessable token
 * without exposing the whole table. Contractor-scoped reads use RLS.
 */

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ProposalScopeItem {
  title: string;
  description?: string;
}

export interface ProposalAddOn {
  title: string;
  price?: number;
}

export interface ProposalPhoto {
  url: string;
  caption?: string;
}

export type ProposalStatus =
  | "draft"
  | "sent"
  | "viewed"
  | "question_asked"
  | "approval_clicked"
  | "accepted"
  | "changes_requested";

export interface Proposal {
  id: string;
  share_token: string;
  contractor_id: string | null;
  contractor_company_name: string | null;
  contractor_logo_url: string | null;
  contractor_phone: string | null;
  homeowner_name: string | null;
  homeowner_phone: string | null;
  project_title: string;
  project_summary: string | null;
  scope_items: ProposalScopeItem[];
  total_price: number | null;
  price_note: string | null;
  add_ons: ProposalAddOn[];
  timeline_start: string | null;
  timeline_completion: string | null;
  notes: string | null;
  photos: ProposalPhoto[];
  pdf_url: string | null;
  status: ProposalStatus;
  first_viewed_at: string | null;
  last_viewed_at: string | null;
  view_count: number;
  approval_clicked_at: string | null;
  question_clicked_at: string | null;
  call_clicked_at: string | null;
  pdf_downloaded_at: string | null;
  created_at: string;
  updated_at: string;
}

export type ProposalActionEvent =
  | "accepted_clicked"
  | "question_clicked"
  | "call_clicked"
  | "pdf_downloaded";

export async function acceptProposal(token: string): Promise<{
  ok: boolean;
  project_title: string | null;
  company: string | null;
}> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("accept_proposal", { p_token: token });
    if (error) return { ok: false, project_title: null, company: null };

    const row = Array.isArray(data) ? data[0] : data;
    return {
      ok: row?.out_ok === true,
      project_title: row?.out_project_title ?? null,
      company: row?.out_company ?? null,
    };
  } catch {
    return { ok: false, project_title: null, company: null };
  }
}

// JSONB columns arrive as `unknown`; coerce defensively so the UI never crashes
// on a malformed payload written by the external Bid Builder.
function normalizeProposal(row: Record<string, unknown>): Proposal {
  const asArray = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
  return {
    ...(row as unknown as Proposal),
    scope_items: asArray<ProposalScopeItem>(row.scope_items),
    add_ons: asArray<ProposalAddOn>(row.add_ons),
    photos: asArray<ProposalPhoto>(row.photos),
  };
}

// ── Public read (anonymous, by share token) ──────────────────────────────────────

/** Fetch a single proposal by its public share token. Safe for anonymous use. */
export async function getProposalByShareToken(
  shareToken: string,
): Promise<{ proposal: Proposal | null; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("get_proposal_by_share_token", { p_token: shareToken })
    .maybeSingle();

  if (error) return { proposal: null, error: error.message };
  if (!data) return { proposal: null, error: null };
  return { proposal: normalizeProposal(data as Record<string, unknown>), error: null };
}

// ── Lightweight tracking ─────────────────────────────────────────────────────────

/** Record a proposal view. Non-blocking — failures never break the page. */
export async function logProposalView(
  shareToken: string,
  meta?: { userAgent?: string | null; referrer?: string | null },
): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.rpc("log_proposal_view", {
      p_token: shareToken,
      p_user_agent: meta?.userAgent ?? null,
      p_referrer: meta?.referrer ?? null,
    });
  } catch {
    // swallow — tracking is best-effort
  }
}

/**
 * Record a CTA click (accept / question / call / pdf). Non-blocking.
 * For "accepted_clicked" events, also sends an instant SMS notification
 * to the contractor (fire-and-forget, never blocks).
 */
export async function logProposalAction(
  shareToken: string,
  eventType: ProposalActionEvent,
  proposalData?: { contractor_phone: string | null; homeowner_name: string | null; project_title: string } | null,
): Promise<void> {
  try {
    const supabase = await createClient();
    
    // Fetch current approval_clicked_at state to check if this is the first approval
    let approval_clicked_at_before: string | null = null;
    if (eventType === "accepted_clicked") {
      const { data } = await supabase.rpc("get_proposal_by_share_token", { p_token: shareToken }).maybeSingle();
      if (data) {
        approval_clicked_at_before = (data as any)?.approval_clicked_at ?? null;
      }
    }
    
    // Log the action
    await supabase.rpc("log_proposal_action", {
      p_token: shareToken,
      p_event_type: eventType,
    });

    // Send SMS notification on first approval click (fire-and-forget)
    if (eventType === "accepted_clicked" && !approval_clicked_at_before && proposalData?.contractor_phone) {
      sendApprovalNotificationSms(shareToken, proposalData).catch(() => {
        // swallow SMS errors — never block the action
      });
    }
  } catch {
    // swallow — tracking is best-effort
  }
}

/**
 * Send SMS notification to contractor when homeowner approves a bid.
 * Fire-and-forget, never throws or blocks.
 */
async function sendApprovalNotificationSms(
  shareToken: string,
  proposalData: { contractor_phone: string | null; homeowner_name: string | null; project_title: string },
): Promise<void> {
  if (!proposalData.contractor_phone) return;

  try {
    const keyId = process.env.SENDBLUE_KEY_ID;
    const keySecret = process.env.SENDBLUE_KEY_SECRET;
    if (!keyId || !keySecret) {
      console.warn("[sendApprovalNotificationSms] Missing SENDBLUE credentials");
      return;
    }

    const homeownerName = proposalData.homeowner_name || "The homeowner";
    const projectTitle = proposalData.project_title;
    const approvalLink = `https://www.homebids.ai/p/${shareToken}`;

    const message = `🎉 ${homeownerName} just approved your bid for "${projectTitle}"! View it: ${approvalLink}`;

    const response = await fetch("https://api.sendblue.co/api/send-message", {
      method: "POST",
      headers: {
        "sb-api-key-id": keyId,
        "sb-api-secret-key": keySecret,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        number: proposalData.contractor_phone,
        from_number: "+12832291348",
        content: message,
      }),
    });

    if (!response.ok) {
      console.warn(`[sendApprovalNotificationSms] SendBlue error: ${response.status}`);
    }
  } catch (err) {
    console.warn("[sendApprovalNotificationSms] Error:", err);
  }
}

// ── Contractor-scoped reads (RLS protected) ───────────────────────────────────────

/** List proposals owned by the currently authenticated contractor. */
export async function getContractorProposals(): Promise<{
  proposals: Proposal[];
  error: string | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { proposals: [], error: "Not authenticated" };

  // Once per dashboard load, attach any bids that were created by phone match
  // (e.g. before the contractor signed in) to this account. Ignore the result.
  await supabase.rpc("claim_my_bids");

  // Match bids both by the authenticated contractor id and by the phone number
  // on their profile, so bids created via SMS before account linkage still show.
  const { data: profile } = await supabase
    .from("profiles")
    .select("phone")
    .eq("id", user.id)
    .maybeSingle();
  const phone = (profile?.phone as string | null) ?? null;

  // Cap the result set so a contractor with thousands of proposals never
  // triggers an unbounded fetch. The dashboard shows recent activity; older
  // proposals can be paginated in a dedicated view later if needed.
  let query = supabase.from("proposals").select("*");
  query = phone
    ? query.or(`contractor_id.eq.${user.id},contractor_phone.eq.${phone}`)
    : query.eq("contractor_id", user.id);
  const { data, error } = await query
    .order("updated_at", { ascending: false })
    .limit(100);

  if (error) return { proposals: [], error: error.message };
  return {
    proposals: (data ?? []).map((r) => normalizeProposal(r as Record<string, unknown>)),
    error: null,
  };
}

// ── Marketplace bids (contractor-scoped reads) ────────────────────────────────────

export interface MarketplaceBid {
  id: string;
  amount: number | null;
  message: string | null;
  timeline: string | null;
  status: string;
  created_at: string;
  jobs: {
    id: string;
    title: string;
    location: string;
    job_ref: string;
    share_token: string;
  } | null;
}

/** List marketplace bids submitted by the currently authenticated contractor. */
export async function getContractorMarketplaceBids(): Promise<{
  bids: MarketplaceBid[];
  error: string | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { bids: [], error: "Not authenticated" };

  const { data, error } = await supabase
    .from("bids")
    .select("id, amount, message, timeline, status, created_at, jobs(id, title, location, job_ref, share_token)")
    .eq("contractor_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return { bids: [], error: error.message };
  return {
    bids: ((data ?? []) as unknown as MarketplaceBid[]),
    error: null,
  };
}

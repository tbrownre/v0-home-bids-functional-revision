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

/** Record a CTA click (accept / question / call / pdf). Non-blocking. */
export async function logProposalAction(
  shareToken: string,
  eventType: ProposalActionEvent,
): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.rpc("log_proposal_action", {
      p_token: shareToken,
      p_event_type: eventType,
    });
  } catch {
    // swallow — tracking is best-effort
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

  const { data, error } = await supabase
    .from("proposals")
    .select("*")
    .eq("contractor_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) return { proposals: [], error: error.message };
  return {
    proposals: (data ?? []).map((r) => normalizeProposal(r as Record<string, unknown>)),
    error: null,
  };
}

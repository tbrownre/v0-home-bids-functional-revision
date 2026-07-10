// ─────────────────────────────────────────────────────────────────────────────
// Bid Resume — frontend flow + backend-ready stubs
// ─────────────────────────────────────────────────────────────────────────────
//
// This module powers the "Finish Bid" resume flow. Today everything runs on the
// client with mock/demo data, but the shapes and helpers are structured so the
// real backend can be dropped in later WITHOUT changing the UI.
//
// TODO(backend): to make this real, add the following (no UI changes required):
//   1. Create a Supabase `bid_resume_sessions` table:
//        id                uuid primary key default gen_random_uuid()
//        resume_code       text unique not null      -- e.g. "HB-4821"
//        contractor_id     uuid not null references auth.users
//        job_id            text
//        draft_bid_id      text not null
//        bid_id            text
//        title             text not null
//        status            text not null             -- draft | sent | ...
//        source_type       text not null             -- needs_action | lead | ...
//        sms_body          text not null
//        created_at        timestamptz default now()
//        expires_at        timestamptz
//      Enable RLS + policy: contractor_id = auth.uid().
//   2. Create an outbound SMS API route (e.g. app/api/sms/send/route.ts) that
//      calls SendBlue with { to, body } once SMS is connected.
//   3. Create an inbound SMS webhook route (e.g. app/api/sms/webhook/route.ts):
//        - match the contractor by inbound phone number
//        - parse the "Ref: HB-XXXX" resume code from the message body
//        - load draft_bid_id / job_id from bid_resume_sessions
//        - continue the AI bid builder using the saved draft context
//   4. Swap the mock implementations below for Supabase queries + the API routes.
// ─────────────────────────────────────────────────────────────────────────────

/** Action a Needs Action card represents. */
export type NeedsActionType = "finish_draft" | "follow_up" | "review" | "new_request";

/** Where this actionable item originated. */
export type BidSourceType = "needs_action" | "homebids_lead" | "manual" | "sms_import";

/**
 * Full context for a Needs Action card. Every actionable card carries one of
 * these so the selected item's identity is preserved through the modal and into
 * the next action (resume by text / continue on site).
 */
export interface NeedsActionContext {
  needsActionId: string;
  actionType: NeedsActionType;
  contractorId: string;
  jobId: string | null;
  draftBidId: string;
  /** Present once a bid record exists (e.g. already sent). */
  bidId: string | null;
  title: string;
  status: string;
  sourceType: BidSourceType;
  /** Optional: pre-populated proposal data for resuming a draft. */
  proposalData?: {
    project: string;
    owner: string;
    scope: string[];
    optional: string[];
    price: string;
    timeline: string;
  };
  /** Optional: proposal ID when resuming an existing draft. */
  proposalId?: string;
  /** Optional: share token from proposal. */
  shareToken?: string;
}

/**
 * A resume session ties a short, human-friendly resume code to a saved draft so
 * the contractor can continue it by text. Backed by mock data now; will map 1:1
 * to a `bid_resume_sessions` row later.
 */
export interface ResumeSession {
  resumeCode: string;
  draftBidId: string;
  jobId: string | null;
  bidId: string | null;
  title: string;
  status: string;
  contractorId: string;
  sourceType: BidSourceType;
  smsBody: string;
  createdAt: string;
}

// In-memory session store keyed by draftBidId. Lives for the browser session
// only — this is what enforces "no duplicate draft" on the frontend today.
// TODO(backend): replace with a `bid_resume_sessions` lookup keyed by draft_bid_id.
const resumeSessions = new Map<string, ResumeSession>();

/** Generates a short, readable resume code like "HB-4821". */
export function generateResumeCode(): string {
  const n = Math.floor(1000 + Math.random() * 9000); // 4 digits, no leading zero
  return `HB-${n}`;
}

/**
 * Backend-ready route for continuing a draft on the site. The dedicated
 * build-bid page does not exist yet, so callers currently resume the in-app bid
 * builder directly; this helper exists so navigation can switch to a real route
 * later without touching call sites.
 *
 * TODO(backend): once app/dashboard/build-bid/page.tsx exists, navigate here.
 */
export function getBuildBidRoute(draftBidId: string): string {
  return `/dashboard/build-bid?draftBidId=${encodeURIComponent(draftBidId)}`;
}

/** Builds the (mock) SMS body a contractor would receive to resume a draft. */
export function buildResumeSmsBody(title: string, resumeCode: string): string {
  return `You're finishing ${title}. Reply with pricing, notes, photos, or voice notes and I'll complete the proposal. Ref: ${resumeCode}`;
}

/**
 * Looks up an existing draft by id. Mock today (returns whatever context was
 * used to create the session, if any).
 * TODO(backend): SELECT * FROM bids WHERE id = draftBidId AND contractor_id = auth.uid().
 */
export function getExistingDraft(draftBidId: string): ResumeSession | null {
  return resumeSessions.get(draftBidId) ?? null;
}

/**
 * Returns an existing resume session for a draft if one was already created,
 * preventing a duplicate draft/session from being generated. Mock today.
 * TODO(backend): SELECT * FROM bid_resume_sessions WHERE draft_bid_id = $1
 *                AND contractor_id = auth.uid() ORDER BY created_at DESC LIMIT 1.
 */
export function preventDuplicateDraft(draftBidId: string): ResumeSession | null {
  return resumeSessions.get(draftBidId) ?? null;
}

/**
 * Creates (or reuses) a resume session for a Needs Action item. This is the
 * "Continue by Text" entry point. It is idempotent per draftBidId so repeatedly
 * clicking Finish Bid never spawns a duplicate draft.
 * TODO(backend): INSERT INTO bid_resume_sessions (...) and call the outbound SMS
 *                route to actually text the contractor.
 */
export function createResumeSession(ctx: NeedsActionContext): ResumeSession {
  // Reuse an existing session for this draft — no duplicate drafts.
  const existing = preventDuplicateDraft(ctx.draftBidId);
  if (existing) {
    console.log("[v0] Reusing existing resume session:", existing.resumeCode, "for draft", ctx.draftBidId);
    return existing;
  }

  const resumeCode = generateResumeCode();
  const session: ResumeSession = {
    resumeCode,
    draftBidId: ctx.draftBidId,
    jobId: ctx.jobId,
    bidId: ctx.bidId,
    title: ctx.title,
    status: ctx.status,
    contractorId: ctx.contractorId,
    sourceType: ctx.sourceType,
    smsBody: buildResumeSmsBody(ctx.title, resumeCode),
    createdAt: new Date().toISOString(),
  };
  resumeSessions.set(ctx.draftBidId, session);
  console.log("[v0] Created resume session:", resumeCode, "for draft", ctx.draftBidId);
  return session;
}

/**
 * Resumes a draft bid — the "Continue on Site" entry point. When proposalData
 * is provided, uses real proposal data instead of creating a session. Returns
 * the session (creating one if needed) so the in-app bid builder can be seeded
 * with the saved draft context instead of starting a brand-new bid.
 * TODO(backend): If proposalData is not provided, load the draft from Supabase.
 */
export function resumeDraftBid(ctx: NeedsActionContext): ResumeSession {
  // If resuming with real proposal data, just create a session without needing to fetch
  const existing = getExistingDraft(ctx.draftBidId);
  if (existing) {
    console.log("[v0] Resuming existing draft:", ctx.draftBidId);
    return existing;
  }
  // Ensure a session exists so the resume is tracked even when opened on-site.
  return createResumeSession(ctx);
}

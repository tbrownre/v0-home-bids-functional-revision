"use server";

import type Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { sendEmail } from "@/lib/email";

/**
 * CANCELFLOW (Tim, Oct 7 — Trello "Add Subscription Cancellation Flow + 30-Day Save Offer").
 *
 * Three server actions behind the "Cancel subscription" link on the Account page:
 *   getCancelContext()      what the signed-in contractor's plan looks like + whether the one-time 30-day offer is still available
 *   acceptRetentionOffer()  Stripe: trial_end = now + 30 days on the EXISTING subscription (no new subscription, no proration
 *                           credit) → nothing is charged for 30 days and the next billing date is exactly 30 days out.
 *                           Once per contractor: Stripe metadata `retention_offer_used` + subscriptions.retention_offer_used_at.
 *   cancelSubscription()    Stripe: cancel_at_period_end = true (access until the end of the paid/trial period), feedback saved
 *                           on the subscription row + on the Stripe subscription, and emailed to tim@homebids.ai.
 *
 * Only ever UPDATES the contractor's current Stripe subscription — never creates one. The Stripe webhook keeps
 * status / period end in sync as usual; the row is written here too so the UI is right immediately.
 */

const FEEDBACK_TO = process.env.CANCEL_FEEDBACK_TO || "tim@homebids.ai";
const OFFER_DAYS = 30;

export interface CancelContext {
  hasSubscription: boolean;
  status: string | null;
  /** ISO — when the current paid/trial period ends (what "keep access until" means). */
  periodEnd: string | null;
  /** The contractor already asked to cancel; access runs out at periodEnd. */
  cancelScheduled: boolean;
  /** The one-time 30-day offer has not been used yet. */
  offerEligible: boolean;
  error: string | null;
}

interface SubRow {
  user_id?: string | null;
  status?: string | null;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  current_period_end?: string | null;
  trial_ends_at?: string | null;
  cancel_at_period_end?: boolean | null;
  retention_offer_used_at?: string | null;
  canceled_at?: string | null;
}

const ACTIVE = new Set(["active", "trialing", "past_due", "unpaid", "incomplete"]);

async function me() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** The newest subscription row for the user. The CANCELFLOW columns are read in a second, tolerant query
 *  so the account page keeps working on a database that does not have the migration yet. */
async function loadRow(admin: ReturnType<typeof createAdminClient>, userId: string): Promise<SubRow | null> {
  const { data } = await admin
    .from("subscriptions")
    .select("user_id, status, stripe_customer_id, stripe_subscription_id, current_period_end, trial_ends_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  const row = data as SubRow;
  try {
    const { data: extra, error } = await admin
      .from("subscriptions")
      .select("cancel_at_period_end, retention_offer_used_at, canceled_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!error && extra) Object.assign(row, extra as SubRow);
  } catch {
    /* columns not migrated yet */
  }
  return row;
}

/** Write the CANCELFLOW columns (retention_offer_used_at / canceled_at / cancel_feedback) if they exist; always write
 *  the base ones (status, period end, trial_end(s), cancel_at_period_end, updated_at - all present on the live table). */
async function writeRow(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  base: Record<string, unknown>,
  extra: Record<string, unknown>,
) {
  const { error } = await admin.from("subscriptions").update({ ...base, ...extra }).eq("user_id", userId);
  if (!error) return;
  // 42703 = undefined column → migration not run yet; keep the base columns in sync at least
  const { error: e2 } = await admin.from("subscriptions").update(base).eq("user_id", userId);
  if (e2) console.error("[subscription] row update failed:", e2.message);
}

const iso = (unix: number | null | undefined) => (unix ? new Date(unix * 1000).toISOString() : null);
const periodEndOf = (sub: Stripe.Subscription): string | null => {
  const item = sub.items?.data?.[0] as { current_period_end?: number } | undefined;
  return iso(item?.current_period_end ?? null);
};

export async function getCancelContext(): Promise<CancelContext> {
  const none: CancelContext = { hasSubscription: false, status: null, periodEnd: null, cancelScheduled: false, offerEligible: false, error: null };
  try {
    const user = await me();
    if (!user) return { ...none, error: "Not signed in" };
    const admin = createAdminClient();
    const row = await loadRow(admin, user.id);
    if (!row || !row.stripe_subscription_id) return none;
    const status = row.status ?? null;
    if (status === "canceled") return { ...none, hasSubscription: false, status };

    let offerUsed = Boolean(row.retention_offer_used_at);
    let cancelScheduled = Boolean(row.cancel_at_period_end);
    // Stripe is the source of truth for both flags (works even before the column migration).
    try {
      const sub = await getStripe().subscriptions.retrieve(row.stripe_subscription_id);
      if (sub.metadata?.retention_offer_used) offerUsed = true;
      if (sub.cancel_at_period_end) cancelScheduled = true;
      if (sub.status === "canceled") return { ...none, status: "canceled" };
    } catch {
      /* offline Stripe → go with the row */
    }
    return {
      hasSubscription: true,
      status,
      periodEnd: row.trial_ends_at ?? row.current_period_end ?? null,
      cancelScheduled,
      offerEligible: !offerUsed && ACTIVE.has(String(status)),
      error: null,
    };
  } catch (e) {
    return { ...none, error: e instanceof Error ? e.message : "Could not load your plan" };
  }
}

export async function acceptRetentionOffer(): Promise<{ ok: boolean; nextBillingDate: string | null; error: string | null }> {
  try {
    const user = await me();
    if (!user) return { ok: false, nextBillingDate: null, error: "Not signed in" };
    const admin = createAdminClient();
    const row = await loadRow(admin, user.id);
    if (!row?.stripe_subscription_id) return { ok: false, nextBillingDate: null, error: "No active subscription found" };

    const stripe = getStripe();
    const current = await stripe.subscriptions.retrieve(row.stripe_subscription_id);
    if (current.status === "canceled") return { ok: false, nextBillingDate: null, error: "This subscription is already canceled" };
    if (current.metadata?.retention_offer_used || row.retention_offer_used_at) {
      return { ok: false, nextBillingDate: null, error: "offer_used" };
    }

    const trialEnd = Math.floor(Date.now() / 1000) + OFFER_DAYS * 86_400;
    const updated = await stripe.subscriptions.update(row.stripe_subscription_id, {
      trial_end: trialEnd, // free until then; next invoice (and new billing anchor) = exactly 30 days out
      proration_behavior: "none", // no credit/debit for the unused part of the current period
      cancel_at_period_end: false, // they are staying
      metadata: { ...(current.metadata ?? {}), retention_offer_used: "1", retention_offer_at: new Date().toISOString() },
    });

    const nextBillingDate = iso(updated.trial_end) ?? iso(trialEnd);
    await writeRow(
      admin,
      user.id,
      { status: updated.status, current_period_end: periodEndOf(updated) ?? nextBillingDate, trial_ends_at: nextBillingDate, trial_end: nextBillingDate, cancel_at_period_end: false, updated_at: new Date().toISOString() },
      { retention_offer_used_at: new Date().toISOString() },
    );
    return { ok: true, nextBillingDate, error: null };
  } catch (e) {
    return { ok: false, nextBillingDate: null, error: e instanceof Error ? e.message : "Could not apply the offer" };
  }
}

export async function cancelSubscription(
  feedbackRaw: string,
): Promise<{ ok: boolean; accessUntil: string | null; feedbackEmailed: boolean; error: string | null }> {
  try {
    const user = await me();
    if (!user) return { ok: false, accessUntil: null, feedbackEmailed: false, error: "Not signed in" };
    const admin = createAdminClient();
    const row = await loadRow(admin, user.id);
    if (!row?.stripe_subscription_id) return { ok: false, accessUntil: null, feedbackEmailed: false, error: "No active subscription found" };

    const feedback = String(feedbackRaw ?? "").replace(/\s+/g, " ").trim().slice(0, 2000);
    const stripe = getStripe();
    const current = await stripe.subscriptions.retrieve(row.stripe_subscription_id);
    let sub = current;
    if (current.status !== "canceled") {
      sub = await stripe.subscriptions.update(row.stripe_subscription_id, {
        cancel_at_period_end: true,
        cancellation_details: { feedback: "other", ...(feedback ? { comment: feedback } : {}) },
        metadata: { ...(current.metadata ?? {}), cancel_requested_at: new Date().toISOString() },
      });
    }
    const accessUntil = periodEndOf(sub) ?? row.trial_ends_at ?? row.current_period_end ?? null;

    await writeRow(
      admin,
      user.id,
      { status: sub.status, current_period_end: accessUntil, cancel_at_period_end: true, updated_at: new Date().toISOString() },
      { canceled_at: new Date().toISOString(), ...(feedback ? { cancel_feedback: feedback } : {}) },
    );

    // Who is leaving — for Tim's inbox (best effort; the same text already sits on the row).
    let who = "";
    let company = "";
    let replyTo: string | null = user.email ?? null;
    try {
      const [{ data: p }, { data: cp }] = await Promise.all([
        admin.from("profiles").select("full_name, email, phone").eq("id", user.id).maybeSingle(),
        admin.from("contractor_profiles").select("business_name").eq("id", user.id).maybeSingle(),
      ]);
      const pr = (p ?? {}) as { full_name?: string | null; email?: string | null; phone?: string | null };
      const co = (cp ?? {}) as { business_name?: string | null };
      company = String(co.business_name || "").trim();
      replyTo = pr.email || user.email || null;
      who = [
        `Name: ${pr.full_name || "—"}`,
        `Company: ${company || "—"}`,
        `Email: ${pr.email || user.email || "—"}`,
        `Phone: ${pr.phone || "—"}`,
      ].join("\n");
    } catch {
      who = `User: ${user.id}`;
    }
    const until = accessUntil ? new Date(accessUntil).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "end of period";
    const offer = current.metadata?.retention_offer_used ? "30-day offer: accepted earlier, canceled anyway" : "30-day offer: declined";
    const mail = await sendEmail({
      to: FEEDBACK_TO,
      subject: `HomeBids cancellation — ${company || "contractor"}`,
      text: `A contractor canceled their HomeBids plan.\n\n${who}\nPlan status: ${sub.status} · access until ${until}\n${offer}\n\nWhat could we have done better?\n${feedback || "(no feedback left)"}\n\nStripe subscription: ${row.stripe_subscription_id}`,
      replyTo,
    });
    if (!mail.sent) console.warn("[subscription] feedback email not sent:", mail.error);

    return { ok: true, accessUntil, feedbackEmailed: mail.sent, error: null };
  } catch (e) {
    return { ok: false, accessUntil: null, feedbackEmailed: false, error: e instanceof Error ? e.message : "Could not cancel" };
  }
}

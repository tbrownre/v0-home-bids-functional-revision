import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * SUBLINK (Oct 8 — Dillon / Pollard Palms had a paid plan but no "Cancel subscription" link, no plan banner):
 *
 * Phone-first Pros (A2 PHONEUNLOCK checkout) get a `subscriptions` row keyed by PHONE with user_id = NULL. When they
 * later create an account on the website, nothing attached that row to the account, so every lookup keyed on user_id
 * (cancel flow, dashboard plan banner, billing portal, bid limits) saw "no subscription".
 *
 * This is the one place the app resolves "the signed-in contractor's subscription row":
 *   1. newest row with user_id = the user                                   (normal case)
 *   2. else the orphan row (user_id NULL) whose phone matches the contractor's profile phone on the last 10 digits
 *      — and, when that match is unambiguous, the row is linked to the account right there (self-heal), so the
 *      Stripe webhook's user_id-keyed updates reach it from now on.
 *
 * Always call with the service-role (admin) client: orphan rows are not visible under RLS.
 */

export const SUBSCRIPTION_LOOKUP_COLUMNS =
  "id, user_id, status, plan_id, phone, stripe_customer_id, stripe_subscription_id, current_period_end, trial_ends_at, created_at";

export interface SubscriptionRow {
  id?: string | null;
  user_id?: string | null;
  status?: string | null;
  plan_id?: string | null;
  phone?: string | null;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  current_period_end?: string | null;
  trial_ends_at?: string | null;
  created_at?: string | null;
  /** Set when the row was found by phone and attached to the account in this call. */
  linked_now?: boolean;
}

/** Last 10 digits of a phone number, or "" when there are not enough digits to match on. */
export function phoneDigits10(raw: string | null | undefined): string {
  const d = String(raw ?? "").replace(/\D/g, "");
  return d.length >= 10 ? d.slice(-10) : "";
}

/**
 * Find the subscription row that belongs to `userId` — by user_id first, then by the contractor's phone.
 * `select` defaults to the columns every caller needs; pass extra columns when you need them.
 */
export async function findSubscriptionForUser(
  admin: SupabaseClient,
  userId: string,
  select: string = SUBSCRIPTION_LOOKUP_COLUMNS,
): Promise<SubscriptionRow | null> {
  // 1) the normal case
  const { data: own } = await admin
    .from("subscriptions")
    .select(select)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (own) return own as unknown as SubscriptionRow;

  // 2) phone-keyed orphan row → match on the profile phone
  const { data: profile } = await admin.from("profiles").select("phone, user_type").eq("id", userId).maybeSingle();
  const d10 = phoneDigits10((profile as { phone?: string | null } | null)?.phone);
  if (!d10) return null;

  const { data: orphans } = await admin
    .from("subscriptions")
    .select(select)
    .is("user_id", null)
    .like("phone", `%${d10}`)
    .order("created_at", { ascending: false })
    .limit(5);
  const matches = ((orphans ?? []) as unknown as SubscriptionRow[]).filter((r) => phoneDigits10(r.phone) === d10);
  if (matches.length === 0) return null;

  // Prefer a live plan over a dead one when the phone has more than one orphan row.
  const live = matches.find((r) => ["active", "trialing", "past_due"].includes(String(r.status)));
  const row = live ?? matches[0];

  // Self-heal: attach the row to the account only when the phone is unambiguous — exactly one contractor profile
  // carries it. Never guess between two accounts.
  try {
    const { data: sameDigits } = await admin
      .from("profiles")
      .select("id, phone")
      .eq("user_type", "contractor")
      .like("phone", `%${d10}`)
      .limit(5);
    const owners = ((sameDigits ?? []) as { id: string; phone?: string | null }[]).filter((p) => phoneDigits10(p.phone) === d10);
    if (owners.length === 1 && owners[0].id === userId && row.id) {
      const { error } = await admin
        .from("subscriptions")
        .update({ user_id: userId, updated_at: new Date().toISOString() })
        .eq("id", row.id)
        .is("user_id", null);
      if (!error) {
        row.user_id = userId;
        row.linked_now = true;
      } else {
        console.warn("[my-subscription] could not link phone-keyed row:", error.message);
      }
    }
  } catch (e) {
    console.warn("[my-subscription] link step skipped:", e instanceof Error ? e.message : e);
  }
  return row;
}

/**
 * Attach the phone-keyed (user_id NULL) subscription row to a freshly created account. Used right after sign-up.
 * Exact match on the last 10 digits; one row only (live plan first, else newest) because user_id is unique per
 * account; silent when there is nothing to attach.
 */
export async function linkPhoneSubscriptionsToUser(admin: SupabaseClient, userId: string, phone: string | null | undefined): Promise<number> {
  const d10 = phoneDigits10(phone);
  if (!d10) return 0;
  try {
    const { data: orphans } = await admin
      .from("subscriptions")
      .select("id, phone, status, created_at")
      .is("user_id", null)
      .like("phone", `%${d10}`)
      .order("created_at", { ascending: false })
      .limit(10);
    const rows = ((orphans ?? []) as { id: string; phone?: string | null; status?: string | null }[]).filter((r) => phoneDigits10(r.phone) === d10);
    if (!rows.length) return 0;
    const pick = rows.find((r) => ["active", "trialing", "past_due"].includes(String(r.status))) ?? rows[0];
    const { error } = await admin
      .from("subscriptions")
      .update({ user_id: userId, updated_at: new Date().toISOString() })
      .eq("id", pick.id)
      .is("user_id", null);
    if (error) {
      console.warn("[my-subscription] signup link skipped:", error.message);
      return 0;
    }
    return 1;
  } catch (e) {
    console.warn("[my-subscription] signup link failed:", e instanceof Error ? e.message : e);
    return 0;
  }
}

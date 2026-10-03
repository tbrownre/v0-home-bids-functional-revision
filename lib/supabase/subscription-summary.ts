"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";

/**
 * TRIAL14 (Tim, Oct 4): what the signed-in contractor's plan looks like right now, for the
 * dashboard banner ("Free trial · 9 days left"). Reads the same `subscriptions` row the Stripe
 * webhook writes; nothing here changes billing.
 */
export interface SubscriptionSummary {
  status: string | null; // 'trialing' | 'active' | 'past_due' | 'canceled' | … | null (no subscription)
  periodEnd: string | null; // ISO — during a trial this is the trial end
  isAdmin: boolean;
}

export async function getMySubscriptionSummary(): Promise<SubscriptionSummary> {
  const empty: SubscriptionSummary = { status: null, periodEnd: null, isAdmin: false };
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return empty;

    const admin = createAdminClient();
    const [{ data: sub }, { data: profile }] = await Promise.all([
      admin
        .from("subscriptions")
        .select("status, current_period_end, trial_ends_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      admin.from("contractor_profiles").select("is_admin").eq("id", user.id).maybeSingle(),
    ]);

    const row = (sub ?? null) as { status?: string | null; current_period_end?: string | null; trial_ends_at?: string | null } | null;
    return {
      status: row?.status ?? null,
      periodEnd: row?.trial_ends_at ?? row?.current_period_end ?? null,
      isAdmin: Boolean((profile as { is_admin?: boolean } | null)?.is_admin),
    };
  } catch {
    return empty;
  }
}

/**
 * Stripe Customer Portal link for the signed-in contractor (cancel / update card). Needs the
 * portal saved once in Stripe → Settings → Billing → Customer portal; until then Stripe returns
 * an error and the banner falls back to "text us".
 */
export async function getBillingPortalUrl(returnPath = "/contractors/dashboard"): Promise<{ url: string | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { url: null, error: "Not signed in" };

    const admin = createAdminClient();
    const { data } = await admin
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const customer = (data as { stripe_customer_id?: string | null } | null)?.stripe_customer_id;
    if (!customer) return { url: null, error: "No billing account yet" };

    const base = process.env.NEXT_PUBLIC_SITE_URL || "https://www.homebids.ai";
    const session = await getStripe().billingPortal.sessions.create({
      customer,
      return_url: `${base}${returnPath}`,
    });
    return { url: session.url, error: null };
  } catch (e) {
    return { url: null, error: e instanceof Error ? e.message : "Billing portal unavailable" };
  }
}

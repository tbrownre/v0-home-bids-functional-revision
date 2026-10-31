"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getMockUser, syncMirrorFromSupabase } from "@/lib/mock-auth";
import { getMySubscriptionSummary } from "@/lib/supabase/subscription-summary";

/**
 * LOGINSTATE (Tim, Oct 31: "It's also not recognizing that we already have an acct and allowing the user to create an
 * acct while still logged in to paid contractor acct ... Need the login behavior to be consistent").
 *
 * One rule for every "Start My Free 14-Day Trial" button on the marketing pages (/contractors, /how-it-works):
 *   signed out / homeowner  -> the contractor signup, then the 14-day trial checkout        (unchanged)
 *   signed-in contractor     -> straight to the trial checkout, no second account            (/subscribe?type=contractor&trial=1)
 *   contractor already on a plan (trialing / active / past_due, or admin) -> their dashboard  ("Go to your dashboard")
 * Server-rendered markup is the signed-out version, so nothing jumps for visitors; the swap happens after the session loads.
 */

export const TRIAL_SIGNUP_HREF = "/contractors/signup?plan=trial";
export const TRIAL_CHECKOUT_HREF = "/subscribe?type=contractor&trial=1";
export const DASHBOARD_HREF = "/contractors/dashboard";

export type TrialState = "unknown" | "guest" | "homeowner" | "contractor" | "pro";

export const SUBSCRIBED_STATUSES = new Set(["trialing", "active", "past_due"]);

let cached: TrialState | null = null;
let cachedAt = 0;
let inflight: Promise<TrialState> | null = null;
const CACHE_MS = 60_000; // one lookup per minute per tab - a fresh subscription shows up on the next page within a minute

async function resolve(): Promise<TrialState> {
  try {
    let user = getMockUser();
    if (!user) user = await syncMirrorFromSupabase();
    if (!user) return "guest";
    if (user.role !== "contractor" && user.role !== "admin") return "homeowner";
    const s = await getMySubscriptionSummary();
    if (s.isAdmin || (s.status && SUBSCRIBED_STATUSES.has(s.status))) return "pro";
    return "contractor";
  } catch {
    return "guest";
  }
}

/** Resolved once and shared by every CTA on the page (cached briefly across client-side navigations). */
export function useTrialState(): TrialState {
  const fresh = cached && Date.now() - cachedAt < CACHE_MS ? cached : null;
  const [state, setState] = useState<TrialState>(fresh ?? "unknown");
  useEffect(() => {
    if (cached && Date.now() - cachedAt < CACHE_MS) { setState(cached); return; }
    let alive = true;
    if (!inflight) {
      inflight = resolve().then((s) => { cached = s; cachedAt = Date.now(); inflight = null; return s; });
    }
    inflight.then((s) => { if (alive) setState(s); });
    return () => { alive = false; };
  }, []);
  return state;
}

export function trialTarget(state: TrialState, label: string, proLabel = "Go to your dashboard →") {
  if (state === "pro") return { href: DASHBOARD_HREF, label: proLabel };
  if (state === "contractor") return { href: TRIAL_CHECKOUT_HREF, label };
  return { href: TRIAL_SIGNUP_HREF, label };
}

export function TrialCta({
  label,
  proLabel,
  className,
  ...rest
}: {
  label: string;
  proLabel?: string;
  className?: string;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "children">) {
  const state = useTrialState();
  const t = trialTarget(state, label, proLabel);
  return (
    <Link className={className} href={t.href} data-hb-trial={state} {...rest}>
      {t.label}
    </Link>
  );
}

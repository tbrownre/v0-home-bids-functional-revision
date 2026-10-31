"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { SubscriptionCheckout } from "@/components/subscription-checkout";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getMockUser, syncMirrorFromSupabase } from "@/lib/mock-auth";
import { getContractorPlans, getHomeownerPlan, TRIAL_DAYS, type SubscriptionPlan } from "@/lib/products";
import { getMySubscriptionSummary, getBillingPortalUrl, type SubscriptionSummary } from "@/lib/supabase/subscription-summary";
import { SUBSCRIBED_STATUSES, TRIAL_SIGNUP_HREF, DASHBOARD_HREF } from "@/components/trial-cta";
import { createClient } from "@/lib/supabase/client";
import h from "../how-it-works/hiw.module.css";
import l from "../contractors/landing.module.css";

/**
 * /subscribe — pricing + checkout.
 *
 * Oct 31, 2026 (Tim: "Forgot this page too" — after the new /contractors and /how-it-works pages): the page now wears
 * the same design. Hero + "I'M A" toggle + trust row are the How-It-Works mock; the plan card is the pricing card from
 * the contractors mock (HOMEBIDS CONTRACTOR · $99 /month · 14-day free trial · checklist · Start My Free 14-Day Trial →).
 * The homeowner side is the same card, free.
 *
 * LOGINSTATE (Tim, same day: "It's also not recognizing that we already have an acct and allowing the user to create an
 * acct while still logged in to paid contractor acct ... Need the login behavior to be consistent"):
 *   - a signed-in contractor already on a plan (trialing / active / past_due, or admin) sees "You're on HomeBids Pro"
 *     with Go to your dashboard + Manage billing — the trial checkout never opens for them, even from ?trial=1 links;
 *   - a signed-in contractor without a plan goes straight into the 14-day trial checkout (no second account);
 *   - signed out -> the contractor signup, then the trial checkout (unchanged).
 * Checkout wiring (SubscriptionCheckout, ?plan / ?userId / ?trial=1 handoff from signup) is unchanged.
 */

type UserTypeFilter = "homeowner" | "contractor";

const CONTRACTOR_CHECKLIST = [
  "Lead Radar alerts (up to 25 groups)",
  "Your iMessage/SMS contractor webpage",
  "Unlimited AI Bid Builder",
  "Interactive bids and customer follow-up",
  "No bid fees · Cancel anytime",
];
const HOMEOWNER_CHECKLIST = [
  "Just iMessage or SMS — no app, no account",
  "Ava organizes your project details",
  "Contact info stays private until you approve a bid",
  "No obligation to hire",
];
const HOMEOWNER_SMS = "sms:+14043952879?body=Hi%20HomeBids%2C%20help%20me%20create%20a%20new%20job!";

export default function SubscribePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [userType, setUserType] = useState<UserTypeFilter>("homeowner");
  const [error, setError] = useState<string | null>(null);
  const [resolvedUserId, setResolvedUserId] = useState<string | undefined>(undefined);
  // TRIAL14 (Tim, Oct 4): ?trial=1 (set by the signup handoff) opens the 14-day free trial checkout.
  const [trial, setTrial] = useState(false);
  // LOGINSTATE: who is looking at this page
  const [signedInContractor, setSignedInContractor] = useState(false);
  const [sub, setSub] = useState<SubscriptionSummary | null>(null);
  const [checked, setChecked] = useState(false); // session + plan lookup finished
  const [portalBusy, setPortalBusy] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  const alreadyPro = !!sub && (sub.isAdmin || (!!sub.status && SUBSCRIBED_STATUSES.has(sub.status)));

  useEffect(() => {
    let cancelled = false;
    const setupSubscribePage = async () => {
      const type = searchParams.get("type");
      if (type === "contractor") setUserType("contractor");
      else if (type === "homeowner") setUserType("homeowner");
      setTrial(searchParams.get("trial") === "1" && type === "contractor");

      // Who is here? (same session signal as the header)
      let user = getMockUser();
      if (!user) user = await syncMirrorFromSupabase();
      if (cancelled) return;
      const isContractor = !!user && (user.role === "contractor" || user.role === "admin");
      setSignedInContractor(isContractor);
      let summary: SubscriptionSummary | null = null;
      if (isContractor) {
        if (!type) setUserType("contractor"); // a contractor landing here without ?type is here for the contractor plan
        try {
          summary = await getMySubscriptionSummary();
        } catch {
          summary = null;
        }
        if (cancelled) return;
        setSub(summary);
      }
      const onPlan = !!summary && (summary.isAdmin || (!!summary.status && SUBSCRIBED_STATUSES.has(summary.status)));

      // If a plan ID is provided, auto-select it and show checkout (never for an account that already pays)
      const planId = searchParams.get("plan");
      if (planId) {
        const plan = [getHomeownerPlan(), ...getContractorPlans()].find((p) => p.id === planId);
        if (plan) {
          if (!(onPlan && plan.userType === "contractor")) {
            setSelectedPlan(plan);
            setShowCheckout(true);
          }
        } else {
          setError("Please select a contractor plan to continue.");
        }
      }

      // Get userId from params, or fall back to signed-in user's ID as safety net
      const handoffUserId = searchParams.get("userId") ?? undefined; // set by the contractor signup handoff
      let userId = handoffUserId;
      if (!userId && type === "contractor") {
        const supabase = createClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser?.id) {
          userId = authUser.id;
          console.warn("[subscribe] No userId in params but user is signed in, using user ID for checkout");
        }
      }
      if (cancelled) return;
      setResolvedUserId(userId);

      // Coming from the contractor signup (?userId) or a trial button (?trial=1): auto-select the contractor plan and
      // open the checkout - never for an account already on a plan (LOGINSTATE). A bare ?type=contractor just shows
      // the card; the trial checkout opens when they tap Start My Free 14-Day Trial (no surprise "billed immediately").
      const wantsCheckout = !!handoffUserId || searchParams.get("trial") === "1";
      if (userId && wantsCheckout && type === "contractor" && !planId && !onPlan) {
        const plan = getContractorPlans()[0];
        if (plan) {
          setSelectedPlan(plan);
          setShowCheckout(true);
        }
      }
      setChecked(true);
    };

    setupSubscribePage();
    return () => { cancelled = true; };
  }, [searchParams]);

  const contractorPlan = getContractorPlans()[0];

  const startHomeowner = () => {
    // Homeowners never pay — starting a project happens over text
    window.location.href = HOMEOWNER_SMS;
  };

  const startContractor = () => {
    if (!contractorPlan) return;
    if (alreadyPro) {
      router.push(DASHBOARD_HREF);
      return;
    }
    // PAYWALLFIX (Tim, Oct 6): a signed-out contractor must land in the contractor signup →
    // 14-day-trial checkout flow, never the generic login modal.
    if (!getMockUser()) {
      window.location.href = TRIAL_SIGNUP_HREF;
      return;
    }
    // TRIAL14: the button says 14 days free, so the checkout is the trial checkout
    setTrial(true);
    setSelectedPlan(contractorPlan);
    setShowCheckout(true);
  };

  const handleSuccess = async () => {
    const isContractor = selectedPlan?.userType === "contractor";
    setShowCheckout(false);
    if (isContractor) {
      router.push(DASHBOARD_HREF); // Payment confirmed — send contractor to their dashboard
    } else {
      window.location.href = HOMEOWNER_SMS;
    }
  };

  const openPortal = async () => {
    setPortalBusy(true);
    setPortalError(null);
    const win = window.open("", "_blank"); // open synchronously so Safari/iOS doesn't block it
    try {
      const { url, error: portalErr } = await getBillingPortalUrl("/subscribe?type=contractor");
      if (url) {
        if (win) win.location.href = url;
        else window.location.href = url;
      } else {
        win?.close();
        setPortalError(portalErr || "Billing portal unavailable");
      }
    } catch (e) {
      win?.close();
      setPortalError(e instanceof Error ? e.message : "Billing portal unavailable");
    } finally {
      setPortalBusy(false);
    }
  };

  const homeowner = userType === "homeowner";
  const trialEnds = sub?.status === "trialing" && sub.periodEnd ? new Date(sub.periodEnd) : null;
  const trialEndsLabel = trialEnds && !Number.isNaN(trialEnds.getTime())
    ? trialEnds.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : null;

  return (
    <div className={`min-h-screen bg-white ${h.page} ${homeowner ? h.homeowner : ""}`} data-hb-subscribe={homeowner ? "homeowner" : alreadyPro ? "pro" : signedInContractor ? "contractor" : "guest"}>
      <Header />

      {/* HERO — the How-It-Works mock's hero with the I'M A toggle */}
      <section className={h.hero}>
        <span className={h.eyebrow}>{homeowner ? "ALWAYS FREE FOR HOMEOWNERS" : "SIMPLE, TRANSPARENT PRICING"}</span>
        <h1>
          {homeowner ? (
            <>
              Need work done?
              <br />
              <span className={h.blue}>Just text HomeBids.</span>
            </>
          ) : (
            <>
              Everything you need.
              <br />
              <span className={h.blue}>One simple price.</span>
            </>
          )}
        </h1>
        <p>
          {homeowner
            ? "Text HomeBids. Ava organizes your project and helps you reach matching local contractors."
            : "Lead Radar, your own text-first contractor page, unlimited bids and a 24/7 assistant. No extra estimating software to learn."}
        </p>
        <div className={h.personaCaption}>I&apos;M A</div>
        <div className={h.persona} role="group" aria-label="Choose how you use HomeBids">
          <button type="button" aria-pressed={homeowner} onClick={() => setUserType("homeowner")}>
            ⌂ &nbsp; Homeowner · Free
          </button>
          <button type="button" aria-pressed={!homeowner} onClick={() => setUserType("contractor")}>
            ⚒ &nbsp; Contractor · $99/mo
          </button>
        </div>
        <div className={`${h.trust} ${h.contractorOnly}`}>
          <span><i>✓</i> 14 days free</span>
          <span><i>✓</i> Then $99/month</span>
          <span><i>✓</i> Cancel anytime</span>
        </div>
        <div className={`${h.trust} ${h.homeownerOnly}`}>
          <span><i>✓</i> Always free for homeowners</span>
          <span><i>✓</i> No app or account</span>
        </div>
      </section>

      <main className={l.page} style={{ background: "linear-gradient(120deg, #eff6ff, #fff)" }}>
        <div className={h.wrap} style={{ padding: "48px 34px 64px" }}>
          <div style={{ maxWidth: 440, margin: "0 auto" }}>
            {homeowner ? (
              /* HOMEOWNER — same card, free */
              <div className={l.priceCard} data-hb-plan="homeowner">
                <div style={{ fontSize: 12, letterSpacing: ".1em", fontWeight: 800, color: "#687583" }}>HOMEBIDS HOMEOWNER</div>
                <div style={{ margin: "10px 0" }}>
                  <span className={l.dollar}>Free</span>
                  <span style={{ color: "#6a7381" }}> always</span>
                </div>
                <span className={l.eyebrow}>No credit card · No account</span>
                <ul className={l.checklist}>
                  {HOMEOWNER_CHECKLIST.map((item) => <li key={item}>{item}</li>)}
                </ul>
                <button type="button" className={`${l.btn} ${l.full}`} onClick={startHomeowner}>
                  Text Your Project →
                </button>
                <p className={l.micro}>No app · No account · Free for homeowners</p>
              </div>
            ) : (
              /* CONTRACTOR — the pricing card from the contractors mock */
              <div className={l.priceCard} data-hb-plan={alreadyPro ? "pro" : "contractor"}>
                <div style={{ fontSize: 12, letterSpacing: ".1em", fontWeight: 800, color: "#687583" }}>HOMEBIDS CONTRACTOR</div>
                <div style={{ margin: "10px 0" }}>
                  <span className={l.dollar}>$99</span>
                  <span style={{ color: "#6a7381" }}> /month</span>
                </div>
                <span className={l.eyebrow}>
                  {alreadyPro
                    ? trialEndsLabel
                      ? `✓ Your free trial · $99/month from ${trialEndsLabel}`
                      : "✓ Your plan is active"
                    : `${TRIAL_DAYS}-day free trial`}
                </span>
                <ul className={l.checklist}>
                  {CONTRACTOR_CHECKLIST.map((item) => <li key={item}>{item}</li>)}
                </ul>
                {alreadyPro ? (
                  <>
                    <Link className={`${l.btn} ${l.full}`} href={DASHBOARD_HREF}>Go to your dashboard →</Link>
                    <p className={l.micro}>
                      You&apos;re all set — this account already has HomeBids Pro.{" "}
                      <button type="button" onClick={openPortal} disabled={portalBusy} style={{ color: "#0675ff", fontWeight: 700, background: "none", border: 0, padding: 0, cursor: "pointer" }}>
                        {portalBusy ? "Opening billing…" : "Manage billing"}
                      </button>
                    </p>
                    {portalError && <p className={l.micro} style={{ color: "#b45309" }}>{portalError}</p>}
                  </>
                ) : (
                  <>
                    <button type="button" className={`${l.btn} ${l.full}`} onClick={startContractor} disabled={!checked && signedInContractor}>
                      Start My Free 14-Day Trial →
                    </button>
                    <p className={l.micro}>$99/month after your {TRIAL_DAYS}-day trial. Cancel anytime.</p>
                  </>
                )}
              </div>
            )}

            <p className={l.micro} style={{ textAlign: "center", marginTop: 28 }}>
              HomeBids does not process project payments between homeowners and contractors. Billing is for platform access only.
            </p>
          </div>
        </div>
      </main>

      {/* Error */}
      {error && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-w-md rounded-lg border border-destructive/50 bg-destructive/10 p-6">
            <h3 className="mb-2 font-semibold text-destructive">Error</h3>
            <p className="mb-4 text-sm text-muted-foreground">{error}</p>
            <Button onClick={() => setError(null)} className="w-full">Dismiss</Button>
          </div>
        </div>
      )}

      {/* Checkout Modal (unchanged) */}
      <Dialog open={showCheckout} onOpenChange={(open) => { if (!open) setShowCheckout(false); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto p-0 sm:max-w-xl">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>
              {trial
                ? `HomeBids Pro — ${TRIAL_DAYS}-day free trial`
                : `${selectedPlan?.name} Plan — $${((selectedPlan?.priceInCents ?? 0) / 100).toFixed(2)}/mo`}
            </DialogTitle>
            <DialogDescription>
              {trial
                ? `$0 today. $${((selectedPlan?.priceInCents ?? 0) / 100).toFixed(0)}/month after ${TRIAL_DAYS} days — cancel anytime before your trial ends.`
                : selectedPlan?.hasTrial === false
                  ? "Billed immediately. Cancel anytime."
                  : "Cancel anytime."}
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-6">
            {selectedPlan && (
              <SubscriptionCheckout
                planId={selectedPlan.id}
                userId={resolvedUserId}
                trial={trial}
                onSuccess={handleSuccess}
                onCancel={() => setShowCheckout(false)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { acceptRetentionOffer, cancelSubscription, getCancelContext, type CancelContext } from "@/app/actions/subscription";

/**
 * CANCELFLOW (Tim, Oct 7 — Trello "Add Subscription Cancellation Flow + 30-Day Save Offer").
 * Sits below the Security card on the Account page as one low-emphasis link. Tim's copy, verbatim:
 *   1 confirm   → "Keep my plan" / "Continue cancellation"
 *   2 offer     → one-time 30 days free (skipped when already used) → "Give me 30 days free" / "No thanks, cancel"
 *   3 final     → sorry-to-see-you-go + optional "What could we have done better?" → "Send feedback & finish cancellation"
 *   4 done      → "Your subscription has been canceled. Thank you for trying HomeBids."
 * Renders nothing when there is no Stripe subscription to cancel; shows the end date when a cancel is already scheduled.
 */

type Step = "confirm" | "offer" | "offer_done" | "final" | "done";

/** The three server actions, injectable so the flow can be exercised without Stripe (tests / demos). */
export interface CancelApi {
  getCancelContext: typeof getCancelContext;
  acceptRetentionOffer: typeof acceptRetentionOffer;
  cancelSubscription: typeof cancelSubscription;
}
const LIVE_API: CancelApi = { getCancelContext, acceptRetentionOffer, cancelSubscription };

const longDate = (iso: string | null) => {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
};

export function CancelSubscription({ api = LIVE_API }: { api?: CancelApi } = {}) {
  const [ctx, setCtx] = useState<CancelContext | null>(null);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("confirm");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [nextBilling, setNextBilling] = useState<string | null>(null);
  const [accessUntil, setAccessUntil] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (typeof window !== "undefined" && window.location.hostname.includes("vusercontent.net")) return;
        const c = await api.getCancelContext();
        if (!cancelled) setCtx(c);
      } catch {
        /* the link is optional — never break the account page */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ctx || !ctx.hasSubscription) return null;

  // Once a cancel is scheduled the link gives way to the end date - but only after the "done" modal was closed,
  // so the confirmation the contractor is reading is never pulled out from under them.
  if (ctx.cancelScheduled && !open) {
    const end = longDate(ctx.periodEnd);
    return (
      <p className="mt-4 px-1 text-xs text-muted-foreground" data-hb-cancel-scheduled>
        Your plan is set to end{end ? ` on ${end}` : " at the end of this billing period"}. You keep full access until then.
      </p>
    );
  }

  const start = () => {
    setStep("confirm");
    setError(null);
    setFeedback("");
    setOpen(true);
  };

  const continueCancellation = () => {
    setError(null);
    setStep(ctx.offerEligible ? "offer" : "final");
  };

  const takeOffer = async () => {
    setBusy(true);
    setError(null);
    const r = await api.acceptRetentionOffer();
    setBusy(false);
    if (r.ok) {
      setNextBilling(r.nextBillingDate);
      setStep("offer_done");
      setCtx({ ...ctx, offerEligible: false, periodEnd: r.nextBillingDate ?? ctx.periodEnd, status: "trialing" });
    } else if (r.error === "offer_used") {
      // somebody already took it on another device — straight to the final step, cancellation still available
      setCtx({ ...ctx, offerEligible: false });
      setStep("final");
    } else {
      setError(r.error || "Something went wrong. Please try again.");
    }
  };

  const finish = async () => {
    setBusy(true);
    setError(null);
    const r = await api.cancelSubscription(feedback);
    setBusy(false);
    if (r.ok) {
      setAccessUntil(r.accessUntil);
      setStep("done");
      setCtx({ ...ctx, cancelScheduled: true, periodEnd: r.accessUntil ?? ctx.periodEnd });
    } else {
      setError(r.error || "Something went wrong. Please try again.");
    }
  };

  const close = () => setOpen(false);

  return (
    <>
      <div className="mt-4 px-1">
        <button
          type="button"
          onClick={start}
          className="text-xs text-muted-foreground underline-offset-2 hover:underline"
          data-hb-cancel-link
        >
          Cancel subscription
        </button>
      </div>

      <Dialog open={open} onOpenChange={(o) => (busy ? null : setOpen(o))}>
        <DialogContent className="max-w-md rounded-2xl" data-hb-cancel-step={step}>
          {step === "confirm" && (
            <>
              <DialogHeader>
                <DialogTitle>Cancel your HomeBids plan?</DialogTitle>
                <DialogDescription>
                  You&rsquo;ll keep access until the end of your current billing period. Are you sure you want to cancel?
                </DialogDescription>
              </DialogHeader>
              <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button variant="ghost" className="rounded-xl font-semibold" onClick={continueCancellation}>
                  Continue cancellation
                </Button>
                <Button className="rounded-xl font-semibold" onClick={close}>
                  Keep my plan
                </Button>
              </div>
            </>
          )}

          {step === "offer" && (
            <>
              <DialogHeader>
                <DialogTitle>Before you go &mdash; stay with us free for 30 days.</DialogTitle>
                <DialogDescription>
                  We&rsquo;d love another chance to earn your business. Keep your full HomeBids plan free for the next 30 days.
                </DialogDescription>
              </DialogHeader>
              {error && <p className="text-sm font-medium text-destructive">{error}</p>}
              <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button variant="ghost" className="rounded-xl font-semibold" onClick={() => { setError(null); setStep("final"); }} disabled={busy}>
                  No thanks, cancel
                </Button>
                <Button className="rounded-xl font-semibold" onClick={takeOffer} disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {busy ? "Applying…" : "Give me 30 days free"}
                </Button>
              </div>
            </>
          )}

          {step === "offer_done" && (
            <>
              <DialogHeader>
                <DialogTitle>You&rsquo;re all set 🎉</DialogTitle>
                <DialogDescription>
                  {longDate(nextBilling)
                    ? `Your next billing date is ${longDate(nextBilling)}.`
                    : "Your next 30 days are on us — nothing will be charged until then."}
                </DialogDescription>
              </DialogHeader>
              <div className="mt-2 flex justify-end">
                <Button className="rounded-xl font-semibold" onClick={close}>
                  Back to my account
                </Button>
              </div>
            </>
          )}

          {step === "final" && (
            <>
              <DialogHeader>
                <DialogTitle>We&rsquo;re sorry to see you go.</DialogTitle>
                <DialogDescription>
                  Thanks for giving HomeBids a shot. We&rsquo;re always trying to make the product better for contractors like you.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-1">
                <label htmlFor="hb-cancel-feedback" className="text-sm font-semibold text-foreground">
                  What could we have done better?
                </label>
                <Textarea
                  id="hb-cancel-feedback"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Anything you share helps us improve."
                  rows={4}
                  className="mt-2 resize-none rounded-xl"
                  maxLength={2000}
                />
              </div>
              {error && <p className="text-sm font-medium text-destructive">{error}</p>}
              <div className="mt-2 flex justify-end">
                <Button className="rounded-xl font-semibold" onClick={finish} disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {busy ? "Finishing…" : "Send feedback & finish cancellation"}
                </Button>
              </div>
            </>
          )}

          {step === "done" && (
            <>
              <DialogHeader>
                <DialogTitle>Your subscription has been canceled.</DialogTitle>
                <DialogDescription>
                  Thank you for trying HomeBids.
                  {longDate(accessUntil) ? ` You keep full access until ${longDate(accessUntil)}.` : ""}
                </DialogDescription>
              </DialogHeader>
              <div className="mt-2 flex justify-end">
                <Button variant="outline" className="rounded-xl font-semibold" onClick={close}>
                  Done
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

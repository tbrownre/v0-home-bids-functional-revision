"use client";

import { useEffect, useState } from "react";
import { Sparkles, ExternalLink, Loader2 } from "lucide-react";
import { getMySubscriptionSummary, getBillingPortalUrl, type SubscriptionSummary } from "@/lib/supabase/subscription-summary";
import { getContractorSmsLink } from "@/lib/sms-config";

/**
 * TRIAL14 (Tim, Oct 4): one quiet line at the top of the dashboard while a contractor is on the
 * 14-day free trial — days left, the date the $99 starts, and a way to manage/cancel.
 * Renders nothing for paid, free or unknown states, so today's dashboards are unchanged.
 */
export function TrialBanner() {
  const [sub, setSub] = useState<SubscriptionSummary | null>(null);
  const [portalBusy, setPortalBusy] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (typeof window !== "undefined" && window.location.hostname.includes("vusercontent.net")) return;
        const s = await getMySubscriptionSummary();
        if (!cancelled) setSub(s);
      } catch {
        /* banner is optional — never block the dashboard */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!sub || sub.status !== "trialing" || !sub.periodEnd) return null;
  const end = new Date(sub.periodEnd);
  if (Number.isNaN(end.getTime())) return null;
  const msLeft = end.getTime() - Date.now();
  if (msLeft <= 0) return null;
  const daysLeft = Math.max(1, Math.ceil(msLeft / 86_400_000));
  const endLabel = end.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const openPortal = async () => {
    setPortalBusy(true);
    setPortalError(null);
    const win = window.open("", "_blank"); // open synchronously so Safari/iOS doesn't block it
    try {
      const { url, error } = await getBillingPortalUrl("/contractors/dashboard");
      if (url) {
        if (win) win.location.href = url;
        else window.location.href = url;
      } else {
        win?.close();
        setPortalError(error || "Billing portal unavailable");
      }
    } catch (e) {
      win?.close();
      setPortalError(e instanceof Error ? e.message : "Billing portal unavailable");
    } finally {
      setPortalBusy(false);
    }
  };

  return (
    <div className="mb-6 flex min-w-0 flex-col gap-2 rounded-[18px] border border-primary/25 bg-primary/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-2.5">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p className="min-w-0 text-sm text-foreground">
          <span className="font-bold">
            Free trial · {daysLeft} day{daysLeft === 1 ? "" : "s"} left
          </span>
          <span className="text-muted-foreground"> — everything unlocked. $99/month starts {endLabel}; cancel anytime before then.</span>
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3 pl-6 sm:pl-0">
        <button
          type="button"
          onClick={openPortal}
          disabled={portalBusy}
          className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline disabled:opacity-60"
        >
          {portalBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ExternalLink className="h-3.5 w-3.5" />}
          Manage billing
        </button>
        {portalError && (
          <a href={getContractorSmsLink("I have a question about my HomeBids trial")} className="text-xs text-muted-foreground underline-offset-2 hover:underline">
            Can&apos;t open billing — text us
          </a>
        )}
      </div>
    </div>
  );
}

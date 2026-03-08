"use client";

/**
 * DemoControlPanel
 *
 * Floating bottom-right panel for driving demo scenarios.
 * Only renders when NEXT_PUBLIC_DEMO_MODE=true — completely tree-shaken
 * in production when the env var is absent.
 *
 * Actions push notifications into inbox-store and manipulate job-store
 * without any server calls.
 */

import { useState } from "react";
import { Zap, X, ChevronDown, ChevronUp, RotateCcw, Bell, MessageCircle, TrendingUp, CheckCircle2 } from "lucide-react";
import { isDemoMode } from "@/lib/demo/config";
import { addNotification } from "@/lib/inbox-store";
import { setJobStatus, selectBidAsWinner } from "@/lib/job-store";

const DEMO_JOB_ID = "demo-job-1";
const DEMO_BID_ID = "demo-bid-1";

const JOB_STATUS_CYCLE = [
  "receiving_bids",
  "contractor_selected",
  "in_progress",
  "completed",
] as const;

type StatusCycle = (typeof JOB_STATUS_CYCLE)[number];

export function DemoControlPanel() {
  const [open, setOpen] = useState(false);
  const [statusIndex, setStatusIndex] = useState(0);
  const [lastAction, setLastAction] = useState<string | null>(null);

  if (!isDemoMode()) return null;

  function flash(msg: string) {
    setLastAction(msg);
    setTimeout(() => setLastAction(null), 2500);
  }

  function handleAddBid() {
    addNotification(
      {
        id: `demo-cp-bid-${Date.now()}`,
        type: "bid_received",
        title: "New bid received",
        description: `Summit Roofing Pros submitted a bid of $3,950 on your active job.`,
        timestamp: new Date(),
        read: false,
        jobId: DEMO_JOB_ID,
        jobTitle: "Kitchen Sink Leak Repair",
        fromName: "Summit Roofing Pros",
        amount: 3950,
        href: "/?showJobs=true",
      },
      false,
    );
    flash("Bid notification sent");
  }

  function handleContractorMessage() {
    addNotification(
      {
        id: `demo-cp-msg-${Date.now()}`,
        type: "contractor_message",
        title: "New message from contractor",
        description:
          "Austin All-Pro Home Services sent a message: 'Just wanted to confirm — are you flexible on timing this week?'",
        timestamp: new Date(),
        read: false,
        jobId: DEMO_JOB_ID,
        jobTitle: "Kitchen Sink Leak Repair",
        fromName: "Austin All-Pro Home Services",
        href: "/?showJobs=true",
      },
      false,
    );
    flash("Message notification sent");
  }

  function handleAdvanceStatus() {
    const nextIndex = (statusIndex + 1) % JOB_STATUS_CYCLE.length;
    const nextStatus = JOB_STATUS_CYCLE[nextIndex] as StatusCycle;
    setJobStatus(DEMO_JOB_ID, nextStatus);
    setStatusIndex(nextIndex);
    flash(`Job status → ${nextStatus.replace(/_/g, " ")}`);
  }

  function handleSelectContractor() {
    selectBidAsWinner(DEMO_JOB_ID, DEMO_BID_ID);
    addNotification(
      {
        id: `demo-cp-accept-${Date.now()}`,
        type: "bid_accepted",
        title: "Contractor selected",
        description:
          "You selected Austin All-Pro Home Services for your job. They have been notified.",
        timestamp: new Date(),
        read: false,
        jobId: DEMO_JOB_ID,
        jobTitle: "Kitchen Sink Leak Repair",
        fromName: "Austin All-Pro Home Services",
        href: "/?showJobs=true",
      },
      false,
    );
    flash("Contractor selected");
  }

  function handleReset() {
    setStatusIndex(0);
    flash("Demo data reset");
    // Force a page reload so all stores reset to their initial seeded state
    window.location.reload();
  }

  const currentStatus = JOB_STATUS_CYCLE[statusIndex];

  return (
    <div
      className="fixed bottom-4 right-4 z-[200] flex flex-col items-end gap-2"
      aria-label="Demo control panel"
    >
      {/* Expanded panel */}
      {open && (
        <div className="w-64 rounded-2xl border border-border bg-background shadow-xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Demo Controls</span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Close demo panel"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-1.5 p-3">
            <button
              type="button"
              onClick={handleAddBid}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-muted"
            >
              <Bell className="h-4 w-4 shrink-0 text-blue-500" />
              <span>Add Bid Notification</span>
            </button>

            <button
              type="button"
              onClick={handleContractorMessage}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-muted"
            >
              <MessageCircle className="h-4 w-4 shrink-0 text-primary" />
              <span>Trigger Contractor Message</span>
            </button>

            <button
              type="button"
              onClick={handleAdvanceStatus}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-muted"
            >
              <TrendingUp className="h-4 w-4 shrink-0 text-amber-500" />
              <div>
                <span>Advance Job Status</span>
                <p className="text-[11px] text-muted-foreground">
                  Now: {currentStatus.replace(/_/g, " ")}
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={handleSelectContractor}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-muted"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              <span>Select Contractor</span>
            </button>

            <div className="my-1 border-t border-border" />

            <button
              type="button"
              onClick={handleReset}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <RotateCcw className="h-4 w-4 shrink-0" />
              <span>Reset Demo Data</span>
            </button>
          </div>

          {/* Last action feedback */}
          {lastAction && (
            <div className="border-t border-border px-4 py-2 text-center text-xs text-muted-foreground">
              {lastAction}
            </div>
          )}
        </div>
      )}

      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-11 items-center gap-2 rounded-full border border-border bg-background px-4 shadow-lg transition-shadow hover:shadow-xl"
        aria-expanded={open}
        aria-controls="demo-control-panel"
      >
        <Zap className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Demo</span>
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>
    </div>
  );
}

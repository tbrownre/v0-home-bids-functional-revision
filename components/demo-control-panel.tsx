"use client";

import { useState } from "react";
import { Settings2, ChevronDown, ChevronUp, RefreshCw, MessageSquare, DollarSign, CheckCircle, TrendingUp } from "lucide-react";
import { addDemoNotification, resetDemoNotifications } from "@/lib/inbox-store";
import { setJobStatus, selectBidAsWinner } from "@/lib/job-store";

const JOB_ID = "demo-job-1";
const BID_ID = "demo-bid-1";

const STATUS_CYCLE = ["receiving_bids", "contractor_selected", "in_progress", "completed"] as const;
type JobStatusOwner = (typeof STATUS_CYCLE)[number];

let statusIndex = 0;

/**
 * DemoControlPanel — floating bottom-right panel visible only when
 * NEXT_PUBLIC_DEMO_MODE=true. Lets a presenter trigger scripted events
 * live during a demo without touching Supabase or the database.
 */
export function DemoControlPanel() {
  const [open, setOpen] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);

  function flash(msg: string) {
    setLastAction(msg);
    setTimeout(() => setLastAction(null), 2500);
  }

  function handleAddBid() {
    const amount = Math.floor(Math.random() * 3000) + 2500;
    const names = ["Lone Star Exteriors", "Quality Home Co.", "Precision Builders", "Capitol City Pros"];
    const name = names[Math.floor(Math.random() * names.length)];
    addDemoNotification({
      id: `demo-ctrl-bid-${Date.now()}`,
      type: "bid_received",
      title: `New bid received — $${amount.toLocaleString()}`,
      description: `${name} submitted a bid of $${amount.toLocaleString()} on your Bathroom Tile job.`,
      timestamp: new Date(),
      read: false,
      jobId: JOB_ID,
      jobTitle: "Master bathroom tile replacement",
      fromName: name,
      amount,
      href: "/",
    });
    flash(`Bid from ${name} added`);
  }

  function handleAddMessage() {
    addDemoNotification({
      id: `demo-ctrl-msg-${Date.now()}`,
      type: "contractor_message",
      title: "New message from contractor",
      description: "Hill Country Tile & Stone: 'Would Thursday morning work for a site visit?'",
      timestamp: new Date(),
      read: false,
      jobId: JOB_ID,
      jobTitle: "Master bathroom tile replacement",
      fromName: "Hill Country Tile & Stone",
      href: "/",
    });
    flash("Message notification added");
  }

  function handleAdvanceStatus() {
    statusIndex = (statusIndex + 1) % STATUS_CYCLE.length;
    const next = STATUS_CYCLE[statusIndex] as JobStatusOwner;
    setJobStatus(JOB_ID, next);
    flash(`Job status → ${next.replace(/_/g, " ")}`);
  }

  function handleSelectContractor() {
    selectBidAsWinner(JOB_ID, BID_ID);
    addDemoNotification({
      id: `demo-ctrl-select-${Date.now()}`,
      type: "bid_accepted",
      title: "Contractor selected",
      description: "You selected Hill Country Tile & Stone for your Bathroom Tile job.",
      timestamp: new Date(),
      read: false,
      jobId: JOB_ID,
      jobTitle: "Master bathroom tile replacement",
      fromName: "Hill Country Tile & Stone",
      href: "/",
    });
    flash("Contractor selected");
  }

  function handleReset() {
    statusIndex = 0;
    resetDemoNotifications();
    flash("Demo data reset");
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {/* Feedback chip */}
      {lastAction && (
        <div className="rounded-full bg-foreground px-3 py-1.5 text-xs font-medium text-background shadow-lg">
          {lastAction}
        </div>
      )}

      {/* Expanded panel */}
      {open && (
        <div className="w-64 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          <div className="border-b border-border bg-muted/50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Demo Controls
            </p>
          </div>
          <div className="flex flex-col gap-1 p-2">
            <button
              type="button"
              onClick={handleAddBid}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <DollarSign className="h-4 w-4 shrink-0 text-emerald-600" />
              Add Bid Notification
            </button>
            <button
              type="button"
              onClick={handleAddMessage}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <MessageSquare className="h-4 w-4 shrink-0 text-blue-600" />
              Trigger Contractor Message
            </button>
            <button
              type="button"
              onClick={handleAdvanceStatus}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <TrendingUp className="h-4 w-4 shrink-0 text-amber-600" />
              Advance Job Status
            </button>
            <button
              type="button"
              onClick={handleSelectContractor}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <CheckCircle className="h-4 w-4 shrink-0 text-violet-600" />
              Select Contractor
            </button>
            <div className="mx-2 my-1 h-px bg-border" />
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <RefreshCw className="h-4 w-4 shrink-0" />
              Reset Demo Data
            </button>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close demo controls" : "Open demo controls"}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-500 text-white shadow-lg transition-all hover:bg-amber-400 active:scale-95"
      >
        {open ? (
          <ChevronDown className="h-5 w-5" />
        ) : (
          <Settings2 className="h-5 w-5" />
        )}
      </button>
    </div>
  );
}

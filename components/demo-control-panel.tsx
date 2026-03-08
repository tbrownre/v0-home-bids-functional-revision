"use client";

import { useState } from "react";
import { Settings, RotateCcw, MessageCircle, DollarSign, CheckSquare, ChevronDown, ChevronUp, X } from "lucide-react";
import { addNotification, resetInbox, type InboxNotification } from "@/lib/inbox-store";
import { setJobStatus, selectBidAsWinner } from "@/lib/job-store";

let demoEventCounter = 0;

function makeBidNotification(): InboxNotification {
  demoEventCounter++;
  const contractors = ["Summit Roofing Pros", "BlueSky Home Services", "Apex Contractors", "First Choice Repairs"];
  const amounts = [3200, 4100, 5500, 2900, 6800];
  const name = contractors[demoEventCounter % contractors.length];
  const amount = amounts[demoEventCounter % amounts.length];
  return {
    id: `demo-cp-bid-${Date.now()}`,
    type: "bid_received",
    title: "New bid received",
    description: `${name} submitted a bid of $${amount.toLocaleString()} on your job.`,
    timestamp: new Date(),
    read: false,
    jobId: "demo-job-1",
    jobTitle: "Your active job",
    fromName: name,
    amount,
    href: "/",
  };
}

function makeMessageNotification(): InboxNotification {
  demoEventCounter++;
  const contractors = ["Austin Pro Roofing & HVAC", "Hill Country Contractors"];
  const msgs = [
    "Can you confirm the square footage of the affected area?",
    "We have availability this Thursday — does that work?",
    "Just wanted to follow up on our bid. Happy to schedule a free walkthrough.",
  ];
  const name = contractors[demoEventCounter % contractors.length];
  const msg = msgs[demoEventCounter % msgs.length];
  return {
    id: `demo-cp-msg-${Date.now()}`,
    type: "contractor_message",
    title: "New message from contractor",
    description: `${name}: "${msg}"`,
    timestamp: new Date(),
    read: false,
    jobId: "demo-job-1",
    jobTitle: "Your active job",
    fromName: name,
    href: "/inbox",
  };
}

const JOB_STATUS_CYCLE = ["receiving_bids", "contractor_selected", "in_progress", "completed"] as const;
let currentStatusIdx = 0;

export function DemoControlPanel() {
  const [open, setOpen] = useState(true);

  function handleAddBid() {
    addNotification(makeBidNotification(), false);
  }

  function handleAddMessage() {
    addNotification(makeMessageNotification(), false);
  }

  function handleAdvanceStatus() {
    currentStatusIdx = (currentStatusIdx + 1) % JOB_STATUS_CYCLE.length;
    setJobStatus("demo-job-1", JOB_STATUS_CYCLE[currentStatusIdx]);
  }

  function handleSelectContractor() {
    selectBidAsWinner("demo-job-1", "demo-bid-1");
    addNotification({
      id: `demo-cp-select-${Date.now()}`,
      type: "bid_accepted",
      title: "Contractor selected",
      description: "Austin Pro Roofing & HVAC has been selected for your job. They will be in touch to schedule.",
      timestamp: new Date(),
      read: false,
      jobId: "demo-job-1",
      jobTitle: "Your active job",
      fromName: "Austin Pro Roofing & HVAC",
      href: "/",
    }, false);
  }

  function handleReset() {
    resetInbox();
    currentStatusIdx = 0;
    demoEventCounter = 0;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {open && (
        <div className="w-60 rounded-xl border border-border bg-card shadow-lg overflow-hidden">
          <div className="flex items-center justify-between border-b border-border bg-muted/50 px-3 py-2">
            <div className="flex items-center gap-1.5">
              <Settings className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold text-foreground">Demo Controls</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex flex-col gap-px p-1.5">
            <button
              onClick={handleAddBid}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
            >
              <DollarSign className="h-4 w-4 shrink-0 text-emerald-600" />
              <span className="font-medium text-foreground">Add Bid</span>
            </button>
            <button
              onClick={handleAddMessage}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
            >
              <MessageCircle className="h-4 w-4 shrink-0 text-blue-600" />
              <span className="font-medium text-foreground">Trigger Message</span>
            </button>
            <button
              onClick={handleAdvanceStatus}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
            >
              <ChevronDown className="h-4 w-4 shrink-0 text-amber-600" />
              <span className="font-medium text-foreground">Advance Job Status</span>
            </button>
            <button
              onClick={handleSelectContractor}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
            >
              <CheckSquare className="h-4 w-4 shrink-0 text-violet-600" />
              <span className="font-medium text-foreground">Select Contractor</span>
            </button>
            <div className="my-1 border-t border-border" />
            <button
              onClick={handleReset}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
            >
              <RotateCcw className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="font-medium text-muted-foreground">Reset Demo Data</span>
            </button>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-md hover:bg-muted transition-colors"
      >
        <Settings className="h-3.5 w-3.5" />
        Demo
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
      </button>
    </div>
  );
}

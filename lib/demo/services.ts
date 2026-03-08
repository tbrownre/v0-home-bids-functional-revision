/**
 * Demo service layer — mirrors the exact function signatures of
 * lib/supabase/actions.ts but returns static demo data with zero
 * network calls, DB reads, or webhook fires.
 *
 * Pages import from this module when isDemoMode() === true.
 */

import { demoAvailableJobs, demoHomeownerJobs } from "./data/jobs";
import { demoContractorBids } from "./data/bids";

// -- Homeowner services --

export async function getHomeownerJobs() {
  return { jobs: demoHomeownerJobs, error: null };
}

export async function createJob(_payload: unknown) {
  // In demo mode, job creation is purely visual — the timeline hook handles UI feedback
  return { job: demoHomeownerJobs[0], error: null };
}

// -- Contractor services --

export async function getOpenJobs() {
  return { jobs: demoAvailableJobs, error: null };
}

export async function getContractorBids() {
  return { bids: demoContractorBids, error: null };
}

export async function submitBid(_payload: unknown) {
  return { error: null, bid: demoContractorBids[0] };
}

// -- Messaging --

export async function getMessages() {
  return {
    messages: [],
    error: null,
  };
}

export async function sendMessage(_payload: unknown) {
  return { error: null };
}

/**
 * Demo service layer — same function signatures as lib/supabase/actions.ts.
 * Returns seeded static data with zero network calls.
 *
 * Pages import from this module when isDemoMode() is true.
 * lib/supabase/actions.ts is NEVER modified.
 */

import { demoJobs, demoHomeownerJobs } from "./data/jobs";
import { demoBids } from "./data/bids";
import { demoMessages } from "./data/messages";

// ── Jobs ──────────────────────────────────────────────────────────────────────

export async function getHomeownerJobs() {
  return { jobs: demoHomeownerJobs, error: null };
}

export async function getOpenJobs() {
  return {
    jobs: demoJobs.filter((j) => j.status === "open"),
    error: null,
  };
}

export async function createJob(_formData: {
  title: string;
  description: string;
  category: string;
  location: string;
  budget_min?: number;
  budget_max?: number;
}) {
  // Returns a fake job id so the page can transition to "success"
  return {
    success: true,
    job: {
      id: `demo-job-new-${Date.now()}`,
      ..._formData,
      status: "open",
      created_at: new Date().toISOString(),
    },
    error: null,
  };
}

// ── Bids ─────────────────────────────────────────────────────────────────────

export async function getContractorBids() {
  return { bids: demoBids, error: null };
}

export async function submitBid(_formData: {
  job_id: string;
  amount: number;
  message: string;
  timeline?: string;
}) {
  return {
    success: true,
    bid: { ...demoBids[0], id: `demo-bid-new-${Date.now()}`, ..._formData },
    error: null,
  };
}

export async function acceptBid(_bidId: string, _jobId: string) {
  return { success: true, error: null };
}

// ── Messages ─────────────────────────────────────────────────────────────────

export async function getMessages() {
  return { messages: demoMessages, error: null };
}

export async function sendMessage(_formData: {
  job_id: string;
  recipient_id: string;
  content: string;
}) {
  return { success: true, error: null };
}

// ── Auth stubs (always succeed in demo mode) ──────────────────────────────────

export async function signUpHomeowner(_formData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}) {
  return { success: true, error: null };
}

export async function signIn(_email: string, _password: string) {
  return { success: true, userType: "homeowner", error: null };
}

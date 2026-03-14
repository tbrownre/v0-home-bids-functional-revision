/**
 * Demo service layer — mirrors lib/supabase/actions.ts signatures exactly.
 * Pages import from this module when isDemoMode() is true.
 * No Supabase calls, no auth, no network requests.
 */

import { demoJobs, demoHomeownerJobs } from "./data/jobs";
import { demoBids, demoContractorBids } from "./data/bids";
import { demoMessages } from "./data/messages";

export async function getHomeownerJobs() {
  return { jobs: demoHomeownerJobs, error: null };
}

export async function getOpenJobs() {
  return { jobs: demoJobs, error: null };
}

export async function getContractorBids() {
  return { bids: demoContractorBids, error: null };
}

export async function createJob(_formData: {
  title: string;
  description: string;
  category: string;
  location: string;
  budget_min?: number;
  budget_max?: number;
}) {
  // Return a synthetic job so the jobs board can display it immediately.
  const newJob = {
    id: `demo-job-new-${Date.now()}`,
    homeowner_id: "demo-user-homeowner",
    title: _formData.title.slice(0, 80),
    description: _formData.description,
    category: _formData.category,
    location: _formData.location,
    budget_min: _formData.budget_min ?? null,
    budget_max: _formData.budget_max ?? null,
    status: "open",
    created_at: new Date().toISOString(),
    bids: [{ count: 0 }],
    profiles: { full_name: "You (Demo)" },
  };
  return { success: true, job: newJob, error: null };
}

export async function submitBid(_formData: {
  job_id: string;
  amount: number;
  message: string;
  timeline?: string;
}) {
  return { success: true, bid: demoContractorBids[0], error: null };
}

export async function sendMessage(_formData: {
  job_id: string;
  recipient_id: string;
  content: string;
}) {
  return { success: true, error: null };
}

export async function getMessages() {
  return { messages: demoMessages, error: null };
}

export async function signUpHomeowner(_formData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}) {
  // Demo: simulate a successful signup without creating a real account.
  return { success: true };
}

/**
 * Demo services — in-memory data access layer for both demo accounts.
 * These functions mirror the signatures of the real Supabase actions so pages
 * can swap them in with a simple isDemoMode()/isDemoEmail() check.
 *
 * No Supabase calls here — everything is served from the local data files.
 */

import { demoJobs } from "./data/jobs";
import { demoBids } from "./data/bids";
import { demoContractorBids } from "./data/contractor-bids";
import { demoOpenJobs } from "./data/open-jobs";
import { demoContractorProfile } from "./data/contractor";

// ── Homeowner ────────────────────────────────────────────────────────────────

/** Used by the homeowner jobs board (app/page.tsx). */
export async function getHomeownerJobs() {
  return {
    jobs: demoJobs.map((j) => ({
      id: j.id,
      description: j.description,
      title: j.title,
      category: j.category,
      location: j.location,
      status: j.status,
      created_at: j.created_at,
      bids: j.bids,
      budget_min: j.budget_min,
      budget_max: j.budget_max,
    })),
    error: null,
  };
}

/** Used by app/jobs/[id]/page.tsx. */
export async function getJobById(id: string) {
  const job = demoJobs.find((j) => j.id === id);
  if (!job) return { job: null, error: "Job not found" };
  return {
    job: {
      id: job.id,
      title: job.title,
      description: job.description,
      category: job.category,
      location: job.location,
      status: job.status,
      urgency: job.urgency ?? "medium",
      budget_min: job.budget_min,
      budget_max: job.budget_max,
      created_at: job.created_at,
      bids: Array.from({ length: job.bids[0]?.count ?? 0 }, (_, i) => ({ id: `bid-${i}` })),
    },
    error: null,
  };
}

/** Used by app/jobs/[id]/bids/page.tsx. */
export async function getJobBids(jobId: string) {
  const bids = demoBids.filter((b) => b.job_id === jobId);
  return { bids, error: null };
}

// ── Contractor marketplace ────────────────────────────────────────────────────

/** Used by app/contractors/jobs/page.tsx. */
export async function getOpenJobs() {
  return {
    jobs: demoOpenJobs.map((j) => ({
      id: j.id,
      title: j.title,
      description: j.description,
      location: j.location,
      budget: j.budget,
      timeline: j.timeline,
      postedAt: j.postedAt,
      category: j.category,
      urgency: j.urgency,
      bidsCount: j.bidsCount,
      homeownerName: j.homeownerName,
      propertyType: j.propertyType,
      preferredContact: j.preferredContact,
      imageCount: j.imageCount,
    })),
    error: null,
  };
}

// ── Contractor dashboard ─────────────────────────────────────────────────────

/** Used by app/contractors/dashboard/page.tsx. */
export async function getContractorBids() {
  return {
    bids: demoContractorBids.map((b) => ({
      // Supabase raw columns
      id: b.id,
      job_id: b.job_id,
      amount: b.bidAmount,
      message: b.message,
      timeline: b.timeline,
      status: (() => {
        // Map frontend status back to DB-side bid status for mapBidFromDb()
        if (b.status === "in_progress") return "accepted";
        if (b.status === "completed") return "completed";
        if (b.status === "not_selected") return "rejected";
        return "pending";
      })(),
      created_at: b.submittedAt.toISOString(),
      jobs: {
        title: b.jobTitle,
        description: b.jobDescription,
        location: b.homeownerLocation,
        budget_min: null,
        budget_max: null,
        urgency: b.jobTimeline,
      },
    })),
    error: null,
  };
}

/** Used by contractor profile lookup. */
export async function getContractorProfile() {
  return { profile: demoContractorProfile, error: null };
}

/** Used by the inbox (messages). */
export async function getMessages() {
  return { messages: [], error: null };
}

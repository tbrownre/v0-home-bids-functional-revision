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
import { demoOpenJobs, type DemoOpenJob } from "./data/open-jobs";
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

/** Used by app/jobs/[id]/page.tsx. Searches all demo data sources. */
export async function getJobById(id: string) {
  // First check homeowner demo jobs
  const job = demoJobs.find((j) => j.id === id);
  if (job) {
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

  // Then check contractor open jobs (marketplace)
  const openJob = demoOpenJobs.find((j) => j.id === id);
  if (openJob) {
    // Parse budget string into min/max — format is "$X - $Y" or "TBD" or "$X"
    const parseBudget = (budget: string): { min: number | null; max: number | null } => {
      const match = budget.match(/\$?([\d,]+)\s*-?\s*\$?([\d,]+)?/);
      if (!match) return { min: null, max: null };
      const min = match[1] ? parseInt(match[1].replace(/,/g, ""), 10) : null;
      const max = match[2] ? parseInt(match[2].replace(/,/g, ""), 10) : null;
      return { min, max };
    };
    const { min, max } = parseBudget(openJob.budget);

    return {
      job: {
        id: openJob.id,
        title: openJob.title,
        description: openJob.description,
        category: openJob.category,
        location: openJob.location,
        status: "open",
        urgency: openJob.urgency,
        budget_min: min,
        budget_max: max,
        created_at: openJob.postedAt.toISOString(),
        bids: Array.from({ length: openJob.bidsCount }, (_, i) => ({ id: `bid-${i}` })),
        // Additional fields for contractor view
        homeownerName: openJob.homeownerName,
        propertyType: openJob.propertyType,
        preferredContact: openJob.preferredContact,
        imageCount: openJob.imageCount,
        timeline: openJob.timeline,
      },
      error: null,
    };
  }

  // Check contractor bid jobs (cjob-* IDs) — these have job data embedded in the bid
  const contractorBid = demoContractorBids.find((b) => b.job_id === id);
  if (contractorBid) {
    // Parse budget string into min/max
    const parseBudget = (budget: string): { min: number | null; max: number | null } => {
      const match = budget.match(/\$?([\d,]+)\s*-?\s*\$?([\d,]+)?/);
      if (!match) return { min: null, max: null };
      const min = match[1] ? parseInt(match[1].replace(/,/g, ""), 10) : null;
      const max = match[2] ? parseInt(match[2].replace(/,/g, ""), 10) : null;
      return { min, max };
    };
    const { min, max } = parseBudget(contractorBid.jobBudget);

    // Map contractor bid status to job status
    const jobStatus =
      contractorBid.status === "in_progress"
        ? "in_progress"
        : contractorBid.status === "completed"
          ? "completed"
          : "open";

    return {
      job: {
        id: contractorBid.job_id,
        title: contractorBid.jobTitle,
        description: contractorBid.jobDescription,
        category: "General", // Infer from title or use generic
        location: contractorBid.homeownerLocation,
        status: jobStatus,
        urgency: contractorBid.jobTimeline === "ASAP" ? "high" : "medium",
        budget_min: min,
        budget_max: max,
        created_at: contractorBid.submittedAt.toISOString(),
        bids: Array.from({ length: contractorBid.otherBids + 1 }, (_, i) => ({ id: `bid-${i}` })),
        homeownerName: contractorBid.homeownerName,
        imageCount: contractorBid.imageCount,
        timeline: contractorBid.jobTimeline,
      },
      error: null,
    };
  }

  // Fallback: return a safe demo job instead of "not found" for any unknown ID in demo mode
  const fallbackJob = demoOpenJobs[0];
  if (fallbackJob) {
    const { min, max } = (() => {
      const match = fallbackJob.budget.match(/\$?([\d,]+)\s*-?\s*\$?([\d,]+)?/);
      if (!match) return { min: null, max: null };
      return {
        min: match[1] ? parseInt(match[1].replace(/,/g, ""), 10) : null,
        max: match[2] ? parseInt(match[2].replace(/,/g, ""), 10) : null,
      };
    })();

    return {
      job: {
        id: fallbackJob.id,
        title: fallbackJob.title,
        description: fallbackJob.description,
        category: fallbackJob.category,
        location: fallbackJob.location,
        status: "open",
        urgency: fallbackJob.urgency,
        budget_min: min,
        budget_max: max,
        created_at: fallbackJob.postedAt.toISOString(),
        bids: Array.from({ length: fallbackJob.bidsCount }, (_, i) => ({ id: `bid-${i}` })),
        homeownerName: fallbackJob.homeownerName,
        propertyType: fallbackJob.propertyType,
        preferredContact: fallbackJob.preferredContact,
        imageCount: fallbackJob.imageCount,
        timeline: fallbackJob.timeline,
      },
      error: null,
    };
  }

  return { job: null, error: "Job not found" };
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

// ── Contractor dashboard ────────────────────────────��────────────────────────

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

// ── Extended bid/proposal functions ──────────────────────────────────────────

/** Demo bid by ID — constructs a rich bid record from demoContractorBids. */
export async function getBidById(bidId: string) {
  const bid = demoContractorBids.find((b) => b.id === bidId);
  if (!bid) {
    // Fallback to first bid for demo purposes
    const fallback = demoContractorBids[0];
    if (!fallback) return { bid: null, error: "Bid not found" };
    return { bid: buildDemoBid(fallback), error: null };
  }
  return { bid: buildDemoBid(bid), error: null };
}

function buildDemoBid(b: (typeof demoContractorBids)[0]) {
  return {
    id: b.id,
    job_id: b.job_id,
    contractor_id: "demo-contractor",
    amount: b.bidAmount,
    message: b.message,
    timeline: b.timeline,
    status: b.status === "in_progress" ? "sent" : b.status === "completed" ? "approved" : "sent",
    created_at: b.submittedAt.toISOString(),
    // Nested job
    jobs: {
      id: b.job_id,
      title: b.jobTitle,
      description: b.jobDescription,
      category: "Home Improvement",
      location: b.homeownerLocation,
      urgency: b.jobTimeline,
      budget_min: null,
      budget_max: null,
      homeowner_id: "demo-homeowner",
    },
    // Nested profile
    profiles: {
      id: "demo-contractor",
      full_name: demoContractorProfile.business_name,
      avatar_url: null,
    },
    // Rich bid builder fields (populated when bid came from AI builder)
    scope_of_work: b.message,
    line_items: null,   // TODO: parse from bid_builder output when available
    assumptions: null,
    exclusions: null,
    payment_terms: "50% deposit, 50% on completion",
    next_steps: "Please review and approve to schedule your project.",
  };
}

/** Demo bid status update — no-op in demo mode. */
export async function updateBidStatus(bidId: string, _status: string) {
  return { success: true };
}

/** Demo save homeowner question — no-op in demo mode. */
export async function saveHomeownerQuestion(_bidId: string, _question: string) {
  return { success: true };
}

// ── Job status ────────────────────────────────────────────────────────────────

/** Demo job status for the homeowner status page. */
export async function getJobStatus(jobId: string) {
  const job = demoJobs.find((j) => j.id === jobId) ?? demoJobs[0];
  if (!job) return { jobStatus: null, error: "Job not found" };
  return {
    jobStatus: {
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
      },
      contractorsContacted: 12,
      contractorsInterested: 4,
      bidsReceived: job.bids[0]?.count ?? 2,
      outreachStatus: "active" as const,
    },
    error: null,
  };
}

// ── Contractor opportunity ────────────────────────────────────────────────────

/** Demo contractor interest — no-op. */
export async function createContractorInterest(_jobId: string, _contractorId?: string) {
  return { success: true };
}

/** Demo createBidFromJob — returns a synthetic draft ID. */
export async function createBidFromJob(jobId: string) {
  return { bidId: `demo-draft-${jobId}`, requiresAuth: false };
}

// ── Admin outreach ────────────────────────────────────────────────────────────

/** Demo admin jobs. */
export async function getAdminJobs() {
  return {
    jobs: demoJobs.map((j) => ({
      id: j.id,
      title: j.title,
      category: j.category,
      location: j.location,
      status: j.status,
      created_at: j.created_at,
      bids: [{ count: j.bids[0]?.count ?? 0 }],
    })),
    error: null,
  };
}

/** Demo admin outreach runs — static mock data labeled as demo. */
export async function getAdminOutreachRuns() {
  // DEMO DATA — replace with real Supabase query when outreach_runs table exists
  return {
    runs: demoJobs.map((j, i) => ({
      id: `run-${j.id}`,
      job_id: j.id,
      job_title: j.title,
      status: i === 0 ? "active" : "completed",
      contractors_selected: 8 + i * 3,
      invites_queued: 8 + i * 3,
      invites_sent: 6 + i * 2,
      invites_failed: i,
      replies_received: 3 + i,
      interested_count: 2 + i,
      bids_started: 1 + i,
      bids_submitted: j.bids[0]?.count ?? 0,
      created_at: j.created_at,
    })),
    error: null,
  };
}

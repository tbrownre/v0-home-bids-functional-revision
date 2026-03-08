// Simplified global store for job and bid status management.
// HomeBids does NOT manage payments between parties.
// Statuses reflect connection/coordination state only.

export type JobStatusOwner =
  | "receiving_bids"
  | "contractor_selected"
  | "in_progress"
  | "completed";

export type BidStatusContractor =
  | "open"
  | "bid_submitted"
  | "selected"
  | "completed"
  | "not_selected";

interface JobState {
  status_owner: JobStatusOwner;
  selected_bid_id?: string | null;
  archived?: boolean;
  archived_at?: Date;
  review?: {
    rating: number;
    text: string;
    submitted_at: Date;
  };
}

interface BidState {
  status_contractor: BidStatusContractor;
  is_selected: boolean;
  submitted_at: Date;
  updated_at: Date;
}

const jobStatuses = new Map<string, JobState>();
const bidStatuses = new Map<string, Map<string, BidState>>();

const listeners = new Set<() => void>();

// Job Status Management
export function getJobStatus(jobId: string): JobStatusOwner {
  return jobStatuses.get(jobId)?.status_owner || "receiving_bids";
}

export function getJobState(jobId: string): JobState {
  return jobStatuses.get(jobId) || {
    status_owner: "receiving_bids",
    selected_bid_id: null,
  };
}

export function setJobStatus(jobId: string, status: JobStatusOwner) {
  const existing = jobStatuses.get(jobId) || {
    status_owner: "receiving_bids" as JobStatusOwner,
    selected_bid_id: null,
  };
  jobStatuses.set(jobId, { ...existing, status_owner: status });
  notifyListeners();
}

/**
 * Homeowner selects a contractor's bid.
 * Job moves to "contractor_selected"; non-selected bids become "not_selected".
 */
export function selectBidAsWinner(jobId: string, bidId: string) {
  const existing = jobStatuses.get(jobId) || {
    status_owner: "receiving_bids" as JobStatusOwner,
    selected_bid_id: null,
  };
  jobStatuses.set(jobId, {
    ...existing,
    status_owner: "contractor_selected",
    selected_bid_id: bidId,
  });

  const jobBids = bidStatuses.get(jobId);
  if (jobBids) {
    jobBids.forEach((bid, cBidId) => {
      if (cBidId === bidId) {
        bid.status_contractor = "selected";
        bid.is_selected = true;
      } else {
        bid.status_contractor = "not_selected";
        bid.is_selected = false;
      }
      bid.updated_at = new Date();
    });
  }

  notifyListeners();
}

/**
 * Homeowner marks a job as completed and optionally submits a review.
 */
export function completeJob(
  jobId: string,
  bidId: string,
  review?: { rating: number; text: string }
) {
  const existing = jobStatuses.get(jobId) || {
    status_owner: "receiving_bids" as JobStatusOwner,
    selected_bid_id: null,
  };
  jobStatuses.set(jobId, {
    ...existing,
    status_owner: "completed",
    review: review
      ? { ...review, submitted_at: new Date() }
      : undefined,
  });

  setBidStatus(jobId, bidId, "completed");
  notifyListeners();
}

export function getJobReview(jobId: string) {
  return jobStatuses.get(jobId)?.review;
}

// Bid Status Management
export function getBidStatus(jobId: string, bidId: string): BidStatusContractor {
  return bidStatuses.get(jobId)?.get(bidId)?.status_contractor || "open";
}

export function getBidState(jobId: string, bidId: string): BidState {
  return (
    bidStatuses.get(jobId)?.get(bidId) || {
      status_contractor: "open",
      is_selected: false,
      submitted_at: new Date(),
      updated_at: new Date(),
    }
  );
}

export function setBidStatus(
  jobId: string,
  bidId: string,
  status: BidStatusContractor
) {
  if (!bidStatuses.has(jobId)) {
    bidStatuses.set(jobId, new Map());
  }

  const existing = bidStatuses.get(jobId)!.get(bidId) || {
    status_contractor: "open" as BidStatusContractor,
    is_selected: false,
    submitted_at: new Date(),
    updated_at: new Date(),
  };

  bidStatuses.get(jobId)!.set(bidId, {
    ...existing,
    status_contractor: status,
    updated_at: new Date(),
  });

  notifyListeners();
}

/**
 * Mark a bid as submitted (contractor placed bid).
 */
export function submitBid(jobId: string, bidId: string) {
  setBidStatus(jobId, bidId, "bid_submitted");
}

/**
 * Reopen bidding: reset job to receiving_bids, all bids back to open.
 */
export function reopenBidding(jobId: string) {
  const jobState = jobStatuses.get(jobId) || {
    status_owner: "receiving_bids" as JobStatusOwner,
    selected_bid_id: null,
  };
  jobStatuses.set(jobId, {
    ...jobState,
    status_owner: "receiving_bids",
    selected_bid_id: null,
  });

  if (bidStatuses.has(jobId)) {
    bidStatuses.get(jobId)!.forEach((bid) => {
      bid.status_contractor = "open";
      bid.is_selected = false;
      bid.updated_at = new Date();
    });
  }

  notifyListeners();
}

export function archiveJob(jobId: string) {
  const existing = jobStatuses.get(jobId) || {
    status_owner: "receiving_bids" as JobStatusOwner,
    selected_bid_id: null,
  };
  jobStatuses.set(jobId, { ...existing, archived: true, archived_at: new Date() });
  notifyListeners();
}

export function isJobArchived(jobId: string): boolean {
  return jobStatuses.get(jobId)?.archived === true;
}

/**
 * Pre-seed job statuses for demo jobs so getJobStatus() resolves immediately.
 * Called on load in demo mode before the subscribe callback is registered.
 */
export function seedDemoJobs(jobIds: string[]) {
  for (const id of jobIds) {
    if (!jobStatuses.has(id)) {
      jobStatuses.set(id, { status_owner: "receiving_bids", selected_bid_id: null });
    }
  }
}

// Listener Management
export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners() {
  for (const listener of listeners) {
    listener();
  }
}

export function getSnapshot(): {
  jobs: Map<string, JobState>;
  bids: Map<string, Map<string, BidState>>;
} {
  return { jobs: jobStatuses, bids: bidStatuses };
}

// Label helpers for UI
export function getJobStatusLabel(status: JobStatusOwner): string {
  switch (status) {
    case "receiving_bids":
      return "Receiving Bids";
    case "contractor_selected":
      return "Contractor Selected";
    case "in_progress":
      return "In Progress";
    case "completed":
      return "Completed";
  }
}

export function getBidStatusLabel(status: BidStatusContractor): string {
  switch (status) {
    case "open":
      return "Open";
    case "bid_submitted":
      return "Bid Submitted";
    case "selected":
      return "Selected";
    case "completed":
      return "Completed";
    case "not_selected":
      return "Not Selected";
  }
}

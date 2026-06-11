// ─────────────────────────────────────────────────────────────────────────────
// HomeBids Admin Demo — Mock Data
// All numbers are illustrative and not real financial data.
// ─────────────────────────────────────────────────────────────────────────────

// ── Revenue constants ─────────────────────────────────────────────────────────

export const PLAN_PRICE = 99; // $/mo per contractor

export const REVENUE = {
  subscribedContractors: 482,
  planPrice: PLAN_PRICE,
  grossMRR: 482 * 99,            // 47_718
  ARR: 482 * 99 * 12,            // 572_616
  affiliateReferredContractors: 214,
  directContractors: 268,
  affiliateAttributedMRR: 214 * 99,       // 21_186
  affiliatePayoutRate: 0.20,
  monthlyAffiliatePayouts: Math.round(214 * 99 * 0.20), // 4_237
  netMRR: Math.round(482 * 99 - 214 * 99 * 0.20),       // 43_481
} as const;

// ── Overview stats ────────────────────────────────────────────────────────────

export const OVERVIEW_STATS = {
  subscribedContractors: REVENUE.subscribedContractors,
  grossMRR: REVENUE.grossMRR,
  ARR: REVENUE.ARR,
  monthlyAffiliatePayouts: REVENUE.monthlyAffiliatePayouts,
  netMRR: REVENUE.netMRR,
  homeownerJobsThisMonth: 94,
  jobsInOutreach: 37,
  bidsReceived: 211,
  jobsAwarded: 68,
  contractorPipelineValue: 1_840_000,
} as const;

// ── Affiliate partners ────────────────────────────────────────────────────────

export interface AffiliatePartner {
  name: string;
  referredContractors: number;
  monthlyPayout: number;
}

export const AFFILIATE_PARTNERS: AffiliatePartner[] = [
  { name: "Phoenix Home Services FB Group",       referredContractors: 74, monthlyPayout: 1465 },
  { name: "Gilbert Homeowners Network",            referredContractors: 52, monthlyPayout: 1030 },
  { name: "Scottsdale Contractors Circle",         referredContractors: 38, monthlyPayout:  752 },
  { name: "East Valley Home Improvement Group",    referredContractors: 31, monthlyPayout:  614 },
  { name: "Arizona Remodel Pros Network",          referredContractors: 19, monthlyPayout:  376 },
];
// Total: 214 referred, $4,237/mo payout

// ── Contractors ───────────────────────────────────────────────────────────────

export type ContractorStatus = "Active" | "Trial" | "Past Due" | "Canceled";

export interface DemoContractor {
  id: string;
  businessName: string;
  trade: string;
  city: string;
  state: string;
  plan: string;
  status: ContractorStatus;
  joinedDate: string;
  contact: string;
}

export const DEMO_CONTRACTORS: DemoContractor[] = [
  { id: "c1",  businessName: "Desert Ridge Plumbing",        trade: "Plumbing",     city: "Phoenix",    state: "AZ", plan: "Contractor Plan", status: "Active",   joinedDate: "2024-02-10", contact: "Mike Torres" },
  { id: "c2",  businessName: "Valley AC Pros",               trade: "HVAC",         city: "Gilbert",    state: "AZ", plan: "Contractor Plan", status: "Active",   joinedDate: "2024-03-05", contact: "Sarah Kim" },
  { id: "c3",  businessName: "Cactus Valley Roofing",        trade: "Roofing",      city: "Mesa",       state: "AZ", plan: "Contractor Plan", status: "Active",   joinedDate: "2024-01-18", contact: "James Ruiz" },
  { id: "c4",  businessName: "Precision Paint Co.",          trade: "Painting",     city: "Chandler",   state: "AZ", plan: "Contractor Plan", status: "Active",   joinedDate: "2024-04-02", contact: "Dana West" },
  { id: "c5",  businessName: "Scottsdale Turf & Landscape",  trade: "Landscaping",  city: "Scottsdale", state: "AZ", plan: "Contractor Plan", status: "Active",   joinedDate: "2024-02-27", contact: "Carlos Vega" },
  { id: "c6",  businessName: "AZ Electric Solutions",        trade: "Electrical",   city: "Tempe",      state: "AZ", plan: "Contractor Plan", status: "Active",   joinedDate: "2024-03-14", contact: "Lisa Park" },
  { id: "c7",  businessName: "Copper State Flooring",        trade: "Flooring",     city: "Peoria",     state: "AZ", plan: "Contractor Plan", status: "Trial",    joinedDate: "2025-06-01", contact: "Tom Ibarra" },
  { id: "c8",  businessName: "Sunbelt Tile & Stone",         trade: "Tile",         city: "Phoenix",    state: "AZ", plan: "Contractor Plan", status: "Past Due", joinedDate: "2024-09-22", contact: "Erica Hall" },
  { id: "c9",  businessName: "Southwest Fence & Gate",       trade: "Fencing",      city: "Surprise",   state: "AZ", plan: "Contractor Plan", status: "Active",   joinedDate: "2024-05-09", contact: "Ryan Brooks" },
  { id: "c10", businessName: "Mesa Masonry Works",           trade: "Masonry",      city: "Mesa",       state: "AZ", plan: "Contractor Plan", status: "Active",   joinedDate: "2024-06-17", contact: "Angela Ford" },
  { id: "c11", businessName: "Premier Pool Builders",        trade: "Pools",        city: "Scottsdale", state: "AZ", plan: "Contractor Plan", status: "Active",   joinedDate: "2024-07-03", contact: "Derek Lane" },
  { id: "c12", businessName: "Reliable Remodeling Co.",      trade: "Remodeling",   city: "Glendale",   state: "AZ", plan: "Contractor Plan", status: "Canceled", joinedDate: "2024-08-11", contact: "Nina Shaw" },
];

// ── Homeowner job requests ────────────────────────────────────────────────────

export type JobStatus = "Awaiting Bids" | "In Review" | "Awarded" | "Completed" | "Canceled";

export interface HomeownerJob {
  id: string;
  homeownerName: string;
  projectType: string;
  city: string;
  zip: string;
  timeline: string;
  budgetRange: string;
  status: JobStatus;
  contractorsContacted: number;
  bidsReceived: number;
  awardedContractor?: string;
}

export const HOMEOWNER_JOBS: HomeownerJob[] = [
  { id: "j1",  homeownerName: "Rachel M.",  projectType: "Kitchen Remodel",       city: "Scottsdale", zip: "85251", timeline: "2–3 months",  budgetRange: "$18k–$25k",  status: "Awaiting Bids",  contractorsContacted: 5, bidsReceived: 2 },
  { id: "j2",  homeownerName: "Brian K.",   projectType: "HVAC Replacement",      city: "Gilbert",    zip: "85296", timeline: "ASAP",         budgetRange: "$6k–$9k",    status: "Awarded",        contractorsContacted: 6, bidsReceived: 4, awardedContractor: "Valley AC Pros" },
  { id: "j3",  homeownerName: "Denise L.",  projectType: "Roof Repair",           city: "Mesa",       zip: "85202", timeline: "Within 30 days",budgetRange: "$3k–$6k",    status: "In Review",      contractorsContacted: 4, bidsReceived: 3 },
  { id: "j4",  homeownerName: "Carlos P.",  projectType: "Backyard Landscaping",  city: "Chandler",   zip: "85226", timeline: "Flexible",     budgetRange: "$5k–$12k",   status: "Awaiting Bids",  contractorsContacted: 3, bidsReceived: 1 },
  { id: "j5",  homeownerName: "Stephanie R.","projectType": "Interior Painting",  city: "Tempe",      zip: "85281", timeline: "1–2 months",   budgetRange: "$2k–$4k",    status: "Completed",      contractorsContacted: 4, bidsReceived: 4, awardedContractor: "Precision Paint Co." },
  { id: "j6",  homeownerName: "James W.",   projectType: "Electrical Panel Upgrade",city: "Phoenix",  zip: "85032", timeline: "Within 2 weeks",budgetRange: "$2k–$4k",   status: "Awarded",        contractorsContacted: 5, bidsReceived: 3, awardedContractor: "AZ Electric Solutions" },
  { id: "j7",  homeownerName: "Maria T.",   projectType: "Bathroom Tile",         city: "Peoria",     zip: "85381", timeline: "Flexible",     budgetRange: "$3k–$7k",    status: "In Review",      contractorsContacted: 3, bidsReceived: 2 },
  { id: "j8",  homeownerName: "Aaron N.",   projectType: "Pool Installation",     city: "Scottsdale", zip: "85255", timeline: "3–6 months",   budgetRange: "$40k–$65k",  status: "Awaiting Bids",  contractorsContacted: 4, bidsReceived: 0 },
];

// ── Outreach tracker ──────────────────────────────────────────────────────────

export type OutreachStatus = "In Progress" | "Completed" | "Stalled" | "Awaiting Response";

export interface OutreachRecord {
  id: string;
  jobTitle: string;
  trade: string;
  contractorsDiscovered: number;
  contractorsContacted: number;
  emailsSent: number;
  repliesReceived: number;
  bidsSubmitted: number;
  status: OutreachStatus;
}

export const OUTREACH_RECORDS: OutreachRecord[] = [
  { id: "o1", jobTitle: "Kitchen Remodel — Scottsdale",      trade: "Remodeling",   contractorsDiscovered: 12, contractorsContacted: 5, emailsSent: 5,  repliesReceived: 2, bidsSubmitted: 2, status: "Awaiting Response" },
  { id: "o2", jobTitle: "HVAC Replacement — Gilbert",        trade: "HVAC",         contractorsDiscovered: 9,  contractorsContacted: 6, emailsSent: 6,  repliesReceived: 5, bidsSubmitted: 4, status: "Completed" },
  { id: "o3", jobTitle: "Roof Repair — Mesa",                trade: "Roofing",      contractorsDiscovered: 8,  contractorsContacted: 4, emailsSent: 4,  repliesReceived: 3, bidsSubmitted: 3, status: "Completed" },
  { id: "o4", jobTitle: "Backyard Landscaping — Chandler",   trade: "Landscaping",  contractorsDiscovered: 10, contractorsContacted: 3, emailsSent: 3,  repliesReceived: 1, bidsSubmitted: 1, status: "In Progress" },
  { id: "o5", jobTitle: "Electrical Panel Upgrade — Phoenix",trade: "Electrical",   contractorsDiscovered: 7,  contractorsContacted: 5, emailsSent: 5,  repliesReceived: 3, bidsSubmitted: 3, status: "Completed" },
  { id: "o6", jobTitle: "Pool Installation — Scottsdale",    trade: "Pools",        contractorsDiscovered: 6,  contractorsContacted: 4, emailsSent: 4,  repliesReceived: 0, bidsSubmitted: 0, status: "Stalled" },
];

// ── Bid review queue ──────────────────────────────────────────────────────────

export type BidStatus = "Pending Review" | "Accepted" | "Declined" | "Under Consideration";

export interface BidRecord {
  id: string;
  contractor: string;
  job: string;
  bidAmount: number;
  estimatedTimeline: string;
  status: BidStatus;
  hasAiSummary: boolean;
  homeownerAction: string;
}

export const BID_RECORDS: BidRecord[] = [
  { id: "b1", contractor: "Desert Ridge Plumbing",       job: "Kitchen Remodel — Scottsdale",       bidAmount: 21500, estimatedTimeline: "8 weeks",   status: "Pending Review",      hasAiSummary: true,  homeownerAction: "Not yet reviewed" },
  { id: "b2", contractor: "Cactus Valley Roofing",       job: "Roof Repair — Mesa",                 bidAmount: 4800,  estimatedTimeline: "3–4 days",  status: "Accepted",            hasAiSummary: true,  homeownerAction: "Accepted bid" },
  { id: "b3", contractor: "Valley AC Pros",              job: "HVAC Replacement — Gilbert",         bidAmount: 7200,  estimatedTimeline: "1 day",     status: "Accepted",            hasAiSummary: true,  homeownerAction: "Accepted bid" },
  { id: "b4", contractor: "Scottsdale Turf & Landscape", job: "Backyard Landscaping — Chandler",    bidAmount: 9400,  estimatedTimeline: "3 weeks",   status: "Pending Review",      hasAiSummary: false, homeownerAction: "Not yet reviewed" },
  { id: "b5", contractor: "AZ Electric Solutions",       job: "Electrical Panel Upgrade — Phoenix", bidAmount: 3100,  estimatedTimeline: "4 hours",   status: "Accepted",            hasAiSummary: true,  homeownerAction: "Accepted bid" },
  { id: "b6", contractor: "Premier Pool Builders",       job: "Pool Installation — Scottsdale",     bidAmount: 54000, estimatedTimeline: "10 weeks",  status: "Under Consideration", hasAiSummary: true,  homeownerAction: "Comparing bids" },
  { id: "b7", contractor: "Precision Paint Co.",         job: "Interior Painting — Tempe",          bidAmount: 2950,  estimatedTimeline: "5 days",    status: "Accepted",            hasAiSummary: false, homeownerAction: "Accepted bid" },
  { id: "b8", contractor: "Sunbelt Tile & Stone",        job: "Bathroom Tile — Peoria",             bidAmount: 5600,  estimatedTimeline: "1 week",    status: "Declined",            hasAiSummary: true,  homeownerAction: "Chose different contractor" },
];

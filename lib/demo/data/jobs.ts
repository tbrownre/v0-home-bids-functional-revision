/**
 * Demo homeowner jobs — 6 jobs across every lifecycle stage so the homeowner
 * demo account shows a fully active, realistic project dashboard.
 *
 * Statuses map to the JobStatusOwner type in lib/job-store.ts:
 *   "receiving_bids" | "contractor_selected" | "in_progress" | "completed"
 */

export interface DemoJob {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  status: string; // DB-side status string
  urgency?: string;
  budget_min: number | null;
  budget_max: number | null;
  created_at: string;
  bids: { count: number }[];
}

const now = Date.now();

export const demoJobs: DemoJob[] = [
  // 1. Fresh job — just posted, no bids yet
  {
    id: "demo-job-1",
    title: "Kitchen Remodel — Cabinet Replacement",
    description:
      "Looking to replace existing builder-grade cabinets with custom shaker-style cabinets throughout the kitchen. Approximately 22 linear feet of upper and lower cabinets. Countertops and appliances staying. Would love a consultation before finalizing scope. Property is a 2,400 sq ft single-family home built in 2003.",
    category: "Kitchen & Bath",
    location: "Austin, TX 78704",
    status: "open",
    urgency: "medium",
    budget_min: 8000,
    budget_max: 14000,
    created_at: new Date(now - 4 * 60 * 60 * 1000).toISOString(),
    bids: [{ count: 1 }],
  },

  // 2. Active bidding — 5 bids, homeowner comparing
  {
    id: "demo-job-2",
    title: "Full Roof Replacement — 2,800 sq ft",
    description:
      "Roof is 18 years old and showing end-of-life wear — granule loss, two small leaks after the last major storm, and multiple cracked shingles. Insurance adjuster has already inspected and approved replacement. Looking for a contractor who can work with the insurance company directly. Architectural shingles preferred, 30-year warranty minimum.",
    category: "Roofing",
    location: "Austin, TX 78704",
    status: "open",
    urgency: "high",
    budget_min: 9000,
    budget_max: 16000,
    created_at: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
    bids: [{ count: 5 }],
  },

  // 3. Contractor selected — in negotiation / scheduling
  {
    id: "demo-job-3",
    title: "Master Bathroom Renovation",
    description:
      "Full gut and renovation of master bath (140 sq ft). Scope includes: tile floor and shower walls (subway tile), new vanity and dual sinks, frameless glass shower enclosure, freestanding soaking tub, updated lighting and exhaust fan. Plumbing rough-in is in good shape. Demo already done by homeowner.",
    category: "Kitchen & Bath",
    location: "Austin, TX 78704",
    status: "contractor_selected",
    urgency: "medium",
    budget_min: 18000,
    budget_max: 28000,
    created_at: new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString(),
    bids: [{ count: 4 }],
  },

  // 4. In progress — work underway
  {
    id: "demo-job-4",
    title: "HVAC System Replacement — 3-Ton Unit",
    description:
      "Replacing 15-year-old Carrier 3-ton split system. Compressor failed last summer and a second unit failure this spring made it clear a full replacement is the right call. Looking for a Carrier or Trane system. Home is 2,400 sq ft, single-story, well-insulated attic. Existing ductwork is in good condition and staying.",
    category: "HVAC",
    location: "Austin, TX 78704",
    status: "in_progress",
    urgency: "high",
    budget_min: 6500,
    budget_max: 10000,
    created_at: new Date(now - 21 * 24 * 60 * 60 * 1000).toISOString(),
    bids: [{ count: 3 }],
  },

  // 5. Completed — project done
  {
    id: "demo-job-5",
    title: "Electrical Panel Upgrade — 100A to 200A",
    description:
      "Upgraded main electrical panel from 100A to 200A service to support a new EV charger, home office addition, and whole-home generator. Required permit and inspection by city. All permits pulled and final inspection passed.",
    category: "Electrical",
    location: "Austin, TX 78704",
    status: "completed",
    urgency: "medium",
    budget_min: 2800,
    budget_max: 4500,
    created_at: new Date(now - 45 * 24 * 60 * 60 * 1000).toISOString(),
    bids: [{ count: 3 }],
  },

  // 6. Another open job — medium urgency, plumbing
  {
    id: "demo-job-6",
    title: "Water Softener & Whole-Home Filtration Install",
    description:
      "Austin has notoriously hard water. Looking to install a salt-based water softener (grain capacity for 4-person household) plus a whole-home carbon filter for taste/odor. Have a utility room adjacent to water heater with available space and drain access. Prefer a system from Kinetico or similar quality brand.",
    category: "Plumbing",
    location: "Austin, TX 78704",
    status: "open",
    urgency: "low",
    budget_min: 2200,
    budget_max: 4000,
    created_at: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
    bids: [{ count: 2 }],
  },
];

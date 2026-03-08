/**
 * Seeded demo jobs — shapes match getHomeownerJobs / getOpenJobs return types.
 */

export const demoJobs = [
  {
    id: "demo-job-1",
    title: "Kitchen Sink Leak Repair",
    description:
      "We have a slow leak under our kitchen sink that has been getting worse. Looking for a licensed plumber to inspect and repair it within the next week.",
    status: "open",
    category: "Plumbing",
    location: "Austin, TX 78704",
    budget_min: 200,
    budget_max: 600,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    homeowner_id: "demo-homeowner-1",
    bids: [{ count: 3 }],
    profiles: { full_name: "Jordan M." },
  },
  {
    id: "demo-job-2",
    title: "HVAC System Diagnosis & Repair",
    description:
      "Central AC running but not cooling the house properly. Airflow feels weak and indoor temps won't drop below 78°F. Need HVAC diagnosis and repair.",
    status: "open",
    category: "HVAC",
    location: "Austin, TX 78745",
    budget_min: 300,
    budget_max: 1200,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    homeowner_id: "demo-homeowner-1",
    bids: [{ count: 5 }],
    profiles: { full_name: "Jordan M." },
  },
  {
    id: "demo-job-3",
    title: "Full Kitchen Remodel",
    description:
      "Full kitchen renovation with new cabinets, countertops, backsplash, and appliances. House is 1960s construction. Looking for experienced remodeling contractor.",
    status: "in_progress",
    category: "Kitchen & Bath",
    location: "Austin, TX 78701",
    budget_min: 18000,
    budget_max: 30000,
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    homeowner_id: "demo-homeowner-1",
    bids: [{ count: 8 }],
    profiles: { full_name: "Jordan M." },
  },
  {
    id: "demo-job-4",
    title: "Wind-Damaged Fence Repair",
    description:
      "Three cedar fence panels were blown down in the last storm. Looking for repair or replacement of damaged sections plus post re-setting.",
    status: "open",
    category: "Fencing",
    location: "Austin, TX 78746",
    budget_min: 400,
    budget_max: 900,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    homeowner_id: "demo-homeowner-2",
    bids: [{ count: 4 }],
    profiles: { full_name: "Casey R." },
  },
  {
    id: "demo-job-5",
    title: "Bathroom Tile Replacement & Waterproofing",
    description:
      "Cracked tiles near shower entry and suspected water intrusion behind the wall. Need full tile replacement, new backer board, and waterproof membrane.",
    status: "open",
    category: "Kitchen & Bath",
    location: "Austin, TX 78731",
    budget_min: 1500,
    budget_max: 3500,
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    homeowner_id: "demo-homeowner-2",
    bids: [{ count: 2 }],
    profiles: { full_name: "Casey R." },
  },
  {
    id: "demo-job-6",
    title: "Garage Door Spring Replacement",
    description:
      "Garage door spring broke and door won't open. Need spring replacement and full safety inspection. Single-car garage.",
    status: "completed",
    category: "Garage Door",
    location: "Austin, TX 78750",
    budget_min: 150,
    budget_max: 350,
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    homeowner_id: "demo-homeowner-3",
    bids: [{ count: 3 }],
    profiles: { full_name: "Alex T." },
  },
];

/** Subset of jobs that belong to the demo homeowner persona */
export const demoHomeownerJobs = demoJobs.slice(0, 3);

/**
 * Demo contractor bid pipeline — what the logged-in contractor sees on their
 * dashboard (/contractors/dashboard). Matches the ActiveBid interface in
 * app/contractors/dashboard/page.tsx.
 */

const now = Date.now();

export interface DemoActiveBid {
  id: string;
  job_id: string;
  jobTitle: string;
  jobDescription: string;
  homeownerLocation: string;
  homeownerName: string;
  bidAmount: number;
  timeline: string;
  message: string;
  status: "open" | "in_progress" | "completed" | "not_selected";
  submittedAt: Date;
  jobBudget: string;
  jobTimeline: string;
  otherBids: number;
  financingAvailable?: boolean;
  imageCount: number;
}

export const demoContractorBids: DemoActiveBid[] = [
  // 1. Won — in progress (accepted bid, work underway)
  {
    id: "cbid-1",
    job_id: "cjob-1",
    jobTitle: "HVAC System Replacement — Carrier 3-Ton",
    jobDescription:
      "Replace aging 3-ton Carrier split system. Homeowner reports compressor failure. Existing ductwork in good condition. Single-story 2,200 sq ft home.",
    homeownerLocation: "Austin, TX 78745",
    homeownerName: "Sarah K.",
    bidAmount: 7850,
    timeline: "2–3 business days",
    message:
      "Hi Sarah — we can have a Carrier Performance Series 16 SEER system installed within 2–3 days of signing. Price includes permit, city inspection, and a 2-year labor warranty on top of the 10-year manufacturer warranty.",
    status: "in_progress",
    submittedAt: new Date(now - 18 * 24 * 60 * 60 * 1000),
    jobBudget: "$6,000 - $9,500",
    jobTimeline: "ASAP",
    otherBids: 3,
    financingAvailable: true,
    imageCount: 2,
  },
  // 2. Awaiting response — bid submitted, homeowner reviewing
  {
    id: "cbid-2",
    job_id: "cjob-2",
    jobTitle: "Water Heater Replacement — 50-Gal Gas",
    jobDescription:
      "Existing 50-gallon gas water heater is 11 years old and has begun leaking from the base. Looking for energy-efficient replacement, preferably hybrid or high-efficiency gas.",
    homeownerLocation: "Round Rock, TX 78681",
    homeownerName: "Mike R.",
    bidAmount: 2400,
    timeline: "1–2 business days",
    message:
      "Mike — we recommend a Rheem Performance Platinum 50-gal high-efficiency gas unit (0.70 UEF). Includes haul-off of the old unit, all fittings, and code-required seismic strap. We can be there Thursday or Friday.",
    status: "open",
    submittedAt: new Date(now - 3 * 24 * 60 * 60 * 1000),
    jobBudget: "$1,800 - $3,200",
    jobTimeline: "This week",
    otherBids: 4,
    financingAvailable: false,
    imageCount: 1,
  },
  // 3. Awaiting response — bid under review (homeowner viewed bid)
  {
    id: "cbid-3",
    job_id: "cjob-3",
    jobTitle: "Main Sewer Line Inspection & Cleaning",
    jobDescription:
      "Slow drains throughout the house. Suspect partial root intrusion in the main sewer line. Need camera inspection and hydro-jetting if confirmed.",
    homeownerLocation: "Cedar Park, TX 78613",
    homeownerName: "Jennifer T.",
    bidAmount: 850,
    timeline: "Next business day",
    message:
      "Jennifer — our camera inspection includes a full digital report with video footage you can share with your insurance if needed. If we find root intrusion, hydro-jetting is included in this price. No surprises.",
    status: "open",
    submittedAt: new Date(now - 1 * 24 * 60 * 60 * 1000),
    jobBudget: "$500 - $1,200",
    jobTimeline: "ASAP",
    otherBids: 2,
    financingAvailable: false,
    imageCount: 0,
  },
  // 4. Completed — job done, payment released
  {
    id: "cbid-4",
    job_id: "cjob-4",
    jobTitle: "Bathroom Exhaust Fan Replacement (3 units)",
    jobDescription:
      "Replace three builder-grade exhaust fans with Broan NuTone quiet fans. Two full baths, one half bath. Wiring and ceiling boxes are existing.",
    homeownerLocation: "Austin, TX 78731",
    homeownerName: "Rachel W.",
    bidAmount: 680,
    timeline: "Same day",
    message:
      "We'll install Broan 110 CFM ultra-quiet fans in all three bathrooms. In and out in about 3 hours.",
    status: "completed",
    submittedAt: new Date(now - 30 * 24 * 60 * 60 * 1000),
    jobBudget: "$400 - $900",
    jobTimeline: "Flexible",
    otherBids: 5,
    financingAvailable: false,
    imageCount: 0,
  },
  // 5. Not selected — lost bid
  {
    id: "cbid-5",
    job_id: "cjob-5",
    jobTitle: "Electrical Panel Upgrade — 100A to 200A",
    jobDescription:
      "Need panel upgrade for EV charger addition. House built in 1988, current panel is full.",
    homeownerLocation: "Pflugerville, TX 78660",
    homeownerName: "David L.",
    bidAmount: 3600,
    timeline: "2 business days",
    message:
      "We can handle the full upgrade including permit and inspection.",
    status: "not_selected",
    submittedAt: new Date(now - 22 * 24 * 60 * 60 * 1000),
    jobBudget: "$2,500 - $4,500",
    jobTimeline: "2–3 weeks",
    otherBids: 6,
    financingAvailable: false,
    imageCount: 1,
  },
  // 6. Completed — older win
  {
    id: "cbid-6",
    job_id: "cjob-6",
    jobTitle: "Garbage Disposal Replacement & Dishwasher Install",
    jobDescription:
      "Old disposal seized. Also need new dishwasher installed — appliance provided by homeowner.",
    homeownerLocation: "Austin, TX 78759",
    homeownerName: "Emily B.",
    bidAmount: 475,
    timeline: "Same day",
    message:
      "We carry InSinkErator Evolution Compact disposals in our van. Can knock out both the disposal and dishwasher install in one visit.",
    status: "completed",
    submittedAt: new Date(now - 52 * 24 * 60 * 60 * 1000),
    jobBudget: "$300 - $600",
    jobTimeline: "This week",
    otherBids: 3,
    financingAvailable: false,
    imageCount: 0,
  },
];

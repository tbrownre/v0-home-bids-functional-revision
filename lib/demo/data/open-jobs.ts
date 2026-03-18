/**
 * Demo open jobs — what the contractor sees in the jobs marketplace
 * (/contractors/jobs). Matches the AvailableJob interface in
 * app/contractors/jobs/page.tsx.
 */

const now = Date.now();

export interface DemoOpenJob {
  id: string;
  title: string;
  description: string;
  location: string;
  budget: string;
  timeline: string;
  postedAt: Date;
  category: string;
  urgency: "low" | "medium" | "high";
  bidsCount: number;
  homeownerName: string;
  propertyType: string;
  preferredContact: string;
  imageCount: number;
}

export const demoOpenJobs: DemoOpenJob[] = [
  {
    id: "oj-1",
    title: "AC Unit Not Cooling — 2,100 sq ft Home",
    description:
      "Central AC running but house won't cool below 78°F even when set to 68°F. Unit is a Lennox 3-ton, about 9 years old. Last serviced 2 years ago. Looking for diagnosis — if it's a refrigerant issue we want it fixed immediately, it's summer in Austin.",
    location: "Austin, TX 78704",
    budget: "$300 - $900",
    timeline: "ASAP",
    postedAt: new Date(now - 1.5 * 60 * 60 * 1000),
    category: "HVAC",
    urgency: "high",
    bidsCount: 2,
    homeownerName: "Jennifer M.",
    propertyType: "Single Family Home",
    preferredContact: "Phone or Text",
    imageCount: 2,
  },
  {
    id: "oj-2",
    title: "Full Roof Replacement — Storm Damage (Insurance Approved)",
    description:
      "Significant hail and wind damage from last month's storm. Insurance adjuster has approved full replacement — check for $14,200 already issued. Looking for a contractor familiar with working alongside insurance companies. Roof is 2,600 sq ft of architectural shingles. Two-story home.",
    location: "Round Rock, TX 78681",
    budget: "TBD — Insurance Paid (~$14,200)",
    timeline: "2–4 weeks",
    postedAt: new Date(now - 4 * 60 * 60 * 1000),
    category: "Roofing",
    urgency: "high",
    bidsCount: 3,
    homeownerName: "Robert K.",
    propertyType: "Single Family Home",
    preferredContact: "Email",
    imageCount: 6,
  },
  {
    id: "oj-3",
    title: "Tankless Water Heater Installation",
    description:
      "Want to switch from a 40-gallon tank unit to a Rinnai RU160iN or equivalent whole-home tankless gas water heater. Three bathrooms, two adults. Gas line and venting will likely need modification. Interested in quotes for both the unit and full installation.",
    location: "Cedar Park, TX 78613",
    budget: "$2,800 - $5,500",
    timeline: "1–3 weeks",
    postedAt: new Date(now - 7 * 60 * 60 * 1000),
    category: "Plumbing",
    urgency: "medium",
    bidsCount: 4,
    homeownerName: "Amanda S.",
    propertyType: "Single Family Home",
    preferredContact: "Phone",
    imageCount: 1,
  },
  {
    id: "oj-4",
    title: "Ecobee Smart Thermostat Installation & Zoning Setup",
    description:
      "Two-story home with a single thermostat upstairs. Want to install a new Ecobee SmartThermostat Premium downstairs and set up basic zoning. Currently have a single Carrier system. Wiring accessible through attic. Homeowner has purchased the thermostat already.",
    location: "Pflugerville, TX 78660",
    budget: "$150 - $350",
    timeline: "Flexible",
    postedAt: new Date(now - 10 * 60 * 60 * 1000),
    category: "HVAC",
    urgency: "low",
    bidsCount: 1,
    homeownerName: "Chris L.",
    propertyType: "Townhouse",
    preferredContact: "Text",
    imageCount: 0,
  },
  {
    id: "oj-5",
    title: "Gutter Replacement — 220 Linear Feet",
    description:
      "Existing gutters are 20+ years old, pulling away from fascia in several spots and have multiple rust holes. Want seamless aluminum gutters (6-inch K-style) with leaf guards installed throughout. Two-story home. Includes downspout replacement and underground drainage extensions at two corners.",
    location: "Austin, TX 78745",
    budget: "$2,500 - $4,500",
    timeline: "This month",
    postedAt: new Date(now - 22 * 60 * 60 * 1000),
    category: "Roofing",
    urgency: "low",
    bidsCount: 5,
    homeownerName: "Patricia W.",
    propertyType: "Single Family Home",
    preferredContact: "Email",
    imageCount: 4,
  },
  {
    id: "oj-6",
    title: "200A Panel Upgrade + EV Charger Circuit",
    description:
      "House is still on 100A service from 1979. Planning to add a Level 2 EV charger (NEMA 14-50 outlet at garage), home office subpanel, and eventually a whole-home generator connection. Need the full panel upgrade done correctly with room to grow. Permit required.",
    location: "Austin, TX 78731",
    budget: "$3,500 - $5,500",
    timeline: "2–4 weeks",
    postedAt: new Date(now - 5 * 60 * 60 * 1000),
    category: "Electrical",
    urgency: "medium",
    bidsCount: 2,
    homeownerName: "Michael T.",
    propertyType: "Single Family Home",
    preferredContact: "Phone",
    imageCount: 1,
  },
  {
    id: "oj-7",
    title: "Master Bath Faucet + Toilet Replacement",
    description:
      "Replace master bath faucet (single-hole, brushed nickel preferred) and toilet (comfort height, elongated bowl). Homeowner will supply fixtures — just need professional installation. Shutoff valves may need replacing as well.",
    location: "Lakeway, TX 78734",
    budget: "$350 - $600",
    timeline: "Flexible",
    postedAt: new Date(now - 17 * 60 * 60 * 1000),
    category: "Plumbing",
    urgency: "low",
    bidsCount: 6,
    homeownerName: "Linda B.",
    propertyType: "Single Family Home",
    preferredContact: "Text",
    imageCount: 2,
  },
  {
    id: "oj-8",
    title: "HVAC Annual Tune-Up & Filter Change (2 Units)",
    description:
      "Two-story home with two separate HVAC systems — upstairs 2-ton and downstairs 3-ton, both Trane, both about 5 years old. Looking for a reliable company for annual tune-up, coil cleaning, refrigerant check, and filter replacement on both units. Want to establish an ongoing maintenance relationship.",
    location: "Georgetown, TX 78626",
    budget: "$200 - $350",
    timeline: "Next 2 weeks",
    postedAt: new Date(now - 28 * 60 * 60 * 1000),
    category: "HVAC",
    urgency: "low",
    bidsCount: 7,
    homeownerName: "David R.",
    propertyType: "Single Family Home",
    preferredContact: "Email",
    imageCount: 0,
  },
  {
    id: "oj-9",
    title: "Kitchen Drain & Dishwasher Not Draining",
    description:
      "Kitchen sink drains slowly and the dishwasher isn't draining fully after cycles. Tried drain cleaner — no improvement. Suspect a shared drain line issue or a blocked P-trap. Condo unit on the 3rd floor, so access is through a cabinet under the sink.",
    location: "Austin, TX 78759",
    budget: "$150 - $350",
    timeline: "ASAP",
    postedAt: new Date(now - 45 * 60 * 1000),
    category: "Plumbing",
    urgency: "high",
    bidsCount: 1,
    homeownerName: "Nancy H.",
    propertyType: "Condo",
    preferredContact: "Phone",
    imageCount: 1,
  },
  {
    id: "oj-10",
    title: "4 Ceiling Fan Installations (Fans Provided)",
    description:
      "Installing 4 ceiling fans in master bedroom, two secondary bedrooms, and living room. All ceiling boxes are rated for fan support. Homeowner has already purchased Hunter fans. Need licensed electrician for installation and switch wiring.",
    location: "Bee Cave, TX 78738",
    budget: "$400 - $650",
    timeline: "1–2 weeks",
    postedAt: new Date(now - 34 * 60 * 60 * 1000),
    category: "Electrical",
    urgency: "low",
    bidsCount: 4,
    homeownerName: "Steve G.",
    propertyType: "Single Family Home",
    preferredContact: "Text",
    imageCount: 0,
  },
  {
    id: "oj-11",
    title: "Hail Damage Roof Repair — Partial Replacement",
    description:
      "Large hail from the last storm damaged about 40% of the roof — mostly the south-facing slope. Insurance is covering a partial replacement. Need a contractor who can match existing shingles (Owens Corning Teak) and work with the adjuster's supplement process if needed.",
    location: "Round Rock, TX 78664",
    budget: "Insurance Partial (~$6,400)",
    timeline: "3–5 weeks",
    postedAt: new Date(now - 3 * 60 * 60 * 1000),
    category: "Roofing",
    urgency: "high",
    bidsCount: 1,
    homeownerName: "Karen D.",
    propertyType: "Single Family Home",
    preferredContact: "Phone",
    imageCount: 5,
  },
  {
    id: "oj-12",
    title: "Whole-Home Re-Pipe — 1970s Galvanized Pipe",
    description:
      "House is original 1974 construction with galvanized steel pipes throughout. Water pressure has dropped significantly, and we've had two leaks in the past year. Looking to re-pipe the entire home with PEX. Three bathrooms, two water closets, kitchen, laundry, and irrigation feed. Approx. 2,100 sq ft single-story.",
    location: "Austin, TX 78723",
    budget: "$8,500 - $14,000",
    timeline: "2–4 weeks",
    postedAt: new Date(now - 11 * 60 * 60 * 1000),
    category: "Plumbing",
    urgency: "medium",
    bidsCount: 3,
    homeownerName: "Thomas H.",
    propertyType: "Single Family Home",
    preferredContact: "Phone",
    imageCount: 3,
  },
];

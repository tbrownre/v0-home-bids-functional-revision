/**
 * Seeded demo bids — shapes match getContractorBids return type.
 */

export const demoBids = [
  {
    id: "demo-bid-1",
    job_id: "demo-job-1",
    contractor_id: "demo-contractor-1",
    amount: 380,
    message:
      "I can have this fixed within 48 hours. I carry all common P-trap and shutoff valve parts on my truck, so the repair will likely be same-visit.",
    timeline: "1-2 days",
    status: "pending",
    created_at: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    jobs: {
      title: "Kitchen Sink Leak Repair",
      description:
        "We have a slow leak under our kitchen sink that has been getting worse.",
      category: "Plumbing",
      location: "Austin, TX 78704",
      status: "open",
      budget_min: 200,
      budget_max: 600,
    },
  },
  {
    id: "demo-bid-2",
    job_id: "demo-job-2",
    contractor_id: "demo-contractor-1",
    amount: 850,
    message:
      "Happy to come out for a free diagnostic. Most likely a refrigerant recharge or blower motor issue — both are same-day fixes for me.",
    timeline: "Same day if parts in stock",
    status: "pending",
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    jobs: {
      title: "HVAC System Diagnosis & Repair",
      description:
        "Central AC running but not cooling the house properly.",
      category: "HVAC",
      location: "Austin, TX 78745",
      status: "open",
      budget_min: 300,
      budget_max: 1200,
    },
  },
  {
    id: "demo-bid-3",
    job_id: "demo-job-4",
    contractor_id: "demo-contractor-1",
    amount: 620,
    message:
      "I can replace the 3 broken panels and reset the leaning post. Price includes materials (cedar to match) and haul-away of old panels.",
    timeline: "3-4 days",
    status: "accepted",
    created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    jobs: {
      title: "Wind-Damaged Fence Repair",
      description: "Three cedar fence panels were blown down in the last storm.",
      category: "Fencing",
      location: "Austin, TX 78746",
      status: "in_progress",
      budget_min: 400,
      budget_max: 900,
    },
  },
  {
    id: "demo-bid-4",
    job_id: "demo-job-5",
    contractor_id: "demo-contractor-1",
    amount: 2400,
    message:
      "I specialize in wet area tile work. Scope includes full demo, Schluter membrane, Ditra heat mat option, and matching tile set.",
    timeline: "5-7 days",
    status: "rejected",
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    jobs: {
      title: "Bathroom Tile Replacement & Waterproofing",
      description: "Cracked tiles near shower entry and suspected water intrusion.",
      category: "Kitchen & Bath",
      location: "Austin, TX 78731",
      status: "open",
      budget_min: 1500,
      budget_max: 3500,
    },
  },
  {
    id: "demo-bid-5",
    job_id: "demo-job-6",
    contractor_id: "demo-contractor-1",
    amount: 285,
    message:
      "Spring replacement takes about 1 hour. I include a full 12-point safety check at no extra charge.",
    timeline: "Same day",
    status: "completed",
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    jobs: {
      title: "Garage Door Spring Replacement",
      description: "Garage door spring broke and door won't open.",
      category: "Garage Door",
      location: "Austin, TX 78750",
      status: "completed",
      budget_min: 150,
      budget_max: 350,
    },
  },
];

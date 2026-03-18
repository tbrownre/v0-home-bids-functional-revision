// Shared notification data store for both homeowners and contractors

export type NotificationType =
  | "bid_received"
  | "bid_accepted"
  | "bid_not_selected"
  | "bid_updated"
  | "bid_viewed"
  | "contractor_message"
  | "homeowner_message"
  | "payment_released"
  | "job_milestone";

export interface InboxNotification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  timestamp: Date;
  read: boolean;
  jobId: string;
  jobTitle: string;
  /** Name of the other party (contractor for homeowner, homeowner for contractor) */
  fromName: string;
  /** Optional dollar amount for bid/payment notifications */
  amount?: number;
  /** Link to navigate to on click */
  href: string;
}

// -- Homeowner notifications (seeded to match the 6 demo jobs) --

const homeownerNotifications: InboxNotification[] = [
  {
    id: "hn1",
    type: "bid_received",
    title: "New bid received",
    description: "Crafted Interiors Co. submitted a bid of $11,400 on your Kitchen Cabinet Replacement job.",
    timestamp: new Date(Date.now() - 12 * 60 * 1000),
    read: false,
    jobId: "demo-job-1",
    jobTitle: "Kitchen Remodel — Cabinet Replacement",
    fromName: "Crafted Interiors Co.",
    amount: 11400,
    href: "/jobs/demo-job-1/bids?bidId=bid-1-1",
  },
  {
    id: "hn2",
    type: "bid_received",
    title: "5 bids on your roof replacement",
    description: "Your Roof Replacement job has 5 bids. The lowest is $9,800 from ABC Roofing & Construction. Summit Roofing Pros is the highest-rated.",
    timestamp: new Date(Date.now() - 40 * 60 * 1000),
    read: false,
    jobId: "demo-job-2",
    jobTitle: "Full Roof Replacement — 2,800 sq ft",
    fromName: "Summit Roofing Pros",
    amount: 12800,
    href: "/jobs/demo-job-2/bids?bidId=bid-2-1",
  },
  {
    id: "hn3",
    type: "bid_received",
    title: "New bid received",
    description: "H2O Home Solutions submitted a bid of $2,700 on your Water Softener installation job.",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    read: false,
    jobId: "demo-job-6",
    jobTitle: "Water Softener & Whole-Home Filtration Install",
    fromName: "H2O Home Solutions",
    amount: 2700,
    href: "/jobs/demo-job-6/bids?bidId=bid-6-2",
  },
  {
    id: "hn4",
    type: "bid_updated",
    title: "Bid updated",
    description: "Blue Sky Contractors revised their roofing bid to $11,600 (was $12,100). They added a dedicated claims specialist.",
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
    read: true,
    jobId: "demo-job-2",
    jobTitle: "Full Roof Replacement — 2,800 sq ft",
    fromName: "Blue Sky Contractors",
    amount: 11600,
    href: "/jobs/demo-job-2/bids?bidId=bid-2-5",
  },
  {
    id: "hn5",
    type: "contractor_message",
    title: "New message from ProFix Home Services",
    description: "ProFix Home Services asked about your Master Bathroom Renovation: 'Would you like us to bring tile samples from our showroom to your home?'",
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
    read: true,
    jobId: "demo-job-3",
    jobTitle: "Master Bathroom Renovation",
    fromName: "ProFix Home Services",
    href: "/jobs/demo-job-3/bids?bidId=bid-3-1&action=chat",
  },
  {
    id: "hn6",
    type: "job_milestone",
    title: "Job in progress",
    description: "AirFlow HVAC Solutions has started work on your HVAC System Replacement. Estimated completion: 2–3 days.",
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    read: true,
    jobId: "demo-job-4",
    jobTitle: "HVAC System Replacement — 3-Ton Unit",
    fromName: "AirFlow HVAC Solutions",
    href: "/jobs/demo-job-4/bids?bidId=bid-4-1",
  },
  {
    id: "hn7",
    type: "job_milestone",
    title: "Job completed",
    description: "Volt Electric Co. has completed your Electrical Panel Upgrade. Permit inspection passed. Please leave a review.",
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    read: true,
    jobId: "demo-job-5",
    jobTitle: "Electrical Panel Upgrade — 100A to 200A",
    fromName: "Volt Electric Co.",
    href: "/jobs/demo-job-5/bids?bidId=bid-5-1",
  },
];

// -- Contractor notifications (seeded to match the demo contractor bid pipeline) --

const contractorNotifications: InboxNotification[] = [
  {
    id: "cn1",
    type: "bid_accepted",
    title: "Bid accepted — work awarded",
    description: "Sarah K. accepted your bid of $7,850 on HVAC System Replacement. You're scheduled to start within the week.",
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    read: false,
    jobId: "cjob-1",
    jobTitle: "HVAC System Replacement — Carrier 3-Ton",
    fromName: "Sarah K.",
    amount: 7850,
    href: "/contractors/dashboard?bidId=cbid-1",
  },
  {
    id: "cn2",
    type: "homeowner_message",
    title: "New message from homeowner",
    description: "Mike R. sent a message about Water Heater Replacement: 'Can you confirm Thursday morning still works for the installation?'",
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
    read: false,
    jobId: "cjob-2",
    jobTitle: "Water Heater Replacement — 50-Gal Gas",
    fromName: "Mike R.",
    href: "/contractors/dashboard?bidId=cbid-2&action=chat",
  },
  {
    id: "cn3",
    type: "bid_viewed",
    title: "Bid viewed",
    description: "Jennifer T. viewed your bid of $850 on Main Sewer Line Inspection & Cleaning. You're one of 2 bidders — strong position.",
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
    read: false,
    jobId: "cjob-3",
    jobTitle: "Main Sewer Line Inspection & Cleaning",
    fromName: "Jennifer T.",
    amount: 850,
    href: "/contractors/dashboard?bidId=cbid-3",
  },
  {
    id: "cn4",
    type: "payment_released",
    title: "Payment released",
    description: "Payment of $680 has been released for Bathroom Exhaust Fan Replacement. Funds will arrive in 1–2 business days.",
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    read: true,
    jobId: "cjob-4",
    jobTitle: "Bathroom Exhaust Fan Replacement (3 units)",
    fromName: "Rachel W.",
    amount: 680,
    href: "/contractors/dashboard?bidId=cbid-4",
  },
  {
    id: "cn5",
    type: "bid_not_selected",
    title: "Bid not selected",
    description: "David L. selected another contractor for Electrical Panel Upgrade — 100A to 200A. Keep bidding on new jobs!",
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
    read: true,
    jobId: "cjob-5",
    jobTitle: "Electrical Panel Upgrade — 100A to 200A",
    fromName: "David L.",
    href: "/contractors/jobs",
  },
  {
    id: "cn6",
    type: "homeowner_message",
    title: "New message from homeowner",
    description: "Jennifer T. replied about the Sewer Line job: 'Do you have availability tomorrow afternoon?'",
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    read: true,
    jobId: "cjob-3",
    jobTitle: "Main Sewer Line Inspection & Cleaning",
    fromName: "Jennifer T.",
    href: "/contractors/dashboard?bidId=cbid-3&action=chat",
  },
  {
    id: "cn7",
    type: "payment_released",
    title: "Payment released",
    description: "Payment of $475 has been released for Garbage Disposal Replacement & Dishwasher Install. Funds will arrive in 1–2 business days.",
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    read: true,
    jobId: "cjob-6",
    jobTitle: "Garbage Disposal Replacement & Dishwasher Install",
    fromName: "Emily B.",
    amount: 475,
    href: "/contractors/dashboard?bidId=cbid-6",
  },
  {
    id: "cn8",
    type: "bid_accepted",
    title: "Job in progress",
    description: "Sarah K.'s HVAC job status has been updated to In Progress. Ensure the permit is pulled before work begins.",
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    read: true,
    jobId: "cjob-1",
    jobTitle: "HVAC System Replacement — Carrier 3-Ton",
    fromName: "Sarah K.",
    amount: 7850,
    href: "/contractors/dashboard?bidId=cbid-1",
  },
];

// -- Store with reactive state --
// Snapshots must be referentially stable to avoid infinite loops with useSyncExternalStore.
// We cache derived values and only recompute when the underlying state changes.

type Listener = () => void;
const listeners = new Set<Listener>();

let homeownerState = [...homeownerNotifications];
let contractorState = [...contractorNotifications];

// Cached snapshots -- updated only when state changes
let cachedHomeownerUnread = homeownerState.filter((n) => !n.read).length;
let cachedContractorUnread = contractorState.filter((n) => !n.read).length;

function recomputeCache() {
  cachedHomeownerUnread = homeownerState.filter((n) => !n.read).length;
  cachedContractorUnread = contractorState.filter((n) => !n.read).length;
}

function notify() {
  recomputeCache();
  for (const listener of listeners) listener();
}

export function getNotifications(isContractor: boolean): InboxNotification[] {
  return isContractor ? contractorState : homeownerState;
}

export function getUnreadCount(isContractor: boolean): number {
  return isContractor ? cachedContractorUnread : cachedHomeownerUnread;
}

// Stable snapshot getters for useSyncExternalStore (return the same reference if unchanged)
export function getHomeownerNotificationsSnapshot() {
  return homeownerState;
}
export function getContractorNotificationsSnapshot() {
  return contractorState;
}
export function getHomeownerUnreadSnapshot() {
  return cachedHomeownerUnread;
}
export function getContractorUnreadSnapshot() {
  return cachedContractorUnread;
}

export function markAsRead(id: string, isContractor: boolean) {
  if (isContractor) {
    contractorState = contractorState.map((n) => (n.id === id ? { ...n, read: true } : n));
  } else {
    homeownerState = homeownerState.map((n) => (n.id === id ? { ...n, read: true } : n));
  }
  notify();
}

export function markAllAsRead(isContractor: boolean) {
  if (isContractor) {
    contractorState = contractorState.map((n) => ({ ...n, read: true }));
  } else {
    homeownerState = homeownerState.map((n) => ({ ...n, read: true }));
  }
  notify();
}

export function subscribeInbox(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

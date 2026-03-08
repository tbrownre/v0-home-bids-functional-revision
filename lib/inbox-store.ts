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

// -- Homeowner notifications (seeded with realistic data matching existing jobs) --

const homeownerNotifications: InboxNotification[] = [
  {
    id: "hn1",
    type: "bid_received",
    title: "New bid received",
    description: "ABC Plumbing & Roofing submitted a bid of $4,200 on your Bathroom Renovation job.",
    timestamp: new Date(Date.now() - 12 * 60 * 1000),
    read: false,
    jobId: "job-bath",
    jobTitle: "Bathroom Renovation",
    fromName: "ABC Plumbing & Roofing",
    amount: 4200,
    href: "/jobs/job-bath/bids?bidId=1",
  },
  {
    id: "hn2",
    type: "contractor_message",
    title: "New message from contractor",
    description: "ProFix Home Services sent you a message about your Kitchen Remodel job: 'Hi, I had a question about the cabinet dimensions...'",
    timestamp: new Date(Date.now() - 45 * 60 * 1000),
    read: false,
    jobId: "job-kitchen",
    jobTitle: "Kitchen Remodel",
    fromName: "ProFix Home Services",
    href: "/jobs/job-kitchen/bids?bidId=2&action=chat",
  },
  {
    id: "hn3",
    type: "bid_received",
    title: "New bid received",
    description: "Lone Star Exteriors submitted a bid of $2,600 on your Water Heater Replacement job.",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    read: false,
    jobId: "job-heater",
    jobTitle: "Water Heater Replacement",
    fromName: "Lone Star Exteriors",
    amount: 2600,
    href: "/jobs/job-heater/bids?bidId=5",
  },
  {
    id: "hn4",
    type: "bid_updated",
    title: "Bid updated",
    description: "Summit Roofing Pros revised their bid to $7,800 on your Roof Replacement job (was $8,200).",
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
    read: true,
    jobId: "job-roof",
    jobTitle: "Roof Replacement",
    fromName: "Summit Roofing Pros",
    amount: 7800,
    href: "/jobs/job-roof/bids?bidId=4",
  },
  {
    id: "hn5",
    type: "bid_received",
    title: "3 new bids on your job",
    description: "Your Fence Installation job has received 3 new bids. The lowest is $3,400 from Quality Home Co.",
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
    read: true,
    jobId: "job-fence",
    jobTitle: "Fence Installation",
    fromName: "Quality Home Co.",
    amount: 3400,
    href: "/jobs/job-fence/bids?bidId=3",
  },
  {
    id: "hn6",
    type: "contractor_message",
    title: "New message from contractor",
    description: "Blue Sky Contractors asked about your AC Not Cooling job: 'What brand is your current unit?'",
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    read: true,
    jobId: "job-ac",
    jobTitle: "AC Not Cooling",
    fromName: "Blue Sky Contractors",
    href: "/jobs/job-ac/bids?bidId=6&action=chat",
  },
  {
    id: "hn7",
    type: "job_milestone",
    title: "Job completed",
    description: "Garage Door Spring Replacement has been marked as completed by Hill Country Roofing. Please leave a review.",
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    read: true,
    jobId: "job-garage",
    jobTitle: "Garage Door Spring Replacement",
    fromName: "Hill Country Roofing",
    href: "/jobs/job-garage/bids?bidId=8",
  },
];

// -- Contractor notifications (seeded with data matching sampleActiveBids) --

const contractorNotifications: InboxNotification[] = [
  {
    id: "cn1",
    type: "bid_accepted",
    title: "Bid accepted",
    description: "Sarah K. accepted your bid of $25,000 on Kitchen Remodel - Full Renovation. You can now begin scheduling.",
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    read: false,
    jobId: "aj2",
    jobTitle: "Kitchen Remodel - Full Renovation",
    fromName: "Sarah K.",
    amount: 25000,
    href: "/contractors/jobs?jobId=aj2",
  },
  {
    id: "cn2",
    type: "homeowner_message",
    title: "New message from homeowner",
    description: "Mike R. sent you a message about HVAC System Installation: 'Can you come by tomorrow for an initial assessment?'",
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
    read: false,
    jobId: "aj1",
    jobTitle: "HVAC System Installation",
    fromName: "Mike R.",
    href: "/contractors/jobs?jobId=aj1&action=chat",
  },
  {
    id: "cn3",
    type: "bid_viewed",
    title: "Bid viewed",
    description: "John M. viewed your bid of $8,500 on Roof Replacement - 2000 sq ft. You're one of 6 bidders.",
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
    read: false,
    jobId: "aj2",
    jobTitle: "Roof Replacement - 2000 sq ft",
    fromName: "John M.",
    amount: 8500,
    href: "/contractors/jobs?jobId=aj2",
  },
  {
    id: "cn4",
    type: "payment_released",
    title: "Payment released",
    description: "Payment of $450 has been released for Garage Door Spring Replacement. Funds will arrive in 1-2 business days.",
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    read: true,
    jobId: "aj5",
    jobTitle: "Garage Door Spring Replacement",
    fromName: "Tom B.",
    amount: 450,
    href: "/contractors/jobs?jobId=aj5",
  },
  {
    id: "cn5",
    type: "bid_not_selected",
    title: "Bid not selected",
    description: "David L. selected another contractor for Fence Installation - 150 ft. Keep bidding on new jobs!",
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
    read: true,
    jobId: "aj4",
    jobTitle: "Fence Installation - 150 ft",
    fromName: "David L.",
    href: "/contractors/jobs",
  },
  {
    id: "cn6",
    type: "homeowner_message",
    title: "New message from homeowner",
    description: "Emily T. sent a message about Bathroom Renovation: 'The tile samples arrived, can we discuss options?'",
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    read: true,
    jobId: "aj3",
    jobTitle: "Bathroom Renovation",
    fromName: "Emily T.",
    href: "/contractors/jobs?jobId=aj3&action=chat",
  },
  {
    id: "cn7",
    type: "payment_released",
    title: "Payment released",
    description: "Payment of $2,800 has been released for Water Heater Replacement. Funds will arrive in 1-2 business days.",
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    read: true,
    jobId: "aj3",
    jobTitle: "Water Heater Replacement",
    fromName: "Linda G.",
    amount: 2800,
    href: "/contractors/jobs?jobId=aj3",
  },
  {
    id: "cn8",
    type: "bid_accepted",
    title: "Bid accepted",
    description: "Rachel W. accepted your bid of $3,800 on Deck Repair & Staining. Review the project details and confirm your start date.",
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    read: true,
    jobId: "aj4",
    jobTitle: "Deck Repair & Staining",
    fromName: "Rachel W.",
    amount: 3800,
    href: "/contractors/jobs?jobId=aj4",
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

/**
 * Push a new notification into the store at runtime.
 * Used by the demo timeline hook and the demo control panel.
 *
 * @param notification  The notification to prepend to the list.
 * @param isContractor  When true, adds to contractor inbox; otherwise homeowner.
 */
export function addNotification(notification: InboxNotification, isContractor: boolean) {
  if (isContractor) {
    contractorState = [notification, ...contractorState];
  } else {
    homeownerState = [notification, ...homeownerState];
  }
  notify();
}

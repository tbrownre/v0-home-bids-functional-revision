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

// -- Homeowner notifications (seeded empty) --

const homeownerNotifications: InboxNotification[] = [];

// -- Contractor notifications (seeded empty) --

const contractorNotifications: InboxNotification[] = [];

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

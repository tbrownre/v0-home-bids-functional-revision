// Shared auth state that persists across navigation AND full page reloads.
// Uses sessionStorage for persistence + module-level singleton for useSyncExternalStore.

type UserType = "homeowner" | "contractor" | null;
type Listener = () => void;

const AUTH_KEY = "homebids_auth_user";

function readFromSession(): UserType {
  if (typeof window === "undefined") return null;
  const stored = sessionStorage.getItem(AUTH_KEY);
  if (stored === "homeowner" || stored === "contractor") return stored;
  return null;
}

function writeToSession(user: UserType) {
  if (typeof window === "undefined") return;
  if (user) {
    sessionStorage.setItem(AUTH_KEY, user);
  } else {
    sessionStorage.removeItem(AUTH_KEY);
  }
}

const listeners = new Set<Listener>();

// Initialize from sessionStorage so state survives full page reloads
let currentUser: UserType = readFromSession();

function notify() {
  for (const listener of listeners) listener();
}

export function signIn(type: "homeowner" | "contractor") {
  currentUser = type;
  writeToSession(type);
  notify();
}

export function signOut() {
  currentUser = null;
  writeToSession(null);
  notify();
}

export function getAuthSnapshot(): UserType {
  return currentUser;
}

export function subscribeAuth(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Derived stable getters
export function getIsSignedInSnapshot(): boolean {
  return currentUser !== null;
}

export function getIsContractorSnapshot(): boolean {
  return currentUser === "contractor";
}

export function getIsHomeownerSnapshot(): boolean {
  return currentUser === "homeowner";
}

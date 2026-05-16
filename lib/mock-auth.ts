/**
 * mock-auth.ts
 *
 * Self-contained mock authentication system.
 * Replaces all Supabase auth calls so the site runs as a standalone demo
 * with no backend dependency.
 *
 * Storage: sessionStorage (cleared when the tab closes, never persists across
 * devices — safe for demo use). Falls back to an in-memory store on SSR.
 */

export const USE_MOCK_DATA = true;

// ── Mock users ────────────────────────────────────────────────────────────────

export type MockRole = "homeowner" | "contractor" | "admin";

export interface MockUser {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  role: MockRole;
}

export const MOCK_USERS: Record<string, MockUser> = {
  "homeowner@homebids.demo": {
    id: "mock-homeowner-001",
    email: "homeowner@homebids.demo",
    name: "Sarah Johnson",
    firstName: "Sarah",
    lastName: "Johnson",
    role: "homeowner",
  },
  "contractor@homebids.demo": {
    id: "mock-contractor-001",
    email: "contractor@homebids.demo",
    name: "Mike Rodriguez",
    firstName: "Mike",
    lastName: "Rodriguez",
    role: "contractor",
  },
  "admin@homebids.demo": {
    id: "mock-admin-001",
    email: "admin@homebids.demo",
    name: "Tim Brown",
    firstName: "Tim",
    lastName: "Brown",
    role: "admin",
  },
};

// Also accept the legacy Supabase demo emails so existing bookmarks keep working
const EMAIL_ALIASES: Record<string, string> = {
  "demo.homeowner@homebids.io": "homeowner@homebids.demo",
  "demo.contractor@homebids.io": "contractor@homebids.demo",
};

// Common demo password — any password is accepted in mock mode
export const MOCK_PASSWORD = "demo";

const SESSION_KEY = "hb_mock_session";

// In-memory fallback for SSR / environments without sessionStorage
let _memorySession: MockUser | null = null;

function isClient() {
  return typeof window !== "undefined";
}

// ── Session helpers ───────────────────────────────────────────────────────────

export function getMockSession(): MockUser | null {
  if (!isClient()) return _memorySession;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as MockUser;
  } catch {
    return null;
  }
}

function setMockSession(user: MockUser) {
  _memorySession = user;
  if (!isClient()) return;
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } catch {
    // ignore storage errors
  }
}

function clearMockSession() {
  _memorySession = null;
  if (!isClient()) return;
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

// ── Auth actions ──────────────────────────────────────────────────────────────

export interface MockSignInResult {
  user: MockUser | null;
  error: string | null;
}

/**
 * Sign in with any mock email + any password.
 * Returns the user immediately — no network call.
 */
export function mockSignIn(email: string, _password: string): MockSignInResult {
  const normalized = email.toLowerCase().trim();
  const canonical = EMAIL_ALIASES[normalized] ?? normalized;
  const user = MOCK_USERS[canonical] ?? null;
  if (!user) {
    return { user: null, error: "No demo account found for that email. Try homeowner@homebids.demo, contractor@homebids.demo, or admin@homebids.demo." };
  }
  setMockSession(user);
  return { user, error: null };
}

/**
 * Sign out — clears session and navigates to homepage.
 * Safe to call multiple times.
 */
export function mockSignOut() {
  clearMockSession();
  if (isClient()) {
    window.location.replace("/");
  }
}

/**
 * Returns the current mock user or null.
 * Use this wherever Supabase's getUser() was called.
 */
export function getMockUser(): MockUser | null {
  return getMockSession();
}

/**
 * Returns true if a mock session exists.
 */
export function isMockSignedIn(): boolean {
  return getMockSession() !== null;
}

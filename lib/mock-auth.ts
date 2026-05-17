/**
 * mock-auth.ts
 *
 * Self-contained mock authentication system.
 * Replaces all Supabase auth calls so the site runs as a standalone demo
 * with no backend dependency.
 *
 * Storage: localStorage (persists across refreshes for demo testing).
 * Falls back to an in-memory store on SSR.
 */

export const USE_MOCK_DATA = true;

// ── Types ─────────────────────────────────────────────────────────────────────

export type MockRole = "homeowner" | "contractor" | "admin";
export type MockAuthProvider = "google" | "apple" | "phone" | "email" | "demo";

export interface MockUser {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: MockRole;
  authProvider: MockAuthProvider;
  isDemo: true;
}

// ── Mock users ────────────────────────────────────────────────────────────────

export const MOCK_USERS: Record<string, MockUser> = {
  "homeowner@homebids.demo": {
    id: "mock-homeowner-001",
    email: "homeowner@homebids.demo",
    name: "Sarah Johnson",
    firstName: "Sarah",
    lastName: "Johnson",
    role: "homeowner",
    authProvider: "demo",
    isDemo: true,
  },
  "contractor@homebids.demo": {
    id: "mock-contractor-001",
    email: "contractor@homebids.demo",
    name: "Mike Rodriguez",
    firstName: "Mike",
    lastName: "Rodriguez",
    role: "contractor",
    authProvider: "demo",
    isDemo: true,
  },
  "admin@homebids.demo": {
    id: "mock-admin-001",
    email: "admin@homebids.demo",
    name: "Tim Brown",
    firstName: "Tim",
    lastName: "Brown",
    role: "admin",
    authProvider: "demo",
    isDemo: true,
  },
};

// Legacy email aliases so existing bookmarks keep working
const EMAIL_ALIASES: Record<string, string> = {
  "demo.homeowner@homebids.io": "homeowner@homebids.demo",
  "demo.contractor@homebids.io": "contractor@homebids.demo",
};

// Common demo password — any password is accepted in mock mode
export const MOCK_PASSWORD = "demo";
// Demo OTP code for phone sign-in
export const MOCK_OTP_CODE = "123456";

const SESSION_KEY = "hb_mock_session";

// In-memory fallback for SSR
let _memorySession: MockUser | null = null;

function isClient() {
  return typeof window !== "undefined";
}

// ── Session helpers ───────────────────────────────────────────────────────────

export function getMockSession(): MockUser | null {
  if (!isClient()) return _memorySession;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
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
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } catch {
    // ignore storage errors
  }
}

export function clearMockSession() {
  _memorySession = null;
  if (!isClient()) return;
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildMockUser(
  base: { id: string; name: string; firstName: string; lastName: string; email?: string; phone?: string },
  role: MockRole,
  provider: MockAuthProvider,
): MockUser {
  return {
    id: base.id,
    email: base.email ?? `${provider}-${role}@homebids.demo`,
    name: base.name,
    firstName: base.firstName,
    lastName: base.lastName,
    phone: base.phone,
    role,
    authProvider: provider,
    isDemo: true,
  };
}

export function redirectAfterSignIn(role: MockRole) {
  if (!isClient()) return;
  if (role === "contractor") {
    window.location.replace("/contractors/dashboard");
  } else if (role === "admin") {
    window.location.replace("/admin");
  } else {
    window.location.replace("/?showJobs=true");
  }
}

// ── Auth actions ──────────────────────────────────────────────────────────────

export interface MockSignInResult {
  user: MockUser | null;
  error: string | null;
}

/** Sign in with any mock email + any password. */
export function mockSignIn(email: string, _password: string): MockSignInResult {
  const normalized = email.toLowerCase().trim();
  const canonical = EMAIL_ALIASES[normalized] ?? normalized;
  const base = MOCK_USERS[canonical] ?? null;
  if (!base) {
    return {
      user: null,
      error:
        "No demo account found for that email. Try homeowner@homebids.demo, contractor@homebids.demo, or admin@homebids.demo.",
    };
  }
  setMockSession(base);
  return { user: base, error: null };
}

/** Sign in via Google (shows role selection if role not provided). */
export function mockGoogleSignIn(role?: MockRole): MockSignInResult {
  if (!role) return { user: null, error: "role_selection_required" };
  const user = buildMockUser(
    { id: `mock-google-${role}-001`, name: "Demo User", firstName: "Demo", lastName: "User", email: `google-${role}@homebids.demo` },
    role,
    "google",
  );
  setMockSession(user);
  return { user, error: null };
}

/** Sign in via Apple (shows role selection if role not provided). */
export function mockAppleSignIn(role?: MockRole): MockSignInResult {
  if (!role) return { user: null, error: "role_selection_required" };
  const user = buildMockUser(
    { id: `mock-apple-${role}-001`, name: "Demo User", firstName: "Demo", lastName: "User", email: `apple-${role}@homebids.demo` },
    role,
    "apple",
  );
  setMockSession(user);
  return { user, error: null };
}

/** Verify phone OTP. Returns error if code doesn't match MOCK_OTP_CODE. */
export function mockPhoneOtpSignIn(phone: string, code: string, role?: MockRole): MockSignInResult {
  if (code !== MOCK_OTP_CODE) {
    return { user: null, error: "Incorrect code. Demo code is 123456." };
  }
  if (!role) return { user: null, error: "role_selection_required" };
  const user = buildMockUser(
    { id: `mock-phone-${role}-001`, name: "Demo User", firstName: "Demo", lastName: "User", phone },
    role,
    "phone",
  );
  setMockSession(user);
  return { user, error: null };
}

/** Email magic link — always succeeds in demo mode. */
export function mockEmailMagicLinkSignIn(email: string, role?: MockRole): MockSignInResult {
  if (!role) return { user: null, error: "role_selection_required" };
  const user = buildMockUser(
    { id: `mock-email-${role}-001`, name: "Demo User", firstName: "Demo", lastName: "User", email },
    role,
    "email",
  );
  setMockSession(user);
  return { user, error: null };
}

/** Set role on the current mock session (used after role selection). */
export function setMockUserRole(role: MockRole) {
  const session = getMockSession();
  if (!session) return;
  const updated = { ...session, role };
  setMockSession(updated);
}

/** Returns the current mock user or null. */
export function getMockUser(): MockUser | null {
  return getMockSession();
}

/** Returns true if a mock session exists. */
export function isMockSignedIn(): boolean {
  return getMockSession() !== null;
}

/** Sign out — clears localStorage session and navigates to homepage. */
export function mockSignOut() {
  clearMockSession();
  if (isClient()) {
    window.location.replace("/");
  }
}

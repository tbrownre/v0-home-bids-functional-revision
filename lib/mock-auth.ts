/**
 * mock-auth.ts
 *
 * Auth bridge layer.
 *
 * Authentication is REAL (Supabase) — see USE_MOCK_AUTH below. On a successful
 * real sign-in we "mirror" the Supabase session into a localStorage record that
 * has the same shape the rest of the app already consumes (getMockUser, etc.),
 * so every synchronous consumer keeps working without a rewrite. The real
 * Supabase cookie remains the source of truth for route protection (middleware).
 *
 * DEMO DATA (dashboard metrics, bids, jobs) is still mock — see USE_MOCK_DATA.
 * The two concerns are intentionally decoupled.
 */

import { createClient } from "@/lib/supabase/client";
import { DEMO_HOMEOWNER_EMAIL, DEMO_CONTRACTOR_EMAIL, DEMO_PASSWORD } from "@/lib/demo-guard";

// Authentication is real. Demo dashboard/bids/jobs data stays mock.
export const USE_MOCK_AUTH = false;
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
  "demo.homeowner@homebids.ai": "homeowner@homebids.demo",
  "demo.contractor@homebids.ai": "contractor@homebids.demo",
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
    window.location.replace("/admin-demo");
  } else {
    // The homeowner demo experience is the jobs dashboard.
    window.location.replace("/homeowners/dashboard");
  }
}

// ── Real Supabase auth bridge ───────────────────────────────────────────────

export const DEMO_CREDENTIALS = {
  homeowner: { email: DEMO_HOMEOWNER_EMAIL, password: DEMO_PASSWORD },
  contractor: { email: DEMO_CONTRACTOR_EMAIL, password: DEMO_PASSWORD },
} as const;

/** Build the app's MockUser shape from a real Supabase user object. */
function mapSupabaseUser(user: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
}): MockUser {
  const meta = (user.user_metadata ?? {}) as Record<string, string | undefined>;
  const roleRaw = (meta.user_type as MockRole) ?? "homeowner";
  const role: MockRole = roleRaw === "contractor" || roleRaw === "admin" ? roleRaw : "homeowner";
  const firstName = meta.first_name ?? meta.full_name?.split(" ")[0] ?? "";
  const lastName = meta.last_name ?? meta.full_name?.split(" ").slice(1).join(" ") ?? "";
  const name = (meta.full_name ?? `${firstName} ${lastName}`.trim()) || (user.email ?? "Member");
  return {
    id: user.id,
    email: user.email ?? "",
    name,
    firstName,
    lastName,
    phone: meta.phone,
    role,
    authProvider: "email",
    isDemo: true,
  };
}

/** Real email + password sign-in. Mirrors the session into the local cache. */
export async function realSignIn(email: string, password: string): Promise<MockSignInResult> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error || !data.user) {
      return { user: null, error: error?.message ?? "Unable to sign in. Check your email and password." };
    }
    const mapped = mapSupabaseUser(data.user);
    setMockSession(mapped);
    return { user: mapped, error: null };
  } catch {
    return { user: null, error: "Something went wrong signing in. Please try again." };
  }
}

/** Sign in to one of the seeded demo accounts (real Supabase session). */
export function realDemoSignIn(role: "homeowner" | "contractor"): Promise<MockSignInResult> {
  const creds = DEMO_CREDENTIALS[role];
  return realSignIn(creds.email, creds.password);
}

/**
 * Reconcile the local cache with the real Supabase session.
 * Clears the mirror if the real session is gone (prevents ghost "signed-in" UI).
 */
export async function syncMirrorFromSupabase(): Promise<MockUser | null> {
  try {
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      const mapped = mapSupabaseUser(data.user);
      setMockSession(mapped);
      return mapped;
    }
    clearMockSession();
    return null;
  } catch {
    return getMockSession();
  }
}

/** Real sign-out — ends the Supabase session and clears the local cache. */
export async function realSignOut() {
  try {
    const supabase = createClient();
    await supabase.auth.signOut();
  } catch {
    // ignore network errors — still clear local state below
  }
  clearMockSession();
  if (isClient()) window.location.replace("/");
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

/** Sign out — ends the real session (when auth is real) and navigates home. */
export function mockSignOut() {
  if (!USE_MOCK_AUTH) {
    // Fire the real sign-out; it clears the cache and redirects itself.
    void realSignOut();
    return;
  }
  clearMockSession();
  if (isClient()) {
    window.location.replace("/");
  }
}

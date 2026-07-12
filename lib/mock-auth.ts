/**
 * mock-auth.ts
 *
 * Auth bridge layer — real Supabase auth.
 *
 * On a successful real sign-in, we "mirror" the Supabase session into a
 * localStorage record that has the same shape the rest of the app already
 * consumes (getMockUser, etc.), so every synchronous consumer keeps working
 * without a rewrite. The real Supabase cookie remains the source of truth
 * for route protection (middleware).
 */

import { createClient } from "@/lib/supabase/client";

// ── Types ─────────────────────────────────────────────────────────────────────

export type MockRole = "homeowner" | "contractor" | "admin";
export type MockAuthProvider = "google" | "apple" | "phone" | "email";

export interface MockUser {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: MockRole;
  authProvider: MockAuthProvider;
}

const SESSION_KEY = "hb_session";

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



export function redirectAfterSignIn(role: MockRole) {
  if (!isClient()) return;
  if (role === "contractor") {
    window.location.replace("/contractors/dashboard");
  } else if (role === "admin") {
    window.location.replace("/admin");
  } else {
    window.location.replace("/homeowners/dashboard");
  }
}

// ── Real Supabase auth bridge ───────────────────────────────────────────

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

/** Returns the current mock user or null. */
export function getMockUser(): MockUser | null {
  return getMockSession();
}

/** Returns true if a mock session exists. */
export function isMockSignedIn(): boolean {
  return getMockSession() !== null;
}

/** Sign out — ends the real Supabase session and navigates home. */
export function mockSignOut() {
  void realSignOut();
}

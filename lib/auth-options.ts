/**
 * FASTSIGNIN (Tim, Oct 7 — Trello "Improve Returning User Sign-In — Faster, Easier Access").
 *
 * Small client-side helpers shared by the sign-in page and the auth routes:
 *   - remember who signed in on this device (email + first name) so the next visit opens on
 *     "Welcome back, Dillon" with one tap/Face ID instead of typing
 *   - which social providers are switched on in Supabase (Google / Apple) — read from the public
 *     /auth/v1/settings endpoint so the buttons appear the moment Tim enables a provider, with no deploy
 *   - the deep-link target a texted link wanted, kept for the magic-link round trip
 *
 * Nothing here stores passwords or biometrics: Face ID / Touch ID come from the browser's own password
 * manager / passkey autofill on the standard username + current-password fields.
 */

export const LAST_LOGIN_KEY = "hb_last_login";
export const NEXT_COOKIE = "hb_next";
/** Set by /auth/callback and /auth/confirm after a Google / Apple / magic-link sign-in (JS-readable, 400 days). */
export const LAST_LOGIN_COOKIE = "hb_last_login";

export interface LastLogin {
  email: string;
  name?: string | null;
  /** How they got in last time — the page makes that the primary button next time. */
  method: "password" | "magic" | "google" | "apple";
  at: string;
}

const isClient = () => typeof window !== "undefined";

function readCookie(name: string): string | null {
  if (!isClient()) return null;
  const m = document.cookie.split(";").map((c) => c.trim()).find((c) => c.startsWith(name + "="));
  if (!m) return null;
  try {
    return decodeURIComponent(m.slice(name.length + 1));
  } catch {
    return null;
  }
}

const valid = (v: unknown): v is LastLogin =>
  !!v && typeof (v as LastLogin).email === "string" && (v as LastLogin).email.includes("@");

export function getLastLogin(): LastLogin | null {
  if (!isClient()) return null;
  // the server routes (Google / Apple / magic link) leave the memory in a cookie — newest wins, then it lives in localStorage
  let fromCookie: LastLogin | null = null;
  try {
    const raw = readCookie(LAST_LOGIN_COOKIE);
    if (raw) {
      const v = JSON.parse(raw) as LastLogin;
      if (valid(v)) fromCookie = v;
    }
  } catch {
    /* ignore */
  }
  let fromStorage: LastLogin | null = null;
  try {
    const raw = localStorage.getItem(LAST_LOGIN_KEY);
    if (raw) {
      const v = JSON.parse(raw) as LastLogin;
      if (valid(v)) fromStorage = v;
    }
  } catch {
    /* ignore */
  }
  const pick = fromCookie && (!fromStorage || String(fromCookie.at) >= String(fromStorage.at)) ? fromCookie : fromStorage;
  if (pick && pick === fromCookie) {
    try {
      localStorage.setItem(LAST_LOGIN_KEY, JSON.stringify(pick));
    } catch {
      /* ignore */
    }
  }
  return pick;
}

export function rememberLogin(v: Omit<LastLogin, "at">) {
  if (!isClient()) return;
  try {
    localStorage.setItem(LAST_LOGIN_KEY, JSON.stringify({ ...v, email: v.email.trim().toLowerCase(), at: new Date().toISOString() }));
  } catch {
    /* storage blocked — the page simply asks for the email next time */
  }
}

export function forgetLogin() {
  if (!isClient()) return;
  try {
    localStorage.removeItem(LAST_LOGIN_KEY);
  } catch {
    /* ignore */
  }
  document.cookie = `${LAST_LOGIN_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`;
}

/** Cookie value the auth routes write after a Google / Apple / magic-link sign-in. */
export function lastLoginCookieValue(v: Omit<LastLogin, "at">): string {
  return JSON.stringify({ ...v, email: v.email.trim().toLowerCase(), at: new Date().toISOString() });
}
export const LAST_LOGIN_COOKIE_MAX_AGE = 400 * 24 * 60 * 60;

export interface ProviderFlags {
  google: boolean;
  apple: boolean;
}

const PROVIDERS_CACHE_KEY = "hb_auth_providers";

/** Which social providers Supabase has enabled. Cached for an hour per tab; fails closed (no buttons). */
export async function fetchProviderFlags(): Promise<ProviderFlags> {
  const none: ProviderFlags = { google: false, apple: false };
  if (!isClient()) return none;
  try {
    const cached = sessionStorage.getItem(PROVIDERS_CACHE_KEY);
    if (cached) {
      const c = JSON.parse(cached) as ProviderFlags & { at: number };
      if (Date.now() - c.at < 3_600_000) return { google: !!c.google, apple: !!c.apple };
    }
  } catch {
    /* ignore cache problems */
  }
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return none;
    const res = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: key } });
    if (!res.ok) return none;
    const json = (await res.json()) as { external?: Record<string, boolean> };
    const flags: ProviderFlags = { google: !!json.external?.google, apple: !!json.external?.apple };
    try {
      sessionStorage.setItem(PROVIDERS_CACHE_KEY, JSON.stringify({ ...flags, at: Date.now() }));
    } catch {
      /* ignore */
    }
    return flags;
  } catch {
    return none;
  }
}

/** Keep the deep-link target for the magic-link round trip (the email can open in another browser). */
export function rememberNextPath(path: string | null) {
  if (!isClient()) return;
  if (!path) {
    document.cookie = `${NEXT_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`;
    return;
  }
  document.cookie = `${NEXT_COOKIE}=${encodeURIComponent(path)}; Max-Age=900; Path=/; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
}

export function firstNameOf(name?: string | null, email?: string | null): string {
  const n = String(name ?? "").trim();
  if (n) return n.split(/\s+/)[0];
  const e = String(email ?? "").trim();
  return e ? e.split("@")[0] : "";
}

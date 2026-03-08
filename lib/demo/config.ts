/**
 * Demo mode configuration.
 *
 * Activation: set NEXT_PUBLIC_DEMO_MODE=true in your environment.
 * Persona:    pass ?demo=homeowner (default) or ?demo=contractor in the URL.
 *
 * These are the only two helpers any page needs to import from the demo system.
 */

export type DemoPersona = "homeowner" | "contractor";

export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}

/**
 * Client-safe demo mode check. Checks env var AND ?demo= URL param.
 * Only call inside useEffect or client components.
 * Activation: env var OR ?demo=true|homeowner|contractor in the URL.
 */
export function isDemoModeClient(): boolean {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") return true;
  if (typeof window === "undefined") return false;
  const demoParam = new URLSearchParams(window.location.search).get("demo");
  return demoParam === "true" || demoParam === "homeowner" || demoParam === "contractor";
}

/**
 * Reads the active demo persona from the URL search params.
 * Safe to call on the server (returns "homeowner" when window is unavailable).
 */
export function getDemoPersona(): DemoPersona {
  if (typeof window === "undefined") return "homeowner";
  const params = new URLSearchParams(window.location.search);
  const val = params.get("demo");
  return val === "contractor" ? "contractor" : "homeowner";
}

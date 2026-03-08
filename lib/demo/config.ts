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
 * Reads the active demo persona from the URL search params.
 * Safe to call on the server (returns "homeowner" when window is unavailable).
 */
export function getDemoPersona(): DemoPersona {
  if (typeof window === "undefined") return "homeowner";
  const params = new URLSearchParams(window.location.search);
  const val = params.get("demo");
  return val === "contractor" ? "contractor" : "homeowner";
}

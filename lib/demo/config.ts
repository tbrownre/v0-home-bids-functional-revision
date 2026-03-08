/**
 * Demo mode configuration.
 * All demo code paths are gated behind NEXT_PUBLIC_DEMO_MODE=true.
 * When this env var is absent or false, every function here returns a
 * falsy / default value and the demo bundle is tree-shaken in production.
 */

export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}

export type DemoPersona = "homeowner" | "contractor";

/**
 * Reads the ?demo= URL param on the client.
 * Safe to call in SSR — defaults to "homeowner" when window is unavailable.
 */
export function getDemoPersona(): DemoPersona {
  if (typeof window === "undefined") return "homeowner";
  const param = new URLSearchParams(window.location.search).get("demo");
  return param === "contractor" ? "contractor" : "homeowner";
}

/**
 * Demo mode configuration.
 *
 * Activation: set NEXT_PUBLIC_DEMO_MODE=true in your Vercel environment for
 * the demo deployment. Never set it in production.
 *
 * URL param ?demo=contractor switches to the contractor persona.
 * Default persona is "homeowner".
 */

export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}

export type DemoPersona = "homeowner" | "contractor";

export function getDemoPersona(): DemoPersona {
  if (typeof window === "undefined") return "homeowner";
  const param = new URLSearchParams(window.location.search).get("demo");
  if (param === "contractor") return "contractor";
  return "homeowner";
}

/**
 * Demo mode configuration.
 *
 * Demo mode activates when ANY of the following are true:
 *   1. NEXT_PUBLIC_DEMO_MODE=true  (env var — server + client)
 *   2. ?demo=true or ?demo=homeowner or ?demo=contractor in the URL (client only)
 *   3. The signed-in email matches a demo/test pattern (client only)
 *
 * isDemoMode()       — server-safe, reads env var only. Use in layout.tsx / middleware.
 * isDemoModeClient() — client-safe, checks env var + URL param + email. Use in page useEffects.
 */

export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}

/**
 * Client-side demo mode check. Safe to call only inside useEffect or client components.
 * Checks env var, ?demo= URL param, and optional test email patterns.
 */
export function isDemoModeClient(email?: string): boolean {
  // 1. Env var (works on both server and client)
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") return true;

  // 2. URL param: ?demo=true | ?demo=homeowner | ?demo=contractor
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const demoParam = params.get("demo");
    if (demoParam === "true" || demoParam === "homeowner" || demoParam === "contractor") {
      return true;
    }
  }

  // 3. Demo/test email pattern
  if (email) {
    const lower = email.toLowerCase();
    if (
      lower.includes("+demo") ||
      lower.includes("demo@") ||
      lower.startsWith("test@") ||
      lower.includes("+test")
    ) {
      return true;
    }
  }

  return false;
}

export type DemoPersona = "homeowner" | "contractor";

/**
 * Reads the active demo persona from the URL param.
 * ?demo=contractor → contractor persona
 * Everything else   → homeowner persona
 * Safe to call in SSR — defaults to "homeowner" when window is unavailable.
 */
export function getDemoPersona(): DemoPersona {
  if (typeof window === "undefined") return "homeowner";
  const param = new URLSearchParams(window.location.search).get("demo");
  return param === "contractor" ? "contractor" : "homeowner";
}

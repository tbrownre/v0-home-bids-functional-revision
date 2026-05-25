/**
 * demo-guard.ts
 *
 * Identifies demo accounts so write actions can return mock success without
 * touching real data. Demo users are identified by email prefix — they are
 * real Supabase auth users (seeded by 005_create_demo_users.sql) with
 * confirmed emails and stable passwords, but their writes are no-ops.
 */

export const DEMO_HOMEOWNER_EMAIL = "demo.homeowner@homebids.ai";
export const DEMO_CONTRACTOR_EMAIL = "demo.contractor@homebids.ai";
export const DEMO_PASSWORD = "HomeBidsDemo!24";

// New mock-mode emails — kept alongside the legacy ones for compatibility
export const MOCK_HOMEOWNER_EMAIL = "homeowner@homebids.demo";
export const MOCK_CONTRACTOR_EMAIL = "contractor@homebids.demo";
export const MOCK_ADMIN_EMAIL = "admin@homebids.demo";

const DEMO_EMAILS = new Set([DEMO_HOMEOWNER_EMAIL, DEMO_CONTRACTOR_EMAIL]);

/**
 * Returns true if the given email belongs to a demo account.
 * Used server-side inside actions.ts before any DB write.
 */
export function isDemoEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  return DEMO_EMAILS.has(email.toLowerCase().trim());
}

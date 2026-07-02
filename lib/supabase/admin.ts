import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client for privileged, server-only operations.
 *
 * This client bypasses Row Level Security and must NEVER be imported into
 * client components or exposed to the browser. Use it only inside server
 * actions / route handlers for trusted writes — e.g. inserting a
 * contractor_profiles row immediately after auth.signUp, when the new user
 * does not yet have a session (email confirmation pending) and therefore
 * cannot satisfy the RLS insert policy.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase service role configuration (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).",
    );
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

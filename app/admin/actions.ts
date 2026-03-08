"use server";

import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// Session client — used only to verify the caller's identity via JWT
async function createSessionClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}

// Service role client — bypasses RLS for admin read/write operations
function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Guard: returns user if authenticated + admin, otherwise throws
async function requireAdmin() {
  const supabase = await createSessionClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");
  if (!user.app_metadata?.is_admin) throw new Error("Not authorized.");
  return user;
}

export type ContractorApplication = {
  id: string;
  business_name: string;
  specialties: string[];
  service_area: string;
  bio: string | null;
  license_number: string | null;
  years_experience: number | null;
  approval_status: "pending" | "approved" | "rejected";
  is_verified: boolean;
  created_at: string;
  profiles: {
    full_name: string;
    email: string;
    phone: string | null;
  } | null;
};

export async function getContractorApplications(
  filter: "all" | "pending" | "approved" | "rejected" = "all"
): Promise<{ applications: ContractorApplication[] | null; error: string | null }> {
  try { await requireAdmin(); } catch (e: unknown) {
    return { applications: null, error: (e as Error).message };
  }
  const supabase = createServiceClient();

  let query = supabase
    .from("contractor_profiles")
    .select("id, business_name, specialties, service_area, bio, license_number, years_experience, approval_status, is_verified, created_at, profiles(full_name, email, phone)")
    .order("created_at", { ascending: false });

  if (filter !== "all") {
    query = query.eq("approval_status", filter);
  }

  const { data, error } = await query;
  if (error) return { applications: null, error: error.message };
  return { applications: data as ContractorApplication[], error: null };
}

export async function updateContractorStatus(
  contractorId: string,
  status: "approved" | "rejected"
): Promise<{ error: string | null }> {
  try { await requireAdmin(); } catch (e: unknown) {
    return { error: (e as Error).message };
  }
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("contractor_profiles")
    .update({ approval_status: status, is_approved: status === "approved" })
    .eq("id", contractorId);

  if (error) return { error: error.message };
  return { error: null };
}

export async function getAdminStats(): Promise<{
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}> {
  try { await requireAdmin(); } catch { return { total: 0, pending: 0, approved: 0, rejected: 0 }; }
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("contractor_profiles")
    .select("approval_status");

  const rows = data ?? [];
  return {
    total: rows.length,
    pending: rows.filter((r) => r.approval_status === "pending").length,
    approved: rows.filter((r) => r.approval_status === "approved").length,
    rejected: rows.filter((r) => r.approval_status === "rejected").length,
  };
}

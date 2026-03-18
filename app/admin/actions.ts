"use server";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// Service role client — bypasses RLS for admin read/write operations
function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Guard: returns user if authenticated + admin, otherwise throws
async function requireAdmin() {
  const supabase = await createClient();
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
  return { applications: (data as unknown) as ContractorApplication[], error: null };
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
  // Contractor application counts
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  // Platform-wide metrics
  totalHomeowners: number;
  totalJobs: number;
  openJobs: number;
  activeSubscriptions: number;
}> {
  const fallback = {
    total: 0, pending: 0, approved: 0, rejected: 0,
    totalHomeowners: 0, totalJobs: 0, openJobs: 0, activeSubscriptions: 0,
  };
  try { await requireAdmin(); } catch { return fallback; }
  const supabase = createServiceClient();

  const [
    { data: contractorRows },
    { count: homeownerCount },
    { count: totalJobs },
    { count: openJobs },
    { count: activeSubscriptions },
  ] = await Promise.all([
    supabase.from("contractor_profiles").select("approval_status"),
    supabase.from("profiles").select("id", { count: "exact", head: true })
      .eq("user_type", "homeowner"),
    supabase.from("jobs").select("id", { count: "exact", head: true }),
    supabase.from("jobs").select("id", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("subscriptions").select("id", { count: "exact", head: true })
      .eq("status", "active"),
  ]);

  const rows = contractorRows ?? [];
  return {
    total: rows.length,
    pending: rows.filter((r) => r.approval_status === "pending").length,
    approved: rows.filter((r) => r.approval_status === "approved").length,
    rejected: rows.filter((r) => r.approval_status === "rejected").length,
    totalHomeowners: homeownerCount ?? 0,
    totalJobs: totalJobs ?? 0,
    openJobs: openJobs ?? 0,
    activeSubscriptions: activeSubscriptions ?? 0,
  };
}

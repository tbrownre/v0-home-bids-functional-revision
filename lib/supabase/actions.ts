"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isDemoEmail } from "@/lib/demo-guard";
const MAKE_WEBHOOK_URL = "https://hook.us2.make.com/1v7w6jnit6c3cbddxsqeyrobgnf21su9";

function getConfirmUrl() {
  const base =
    process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://homebids.io";
  return `${base}/auth/confirm`;
}

async function fireWebhook(event: string, payload: Record<string, unknown>) {
  try {
    await fetch(MAKE_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, ...payload, timestamp: new Date().toISOString() }),
    });
  } catch {
    // Non-blocking — webhook failure should never break the main flow
  }
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export async function signUpHomeowner(formData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      data: {
        first_name: formData.firstName,
        last_name: formData.lastName,
        user_type: "homeowner",
      },
      emailRedirectTo: getConfirmUrl(),
    },
  });
  if (error) {
    // User already exists but hasn't confirmed — prompt resend instead of blocking
    if (
      error.message.toLowerCase().includes("already registered") ||
      error.message.toLowerCase().includes("user already exists")
    ) {
      return { error: "already_registered", email: formData.email };
    }
    return { error: error.message };
  }
  await fireWebhook("user.signup", {
    user_type: "homeowner",
    email: formData.email,
    first_name: formData.firstName,
    last_name: formData.lastName,
  });
  return { success: true };
}

export async function signUpContractor(formData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  businessName: string;
  businessType: string;
  yearsInBusiness: string;
  licenseNumber: string;
  licenseState: string;
  insuranceProvider: string;
  bondedAmount: string;
  selectedServices: string[];
  serviceAreas: string;
  minimumJobSize: string;
  bio: string;
}) {
  const supabase = await createClient();

  // 1. Create the auth user
  const { data, error } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      data: {
        full_name: `${formData.firstName} ${formData.lastName}`.trim(),
        user_type: "contractor",
        business_name: formData.businessName,
        phone: formData.phone,
      },
      emailRedirectTo: getConfirmUrl(),
    },
  });
  if (error) return { error: error.message };

  const userId = data.user?.id;
  if (!userId) return { error: "Failed to create user account." };

  // The handle_new_user trigger already inserts into profiles.
  // We just need to insert into contractor_profiles.
  const yearsExp = formData.yearsInBusiness ? parseInt(formData.yearsInBusiness, 10) : null;
  const { error: contractorError } = await supabase.from("contractor_profiles").insert({
    id: userId,
    business_name: formData.businessName,
    specialties: formData.selectedServices,
    service_area: formData.serviceAreas,
    bio: formData.bio || null,
    license_number: formData.licenseNumber || null,
    years_experience: isNaN(yearsExp as number) ? null : yearsExp,
    approval_status: "pending",
    is_verified: false,
    is_approved: false,
  });
  if (contractorError) {
    // Friendly error — don't expose raw DB messages to the UI
    console.error("[signUpContractor] contractor_profiles insert error:", contractorError.message);
    return { error: "We couldn't save your contractor details. Please try again or contact support." };
  }

  await fireWebhook("user.signup", {
    user_type: "contractor",
    email: formData.email,
    full_name: `${formData.firstName} ${formData.lastName}`.trim(),
    business_name: formData.businessName,
    services: formData.selectedServices,
    phone: formData.phone,
  });

  return { success: true, userId };
}

export async function signIn(email: string, password: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) return { error: error.message };
  const userType = data.user?.user_metadata?.user_type ?? "homeowner";
  return { success: true, userType };
}

export async function resendConfirmation(email: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: getConfirmUrl(),
    },
  });
  if (error) return { error: error.message };
  return { success: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/auth/sign-in");
}

export async function getSession() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// ── Jobs ─────────────────────────────────────────────────────────────────────

export async function createJob(formData: {
  title: string;
  description: string;
  category: string;
  location: string;
  budget_min?: number;
  budget_max?: number;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Demo accounts: return a mock job without writing to the DB.
  if (isDemoEmail(user.email)) {
    return {
      success: true,
      job: {
        id: `demo-job-${Date.now()}`,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        location: formData.location,
        budget_min: formData.budget_min ?? null,
        budget_max: formData.budget_max ?? null,
        status: "open",
        created_at: new Date().toISOString(),
        homeowner_id: user.id,
      },
    };
  }

  const { data, error } = await supabase
    .from("jobs")
    .insert({
      homeowner_id: user.id,
      title: formData.title,
      description: formData.description,
      category: formData.category,
      location: formData.location,
      budget_min: formData.budget_min ?? null,
      budget_max: formData.budget_max ?? null,
      status: "open",
    })
    .select()
    .single();

  if (error) return { error: error.message };
  await fireWebhook("job.created", {
    job_id: data.id,
    title: data.title,
    description: data.description,
    category: data.category,
    location: data.location,
    budget_min: data.budget_min,
    budget_max: data.budget_max,
    homeowner_id: user.id,
  });
  revalidatePath("/");
  return { success: true, job: data };
}

export async function getHomeownerJobs() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated", jobs: [] };

  const { data, error } = await supabase
    .from("jobs")
    .select("*, bids(count)")
    .eq("homeowner_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return { error: error.message, jobs: [] };
  return { jobs: data ?? [] };
}

export async function getOpenJobs() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("jobs")
    .select("*, profiles(full_name)")
    .eq("status", "open")
    .order("created_at", { ascending: false });

  if (error) return { error: error.message, jobs: [] };
  return { jobs: data ?? [] };
}

export async function getJobById(id: string) {
  const supabase = await createClient();

  // Step 1: Fetch the job itself — no bid join so a missing relationship never
  // blocks the homeowner from seeing their own job.
  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select("*, profiles(full_name)")
    .eq("id", id)
    .single();

  if (jobError) return { error: jobError.message, job: null };
  if (!job) return { error: "Job not found", job: null };

  // Step 2: Fetch a simple count of bids for the summary chip.
  // This is best-effort — if it fails, the job still renders with bidsCount = 0.
  let bidsCount = 0;
  try {
    const { count } = await supabase
      .from("bids")
      .select("id", { count: "exact", head: true })
      .eq("job_id", id);
    bidsCount = count ?? 0;
  } catch {
    // Non-blocking
  }

  return { job: { ...job, bids: Array(bidsCount).fill({}) }, bidsCount };
}

// Separate action for the bids page — fetches bids with only the profiles join
// (which is valid: bids.contractor_id → profiles.id).
// contractor_profiles enrichment is done as a second optional pass.
export async function getJobBids(jobId: string) {
  const supabase = await createClient();

  // bids.contractor_id → profiles.id — this FK exists in the schema.
  const { data: bids, error: bidsError } = await supabase
    .from("bids")
    .select("*, profiles(id, full_name, avatar_url)")
    .eq("job_id", jobId)
    .order("created_at", { ascending: true });

  if (bidsError) {
    console.error("[getJobBids] bids fetch failed:", bidsError.message);
    return { bids: [], error: bidsError.message };
  }

  if (!bids || bids.length === 0) return { bids: [], error: null };

  // Step 2: Optionally enrich with contractor_profiles.
  // contractor_profiles.id = profiles.id = bids.contractor_id so we can look up
  // by the contractor_id column directly.
  const contractorIds = bids.map((b) => b.contractor_id).filter(Boolean);
  let contractorProfileMap: Record<string, { business_name: string | null }> = {};

  if (contractorIds.length > 0) {
    try {
      const { data: contractorProfiles } = await supabase
        .from("contractor_profiles")
        .select("id, business_name")
        .in("id", contractorIds);

      if (contractorProfiles) {
        contractorProfileMap = Object.fromEntries(
          contractorProfiles.map((cp) => [cp.id, cp])
        );
      }
    } catch {
      // Enrichment failure is non-blocking — bids still render with fallback names.
      console.error("[getJobBids] contractor_profiles enrichment failed, using fallback names");
    }
  }

  // Merge enrichment into bids
  const enrichedBids = bids.map((bid) => ({
    ...bid,
    business_name:
      contractorProfileMap[bid.contractor_id]?.business_name ??
      (bid.profiles as any)?.full_name ??
      "Contractor",
  }));

  return { bids: enrichedBids, error: null };
}

// ── Bids ─────────────────────────────────────────────────────────────────────

export async function submitBid(formData: {
  job_id: string;
  amount: number;
  message: string;
  timeline?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Demo accounts: return a mock bid without writing to the DB.
  if (isDemoEmail(user.email)) {
    return {
      success: true,
      bid: {
        id: `demo-bid-${Date.now()}`,
        job_id: formData.job_id,
        contractor_id: user.id,
        amount: formData.amount,
        message: formData.message,
        timeline: formData.timeline ?? null,
        status: "pending",
        created_at: new Date().toISOString(),
      },
    };
  }

  // Duplicate-bid guard: one active bid per contractor per job.
  const { data: existing } = await supabase
    .from("bids")
    .select("id")
    .eq("job_id", formData.job_id)
    .eq("contractor_id", user.id)
    .not("status", "eq", "withdrawn")
    .maybeSingle();

  if (existing) {
    return { error: "You have already submitted a bid on this job." };
  }

  const { data, error } = await supabase
    .from("bids")
    .insert({
      job_id: formData.job_id,
      contractor_id: user.id,
      amount: formData.amount,
      message: formData.message,
      timeline: formData.timeline ?? null,
      status: "pending",
    })
    .select("*, jobs(title, homeowner_id)")
    .single();

  if (error) return { error: error.message };

  // Notify homeowner via webhook so they receive an email/notification.
  await fireWebhook("bid.submitted", {
    bid_id: data.id,
    job_id: formData.job_id,
    job_title: (data.jobs as any)?.title ?? "",
    homeowner_id: (data.jobs as any)?.homeowner_id ?? "",
    contractor_id: user.id,
    amount: formData.amount,
    message: formData.message,
    timeline: formData.timeline ?? null,
  });

  revalidatePath(`/jobs/${formData.job_id}/bids`);
  return { success: true, bid: data };
}

export async function acceptBid(bidId: string, jobId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Demo accounts: mock success without mutating any real data.
  if (isDemoEmail(user.email)) {
    return { success: true };
  }

  // Mark selected bid as accepted, others as rejected
  const { error: rejectError } = await supabase
    .from("bids")
    .update({ status: "rejected" })
    .eq("job_id", jobId)
    .neq("id", bidId);
  if (rejectError) return { error: rejectError.message };

  const { data: acceptedBid, error: acceptError } = await supabase
    .from("bids")
    .update({ status: "accepted" })
    .eq("id", bidId)
    .select("contractor_id, amount, jobs(title)")
    .single();
  if (acceptError) return { error: acceptError.message };

  // Update job status to in_progress
  await supabase.from("jobs").update({ status: "in_progress" }).eq("id", jobId);

  // Notify winning contractor and homeowner via webhook.
  await fireWebhook("bid.accepted", {
    bid_id: bidId,
    job_id: jobId,
    job_title: (acceptedBid?.jobs as any)?.title ?? "",
    contractor_id: acceptedBid?.contractor_id ?? "",
    homeowner_id: user.id,
    amount: acceptedBid?.amount ?? 0,
  });

  revalidatePath(`/jobs/${jobId}/bids`);
  return { success: true };
}

export async function getContractorBids() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated", bids: [] };

  const { data, error } = await supabase
    .from("bids")
    .select("*, jobs(title, category, location, status, budget_min, budget_max)")
    .eq("contractor_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return { error: error.message, bids: [] };
  return { bids: data ?? [] };
}

// ── Messages ─────────────────────────────────────────────────────────────────

export async function sendMessage(formData: {
  job_id: string;
  recipient_id: string;
  content: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Demo accounts: mock success without writing to the messages table.
  if (isDemoEmail(user.email)) {
    return { success: true };
  }

  const { error } = await supabase.from("messages").insert({
    job_id: formData.job_id,
    sender_id: user.id,
    recipient_id: formData.recipient_id,
    body: formData.content,
  });

  if (error) return { error: error.message };
  revalidatePath("/inbox");
  return { success: true };
}

export async function getMessages() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated", messages: [] };

  // Step 1: Fetch messages + job title. Avoid named FK aliases that can silently
  // return null when the constraint name doesn't match the Supabase-generated name.
  const { data: messages, error } = await supabase
    .from("messages")
    .select("*, jobs(title)")
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  if (error) return { error: error.message, messages: [] };
  if (!messages || messages.length === 0) return { messages: [] };

  // Step 2: Resolve unique sender names from profiles in a single query.
  const senderIds = [...new Set(messages.map((m) => m.sender_id).filter(Boolean))];
  let profileMap: Record<string, string> = {};
  if (senderIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", senderIds);
    if (profiles) {
      profileMap = Object.fromEntries(profiles.map((p) => [p.id, p.full_name ?? ""]));
    }
  }

  const enriched = messages.map((m) => ({
    ...m,
    sender: { full_name: profileMap[m.sender_id] ?? "Unknown" },
  }));

  return { messages: enriched };
}

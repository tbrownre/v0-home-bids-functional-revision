"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
```
import { redirect } from "next/navigation";
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
  const { data, error } = await supabase
    .from("jobs")
    .select("*, profiles(full_name), bids(*, contractor_profiles(business_name), profiles(full_name))")
    .eq("id", id)
    .single();

  if (error) return { error: error.message, job: null };
  return { job: data };
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
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath(`/jobs/${formData.job_id}/bids`);
  return { success: true, bid: data };
}

export async function acceptBid(bidId: string, jobId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Mark selected bid as accepted, others as rejected
  const { error: rejectError } = await supabase
    .from("bids")
    .update({ status: "rejected" })
    .eq("job_id", jobId)
    .neq("id", bidId);
  if (rejectError) return { error: rejectError.message };

  const { error: acceptError } = await supabase
    .from("bids")
    .update({ status: "accepted" })
    .eq("id", bidId);
  if (acceptError) return { error: acceptError.message };

  // Update job status
  await supabase.from("jobs").update({ status: "in_progress" }).eq("id", jobId);

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

  const { data, error } = await supabase
    .from("messages")
    .select("*, jobs(title), sender:profiles!messages_sender_id_fkey(full_name)")
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  if (error) return { error: error.message, messages: [] };
  return { messages: data ?? [] };
}

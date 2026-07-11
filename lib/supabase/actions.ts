"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const MAKE_WEBHOOK_URL = "https://hook.us2.make.com/1v7w6jnit6c3cbddxsqeyrobgnf21su9";

function getConfirmUrl() {
  // In development/preview only, allow the v0 redirect override so Supabase
  // email links work inside the v0 sandbox. In production this variable must
  // NOT override the canonical site URL — otherwise confirmation emails sent
  // to real users would redirect through the v0 preview domain.
  const isDev = process.env.NODE_ENV !== "production";
  const devOverride = isDev ? process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL : undefined;
  const base = devOverride || process.env.NEXT_PUBLIC_SITE_URL || "https://homebids.ai";
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

// Low-friction contractor signup. Only the minimum fields needed to create an
// account and start building bids are required: name, phone, company name,
// trade, and service area (plus email/password for auth). Everything else —
// license, insurance, website, logo, etc. — is completed later from the
// contractor's Account area, and never blocks activation.
export async function signUpContractor(formData: {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  companyName: string;
  trade: string;
  serviceArea: string;
}) {
  const supabase = await createClient();

  const fullName = formData.fullName.trim();
  const companyName = formData.companyName.trim();
  const trade = formData.trade.trim();
  const serviceArea = formData.serviceArea.trim();

  // Minimal server-side validation mirroring the client requirements.
  if (!fullName || !formData.phone.trim() || !companyName || !trade || !serviceArea) {
    return { error: "Please fill in your name, phone, company, trade, and service area." };
  }

  // 1. Create the auth user with the admin API and auto-confirm the email.
  //
  // We intentionally do NOT use auth.signUp here: signUp always tries to send a
  // confirmation email, and Supabase's built-in email service is heavily
  // rate-limited ("email rate limit exceeded"). Contractor accounts are active
  // immediately (no approval gate and no email verification required), so we
  // create the user pre-confirmed via the service-role admin client — no email
  // is ever sent — and then sign them in below to establish a session.
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: formData.email,
    password: formData.password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      user_type: "contractor",
      business_name: companyName,
      phone: formData.phone,
    },
  });
  if (error) {
    const msg = error.message.toLowerCase();
    if (
      msg.includes("already registered") ||
      msg.includes("already exists") ||
      msg.includes("already been registered")
    ) {
      return { error: "already_registered", email: formData.email };
    }
    return { error: error.message };
  }

  const userId = data.user?.id;
  if (!userId) return { error: "Failed to create user account." };

  // The handle_new_user trigger already inserts into profiles.
  // Insert only the minimum into contractor_profiles. The account is active
  // immediately — no approval gate — so the contractor can build bids right away.
  // The admin client bypasses RLS for this trusted, server-only write.
  const { error: contractorError } = await admin.from("contractor_profiles").insert({
    id: userId,
    business_name: companyName,
    specialties: [trade],
    service_area: serviceArea,
    approval_status: "approved",
    is_verified: false,
    is_approved: true,
  });
  if (contractorError) {
    // Friendly error — don't expose raw DB messages to the UI
    console.error("[signUpContractor] contractor_profiles insert error:", contractorError.message);
    return { error: "We couldn't save your contractor details. Please try again or contact support." };
  }

  await fireWebhook("user.signup", {
    user_type: "contractor",
    email: formData.email,
    full_name: fullName,
    business_name: companyName,
    trade,
    service_area: serviceArea,
    phone: formData.phone,
  });

  // Establish a session on the cookie-based server client so the contractor is
  // signed in and can go straight to the dashboard. If this fails for any
  // reason, the account still exists — they can sign in manually.
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  });
  if (signInError) {
    console.error("[signUpContractor] auto sign-in error:", signInError.message);
    return { success: true, userId, signedIn: false };
  }

  return { success: true, userId, signedIn: true };
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

/** Claim a homeowner account using a claim token and set a password. */
export async function claimAccount(token: string, password: string): Promise<{ error?: string }> {
  const adminClient = createAdminClient();
  const supabase = await createClient();

  try {
    // 1. Find the profile by claim_token
    const { data: profile, error: queryError } = await adminClient
      .from("profiles")
      .select("id, email, claimed_at")
      .eq("claim_token", token)
      .maybeSingle();

    if (queryError || !profile) {
      return { error: "This link is invalid or expired." };
    }

    // 2. Check if already claimed
    if (profile.claimed_at) {
      return { error: "Account already claimed — sign in instead" };
    }

    // 3. Update the user password (admin API)
    const { error: updateError } = await adminClient.auth.admin.updateUserById(profile.id, {
      password,
    });

    if (updateError) {
      return { error: "Failed to set password. Please try again." };
    }

    // 4. Mark as claimed
    const { error: claimedError } = await adminClient
      .from("profiles")
      .update({ claimed_at: new Date().toISOString() })
      .eq("id", profile.id);

    if (claimedError) {
      return { error: "Failed to save. Please try again." };
    }

    // 5. Sign in the user server-side (sets cookies)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password,
    });

    if (signInError) {
      return { error: "Failed to sign in. Please try again." };
    }

    // 6. Redirect to homeowner dashboard
    revalidatePath("/", "layout");
    redirect("/homeowners/dashboard");
  } catch (e) {
    return { error: (e as Error).message || "An error occurred." };
  }
}

/**
 * Sign in a homeowner using phone number + password.
 * Normalizes phone to last 10 digits, finds the profile, and signs in with email.
 */
export async function phoneSignIn(phone: string, password: string): Promise<{ error?: string }> {
  const adminClient = createAdminClient();
  const supabase = await createClient();

  try {
    // Normalize phone: extract last 10 digits
    const normalized = phone.replace(/\D/g, "").slice(-10);
    if (normalized.length !== 10) {
      return { error: "Phone or password incorrect" };
    }

    // Find profile by phone (last 10 digits)
    const { data: profile, error: queryError } = await adminClient
      .from("profiles")
      .select("id, email")
      .eq("user_type", "homeowner")
      .filter("phone", "ilike", `%${normalized}`)
      .maybeSingle();

    if (queryError || !profile) {
      return { error: "Phone or password incorrect" };
    }

    // Sign in with email + password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password,
    });

    if (signInError) {
      return { error: "Phone or password incorrect" };
    }

    // Redirect to homeowner dashboard
    revalidatePath("/", "layout");
    redirect("/homeowners/dashboard");
  } catch (e) {
    return { error: "Phone or password incorrect" };
  }
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
      (bid.profiles as { full_name?: string | null } | null)?.full_name ??
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
    job_title: (data.jobs as { title?: string } | null)?.title ?? "",
    homeowner_id: (data.jobs as { homeowner_id?: string } | null)?.homeowner_id ?? "",
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
    job_title: (acceptedBid?.jobs as { title?: string } | null)?.title ?? "",
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

// ── Messages ──────────────────────────�����─────────────────��────────────────���───

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

// ── Extended bid actions ──────────────────────────────────────────────────────

export type BidStatus =
  | "draft"
  | "ready_to_send"
  | "sent"
  | "question_asked"
  | "approved"
  | "declined"
  | "completed";

/** Load a single bid with contractor profile and job details for the proposal page. */
export async function getBidById(bidId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bids")
    .select("*, jobs(id, title, description, category, location, urgency, budget_min, budget_max, homeowner_id), profiles(id, full_name, avatar_url)")
    .eq("id", bidId)
    .single();
  if (error) return { bid: null, error: error.message };
  return { bid: data, error: null };
}

/** Update bid status. Used on the proposal page for approve/decline/question flows. */
export async function updateBidStatus(bidId: string, status: BidStatus) {
  // TODO: verify the caller is the homeowner linked to this bid's job before updating
  const supabase = await createClient();
  const { error } = await supabase
    .from("bids")
    .update({ status })
    .eq("id", bidId);
  if (error) return { error: error.message };
  revalidatePath(`/proposal/${bidId}`);
  return { success: true };
}

/** Persist a homeowner question on a bid and notify the contractor. */
export async function saveHomeownerQuestion(bidId: string, question: string) {
  // TODO: persist to a bid_questions or homeowner_notes column when table is ready
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  await fireWebhook("bid.question_asked", { bid_id: bidId, homeowner_id: user.id, question });
  return { success: true };
}

/** Load all bids for a job. */
export async function getBidsByJobId(jobId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bids")
    .select("*, profiles(id, full_name)")
    .eq("job_id", jobId)
    .order("created_at", { ascending: false });
  if (error) return { bids: [], error: error.message };
  return { bids: data ?? [], error: null };
}

// ── Job status / outreach ─────────────────────────────────────────────────────

/** Full job status for the homeowner status page including outreach + bid counts. */
export async function getJobStatus(jobId: string) {
  const supabase = await createClient();
  const { data: job, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", jobId)
    .single();
  if (error || !job) return { jobStatus: null, error: error?.message ?? "Not found" };

  const { count: bidCount } = await supabase
    .from("bids")
    .select("id", { count: "exact", head: true })
    .eq("job_id", jobId);

  return {
    jobStatus: {
      job,
      contractorsContacted: 0,   // TODO: load from contractor_invites table
      contractorsInterested: 0,  // TODO: load from contractor_replies table
      bidsReceived: bidCount ?? 0,
      outreachStatus: "pending" as const,  // TODO: load from outreach_runs table
    },
    error: null,
  };
}

/** Load outreach run for a job (placeholder until outreach_runs table exists). */
export async function getOutreachRunByJobId(_jobId: string) {
  // TODO: query outreach_runs table
  return { outreachRun: null, error: null };
}

/** Load contractor invites for a job (placeholder until contractor_invites table exists). */
export async function getContractorInvitesByJobId(_jobId: string) {
  // TODO: query contractor_invites table
  return { invites: [], error: null };
}

/** Load contractor replies for a job (placeholder until contractor_replies table exists). */
export async function getContractorRepliesByJobId(_jobId: string) {
  // TODO: query contractor_replies table
  return { replies: [], error: null };
}

// ── Contractor opportunity ────────────────────────────────────────────────────

/** Load a job opportunity for the contractor bridge page — alias of getJobById. */
export async function getJobOpportunity(jobId: string) {
  return getJobById(jobId);
}

/** Record contractor interest in a job; fires webhook for n8n to pick up. */
export async function createContractorInterest(jobId: string, contractorId?: string) {
  // TODO: upsert into contractor_interests table once it exists
  await fireWebhook("contractor.interested", {
    job_id: jobId,
    contractor_id: contractorId ?? "anonymous",
  });
  return { success: true };
}

/** Create a bid draft from a job for the Bid Builder preload flow. */
export async function createBidFromJob(jobId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    // Unauthenticated — allow sample/demo bid, prompt signup before saving
    return { bidId: null, requiresAuth: true };
  }
  // TODO: insert a bid row with status="draft" and return new bidId
  return { bidId: null, requiresAuth: false };
}

// ── Contractor profile ────────────────────────────────────────────────────────

// ── User profiles ────────────────────────────────────────────────────────────

/** Load the current user's profile (full_name, email, phone). */
export async function getUserProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { profile: null, error: "Not authenticated" };
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  if (error) return { profile: null, error: error.message };
  return { profile: data, error: null };
}

/** Update the current user's profile fields (full_name, phone). */
export async function updateUserProfile(updates: { full_name?: string; phone?: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/profile");
  return { error: null };
}

/** Load the current contractor's profile completion data. */
export async function getContractorProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { profile: null, error: "Not authenticated" };
  const { data, error } = await supabase
    .from("contractor_profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  if (error) return { profile: null, error: error.message };
  return { profile: data, error: null };
}

/** Upsert contractor profile completion data. */
export async function updateContractorProfile(profile: {
  business_name?: string | null;
  logo_url?: string | null;
  bio?: string | null;
  website?: string | null;
  business_address?: string | null;
  license_number?: string | null;
  insurance_details?: string | null;
  years_experience?: number | null;
  google_review_link?: string | null;
  specialties?: string[];
  social_links?: Record<string, string>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const { error } = await supabase
    .from("contractor_profiles")
    .upsert({ id: user.id, ...profile }, { onConflict: "id" });
  if (error) return { error: error.message };
  revalidatePath("/contractors/dashboard");
  return { error: null };
}

// ── Proposals (Online Bid Builder) ────────────────────────────────────────────

/** Fetch a proposal by ID for editing (only owner can read via RLS). */
export async function getProposalById(proposalId: string): Promise<{ proposal: any | null; error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { proposal: null, error: "Not authenticated" };

  try {
    const { data, error } = await supabase
      .from("proposals")
      .select("*")
      .eq("id", proposalId)
      .maybeSingle();

    if (error) return { proposal: null, error: error.message };
    if (!data) return { proposal: null, error: "Proposal not found" };

    return { proposal: data, error: null };
  } catch (e) {
    return { proposal: null, error: (e as Error).message };
  }
}

export interface CreateProposalInput {
  homeownerName?: string;
  projectTitle: string;
  projectSummary?: string;
  scopeItems: Array<{ title: string; description?: string }>;
  totalPrice?: number;
  priceNote?: string;
  addOns?: Array<{ title: string }>;
  timelineCompletion?: string;
}

/** Create a real proposal in the database from the online Bid Builder. */
export async function createProposalFromBuilder(
  input: CreateProposalInput,
): Promise<{ shareToken: string | null; proposalId: string | null; error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { shareToken: null, proposalId: null, error: "Not authenticated" };

  try {
    // Load contractor branding
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .maybeSingle();

    const { data: contractorProfile } = await supabase
      .from("contractor_profiles")
      .select("business_name, logo_url")
      .eq("id", user.id)
      .maybeSingle();

    // Generate share token: 12-char lowercase alphanumeric
    const token1 = Math.random().toString(36).substring(2, 8);
    const token2 = Math.random().toString(36).substring(2, 8);
    const shareToken = (token1 + token2).substring(0, 12);

    // INSERT proposal
    const { data: inserted, error: insertError } = await supabase
      .from("proposals")
      .insert({
        share_token: shareToken,
        contractor_id: user.id,
        contractor_company_name: contractorProfile?.business_name || profile?.full_name,
        contractor_phone: profile?.phone,
        contractor_logo_url: contractorProfile?.logo_url,
        homeowner_name: input.homeownerName,
        project_title: input.projectTitle,
        project_summary: input.projectSummary,
        scope_items: input.scopeItems || [],
        total_price: input.totalPrice,
        price_note: input.priceNote,
        add_ons: input.addOns || [],
        timeline_completion: input.timelineCompletion,
        status: "draft",
      })
      .select("id")
      .maybeSingle();

    if (insertError) {
      return { shareToken: null, proposalId: null, error: insertError.message };
    }

    revalidatePath("/contractors/dashboard");
    return {
      shareToken,
      proposalId: inserted?.id || null,
      error: null,
    };
  } catch (e) {
    return {
      shareToken: null,
      proposalId: null,
      error: (e as Error).message || "Failed to create proposal",
    };
  }
}

/** Update an existing draft proposal (keeps share_token, updates status to 'sent' on approve). */
export async function updateProposalFromBuilder(
  proposalId: string,
  input: CreateProposalInput & { status?: string },
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  try {
    const { error } = await supabase
      .from("proposals")
      .update({
        homeowner_name: input.homeownerName || null,
        project_title: input.projectTitle,
        project_summary: input.projectSummary || null,
        scope_items: input.scopeItems || [],
        total_price: input.totalPrice || null,
        price_note: input.priceNote || null,
        add_ons: input.addOns || [],
        timeline_completion: input.timelineCompletion || null,
        status: input.status || "draft",
      })
      .eq("id", proposalId)
      .eq("contractor_id", user.id); // Ensure ownership

    if (error) return { error: error.message };

    revalidatePath("/contractors/dashboard");
    return { error: null };
  } catch (e) {
    return { error: (e as Error).message || "Failed to update proposal" };
  }
}

// ── Notifications ─────────────────────────────────────────────────────────────

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  href: string;
  created_at: string;
  read: boolean;
}

/** Assemble real notifications from database events. Capped at 30, newest first. */
export async function getNotificationsFeed(): Promise<{
  notifications: NotificationItem[];
  error: string | null;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { notifications: [], error: "Not authenticated" };

  // Get user's profile to check user_type and notifications_seen_at
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("user_type, notifications_seen_at")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profileData) {
    return { notifications: [], error: profileError?.message ?? "Profile not found" };
  }

  const isContractor = profileData.user_type === "contractor";
  const seenAt = profileData.notifications_seen_at ? new Date(profileData.notifications_seen_at) : new Date(0);
  const notifications: NotificationItem[] = [];

  if (isContractor) {
    // Contractor notifications: proposal events, accepted bids, new open jobs

    // 1. Proposal events (view, approval_clicked, call_clicked, pdf_download)
    const { data: proposalEvents } = await supabase
      .from("proposals")
      .select("id, project_title, view_count, approval_clicked_at, call_clicked_at, pdf_downloaded_at, created_at, share_token")
      .eq("contractor_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);

    if (proposalEvents) {
      for (const p of proposalEvents) {
        if (p.view_count && p.view_count > 0) {
          notifications.push({
            id: `proposal-view-${p.id}`,
            type: "proposal_viewed",
            title: `Your proposal '${p.project_title}' was viewed`,
            href: `/p/${p.share_token}`,
            created_at: p.created_at,
            read: new Date(p.created_at) <= seenAt,
          });
        }
        if (p.approval_clicked_at) {
          notifications.push({
            id: `proposal-approval-${p.id}`,
            type: "proposal_approval_clicked",
            title: `'${p.project_title}': homeowner clicked Approve — reach out!`,
            href: `/p/${p.share_token}`,
            created_at: p.approval_clicked_at,
            read: new Date(p.approval_clicked_at) <= seenAt,
          });
        }
        if (p.call_clicked_at) {
          notifications.push({
            id: `proposal-call-${p.id}`,
            type: "proposal_call_clicked",
            title: `'${p.project_title}': homeowner tapped Call`,
            href: `/p/${p.share_token}`,
            created_at: p.call_clicked_at,
            read: new Date(p.call_clicked_at) <= seenAt,
          });
        }
        if (p.pdf_downloaded_at) {
          notifications.push({
            id: `proposal-pdf-${p.id}`,
            type: "proposal_pdf_downloaded",
            title: `'${p.project_title}': PDF downloaded`,
            href: `/p/${p.share_token}`,
            created_at: p.pdf_downloaded_at,
            read: new Date(p.pdf_downloaded_at) <= seenAt,
          });
        }
      }
    }

    // 2. Accepted bids
    const { data: acceptedBids } = await supabase
      .from("bids")
      .select("id, job_id, amount, updated_at, jobs(title)")
      .eq("contractor_id", user.id)
      .eq("status", "accepted")
      .order("updated_at", { ascending: false })
      .limit(30);

    if (acceptedBids) {
      for (const bid of acceptedBids) {
        const job = Array.isArray(bid.jobs) ? bid.jobs[0] : bid.jobs;
        notifications.push({
          id: `bid-accepted-${bid.id}`,
          type: "bid_accepted",
          title: `You won '${job?.title || "a job"}'!`,
          href: "/contractors/dashboard?tab=bids",
          created_at: bid.updated_at,
          read: new Date(bid.updated_at) <= seenAt,
        });
      }
    }

    // 3. New open jobs in the last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: newJobs } = await supabase
      .from("jobs")
      .select("id, title, location, created_at")
      .eq("status", "open")
      .gt("created_at", sevenDaysAgo)
      .order("created_at", { ascending: false })
      .limit(30);

    if (newJobs) {
      for (const job of newJobs) {
        notifications.push({
          id: `job-new-${job.id}`,
          type: "job_new",
          title: `New job: ${job.title}${job.location ? ` — ${job.location}` : ""}`,
          href: `/contractor/opportunity/${job.id}`,
          created_at: job.created_at,
          read: new Date(job.created_at) <= seenAt,
        });
      }
    }
  } else {
    // Homeowner notifications: bids on their jobs
    const { data: bidsData } = await supabase
      .from("bids")
      .select("id, job_id, contractor_id, amount, created_at, jobs(title), profiles(full_name)")
      .eq("jobs.homeowner_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);

    if (bidsData) {
      for (const bid of bidsData) {
        const job = Array.isArray(bid.jobs) ? bid.jobs[0] : bid.jobs;
        const contractor = Array.isArray(bid.profiles) ? bid.profiles[0] : bid.profiles;
        notifications.push({
          id: `bid-received-${bid.id}`,
          type: "bid_received",
          title: `New bid on '${job?.title || "your job"}': $${(bid.amount / 100).toLocaleString()}`,
          href: `/jobs/${bid.job_id}/bids`,
          created_at: bid.created_at,
          read: new Date(bid.created_at) <= seenAt,
        });
      }
    }
  }

  // Sort by created_at descending, cap at 30
  notifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const result = notifications.slice(0, 30);

  return { notifications: result, error: null };
}

/** Mark all notifications as seen by updating profiles.notifications_seen_at. */
export async function markNotificationsSeen(): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("profiles")
    .update({ notifications_seen_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/inbox");
  revalidatePath("/contractors/dashboard");
  return { error: null };
}

// ── Admin outreach ────────────────────────────────────────────────────────────

/** Load all recent jobs for the admin outreach view. */
export async function getAdminJobs() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("jobs")
    .select("*, bids(count)")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) return { jobs: [], error: error.message };
  return { jobs: data ?? [], error: null };
}

/** Load outreach runs for admin view (placeholder until outreach_runs table exists). */
export async function getAdminOutreachRuns() {
  // TODO: query outreach_runs joined with contractor_invites and contractor_replies
  return { runs: [], error: null };
}

"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const EVENTS_WEBHOOK_URL = "https://vmi3163821.contaboserver.net/webhook/homebids-events";

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
    await fetch(EVENTS_WEBHOOK_URL, {
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
export async function claimAccount(token: string, password: string): Promise<{ success?: boolean; error?: string }> {
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

    // 6. Revalidate and return success (client will redirect)
    revalidatePath("/", "layout");
    return { success: true };
  } catch (e) {
    return { error: (e as Error).message || "An error occurred." };
  }
}

/**
 * Sign in a homeowner using phone number + password.
 * Normalizes phone to last 10 digits, finds the profile, and signs in with email.
 */
export async function phoneSignIn(phone: string, password: string): Promise<{ success?: boolean; error?: string }> {
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

    // Revalidate and return success (client will redirect)
    revalidatePath("/", "layout");
    return { success: true };
  } catch (e) {
    return { error: "Phone or password incorrect" };
  }
}

/**
 * Retrieve safe claim information for the claim flow (server-side only).
 * Returns masked phone and first name, or null if invalid/already claimed.
 */
export async function getClaimInfo(token: string): Promise<{
  firstName: string | null;
  phoneMasked: string | null;
  alreadyClaimed: boolean;
} | null> {
  const adminClient = createAdminClient();

  try {
    const { data: profile, error: queryError } = await adminClient
      .from("profiles")
      .select("full_name, phone, claimed_at")
      .eq("claim_token", token)
      .maybeSingle();

    if (queryError || !profile) {
      return null;
    }

    // Extract first name (first word of full_name)
    const firstName = profile.full_name?.split(" ")[0] || null;

    // Mask phone: keep last 4 digits, mask the rest
    let phoneMasked: string | null = null;
    if (profile.phone) {
      const digits = profile.phone.replace(/\D/g, "");
      if (digits.length >= 4) {
        const lastFour = digits.slice(-4);
        phoneMasked = `(555) •••-${lastFour}`;
      }
    }

    return {
      firstName,
      phoneMasked,
      alreadyClaimed: !!profile.claimed_at,
    };
  } catch (e) {
    return null;
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
    .maybeSingle();

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

// ── Bids ────────────────────────────────────────────────────────────���────────

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
  revalidatePath(`/jobs`); // Update bid count on Browse Jobs page
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
  const adminClient = createAdminClient();
  
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

  // Load outreach run data for this job
  const { data: outreachRun } = await adminClient
    .from("outreach_runs")
    .select("status, contractors_contacted")
    .eq("job_id", jobId)
    .maybeSingle();

  // Map outreach status: 'running' → 'active', 'completed' → 'completed', 'failed' → 'failed', no row → 'pending'
  const mapOutreachStatus = (status?: string | null): "pending" | "active" | "completed" | "failed" => {
    if (!status) return "pending";
    if (status === "running") return "active";
    if (status === "completed") return "completed";
    if (status === "failed") return "failed";
    return "pending";
  };

  return {
    jobStatus: {
      job,
      contractorsContacted: outreachRun?.contractors_contacted ?? 0,
      contractorsInterested: 0,  // No data source yet
      bidsReceived: bidCount ?? 0,
      outreachStatus: mapOutreachStatus(outreachRun?.status),
    },
    error: null,
  };
}

/** Load outreach run for a job. */
export async function getOutreachRunByJobId(jobId: string) {
  try {
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from("outreach_runs")
      .select("*")
      .eq("job_id", jobId)
      .maybeSingle();
    
    return { outreachRun: data ?? null, error: error?.message ?? null };
  } catch (e) {
    return { outreachRun: null, error: (e as Error).message ?? "Unknown error" };
  }
}

/** Load contractor invites for a job (placeholder until contractor_invites table exists). */
export async function getContractorInvitesByJobId(_jobId: string) {
  // TODO: query contractor_invites table
  return { invites: [], error: null };
}

/** Load contractor replies for a job (placeholder until contractor_replies table exists). */
export async function getContractorRepliesByJobId(jobId: string) {
  try {
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from("outreach_replies")
      .select("*")
      .eq("job_id", jobId)
      .order("received_at", { ascending: false });
    
    return { replies: data ?? [], error: error?.message ?? null };
  } catch (e) {
    return { replies: [], error: (e as Error).message ?? "Unknown error" };
  }
}

/** Load all contractor email replies for admin dashboard. */
export async function getAdminReplies() {
  try {
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from("outreach_replies")
      .select("*")
      .order("received_at", { ascending: false })
      .limit(100);
    
    return { replies: data ?? [], error: error?.message ?? null };
  } catch (e) {
    return { replies: [], error: (e as Error).message ?? "Unknown error" };
  }
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
  jobId?: string | null;
}

/** Create a real proposal in the database from the online Bid Builder. */
export async function createProposalFromBuilder(
  input: CreateProposalInput,
): Promise<{ shareToken: string | null; proposalId: string | null; error: string | null; limitExceeded?: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { shareToken: null, proposalId: null, error: "Not authenticated" };

  try {
    // For own-project bids (job_id = null), check the 5 free bid limit
    if (!input.jobId) {
      const { canCreate, count } = await checkCanCreateOwnProjectBid(user.id);
      if (!canCreate) {
        return {
          shareToken: null,
          proposalId: null,
          error: `Exceeded 5 free bids limit (${count}/5). Subscribe for unlimited own-project bids.`,
          limitExceeded: true,
        };
      }
    }

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
        job_id: input.jobId || null,
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
          title: `New bid on '${job?.title || "your job"}': $${(bid.amount).toLocaleString()}`,
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
  try {
    const adminClient = createAdminClient();
    
    // Query outreach_runs ordered by started_at descending, limit 50
    const { data: runs, error: runsError } = await adminClient
      .from("outreach_runs")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(50);
    
    if (runsError || !runs) {
      return { runs: [], error: runsError?.message ?? "Failed to load outreach runs" };
    }
    
    // Get unique job_ids and query jobs table for titles
    const jobIds = [...new Set(runs.map(r => r.job_id))];
    const { data: jobs, error: jobsError } = await adminClient
      .from("jobs")
      .select("id, title")
      .in("id", jobIds);
    
    // Build job_id → title map, fallback to "Untitled job"
    const jobTitleMap = new Map<string, string>();
    if (jobs) {
      jobs.forEach(job => {
        jobTitleMap.set(job.id, job.title ?? "Untitled job");
      });
    }
    
    // Query outreach_replies for this set of job_ids to count replies per job
    const { data: replies } = await adminClient
      .from("outreach_replies")
      .select("job_id")
      .in("job_id", jobIds);
    
    // Count replies per job_id in memory
    const repliesPerJob = new Map<string, number>();
    if (replies) {
      replies.forEach(reply => {
        const count = repliesPerJob.get(reply.job_id) ?? 0;
        repliesPerJob.set(reply.job_id, count + 1);
      });
    }
    
    // Map outreach_runs to OutreachRun interface
    const mappedRuns = runs.map(run => ({
      id: run.id,
      job_id: run.job_id,
      job_title: jobTitleMap.get(run.job_id) ?? "Untitled job",
      status: run.status === "running" ? "active" : run.status === "completed" ? "completed" : run.status === "failed" ? "failed" : "pending",
      contractors_selected: run.contractors_contacted ?? 0,
      invites_queued: 0,
      invites_sent: run.emails_sent ?? 0,
      invites_failed: 0,
      replies_received: repliesPerJob.get(run.job_id) ?? 0,
      interested_count: 0,
      bids_started: 0,
      bids_submitted: 0,
      created_at: run.started_at ?? run.created_at,
    }));
    
    return { runs: mappedRuns, error: null };
  } catch (e) {
    return { runs: [], error: (e as Error).message ?? "Unknown error" };
  }
}

export async function uploadContractorLogo(
  file: File
): Promise<{ url: string | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { url: null, error: "Not authenticated" };

    const admin = createAdminClient();
    const fileName = `contractors/${user.id}/logo-${Date.now()}`;
    const { data, error: uploadError } = await admin.storage
      .from("contractor-assets")
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      return { url: null, error: uploadError.message };
    }

    // Get public URL for the uploaded file
    const { data: { publicUrl } } = admin.storage
      .from("contractor-assets")
      .getPublicUrl(fileName);

    // Save the URL to contractor_profiles
    const { error: updateError } = await admin
      .from("contractor_profiles")
      .update({ logo_url: publicUrl })
      .eq("id", user.id);

    if (updateError) {
      return { url: null, error: updateError.message };
    }

    return { url: publicUrl, error: null };
  } catch (e) {
    return { url: null, error: (e as Error).message || "Failed to upload logo" };
  }
}

/**
 * Count the number of own-project bids (proposals with job_id = null) a contractor has created.
 * Used to enforce the 5 free bid limit for freemium contractors.
 */
export async function countOwnProjectBids(contractorId: string): Promise<{ count: number; error?: string }> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('proposals')
      .select('id', { count: 'exact', head: true })
      .eq('contractor_id', contractorId)
      .is('job_id', null);

    if (error) {
      console.error('[countOwnProjectBids] Query error:', error);
      return { count: 0, error: error.message };
    }

    return { count: data?.length || 0 };
  } catch (e) {
    console.error('[countOwnProjectBids] Error:', e);
    return { count: 0, error: (e as Error).message };
  }
}

/**
 * Check if a contractor can create another own-project bid.
 * Returns { canCreate, count, error }.
 * Subscribed contractors: always true.
 * Free contractors: limited to 5 own-project bids.
 */
export async function checkCanCreateOwnProjectBid(contractorId: string): Promise<{ canCreate: boolean; count: number; error?: string }> {
  try {
    const supabase = await createClient();

    // Check if contractor has active/trialing subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', contractorId)
      .maybeSingle();

    // Check admin status
    const { data: profile, error: profileError } = await supabase
      .from('contractor_profiles')
      .select('is_admin')
      .eq('id', contractorId)
      .maybeSingle();

    // Admins and subscribed contractors have unlimited bids
    if (profile?.is_admin || subscription?.status === 'active' || subscription?.status === 'trialing') {
      return { canCreate: true, count: 0 };
    }

    // Free contractor — count their own-project bids
    const { count } = await countOwnProjectBids(contractorId);

    return {
      canCreate: count < 5,
      count,
    };
  } catch (e) {
    console.error('[checkCanCreateOwnProjectBid] Error:', e);
    return { canCreate: false, count: 0, error: (e as Error).message };
  }
}

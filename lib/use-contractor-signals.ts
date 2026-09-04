"use client";

import { useEffect, useState } from "react";
import { getContractorProposals, type Proposal } from "@/lib/supabase/proposals";
import { createClient } from "@/lib/supabase/client";

// Shape of a row returned by the `my_contractor_threads` RPC.
export interface ContractorThread {
  job_ref: string;
  title: string;
  location: string;
  c_token: string;
  workspace: string;
  state: string;
  homeowner_first: string;
  display_name: string;
  last_message: string;
  last_sender: string;
  last_at: string;
}

export interface ContractorProfile {
  business_name?: string | null;
  logo_url?: string | null;
  bio?: string | null;
  website?: string | null;
  business_address?: string | null;
  license_number?: string | null;
  insurance_details?: string | null;
  years_experience?: number | null;
  google_review_link?: string | null;
  specialties?: string[] | null;
  social_links?: Record<string, string> | null;
}

// The 11 profile fields that make up completion (matches the Account form).
export const PROFILE_FIELD_KEYS = [
  "business_name",
  "logo_url",
  "bio",
  "website",
  "business_address",
  "license_number",
  "insurance_details",
  "years_experience",
  "google_review_link",
  "specialties",
  "social_links",
] as const;

export type ProfileFieldKey = (typeof PROFILE_FIELD_KEYS)[number];

export const PROFILE_FIELD_LABELS: Record<ProfileFieldKey, string> = {
  business_name: "Business Name",
  logo_url: "Company Logo",
  bio: "Company Description",
  website: "Website",
  business_address: "Business Address",
  license_number: "License Number",
  insurance_details: "Insurance Details",
  years_experience: "Years in Business",
  google_review_link: "Google Review Link",
  specialties: "Services Offered",
  social_links: "Social Links",
};

export function isProfileFieldFilled(profile: ContractorProfile | null, key: ProfileFieldKey): boolean {
  if (!profile) return false;
  const v = profile[key];
  if (v == null) return false;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "object") return Object.keys(v).length > 0;
  if (typeof v === "number") return v > 0;
  return String(v).trim().length > 0;
}

export function profileCompletion(profile: ContractorProfile | null) {
  const total = PROFILE_FIELD_KEYS.length;
  const completed = PROFILE_FIELD_KEYS.filter((k) => isProfileFieldFilled(profile, k)).length;
  const missing = PROFILE_FIELD_KEYS.filter((k) => !isProfileFieldFilled(profile, k));
  const percent = Math.round((completed / total) * 100);
  return { completed, total, missing, percent, isComplete: completed === total };
}

export interface ContractorSignals {
  loaded: boolean;
  proposals: Proposal[];
  threads: ContractorThread[];
  profile: ContractorProfile | null;
  /** Proposals created in the current calendar month. */
  monthBidsCount: number;
}

const EMPTY: ContractorSignals = {
  loaded: false,
  proposals: [],
  threads: [],
  profile: null,
  monthBidsCount: 0,
};

function isPreviewSandbox(): boolean {
  return typeof window !== "undefined" && window.location.hostname.includes("vusercontent.net");
}

/**
 * Loads the real contractor data the dashboard/topbar/bids pages share:
 * hosted proposals, homeowner threads, and the contractor profile.
 * All loads are best-effort — a failure never breaks the page.
 */
export function useContractorSignals(): ContractorSignals {
  const [signals, setSignals] = useState<ContractorSignals>(EMPTY);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (isPreviewSandbox()) {
        if (!cancelled) setSignals((s) => ({ ...s, loaded: true }));
        return;
      }

      // Proposals (server action, uid-or-phone scoped).
      let proposals: Proposal[] = [];
      try {
        const res = await getContractorProposals();
        proposals = res.proposals ?? [];
      } catch {
        /* non-fatal */
      }

      // Contractor profile (server action).
      let profile: ContractorProfile | null = null;
      try {
        const { getContractorProfile } = await import("@/lib/supabase/actions");
        const res = await getContractorProfile();
        profile = (res.profile as ContractorProfile) ?? null;
      } catch {
        /* non-fatal */
      }

      // Homeowner threads (client RPC).
      let threads: ContractorThread[] = [];
      try {
        const supabase = createClient();
        const { data, error } = await supabase.rpc("my_contractor_threads");
        if (!error && Array.isArray(data)) threads = data as ContractorThread[];
      } catch {
        /* non-fatal */
      }

      if (cancelled) return;

      const now = new Date();
      const monthBidsCount = proposals.filter((p) => {
        if (!p.created_at) return false;
        const d = new Date(p.created_at);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      }).length;

      setSignals({ loaded: true, proposals, threads, profile, monthBidsCount });
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return signals;
}

/** Threads whose most recent message is from the homeowner (awaiting a reply). */
export function unansweredThreads(threads: ContractorThread[]): ContractorThread[] {
  // A thread needs a reply when the homeowner sent the most recent message.
  return threads.filter((t) => t.last_sender === "homeowner");
}

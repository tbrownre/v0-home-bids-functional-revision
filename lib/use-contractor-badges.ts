"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import type { ContractorSignals, ContractorThread } from "@/lib/use-contractor-signals";
import { getThreadSeenMap, isThreadUnread } from "@/lib/thread-read";
import type { Proposal } from "@/lib/supabase/proposals";

/**
 * Per-section "what's new" counts for the contractor nav (Tim, Oct 5: "What are the alerts referring to?
 * They should be next to the tab that has alert/notifications").
 *
 *  Leads     = homeowners who texted from your website since you last opened Leads
 *  Bids      = responses to your bids since you last opened Bids (viewed, Approve tapped, Call tapped,
 *              question asked, PDF downloaded, accepted)
 *  Messages  = unread homeowner messages (clears per conversation the moment you open it)
 *
 * "Last opened" is remembered on this device (localStorage); opening a section clears its count.
 * A first visit only looks back 7 days so nobody is greeted with "9+" on day one.
 */

export type BadgeSection = "leads" | "bids" | "messages";

export const SECTION_PATHS: Record<BadgeSection, string> = {
  leads: "/contractors/leads",
  bids: "/contractors/bids-history",
  messages: "/contractors/messages",
};

export interface ContractorBadges {
  leads: number;
  bids: number;
  messages: number;
  total: number;
}

export const NO_BADGES: ContractorBadges = { leads: 0, bids: 0, messages: 0, total: 0 };

const KEY = (s: BadgeSection) => `hb_seen_${s}`;
const FIRST_LOOKBACK_MS = 7 * 24 * 60 * 60 * 1000;

function readSeen(s: BadgeSection): number {
  try {
    const v = Number(localStorage.getItem(KEY(s)) || 0);
    return v > 0 ? v : Date.now() - FIRST_LOOKBACK_MS;
  } catch {
    return Date.now() - FIRST_LOOKBACK_MS;
  }
}

function writeSeen(s: BadgeSection) {
  try {
    localStorage.setItem(KEY(s), String(Date.now()));
  } catch {
    /* private mode etc. — badge just stays until next visit */
  }
}

const ts = (v: string | null | undefined) => {
  if (!v) return 0;
  const t = new Date(v).getTime();
  return Number.isFinite(t) ? t : 0;
};

/** Every homeowner response on a bid, as timestamps (one per event type per proposal). */
export function bidEventTimes(p: Proposal): number[] {
  const out = [ts(p.last_viewed_at) || ts(p.first_viewed_at), ts(p.approval_clicked_at), ts(p.call_clicked_at), ts(p.question_clicked_at), ts(p.pdf_downloaded_at)];
  if (p.status === "accepted") out.push(ts(p.updated_at));
  return out.filter((t) => t > 0);
}

/** Badge for the section this path belongs to, if any. */
export function sectionForPath(pathname: string): BadgeSection | null {
  for (const s of Object.keys(SECTION_PATHS) as BadgeSection[]) {
    const p = SECTION_PATHS[s];
    if (pathname === p || pathname.startsWith(p + "/")) return s;
  }
  return null;
}

interface Options {
  /** Only contractors have these badges. When false nothing is loaded and every count is 0. */
  enabled: boolean;
  /** Pass the already-loaded signals when the caller has them (dashboard topbar) to avoid a second fetch. */
  signals?: ContractorSignals;
}

export function useContractorBadges({ enabled, signals }: Options): ContractorBadges {
  const pathname = usePathname() ?? "";
  const [leadTimes, setLeadTimes] = useState<number[]>([]);
  const [ownProposals, setOwnProposals] = useState<Proposal[] | null>(null);
  const [ownThreads, setOwnThreads] = useState<ContractorThread[] | null>(null);
  const [seen, setSeen] = useState<Record<BadgeSection, number>>({ leads: 0, bids: 0, messages: 0 });
  const [threadSeen, setThreadSeen] = useState<Record<string, number>>({});
  const [tick, setTick] = useState(0);

  // Seen stamps live in localStorage — read after mount so server and client render the same (0) first.
  useEffect(() => {
    if (!enabled) return;
    setSeen({ leads: readSeen("leads"), bids: readSeen("bids"), messages: readSeen("messages") });
    setThreadSeen(getThreadSeenMap());
  }, [enabled, tick]);

  // Opening a section = seen (Leads/Bids). Messages clears per conversation instead (Tim, Oct 6).
  useEffect(() => {
    if (!enabled) return;
    const s = sectionForPath(pathname);
    if (!s || s === "messages") return;
    writeSeen(s);
    setSeen((prev) => ({ ...prev, [s]: Date.now() }));
  }, [enabled, pathname]);

  // Re-read when another tab marks something seen, and refresh data when the tab comes back.
  useEffect(() => {
    if (!enabled) return;
    const onStorage = (e: StorageEvent) => { if (e.key && e.key.startsWith("hb_seen_")) setTick((t) => t + 1); };
    const onFocus = () => setTick((t) => t + 1);
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);
    return () => { window.removeEventListener("storage", onStorage); window.removeEventListener("focus", onFocus); };
  }, [enabled]);

  // Page leads (always loaded here — the signals hook does not carry them).
  useEffect(() => {
    if (!enabled) return;
    if (typeof window !== "undefined" && window.location.hostname.includes("vusercontent.net")) return;
    let cancelled = false;
    (async () => {
      try {
        const { getMyPageLeads } = await import("@/lib/supabase/page-leads");
        const res = await getMyPageLeads(100);
        if (!cancelled) setLeadTimes((res.leads ?? []).map((l) => ts(l.created_at)).filter((t) => t > 0));
      } catch {
        /* non-fatal */
      }
    })();
    return () => { cancelled = true; };
  }, [enabled, tick]);

  // Proposals + threads only when the caller did not hand us signals (marketing-page header).
  useEffect(() => {
    if (!enabled || signals) return;
    if (typeof window !== "undefined" && window.location.hostname.includes("vusercontent.net")) return;
    let cancelled = false;
    (async () => {
      try {
        const { getContractorProposals } = await import("@/lib/supabase/proposals");
        const res = await getContractorProposals();
        if (!cancelled) setOwnProposals(res.proposals ?? []);
      } catch {
        if (!cancelled) setOwnProposals([]);
      }
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data, error } = await supabase.rpc("my_contractor_threads");
        if (!cancelled) setOwnThreads(!error && Array.isArray(data) ? (data as ContractorThread[]) : []);
      } catch {
        if (!cancelled) setOwnThreads([]);
      }
    })();
    return () => { cancelled = true; };
  }, [enabled, signals, tick]);

  return useMemo<ContractorBadges>(() => {
    if (!enabled) return NO_BADGES;
    const proposals = signals ? signals.proposals : ownProposals ?? [];
    const threads = signals ? signals.threads : ownThreads ?? [];
    const leads = seen.leads ? leadTimes.filter((t) => t > seen.leads).length : 0;
    const bids = seen.bids ? proposals.reduce((n, p) => n + bidEventTimes(p).filter((t) => t > seen.bids).length, 0) : 0;
    const messages = threads.filter((t) => isThreadUnread(t, threadSeen)).length;
    return { leads, bids, messages, total: leads + bids + messages };
  }, [enabled, signals, ownProposals, ownThreads, leadTimes, seen, threadSeen]);
}

/** The little red counter used next to nav items. */
export function badgeText(n: number): string {
  return n > 9 ? "9+" : String(n);
}

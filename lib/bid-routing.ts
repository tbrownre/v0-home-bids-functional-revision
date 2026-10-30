import type { Proposal } from "@/lib/supabase/proposals";
import type { BidQuestion } from "@/lib/supabase/bid-questions";

/**
 * Where a bid row opens (Bids page + dashboard share one rule).
 *
 * LIVEBIDS (Tim, Oct 7): accepted -> the approved project page, anything else -> the hosted bid.
 * QUESTIONS (Tim, Oct 29: "Why is it opening the estimate? Shouldn't it open the private link that contains the chat
 * between homeowner contractor?"): a bid the homeowner asked about opens the conversation instead -
 *   marketplace bid  -> the private thread /c/<c_token>
 *   own-customer bid -> the Bids page conversation panel (?chat=<share_token>) that replies by text relay
 */
export type BidTargetKind = "project" | "thread" | "conversation" | "bid";

export interface BidTarget {
  href: string;
  external: boolean;
  hint: string;
  kind: BidTargetKind;
}

const QUESTION_STATUSES = new Set(["question_asked", "changes_requested"]);

/** The question row that should drive this bid's routing, if any. */
export function activeQuestion(p: Proposal, q: BidQuestion | undefined): BidQuestion | null {
  if (!q || !q.question) return null;
  if (QUESTION_STATUSES.has(p.status)) return q;
  return q.last_sender === "homeowner" ? q : null;
}

export function bidTarget(p: Proposal, q?: BidQuestion): BidTarget {
  if (p.status === "accepted") {
    return { href: `/contractors/project/${p.share_token}`, external: false, hint: "Open the approved project", kind: "project" };
  }
  const aq = activeQuestion(p, q);
  if (aq) {
    if (aq.kind === "thread" && aq.c_token) {
      return { href: `/c/${aq.c_token}`, external: false, hint: "Open the conversation with the homeowner", kind: "thread" };
    }
    if (aq.kind === "text") {
      return { href: `/contractors/bids-history?chat=${encodeURIComponent(p.share_token)}`, external: false, hint: "Open the conversation with the homeowner", kind: "conversation" };
    }
  }
  return { href: `/p/${p.share_token}`, external: true, hint: p.status === "draft" ? "Open the current draft" : "Open the live bid", kind: "bid" };
}

export function firstName(name: string | null | undefined, fallback = "The homeowner"): string {
  const n = (name ?? "").trim();
  return n ? n.split(/\s+/)[0] : fallback;
}

export function questionAgo(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const s = Math.max(0, (Date.now() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

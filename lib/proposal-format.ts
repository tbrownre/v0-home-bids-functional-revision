import type { ProposalStatus } from "@/lib/supabase/proposals";

/** Format a number as USD with no cents. */
export function formatPrice(amount: number | null | undefined): string {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Compact relative time, e.g. "12 minutes ago", "3 days ago". */
export function timeAgo(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  const diff = Date.now() - then;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  const months = Math.round(days / 30);
  return `${months} month${months === 1 ? "" : "s"} ago`;
}

/** Long date like "June 29, 2026". */
export function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

/** Contractor-facing view summary copy. */
export function viewSummary(viewCount: number, lastViewedAt: string | null): string {
  if (!viewCount) return "Not viewed yet";
  const last = timeAgo(lastViewedAt);
  const base =
    viewCount === 1 ? "Viewed once" : `Viewed ${viewCount} times`;
  return last ? `${base} · Last opened ${last}` : base;
}

export interface StatusMeta {
  label: string;
  /** Tailwind classes for a badge (bg + text). */
  className: string;
}

/** Map proposal status to a homeowner/contractor-friendly badge. */
export function statusMeta(status: ProposalStatus): StatusMeta {
  switch (status) {
    case "draft":
      return { label: "Draft", className: "bg-muted text-muted-foreground" };
    case "sent":
      return { label: "Sent", className: "bg-blue-50 text-blue-700" };
    case "viewed":
      return { label: "Viewed", className: "bg-sky-50 text-sky-700" };
    case "question_asked":
      return { label: "Question Asked", className: "bg-amber-50 text-amber-700" };
    case "approval_clicked":
      return { label: "Approval Clicked", className: "bg-emerald-50 text-emerald-700" };
    case "accepted":
      return { label: "Accepted", className: "bg-green-100 text-green-800" };
    case "changes_requested":
      return { label: "Changes Requested", className: "bg-orange-50 text-orange-700" };
    default:
      return { label: "Sent", className: "bg-blue-50 text-blue-700" };
  }
}

/** Prefilled SMS bodies for homeowner CTAs (per spec). */
export const PROPOSAL_SMS = {
  accept: "Hi, I approve this proposal and would like to move forward.",
  question: "Hi, I reviewed the proposal and have a few questions/changes.",
} as const;

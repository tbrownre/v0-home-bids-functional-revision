"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Inbox, MessageSquareText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSmsHref, CONTRACTOR_SMS_PHONE_NUMBER } from "@/lib/sms-config";
import { formatPrice } from "@/lib/proposal-format";
import { getMyPageLeads, type PageLead } from "@/lib/supabase/page-leads";
import { leadLabel } from "@/lib/page-lead-label";

const CARD = "rounded-[22px] border border-border bg-card shadow-[0_10px_30px_rgba(16,17,20,0.06)]";

function whenLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const today = new Date();
  const same = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (same(d, today)) return "Today";
  if (same(d, yesterday)) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function bidLabel(status: string | null): string {
  switch (status) {
    case "accepted":
      return "Accepted";
    case "approval_clicked":
      return "Approval clicked";
    case "question_asked":
      return "Question asked";
    case "changes_requested":
      return "Changes requested";
    case "viewed":
      return "Bid viewed";
    case "draft":
      return "Bid drafted";
    default:
      return "Bid sent";
  }
}

/**
 * "Leads from your page" — jobs a homeowner started from THIS contractor's own
 * /pro landing page (stamped by Page Lead Direct). Tim/Abir, Sep 28: page leads
 * only existed as a text on the Bid Builder line — nothing on the dashboard.
 *
 * New lead  -> "Bid on this" opens the Bid Builder text with `bid <ref>` pre-filled
 *              (same reply the alert text asks for).
 * Bid exists -> status + "View bid".
 *
 * Renders only when the contractor's page is live or a lead exists, so a
 * contractor without a page never sees an empty box.
 */
export function PageLeadsCard({ pageLive }: { pageLive: boolean }) {
  const [leads, setLeads] = useState<PageLead[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (typeof window !== "undefined" && window.location.hostname.includes("vusercontent.net")) {
          if (!cancelled) setLeads([]);
          return;
        }
        const res = await getMyPageLeads();
        if (!cancelled) setLeads(res.leads ?? []);
      } catch {
        if (!cancelled) setLeads([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (leads === null) return null; // still loading — no flash of an empty box
  if (!leads.length && !pageLive) return null;

  const shown = leads.slice(0, 5);
  const open = leads.filter((l) => !l.bid).length;

  return (
    <section className={`${CARD} min-w-0 p-6`}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Inbox className="h-5 w-5 shrink-0 text-primary" />
          {/* Tim (Oct 4): "Can this section just say 'Leads'" — the long title truncated on mobile. */}
          <h2 className="truncate text-xl font-bold tracking-tight text-foreground">Leads</h2>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {leads.length > 0 && (
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">
              {open > 0 ? `${open} new` : `${leads.length}`}
            </span>
          )}
          <Button asChild variant="outline" size="sm" className="rounded-full text-sm font-semibold">
            <Link href="/contractors/leads">View all</Link>
          </Button>
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No leads yet. Homeowners who text from your page will show up here — yours alone, with a one-tap bid.
        </p>
      ) : (
        <div className="flex flex-col">
          {shown.map((l, i) => {
            const where = [l.location, l.zip_code].filter(Boolean).join(" ");
            const ref = l.job_ref || "";
            return (
              <div key={l.id} className={`py-4 ${i > 0 ? "border-t border-border" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {/* "Tim's Landscaping Project" (Tim, Oct 5) — opens the full details on the Leads page */}
                    <Link
                      href={`/contractors/leads?open=${encodeURIComponent(l.id)}`}
                      className="block truncate font-semibold text-primary hover:underline"
                    >
                      {leadLabel({ homeownerName: l.homeowner.name, category: l.category })}
                    </Link>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                      {[where, whenLabel(l.created_at), ref].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  {l.bid ? (
                    <span className="inline-block shrink-0 rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-800">
                      {bidLabel(l.bid.status)}
                      {l.bid.total_price != null ? ` · ${formatPrice(l.bid.total_price)}` : ""}
                    </span>
                  ) : (
                    <span className="inline-block shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                      New lead
                    </span>
                  )}
                </div>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {l.bid ? (
                    <Button asChild size="sm" variant="outline" className="gap-1.5 rounded-full font-semibold">
                      <a href={`/p/${l.bid.share_token}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3.5 w-3.5" />
                        View bid
                      </a>
                    </Button>
                  ) : (
                    <Button asChild size="sm" className="gap-1.5 rounded-full font-semibold">
                      <a href={getSmsHref(CONTRACTOR_SMS_PHONE_NUMBER, ref ? `bid ${ref}` : "I want to build a new bid")}>
                        <MessageSquareText className="h-3.5 w-3.5" />
                        Bid on this
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {leads.length > shown.length && (
        <p className="mt-2 text-xs text-muted-foreground">
          Showing the latest {shown.length} of {leads.length} · <Link href="/contractors/leads" className="font-bold text-primary hover:underline">See all leads →</Link>
        </p>
      )}
    </section>
  );
}

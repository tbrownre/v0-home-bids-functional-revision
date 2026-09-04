"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, Search, MoreHorizontal, ExternalLink, Copy, Check, Download, MessageSquareText } from "lucide-react";
import { ContractorTopbar } from "@/components/contractor/contractor-topbar";
import { BuildBidModal } from "@/components/contractor/build-bid-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getMockUser, syncMirrorFromSupabase } from "@/lib/mock-auth";
import { getContractorProposals, type Proposal, type ProposalStatus } from "@/lib/supabase/proposals";
import { formatPrice, statusMeta } from "@/lib/proposal-format";
import { getSmsHref, CONTRACTOR_SMS_PHONE_NUMBER } from "@/lib/sms-config";

const CARD = "rounded-[22px] border border-border bg-card shadow-[0_10px_30px_rgba(16,17,20,0.06)]";

type Filter = "all" | "viewed" | "accepted" | "sent" | "attention";

const FILTER_MAP: Record<Exclude<Filter, "all">, ProposalStatus[]> = {
  viewed: ["viewed", "approval_clicked"],
  accepted: ["accepted"],
  sent: ["sent"],
  attention: ["question_asked", "changes_requested"],
};

function proposalUrl(token: string): string {
  if (typeof window === "undefined") return `/p/${token}`;
  return `${window.location.origin}/p/${token}`;
}

function shortDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function BidsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [showBuild, setShowBuild] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const menuWrapRef = useRef<HTMLDivElement>(null);

  // Auth guard (same pattern as the dashboard).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let user = getMockUser();
      if (!user) user = await syncMirrorFromSupabase();
      if (cancelled) return;
      if (!user) {
        window.location.replace("/auth/sign-in");
        return;
      }
      if (user.role !== "contractor" && user.role !== "admin") {
        window.location.replace("/");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        if (typeof window !== "undefined" && window.location.hostname.includes("vusercontent.net")) {
          setLoading(false);
          return;
        }
        const { proposals: rows } = await getContractorProposals();
        // Default order: newest first by created_at, before any search/filter.
        const sorted = [...(rows ?? [])].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
        setProposals(sorted);
      } catch (e) {
        console.error("[Bids] Failed to load proposals:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (menuWrapRef.current && !menuWrapRef.current.contains(e.target as Node)) setOpenMenu(null);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return proposals.filter((p) => {
      if (filter !== "all" && !FILTER_MAP[filter].includes(p.status)) return false;
      if (!q) return true;
      return (
        p.project_title.toLowerCase().includes(q) ||
        (p.homeowner_name ?? "").toLowerCase().includes(q)
      );
    });
  }, [proposals, query, filter]);

  async function copyLink(p: Proposal) {
    try {
      await navigator.clipboard.writeText(proposalUrl(p.share_token));
      setCopiedId(p.id);
      setTimeout(() => setCopiedId((c) => (c === p.id ? null : c)), 2000);
    } catch { /* no-op */ }
    setOpenMenu(null);
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <ContractorTopbar />
      <main className="mx-auto w-full max-w-[1180px] px-4 pb-16 pt-8 sm:px-6">
        {/* Page head */}
        <div className="mb-5 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-primary">All bids</p>
            <h1 className="mt-1 text-4xl font-extrabold tracking-tight text-foreground">Your bids</h1>
            <p className="mt-2 text-lg text-muted-foreground">Find any bid, check its status, or build a new one.</p>
          </div>
          <Button onClick={() => setShowBuild(true)} className="h-12 gap-2 rounded-xl px-5 font-semibold">
            <Sparkles className="h-[18px] w-[18px]" />
            New Bid
          </Button>
        </div>

        {/* Toolbar */}
        <div className="mb-4 flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[240px] flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by project or homeowner"
              className="h-12 rounded-xl pl-10"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as Filter)}
            className="h-12 rounded-xl border border-border bg-card px-3 pr-8 text-sm font-medium text-foreground outline-none focus:border-primary/50"
            aria-label="Filter by status"
          >
            <option value="all">All statuses</option>
            <option value="viewed">Viewed</option>
            <option value="accepted">Accepted</option>
            <option value="sent">Sent</option>
            <option value="attention">Reply needed</option>
          </select>
        </div>

        {/* Table */}
        <section className={`${CARD} overflow-x-auto p-3 sm:px-5 sm:py-2`}>
          {loading ? (
            <p className="px-2 py-16 text-center text-sm text-muted-foreground">Loading bids…</p>
          ) : filtered.length === 0 ? (
            <div className="px-2 py-16 text-center">
              <p className="font-semibold text-foreground">
                {proposals.length === 0 ? "No bids yet." : "No bids match your search."}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {proposals.length === 0 ? "Build a bid by text and it will appear here." : "Try a different search or filter."}
              </p>
              {proposals.length === 0 && (
                <Button onClick={() => setShowBuild(true)} className="mt-4 rounded-full font-semibold">Build a Bid</Button>
              )}
            </div>
          ) : (
            <div className="min-w-[760px]" ref={menuWrapRef}>
              <div className="grid grid-cols-[minmax(200px,1.4fr)_120px_130px_150px_120px_44px] gap-3 px-1 py-3 text-xs font-extrabold uppercase tracking-[0.06em] text-muted-foreground">
                <div>Project</div>
                <div>Amount</div>
                <div>Status</div>
                <div>Homeowner</div>
                <div>Date</div>
                <div />
              </div>
              {filtered.map((p) => {
                const meta = statusMeta(p.status);
                return (
                  <div
                    key={p.id}
                    className="grid grid-cols-[minmax(200px,1.4fr)_120px_130px_150px_120px_44px] items-center gap-3 border-t border-border px-1 py-4"
                  >
                    <a
                      href={`/p/${p.share_token}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate font-semibold text-foreground hover:text-primary hover:underline"
                    >
                      {p.project_title}
                    </a>
                    <div className="font-bold text-foreground">{formatPrice(p.total_price)}</div>
                    <div>
                      <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold ${meta.className}`}>{meta.label}</span>
                    </div>
                    <div className="truncate text-sm text-muted-foreground">{p.homeowner_name || "—"}</div>
                    <div className="text-sm text-muted-foreground">{shortDate(p.created_at)}</div>
                    <div className="relative flex justify-end">
                      <button
                        type="button"
                        onClick={() => setOpenMenu((m) => (m === p.id ? null : p.id))}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted"
                        aria-label={`Actions for ${p.project_title}`}
                        aria-expanded={openMenu === p.id}
                      >
                        <MoreHorizontal className="h-5 w-5" />
                      </button>
                      {openMenu === p.id && (
                        <div className="absolute right-0 top-10 z-20 w-52 rounded-xl border border-border bg-background p-1.5 shadow-xl">
                          <a
                            href={`/p/${p.share_token}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
                            onClick={() => setOpenMenu(null)}
                          >
                            <ExternalLink className="h-4 w-4" /> View bid
                          </a>
                          <button
                            type="button"
                            onClick={() => copyLink(p)}
                            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted"
                          >
                            {copiedId === p.id ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                            {copiedId === p.id ? "Link copied" : "Copy link"}
                          </button>
                          {p.pdf_url && (
                            <a
                              href={p.pdf_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
                              onClick={() => setOpenMenu(null)}
                            >
                              <Download className="h-4 w-4" /> PDF
                            </a>
                          )}
                          <a
                            href={getSmsHref(CONTRACTOR_SMS_PHONE_NUMBER, `Follow up on my bid for ${p.project_title}`)}
                            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
                            onClick={() => setOpenMenu(null)}
                          >
                            <MessageSquareText className="h-4 w-4" /> Send follow-up
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <BuildBidModal open={showBuild} onClose={() => setShowBuild(false)} />
    </div>
  );
}

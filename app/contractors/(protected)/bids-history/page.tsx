"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, Search, MoreHorizontal, ExternalLink, Copy, Check, Download, MessageSquareText, MessageCircle, Loader2, Send } from "lucide-react";
import { ContractorTopbar } from "@/components/contractor/contractor-topbar";
import { BuildBidModal } from "@/components/contractor/build-bid-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getMockUser, syncMirrorFromSupabase } from "@/lib/mock-auth";
import { getContractorProposals, type Proposal, type ProposalStatus } from "@/lib/supabase/proposals";
import { getMyBidQuestions, answerBidQuestion, type BidQuestion } from "@/lib/supabase/bid-questions";
import { bidTarget, activeQuestion, firstName, questionAgo } from "@/lib/bid-routing";
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

  // QUESTIONS (Tim, Oct 29): what the homeowner asked, per bid, and the conversation panel for own-customer bids
  const [questions, setQuestions] = useState<Record<string, BidQuestion>>({});
  const [chatToken, setChatToken] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const loadQuestions = async () => {
    try {
      const res = await getMyBidQuestions();
      if (res.error === null) {
        const map: Record<string, BidQuestion> = {};
        for (const q of res.data) map[q.share_token] = q;
        setQuestions(map);
      }
    } catch (e) {
      console.error("[Bids] questions failed:", e);
    }
  };

  // Auth guard (same pattern as the dashboard).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let user = getMockUser();
      if (!user) user = await syncMirrorFromSupabase();
      if (cancelled) return;
      if (!user) {
        window.location.replace("/auth/sign-in?redirect=" + encodeURIComponent(window.location.pathname));
        return;
      }
      if (user.role !== "contractor" && user.role !== "admin") {
        // DEEPLINK (Tim, Sep 28): a contractor link in a homeowner-signed-in browser
        // asks for the contractor account instead of dumping them on the homepage.
        window.location.replace("/auth/sign-in?redirect=" + encodeURIComponent(window.location.pathname) + "&switch=1");
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
        void loadQuestions();
      } catch (e) {
        console.error("[Bids] Failed to load proposals:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ?chat=<share_token> opens the conversation panel (the dashboard and the texts deep-link here)
  useEffect(() => {
    const fromUrl = () => new URLSearchParams(window.location.search).get("chat");
    setChatToken(fromUrl());
    const onPop = () => setChatToken(fromUrl());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const openChat = (token: string) => {
    window.history.pushState({ hbBidChat: token }, "", `${window.location.pathname}?chat=${encodeURIComponent(token)}`);
    setChatToken(token);
    setReply("");
    setSendError(null);
  };
  const closeChat = () => {
    if (window.history.state && (window.history.state as { hbBidChat?: string }).hbBidChat) window.history.back();
    else window.history.replaceState(null, "", window.location.pathname);
    setChatToken(null);
  };

  const chatProposal = chatToken ? proposals.find((p) => p.share_token === chatToken) ?? null : null;
  const chatQ = chatToken ? questions[chatToken] : undefined;

  const sendReply = async () => {
    if (!chatProposal || sending) return;
    const text = reply.trim();
    if (text.length < 2) return;
    setSending(true);
    setSendError(null);
    try {
      const res = await answerBidQuestion(chatProposal.share_token, text);
      if (res.error !== null || !res.data?.ok) {
        setSendError(res.error ?? (res.data?.error === "no_phone" ? "This homeowner has no phone number on the bid." : "Couldn't send - try again."));
        return;
      }
      setReply("");
      // the bid leaves "Question asked" and the conversation grows
      setProposals((cur) => cur.map((p) => (p.share_token === chatProposal.share_token && p.status === "question_asked" ? { ...p, status: "viewed" } : p)));
      await loadQuestions();
    } finally {
      setSending(false);
    }
  };

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
            <div ref={menuWrapRef}>
              {/* Mobile: Project + Amount + status pill; row opens the bid in a new tab */}
              <div className="md:hidden">
                {filtered.map((p) => {
                  const meta = statusMeta(p.status);
                  // LIVEBIDS (Tim, Oct 7) + QUESTIONS (Tim, Oct 29): one routing rule, shared with the dashboard (lib/bid-routing) -
                  // accepted -> approved project, a bid the homeowner asked about -> the conversation, everything else -> the hosted bid.
                  const q = questions[p.share_token];
                  const aq = activeQuestion(p, q);
                  const target = bidTarget(p, q);
                  const body = (
                    <>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-foreground">{p.project_title}</p>
                        <p className="mt-0.5 font-bold text-foreground">{formatPrice(p.total_price)}</p>
                        {aq && (
                          <p className="mt-1.5 line-clamp-2 text-sm text-foreground" data-hb-bid-question>
                            <MessageCircle className="mr-1 inline h-3.5 w-3.5 text-amber-600" aria-hidden />
                            <span className="font-semibold">{firstName(p.homeowner_name)} asked</span>
                            {aq.asked_at ? <span className="text-muted-foreground"> · {questionAgo(aq.asked_at)}</span> : null}
                            {": "}&ldquo;{aq.question}&rdquo;
                          </p>
                        )}
                      </div>
                      <span className={`inline-block shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${meta.className}`}>{meta.label}</span>
                    </>
                  );
                  if (target.kind === "conversation") {
                    return (
                      <button key={p.id} type="button" onClick={() => openChat(p.share_token)} title={target.hint} className="flex w-full items-center gap-3 border-t border-border px-1 py-4 text-left first:border-t-0" data-hb-bid-row={target.kind}>
                        {body}
                      </button>
                    );
                  }
                  return (
                    <a
                      key={p.id}
                      href={target.href}
                      {...(target.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      title={target.hint}
                      className="flex items-center gap-3 border-t border-border px-1 py-4 first:border-t-0"
                      data-hb-bid-row={target.kind}
                    >
                      {body}
                    </a>
                  );
                })}
              </div>
              {/* Desktop table (unchanged) */}
              <div className="hidden min-w-[760px] md:block">
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
                const q = questions[p.share_token];
                const aq = activeQuestion(p, q);
                const target = bidTarget(p, q);
                return (
                  <div
                    key={p.id}
                    className="grid grid-cols-[minmax(200px,1.4fr)_120px_130px_150px_120px_44px] items-center gap-3 border-t border-border px-1 py-4"
                    data-hb-bid-row={target.kind}
                  >
                    <div className="min-w-0">
                      {target.kind === "conversation" ? (
                        <button type="button" onClick={() => openChat(p.share_token)} title={target.hint} className="block max-w-full truncate text-left font-semibold text-primary hover:underline">
                          {p.project_title}
                        </button>
                      ) : (
                        <a
                          href={target.href}
                          {...(target.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                          className={`block truncate font-semibold hover:underline ${target.kind === "bid" ? "text-foreground hover:text-primary" : "text-primary"}`}
                          title={target.hint}
                        >
                          {p.project_title}
                        </a>
                      )}
                      {aq && (
                        <p className="mt-1 line-clamp-2 text-sm text-foreground" data-hb-bid-question>
                          <MessageCircle className="mr-1 inline h-3.5 w-3.5 text-amber-600" aria-hidden />
                          <span className="font-semibold">{firstName(p.homeowner_name)} asked</span>
                          {aq.asked_at ? <span className="text-muted-foreground"> · {questionAgo(aq.asked_at)}</span> : null}
                          {": "}&ldquo;{aq.question}&rdquo;
                        </p>
                      )}
                    </div>
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
                          {target.kind === "conversation" && (
                            <button
                              type="button"
                              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-semibold text-primary transition-colors hover:bg-muted"
                              onClick={() => { setOpenMenu(null); openChat(p.share_token); }}
                            >
                              <MessageCircle className="h-4 w-4" /> Open conversation
                            </button>
                          )}
                          {target.kind === "thread" && (
                            <a
                              href={target.href}
                              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-primary transition-colors hover:bg-muted"
                              onClick={() => setOpenMenu(null)}
                            >
                              <MessageCircle className="h-4 w-4" /> Open conversation
                            </a>
                          )}
                          {p.status === "accepted" && (
                            <a
                              href={`/contractors/project/${p.share_token}`}
                              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-primary transition-colors hover:bg-muted"
                              onClick={() => setOpenMenu(null)}
                            >
                              <ExternalLink className="h-4 w-4" /> Open approved project
                            </a>
                          )}
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
            </div>
          )}
        </section>
      </main>

      {/* Conversation with the homeowner on an own-customer bid (text relay both ways) */}
      <Dialog open={!!chatToken} onOpenChange={(o) => { if (!o) closeChat(); }}>
        <DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-lg" data-hb-bid-chat>
          <DialogHeader className="border-b border-border px-5 py-4 pr-12 text-left">
            <DialogTitle className="text-lg font-extrabold tracking-tight">
              {chatProposal ? `${firstName(chatProposal.homeowner_name, "Homeowner")} · ${chatProposal.project_title}` : "Conversation"}
            </DialogTitle>
            <DialogDescription>
              {chatProposal ? `${formatPrice(chatProposal.total_price)} bid · replies go to ${firstName(chatProposal.homeowner_name, "the homeowner")} by text` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 space-y-3 overflow-y-auto bg-muted/30 px-5 py-4" data-hb-bid-chat-list>
            {!chatProposal ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : (chatQ?.history ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No messages yet.</p>
            ) : (
              (chatQ?.history ?? []).map((m) => (
                <div key={m.id} className="space-y-2">
                  {m.question && (
                    <div className="flex justify-start">
                      <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-card px-3.5 py-2.5 text-sm text-foreground shadow-sm ring-1 ring-border">
                        <p className="whitespace-pre-wrap">{m.question}</p>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {firstName(chatProposal.homeowner_name, "Homeowner")} · {questionAgo(m.asked_at)}
                          {m.status === "open" ? " · waiting for your reply" : m.status === "expired" ? " · expired" : ""}
                        </p>
                      </div>
                    </div>
                  )}
                  {m.answer && (
                    <div className="flex justify-end">
                      <div className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-3.5 py-2.5 text-sm text-primary-foreground shadow-sm">
                        <p className="whitespace-pre-wrap">{m.answer}</p>
                        <p className="mt-1 text-[11px] text-primary-foreground/70">You · {questionAgo(m.answered_at)}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          <div className="border-t border-border px-5 py-3">
            <div className="flex items-end gap-2">
              <textarea
                value={reply}
                onChange={(e) => { setReply(e.target.value); setSendError(null); }}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void sendReply(); } }}
                placeholder={chatProposal ? `Reply to ${firstName(chatProposal.homeowner_name, "the homeowner")}…` : "Reply…"}
                rows={2}
                maxLength={600}
                className="min-h-[44px] flex-1 resize-none rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary/50"
                aria-label="Your reply"
              />
              <Button className="h-11 gap-1.5 rounded-xl px-4 font-semibold" onClick={() => void sendReply()} disabled={sending || reply.trim().length < 2}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send
              </Button>
            </div>
            {sendError ? (
              <p className="mt-2 text-sm text-amber-700">{sendError}</p>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">Sent as a text from HomeBids. Their reply lands here and on your phone.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <BuildBidModal open={showBuild} onClose={() => setShowBuild(false)} />
    </div>
  );
}

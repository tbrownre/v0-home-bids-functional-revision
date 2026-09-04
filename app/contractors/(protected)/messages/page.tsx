"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Phone,
  ExternalLink,
  FileText,
  ImageIcon,
  Send,
  MessageCircle,
} from "lucide-react";
import { ContractorTopbar } from "@/components/contractor/contractor-topbar";
import { getMockUser, syncMirrorFromSupabase } from "@/lib/mock-auth";
import { createClient } from "@/lib/supabase/client";
import { useContractorSignals, type ContractorThread } from "@/lib/use-contractor-signals";

const CARD = "rounded-[22px] border border-border bg-card shadow-[0_10px_30px_rgba(16,17,20,0.06)]";
const QUICK_REPLIES = ["Yes, that works for me.", "I can start next week.", "I'll send an update shortly."];

interface ThreadMessage {
  sender?: string;
  kind?: string;
  body?: string;
  created_at?: string;
  meta?: { url?: string } | null;
}
interface ThreadBid {
  share_token?: string;
  amount?: number | string;
  status?: string;
}
interface ThreadDetail {
  job?: { title?: string; job_ref?: string; location?: string; homeowner_first?: string } | null;
  page_state?: { state?: string; bid?: ThreadBid | null } | null;
  homeowner_contact?: { name?: string; phone?: string } | null;
  messages?: ThreadMessage[] | null;
}

function relativeTime(value: string | null | undefined): string {
  if (!value) return "";
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return "";
  const mins = Math.round((Date.now() - then) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d`;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(value));
}

function clockTime(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function prettyState(state: string | null | undefined): string {
  if (!state) return "";
  return state.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ContractorMessagesPage() {
  const { threads, loaded } = useContractorSignals();

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [activeToken, setActiveToken] = useState<string | null>(null);
  const [detail, setDetail] = useState<ThreadDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [composer, setComposer] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const sendingRef = useRef(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Auth guard — same pattern as the contractor dashboard.
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
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return threads.filter((t) => {
      if (filter === "unread" && t.last_sender !== "homeowner") return false;
      if (!q) return true;
      return (
        (t.title ?? "").toLowerCase().includes(q) ||
        (t.homeowner_first ?? "").toLowerCase().includes(q) ||
        (t.job_ref ?? "").toLowerCase().includes(q)
      );
    });
  }, [threads, query, filter]);

  // Auto-select the first thread on desktop once data arrives.
  useEffect(() => {
    if (activeToken || filtered.length === 0) return;
    if (typeof window !== "undefined" && window.innerWidth >= 768) {
      setActiveToken(filtered[0].c_token);
    }
  }, [filtered, activeToken]);

  const loadDetail = useCallback(async (token: string, showSpinner: boolean) => {
    if (typeof window !== "undefined" && window.location.hostname.includes("vusercontent.net")) {
      if (showSpinner) setDetailLoading(false);
      return;
    }
    if (showSpinner) setDetailLoading(true);
    try {
      const { data, error } = await createClient().rpc("get_contractor_thread", { p_token: token });
      if (!error && data) setDetail(data as ThreadDetail);
    } catch {
      /* non-fatal */
    } finally {
      if (showSpinner) setDetailLoading(false);
    }
  }, []);

  // Load the selected thread and poll it every 12s.
  useEffect(() => {
    if (!activeToken) {
      setDetail(null);
      return;
    }
    setDetail(null);
    loadDetail(activeToken, true);
    const interval = window.setInterval(() => {
      if (document.hidden || sendingRef.current) return;
      loadDetail(activeToken, false);
    }, 12000);
    return () => window.clearInterval(interval);
  }, [activeToken, loadDetail]);

  const messages = useMemo(() => {
    const list = Array.isArray(detail?.messages) ? (detail!.messages as ThreadMessage[]) : [];
    return [...list].sort(
      (a, b) => (a.created_at ? +new Date(a.created_at) : 0) - (b.created_at ? +new Date(b.created_at) : 0),
    );
  }, [detail]);

  // Keep the transcript pinned to the newest message.
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages.length, activeToken]);

  const activeRow: ContractorThread | undefined = useMemo(
    () => threads.find((t) => t.c_token === activeToken),
    [threads, activeToken],
  );

  const contact = detail?.homeowner_contact ?? null;
  const bid = detail?.page_state?.bid ?? null;
  const homeownerFirst = detail?.job?.homeowner_first || activeRow?.homeowner_first || "Homeowner";
  const jobTitle = detail?.job?.title || activeRow?.title || "Job";
  const stateLabel = prettyState(detail?.page_state?.state || activeRow?.state);

  async function sendMessage() {
    const body = composer.trim();
    if (!body || sending || !activeToken) return;
    sendingRef.current = true;
    setSending(true);
    // Optimistic append.
    setDetail((cur) =>
      cur
        ? { ...cur, messages: [...(cur.messages ?? []), { sender: "contractor", kind: "text", body, created_at: new Date().toISOString() }] }
        : cur,
    );
    setComposer("");
    try {
      const { data, error } = await createClient().rpc("send_thread_message", { p_token: activeToken, p_body: body });
      if (!error && data?.ok) await loadDetail(activeToken, false);
    } catch {
      /* non-fatal */
    } finally {
      setSending(false);
      sendingRef.current = false;
    }
  }

  async function uploadPhoto(file: File) {
    if (uploading || !activeToken) return;
    setUploading(true);
    sendingRef.current = true;
    try {
      const body = new FormData();
      body.append("side", "contractor");
      body.append("token", activeToken);
      body.append("file", file);
      const response = await fetch("/api/thread-photo", { method: "POST", body });
      const result = await response.json();
      if (response.ok && result?.ok) {
        setDetail((cur) =>
          cur
            ? { ...cur, messages: [...(cur.messages ?? []), { sender: "contractor", kind: "photo", body: "", meta: { url: result.url }, created_at: new Date().toISOString() }] }
            : cur,
        );
        await loadDetail(activeToken, false);
      }
    } catch {
      /* non-fatal */
    } finally {
      setUploading(false);
      sendingRef.current = false;
    }
  }

  const paneOpen = activeToken != null;

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <ContractorTopbar />

      <main className="mx-auto w-[min(1180px,calc(100%-32px))] py-6 md:py-8">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">Messages</h1>
            <p className="mt-1 text-sm text-muted-foreground md:text-base">
              Talk to homeowners about scheduling, questions, and updates.
            </p>
          </div>
        </div>

        <div className={`${CARD} grid min-h-[640px] grid-cols-1 overflow-hidden md:grid-cols-[360px_minmax(0,1fr)]`}>
          {/* ── Conversation list ── */}
          <div className={`flex flex-col border-border md:border-r ${paneOpen ? "hidden md:flex" : "flex"}`}>
            <div className="border-b border-border p-4">
              <div className="relative">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search homeowners or projects"
                  className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-3 text-sm outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
                  aria-label="Search conversations"
                />
              </div>
              <div className="mt-2.5 flex gap-2">
                {(["all", "unread"] as const).map((key) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={`rounded-full border px-3 py-1.5 text-[13px] font-semibold transition-colors ${
                      filter === key
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-border bg-card text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {key === "all" ? "All" : "Needs reply"}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              {!loaded ? (
                <p className="px-4 py-10 text-center text-sm text-muted-foreground">Loading conversations…</p>
              ) : filtered.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <MessageCircle className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {threads.length === 0 ? "No conversations yet" : "No conversations found"}
                  </p>
                  {threads.length === 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">They start the moment you send a bid.</p>
                  )}
                </div>
              ) : (
                filtered.map((t) => {
                  const unread = t.last_sender === "homeowner";
                  const active = t.c_token === activeToken;
                  return (
                    <button
                      key={t.c_token || t.job_ref}
                      onClick={() => setActiveToken(t.c_token)}
                      className={`flex w-full flex-col border-t border-border px-4 py-4 text-left first:border-t-0 transition-colors hover:bg-muted/50 ${
                        active ? "bg-primary/[0.06] shadow-[inset_3px_0_0_var(--primary)]" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          {unread && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />}
                          <span className="truncate font-bold text-foreground">{t.homeowner_first || "Homeowner"}</span>
                        </div>
                        <span className="shrink-0 text-xs text-muted-foreground">{relativeTime(t.last_at)}</span>
                      </div>
                      <span className="mt-1 truncate text-xs font-bold text-muted-foreground">{t.title}</span>
                      {t.last_message && (
                        <span className="mt-1 truncate text-[13px] text-muted-foreground">
                          {t.last_sender === "contractor" ? "You: " : ""}
                          {t.last_message}
                        </span>
                      )}
                      {t.state && (
                        <span className="mt-2 inline-flex w-fit rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                          {prettyState(t.state)}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* ── Chat pane ── */}
          <div className={`flex min-w-0 flex-col bg-[#fbfcfd] ${paneOpen ? "flex" : "hidden md:flex"}`}>
            {!activeToken ? (
              <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <MessageCircle className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-semibold text-foreground">Select a conversation</p>
                <p className="mt-1 text-xs text-muted-foreground">Choose a homeowner on the left to see your messages.</p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <button
                      onClick={() => setActiveToken(null)}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted md:hidden"
                      aria-label="Back to conversations"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-extrabold text-primary">
                      {(homeownerFirst.charAt(0) || "H").toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="flex items-center gap-2 truncate text-base font-bold text-foreground">
                        {homeownerFirst}
                        {stateLabel && (
                          <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                            {stateLabel}
                          </span>
                        )}
                      </h3>
                      <p className="truncate text-[13px] text-muted-foreground">{jobTitle}</p>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                    {bid?.share_token && (
                      <a
                        href={`/p/${bid.share_token}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-sm font-semibold text-foreground hover:bg-muted"
                      >
                        <FileText className="h-4 w-4" /> View bid
                      </a>
                    )}
                    {contact?.phone ? (
                      <a
                        href={`tel:${contact.phone}`}
                        className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-sm font-semibold text-foreground hover:bg-muted"
                      >
                        <Phone className="h-4 w-4" /> Call
                      </a>
                    ) : (
                      <span
                        title="Unlocks once a visit is scheduled or you're hired"
                        className="inline-flex min-h-[38px] cursor-not-allowed items-center gap-1.5 rounded-xl border border-border bg-muted/50 px-3 text-sm font-semibold text-muted-foreground"
                      >
                        <Phone className="h-4 w-4" /> Call
                      </span>
                    )}
                    {activeRow?.workspace && (
                      <a
                        href={activeRow.workspace}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-primary px-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                      >
                        Open workspace <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Transcript */}
                <div ref={bodyRef} className="flex flex-1 flex-col gap-2.5 overflow-auto px-5 py-6">
                  {detailLoading && messages.length === 0 ? (
                    <p className="m-auto text-sm text-muted-foreground">Loading messages…</p>
                  ) : messages.length === 0 ? (
                    <p className="m-auto text-sm text-muted-foreground">No messages yet. Say hello to {homeownerFirst}.</p>
                  ) : (
                    messages.map((m, i) => {
                      const mine = m.sender === "contractor";
                      if (m.kind === "photo" && m.meta?.url) {
                        return (
                          <div key={i} className={`flex flex-col ${mine ? "items-end self-end" : "items-start self-start"} max-w-[72%]`}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={m.meta.url || "/placeholder.svg"}
                              alt="Shared photo"
                              className="w-[240px] max-w-full rounded-2xl border border-border object-cover"
                            />
                            <span className="mt-1 px-1 text-[11px] text-muted-foreground">{clockTime(m.created_at)}</span>
                          </div>
                        );
                      }
                      if (m.kind !== "text") {
                        // System notes rendered as small centered lines.
                        return (
                          <p key={i} className="self-center px-4 py-1 text-center text-xs font-medium text-muted-foreground">
                            {m.body}
                          </p>
                        );
                      }
                      return (
                        <div key={i} className={`flex flex-col ${mine ? "items-end self-end" : "items-start self-start"} max-w-[72%]`}>
                          <div
                            className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
                              mine
                                ? "rounded-br-md bg-primary text-primary-foreground"
                                : "rounded-bl-md border border-border bg-card text-foreground"
                            }`}
                          >
                            {m.body}
                          </div>
                          <span className="mt-1 px-1 text-[11px] text-muted-foreground">{clockTime(m.created_at)}</span>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Quick replies */}
                <div className="flex flex-wrap gap-2 border-t border-border bg-card px-4 pt-2.5">
                  {QUICK_REPLIES.map((qr) => (
                    <button
                      key={qr}
                      onClick={() => setComposer(qr)}
                      className="rounded-full border border-border bg-card px-2.5 py-1.5 text-xs font-bold text-muted-foreground hover:border-primary/40 hover:bg-primary/[0.04] hover:text-primary"
                    >
                      {qr}
                    </button>
                  ))}
                </div>

                {/* Composer */}
                <div className="flex items-center gap-2.5 bg-card px-4 pb-4 pt-3">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadPhoto(file);
                      e.target.value = "";
                    }}
                  />
                  <div className="flex flex-1 items-center gap-2 rounded-2xl border border-border bg-card py-1 pl-3 pr-1.5 focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10">
                    <input
                      value={composer}
                      onChange={(e) => setComposer(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.nativeEvent.isComposing && (e as unknown as { keyCode: number }).keyCode !== 229) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      placeholder="Write a message..."
                      className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none"
                      aria-label="Write a message"
                    />
                    <button
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-primary disabled:opacity-50"
                      aria-label="Attach a photo"
                    >
                      <ImageIcon className="h-[18px] w-[18px]" />
                    </button>
                  </div>
                  <button
                    onClick={sendMessage}
                    disabled={sending || !composer.trim()}
                    className="inline-flex min-h-[46px] items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground shadow-[0_8px_20px_rgba(10,132,255,0.22)] hover:bg-primary/90 disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" /> Send
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

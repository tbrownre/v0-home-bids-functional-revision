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
  ScrollText,
  Clock,
  MapPin,
  Camera,
  ChevronDown,
  ChevronUp,
  ChevronRight,
} from "lucide-react";
import { ContractorTopbar } from "@/components/contractor/contractor-topbar";
import { getMockUser, syncMirrorFromSupabase } from "@/lib/mock-auth";
import { createClient } from "@/lib/supabase/client";
import { useContractorSignals, type ContractorThread } from "@/lib/use-contractor-signals";
import { getThreadJobCard, type ThreadJobCard } from "@/lib/supabase/job-card";
import { getThreadSeenMap, markThreadSeen, isThreadUnread } from "@/lib/thread-read";
import { serviceLabel } from "@/lib/page-lead-label";

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

function stateClasses(state: string | null | undefined): string {
  switch ((state ?? "").toLowerCase()) {
    case "new":
      return "bg-blue-100 text-blue-700";
    case "live":
      return "bg-emerald-100 text-emerald-700";
    case "scheduled":
      return "bg-amber-100 text-amber-700";
    case "hired":
      return "bg-primary/10 text-primary";
    default:
      return "bg-muted text-muted-foreground";
  }
}

const URGENCY_LABEL: Record<string, string> = {
  asap: "ASAP",
  within_week: "Within a week",
  within_month: "Within a month",
  flexible: "Flexible",
};

function jobBudgetLabel(min: number | null, max: number | null): string | null {
  if (min == null && max == null) return null;
  const f = (n: number) => "$" + Number(n).toLocaleString();
  if (min != null && max != null) return min === max ? f(min) : `${f(min)} – ${f(max)}`;
  return f((min ?? max) as number);
}

/** The job the thread is about (Tim, Oct 6: messages were blind — no scope/photos context). */
function JobCard({ job }: { job: ThreadJobCard }) {
  const where = [job.location, job.zip_code].filter(Boolean).join(" ");
  const budget = jobBudgetLabel(job.budget_min, job.budget_max);
  const Label = ({ children }: { children: React.ReactNode }) => (
    <p className="text-xs font-extrabold uppercase tracking-[0.06em] text-muted-foreground">{children}</p>
  );
  return (
    <div className="border-b border-border bg-muted/30 px-5 py-4 text-sm">
      <div className="flex items-start gap-2.5">
        <ScrollText className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <Label>Scope</Label>
          <p className="mt-0.5 whitespace-pre-wrap text-foreground">{job.description || "No description captured yet."}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {serviceLabel(job.category)}
            {job.job_ref ? ` · ${job.job_ref}` : ""}
          </p>
        </div>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div className="flex items-start gap-2.5">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <Label>Timeframe</Label>
            <p className="mt-0.5 text-foreground">{(job.urgency && URGENCY_LABEL[job.urgency]) || job.urgency || "Not stated"}</p>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <Label>Location</Label>
            <p className="mt-0.5 text-foreground">{where || "Not stated"}</p>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 inline-block h-4 w-4 shrink-0 text-center text-xs font-black leading-4 text-primary">$</span>
          <div>
            <Label>Budget</Label>
            <p className="mt-0.5 text-foreground">{budget || "Not stated"}</p>
          </div>
        </div>
      </div>
      {job.images.length > 0 && (
        <div className="mt-3 flex items-start gap-2.5">
          <Camera className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <Label>Photos ({job.images.length})</Label>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {job.images.map((src, i) => (
                <a key={src + i} href={src} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl border border-border bg-card">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Project photo ${i + 1}`} loading="lazy" className="h-20 w-20 object-cover" />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ContractorMessagesPage() {
  const { threads, loaded } = useContractorSignals();

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [activeToken, setActiveToken] = useState<string | null>(null);
  const [detail, setDetail] = useState<ThreadDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [composer, setComposer] = useState("");
  const [seenMap, setSeenMap] = useState<Record<string, number>>({});
  useEffect(() => { setSeenMap(getThreadSeenMap()); }, []);
  const [jobCards, setJobCards] = useState<Record<string, ThreadJobCard | null>>({});
  const [jobLoading, setJobLoading] = useState(false);
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
        window.location.replace("/auth/sign-in?redirect=" + encodeURIComponent(window.location.pathname));
        return;
      }
      if (user.role !== "contractor" && user.role !== "admin") {
        // DEEPLINK (Tim, Sep 28): a contractor link in a homeowner-signed-in browser
        // asks for the contractor account instead of dumping them on the homepage.
        window.location.replace("/auth/sign-in?redirect=" + encodeURIComponent(window.location.pathname) + "&switch=1");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const ts = (v: string | null | undefined) => {
      if (!v) return NaN;
      const n = new Date(v).getTime();
      return Number.isNaN(n) ? NaN : n;
    };
    // Sort a copy (never mutate the hook's array): valid last_at newest→oldest, invalid last.
    const sorted = [...threads].sort((a, b) => {
      const ta = ts(a.last_at);
      const tb = ts(b.last_at);
      const aBad = Number.isNaN(ta);
      const bBad = Number.isNaN(tb);
      if (aBad && bBad) return 0;
      if (aBad) return 1;
      if (bBad) return -1;
      return tb - ta;
    });
    return sorted.filter((t) => {
      if (filter === "unread" && !isThreadUnread(t, seenMap)) return false;
      if (!q) return true;
      return (
        (t.title ?? "").toLowerCase().includes(q) ||
        (t.homeowner_first ?? "").toLowerCase().includes(q) ||
        (t.job_ref ?? "").toLowerCase().includes(q)
      );
    });
  }, [threads, query, filter, seenMap]);

  // ── LIST ⇄ CHAT navigation (Tim, Oct 7) ──────────────────────────────────────────────
  // The list (with every job's info + action buttons) is the Messages page; tapping a job opens a
  // chat-only view at ?chat=<token>. It is a real history entry, so the ‹ Back button, the phone's
  // swipe-back and the browser Back all return to the list at the same scroll position.
  const listScrollRef = useRef(0);
  useEffect(() => {
    const fromUrl = () => new URLSearchParams(window.location.search).get("chat");
    setActiveToken(fromUrl());
    const onPop = () => setActiveToken(fromUrl());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  function openChat(token: string) {
    listScrollRef.current = window.scrollY;
    window.history.pushState({ hbChat: token, hbFromList: true }, "", `${window.location.pathname}?chat=${encodeURIComponent(token)}`);
    setActiveToken(token);
  }
  function backToList() {
    const st = window.history.state as { hbFromList?: boolean } | null;
    if (st?.hbFromList) {
      window.history.back(); // popstate → list
    } else {
      // Opened from a shared link: there is no list entry behind us — replace instead.
      window.history.replaceState(null, "", window.location.pathname);
      setActiveToken(null);
    }
  }
  // Chat opens at the top of the window; the list comes back exactly where the contractor left it.
  useEffect(() => {
    if (activeToken) {
      window.scrollTo(0, 0);
    } else {
      const y = listScrollRef.current;
      requestAnimationFrame(() => window.scrollTo(0, y));
    }
  }, [activeToken]);

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

  // PRIVACY (Oct 7): a chat opens ONLY if it is one of the signed-in contractor's own conversations
  // (my_contractor_threads is scoped to auth.uid()). A pasted ?chat=<someone else's token> loads nothing.
  const ownsActive = !!activeToken && threads.some((t) => t.c_token === activeToken);

  // Load the selected thread and poll it every 12s.
  useEffect(() => {
    if (!activeToken || !ownsActive) {
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
  }, [activeToken, ownsActive, loadDetail]);

  // List cards need each job's bid / contact to show their buttons (Open project, View bid, Call).
  // Loaded once per thread with the same RPC the chat uses, 4 at a time, cached for the session.
  const [cardDetails, setCardDetails] = useState<Record<string, ThreadDetail | null>>({});
  const requestedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (activeToken || !loaded) return;
    if (typeof window !== "undefined" && window.location.hostname.includes("vusercontent.net")) return;
    const queue = filtered.map((t) => t.c_token).filter((tk) => tk && !requestedRef.current.has(tk));
    if (queue.length === 0) return;
    queue.forEach((tk) => requestedRef.current.add(tk));
    const worker = async () => {
      while (queue.length) {
        const tk = queue.shift() as string;
        try {
          const { data, error } = await createClient().rpc("get_contractor_thread", { p_token: tk });
          setCardDetails((m) => ({ ...m, [tk]: !error && data ? (data as ThreadDetail) : null }));
        } catch {
          setCardDetails((m) => ({ ...m, [tk]: null }));
        }
      }
    };
    void Promise.all([worker(), worker(), worker(), worker()]);
  }, [activeToken, loaded, filtered]);
  // Fresh chat data flows back into the list card when the contractor returns.
  useEffect(() => {
    if (activeToken && detail) setCardDetails((m) => ({ ...m, [activeToken]: detail }));
  }, [activeToken, detail]);

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

  // Job details card — lazy-loaded per job_ref, cached for the session (Tim, Oct 6).
  const [jobOpenToken, setJobOpenToken] = useState<string | null>(null);
  const jobOpenRow = threads.find((t) => t.c_token === jobOpenToken);
  const activeJobRef = (jobOpenToken && (cardDetails[jobOpenToken]?.job?.job_ref || jobOpenRow?.job_ref)) || "";
  const jobCard = activeJobRef ? jobCards[activeJobRef] : undefined;
  const jobOpen = !!jobOpenToken;
  // READFIX (Tim, Oct 6): opening a conversation marks it read on this device — unread styling
  // clears at once and the Messages badge drops with it (storage event feeds the badge hook).
  useEffect(() => {
    if (!activeToken || !ownsActive) return;
    markThreadSeen(activeToken);
    setSeenMap(getThreadSeenMap());
  }, [activeToken, detail?.messages?.length]);
  useEffect(() => {
    if (!jobOpen || !activeJobRef || jobCards[activeJobRef] !== undefined) return;
    let cancelled = false;
    setJobLoading(true);
    (async () => {
      try {
        const { job } = await getThreadJobCard(activeJobRef);
        if (!cancelled) setJobCards((m) => ({ ...m, [activeJobRef]: job }));
      } catch {
        if (!cancelled) setJobCards((m) => ({ ...m, [activeJobRef]: null }));
      } finally {
        if (!cancelled) setJobLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [jobOpen, activeJobRef, jobCards]);

  const contact = detail?.homeowner_contact ?? null;
  const bid = detail?.page_state?.bid ?? null;
  const homeownerFirst = detail?.job?.homeowner_first || activeRow?.homeowner_first || "Homeowner";
  const jobTitle = detail?.job?.title || activeRow?.title || "Job";
  // HIREDFIX (Tim, Oct 6): once the bid is accepted the chip must say Hired, whatever the stale thread state says.
  const rawState = detail?.page_state?.state || activeRow?.state;
  const stateLabel = prettyState(bid?.status === "accepted" ? "hired" : rawState);

  async function sendMessage() {
    const body = composer.trim();
    if (!body || sending || !activeToken || !ownsActive) return;
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
    if (uploading || !activeToken || !ownsActive) return;
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

  const needsReplyCount = useMemo(
    () => threads.filter((t) => isThreadUnread(t, seenMap)).length,
    [threads, seenMap],
  );

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <ContractorTopbar />

      <main className="mx-auto w-[min(1180px,calc(100%-32px))] py-6 md:py-8">
        {!activeToken ? (
          <>
            <div className="mb-5">
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">Messages</h1>
              <p className="mt-1 text-sm text-muted-foreground md:text-base">
                Talk to homeowners about scheduling, questions, and updates.
              </p>
            </div>

            {/* Search + filter */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search homeowners or projects"
                  className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-3 text-sm outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
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
                    {key === "all" ? "All" : needsReplyCount > 0 ? `Needs reply (${needsReplyCount})` : "Needs reply"}
                  </button>
                ))}
              </div>
            </div>

            {/* Job cards — one per conversation (Tim's mock, Oct 7) */}
            {!loaded ? (
              <p className="py-10 text-center text-sm text-muted-foreground">Loading conversations…</p>
            ) : filtered.length === 0 ? (
              <div className={`${CARD} px-6 py-12 text-center`}>
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <MessageCircle className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {threads.length === 0 ? "No conversations yet" : "No conversations found"}
                </p>
                {threads.length === 0 && <p className="mt-1 text-xs text-muted-foreground">They start the moment you send a bid.</p>}
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
                {filtered.map((t) => {
                  const d = cardDetails[t.c_token];
                  const cBid = d?.page_state?.bid ?? null;
                  const cPhone = d?.homeowner_contact?.phone;
                  const unread = isThreadUnread(t, seenMap);
                  const label = prettyState(cBid?.status === "accepted" ? "hired" : d?.page_state?.state || t.state);
                  const name = d?.job?.homeowner_first || t.homeowner_first || "Homeowner";
                  const hasJob = !!(d?.job?.job_ref || t.job_ref);
                  const open = jobOpenToken === t.c_token;
                  const small = [hasJob, cBid?.share_token && cBid?.status === "accepted", cBid?.share_token].filter(Boolean).length;
                  const callSpan = small % 2 === 0 ? "col-span-2" : "";
                  const BTN = "inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-[10px] px-3 text-[13px] font-medium";
                  return (
                    <div key={t.c_token || t.job_ref} className={`${CARD} overflow-hidden ${unread ? "ring-2 ring-primary/25" : ""}`}>
                      {/* Header row — tap to open the chat */}
                      <button
                        type="button"
                        onClick={() => openChat(t.c_token)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/40"
                        aria-label={`Open chat with ${name}`}
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-extrabold text-primary">
                          {(name.charAt(0) || "H").toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`truncate text-base ${unread ? "font-extrabold" : "font-bold"} text-foreground`}>
                              {name + (t.location ? ` · ${t.location}` : "")}
                            </span>
                            {label && (
                              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${stateClasses(cBid?.status === "accepted" ? "hired" : d?.page_state?.state || t.state)}`}>
                                {label}
                              </span>
                            )}
                            {unread && (
                              <span className="shrink-0 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold leading-none text-primary-foreground">NEW</span>
                            )}
                          </div>
                          <p className={`truncate text-[13px] ${unread ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                            {t.title}
                            {" · "}
                            {t.last_message ? (t.last_sender === "contractor" ? "You: " : "") + t.last_message : "No messages yet"}
                          </p>
                        </div>
                        <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                          {relativeTime(t.last_at)}
                          <ChevronRight className="h-5 w-5" />
                        </span>
                      </button>

                      {/* Actions */}
                      <div className="grid grid-cols-2 gap-2 px-4 pb-3">
                        {hasJob && (
                          <button
                            type="button"
                            onClick={() => setJobOpenToken(open ? null : t.c_token)}
                            aria-expanded={open}
                            className={`${BTN} border border-border text-foreground hover:bg-muted ${open ? "bg-muted" : "bg-card"}`}
                          >
                            <ScrollText className="h-4 w-4" /> Job details
                            {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          </button>
                        )}
                        {cBid?.share_token && cBid?.status === "accepted" && (
                          <a href={`/contractors/project/${cBid.share_token}`} className={`${BTN} bg-green-600 text-white hover:bg-green-700`}>
                            <ExternalLink className="h-4 w-4" /> Open project
                          </a>
                        )}
                        {cBid?.share_token && (
                          <a
                            href={`/p/${cBid.share_token}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${BTN} border border-border bg-card text-foreground hover:bg-muted`}
                          >
                            <FileText className="h-4 w-4" /> View bid
                          </a>
                        )}
                        {cPhone ? (
                          <a href={`tel:${cPhone}`} className={`${callSpan} ${BTN} border border-border bg-card text-foreground hover:bg-muted`}>
                            <Phone className="h-4 w-4" /> Call
                          </a>
                        ) : (
                          <span
                            title="Unlocks once a visit is scheduled or you're hired"
                            className={`${callSpan} ${BTN} cursor-not-allowed border border-border bg-muted/50 text-muted-foreground`}
                          >
                            <Phone className="h-4 w-4" /> Call
                          </span>
                        )}
                        {t.workspace && (
                          <a
                            href={t.workspace}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`col-span-2 ${BTN} bg-primary text-primary-foreground hover:bg-primary/90`}
                          >
                            <ExternalLink className="h-4 w-4" /> Open workspace
                          </a>
                        )}
                      </div>

                      {/* Job details (inline, under its own card) */}
                      {open && (
                        jobLoading && jobCard === undefined ? (
                          <div className="border-t border-border bg-muted/30 px-5 py-4 text-sm text-muted-foreground">Loading job details…</div>
                        ) : jobCard ? (
                          <div className="border-t border-border"><JobCard job={jobCard} /></div>
                        ) : (
                          <div className="border-t border-border bg-muted/30 px-5 py-4 text-sm text-muted-foreground">Job details aren&apos;t available for this thread.</div>
                        )
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          /* ── Chat-only view ── */
          !loaded || !ownsActive ? (
            <div className={`${CARD} px-6 py-14 text-center`}>
              {!loaded ? (
                <p className="text-sm text-muted-foreground">Loading conversation…</p>
              ) : (
                <>
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <MessageCircle className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">Conversation not found</p>
                  <p className="mt-1 text-xs text-muted-foreground">It isn&apos;t one of your conversations, or it was removed.</p>
                  <button onClick={backToList} className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                    <ArrowLeft className="h-4 w-4" /> Back to messages
                  </button>
                </>
              )}
            </div>
          ) : (
          <div className={`${CARD} flex h-[calc(100dvh-166px)] min-h-[460px] md:h-[calc(100dvh-133px)] flex-col overflow-hidden bg-[#fbfcfd]`}>
            <div className="flex items-center gap-3 border-b border-border bg-card px-3 py-3">
              <button
                onClick={backToList}
                className="flex h-10 shrink-0 items-center gap-1 rounded-lg pl-1 pr-2 text-sm font-semibold text-primary hover:bg-muted"
                aria-label="Back to messages"
              >
                <ArrowLeft className="h-5 w-5" /> <span className="hidden sm:inline">Back</span>
              </button>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-extrabold text-primary">
                {(homeownerFirst.charAt(0) || "H").toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="flex items-center gap-2 truncate text-base font-bold text-foreground">
                  <span className="truncate">{homeownerFirst + (activeRow?.location ? ` · ${activeRow.location}` : "")}</span>
                  {stateLabel && (
                    <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                      {stateLabel}
                    </span>
                  )}
                </h3>
                <p className="truncate text-[13px] text-muted-foreground">{jobTitle}</p>
              </div>
            </div>

                {/* Transcript */}
                <div ref={bodyRef} className="flex flex-1 min-h-0 flex-col gap-2.5 overflow-auto px-5 py-6">
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
                  <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl border border-border bg-card py-1 pl-3 pr-1.5 focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10">
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
                    className="inline-flex min-h-[46px] shrink-0 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground shadow-[0_8px_20px_rgba(10,132,255,0.22)] hover:bg-primary/90 disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" /> Send
                  </button>
                </div>
          </div>
          )
        )}
      </main>
    </div>
  );
}

"use client";

/**
 * Contractor Messages — v3 INBOX (Trello "Redesign Messages Page — Mobile + Desktop Responsive UX", Tim Oct 7).
 *
 * Desktop (≥768px): the clean two-column inbox is back — 360px conversation list on the left, the
 *   selected conversation on the right (header + action buttons that wrap, never overflow; job details
 *   collapsible; transcript; quick replies; composer).
 * Mobile (<768px): header/nav and the "Messages" heading are untouched. Below it: search, the
 *   All / Unread / Active / Closed chips (with counts), then COMPACT cards — name · city, latest
 *   message, time, unread badge, chevron only. Tapping a card expands it in place (one at a time)
 *   to reveal Job details / View bid / Call / Open project / Open workspace / Recent conversation.
 *   "Recent conversation" opens the chat page at ?chat=<token> (Back, swipe-back and browser Back
 *   return to the list at the same scroll position — shipped Oct 7 and approved by Tim).
 * Unread: a HomeBids-blue "NEW" tab hangs off the top edge of the card + bold text; it clears the
 *   moment the conversation is opened (per-device seen map; the Messages badge hook listens to it).
 * Statuses: only the ones compute_thread_state really produces — new, live, scheduled, hired,
 *   filled, closed (an accepted bid still reads Hired, whatever the stale state says).
 *   Active = new/live/scheduled/hired · Closed = filled/closed. Nothing invented.
 * Unchanged on purpose: data (my_contractor_threads), the privacy gate (a chat opens only if it is one
 *   of the signed-in contractor's own conversations), lazy per-card details, 12s polling, send/photo,
 *   and deep links.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

// The thread states compute_thread_state actually emits (receipt Oct 7: hired 26 · live 12 · filled 9 · new 7;
// scheduled/closed exist in the function). Anything else falls through to a neutral pill — never invented.
const ACTIVE_STATES = new Set(["new", "live", "scheduled", "hired"]);
const CLOSED_STATES = new Set(["filled", "closed"]);

const isDesktop = () => typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches;

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
  const [filter, setFilter] = useState<"all" | "unread" | "active" | "closed">("all");
  const [activeToken, setActiveToken] = useState<string | null>(null);
  const [expandedToken, setExpandedToken] = useState<string | null>(null); // mobile accordion
  const [detail, setDetail] = useState<ThreadDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [composer, setComposer] = useState("");
  const [seenMap, setSeenMap] = useState<Record<string, number>>({});
  useEffect(() => { setSeenMap(getThreadSeenMap()); }, []);
  const [jobCards, setJobCards] = useState<Record<string, ThreadJobCard | null>>({});
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

  const stateOf = (t: ContractorThread) => (t.state ?? "").toLowerCase();
  const isClosed = (t: ContractorThread) => CLOSED_STATES.has(stateOf(t));
  const isActive = (t: ContractorThread) => ACTIVE_STATES.has(stateOf(t)) || (!isClosed(t) && !!stateOf(t));

  const sorted = useMemo(() => {
    const ts = (v: string | null | undefined) => {
      if (!v) return NaN;
      const n = new Date(v).getTime();
      return Number.isNaN(n) ? NaN : n;
    };
    // Sort a copy (never mutate the hook's array): valid last_at newest→oldest, invalid last.
    return [...threads].sort((a, b) => {
      const ta = ts(a.last_at);
      const tb = ts(b.last_at);
      const aBad = Number.isNaN(ta);
      const bBad = Number.isNaN(tb);
      if (aBad && bBad) return 0;
      if (aBad) return 1;
      if (bBad) return -1;
      return tb - ta;
    });
  }, [threads]);

  const counts = useMemo(
    () => ({
      all: threads.length,
      unread: threads.filter((t) => isThreadUnread(t, seenMap)).length,
      active: threads.filter((t) => isActive(t)).length,
      closed: threads.filter((t) => isClosed(t)).length,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [threads, seenMap],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sorted.filter((t) => {
      if (filter === "unread" && !isThreadUnread(t, seenMap)) return false;
      if (filter === "active" && !isActive(t)) return false;
      if (filter === "closed" && !isClosed(t)) return false;
      if (!q) return true;
      return (
        (t.title ?? "").toLowerCase().includes(q) ||
        (t.homeowner_first ?? "").toLowerCase().includes(q) ||
        (t.location ?? "").toLowerCase().includes(q) ||
        (t.job_ref ?? "").toLowerCase().includes(q)
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorted, query, filter, seenMap]);

  // ── LIST ⇄ CHAT navigation ───────────────────────────────────────────────────────────
  // Mobile: tapping "Recent conversation" opens the chat-only view at ?chat=<token> as a real history
  // entry (‹ Back, swipe-back and browser Back return to the list at the same scroll position — Tim, Oct 7).
  // Desktop: selecting a row shows it in the right pane; the URL mirrors the selection (replaceState, so
  // the Back button is not spammed) and deep links keep working on both.
  const listScrollRef = useRef(0);
  useEffect(() => {
    const fromUrl = () => new URLSearchParams(window.location.search).get("chat");
    setActiveToken(fromUrl());
    const onPop = () => setActiveToken(fromUrl());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  function openChat(token: string) {
    const url = `${window.location.pathname}?chat=${encodeURIComponent(token)}`;
    if (isDesktop()) {
      window.history.replaceState({ hbChat: token }, "", url);
    } else {
      listScrollRef.current = window.scrollY;
      window.history.pushState({ hbChat: token, hbFromList: true }, "", url);
    }
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
  // Mobile: chat opens at the top of the window; the list comes back exactly where the contractor left it.
  useEffect(() => {
    if (isDesktop()) return;
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

  // Expanded mobile cards need each job's bid / contact to show their buttons (Open project, View bid, Call).
  // Loaded once per thread with the same RPC the chat uses, cached for the session.
  const [cardDetails, setCardDetails] = useState<Record<string, ThreadDetail | null>>({});
  const requestedRef = useRef<Set<string>>(new Set());
  // One card's details (the bid + contact its buttons need). Messages are dropped — the list never
  // shows them, so holding every conversation's history in memory would be waste. On failure the
  // token is released, so the card retries the next time it scrolls into view.
  const loadCardDetail = useCallback(async (tk: string) => {
    if (!tk || requestedRef.current.has(tk)) return;
    requestedRef.current.add(tk);
    try {
      const { data, error } = await createClient().rpc("get_contractor_thread", { p_token: tk });
      if (!error && data) {
        const d = data as ThreadDetail;
        setCardDetails((m) => ({ ...m, [tk]: { ...d, messages: [] } }));
      } else {
        requestedRef.current.delete(tk);
        setCardDetails((m) => (tk in m ? m : { ...m, [tk]: null }));
      }
    } catch {
      requestedRef.current.delete(tk);
      setCardDetails((m) => (tk in m ? m : { ...m, [tk]: null }));
    }
  }, []);
  // PERF (Oct 7): details load per card as it scrolls into view (300px ahead), not all at once —
  // a contractor with 50 conversations no longer fires 50 heavy fetches the moment the page opens.
  useEffect(() => {
    if (activeToken || !loaded) return;
    if (typeof window !== "undefined" && window.location.hostname.includes("vusercontent.net")) return;
    if (!("IntersectionObserver" in window)) {
      filtered.forEach((t) => void loadCardDetail(t.c_token));
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const tk = (e.target as HTMLElement).getAttribute("data-hb-token");
          if (tk) void loadCardDetail(tk);
        }
      },
      { rootMargin: "300px 0px" },
    );
    document.querySelectorAll<HTMLElement>("[data-hb-token]").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [activeToken, loaded, filtered, loadCardDetail]);
  // An expanded card loads its details at once if it has not scrolled into view yet.
  useEffect(() => {
    if (expandedToken) void loadCardDetail(expandedToken);
  }, [expandedToken, loadCardDetail]);
  // Fresh chat data flows back into the list card when the contractor returns (messages dropped there too).
  useEffect(() => {
    if (activeToken && detail) setCardDetails((m) => ({ ...m, [activeToken]: { ...detail, messages: [] } }));
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
  const activeJobRef =
    (jobOpenToken && (cardDetails[jobOpenToken]?.job?.job_ref || (jobOpenToken === activeToken ? detail?.job?.job_ref : "") || jobOpenRow?.job_ref)) || "";
  const jobCard = activeJobRef ? jobCards[activeJobRef] : undefined;
  const jobOpen = !!jobOpenToken;
  // READFIX (Tim, Oct 6): opening a conversation marks it read on this device — unread styling
  // clears at once and the Messages badge drops with it (storage event feeds the badge hook).
  useEffect(() => {
    if (!activeToken || !ownsActive) return;
    markThreadSeen(activeToken);
    setSeenMap(getThreadSeenMap());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeToken, ownsActive, detail?.messages?.length]);
  useEffect(() => {
    if (!jobOpen || !activeJobRef || jobCards[activeJobRef] !== undefined) return;
    let cancelled = false;
    (async () => {
      try {
        const { job } = await getThreadJobCard(activeJobRef);
        if (!cancelled) setJobCards((m) => ({ ...m, [activeJobRef]: job }));
      } catch {
        if (!cancelled) setJobCards((m) => ({ ...m, [activeJobRef]: null }));
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
  const activeState = bid?.status === "accepted" ? "hired" : rawState;
  const stateLabel = prettyState(activeState);

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

  // Row tap: mobile expands the card in place (one at a time); desktop selects the conversation.
  function onRowTap(token: string) {
    if (isDesktop()) {
      openChat(token);
    } else {
      setExpandedToken((cur) => (cur === token ? null : token));
    }
  }

  const paneOpen = activeToken != null;
  const ACTION = "inline-flex h-10 items-center justify-center gap-1.5 rounded-[10px] px-3 text-[13px] font-semibold";
  const PANE_BTN = "inline-flex min-h-[38px] items-center gap-1.5 rounded-xl px-3 text-sm font-semibold";

  const chips: Array<{ key: typeof filter; label: string; n: number }> = [
    { key: "all", label: "All", n: counts.all },
    { key: "unread", label: "Unread", n: counts.unread },
    { key: "active", label: "Active", n: counts.active },
    { key: "closed", label: "Closed", n: counts.closed },
  ];

  const searchAndFilters = (
    <div>
      <div className="relative">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search homeowners or projects"
          className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-3 text-sm outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 md:bg-background"
          aria-label="Search conversations"
        />
      </div>
      <div className="mt-2.5 flex gap-1.5 overflow-x-auto md:gap-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex-wrap md:overflow-visible">
        {chips.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setFilter(c.key)}
            aria-pressed={filter === c.key}
            className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold transition-colors md:px-3 md:text-[13px] ${
              filter === c.key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            {c.label}
            <span
              className={`rounded-full px-1.5 py-0.5 text-[11px] font-bold leading-none ${
                filter === c.key
                  ? "bg-white/20 text-primary-foreground"
                  : c.key === "unread" && c.n > 0
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {c.n}
            </span>
          </button>
        ))}
      </div>
    </div>
  );

  const emptyList = (
    <div className={`${CARD} px-6 py-12 text-center md:rounded-none md:border-0 md:shadow-none`}>
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <MessageCircle className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-semibold text-foreground">
        {threads.length === 0 ? "No conversations yet" : "No conversations found"}
      </p>
      {threads.length === 0 && <p className="mt-1 text-xs text-muted-foreground">They start the moment you send a bid.</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <ContractorTopbar />

      <main className="mx-auto w-[min(1180px,calc(100%-32px))] py-6 md:py-8">
        {/* Heading — unchanged (Tim: only redesign below it). Hidden on mobile while a chat is open. */}
        <div className={`mb-5 ${paneOpen ? "hidden md:block" : ""}`}>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">Messages</h1>
          <p className="mt-1 text-sm text-muted-foreground md:text-base">
            Talk to homeowners about scheduling, questions, and updates.
          </p>
        </div>

        {/* One DOM for both layouts: mobile = page list ⇄ full-screen chat; desktop = two-column inbox card. */}
        <div className="md:grid md:h-[calc(100dvh-190px)] md:min-h-[520px] md:grid-cols-[360px_minmax(0,1fr)] md:overflow-hidden md:rounded-[22px] md:border md:border-border md:bg-card md:shadow-[0_10px_30px_rgba(16,17,20,0.06)]">
          {/* ── Conversation list ── */}
          <div className={`min-h-0 flex-col md:flex md:h-full md:border-r md:border-border ${paneOpen ? "hidden md:flex" : "flex"}`}>
            <div className="mb-4 md:mb-0 md:border-b md:border-border md:p-4">{searchAndFilters}</div>

            <div className="flex flex-col gap-3 md:min-h-0 md:flex-1 md:gap-0 md:overflow-auto">
              {!loaded ? (
                <p className="py-10 text-center text-sm text-muted-foreground">Loading conversations…</p>
              ) : filtered.length === 0 ? (
                emptyList
              ) : (
                filtered.map((t) => {
                  const d = cardDetails[t.c_token];
                  const cBid = d?.page_state?.bid ?? null;
                  const cPhone = d?.homeowner_contact?.phone;
                  const unread = isThreadUnread(t, seenMap);
                  const st = cBid?.status === "accepted" ? "hired" : d?.page_state?.state || t.state;
                  const label = prettyState(st);
                  const name = d?.job?.homeowner_first || t.homeowner_first || "Homeowner";
                  const hasJob = !!(d?.job?.job_ref || t.job_ref);
                  const expanded = expandedToken === t.c_token;
                  const smallCount = [hasJob, !!cBid?.share_token, true, !!(cBid?.share_token && cBid?.status === "accepted"), !!t.workspace].filter(Boolean).length;
                  const wsSpan = smallCount % 2 === 1 ? "col-span-2" : "";
                  const selected = activeToken === t.c_token;
                  const jobOpenHere = jobOpenToken === t.c_token;
                  return (
                    <div key={t.c_token || t.job_ref} data-hb-token={t.c_token} className="relative md:static md:first:[&>div]:border-t-0">
                      {/* Unread tab — hangs off the top edge of the card on mobile (Tim: not a tiny dot) */}
                      {unread && (
                        <span className="absolute -top-2.5 left-4 z-10 rounded-full bg-primary px-2.5 py-1 text-[10px] font-extrabold uppercase leading-none tracking-wide text-primary-foreground shadow-[0_4px_10px_rgba(10,132,255,0.35)] md:hidden">
                          New
                        </span>
                      )}
                      <div
                        className={`${CARD} overflow-hidden transition-shadow md:rounded-none md:shadow-none md:border-r-0 md:border-b-0 md:border-t md:border-t-border md:border-l-4 ${
                          unread ? "ring-2 ring-primary/30 md:ring-0" : ""
                        } ${
                          selected
                            ? "md:border-l-primary md:bg-primary/[0.06]"
                            : unread
                              ? "md:border-l-primary/50 md:bg-primary/[0.04]"
                              : "md:border-l-transparent md:bg-transparent"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => onRowTap(t.c_token)}
                          aria-expanded={expanded}
                          className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-muted/40 md:py-4"
                          aria-label={`${name}${t.location ? ", " + t.location : ""}`}
                        >
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-base font-extrabold text-primary md:h-10 md:w-10 md:text-sm">
                            {(name.charAt(0) || "H").toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className={`truncate text-[15px] ${unread ? "font-extrabold" : "font-bold"} text-foreground`}>
                                {name + (t.location ? ` · ${t.location}` : "")}
                              </span>
                              {label && (
                                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${stateClasses(st)}`}>
                                  {label}
                                </span>
                              )}
                              {unread && (
                                <span className="hidden shrink-0 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold leading-none text-primary-foreground md:inline">
                                  NEW
                                </span>
                              )}
                            </div>
                            <p className={`mt-0.5 truncate text-[13px] ${unread ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                              {t.title}
                              {" · "}
                              {t.last_message ? (t.last_sender === "contractor" ? "You: " : "") + t.last_message : "No messages yet"}
                            </p>
                          </div>
                          <span className="flex shrink-0 flex-col items-end gap-1 text-xs text-muted-foreground">
                            {relativeTime(t.last_at)}
                            <span className="md:hidden">
                              {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                            </span>
                          </span>
                        </button>

                        {/* Expanded actions — mobile only (desktop shows them in the conversation pane) */}
                        {expanded && (
                          <div className="border-t border-border px-4 pb-4 pt-3 md:hidden">
                            <div className="grid grid-cols-2 gap-2">
                              {hasJob && (
                                <button
                                  type="button"
                                  onClick={() => setJobOpenToken(jobOpenHere ? null : t.c_token)}
                                  aria-expanded={jobOpenHere}
                                  className={`${ACTION} border border-border text-foreground hover:bg-muted ${jobOpenHere ? "bg-muted" : "bg-card"}`}
                                >
                                  <ScrollText className="h-4 w-4" /> Job details
                                  {jobOpenHere ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                </button>
                              )}
                              {cBid?.share_token && (
                                <a href={`/p/${cBid.share_token}`} target="_blank" rel="noopener noreferrer" className={`${ACTION} border border-border bg-card text-foreground hover:bg-muted`}>
                                  <FileText className="h-4 w-4" /> View bid
                                </a>
                              )}
                              {cPhone ? (
                                <a href={`tel:${cPhone}`} className={`${ACTION} border border-border bg-card text-foreground hover:bg-muted`}>
                                  <Phone className="h-4 w-4" /> Call
                                </a>
                              ) : (
                                <span title="Unlocks once a visit is scheduled or you're hired" className={`${ACTION} cursor-not-allowed border border-border bg-muted/50 text-muted-foreground`}>
                                  <Phone className="h-4 w-4" /> Call
                                </span>
                              )}
                              {cBid?.share_token && cBid?.status === "accepted" && (
                                <a href={`/contractors/project/${cBid.share_token}`} className={`${ACTION} bg-green-600 text-white hover:bg-green-700`}>
                                  <ExternalLink className="h-4 w-4" /> Open project
                                </a>
                              )}
                              {t.workspace && (
                                <a href={t.workspace} target="_blank" rel="noopener noreferrer" className={`${wsSpan} ${ACTION} bg-primary text-primary-foreground hover:bg-primary/90`}>
                                  <ExternalLink className="h-4 w-4" /> Open workspace
                                </a>
                              )}
                              <button
                                type="button"
                                onClick={() => openChat(t.c_token)}
                                className={`${ACTION} col-span-2 border border-primary/40 bg-primary/[0.06] text-primary hover:bg-primary/10`}
                              >
                                <MessageCircle className="h-4 w-4" /> Recent conversation
                              </button>
                            </div>
                            {d === undefined && (
                              <p className="mt-2 text-center text-[11px] text-muted-foreground">Loading job actions…</p>
                            )}
                          </div>
                        )}

                        {/* Job details — inline under the expanded card (mobile) */}
                        {expanded && jobOpenHere && (
                          <div className="md:hidden">
                            {jobCard === undefined ? (
                              <div className="border-t border-border bg-muted/30 px-5 py-4 text-sm text-muted-foreground">Loading job details…</div>
                            ) : jobCard ? (
                              <div className="border-t border-border"><JobCard job={jobCard} /></div>
                            ) : (
                              <div className="border-t border-border bg-muted/30 px-5 py-4 text-sm text-muted-foreground">Job details aren&apos;t available for this thread.</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ── Conversation pane (desktop) / chat-only view (mobile) ── */}
          <div className={`min-h-0 min-w-0 flex-col ${paneOpen ? "flex" : "hidden md:flex"} md:h-full md:bg-[#fbfcfd]`}>
            {!activeToken ? (
              <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <MessageCircle className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-semibold text-foreground">Select a conversation</p>
                <p className="mt-1 text-xs text-muted-foreground">Choose a homeowner on the left to see your messages.</p>
              </div>
            ) : !loaded || !ownsActive ? (
              <div className={`${CARD} px-6 py-14 text-center md:m-6 md:rounded-2xl md:shadow-none`}>
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
              <div className={`${CARD} flex h-[calc(100dvh-166px)] min-h-[460px] flex-col overflow-hidden bg-[#fbfcfd] md:h-full md:min-h-0 md:rounded-none md:border-0 md:shadow-none`}>
                {/* Header: who + state + the job, then the action buttons (wrap, never overflow) */}
                <div className="border-b border-border bg-card px-3 py-3 md:px-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={backToList}
                      className="flex h-10 shrink-0 items-center gap-1 rounded-lg pl-1 pr-2 text-sm font-semibold text-primary hover:bg-muted md:hidden"
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
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${stateClasses(activeState)}`}>
                            {stateLabel}
                          </span>
                        )}
                      </h3>
                      <p className="truncate text-[13px] text-muted-foreground">{jobTitle}</p>
                    </div>
                  </div>
                  {/* Desktop action row (mobile has these on the expanded card) */}
                  <div className="mt-3 hidden flex-wrap items-center gap-2 md:flex">
                    {(detail?.job?.job_ref || activeRow?.job_ref) && (
                      <button
                        type="button"
                        onClick={() => setJobOpenToken(jobOpenToken === activeToken ? null : activeToken)}
                        aria-expanded={jobOpenToken === activeToken}
                        className={`${PANE_BTN} border border-border text-foreground hover:bg-muted ${jobOpenToken === activeToken ? "bg-muted" : "bg-card"}`}
                      >
                        <ScrollText className="h-4 w-4" /> Job details
                        {jobOpenToken === activeToken ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </button>
                    )}
                    {bid?.share_token && (
                      <a href={`/p/${bid.share_token}`} target="_blank" rel="noopener noreferrer" className={`${PANE_BTN} border border-border bg-card text-foreground hover:bg-muted`}>
                        <FileText className="h-4 w-4" /> View bid
                      </a>
                    )}
                    {contact?.phone ? (
                      <a href={`tel:${contact.phone}`} className={`${PANE_BTN} border border-border bg-card text-foreground hover:bg-muted`}>
                        <Phone className="h-4 w-4" /> Call
                      </a>
                    ) : (
                      <span title="Unlocks once a visit is scheduled or you're hired" className={`${PANE_BTN} cursor-not-allowed border border-border bg-muted/50 text-muted-foreground`}>
                        <Phone className="h-4 w-4" /> Call
                      </span>
                    )}
                    {bid?.share_token && bid?.status === "accepted" && (
                      <a href={`/contractors/project/${bid.share_token}`} className={`${PANE_BTN} bg-green-600 text-white hover:bg-green-700`}>
                        <ExternalLink className="h-4 w-4" /> Open project
                      </a>
                    )}
                    {activeRow?.workspace && (
                      <a href={activeRow.workspace} target="_blank" rel="noopener noreferrer" className={`${PANE_BTN} bg-primary text-primary-foreground hover:bg-primary/90`}>
                        <ExternalLink className="h-4 w-4" /> Open workspace
                      </a>
                    )}
                  </div>
                </div>

                {/* Job details (desktop, collapsible under the header) */}
                {jobOpenToken === activeToken && (
                  <div className="hidden md:block">
                    {jobCard === undefined ? (
                      <div className="border-b border-border bg-muted/30 px-5 py-4 text-sm text-muted-foreground">Loading job details…</div>
                    ) : jobCard ? (
                      <JobCard job={jobCard} />
                    ) : (
                      <div className="border-b border-border bg-muted/30 px-5 py-4 text-sm text-muted-foreground">Job details aren&apos;t available for this thread.</div>
                    )}
                  </div>
                )}

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
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

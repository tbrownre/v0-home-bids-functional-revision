"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Radar, Plus, Copy, Check, Play, Loader2, Inbox, AlertTriangle, MessageSquareText, Users, RefreshCw, Facebook, X, Tag,
  Mail, ShieldCheck, ClipboardList, ExternalLink, EyeOff, Eye, FileText, Bookmark, MoreHorizontal, SkipForward, Settings,
  Wrench, Pencil, ChevronDown, Scan, CircleDot, Smartphone,
} from "lucide-react";
import { ContractorTopbar } from "@/components/contractor/contractor-topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getMockUser, syncMirrorFromSupabase } from "@/lib/mock-auth";
import {
  getRadarOverview, addRadarGroups, removeRadarGroup, setRadarSettings, setRadarLeadStatus, setRadarLeadSaved, startRadarBid,
  type RadarOverview, type RadarGroup, type RadarLead,
} from "@/lib/supabase/lead-radar";
import { CONTRACTOR_SMS_PHONE_NUMBER, CONTRACTOR_SMS_PHONE_DISPLAY, getSmsHref, isSmsCapableDevice } from "@/lib/sms-config";

/**
 * /contractors/lead-radar — Lead Radar.
 *
 * v4 (Tim, Oct 27 9:51 PM full-page mock — "Can we modify the opportunities CTA's to this?"; Abir Oct 29: "design should be
 * exact"). The page is his mock top to bottom, only the data is live:
 *   Head: radar icon + "Lead Radar" / "Find local jobs. Get notified by text."  |  [● Active] Alerts sent to (phone) [⚙ Alert settings]
 *   Opportunities — pills New (n) · All (n) · Saved (n) · Bids (n) · Hidden (n), refresh, "Newest first" sort.
 *     Card: group · date · [trade] [timing] [city] … bookmark ⋯ / author + post / meta line (details · city) /
 *           SUGGESTED COMMENT + Copy / [Build Bid] [Open Post] [Hide] [Skip]
 *   Your trades — "Get opportunities that match your services." · n selected · [✎ Edit trades] · chips · + Add custom trade
 *   Your Facebook groups — "Add one group at a time…" · n / 25 · [link input] [+ Add group] · group chips with ×
 *   How Lead Radar works — and what keeps you safe in the groups (folded)
 * Alert settings (pause/resume texts, email alerts) live in the ⚙ dialog — same RPCs as before, nothing removed.
 *
 * Data: radar_overview + the radar_* RPCs (auth.uid()-scoped). Matching + alerts run in Postgres (radar_match_post /
 * radar_lead_alert). "Build Bid" (v3) opens a text to the Bid Builder line with the lead's LR- ref; Bid Builder reads the post
 * back out of Supabase (radar_lead_for_bid) and the finished proposal shows up on the card as "View bid".
 */

const CARD = "rounded-[22px] border border-border bg-card shadow-[0_10px_30px_rgba(16,17,20,0.06)]";
const MAX_GROUPS = 25;
const MAX_CUSTOM = 10;

/** The radar's trade list — in the order of Tim's mockup, then the rest. Keys are what the classifier writes to radar_posts.category. */
const TRADES: Array<{ key: string; label: string; hints: string[] }> = [
  { key: "Plumber",                          label: "Plumbing",         hints: ["plumb", "drain", "leak", "toilet", "water heater", "sewer", "faucet"] },
  { key: "Electrician",                      label: "Electrical",       hints: ["electric", "wiring", "panel"] },
  { key: "HVAC contractor",                  label: "HVAC",             hints: ["hvac", "heating", "cooling", "air cond", " ac ", "a/c", "furnace", "mechanical"] },
  { key: "Roofing contractor",               label: "Roofing",          hints: ["roof"] },
  { key: "Garage door supplier",             label: "Garage doors",     hints: ["garage"] },
  { key: "Landscaper",                       label: "Landscaping",      hints: ["landscap", "hardscape", "irrigation", "sprinkler", "pavers", "turf"] },
  { key: "Lawn care service",                label: "Lawn care",        hints: ["lawn", "mow", "yard"] },
  { key: "Painter",                          label: "Painting",         hints: ["paint"] },
  { key: "General contractor",               label: "Remodel / GC",     hints: ["general", "remodel", "kitchen", "bathroom", "build", "demo", "construction", "renovat"] },
  { key: "Handyman",                         label: "Handyman",         hints: ["handyman", "repair"] },
  { key: "Pest control service",             label: "Pest control",     hints: ["pest", "termite", "scorpion", "exterminat"] },
  { key: "Appliance repair service",         label: "Appliance repair", hints: ["appliance"] },
  { key: "Flooring contractor",              label: "Flooring",         hints: ["floor", "tile", "carpet"] },
  { key: "Fence contractor",                 label: "Fencing",          hints: ["fence", "gate"] },
  { key: "Tree service",                     label: "Tree service",     hints: ["tree", "arborist", "stump"] },
  { key: "House cleaning service",           label: "House cleaning",   hints: ["house clean", "maid", "cleaning service", "janitor"] },
  { key: "Junk removal service",             label: "Junk removal",     hints: ["junk", "haul"] },
  { key: "Concrete contractor",              label: "Concrete",         hints: ["concrete", "masonry", "stucco", "block wall"] },
  { key: "Gutter cleaning service",          label: "Gutters",          hints: ["gutter"] },
  { key: "Pressure washing service",         label: "Pressure washing", hints: ["pressure wash", "power wash"] },
  { key: "Window installation service",      label: "Windows & doors",  hints: ["window", "door", "glass"] },
  { key: "Locksmith",                        label: "Locksmith",        hints: ["lock"] },
  { key: "Water damage restoration service", label: "Water damage",     hints: ["water damage", "restoration", "mold", "flood"] },
  { key: "Pool cleaning service",            label: "Pool service",     hints: ["pool", "spa"] },
];
const TRADE_LABEL: Record<string, string> = Object.fromEntries(TRADES.map((t) => [t.key, t.label]));

const URGENCY_LABEL: Record<string, string> = {
  asap: "ASAP",
  within_week: "This week",
  within_month: "This month",
  flexible: "Flexible",
};

/** Trades we pre-select from the profile when the contractor has never saved a choice. */
function guessTrades(specialties: string[] | null | undefined, company: string | null | undefined): string[] {
  const hay = " " + [...(specialties ?? []), company ?? ""].join(" | ").toLowerCase() + " ";
  const out: string[] = [];
  for (const t of TRADES) {
    if (t.key === "Handyman" && /handyman/.test(hay)) { out.push(t.key); continue; }
    if (t.key === "Handyman") continue; // "repair" alone is too broad
    if (t.hints.some((h) => hay.includes(h))) out.push(t.key);
  }
  return out;
}

function timeAgo(iso: string | null | undefined): string {
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

function prettyPhone(e164: string): string {
  const d = e164.replace(/\D/g, "");
  const n = d.length === 11 && d.startsWith("1") ? d.slice(1) : d;
  return n.length === 10 ? `(${n.slice(0, 3)}) ${n.slice(3, 6)}-${n.slice(6)}` : e164;
}

function groupTitle(g: RadarGroup): string {
  if (g.name) return g.name;
  const slug = g.url.replace(/^https?:\/\/(www\.)?facebook\.com\/groups\//i, "").replace(/\/$/, "");
  return slug || g.url;
}

/** Split whatever got pasted (one link, or several separated by spaces / commas / new lines) into candidate links. */
function splitLinks(raw: string): string[] {
  return raw
    .split(/[\s,;]+/)
    .map((s) => s.trim())
    .filter((s) => s && !/^(https?:\/\/)?(www\.)?facebook\.com\/?$/i.test(s));
}

type LeadFilter = "new" | "all" | "saved" | "bid" | "hidden";
type LeadSort = "newest" | "oldest";
type LeadAction = "new" | "contacted" | "skipped" | "hidden";

/** What the contractor texts the Bid Builder line for this lead - Detect Job Ref v7.7 RADARREF picks the LR- ref out of it. */
function bidText(l: RadarLead): string {
  const ref = l.bid_ref ?? "";
  return l.status === "bid" || l.bid_started_at ? `Continue my bid for Facebook lead ${ref}` : `Build a bid for my Facebook lead ${ref}`;
}

function money(n: number | null | undefined): string {
  if (n == null || Number.isNaN(Number(n))) return "";
  return "$" + Number(n).toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function postTime(l: RadarLead): number {
  const t = Date.parse(l.post.posted_at || l.created_at);
  return Number.isNaN(t) ? 0 : t;
}

type SaveState = "idle" | "saving" | "saved" | "error";

export default function LeadRadarPage() {
  const [data, setData] = useState<RadarOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // groups
  const [paste, setPaste] = useState("");
  const [adding, setAdding] = useState(false);
  const [addNote, setAddNote] = useState<{ tone: "ok" | "warn"; text: string } | null>(null);
  const [busyGroup, setBusyGroup] = useState<string | null>(null);

  // trades
  const [selected, setSelected] = useState<string[]>([]);
  const [custom, setCustom] = useState<string[]>([]);
  const [customOpen, setCustomOpen] = useState(false);
  const [customDraft, setCustomDraft] = useState("");
  const [tradesDirty, setTradesDirty] = useState(false);
  const [tradesSave, setTradesSave] = useState<SaveState>("idle");
  const [tradesError, setTradesError] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestTrades = useRef<{ selected: string[]; custom: string[] }>({ selected: [], custom: [] });
  // Bumped on every lead write (Build Bid / Hide / Skip / Undo / bookmark). A refresh that started before the write must not
  // overwrite the write's optimistic card state with older server data - the write triggers its own refresh when it is done.
  const writeSeq = useRef(0);

  // alerts
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pausing, setPausing] = useState(false);
  const [emailOn, setEmailOn] = useState(false);
  const [emailDraft, setEmailDraft] = useState("");
  const [emailSave, setEmailSave] = useState<SaveState>("idle");
  const [emailError, setEmailError] = useState<string | null>(null);

  // leads
  const [filter, setFilter] = useState<LeadFilter>("new");
  const [sort, setSort] = useState<LeadSort>("newest");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [busyLead, setBusyLead] = useState<string | null>(null);
  const [bidOpened, setBidOpened] = useState<{ id: string; text: string } | null>(null); // lead whose "text this to your assistant" helper is showing + the exact text the tap sent
  const [copiedBid, setCopiedBid] = useState<string | null>(null);
  const [smsDevice, setSmsDevice] = useState(false);
  useEffect(() => { setSmsDevice(isSmsCapableDevice()); }, []);

  // Auth guard (same pattern as the dashboard / leads pages).
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
        window.location.replace("/auth/sign-in?redirect=" + encodeURIComponent(window.location.pathname) + "&switch=1");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const load = async (first = false) => {
    if (typeof window !== "undefined" && window.location.hostname.includes("vusercontent.net")) {
      setLoading(false);
      return;
    }
    const seq = writeSeq.current;
    try {
      const res = await getRadarOverview();
      if (res.error !== null) {
        setLoadError(res.error);
        return;
      }
      if (writeSeq.current !== seq) return; // a lead write happened meanwhile - this snapshot is already stale
      const ov = res.data;
      setData(ov);
      setLoadError(null);
      if (first) {
        const s = ov.settings;
        const savedCats = s?.categories;
        const savedCustom = (s?.custom_trades ?? []).filter(Boolean);
        if (s) {
          setSelected((savedCats ?? []).filter((c) => TRADE_LABEL[c]));
          setCustom(savedCustom);
          setTradesDirty(false);
          setEmailOn(!!s.email_alerts);
          setEmailDraft(s.alert_email ?? ov.profile?.email ?? "");
        } else {
          // never saved anything: start from what the profile says, so the first "Add group" saves the right trades
          const guess = guessTrades(ov.profile?.specialties, ov.profile?.company);
          setSelected(guess);
          setCustom([]);
          setTradesDirty(guess.length > 0);
          setEmailOn(false);
          setEmailDraft(ov.profile?.email ?? "");
        }
      }
    } catch (e) {
      console.error("[LeadRadar] load failed:", e);
      setLoadError(e instanceof Error ? e.message : "Could not load the radar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(true);
    const t = setInterval(() => void load(false), 90_000); // new leads land without a refresh
    return () => { clearInterval(t); if (saveTimer.current) clearTimeout(saveTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { latestTrades.current = { selected, custom }; }, [selected, custom]);

  const groups = data?.groups ?? [];
  const leads = data?.leads ?? [];
  const paused = !!data?.settings?.paused;
  const phone = data?.profile?.phone ?? null;
  const activeGroups = groups.filter((g) => g.enabled).length;
  const tradeCount = selected.length + custom.length;

  const counts = useMemo(() => {
    const c: Record<LeadFilter, number> = { new: 0, all: 0, saved: 0, bid: 0, hidden: 0 };
    for (const l of leads) {
      if (l.status === "hidden") { c.hidden += 1; continue; }
      c.all += 1; // "All" is everything you haven't hidden
      if (l.status === "new") c.new += 1;
      if (l.saved_at) c.saved += 1;
      if (l.status === "bid" || l.proposal) c.bid += 1;
    }
    return c;
  }, [leads]);

  const shownLeads = useMemo(() => {
    const list = leads.filter((l) => {
      if (filter === "hidden") return l.status === "hidden";
      if (l.status === "hidden") return false;
      if (filter === "all") return true;
      if (filter === "new") return l.status === "new";
      if (filter === "saved") return !!l.saved_at;
      return l.status === "bid" || !!l.proposal; // "bid"
    });
    return [...list].sort((a, b) => (sort === "newest" ? postTime(b) - postTime(a) : postTime(a) - postTime(b)));
  }, [leads, filter, sort]);

  const pastedLinks = useMemo(() => splitLinks(paste), [paste]);
  const room = Math.max(0, MAX_GROUPS - groups.length);

  /** Persist the trade filter (standard + custom). `null` categories = every homeowner request. */
  const persistTrades = async (cats: string[], cust: string[]) => {
    const res = await setRadarSettings(cats.length ? cats : null, null, cust);
    if (res.error) throw new Error(res.error);
  };

  /** Trades save themselves ~0.6 s after the last tap (the mockup has no Save button). */
  const queueTradesSave = () => {
    setTradesDirty(true);
    setTradesSave("saving");
    setTradesError(null);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const snap = latestTrades.current;
      try {
        await persistTrades(snap.selected, snap.custom);
        setTradesDirty(false);
        setTradesSave("saved");
        void load(false);
      } catch (e) {
        setTradesSave("error");
        setTradesError(e instanceof Error ? e.message : "Could not save");
      }
    }, 600);
  };

  const onAdd = async () => {
    if (!pastedLinks.length || adding) return;
    setAdding(true);
    setAddNote(null);
    try {
      const res = await addRadarGroups(pastedLinks);
      if (res.error !== null) {
        setAddNote({ tone: "warn", text: res.error });
        return;
      }
      const r = res.data;
      // First save of the trade filter rides along with the first groups, so the texts match what is on screen.
      if (tradesDirty) {
        try { await persistTrades(selected, custom); setTradesDirty(false); setTradesSave("saved"); } catch { /* shown by the trades card on its own save */ }
      }
      const parts: string[] = [];
      parts.push(r.added === 1 ? "Added 1 group" : `Added ${r.added} groups`);
      if (r.duplicates) parts.push(`${r.duplicates} already on your list`);
      if (r.invalid.length) parts.push(`${r.invalid.length} ${r.invalid.length === 1 ? "link isn't" : "links aren't"} a facebook.com/groups link`);
      const over = pastedLinks.length - r.added - r.duplicates - r.invalid.length;
      if (over > 0) parts.push(`${over} skipped — ${MAX_GROUPS} groups is the limit`);
      setAddNote({ tone: r.added > 0 ? "ok" : "warn", text: parts.join(" · ") + (r.added > 0 ? ". We're watching it now." : ".") });
      if (r.added > 0 || r.invalid.length === 0) setPaste(r.invalid.join("\n"));
      await load(false);
    } finally {
      setAdding(false);
    }
  };

  const onRemove = async (g: RadarGroup) => {
    if (!window.confirm(`Stop watching "${groupTitle(g)}"?`)) return;
    setBusyGroup(g.id);
    try {
      await removeRadarGroup(g.id);
      await load(false);
    } finally {
      setBusyGroup(null);
    }
  };

  const toggleTrade = (key: string) => {
    setSelected((cur) => (cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key]));
    queueTradesSave();
  };

  const selectAllTrades = () => {
    setSelected([]);
    setCustom([]);
    queueTradesSave();
  };

  const addCustomTrade = () => {
    const v = customDraft.trim().replace(/\s+/g, " ").slice(0, 40);
    if (v.length < 2) return;
    const dupStd = TRADES.find((t) => t.label.toLowerCase() === v.toLowerCase() || t.key.toLowerCase() === v.toLowerCase());
    if (dupStd) {
      if (!selected.includes(dupStd.key)) setSelected((cur) => [...cur, dupStd.key]);
      setCustomDraft("");
      queueTradesSave();
      return;
    }
    if (custom.some((c) => c.toLowerCase() === v.toLowerCase())) { setCustomDraft(""); return; }
    if (custom.length >= MAX_CUSTOM) { setTradesError(`Up to ${MAX_CUSTOM} custom trades.`); return; }
    setCustom((cur) => [...cur, v]);
    setCustomDraft("");
    queueTradesSave();
  };

  const removeCustomTrade = (v: string) => {
    setCustom((cur) => cur.filter((c) => c !== v));
    queueTradesSave();
  };

  // Every settings write carries the trades exactly as shown on screen (`selected` + `custom`), never a stale server copy,
  // so a pause or an email change can't undo a trade tap that was saved a moment earlier.
  const onPause = async (next: boolean) => {
    setPausing(true);
    try {
      const res = await setRadarSettings(selected.length ? selected : null, next, custom);
      if (!res.error) await load(false);
    } finally {
      setPausing(false);
    }
  };

  const saveEmail = async (on: boolean, address: string) => {
    setEmailSave("saving");
    setEmailError(null);
    try {
      const addr = address.trim();
      if (on && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(addr)) {
        setEmailSave("error");
        setEmailError("Enter the email address the alerts should go to.");
        return;
      }
      const res = await setRadarSettings(selected.length ? selected : null, null, custom, on, addr || null);
      if (res.error) throw new Error(res.error);
      setEmailSave("saved");
      await load(false);
    } catch (e) {
      setEmailSave("error");
      setEmailError(e instanceof Error ? e.message : "Could not save");
    }
  };

  const onEmailToggle = (on: boolean) => {
    setEmailOn(on);
    if (!on) void saveEmail(false, emailDraft);
    else if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailDraft.trim())) void saveEmail(true, emailDraft);
  };

  const copyComment = async (l: RadarLead) => {
    if (!l.comment) return;
    try {
      await navigator.clipboard.writeText(l.comment);
      setCopiedId(l.id);
      setTimeout(() => setCopiedId((c) => (c === l.id ? null : c)), 2000);
    } catch { /* no-op */ }
  };

  const copyPostLink = async (l: RadarLead) => {
    if (!l.post.url) return;
    try { await navigator.clipboard.writeText(l.post.url); } catch { /* no-op */ }
  };

  const markLead = async (l: RadarLead, status: LeadAction) => {
    setBusyLead(l.id);
    writeSeq.current += 1;
    try {
      // Undo / Unhide on a lead whose bid already started goes back to "Bid started" (the RPC applies the same rule)
      const shown: RadarLead["status"] = status === "new" && l.bid_started_at ? "bid" : status;
      setData((d) => d ? { ...d, leads: d.leads.map((x) => (x.id === l.id ? { ...x, status: shown } : x)) } : d);
      await setRadarLeadStatus(l.id, status);
    } finally {
      setBusyLead(null);
      void load(false); // server truth after the write (also undoes the optimistic state if the write failed)
    }
  };

  /** Bookmark (the "Saved" filter). */
  const toggleSaved = async (l: RadarLead) => {
    writeSeq.current += 1;
    const next = l.saved_at ? null : new Date().toISOString();
    setData((d) => d ? { ...d, leads: d.leads.map((x) => (x.id === l.id ? { ...x, saved_at: next } : x)) } : d);
    try {
      await setRadarLeadSaved(l.id, !!next);
    } finally {
      void load(false);
    }
  };

  /**
   * "Build Bid": on a phone the button itself is the sms: link (Messages opens inside the tap, body pre-filled with the
   * LR- ref); here we stamp the lead so it shows as "Bid started" and Bid Builder's lookup finds it. On a desktop the helper box
   * under the card shows the exact text to send instead.
   */
  const startBid = async (l: RadarLead) => {
    writeSeq.current += 1;
    setBidOpened({ id: l.id, text: bidText(l) }); // captured before the status flips, so the helper shows the same text the sms: link carried
    const now = new Date().toISOString();
    setData((d) => d ? { ...d, leads: d.leads.map((x) => (x.id === l.id ? { ...x, status: "bid", bid_started_at: x.bid_started_at ?? now } : x)) } : d);
    if (filter === "new") setFilter("bid"); // the card leaves "New" - follow it to "Bids" so the helper box stays in view
    try {
      const res = await startRadarBid(l.id);
      if (res.error) console.error("[LeadRadar] start bid:", res.error);
    } finally {
      void load(false);
    }
  };

  const copyBidText = async (l: RadarLead) => {
    try {
      await navigator.clipboard.writeText(bidOpened && bidOpened.id === l.id ? bidOpened.text : bidText(l));
      setCopiedBid(l.id);
      setTimeout(() => setCopiedBid((c) => (c === l.id ? null : c)), 2000);
    } catch { /* no-op */ }
  };

  const chipBase = "inline-flex h-10 items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold transition-colors";
  const chipOff = "border-border bg-card text-foreground hover:bg-muted";
  const chipOn = "border-primary bg-primary/5 text-primary";
  const pill = (on: boolean) =>
    `inline-flex h-9 shrink-0 items-center rounded-full px-4 text-sm font-semibold transition-colors ${on ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-muted/70"}`;
  const cta = "h-11 w-full gap-2 rounded-xl text-[15px] font-semibold";
  const ctaGray = `${cta} border-0 bg-muted text-foreground hover:bg-muted/70`;
  const iconBox = "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10";

  const FILTERS: Array<{ key: LeadFilter; label: string }> = [
    { key: "new", label: "New" },
    { key: "all", label: "All" },
    { key: "saved", label: "Saved" },
    { key: "bid", label: "Bids" },
    { key: "hidden", label: "Hidden" },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <ContractorTopbar />
      <main className="mx-auto w-full max-w-[960px] px-4 pb-16 pt-7 sm:px-6" data-hb-radar-v4>
        {/* Head — icon + title + one line | status card: ● Active · Alerts sent to (phone) · ⚙ Alert settings */}
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-[2.2rem] font-extrabold tracking-tight text-foreground sm:text-4xl">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Radar className="h-6 w-6 text-primary" />
              </span>
              Lead Radar
            </h1>
            <p className="mt-1.5 text-lg text-muted-foreground">Find local jobs. Get notified by text.</p>
          </div>

          {data && (
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card px-3 py-2.5 shadow-sm sm:gap-4 sm:px-4" data-hb-radar-statuscard>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${paused ? "bg-amber-50 text-amber-700" : activeGroups ? "bg-green-100 text-green-800" : "bg-muted text-muted-foreground"}`} data-hb-radar-status>
                <span className={`h-2 w-2 rounded-full ${paused ? "bg-amber-500" : activeGroups ? "bg-green-500" : "bg-muted-foreground/50"}`} />
                {paused ? "Paused" : activeGroups ? "Active" : "Add a group to start"}
              </span>
              {phone ? (
                <span className="min-w-0 leading-tight">
                  <span className="block text-[11px] font-medium text-muted-foreground">Alerts sent to</span>
                  <span className="block text-sm font-bold text-foreground">{prettyPhone(phone)}</span>
                </span>
              ) : (
                <span className="text-xs text-amber-700">
                  No mobile number —{" "}
                  <Link href="/contractors/profile" className="font-bold underline">add it</Link> to get texts
                </span>
              )}
              <Button variant="outline" className="h-10 gap-2 rounded-full px-4 font-semibold" onClick={() => setSettingsOpen(true)} data-hb-radar-settings>
                <Settings className="h-4 w-4" />
                Alert settings
              </Button>
            </div>
          )}
        </div>

        {/* Alert settings — pause/resume texts + email alerts (same RPCs as before, just behind the ⚙ button of the mock) */}
        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogContent className="rounded-2xl sm:max-w-md" data-hb-radar-settingsdialog>
            <DialogHeader>
              <DialogTitle className="text-xl font-extrabold tracking-tight">Alert settings</DialogTitle>
              <DialogDescription>Where Lead Radar sends you new opportunities.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="rounded-2xl border border-border px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor="radar-text-switch" className="flex min-w-0 items-center gap-2 text-sm font-semibold text-foreground">
                    <Smartphone className="h-4 w-4 shrink-0 text-primary" />
                    Text alerts
                    {pausing && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                  </label>
                  <Switch id="radar-text-switch" checked={!paused} onCheckedChange={(on) => void onPause(!on)} disabled={pausing} aria-label="Text alerts" />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {phone ? (
                    <>{paused ? "Paused — nothing is texted until you turn this back on." : <>Sent to <span className="font-semibold text-foreground">{prettyPhone(phone)}</span>.</>}</>
                  ) : (
                    <>No mobile number on your profile — <Link href="/contractors/profile" className="font-bold underline">add it</Link> to get texts.</>
                  )}
                </p>
              </div>

              <div className="rounded-2xl border border-border px-4 py-3" data-hb-radar-email>
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor="radar-email-switch" className="flex min-w-0 items-center gap-2 text-sm font-semibold text-foreground">
                    <Mail className="h-4 w-4 shrink-0 text-primary" />
                    Email me too
                    {emailSave === "saving" && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                    {emailSave === "saved" && <span className="text-xs font-semibold text-green-700">Saved</span>}
                  </label>
                  <Switch id="radar-email-switch" checked={emailOn} onCheckedChange={onEmailToggle} aria-label="Email alerts" />
                </div>
                {emailOn && (
                  <div className="mt-2.5 flex flex-col gap-2 sm:flex-row">
                    <Input
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      value={emailDraft}
                      onChange={(e) => { setEmailDraft(e.target.value); setEmailSave("idle"); setEmailError(null); }}
                      onKeyDown={(e) => { if (e.key === "Enter") void saveEmail(true, emailDraft); }}
                      placeholder="you@company.com"
                      className="h-11 flex-1 rounded-xl bg-card"
                      aria-label="Email address for alerts"
                    />
                    <Button className="h-11 rounded-xl px-5 font-semibold" onClick={() => void saveEmail(true, emailDraft)} disabled={emailSave === "saving"}>
                      {emailSave === "saving" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      Save
                    </Button>
                  </div>
                )}
                {emailError && <p className="mt-2 text-sm text-amber-700">{emailError}</p>}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {loadError && (
          <div className="mb-4 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Couldn&apos;t load the radar ({loadError}). <button type="button" className="font-bold underline" onClick={() => void load(true)}>Try again</button></span>
          </div>
        )}

        <div className="space-y-4">
          {/* Opportunities */}
          <section className={`${CARD} p-4 sm:p-6`} data-hb-radar-leads>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-3">
                <span className={iconBox}><Scan className="h-5 w-5 text-primary" /></span>
                <h2 className="text-[1.45rem] font-extrabold tracking-tight text-foreground">Opportunities</h2>
              </div>
              <div className="-mx-1 flex max-w-full items-center gap-2 overflow-x-auto px-1 py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Filter opportunities" data-hb-radar-filters>
                {FILTERS.map((f) => (
                  <button key={f.key} type="button" role="tab" aria-selected={filter === f.key} onClick={() => setFilter(f.key)} className={pill(filter === f.key)} data-hb-radar-filter={f.key}>
                    {f.label} ({counts[f.key]})
                  </button>
                ))}
              </div>
              <div className="ml-auto flex items-center gap-2">
                <button type="button" onClick={() => void load(false)} className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Refresh">
                  <RefreshCw className="h-4 w-4" />
                </button>
                <div className="relative">
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as LeadSort)}
                    className="h-10 appearance-none rounded-full border border-border bg-card pl-4 pr-9 text-sm font-semibold text-foreground outline-none focus:border-primary/50"
                    aria-label="Sort opportunities"
                  >
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                </div>
              </div>
            </div>

            {loading ? (
              <p className="px-2 py-14 text-center text-sm text-muted-foreground">Loading…</p>
            ) : shownLeads.length === 0 ? (
              <div className="px-2 py-10 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <Inbox className="h-7 w-7 text-primary" />
                </div>
                <p className="text-lg font-extrabold text-foreground">{leads.length === 0 ? "No opportunities yet" : "Nothing in this view"}</p>
                <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                  {leads.length === 0
                    ? groups.length
                      ? "We'll text you the moment a homeowner in your groups needs your services. Check back here anytime."
                      : "Add Facebook groups and we'll text you when a homeowner in those groups needs your services."
                    : "Switch the filter above to see the rest."}
                </p>
              </div>
            ) : (
              <ul className="mt-4 space-y-3" data-hb-radar-leadlist>
                {shownLeads.map((l) => {
                  const p = l.post;
                  const busy = busyLead === l.id;
                  const urgency = p.urgency ? URGENCY_LABEL[p.urgency] ?? p.urgency : null;
                  const trade = p.category ? TRADE_LABEL[p.category] ?? p.category : null;
                  const started = l.status === "bid" || !!l.bid_started_at; // a bid was started from this post (maybe later skipped/hidden)
                  const details = [...((p.details ?? []).map((d) => String(d).trim()).filter(Boolean)), ...(p.city ? [p.city] : [])];
                  const meta = details.length ? details : urgency && p.city ? [urgency, p.city] : [];
                  const groupLabel = p.group_name || (p.group_url ? p.group_url.replace(/^https?:\/\/(www\.)?facebook\.com\/groups\//i, "") : "Facebook group");
                  return (
                    <li key={l.id} id={`radar-lead-${l.id}`} className="rounded-2xl border border-border bg-card p-4 sm:p-5" data-hb-radar-lead={l.status}>
                      {/* group · date · chips … bookmark ⋯ */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-muted-foreground">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10" aria-hidden>
                            <Users className="h-3.5 w-3.5 text-primary" />
                          </span>
                          <span className="font-bold text-foreground">{groupLabel}</span>
                          <span>·</span>
                          <span>{timeAgo(p.posted_at || l.created_at)}</span>
                          {trade && <span className="rounded-full bg-primary/10 px-2.5 py-1 font-bold text-primary">{trade}</span>}
                          {urgency && <span className="rounded-full bg-muted px-2.5 py-1 font-semibold text-foreground">{urgency}</span>}
                          {p.city && <span className="rounded-full bg-muted px-2.5 py-1 font-semibold text-foreground">{p.city}</span>}
                          {l.proposal ? (
                            <span className="rounded-full bg-green-100 px-2.5 py-1 font-bold text-green-800">Bid built{l.proposal.total_price != null ? ` · ${money(l.proposal.total_price)}` : ""}</span>
                          ) : l.status === "bid" ? (
                            <span className="rounded-full bg-primary/10 px-2.5 py-1 font-bold text-primary">Bid started · {l.bid_ref}</span>
                          ) : l.status === "contacted" ? (
                            <span className="rounded-full bg-muted px-2.5 py-1 font-bold">Commented</span>
                          ) : l.status === "skipped" ? (
                            <span className="rounded-full bg-muted px-2.5 py-1 font-bold">Skipped</span>
                          ) : l.status === "hidden" ? (
                            <span className="rounded-full bg-muted px-2.5 py-1 font-bold">Hidden</span>
                          ) : null}
                        </div>
                        <div className="flex shrink-0 items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => void toggleSaved(l)}
                            className={`flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted ${l.saved_at ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                            aria-pressed={!!l.saved_at}
                            aria-label={l.saved_at ? "Remove from saved" : "Save"}
                            data-hb-radar-save
                          >
                            <Bookmark className={`h-[18px] w-[18px] ${l.saved_at ? "fill-current" : ""}`} />
                          </button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button type="button" className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="More">
                                <MoreHorizontal className="h-[18px] w-[18px]" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl">
                              {p.url && <DropdownMenuItem onSelect={() => void copyPostLink(l)}>Copy post link</DropdownMenuItem>}
                              {l.status === "contacted" ? (
                                <DropdownMenuItem onSelect={() => void markLead(l, "new")}>Undo &quot;I commented&quot;</DropdownMenuItem>
                              ) : l.status !== "hidden" ? (
                                <DropdownMenuItem onSelect={() => void markLead(l, "contacted")}>I commented</DropdownMenuItem>
                              ) : null}
                              {l.status === "hidden" ? (
                                <DropdownMenuItem onSelect={() => void markLead(l, "new")}>Unhide</DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onSelect={() => void markLead(l, "hidden")}>Hide</DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      <p className="mt-2.5 whitespace-pre-wrap text-[15px] leading-relaxed text-foreground">
                        {p.author ? <span className="font-bold">{p.author}: </span> : null}
                        {p.text || "(no text — open the post)"}
                      </p>

                      {meta.length > 0 && (
                        <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground" data-hb-radar-meta>
                          <CircleDot className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          {meta.map((m, i) => (
                            <span key={`${m}-${i}`} className="inline-flex items-center gap-2">
                              {i > 0 && <span aria-hidden>·</span>}
                              {m}
                            </span>
                          ))}
                        </p>
                      )}

                      {l.comment && (
                        <div className="mt-3.5 rounded-2xl bg-muted/50 p-3.5 ring-1 ring-border">
                          <div className="flex items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-[0.06em] text-muted-foreground">
                              <MessageSquareText className="h-3.5 w-3.5" /> Suggested comment
                            </span>
                            <Button size="sm" variant="outline" className="h-8 gap-1.5 rounded-xl px-3 text-xs font-semibold" onClick={() => void copyComment(l)}>
                              {copiedId === l.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                              {copiedId === l.id ? "Copied" : "Copy"}
                            </Button>
                          </div>
                          <p className="mt-1.5 whitespace-pre-wrap text-sm text-foreground">{l.comment}</p>
                        </div>
                      )}

                      {/* CTA row - Tim's mock: [Build Bid] [Open Post] [Hide] [Skip] */}
                      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4" data-hb-radar-cta>
                        {l.proposal ? (
                          <Button asChild className={cta}>
                            <Link href={l.proposal.status === "accepted" ? `/contractors/project/${l.proposal.share_token}` : `/p/${l.proposal.share_token}`}>
                              <FileText className="h-4 w-4" />
                              View bid
                            </Link>
                          </Button>
                        ) : l.bid_ref && smsDevice ? (
                          <Button asChild className={cta}>
                            <a href={getSmsHref(CONTRACTOR_SMS_PHONE_NUMBER, bidText(l))} onClick={() => void startBid(l)} data-hb-radar-buildbid>
                              <ClipboardList className="h-4 w-4" />
                              {started ? "Continue bid" : "Build Bid"}
                            </a>
                          </Button>
                        ) : l.bid_ref ? (
                          <Button className={cta} onClick={() => void startBid(l)} data-hb-radar-buildbid>
                            <ClipboardList className="h-4 w-4" />
                            {started ? "Continue bid" : "Build Bid"}
                          </Button>
                        ) : null}
                        {p.url && (
                          <Button asChild variant="outline" className={cta}>
                            <a href={p.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                              Open Post
                            </a>
                          </Button>
                        )}
                        {l.status === "hidden" ? (
                          <Button variant="secondary" className={ctaGray} onClick={() => void markLead(l, "new")} disabled={busy}>
                            <Eye className="h-4 w-4" />
                            Unhide
                          </Button>
                        ) : (
                          <Button variant="secondary" className={ctaGray} onClick={() => void markLead(l, "hidden")} disabled={busy}>
                            <EyeOff className="h-4 w-4" />
                            Hide
                          </Button>
                        )}
                        {l.status === "new" || l.status === "contacted" ? (
                          <Button variant="secondary" className={ctaGray} onClick={() => void markLead(l, "skipped")} disabled={busy}>
                            <SkipForward className="h-4 w-4" />
                            Skip
                          </Button>
                        ) : l.status === "skipped" ? (
                          <Button variant="secondary" className={ctaGray} onClick={() => void markLead(l, "new")} disabled={busy}>
                            <Play className="h-4 w-4" />
                            Undo
                          </Button>
                        ) : null}
                      </div>
                      {busy && <Loader2 className="mt-2 h-4 w-4 animate-spin text-muted-foreground" />}

                      {bidOpened && bidOpened.id === l.id && !l.proposal && l.bid_ref && (
                        <div className="mt-3 rounded-xl bg-primary/5 p-3 ring-1 ring-primary/20" data-hb-radar-bidhelp>
                          <p className="text-xs font-extrabold uppercase tracking-[0.06em] text-primary">
                            {smsDevice ? "Opening Messages…" : "Text your assistant to build it"}
                          </p>
                          <p className="mt-1 text-sm text-foreground">
                            {smsDevice ? "If Messages didn't open, text this to " : "Text this to "}
                            <span className="font-semibold">{CONTRACTOR_SMS_PHONE_DISPLAY}</span> from your phone and your HomeBids assistant builds the estimate from this post. You send the finished link to {p.homeowner_first || p.author || "the homeowner"} yourself — in your comment or a DM.
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <code className="rounded-lg bg-card px-2.5 py-1.5 text-sm text-foreground ring-1 ring-border">{bidOpened.text}</code>
                            <Button size="sm" variant="outline" className="h-8 gap-1.5 rounded-full px-3 text-xs font-semibold" onClick={() => void copyBidText(l)}>
                              {copiedBid === l.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                              {copiedBid === l.id ? "Copied" : "Copy"}
                            </Button>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Your trades */}
          <section className={`${CARD} p-4 sm:p-6`} data-hb-radar-trades>
            <div className="flex flex-wrap items-center gap-3">
              <span className={iconBox}><Wrench className="h-5 w-5 text-primary" /></span>
              <div className="min-w-0 flex-1">
                <h2 className="text-[1.45rem] font-extrabold tracking-tight text-foreground">Your trades</h2>
                <p className="text-sm text-muted-foreground">Get opportunities that match your services.</p>
              </div>
              <div className="ml-auto flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground" data-hb-radar-tradecount>
                  {tradesSave === "saving" ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</>
                  ) : tradesSave === "saved" ? (
                    <><Check className="h-3.5 w-3.5 text-green-700" /> Saved</>
                  ) : tradesSave === "error" ? (
                    <span className="text-amber-700">Not saved</span>
                  ) : tradeCount === 0 ? (
                    "All trades"
                  ) : (
                    `${tradeCount} selected`
                  )}
                </span>
                <Button variant="outline" className="h-10 gap-2 rounded-full px-4 font-semibold" onClick={() => setCustomOpen((v) => !v)} aria-expanded={customOpen} data-hb-radar-edittrades>
                  <Pencil className="h-4 w-4" />
                  {customOpen ? "Done" : "Edit trades"}
                </Button>
              </div>
            </div>

            {/* Mock order: the selected trades first (✓), then "All trades", then the rest */}
            <div className="mt-4 flex flex-wrap gap-2">
              {TRADES.filter((t) => selected.includes(t.key)).map((t) => (
                <button key={t.key} type="button" onClick={() => toggleTrade(t.key)} aria-pressed className={`${chipBase} ${chipOn}`}>
                  <Check className="h-4 w-4" />
                  {t.label}
                </button>
              ))}
              {custom.map((c) => (
                <span key={c} className={`${chipBase} ${chipOn} pr-1`}>
                  <Check className="h-4 w-4" />
                  {c}
                  <button type="button" onClick={() => removeCustomTrade(c)} className="ml-0.5 flex h-7 w-7 items-center justify-center rounded-full hover:bg-primary/10" aria-label={`Remove ${c}`}>
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
              <button type="button" onClick={selectAllTrades} aria-pressed={tradeCount === 0} className={`${chipBase} ${tradeCount === 0 ? chipOn : chipOff}`}>
                {tradeCount === 0 && <Check className="h-4 w-4" />}
                All trades
              </button>
              {TRADES.filter((t) => !selected.includes(t.key)).map((t) => (
                <button key={t.key} type="button" onClick={() => toggleTrade(t.key)} aria-pressed={false} className={`${chipBase} ${chipOff}`}>
                  {t.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCustomOpen((v) => !v)}
                className={`${chipBase} border-primary/20 bg-primary/5 text-primary hover:bg-primary/10`}
                aria-expanded={customOpen}
                data-hb-radar-customtrade
              >
                <Plus className="h-4 w-4" />
                Add custom trade
              </button>
            </div>

            {customOpen && (
              <div className="mt-3 flex gap-2">
                <div className="relative flex-1">
                  <Tag className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                  <Input
                    value={customDraft}
                    onChange={(e) => { setCustomDraft(e.target.value); setTradesError(null); }}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomTrade(); } }}
                    placeholder="Enter custom trade (e.g. Pool service)"
                    maxLength={40}
                    className="h-11 rounded-xl bg-muted/40 pl-10"
                    aria-label="Custom trade"
                    autoFocus
                  />
                </div>
                <Button className="h-11 rounded-xl px-5 font-semibold" onClick={addCustomTrade} disabled={customDraft.trim().length < 2}>
                  Add
                </Button>
              </div>
            )}
            {tradesError && <p className="mt-2 text-sm text-amber-700">{tradesError}</p>}
            {!tradesError && tradesDirty && !data?.settings && selected.length > 0 && tradesSave === "idle" && (
              <p className="mt-2 text-xs text-muted-foreground">Pre-filled from your profile — saves with your first group.</p>
            )}
          </section>

          {/* Your Facebook groups */}
          <section className={`${CARD} p-4 sm:p-6`} data-hb-radar-groups>
            <div className="flex flex-wrap items-center gap-3">
              <span className={iconBox}><Users className="h-5 w-5 text-primary" /></span>
              <div className="min-w-0 flex-1">
                <h2 className="text-[1.45rem] font-extrabold tracking-tight text-foreground">Your Facebook groups</h2>
                <p className="text-sm text-muted-foreground">Add one group at a time. We&apos;ll start watching for opportunities.</p>
              </div>
              <span className="ml-auto shrink-0 text-sm font-semibold text-muted-foreground">{groups.length} / {MAX_GROUPS}</span>
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Facebook className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#1877F2]" aria-hidden />
                <Input
                  value={paste}
                  onChange={(e) => { setPaste(e.target.value); setAddNote(null); }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void onAdd(); } }}
                  placeholder="Paste Facebook group link"
                  className="h-12 rounded-xl bg-card pl-12 text-[15px]"
                  disabled={adding || room === 0}
                  inputMode="url"
                  autoComplete="off"
                  aria-label="Facebook group link"
                />
              </div>
              <Button className="h-12 gap-2 rounded-xl px-6 text-[15px] font-semibold" onClick={onAdd} disabled={adding || !pastedLinks.length || room === 0}>
                {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {adding ? "Adding…" : pastedLinks.length > 1 ? `Add ${pastedLinks.length} groups` : "Add group"}
              </Button>
            </div>
            {room === 0 && <p className="mt-2 text-xs text-muted-foreground">You&apos;re at the {MAX_GROUPS}-group limit — remove one to add another.</p>}
            {addNote && (
              <p className={`mt-2 text-sm ${addNote.tone === "ok" ? "text-green-700" : "text-amber-700"}`} data-hb-radar-addnote>{addNote.text}</p>
            )}

            {loading ? (
              <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
            ) : groups.length > 0 ? (
              <ul className="mt-4 flex flex-wrap gap-2" data-hb-radar-grouplist>
                {groups.map((g) => {
                  const busy = busyGroup === g.id;
                  return (
                    <li key={g.id} className={`inline-flex h-10 max-w-full items-center gap-1.5 rounded-full bg-muted pl-3 pr-1 text-sm font-semibold ${g.enabled ? "text-foreground" : "text-muted-foreground line-through"}`}>
                      <Users className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                      <a href={g.url} target="_blank" rel="noopener noreferrer" className="truncate hover:underline" title={g.url}>{groupTitle(g)}</a>
                      <button
                        type="button"
                        onClick={() => void onRemove(g)}
                        disabled={busy}
                        className="ml-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-background hover:text-foreground disabled:opacity-50"
                        aria-label={`Remove ${groupTitle(g)}`}
                      >
                        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </section>

          {/* How it works — folded away so the page stays as clean as the mockup */}
          <details className={`${CARD} group p-4 sm:p-6`}>
            <summary className="flex cursor-pointer list-none items-center gap-3 text-[15px] font-bold text-foreground [&::-webkit-details-marker]:hidden">
              <span className={iconBox}><ShieldCheck className="h-5 w-5 text-primary" /></span>
              <span className="min-w-0 flex-1">How Lead Radar works — and what keeps you safe in the groups</span>
              <span className="ml-auto inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-muted-foreground">
                <span className="group-open:hidden">Show</span>
                <span className="hidden group-open:inline">Hide</span>
                <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden />
              </span>
            </summary>
            <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground sm:pl-[68px]">
              <li>We watch the <span className="font-semibold text-foreground">public</span> groups you add, around the clock.</li>
              <li>When a homeowner needs your type of work, we text you the post link and a suggested reply.</li>
              <li>Tap <span className="font-semibold text-foreground">Build Bid</span> and your assistant builds the estimate from the post by text — you send the finished link in your comment or DM.</li>
              <li>You respond <span className="font-semibold text-foreground">from your own Facebook account</span> — we never post or message anyone for you, so you stay inside each group&apos;s rules.</li>
              <li>Lead with help, not a pitch. Many groups ban advertising — a friendly, specific reply gets the DM; a link drop gets removed.</li>
              <li>One text per matching post, max five per scan. Pause any time.</li>
            </ul>
          </details>
        </div>
      </main>
    </div>
  );
}

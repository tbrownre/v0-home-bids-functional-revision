"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Radar, Plus, Trash2, Copy, Check, ExternalLink, Pause, Play, Loader2, Phone,
  ShieldCheck, Inbox, AlertTriangle, Clock, MessageSquareText, Users, RefreshCw,
} from "lucide-react";
import { ContractorTopbar } from "@/components/contractor/contractor-topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { getMockUser, syncMirrorFromSupabase } from "@/lib/mock-auth";
import {
  getRadarOverview, addRadarGroups, removeRadarGroup, setRadarGroup, setRadarSettings, setRadarLeadStatus,
  type RadarOverview, type RadarGroup, type RadarLead,
} from "@/lib/supabase/lead-radar";

/**
 * /contractors/lead-radar — Lead Radar (Tim/Abir, Oct 21): "the lead radar should have a
 * submit button where the contractors can upload 25 groups up to, so it will watch those
 * groups and send him leads about the posts and commenting thing".
 *
 * The contractor pastes up to 25 PUBLIC Facebook groups. n8n ("HomeBids - Lead Radar")
 * scans them every few hours, keeps the homeowner "looking for a pro" posts, and texts the
 * contractor each matching lead on the Bid Builder line with the post link + a comment he
 * can paste. Nothing is ever posted from anyone's Facebook account — he posts the comment
 * himself, from his own account, so he stays inside each group's rules.
 *
 * Same shell as /contractors/leads (ContractorTopbar, CARD, auth guard).
 */

const CARD = "rounded-[22px] border border-border bg-card shadow-[0_10px_30px_rgba(16,17,20,0.06)]";
const MAX_GROUPS = 25;

/** The radar's trade list (same canonical names the classifier writes to radar_posts.category). */
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
  { key: "Window installation service",      label: "Windows & doors",  hints: ["window", "door", "glass"] },
  { key: "Locksmith",                        label: "Locksmith",        hints: ["lock"] },
  { key: "Concrete contractor",              label: "Concrete",         hints: ["concrete", "masonry", "stucco", "block wall"] },
  { key: "Gutter cleaning service",          label: "Gutters",          hints: ["gutter"] },
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

/** Split whatever got pasted (one per line, commas, spaces) into candidate links. */
function splitLinks(raw: string): string[] {
  return raw
    .split(/[\s,;]+/)
    .map((s) => s.trim())
    .filter((s) => s && !/^(https?:\/\/)?(www\.)?facebook\.com\/?$/i.test(s));
}

function Label({ children }: { children: ReactNode }) {
  return <p className="text-xs font-extrabold uppercase tracking-[0.06em] text-muted-foreground">{children}</p>;
}

type LeadFilter = "new" | "contacted" | "skipped" | "all";

export default function LeadRadarPage() {
  const [data, setData] = useState<RadarOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // groups
  const [paste, setPaste] = useState("");
  const [adding, setAdding] = useState(false);
  const [addNote, setAddNote] = useState<{ tone: "ok" | "warn"; text: string } | null>(null);
  const [busyGroup, setBusyGroup] = useState<string | null>(null);
  const [cityDraft, setCityDraft] = useState<Record<string, string>>({});

  // trades
  const [selected, setSelected] = useState<string[]>([]);
  const [tradesDirty, setTradesDirty] = useState(false);
  const [savingTrades, setSavingTrades] = useState(false);
  const [tradesNote, setTradesNote] = useState<string | null>(null);

  // pause
  const [pausing, setPausing] = useState(false);

  // leads
  const [filter, setFilter] = useState<LeadFilter>("new");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [busyLead, setBusyLead] = useState<string | null>(null);

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
    try {
      const res = await getRadarOverview();
      if (res.error !== null) {
        setLoadError(res.error);
        return;
      }
      const ov = res.data;
      setData(ov);
      setLoadError(null);
      if (first) {
        const saved = ov.settings?.categories;
        if (saved && saved.length) {
          setSelected(saved.filter((c) => TRADE_LABEL[c]));
          setTradesDirty(false);
        } else if (!ov.settings) {
          // never saved anything: start from what the profile says, so the first "Add groups" saves the right trades
          const guess = guessTrades(ov.profile?.specialties, ov.profile?.company);
          setSelected(guess);
          setTradesDirty(guess.length > 0);
        } else {
          setSelected([]); // saved as "all trades"
          setTradesDirty(false);
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
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const groups = data?.groups ?? [];
  const leads = data?.leads ?? [];
  const paused = !!data?.settings?.paused;
  const phone = data?.profile?.phone ?? null;
  const activeGroups = groups.filter((g) => g.enabled).length;

  const counts = useMemo(() => {
    const c = { all: leads.length, new: 0, contacted: 0, skipped: 0 };
    for (const l of leads) c[l.status] += 1;
    return c;
  }, [leads]);
  const shownLeads = useMemo(() => (filter === "all" ? leads : leads.filter((l) => l.status === filter)), [leads, filter]);

  const pastedLinks = useMemo(() => splitLinks(paste), [paste]);
  const room = Math.max(0, MAX_GROUPS - groups.length);

  const saveTrades = async (cats: string[]) => {
    const res = await setRadarSettings(cats.length ? cats : null, null);
    if (res.error) throw new Error(res.error);
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
        try { await saveTrades(selected); setTradesDirty(false); } catch { /* shown by the trades card on its own save */ }
      }
      const parts: string[] = [];
      parts.push(r.added === 1 ? "Added 1 group" : `Added ${r.added} groups`);
      if (r.duplicates) parts.push(`${r.duplicates} already on your list`);
      if (r.invalid.length) parts.push(`${r.invalid.length} ${r.invalid.length === 1 ? "link isn't" : "links aren't"} a facebook.com/groups link`);
      const over = pastedLinks.length - r.added - r.duplicates - r.invalid.length;
      if (over > 0) parts.push(`${over} skipped — ${MAX_GROUPS} groups is the limit`);
      setAddNote({ tone: r.added > 0 ? "ok" : "warn", text: parts.join(" · ") + (r.added > 0 ? ". First scan runs within a few hours." : ".") });
      if (r.added > 0 || r.invalid.length === 0) setPaste(r.invalid.join("\n"));
      await load(false);
    } finally {
      setAdding(false);
    }
  };

  const onToggleGroup = async (g: RadarGroup, enabled: boolean) => {
    setBusyGroup(g.id);
    try {
      setData((d) => d ? { ...d, groups: d.groups.map((x) => (x.id === g.id ? { ...x, enabled } : x)) } : d);
      const res = await setRadarGroup(g.id, enabled, null);
      if (res.error) await load(false);
    } finally {
      setBusyGroup(null);
    }
  };

  const onCityBlur = async (g: RadarGroup) => {
    const draft = cityDraft[g.id];
    if (draft === undefined || draft.trim() === (g.city ?? "")) return;
    setBusyGroup(g.id);
    try {
      await setRadarGroup(g.id, null, draft.trim());
      await load(false);
    } finally {
      setBusyGroup(null);
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
    setTradesDirty(true);
    setTradesNote(null);
  };

  const onSaveTrades = async () => {
    setSavingTrades(true);
    setTradesNote(null);
    try {
      await saveTrades(selected);
      setTradesDirty(false);
      setTradesNote(selected.length ? `Saved — you'll be texted about ${selected.length} ${selected.length === 1 ? "trade" : "trades"}.` : "Saved — you'll be texted about every homeowner request in your groups.");
      await load(false);
    } catch (e) {
      setTradesNote(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSavingTrades(false);
    }
  };

  const onPause = async (next: boolean) => {
    setPausing(true);
    try {
      const cats = data?.settings?.categories ?? (tradesDirty ? selected : null);
      const res = await setRadarSettings(cats && cats.length ? cats : null, next);
      if (!res.error) await load(false);
    } finally {
      setPausing(false);
    }
  };

  const copyComment = async (l: RadarLead) => {
    if (!l.comment) return;
    try {
      await navigator.clipboard.writeText(l.comment);
      setCopiedId(l.id);
      setTimeout(() => setCopiedId((c) => (c === l.id ? null : c)), 2000);
    } catch { /* no-op */ }
  };

  const markLead = async (l: RadarLead, status: "new" | "contacted" | "skipped") => {
    setBusyLead(l.id);
    try {
      setData((d) => d ? { ...d, leads: d.leads.map((x) => (x.id === l.id ? { ...x, status } : x)) } : d);
      const res = await setRadarLeadStatus(l.id, status);
      if (res.error) await load(false);
    } finally {
      setBusyLead(null);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <ContractorTopbar />
      <main className="mx-auto w-full max-w-[1180px] px-4 pb-16 pt-8 sm:px-6">
        {/* Page head */}
        <div className="mb-5 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-primary">Facebook groups</p>
            <h1 className="mt-1 flex items-center gap-3 text-4xl font-extrabold tracking-tight text-foreground">
              <Radar className="h-8 w-8 text-primary" />
              Lead Radar
            </h1>
            <p className="mt-2 max-w-2xl text-lg text-muted-foreground">
              Paste the public Facebook groups you&apos;re in. We watch them around the clock and text you the moment a homeowner
              asks for your kind of work — with a comment you can paste in seconds.
            </p>
          </div>
          {data && (
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${paused ? "bg-amber-50 text-amber-700" : activeGroups ? "bg-green-100 text-green-800" : "bg-muted text-muted-foreground"}`}>
                <span className={`h-2 w-2 rounded-full ${paused ? "bg-amber-500" : activeGroups ? "bg-green-500" : "bg-muted-foreground/50"}`} />
                {paused ? "Paused" : activeGroups ? `Watching ${activeGroups} ${activeGroups === 1 ? "group" : "groups"}` : "No groups yet"}
              </span>
              {groups.length > 0 && (
                <Button size="sm" variant="outline" className="gap-1.5 rounded-full font-semibold" onClick={() => onPause(!paused)} disabled={pausing}>
                  {pausing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                  {paused ? "Resume texts" : "Pause texts"}
                </Button>
              )}
            </div>
          )}
        </div>

        {loadError && (
          <div className="mb-4 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Couldn&apos;t load the radar ({loadError}). <button type="button" className="font-bold underline" onClick={() => void load(true)}>Try again</button></span>
          </div>
        )}

        {/* Where the texts go */}
        {data && (
          <div className={`mb-5 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl px-4 py-3 text-sm ring-1 ${phone ? "bg-card text-foreground ring-border" : "bg-amber-50 text-amber-900 ring-amber-200"}`}>
            <Phone className="h-4 w-4 shrink-0 text-primary" />
            {phone ? (
              <span>Lead texts go to <span className="font-mono font-semibold">{prettyPhone(phone)}</span> from the HomeBids bid line. They also land on this page.</span>
            ) : (
              <span>
                No phone on your profile yet — leads will show up here, but we can&apos;t text you.{" "}
                <Link href="/contractors/profile" className="font-bold underline">Add your mobile number</Link>
              </span>
            )}
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
          {/* LEFT: groups + trades + rules */}
          <div className="min-w-0 space-y-5">
            {/* Groups */}
            <section className={`${CARD} p-5 sm:p-6`} data-hb-radar-groups>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Label>Your groups</Label>
                  <p className="mt-1 text-xl font-extrabold text-foreground">
                    {groups.length} <span className="text-base font-semibold text-muted-foreground">/ {MAX_GROUPS}</span>
                  </p>
                </div>
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>

              <div className="mt-4">
                <Textarea
                  value={paste}
                  onChange={(e) => { setPaste(e.target.value); setAddNote(null); }}
                  placeholder={"Paste group links, one per line:\nhttps://www.facebook.com/groups/GilbertAZCommunity\nhttps://www.facebook.com/groups/1234567890"}
                  className="min-h-[112px] rounded-xl bg-card font-mono text-[13px] leading-6"
                  disabled={adding || room === 0}
                  aria-label="Facebook group links"
                />
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <Button className="h-11 gap-2 rounded-xl px-5 font-semibold" onClick={onAdd} disabled={adding || !pastedLinks.length || room === 0}>
                    {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    {adding ? "Adding…" : pastedLinks.length > 1 ? `Add ${pastedLinks.length} groups` : "Add group"}
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {room === 0 ? `You're at the ${MAX_GROUPS}-group limit — remove one to add another.` : `Room for ${room} more. Public groups only.`}
                  </span>
                </div>
                {addNote && (
                  <p className={`mt-2 text-sm ${addNote.tone === "ok" ? "text-green-700" : "text-amber-700"}`} data-hb-radar-addnote>{addNote.text}</p>
                )}
              </div>

              {loading ? (
                <p className="mt-5 text-sm text-muted-foreground">Loading…</p>
              ) : groups.length > 0 ? (
                <ul className="mt-5 divide-y divide-border border-t border-border" data-hb-radar-grouplist>
                  {groups.map((g) => {
                    const busy = busyGroup === g.id;
                    return (
                      <li key={g.id} className="py-3.5">
                        <div className="flex items-start gap-3">
                          <div className="min-w-0 flex-1">
                            <a href={g.url} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-1.5 truncate font-semibold hover:underline ${g.enabled ? "text-foreground" : "text-muted-foreground line-through"}`}>
                              <span className="truncate">{groupTitle(g)}</span>
                              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            </a>
                            <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">{g.url.replace(/^https?:\/\/(www\.)?/, "")}</p>
                            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                              {!g.enabled ? (
                                <span className="text-muted-foreground">Paused</span>
                              ) : g.last_error ? (
                                <span className="inline-flex items-center gap-1 text-amber-700"><AlertTriangle className="h-3.5 w-3.5" />{g.last_error}</span>
                              ) : g.last_scraped_at ? (
                                <span className="inline-flex items-center gap-1 text-muted-foreground"><Clock className="h-3.5 w-3.5" />Checked {timeAgo(g.last_scraped_at)}{g.last_post_count != null ? ` · ${g.last_post_count} new ${g.last_post_count === 1 ? "post" : "posts"}` : ""}</span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-muted-foreground"><Clock className="h-3.5 w-3.5" />First scan within a few hours</span>
                              )}
                              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                                City
                                <Input
                                  value={cityDraft[g.id] ?? g.city ?? ""}
                                  onChange={(e) => setCityDraft((d) => ({ ...d, [g.id]: e.target.value }))}
                                  onBlur={() => void onCityBlur(g)}
                                  onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                                  placeholder="e.g. Gilbert"
                                  className="h-7 w-28 rounded-lg px-2 text-xs"
                                  aria-label={`Default city for ${groupTitle(g)}`}
                                />
                              </span>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            {busy && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                            <Switch checked={g.enabled} onCheckedChange={(v) => void onToggleGroup(g, v)} disabled={busy} aria-label={g.enabled ? "Pause this group" : "Watch this group"} />
                            <button type="button" onClick={() => void onRemove(g)} disabled={busy} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive" aria-label="Remove group">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mt-5 rounded-xl bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                  No groups yet. Open a group on Facebook, copy the link from the address bar and paste it above — up to {MAX_GROUPS}. Local
                  community, neighborhood and &quot;recommendations&quot; groups work best.
                </p>
              )}
            </section>

            {/* Trades */}
            <section className={`${CARD} p-5 sm:p-6`} data-hb-radar-trades>
              <Label>Text me about</Label>
              <p className="mt-1 text-sm text-muted-foreground">
                Pick your trades. Leave everything off to get every homeowner request in your groups.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => { setSelected([]); setTradesDirty(true); setTradesNote(null); }}
                  className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${selected.length === 0 ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:bg-muted"}`}
                >
                  All trades
                </button>
                {TRADES.map((t) => {
                  const on = selected.includes(t.key);
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => toggleTrade(t.key)}
                      aria-pressed={on}
                      className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${on ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-foreground hover:bg-muted"}`}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <Button size="sm" className="rounded-full px-4 font-semibold" onClick={onSaveTrades} disabled={savingTrades || !tradesDirty}>
                  {savingTrades ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  {tradesDirty ? "Save trades" : "Saved"}
                </Button>
                {tradesNote && <span className="text-sm text-muted-foreground">{tradesNote}</span>}
                {!tradesNote && tradesDirty && !data?.settings && selected.length > 0 && (
                  <span className="text-sm text-muted-foreground">Pre-filled from your profile — saves with your first groups.</span>
                )}
              </div>
            </section>

            {/* How it works / rules */}
            <section className={`${CARD} p-5 sm:p-6`}>
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div className="text-sm text-foreground">
                  <p className="font-bold">How it works — and what keeps you safe in the groups</p>
                  <ul className="mt-2 list-disc space-y-1.5 pl-5 text-muted-foreground">
                    <li>We read <span className="font-semibold text-foreground">public</span> groups only, every few hours. Private groups can&apos;t be read from outside — they stay at &quot;0 new posts&quot; here.</li>
                    <li>You get a text with the post link and a suggested comment. Open the post and paste the comment <span className="font-semibold text-foreground">yourself, from your own account</span>. We never post or message anyone for you, so you stay inside each group&apos;s rules.</li>
                    <li>Lead with help, not a pitch. Many groups ban advertising — a friendly, specific reply gets the DM; a link drop gets removed.</li>
                    <li>One text per matching post, max five per scan. Pause any time.</li>
                  </ul>
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT: leads */}
          <section className={`${CARD} min-w-0 p-5 sm:p-6`} data-hb-radar-leads>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <Label>Leads</Label>
                <p className="mt-1 text-xl font-extrabold text-foreground">
                  {counts.new} <span className="text-base font-semibold text-muted-foreground">new</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => void load(false)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Refresh">
                  <RefreshCw className="h-4 w-4" />
                </button>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as LeadFilter)}
                  className="h-10 rounded-xl border border-border bg-card px-3 pr-8 text-sm font-medium text-foreground outline-none focus:border-primary/50"
                  aria-label="Filter leads"
                >
                  <option value="new">New ({counts.new})</option>
                  <option value="contacted">Commented ({counts.contacted})</option>
                  <option value="skipped">Skipped ({counts.skipped})</option>
                  <option value="all">All ({counts.all})</option>
                </select>
              </div>
            </div>

            {loading ? (
              <p className="px-2 py-16 text-center text-sm text-muted-foreground">Loading leads…</p>
            ) : shownLeads.length === 0 ? (
              <div className="px-2 py-14 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <Inbox className="h-7 w-7 text-primary" />
                </div>
                <p className="font-semibold text-foreground">{leads.length === 0 ? "No leads yet." : "Nothing in this view."}</p>
                <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                  {leads.length === 0
                    ? groups.length
                      ? "As soon as a homeowner in one of your groups asks for your trade, it shows up here and on your phone."
                      : "Add your first groups on the left — leads from them land here and on your phone."
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
                  return (
                    <li key={l.id} id={`radar-lead-${l.id}`} className={`rounded-2xl border p-4 ${l.status === "new" ? "border-primary/30 bg-primary/[0.03]" : "border-border bg-card"}`}>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">{p.group_name || (p.group_url ? p.group_url.replace(/^https?:\/\/(www\.)?facebook\.com\/groups\//i, "") : "Facebook group")}</span>
                        <span>·</span>
                        <span>{timeAgo(p.posted_at || l.created_at)}</span>
                        {trade && <span className="rounded-full bg-primary/10 px-2 py-0.5 font-bold text-primary">{trade}</span>}
                        {urgency && <span className={`rounded-full px-2 py-0.5 font-bold ${p.urgency === "asap" ? "bg-red-50 text-red-700" : "bg-muted text-muted-foreground"}`}>{urgency}</span>}
                        {p.city && <span>{p.city}</span>}
                        {l.status !== "new" && <span className="rounded-full bg-muted px-2 py-0.5 font-bold">{l.status === "contacted" ? "Commented" : "Skipped"}</span>}
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">
                        {p.author ? <span className="font-semibold">{p.author}: </span> : null}
                        {p.text || "(no text — open the post)"}
                      </p>

                      {l.comment && (
                        <div className="mt-3 rounded-xl bg-muted/50 p-3 ring-1 ring-border">
                          <div className="flex items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-[0.06em] text-muted-foreground">
                              <MessageSquareText className="h-3.5 w-3.5" /> Comment to paste
                            </span>
                            <Button size="sm" variant="outline" className="h-8 gap-1.5 rounded-full px-3 text-xs font-semibold" onClick={() => void copyComment(l)}>
                              {copiedId === l.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                              {copiedId === l.id ? "Copied" : "Copy"}
                            </Button>
                          </div>
                          <p className="mt-1.5 whitespace-pre-wrap text-sm text-foreground">{l.comment}</p>
                        </div>
                      )}

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {p.url && (
                          <Button asChild size="sm" className="h-9 gap-1.5 rounded-full px-4 font-semibold">
                            <a href={p.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3.5 w-3.5" />
                              Open post
                            </a>
                          </Button>
                        )}
                        {l.status !== "contacted" ? (
                          <Button size="sm" variant="outline" className="h-9 gap-1.5 rounded-full px-4 font-semibold" onClick={() => void markLead(l, "contacted")} disabled={busy}>
                            <Check className="h-3.5 w-3.5" />
                            I commented
                          </Button>
                        ) : (
                          <Button size="sm" variant="ghost" className="h-9 rounded-full px-3 font-semibold text-muted-foreground" onClick={() => void markLead(l, "new")} disabled={busy}>
                            Undo
                          </Button>
                        )}
                        {l.status === "new" && (
                          <Button size="sm" variant="ghost" className="h-9 rounded-full px-3 font-semibold text-muted-foreground" onClick={() => void markLead(l, "skipped")} disabled={busy}>
                            Skip
                          </Button>
                        )}
                        {busy && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

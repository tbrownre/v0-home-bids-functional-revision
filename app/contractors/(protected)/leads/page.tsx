"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Search, MessageSquareText, ExternalLink, Inbox, Copy, Check, Globe,
  ChevronDown, ChevronUp, Phone, Clock, MapPin, User, Camera, ScrollText, Mail,
} from "lucide-react";
import { ContractorTopbar } from "@/components/contractor/contractor-topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getMockUser, syncMirrorFromSupabase } from "@/lib/mock-auth";
import { getMyPageLeads, type PageLead } from "@/lib/supabase/page-leads";
import { getContractorProfile } from "@/lib/supabase/actions";
import { formatPrice } from "@/lib/proposal-format";
import { getSmsHref, CONTRACTOR_SMS_PHONE_NUMBER } from "@/lib/sms-config";
import { LandingPageDemoLink } from "@/components/landing-page-demo-link";
import { leadLabel, serviceLabel } from "@/lib/page-lead-label";

/**
 * /contractors/leads — every lead that came through this contractor's own
 * /pro page (Tim, Sep 29: "Should we just add 'Leads' up here? Store them all
 * there.. easy filter"). Same data as the dashboard card, unbounded, with
 * search + status filter.
 *
 * Oct 5 (Tim): the row reads "Tim's Landscaping Project" (first name + service
 * type; location has its own column) and is clickable — it opens everything we
 * collected during the intake: scope, timeframe, budget, photos, the homeowner's
 * name/phone/email and what they told Ava.
 */

const CARD = "rounded-[22px] border border-border bg-card shadow-[0_10px_30px_rgba(16,17,20,0.06)]";
const GRID = "grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_120px_170px_150px]";

type Filter = "all" | "new" | "bid" | "accepted";

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
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: d.getFullYear() === today.getFullYear() ? undefined : "numeric" });
}

function fullWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function statusOf(l: PageLead): { label: string; className: string; key: Filter } {
  if (!l.bid) return { label: "New lead", className: "bg-amber-50 text-amber-700", key: "new" };
  switch (l.bid.status) {
    case "accepted":
      return { label: "Accepted", className: "bg-green-100 text-green-800", key: "accepted" };
    case "approval_clicked":
      return { label: "Approval clicked", className: "bg-emerald-50 text-emerald-700", key: "bid" };
    case "question_asked":
      return { label: "Question asked", className: "bg-amber-50 text-amber-700", key: "bid" };
    case "changes_requested":
      return { label: "Changes requested", className: "bg-orange-50 text-orange-700", key: "bid" };
    case "viewed":
      return { label: "Bid viewed", className: "bg-sky-50 text-sky-700", key: "bid" };
    case "draft":
      return { label: "Bid drafted", className: "bg-muted text-muted-foreground", key: "bid" };
    default:
      return { label: "Bid sent", className: "bg-blue-50 text-blue-700", key: "bid" };
  }
}

const URGENCY_LABEL: Record<string, string> = {
  asap: "ASAP",
  within_week: "Within a week",
  within_month: "Within a month",
  flexible: "Flexible",
};

function prettyPhone(e164: string): string {
  const d = e164.replace(/\D/g, "");
  const n = d.length === 11 && d.startsWith("1") ? d.slice(1) : d;
  return n.length === 10 ? `(${n.slice(0, 3)}) ${n.slice(3, 6)}-${n.slice(6)}` : e164;
}

function budgetLabel(min: number | null, max: number | null): string | null {
  if (min == null && max == null) return null;
  if (min != null && max != null) return `${formatPrice(min)} – ${formatPrice(max)}`;
  return formatPrice((min ?? max) as number);
}

function rowTitle(l: PageLead): string {
  return leadLabel({ homeownerName: l.homeowner.name, category: l.category });
}

/** The action for a lead: bid on it (new) or open the bid we already sent. */
function LeadAction({ lead }: { lead: PageLead }) {
  return lead.bid ? (
    <Button asChild size="sm" variant="outline" className="gap-1.5 rounded-full font-semibold">
      <a href={`/p/${lead.bid.share_token}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
        <ExternalLink className="h-3.5 w-3.5" />
        View bid
      </a>
    </Button>
  ) : (
    <Button asChild size="sm" className="gap-1.5 rounded-full font-semibold">
      <a
        href={getSmsHref(CONTRACTOR_SMS_PHONE_NUMBER, lead.job_ref ? `bid ${lead.job_ref}` : "I want to build a new bid")}
        onClick={(e) => e.stopPropagation()}
      >
        <MessageSquareText className="h-3.5 w-3.5" />
        Bid on this
      </a>
    </Button>
  );
}

/**
 * Everything we collected during the intake, in one panel (Tim, Oct 5: "we want the contractor to
 * open up the job details/scope, time frame/pics and all contact info we collected").
 */
function LeadDetails({ lead }: { lead: PageLead }) {
  const where = [lead.location, lead.zip_code].filter(Boolean).join(" ");
  const budget = budgetLabel(lead.budget_min, lead.budget_max);
  const ho = lead.homeowner;
  const first = (ho.name || "").trim().split(/\s+/)[0] || "";
  const smsBody = `Hi${first ? " " + first : ""}, this is about your ${serviceLabel(lead.category).toLowerCase()} project${lead.job_ref ? ` (${lead.job_ref})` : ""}.`;
  const Label = ({ children }: { children: React.ReactNode }) => (
    <p className="text-xs font-extrabold uppercase tracking-[0.06em] text-muted-foreground">{children}</p>
  );
  return (
    <div className="rounded-2xl border border-border bg-muted/30 p-4 text-sm sm:p-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        {/* Left: the job */}
        <div className="min-w-0 space-y-4">
          <div className="flex items-start gap-2.5">
            <ScrollText className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <Label>Scope</Label>
              <p className="mt-0.5 whitespace-pre-wrap text-foreground">{lead.description || "No description captured yet."}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {serviceLabel(lead.category)}
                {lead.job_ref ? ` · ${lead.job_ref}` : ""} · received {fullWhen(lead.created_at)}
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-start gap-2.5">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <Label>Timeframe</Label>
                <p className="mt-0.5 text-foreground">{(lead.urgency && URGENCY_LABEL[lead.urgency]) || lead.urgency || "Not stated"}</p>
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

          <div className="flex items-start gap-2.5">
            <Camera className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <Label>Photos{lead.images.length ? ` (${lead.images.length})` : ""}</Label>
              {lead.images.length ? (
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {lead.images.map((src, i) => (
                    <a key={src + i} href={src} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl border border-border bg-card">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`Project photo ${i + 1}`} loading="lazy" className="h-24 w-24 object-cover sm:h-28 sm:w-28" />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="mt-0.5 text-muted-foreground">No photos sent.</p>
              )}
            </div>
          </div>

          {lead.intake_notes.length > 0 && (
            <div className="flex items-start gap-2.5">
              <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <Label>What they told us</Label>
                <ul className="mt-1.5 space-y-1.5">
                  {lead.intake_notes.map((n, i) => (
                    <li key={i} className="rounded-xl bg-card px-3 py-2 text-foreground ring-1 ring-border">{n}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Right: the homeowner */}
        <div className="h-fit rounded-2xl bg-card p-4 ring-1 ring-border">
          <div className="flex items-start gap-2.5">
            <User className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <Label>Homeowner</Label>
              <p className="mt-0.5 text-base font-bold text-foreground">{ho.name || "Name not given"}</p>
              {ho.phone ? (
                <p className="mt-1 font-mono text-sm text-foreground">{prettyPhone(ho.phone)}</p>
              ) : (
                <p className="mt-1 text-muted-foreground">No phone on file.</p>
              )}
              {ho.email && (
                <a href={`mailto:${ho.email}`} className="mt-1 flex items-center gap-1.5 truncate text-primary hover:underline">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  {ho.email}
                </a>
              )}
              {ho.phone && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button asChild size="sm" className="h-9 gap-1.5 rounded-full px-4 font-semibold">
                    <a href={`tel:${ho.phone}`}>
                      <Phone className="h-3.5 w-3.5" />
                      Call
                    </a>
                  </Button>
                  <Button asChild size="sm" variant="outline" className="h-9 gap-1.5 rounded-full px-4 font-semibold">
                    <a href={getSmsHref(ho.phone, smsBody)}>
                      <MessageSquareText className="h-3.5 w-3.5" />
                      Text
                    </a>
                  </Button>
                </div>
              )}
              <p className="mt-3 text-xs text-muted-foreground">
                This lead came from your website — it is yours alone, no other pros were contacted.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ContractorLeadsPage() {
  const [leads, setLeads] = useState<PageLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [pageUrl, setPageUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  // Auth guard (same pattern as the dashboard / bids pages).
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (typeof window !== "undefined" && window.location.hostname.includes("vusercontent.net")) {
          setLoading(false);
          return;
        }
        const [res, prof] = await Promise.all([
          getMyPageLeads(500),
          getContractorProfile().catch(() => ({ profile: null })),
        ]);
        if (cancelled) return;
        const list = res.leads ?? [];
        setLeads(list);
        const url = String((prof as { profile?: { landing_page_url?: string | null } | null })?.profile?.landing_page_url ?? "").trim();
        setPageUrl(url);
        // Dashboard card links here with ?open=<lead id> — open that lead's details on arrival.
        const wanted = new URLSearchParams(window.location.search).get("open");
        if (wanted && list.some((l) => l.id === wanted)) {
          setOpenId(wanted);
          setTimeout(() => {
            // mobile and desktop lists both render (one is display:none) — scroll the visible one
            const el = [document.getElementById(`lead-${wanted}`), document.getElementById(`lead-m-${wanted}`)]
              .find((n) => n && n.offsetParent !== null);
            el?.scrollIntoView({ block: "start", behavior: "smooth" });
          }, 50);
        }
      } catch (e) {
        console.error("[Leads] Failed to load:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return leads.filter((l) => {
      if (filter !== "all" && statusOf(l).key !== filter) return false;
      if (!q) return true;
      return [rowTitle(l), l.title, l.category, l.location, l.zip_code, l.job_ref, l.homeowner.name, l.description]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [leads, query, filter]);

  const counts = useMemo(() => {
    const c = { all: leads.length, new: 0, bid: 0, accepted: 0 };
    for (const l of leads) c[statusOf(l).key] += 1;
    return c;
  }, [leads]);

  const copyPage = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* no-op */ }
  };

  const toggle = (id: string) => setOpenId((cur) => (cur === id ? null : id));

  return (
    <div className="min-h-screen bg-muted/30">
      <ContractorTopbar />
      <main className="mx-auto w-full max-w-[1180px] px-4 pb-16 pt-8 sm:px-6">
        {/* Page head */}
        <div className="mb-5 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-primary">Your page</p>
            <h1 className="mt-1 text-4xl font-extrabold tracking-tight text-foreground">Leads</h1>
            <p className="mt-2 text-lg text-muted-foreground">
              Homeowners who texted from your website. Each one is yours alone — no other pros.
            </p>
          </div>
          {pageUrl ? (
            <div className="flex max-w-full flex-wrap items-center gap-2">
              <span className="max-w-[260px] truncate rounded-lg bg-card px-3 py-2 font-mono text-xs text-foreground shadow-sm ring-1 ring-border">
                {pageUrl.replace(/^https?:\/\//, "")}
              </span>
              <Button size="sm" variant="outline" className="gap-1.5 rounded-full font-semibold" onClick={copyPage}>
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy link"}
              </Button>
            </div>
          ) : (
            <Button asChild variant="outline" className="h-12 gap-2 rounded-xl px-5 font-semibold">
              <Link href="/contractors/profile">
                <Globe className="h-[18px] w-[18px]" />
                Set up my page
              </Link>
            </Button>
          )}
        </div>

        {/* Toolbar */}
        <div className="mb-4 flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[240px] flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, project, city, zip or ref"
              className="h-12 rounded-xl pl-10"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as Filter)}
            className="h-12 rounded-xl border border-border bg-card px-3 pr-8 text-sm font-medium text-foreground outline-none focus:border-primary/50"
            aria-label="Filter leads"
          >
            <option value="all">All leads ({counts.all})</option>
            <option value="new">New — no bid yet ({counts.new})</option>
            <option value="bid">Bid sent ({counts.bid})</option>
            <option value="accepted">Accepted ({counts.accepted})</option>
          </select>
        </div>

        {/* List */}
        <section className={`${CARD} min-w-0 p-3 sm:px-5 sm:py-2`}>
          {loading ? (
            <p className="px-2 py-16 text-center text-sm text-muted-foreground">Loading leads…</p>
          ) : filtered.length === 0 ? (
            <div className="px-2 py-16 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Inbox className="h-7 w-7 text-primary" />
              </div>
              <p className="font-semibold text-foreground">
                {leads.length === 0 ? "No leads from your page yet." : "No leads match your search."}
              </p>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                {leads.length === 0
                  ? pageUrl
                    ? "Put your page link in your bio, your truck and your cards — every homeowner who texts from it lands here with a one-tap bid."
                    : "Publish your website first — homeowners who text from it land here, yours alone."
                  : "Try a different search or filter."}
              </p>
              {leads.length === 0 && !pageUrl && (
                <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
                  <Link href="/contractors/profile" className="text-sm font-bold text-primary hover:underline">Set up my page →</Link>
                  <LandingPageDemoLink />
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Mobile */}
              <div className="md:hidden">
                {filtered.map((l) => {
                  const st = statusOf(l);
                  const where = [l.location, l.zip_code].filter(Boolean).join(" ");
                  const open = openId === l.id;
                  return (
                    <div key={l.id} id={`lead-m-${l.id}`} className="border-t border-border px-1 py-4 first:border-t-0">
                      <button
                        type="button"
                        onClick={() => toggle(l.id)}
                        aria-expanded={open}
                        className="flex w-full items-start justify-between gap-3 text-left"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-foreground">{rowTitle(l)}</p>
                          <p className="mt-0.5 truncate text-sm text-muted-foreground">
                            {[where, whenLabel(l.created_at), l.job_ref].filter(Boolean).join(" · ")}
                          </p>
                        </div>
                        <span className={`inline-block shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${st.className}`}>
                          {st.label}
                          {l.bid?.total_price != null ? ` · ${formatPrice(l.bid.total_price)}` : ""}
                        </span>
                      </button>
                      <div className="mt-2.5 flex flex-wrap items-center gap-2">
                        <LeadAction lead={l} />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-1 rounded-full font-semibold text-primary"
                          onClick={() => toggle(l.id)}
                          aria-expanded={open}
                        >
                          {open ? "Hide details" : "Details"}
                          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </div>
                      {open && <div className="mt-3"><LeadDetails lead={l} /></div>}
                    </div>
                  );
                })}
              </div>

              {/* Desktop */}
              <div className="hidden md:block">
                <div className={`grid ${GRID} gap-3 px-1 py-3 text-xs font-extrabold uppercase tracking-[0.06em] text-muted-foreground`}>
                  <div>Project</div>
                  <div>Where</div>
                  <div>Received</div>
                  <div>Status</div>
                  <div />
                </div>
                {filtered.map((l) => {
                  const st = statusOf(l);
                  const where = [l.location, l.zip_code].filter(Boolean).join(" ");
                  const open = openId === l.id;
                  return (
                    <div key={l.id} id={`lead-${l.id}`} className="border-t border-border">
                      <div
                        role="button"
                        tabIndex={0}
                        aria-expanded={open}
                        onClick={() => toggle(l.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            toggle(l.id);
                          }
                        }}
                        className={`grid ${GRID} cursor-pointer items-center gap-3 rounded-xl px-1 py-4 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40`}
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-primary">{rowTitle(l)}</p>
                            <p className="mt-0.5 truncate text-sm text-muted-foreground">{l.job_ref || "—"}</p>
                          </div>
                          {open ? (
                            <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                          )}
                        </div>
                        <div className="truncate text-sm text-foreground">{where || "—"}</div>
                        <div className="text-sm text-muted-foreground">{whenLabel(l.created_at)}</div>
                        <div>
                          <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold ${st.className}`}>
                            {st.label}
                            {l.bid?.total_price != null ? ` · ${formatPrice(l.bid.total_price)}` : ""}
                          </span>
                        </div>
                        <div className="flex justify-end">
                          <LeadAction lead={l} />
                        </div>
                      </div>
                      {open && <div className="px-1 pb-5"><LeadDetails lead={l} /></div>}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

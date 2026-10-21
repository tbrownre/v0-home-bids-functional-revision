"use client";

// ADMIN COMMAND CENTER (Tim, Oct 20: "a dashboard for me to manage everything in... see who is entering the
// system and what jobs are being created"). One RPC (admin_dashboard) feeds everything; same admin guard as
// /admin/links (profile.is_admin) on the client, and the RPC itself refuses non-admins server-side.

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Loader2, RefreshCw, Search } from "lucide-react";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

// ── Types ─────────────────────────────────────────────────────────────────────

type KpiRow = {
  homeowners: number;
  contractors: number;
  jobs: number;
  bids: number;
  approvals: number;
  new_phones: number;
  inbound_texts: number;
};

type Activity = {
  at: string;
  kind: "job" | "bid" | "approved" | "reopened" | "expired" | "homeowner" | "contractor" | "first_text" | string;
  title: string;
  detail: string | null;
  ref: string | null;
  link: string | null;
};

type JobRow = {
  job_ref: string;
  title: string | null;
  category: string | null;
  location: string | null;
  status: string | null;
  created_at: string;
  source: string;
  homeowner: string;
  homeowner_phone: string | null;
  bids: number;
  hired: boolean;
  job_link: string | null;
  owner_link: string | null;
};

type HomeownerRow = {
  name: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
  jobs: number;
  last_text_at: string | null;
  source: string;
};

type ContractorRow = {
  name: string | null;
  company: string | null;
  phone: string | null;
  email: string | null;
  created_at: string | null;
  approval_status: string;
  service_area: string | null;
  bids: number;
  approved: number;
  kind: "account" | "text";
};

type TextRow = {
  at: string;
  phone: string;
  line: "Ava" | "Bid Builder";
  excerpt: string;
  is_first: boolean;
};

type Dashboard = {
  generated_at: string;
  days: number;
  kpis: Record<"today" | "d7" | "d30" | "all", KpiRow>;
  activity: Activity[];
  jobs: JobRow[];
  homeowners: HomeownerRow[];
  contractors: ContractorRow[];
  texts: TextRow[];
};

type Tab = "feed" | "jobs" | "homeowners" | "contractors" | "texts";

// ── Helpers ───────────────────────────────────────────────────────────────────

const PHX = "America/Phoenix";

function when(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  return new Intl.DateTimeFormat("en-US", { timeZone: PHX, month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(d);
}

function ago(value: string | null | undefined) {
  if (!value) return "";
  const diff = Date.now() - new Date(value).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

function prettyPhone(value: string | null | undefined) {
  const d = String(value ?? "").replace(/\D/g, "").slice(-10);
  if (d.length !== 10) return value ?? "";
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

function statusClass(status: string | null) {
  if (status === "open") return "bg-green-50 text-green-700";
  if (status === "completed") return "bg-blue-50 text-blue-700";
  if (status === "in_progress") return "bg-amber-50 text-amber-700";
  return "bg-muted text-muted-foreground";
}

function statusLabel(status: string | null, hired: boolean) {
  if (hired) return "Pro hired";
  if (!status) return "—";
  if (status === "open") return "Active";
  const spaced = status.replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

const KIND_META: Record<string, { label: string; cls: string }> = {
  job: { label: "New job", cls: "bg-green-50 text-green-700" },
  bid: { label: "Bid", cls: "bg-blue-50 text-blue-700" },
  approved: { label: "Approved", cls: "bg-emerald-50 text-emerald-700" },
  reopened: { label: "Reopened", cls: "bg-amber-50 text-amber-700" },
  expired: { label: "Expired", cls: "bg-orange-50 text-orange-700" },
  homeowner: { label: "Homeowner", cls: "bg-purple-50 text-purple-700" },
  contractor: { label: "Contractor", cls: "bg-indigo-50 text-indigo-700" },
  first_text: { label: "New number", cls: "bg-pink-50 text-pink-700" },
};

function Badge({ text, cls }: { text: string; cls: string }) {
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}`}>{text}</span>;
}

function Metric({ label, row, compact }: { label: string; row: Partial<KpiRow> | undefined; compact?: boolean }) {
  const cells: Array<[string, number | undefined]> = [
    ["Jobs", row?.jobs],
    ["Bids", row?.bids],
    ["Approved", row?.approvals],
    ["Homeowners", row?.homeowners],
    ["Contractors", row?.contractors],
    ["New numbers", row?.new_phones],
    ["Texts in", row?.inbound_texts],
  ];
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</div>
      {/* compact = the three side-by-side tiles: 4 per row so "Homeowners"/"Contractors" never collide (Oct 22) */}
      <div className={`mt-3 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4 ${compact ? "" : "lg:grid-cols-7"}`}>
        {cells.map(([k, v]) => (
          <div key={k} className="min-w-0">
            <div className="text-2xl font-bold leading-none text-foreground">{v ?? 0}</div>
            <div className="mt-1 truncate text-[11px] leading-tight text-muted-foreground">{k}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminHomePage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Dashboard | null>(null);
  const [days, setDays] = useState(30);
  const [tab, setTab] = useState<Tab>("feed");
  const [query, setQuery] = useState("");

  // Same guard as /admin/links and /admin/outreach
  useEffect(() => {
    async function checkAdmin() {
      try {
        const { getUserProfile } = await import("@/lib/supabase/actions");
        const { profile } = await getUserProfile();
        if (!profile) {
          router.push("/auth/sign-in");
          return;
        }
        if (profile.is_admin !== true) {
          router.push("/");
          return;
        }
        setIsAuthorized(true);
      } catch (e) {
        console.error("[AdminHome] Auth check failed:", e);
        router.push("/");
      }
    }
    checkAdmin();
  }, [router]);

  async function load(period: number) {
    const { data: result, error: rpcError } = await createClient().rpc("admin_dashboard", { p_days: period });
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    setError(null);
    setData(result as Dashboard);
  }

  useEffect(() => {
    if (!isAuthorized) return;
    setLoading(true);
    load(days).finally(() => setLoading(false));
  }, [isAuthorized, days]);

  // Keep it live while Tim has it open
  useEffect(() => {
    if (!isAuthorized) return;
    const id = window.setInterval(() => { void load(days); }, 60000);
    return () => window.clearInterval(id);
  }, [isAuthorized, days]);

  async function handleRefresh() {
    setRefreshing(true);
    await load(days);
    setRefreshing(false);
  }

  const q = query.trim().toLowerCase();
  const match = (...parts: Array<string | null | undefined | number>) =>
    !q || parts.some((p) => String(p ?? "").toLowerCase().includes(q));

  const feed = useMemo(() => (data?.activity ?? []).filter((a) => match(a.title, a.detail, a.ref, a.kind)), [data, q]);
  const jobs = useMemo(() => (data?.jobs ?? []).filter((j) => match(j.job_ref, j.title, j.location, j.category, j.homeowner, j.homeowner_phone, j.status)), [data, q]);
  const homeowners = useMemo(() => (data?.homeowners ?? []).filter((h) => match(h.name, h.phone, h.email)), [data, q]);
  const contractors = useMemo(() => (data?.contractors ?? []).filter((c) => match(c.name, c.company, c.phone, c.email, c.service_area)), [data, q]);
  const texts = useMemo(() => (data?.texts ?? []).filter((t) => match(t.phone, t.excerpt, t.line)), [data, q]);

  if (loading && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const tabs: Array<[Tab, string, number]> = [
    ["feed", "Live feed", feed.length],
    ["jobs", "Jobs", jobs.length],
    ["homeowners", "Homeowners", homeowners.length],
    ["contractors", "Contractors", contractors.length],
    ["texts", "Texts in", texts.length],
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header isSignedIn />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {/* Page header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Admin</span>
            <h1 className="mt-1 text-2xl font-bold text-foreground">Command Center</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Who is entering the system and what jobs are being created. Times are Phoenix. Updates every minute.
              {data?.generated_at ? ` Last update ${ago(data.generated_at)}.` : ""}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a href="/admin/links" className="text-sm font-semibold text-primary underline-offset-4 hover:underline">Job links</a>
            <span className="text-muted-foreground">·</span>
            <a href="/admin/outreach" className="text-sm font-semibold text-primary underline-offset-4 hover:underline">Outreach</a>
            <span className="text-muted-foreground">·</span>
            <a href="/inbox" className="text-sm font-semibold text-primary underline-offset-4 hover:underline">Inbox</a>
            <Button variant="outline" size="sm" className="ml-2 gap-2 rounded-full" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Could not load the dashboard: {error}
          </div>
        )}

        {/* KPIs */}
        <div className="mb-8 grid gap-3">
          <Metric label="Today" row={data?.kpis?.today} />
          <div className="grid gap-3 lg:grid-cols-3">
            <Metric label="Last 7 days" row={data?.kpis?.d7} compact />
            <Metric label="Last 30 days" row={data?.kpis?.d30} compact />
            <Metric label="All time" row={data?.kpis?.all} compact />
          </div>
        </div>

        {/* Controls */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {tabs.map(([key, label, count]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${tab === key ? "border-primary bg-primary text-primary-foreground" : "bg-card text-foreground hover:bg-muted"}`}
              >
                {label} <span className={`ml-1 text-xs ${tab === key ? "opacity-80" : "text-muted-foreground"}`}>{count}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, phone, job ref…" className="rounded-full pl-9" />
            </div>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="h-10 rounded-full border bg-card px-3 text-sm font-semibold text-foreground"
              aria-label="Period"
            >
              <option value={7}>7 days</option>
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
              <option value={365}>1 year</option>
            </select>
          </div>
        </div>

        {/* Live feed */}
        {tab === "feed" && (
          <div className="rounded-2xl border bg-card">
            {feed.length === 0 && <div className="p-6 text-sm text-muted-foreground">Nothing in this period.</div>}
            <ul className="divide-y">
              {feed.map((a, i) => {
                const meta = KIND_META[a.kind] ?? { label: a.kind, cls: "bg-muted text-muted-foreground" };
                return (
                  <li key={`${a.at}-${i}`} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-start sm:gap-4">
                    <div className="w-36 shrink-0 text-xs text-muted-foreground">
                      <div>{when(a.at)}</div>
                      <div>{ago(a.at)}</div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge text={meta.label} cls={meta.cls} />
                        <span className="font-semibold text-foreground">{a.title}</span>
                        {a.link && (
                          <a href={a.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                            open <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      {a.detail && <div className="mt-0.5 text-sm text-muted-foreground">{a.detail}</div>}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Jobs */}
        {tab === "jobs" && (
          <div className="overflow-x-auto rounded-2xl border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Job</th>
                  <th className="px-4 py-3">Where</th>
                  <th className="px-4 py-3">Homeowner</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Bids</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Links</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {jobs.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-6 text-muted-foreground">No jobs in this period.</td></tr>
                )}
                {jobs.map((j) => (
                  <tr key={j.job_ref} className="align-top">
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{when(j.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground">{j.job_ref}</div>
                      <div className="text-muted-foreground">{j.title ?? "—"}{j.category ? ` · ${j.category}` : ""}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{j.location ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div className="text-foreground">{j.homeowner || "—"}</div>
                      <div className="text-muted-foreground">{prettyPhone(j.homeowner_phone)}</div>
                    </td>
                    <td className="px-4 py-3"><Badge text={statusLabel(j.status, j.hired)} cls={j.hired ? "bg-emerald-50 text-emerald-700" : statusClass(j.status)} /></td>
                    <td className="px-4 py-3 text-right font-semibold text-foreground">{j.bids}</td>
                    <td className="px-4 py-3 text-muted-foreground">{j.source}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {j.job_link && <a className="mr-3 text-xs font-semibold text-primary" href={j.job_link} target="_blank" rel="noopener noreferrer">Job page</a>}
                      {j.owner_link && <a className="text-xs font-semibold text-primary" href={j.owner_link} target="_blank" rel="noopener noreferrer">Homeowner page</a>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Homeowners */}
        {tab === "homeowners" && (
          <div className="overflow-x-auto rounded-2xl border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3 text-right">Jobs</th>
                  <th className="px-4 py-3">Last text</th>
                  <th className="px-4 py-3">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {homeowners.map((h, i) => (
                  <tr key={`${h.phone ?? h.email ?? "h"}-${i}`}>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{when(h.created_at)}</td>
                    <td className="px-4 py-3 font-semibold text-foreground">{h.name || "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3">{prettyPhone(h.phone) || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{h.email || "—"}</td>
                    <td className="px-4 py-3 text-right font-semibold">{h.jobs}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{h.last_text_at ? `${when(h.last_text_at)} · ${ago(h.last_text_at)}` : "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{h.source || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Contractors */}
        {tab === "contractors" && (
          <div className="overflow-x-auto rounded-2xl border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Since</th>
                  <th className="px-4 py-3">Company / name</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3 text-right">Bids</th>
                  <th className="px-4 py-3 text-right">Hired</th>
                  <th className="px-4 py-3">Area</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {contractors.map((c, i) => (
                  <tr key={`${c.phone ?? c.email ?? "c"}-${i}`}>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{when(c.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground">{c.company || c.name || "—"}</div>
                      {c.company && c.name && <div className="text-muted-foreground">{c.name}</div>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{prettyPhone(c.phone) || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.email || "—"}</td>
                    <td className="px-4 py-3">
                      <Badge text={c.kind === "account" ? (c.approval_status ? `Account · ${c.approval_status}` : "Account") : "Text only"} cls={c.kind === "account" ? "bg-indigo-50 text-indigo-700" : "bg-muted text-muted-foreground"} />
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">{c.bids}</td>
                    <td className="px-4 py-3 text-right font-semibold">{c.approved}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.service_area || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Texts in */}
        {tab === "texts" && (
          <div className="rounded-2xl border bg-card">
            {texts.length === 0 && <div className="p-6 text-sm text-muted-foreground">No inbound texts in this period.</div>}
            <ul className="divide-y">
              {texts.map((t, i) => (
                <li key={`${t.at}-${i}`} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-start sm:gap-4">
                  <div className="w-36 shrink-0 text-xs text-muted-foreground">
                    <div>{when(t.at)}</div>
                    <div>{ago(t.at)}</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge text={t.line} cls={t.line === "Ava" ? "bg-purple-50 text-purple-700" : "bg-blue-50 text-blue-700"} />
                      <span className="font-semibold text-foreground">{prettyPhone(t.phone)}</span>
                      {t.is_first && <Badge text="first text" cls="bg-pink-50 text-pink-700" />}
                    </div>
                    <div className="mt-0.5 text-sm text-muted-foreground">{t.excerpt}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}

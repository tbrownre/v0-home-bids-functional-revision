"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Loader2, MapPin, RefreshCw, Search, Link2 } from "lucide-react";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

// ── Types ─────────────────────────────────────────────────────────────────────

interface LinkRow {
  job_ref: string;
  title: string;
  location: string;
  created_at: string;
  status: string;
  job_link: string;
  owner_link: string;
  bids: number;
  admin_note: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function postedDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(value));
}

function statusClass(status: string) {
  if (status === "open") return "bg-green-50 text-green-700";
  if (status === "in_progress" || status === "hired") return "bg-blue-50 text-blue-700";
  return "bg-muted text-muted-foreground";
}

function statusLabel(status: string) {
  if (!status) return "—";
  const spaced = status.replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

// ── Copy button ───────────────────────────────────────────────────────────────

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  async function copy() {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.error("[AdminLinks] Copy failed:", e);
    }
  }

  return (
    <Button
      size="sm"
      variant="outline"
      className="h-8 gap-1.5 rounded-full text-xs whitespace-nowrap"
      onClick={copy}
      disabled={!value}
      aria-label={label}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied ✓" : label}
    </Button>
  );
}

// ── Note input ────────────────────────────────────────────────────────────────

function NoteInput({ jobRef, initial, onSaved }: { jobRef: string; initial: string; onSaved: (note: string) => void }) {
  const [value, setValue] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const lastSaved = useRef(initial);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setValue(initial);
    lastSaved.current = initial;
  }, [initial]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  async function save() {
    const next = value.trim();
    if (next === lastSaved.current.trim() || saving) return;
    setSaving(true);
    const { error } = await createClient().rpc("set_admin_note", { p_job_ref: jobRef, p_note: next });
    setSaving(false);
    if (error) {
      console.error("[AdminLinks] set_admin_note failed:", error.message);
      return;
    }
    lastSaved.current = next;
    onSaved(next);
    setSaved(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="relative min-w-[160px]">
      <Input
        value={value}
        placeholder="Add a note…"
        className="h-8 pr-8 text-xs"
        onChange={(event) => setValue(event.target.value)}
        onBlur={save}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.nativeEvent.isComposing && event.keyCode !== 229) {
            event.preventDefault();
            void save();
          }
        }}
      />
      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">
        {saving ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
        ) : saved ? (
          <Check className="h-3.5 w-3.5 text-green-600" />
        ) : null}
      </span>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminLinksPage() {
  const router = useRouter();
  const [rows, setRows] = useState<LinkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [needsSharing, setNeedsSharing] = useState(false);

  // Check admin authorization (same guard as the outreach dashboard)
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
        console.error("[AdminLinks] Auth check failed:", e);
        router.push("/");
      }
    }

    checkAdmin();
  }, [router]);

  const loadData = async () => {
    const { data, error } = await createClient().rpc("admin_links_sheet");
    if (error) {
      setLoadError(error.message);
      setRows([]);
      return;
    }
    setLoadError(null);
    const list = (Array.isArray(data) ? data : []) as LinkRow[];
    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setRows(list);
  };

  useEffect(() => {
    if (!isAuthorized) return;
    loadData().finally(() => setLoading(false));
  }, [isAuthorized]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (needsSharing && (row.admin_note ?? "").trim() !== "") return false;
      if (!q) return true;
      return (
        row.job_ref?.toLowerCase().includes(q) ||
        row.title?.toLowerCase().includes(q) ||
        row.location?.toLowerCase().includes(q)
      );
    });
  }, [rows, query, needsSharing]);

  const needsSharingCount = useMemo(
    () => rows.filter((row) => (row.admin_note ?? "").trim() === "").length,
    [rows],
  );

  function updateNote(jobRef: string, note: string) {
    setRows((current) => current.map((row) => (row.job_ref === jobRef ? { ...row, admin_note: note } : row)));
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header isSignedIn />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {/* Page header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Admin</span>
            <h1 className="mt-1 text-2xl font-bold text-foreground">Job Links</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Worksheet for manually sharing job and homeowner links. Notes save on blur or Enter.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 rounded-full"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Controls */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search job ref, title, or location"
              className="pl-9"
              aria-label="Search jobs"
            />
          </div>
          <Button
            type="button"
            variant={needsSharing ? "default" : "outline"}
            size="sm"
            className="gap-2 rounded-full self-start sm:self-auto"
            aria-pressed={needsSharing}
            onClick={() => setNeedsSharing((value) => !value)}
          >
            <Link2 className="h-3.5 w-3.5" />
            Needs sharing
            <span className={`rounded-full px-1.5 text-[10px] font-bold ${needsSharing ? "bg-primary-foreground/20" : "bg-muted"}`}>
              {needsSharingCount}
            </span>
          </Button>
        </div>

        {loadError && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Couldn&apos;t load links: {loadError}
          </div>
        )}

        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {filtered.length} of {rows.length} jobs
        </h2>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-12 text-center">
            <Link2 className="mx-auto h-10 w-10 text-muted-foreground/30" />
            <p className="mt-4 font-medium text-foreground">
              {rows.length === 0 ? "No jobs yet" : "No jobs match"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {rows.length === 0
                ? "Jobs will appear here as homeowners submit them."
                : "Try a different search or turn off the Needs sharing filter."}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-hidden rounded-2xl border border-border bg-card md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Job</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bids</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Links</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((row) => (
                    <tr key={row.job_ref} className="transition-colors hover:bg-muted/20">
                      <td className="px-4 py-3 align-top">
                        <p className="font-mono text-xs font-semibold text-primary">{row.job_ref}</p>
                        <p className="mt-0.5 font-medium text-foreground">{row.title}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {row.location}
                          <span aria-hidden="true">·</span>
                          Posted {postedDate(row.created_at)}
                        </p>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass(row.status)}`}>
                          {statusLabel(row.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right align-top font-medium text-foreground">{row.bids ?? 0}</td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-wrap gap-2">
                          <CopyButton value={row.job_link} label="Copy job link" />
                          <CopyButton value={row.owner_link} label="Copy owner link" />
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <NoteInput
                          jobRef={row.job_ref}
                          initial={row.admin_note ?? ""}
                          onSaved={(note) => updateNote(row.job_ref, note)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="flex flex-col gap-3 md:hidden">
              {filtered.map((row) => (
                <div key={row.job_ref} className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-xs font-semibold text-primary">{row.job_ref}</p>
                      <p className="mt-0.5 font-medium text-foreground">{row.title}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{row.location}</span>
                        <span aria-hidden="true">·</span>
                        {postedDate(row.created_at)}
                      </p>
                    </div>
                    <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass(row.status)}`}>
                      {statusLabel(row.status)}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                    <span>
                      <span className="font-semibold text-foreground">{row.bids ?? 0}</span> {row.bids === 1 ? "bid" : "bids"}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <CopyButton value={row.job_link} label="Copy job link" />
                    <CopyButton value={row.owner_link} label="Copy owner link" />
                  </div>

                  <div className="mt-3">
                    <NoteInput
                      jobRef={row.job_ref}
                      initial={row.admin_note ?? ""}
                      onSaved={(note) => updateNote(row.job_ref, note)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

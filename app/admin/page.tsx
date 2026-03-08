"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Search,
  ChevronRight,
  MapPin,
  Briefcase,
  Shield,
  Calendar,
  Phone,
  Mail,
  Star,
  X,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import {
  getContractorApplications,
  getAdminStats,
  updateContractorStatus,
  type ContractorApplication,
} from "./actions";

type Filter = "all" | "pending" | "approved" | "rejected";

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    icon: Clock,
    badge: "bg-amber-100 text-amber-800 border-amber-200",
    dot: "bg-amber-500",
  },
  approved: {
    label: "Approved",
    icon: CheckCircle2,
    badge: "bg-green-100 text-green-800 border-green-200",
    dot: "bg-green-500",
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    badge: "bg-red-100 text-red-800 border-red-200",
    dot: "bg-red-500",
  },
};

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-3 text-3xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function ApplicationCard({
  app,
  onSelect,
}: {
  app: ContractorApplication;
  onSelect: (app: ContractorApplication) => void;
}) {
  const cfg = STATUS_CONFIG[app.approval_status];
  const daysAgo = Math.floor(
    (Date.now() - new Date(app.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="group cursor-pointer rounded-xl border border-border bg-background p-5 transition-all hover:border-foreground/20 hover:shadow-md"
      onClick={() => onSelect(app)}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground uppercase">
            {(app.business_name ?? "?").charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-foreground truncate">{app.business_name}</p>
            <p className="text-sm text-muted-foreground truncate">
              {app.profiles?.full_name ?? "Unknown"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${cfg.badge}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
        {app.service_area && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {app.service_area}
          </span>
        )}
        {app.years_experience != null && (
          <span className="flex items-center gap-1">
            <Star className="h-3 w-3" />
            {app.years_experience} yr{app.years_experience !== 1 ? "s" : ""} experience
          </span>
        )}
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {daysAgo === 0 ? "Today" : `${daysAgo}d ago`}
        </span>
      </div>

      {app.specialties?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {app.specialties.slice(0, 4).map((s) => (
            <span
              key={s}
              className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
            >
              {s}
            </span>
          ))}
          {app.specialties.length > 4 && (
            <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
              +{app.specialties.length - 4} more
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}

function DetailPanel({
  app,
  onClose,
  onAction,
  actionPending,
}: {
  app: ContractorApplication;
  onClose: () => void;
  onAction: (id: string, status: "approved" | "rejected") => void;
  actionPending: boolean;
}) {
  const cfg = STATUS_CONFIG[app.approval_status];

  return (
    <motion.div
      initial={{ opacity: 0, x: 32 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 32 }}
      className="flex h-full flex-col overflow-y-auto rounded-xl border border-border bg-background"
    >
      {/* Header */}
      <div className="flex items-start justify-between border-b border-border p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-lg font-bold text-foreground uppercase">
            {(app.business_name ?? "?").charAt(0)}
          </div>
          <div>
            <h2 className="font-semibold text-foreground">{app.business_name}</h2>
            <span className={`mt-1 inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${cfg.badge}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 space-y-6 p-6">
        {/* Contact */}
        <section>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Contact
          </h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Users className="h-4 w-4 text-muted-foreground shrink-0" />
              {app.profiles?.full_name ?? "—"}
            </div>
            {app.profiles?.email && (
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <a href={`mailto:${app.profiles.email}`} className="hover:underline">
                  {app.profiles.email}
                </a>
              </div>
            )}
            {app.profiles?.phone && (
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                {app.profiles.phone}
              </div>
            )}
          </div>
        </section>

        {/* Business details */}
        <section>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Business Details
          </h3>
          <div className="space-y-2">
            {app.service_area && (
              <div className="flex items-start gap-2 text-sm text-foreground">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <span>{app.service_area}</span>
              </div>
            )}
            {app.years_experience != null && (
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Star className="h-4 w-4 text-muted-foreground shrink-0" />
                {app.years_experience} years of experience
              </div>
            )}
            {app.license_number && (
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
                License: {app.license_number}
              </div>
            )}
          </div>
        </section>

        {/* Services */}
        {app.specialties?.length > 0 && (
          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Services Offered
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {app.specialties.map((s) => (
                <span
                  key={s}
                  className="rounded-md border border-border bg-muted px-2.5 py-1 text-xs font-medium text-foreground"
                >
                  {s}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Bio */}
        {app.bio && (
          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Bio
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{app.bio}</p>
          </section>
        )}

        {/* Applied */}
        <section>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Applied
          </h3>
          <p className="text-sm text-foreground">
            {new Date(app.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </section>
      </div>

      {/* Actions */}
      {app.approval_status === "pending" && (
        <div className="border-t border-border p-6 space-y-2">
          <Button
            className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white"
            disabled={actionPending}
            onClick={() => onAction(app.id, "approved")}
          >
            {actionPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Approve Contractor
          </Button>
          <Button
            variant="outline"
            className="w-full gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 bg-transparent"
            disabled={actionPending}
            onClick={() => onAction(app.id, "rejected")}
          >
            <XCircle className="h-4 w-4" />
            Reject Application
          </Button>
        </div>
      )}

      {app.approval_status === "approved" && (
        <div className="border-t border-border p-6">
          <Button
            variant="outline"
            className="w-full gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 bg-transparent"
            disabled={actionPending}
            onClick={() => onAction(app.id, "rejected")}
          >
            {actionPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
            Revoke Approval
          </Button>
        </div>
      )}

      {app.approval_status === "rejected" && (
        <div className="border-t border-border p-6">
          <Button
            className="w-full gap-2"
            disabled={actionPending}
            onClick={() => onAction(app.id, "approved")}
          >
            {actionPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Approve Anyway
          </Button>
        </div>
      )}
    </motion.div>
  );
}

export default function AdminPage() {
  const [filter, setFilter] = useState<Filter>("pending");
  const [search, setSearch] = useState("");
  const [applications, setApplications] = useState<ContractorApplication[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ContractorApplication | null>(null);
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    const [appsResult, statsResult] = await Promise.all([
      getContractorApplications(filter),
      getAdminStats(),
    ]);
    if (appsResult.error) {
      setError(appsResult.error);
    } else {
      setApplications(appsResult.applications ?? []);
    }
    setStats(statsResult);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const handleAction = (id: string, status: "approved" | "rejected") => {
    setActionError(null);
    startTransition(async () => {
      const result = await updateContractorStatus(id, status);
      if (result.error) {
        setActionError(result.error);
        return;
      }
      // Optimistically update local state
      setApplications((prev) =>
        prev.map((a) => (a.id === id ? { ...a, approval_status: status, is_approved: status === "approved" } : a))
      );
      setStats((prev) => {
        const app = applications.find((a) => a.id === id);
        if (!app) return prev;
        const next = { ...prev };
        next[app.approval_status]--;
        next[status]++;
        return next;
      });
      // Update selected if it's the same card
      if (selected?.id === id) {
        setSelected((prev) => prev ? { ...prev, approval_status: status } : null);
      }
    });
  };

  const filtered = applications.filter((a) => {
    const q = search.toLowerCase();
    return (
      a.business_name?.toLowerCase().includes(q) ||
      a.profiles?.full_name?.toLowerCase().includes(q) ||
      a.profiles?.email?.toLowerCase().includes(q) ||
      a.service_area?.toLowerCase().includes(q)
    );
  });

  const FILTERS: { key: Filter; label: string; count: number }[] = [
    { key: "pending", label: "Pending", count: stats.pending },
    { key: "approved", label: "Approved", count: stats.approved },
    { key: "rejected", label: "Rejected", count: stats.rejected },
    { key: "all", label: "All", count: stats.total },
  ];

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total" value={stats.total} icon={Users} color="bg-muted text-muted-foreground" />
        <StatCard label="Pending Review" value={stats.pending} icon={Clock} color="bg-amber-100 text-amber-700" />
        <StatCard label="Approved" value={stats.approved} icon={CheckCircle2} color="bg-green-100 text-green-700" />
        <StatCard label="Rejected" value={stats.rejected} icon={XCircle} color="bg-red-100 text-red-700" />
      </div>

      <div className="mt-8 flex flex-col gap-6 lg:flex-row">
        {/* Left: List */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-1">
              {FILTERS.map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => { setFilter(key); setSelected(null); }}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    filter === key
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                  <span className={`rounded-full px-1.5 py-0.5 text-xs ${
                    filter === key ? "bg-background/20 text-background" : "bg-muted text-muted-foreground"
                  }`}>
                    {count}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-56">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search applicants..."
                  className="pl-9 h-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button
                onClick={fetchData}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:text-foreground"
                title="Refresh"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="mt-4 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
                <AlertCircle className="mx-auto h-8 w-8 text-destructive/60" />
                <p className="mt-3 text-sm font-medium text-destructive">{error}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Make sure you are signed in as an admin. You can set <code className="font-mono">is_admin = true</code> on your profile row in Supabase.
                </p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-12 text-center">
                <Briefcase className="mx-auto h-10 w-10 text-muted-foreground/40" />
                <p className="mt-3 text-sm font-medium text-muted-foreground">No applications found</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {search ? "Try a different search term" : "New contractor applications will appear here"}
                </p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {filtered.map((app) => (
                  <ApplicationCard
                    key={app.id}
                    app={app}
                    onSelect={setSelected}
                  />
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Right: Detail panel */}
        <div className="lg:w-96 lg:shrink-0">
          <AnimatePresence mode="wait">
            {selected ? (
              <div className="sticky top-6">
                {actionError && (
                  <div className="mb-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                    {actionError}
                  </div>
                )}
                <DetailPanel
                  key={selected.id}
                  app={selected}
                  onClose={() => setSelected(null)}
                  onAction={handleAction}
                  actionPending={isPending}
                />
              </div>
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="hidden lg:flex h-64 items-center justify-center rounded-xl border border-dashed border-border"
              >
                <div className="text-center">
                  <ChevronRight className="mx-auto h-8 w-8 text-muted-foreground/30" />
                  <p className="mt-2 text-sm text-muted-foreground">Select an application to review</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}

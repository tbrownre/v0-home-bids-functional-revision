"use client";

import { useState, useRef, useEffect } from "react";
import { Header } from "@/components/header";
import { ScrollToTop } from "@/components/scroll-to-top";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase,
  DollarSign,
  Clock,
  MapPin,
  Calendar,
  Eye,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  X,
  ChevronRight,
  ArrowLeft,
  ImageIcon,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { getContractorBids } from "@/lib/supabase/actions";
import { isDemoMode } from "@/lib/demo/config";
import * as demoServices from "@/lib/demo/services";

interface ActiveBid {
  id: string;
  job_id: string;
  jobTitle: string;
  jobDescription: string;
  homeownerLocation: string;
  homeownerName: string;
  bidAmount: number;
  timeline: string;
  message: string;
  status: "open" | "in_progress" | "completed" | "not_selected";
  submittedAt: Date;
  jobBudget: string;
  jobTimeline: string;
  otherBids: number;
  financingAvailable?: boolean;
  imageCount: number;
}

interface SuggestedJob {
  id: string;
  title: string;
  location: string;
  budget: string;
  timeline: string;
  category: string;
  urgency: "low" | "medium" | "high";
  bidsCount: number;
  postedAt: Date;
}

function mapBidFromDb(raw: Record<string, unknown>): ActiveBid {
  const job = (raw.jobs ?? {}) as Record<string, unknown>;
  const budgetMin = job.budget_min as number | null | undefined;
  const budgetMax = job.budget_max as number | null | undefined;
  const budgetStr =
    budgetMin && budgetMax
      ? `$${Number(budgetMin).toLocaleString()} - $${Number(budgetMax).toLocaleString()}`
      : budgetMin
      ? `From $${Number(budgetMin).toLocaleString()}`
      : budgetMax
      ? `Up to $${Number(budgetMax).toLocaleString()}`
      : "TBD";

  const dbStatus = (raw.status as string) ?? "pending";
  let status: ActiveBid["status"] = "open";
  if (dbStatus === "pending") status = "open";
  else if (dbStatus === "accepted") status = "in_progress";
  else if (dbStatus === "completed") status = "completed";
  else if (dbStatus === "rejected") status = "not_selected";

  return {
    id: raw.id as string,
    job_id: raw.job_id as string,
    jobTitle: (job.title as string) ?? "Untitled Job",
    jobDescription: (job.description as string) ?? "",
    homeownerLocation: (job.location as string) ?? "",
    homeownerName: "",
    bidAmount: (raw.amount as number) ?? 0,
    timeline: (raw.timeline as string) ?? "",
    message: (raw.message as string) ?? "",
    status,
    submittedAt: new Date((raw.created_at as string) ?? Date.now()),
    jobBudget: budgetStr,
    jobTimeline: (job.urgency as string) ?? "",
    otherBids: 0,
    financingAvailable: false,
    imageCount: 0,
  };
}

const statusConfig = {
  open: { label: "Open", color: "bg-blue-100 text-blue-700", dotColor: "bg-blue-500", icon: Eye },
  in_progress: { label: "In Progress", color: "bg-green-100 text-green-700", dotColor: "bg-green-500", icon: Clock },
  completed: { label: "Completed", color: "bg-emerald-100 text-emerald-700", dotColor: "bg-emerald-500", icon: CheckCircle2 },
  not_selected: { label: "Not Selected", color: "bg-gray-100 text-gray-600", dotColor: "bg-gray-400", icon: X },
};

export default function ContractorBidsPage() {
  const [allBids, setAllBids] = useState<ActiveBid[]>([]);
  const [bidsLoading, setBidsLoading] = useState(true);
  const [bidsError, setBidsError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedBid, setSelectedBid] = useState<ActiveBid | null>(null);
  const [showMobileDetail, setShowMobileDetail] = useState(false);
  const detailPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Skip in v0 preview sandbox
    if (typeof window !== "undefined" && window.location.hostname.includes("vusercontent.net")) {
      setBidsLoading(false);
      return;
    }
    setBidsLoading(true);
    if (isDemoMode()) {
      demoServices.getContractorBids().then(({ bids: demoBids }) => {
        setAllBids(demoBids as unknown as ActiveBid[]);
        setBidsLoading(false);
      });
      return;
    }
    getContractorBids().then(({ bids: rawBids, error }) => {
      if (error) {
        setBidsError(error);
      } else {
        setAllBids((rawBids ?? []).map((b) => mapBidFromDb(b as Record<string, unknown>)));
      }
      setBidsLoading(false);
    });
  }, []);

  const statusOrder: Record<string, number> = { open: 0, in_progress: 1, completed: 2, not_selected: 3 };

  const filteredBids = allBids
    .filter((bid) => {
      const matchesSearch =
        bid.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bid.homeownerLocation.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter =
        filterStatus === "all" ||
        (filterStatus === "active"
          ? ["open", "in_progress"].includes(bid.status)
          : bid.status === filterStatus);
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9));

  const activeBidsValue = allBids
    .filter((b) => ["open", "in_progress"].includes(b.status))
    .reduce((sum, b) => sum + b.bidAmount, 0);

  const completedValue = allBids
    .filter((b) => b.status === "completed")
    .reduce((sum, b) => sum + b.bidAmount, 0);

  const handleSelectBid = (bid: ActiveBid) => {
    setSelectedBid(bid);
    setShowMobileDetail(true);
    requestAnimationFrame(() => {
      const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
      if (isDesktop && detailPanelRef.current) {
        detailPanelRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const formatTimeAgo = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "Yesterday";
    return `${days}d ago`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header isContractor />

      <main className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Page Header */}
          <div className={`mb-6 ${showMobileDetail ? "hidden lg:block" : "block"}`}>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Your Bids</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Track and manage all your submitted bids
            </p>
          </div>

          {/* Summary Cards */}
          <div className={`mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 ${showMobileDetail ? "hidden lg:grid" : "grid"}`}>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Active Bids</p>
              <p className="mt-1 text-xl font-bold text-foreground">
                {allBids.filter((b) => ["open", "in_progress"].includes(b.status)).length}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Pipeline Value</p>
              <p className="mt-1 text-xl font-bold text-green-600">
                ${activeBidsValue.toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Completed</p>
              <p className="mt-1 text-xl font-bold text-foreground">
                {allBids.filter((b) => b.status === "completed").length}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Earned</p>
              <p className="mt-1 text-xl font-bold text-emerald-600">
                ${completedValue.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Search & Filter */}
          <div className={`mb-4 flex flex-col gap-3 sm:flex-row sm:items-center ${showMobileDetail ? "hidden lg:flex" : "flex"}`}>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search bids by job or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-background pl-10 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { key: "all", label: "All" },
                { key: "active", label: "Active" },
                { key: "completed", label: "Completed" },
                { key: "not_selected", label: "Not Selected" },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilterStatus(f.key)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    filterStatus === f.key
                      ? "bg-foreground text-background"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bids List + Detail Panel */}
          <div className="flex gap-6">
            {/* Bids List */}
            <div className={`flex-1 space-y-3 ${showMobileDetail ? "hidden lg:block" : "block"}`}>
              {bidsLoading ? (
                <div className="flex items-center justify-center rounded-xl border border-border bg-card p-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : bidsError ? (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
                  <AlertCircle className="mx-auto h-8 w-8 text-destructive/60" />
                  <p className="mt-3 text-sm font-medium text-destructive">Failed to load bids</p>
                  <p className="mt-1 text-xs text-muted-foreground">{bidsError}</p>
                </div>
              ) : filteredBids.length === 0 ? (
                <div className="rounded-xl border border-border bg-card p-12 text-center">
                  <Briefcase className="mx-auto h-10 w-10 text-muted-foreground/50" />
                  <p className="mt-3 text-sm font-medium text-muted-foreground">
                    {allBids.length === 0 ? "No bids submitted yet" : "No bids found"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {allBids.length === 0 ? "Browse open jobs to submit your first bid" : "Try adjusting your search or filters"}
                  </p>
                  {allBids.length === 0 && (
                    <Button asChild className="mt-4" size="sm" variant="outline">
                      <Link href="/contractors/jobs">Find Jobs</Link>
                    </Button>
                  )}
                </div>
              ) : (
                filteredBids.map((bid, index) => {
                  const config = statusConfig[bid.status];
                  const StatusIcon = config.icon;
                  return (
                    <motion.div
                      key={bid.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      onClick={() => handleSelectBid(bid)}
                      className={`cursor-pointer rounded-xl border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm ${
                        selectedBid?.id === bid.id
                          ? "border-primary/40 ring-1 ring-primary/20"
                          : "border-border"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="truncate text-sm font-semibold text-foreground">{bid.jobTitle}</h3>
                            <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${config.color}`}>
                              <StatusIcon className="h-3 w-3" />
                              {config.label}
                            </span>
                          </div>
                          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {bid.homeownerLocation}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(bid.submittedAt)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {bid.otherBids} other bids
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-foreground">${bid.bidAmount.toLocaleString()}</p>
                          <p className="text-[10px] text-muted-foreground">Budget: {bid.jobBudget}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Detail Panel */}
            {selectedBid && (
              <div
                ref={detailPanelRef}
                className={`w-full lg:w-[420px] lg:shrink-0 ${showMobileDetail ? "block" : "hidden lg:block"}`}
              >
                <div className="sticky top-4 rounded-xl border border-border bg-card p-5">
                  {/* Mobile back */}
                  <button
                    onClick={() => setShowMobileDetail(false)}
                    className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground lg:hidden"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to bids
                  </button>

                  {/* Status badge */}
                  <div className="mb-4 flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${statusConfig[selectedBid.status].color}`}>
                      {(() => { const Icon = statusConfig[selectedBid.status].icon; return <Icon className="h-3.5 w-3.5" />; })()}
                      {statusConfig[selectedBid.status].label}
                    </span>
                    <Link
                      href="/contractors/dashboard"
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Manage in Dashboard
                    </Link>
                  </div>

                  {/* Job title */}
                  <h2 className="text-lg font-bold text-foreground">{selectedBid.jobTitle}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{selectedBid.jobDescription}</p>
                  {selectedBid.imageCount > 0 && (
                    <button
                      type="button"
                      className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                    >
                      <ImageIcon className="h-3.5 w-3.5" />
                      See Images ({selectedBid.imageCount} photos from homeowner)
                    </button>
                  )}

                  {/* Quick stats */}
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-green-50 p-3">
                      <p className="text-[10px] font-medium text-green-600">Your Bid</p>
                      <p className="mt-0.5 text-lg font-bold text-green-700">${selectedBid.bidAmount.toLocaleString()}</p>
                    </div>
                    <div className="rounded-lg bg-blue-50 p-3">
                      <p className="text-[10px] font-medium text-blue-600">Timeline</p>
                      <p className="mt-0.5 text-lg font-bold text-blue-700">{selectedBid.timeline}</p>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                      <span className="text-xs text-muted-foreground">Homeowner</span>
                      <span className="text-xs font-medium text-foreground">{selectedBid.homeownerName}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                      <span className="text-xs text-muted-foreground">Location</span>
                      <span className="text-xs font-medium text-foreground">{selectedBid.homeownerLocation}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                      <span className="text-xs text-muted-foreground">Job Budget</span>
                      <span className="text-xs font-medium text-foreground">{selectedBid.jobBudget}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                      <span className="text-xs text-muted-foreground">Competition</span>
                      <span className="text-xs font-medium text-foreground">{selectedBid.otherBids} other bids</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                      <span className="text-xs text-muted-foreground">Submitted</span>
                      <span className="text-xs font-medium text-foreground">{formatDate(selectedBid.submittedAt)}</span>
                    </div>
                  </div>

                  {/* Your message */}
                  <div className="mt-4 rounded-lg border border-border p-3">
                    <p className="text-[10px] font-medium text-muted-foreground">Your Message</p>
                    <p className="mt-1 text-xs leading-relaxed text-foreground">{selectedBid.message}</p>
                  </div>

                  {/* CTA */}
                  <div className="mt-4 flex gap-2">
                    {selectedBid.job_id && (
                      <Button asChild variant="outline" className="flex-1 bg-transparent" size="sm">
                        <Link href={`/jobs/${selectedBid.job_id}`}>
                          <Eye className="mr-1.5 h-3.5 w-3.5" />
                          View Job
                        </Link>
                      </Button>
                    )}
                    <Button asChild className="flex-1" size="sm">
                      <Link href="/contractors/dashboard">
                        Dashboard
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Jobs You Might Like - Carousel */}
          <section className={`mt-12 ${showMobileDetail ? "hidden lg:block" : "block"}`}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground">Jobs You Might Like</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Based on your bid history and service areas
                </p>
              </div>
              <Button asChild variant="outline" size="sm" className="gap-1.5">
                <Link href="/contractors/jobs">
                  View All
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="rounded-xl border border-dashed border-border p-8 text-center">
              <Briefcase className="mx-auto h-8 w-8 text-muted-foreground/40" />
              <p className="mt-3 text-sm text-muted-foreground">Browse open jobs to find your next opportunity</p>
              <Button asChild className="mt-4" size="sm">
                <Link href="/contractors/jobs">View Open Jobs</Link>
              </Button>
            </div>
          </section>
        </div>
      </main>

      <ScrollToTop />
    </div>
  );
}

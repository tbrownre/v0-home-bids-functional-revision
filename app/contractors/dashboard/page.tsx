"use client";

import { useState, useRef, useEffect } from "react";
import { Header } from "@/components/header";
import { ScrollToTop } from "@/components/scroll-to-top";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase,
  DollarSign,
  Clock,
  MapPin,
  Calendar,
  Edit3,
  Trash2,
  MessageCircle,
  Eye,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Search,
  Filter,
  TrendingUp,
  Users,
  FileText,
  X,
  CreditCard,
  Send,
  ArrowLeft,
  Calculator,
  ChevronDown,
  ChevronUp,
  ImageIcon,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

interface Message {
  id: string;
  text: string;
  sender: "contractor" | "homeowner";
  timestamp: Date;
}

interface AvailableJob {
  id: string;
  title: string;
  description: string;
  location: string;
  budget: string;
  timeline: string;
  postedAt: Date;
  category: string;
  urgency: "low" | "medium" | "high";
  bidsCount: number;
  homeownerName: string;
  propertyType: string;
}

interface JobMessage {
  id: string;
  text: string;
  sender: "contractor" | "homeowner";
  time: Date;
}

// No sample data — bids are loaded from Supabase per authenticated user
  
  const statusConfig = {
  open: { label: "Open", color: "bg-blue-100 text-blue-700", icon: Eye },
  in_progress: { label: "In Progress", color: "bg-amber-100 text-amber-700", icon: Clock },
  completed: { label: "Completed", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  not_selected: { label: "Not Selected", color: "bg-gray-100 text-gray-600", icon: X },
};

// No sample available jobs — real jobs are fetched from Supabase

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

export default function ContractorDashboard() {
  const [bids, setBids] = useState<ActiveBid[]>([]);
  const [bidsLoading, setBidsLoading] = useState(true);
  const [bidsError, setBidsError] = useState<string | null>(null);

  useEffect(() => {
    // Skip in v0 preview sandbox
    if (typeof window !== "undefined" && window.location.hostname.includes("vusercontent.net")) {
      setBidsLoading(false);
      return;
    }
    setBidsLoading(true);
    const loader = isDemoMode() ? demoServices.getContractorBids : getContractorBids;
    loader().then(({ bids: rawBids, error }) => {
      if (error) {
        setBidsError(error);
      } else {
        setBids((rawBids ?? []).map((b) => mapBidFromDb(b as Record<string, unknown>)));
      }
      setBidsLoading(false);
    });
  }, []);
  const [selectedBid, setSelectedBid] = useState<ActiveBid | null>(null);
  const [showMobileDetail, setShowMobileDetail] = useState(false);
  const [editingBid, setEditingBid] = useState<ActiveBid | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [bidToDelete, setBidToDelete] = useState<ActiveBid | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showPipeline, setShowPipeline] = useState(false);
  const [expandedStatuses, setExpandedStatuses] = useState<Set<string>>(new Set());
  
  // Messenger state
  const [showMessenger, setShowMessenger] = useState(false);
  const [messagingBid, setMessagingBid] = useState<ActiveBid | null>(null);
  const [newMessage, setNewMessage] = useState("");

  // Job preview popup state
  const [showJobPreview, setShowJobPreview] = useState(false);
  const [previewJob, setPreviewJob] = useState<AvailableJob | null>(null);
  const [previewTab, setPreviewTab] = useState<"details" | "bid" | "chat">("details");
  const [previewBidAmount, setPreviewBidAmount] = useState("");
  const [previewBidTimeline, setPreviewBidTimeline] = useState("");
  const [previewBidMessage, setPreviewBidMessage] = useState("");
  const [previewBidSubmitted, setPreviewBidSubmitted] = useState(false);
  const [previewBidMode, setPreviewBidMode] = useState<"bid_only" | "bid_and_inspection" | "inspection_only">("bid_only");
  const [previewBidNoDeposit, setPreviewBidNoDeposit] = useState<boolean | null>(null);
  const [previewBidDepositAmount, setPreviewBidDepositAmount] = useState("");
  const [previewBidInspectionFee, setPreviewBidInspectionFee] = useState("");
  const [previewBidFreeInspection, setPreviewBidFreeInspection] = useState(false);
  const [previewBidFinancing, setPreviewBidFinancing] = useState<boolean | null>(null);
  const [showBidConfirm, setShowBidConfirm] = useState(false);
  const [previewChatInput, setPreviewChatInput] = useState("");
  const [previewChatMessages, setPreviewChatMessages] = useState<Record<string, JobMessage[]>>({});

  const handleOpenJobPreview = (job: AvailableJob) => {
    setPreviewJob(job);
    setPreviewTab("details");
    setPreviewBidMode("bid_only");
    setPreviewBidAmount("");
    setPreviewBidTimeline("");
    setPreviewBidMessage("");
    setPreviewBidNoDeposit(null);
    setPreviewBidDepositAmount("");
    setPreviewBidInspectionFee("");
    setPreviewBidFreeInspection(false);
    setPreviewBidFinancing(null);
    setPreviewBidSubmitted(false);
    setPreviewChatInput("");
    setShowJobPreview(true);
  };

  const handlePreviewSubmitBid = () => {
    if (!previewJob) return;
    if (previewBidMode === "inspection_only") {
      if (!previewBidFreeInspection && !previewBidInspectionFee) return;
    } else {
      if (!previewBidAmount || !previewBidTimeline) return;
    }
    setShowBidConfirm(true);
  };

  const handleConfirmBidSubmit = () => {
    setShowBidConfirm(false);
    setPreviewBidSubmitted(true);
  };

  const handlePreviewSendChat = () => {
    if (!previewChatInput.trim() || !previewJob) return;
    const jobId = previewJob.id;
    const msg: JobMessage = {
      id: Date.now().toString(),
      text: previewChatInput.trim(),
      sender: "contractor",
      time: new Date(),
    };
    setPreviewChatMessages((prev) => ({
      ...prev,
      [jobId]: [...(prev[jobId] || []), msg],
    }));
    setPreviewChatInput("");

    // Simulate homeowner reply
    setTimeout(() => {
      const replies = [
        "Thanks for reaching out! Let me get back to you on that shortly.",
        "Good question. I'll check and reply within the hour.",
        "Hi! Yes, I can provide more details. Give me a moment.",
        "Thanks for asking! I'll send over some photos as well.",
      ];
      const reply: JobMessage = {
        id: (Date.now() + 1).toString(),
        text: replies[Math.floor(Math.random() * replies.length)],
        sender: "homeowner",
        time: new Date(),
      };
      setPreviewChatMessages((prev) => ({
        ...prev,
        [jobId]: [...(prev[jobId] || []), reply],
      }));
    }, 1500);
  };

  // Payout calculator state removed — contractors keep 100% with no success fees
  const [messages, setMessages] = useState<Record<string, Message[]>>({
    "1": [
      { id: "m1", text: "Hi, I saw your bid. Can you tell me more about the materials you use?", sender: "homeowner", timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000) },
      { id: "m2", text: "Of course! We use GAF Timberline HDZ shingles which come with a lifetime warranty. They're highly rated for Texas weather.", sender: "contractor", timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) },
      { id: "m3", text: "That sounds great. When could you start?", sender: "homeowner", timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000) },
    ],
    "2": [
      { id: "m4", text: "Your portfolio looks impressive! Do you handle the permitting?", sender: "homeowner", timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      { id: "m5", text: "Yes, we handle all permits and inspections. It's included in our service.", sender: "contractor", timestamp: new Date(Date.now() - 23 * 60 * 60 * 1000) },
    ],
  });

  // Edit form state
  const [editAmount, setEditAmount] = useState("");
  const [editTimeline, setEditTimeline] = useState("");
  const [editMessage, setEditMessage] = useState("");

  const detailPanelRef = useRef<HTMLDivElement>(null);

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

  const handleBackToList = () => {
    setShowMobileDetail(false);
  };

  const handleEditBid = (bid: ActiveBid) => {
    setEditingBid(bid);
    setEditAmount(bid.bidAmount.toString());
    setEditTimeline(bid.timeline);
    setEditMessage(bid.message);
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (!editingBid) return;

    setBids((prev) =>
      prev.map((bid) =>
        bid.id === editingBid.id
          ? {
              ...bid,
              bidAmount: Number.parseFloat(editAmount) || bid.bidAmount,
              timeline: editTimeline || bid.timeline,
              message: editMessage || bid.message,
            }
          : bid
      )
    );

    setShowEditModal(false);
    setEditingBid(null);
  };

  const handleDeleteClick = (bid: ActiveBid) => {
    setBidToDelete(bid);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (!bidToDelete) return;

    setBids((prev) => prev.filter((bid) => bid.id !== bidToDelete.id));
    setShowDeleteConfirm(false);
    setBidToDelete(null);
    if (selectedBid?.id === bidToDelete.id) {
      setSelectedBid(null);
    }
  };

  const handleOpenMessenger = (bid: ActiveBid) => {
    setMessagingBid(bid);
    setShowMessenger(true);
  };

  const handleSendMessage = () => {
    if (!messagingBid || !newMessage.trim()) return;

    const message: Message = {
      id: `m${Date.now()}`,
      text: newMessage.trim(),
      sender: "contractor",
      timestamp: new Date(),
    };

    setMessages((prev) => ({
      ...prev,
      [messagingBid.id]: [...(prev[messagingBid.id] || []), message],
    }));
    setNewMessage("");
  };

  // Payout handler removed — contractors keep 100% with no success fees

  // Payout calculation removed — contractors keep 100% with no success fees

  const toggleExpandedStatus = (status: string) => {
    setExpandedStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(status)) {
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  };

  const statusOrder: Record<string, number> = { open: 0, in_progress: 1, completed: 2, not_selected: 3 };

  const filteredBids = bids.filter((bid) => {
    const matchesSearch =
      bid.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bid.homeownerLocation.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "active" ? ["open", "in_progress"].includes(bid.status) : bid.status === filterStatus);
    return matchesSearch && matchesFilter;
  }).sort((a, b) => (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9));

  const bidsByStatus = {
    open: bids.filter((b) => b.status === "open"),
    in_progress: bids.filter((b) => b.status === "in_progress"),
    completed: bids.filter((b) => b.status === "completed"),
    not_selected: bids.filter((b) => b.status === "not_selected"),
  };

  const statOf = (key: keyof typeof bidsByStatus) => ({
    count: bidsByStatus[key].length,
    value: bidsByStatus[key].reduce((sum, b) => sum + b.bidAmount, 0),
  });

  const stats: Record<string, { count: number; value: number }> & { totalPipeline: number } = {
    open: statOf("open"),
    in_progress: statOf("in_progress"),
    completed: statOf("completed"),
    not_selected: statOf("not_selected"),
    totalPipeline:
      bidsByStatus.open.reduce((sum, b) => sum + b.bidAmount, 0) +
      bidsByStatus.in_progress.reduce((sum, b) => sum + b.bidAmount, 0),
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header isContractor />

      <main className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Page Header - Hidden on mobile when viewing bid detail */}
          <div className={`mb-8 text-center lg:text-left ${showMobileDetail ? "hidden lg:block" : "block"}`}>
            <h1 className="text-3xl font-bold text-foreground">Contractor Dashboard</h1>
            <p className="mt-2 text-muted-foreground">
              Manage your active bids and track job opportunities
            </p>
          </div>

          {/* Gamified Earnings Tracker - Hidden on mobile when viewing bid detail */}
          <div className={`mb-8 ${showMobileDetail ? "hidden lg:block" : "block"}`}>
            {/* Total Potential Banner - Clickable to expand full pipeline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setShowPipeline(!showPipeline)}
              className="mb-4 cursor-pointer rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 transition-all hover:border-primary/40 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-primary/70">Total Pipeline Value</p>
                  <p className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
                    ${stats.totalPipeline.toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <motion.div
                    animate={{ rotate: showPipeline ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10"
                  >
                    <ChevronDown className="h-4 w-4 text-primary" />
                  </motion.div>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {showPipeline ? "Click to collapse pipeline" : "Click to view full bid pipeline"}
              </p>
            </motion.div>

            {/* Expanded Pipeline View */}
            <AnimatePresence>
              {showPipeline && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="mb-4 overflow-hidden"
                >
                  <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
                    <h3 className="mb-4 text-sm font-semibold text-foreground sm:text-base">Bid Pipeline</h3>

                    {/* Pipeline stages */}
                    {(
                      [
                        { key: "open", label: "Open Bids", color: "bg-blue-500", lightBg: "bg-blue-50", textColor: "text-blue-700", icon: Eye },
                        { key: "in_progress", label: "In Progress", color: "bg-amber-500", lightBg: "bg-amber-50", textColor: "text-amber-700", icon: Clock },
                        { key: "completed", label: "Completed", color: "bg-emerald-500", lightBg: "bg-emerald-50", textColor: "text-emerald-700", icon: CheckCircle2 },
                        { key: "not_selected", label: "Not Selected", color: "bg-gray-400", lightBg: "bg-gray-50", textColor: "text-gray-600", icon: X },
                      ] as const
                    ).map((stage) => {
                      const stageBids = bidsByStatus[stage.key];
                      if (stageBids.length === 0) return null;
                      const StageIcon = stage.icon;
                      return (
                        <div key={stage.key} className="mb-4 last:mb-0">
                          {/* Stage header */}
                          <div className="mb-2 flex items-center gap-2">
                            <div className={`h-2.5 w-2.5 rounded-full ${stage.color}`} />
                            <p className={`text-xs font-semibold ${stage.textColor} sm:text-sm`}>{stage.label}</p>
                            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                              {stageBids.length}
                            </span>
                            <span className="ml-auto text-xs font-semibold text-foreground">
                              ${stageBids.reduce((s, b) => s + b.bidAmount, 0).toLocaleString()}
                            </span>
                          </div>

                          {/* Stage bids */}
                          <div className="space-y-1.5 pl-5">
                            {stageBids.map((bid) => (
                              <div
                                key={bid.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectBid(bid);
                                  setShowPipeline(false);
                                }}
                                className={`flex cursor-pointer items-center justify-between rounded-lg border border-border p-2.5 transition-all hover:border-primary/30 hover:bg-muted/50 sm:p-3 ${
                                  selectedBid?.id === bid.id ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20" : ""
                                }`}
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-xs font-medium text-foreground sm:text-sm">{bid.jobTitle}</p>
                                  <div className="mt-0.5 flex items-center gap-2">
                                    <p className="flex items-center gap-0.5 text-[10px] text-muted-foreground sm:text-xs">
                                      <MapPin className="h-2.5 w-2.5 shrink-0" />
                                      <span className="truncate">{bid.homeownerLocation}</span>
                                    </p>
                                    <span className="text-[10px] text-muted-foreground/50">|</span>
                                    <p className="text-[10px] text-muted-foreground sm:text-xs">{bid.homeownerName}</p>
                                  </div>
                                </div>
                                <div className="ml-3 text-right">
                                  <p className="text-xs font-bold text-foreground sm:text-sm">${bid.bidAmount.toLocaleString()}</p>
                                  <p className="text-[10px] text-muted-foreground">{bid.timeline}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    {/* Pipeline summary bar */}
                    <div className="mt-5 rounded-lg bg-muted/50 p-3">
                      <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground sm:text-xs">Pipeline Breakdown</p>
                      <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
                        {stats.open.value > 0 && (
                          <div className="bg-blue-500 transition-all" style={{ width: `${(stats.open.value / (stats.totalPipeline || 1)) * 100}%` }} title={`Open: $${stats.open.value.toLocaleString()}`} />
                        )}
                        {stats.in_progress.value > 0 && (
                          <div className="bg-amber-500 transition-all" style={{ width: `${(stats.in_progress.value / (stats.totalPipeline || 1)) * 100}%` }} title={`In Progress: $${stats.in_progress.value.toLocaleString()}`} />
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        {stats.open.count > 0 && (
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><span className="h-2 w-2 rounded-full bg-blue-500" />Open</span>
                        )}
                        {stats.in_progress.count > 0 && (
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><span className="h-2 w-2 rounded-full bg-amber-500" />In Progress</span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Earnings Breakdown */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              {(
                [
                  { key: "open" as const, label: "Open", suffix: (c: number) => `${c} open bid${c !== 1 ? "s" : ""}`, delay: 0.1, icon: Eye, border: "border-blue-200", borderActive: "border-blue-400 ring-2 ring-blue-300/50 shadow-sm", bg: "bg-blue-50/50", bgActive: "bg-blue-50", iconBg: "bg-blue-100", iconColor: "text-blue-600", textColor: "text-blue-700", valueColor: "text-blue-800", subColor: "text-blue-600", hoverBorder: "hover:border-blue-300" },
                  { key: "in_progress" as const, label: "In Progress", suffix: (c: number) => `${c} job${c !== 1 ? "s" : ""} active`, delay: 0.15, icon: Clock, border: "border-amber-200", borderActive: "border-amber-400 ring-2 ring-amber-300/50 shadow-sm", bg: "bg-amber-50/50", bgActive: "bg-amber-50", iconBg: "bg-amber-100", iconColor: "text-amber-600", textColor: "text-amber-700", valueColor: "text-amber-800", subColor: "text-amber-600", hoverBorder: "hover:border-amber-300" },
                  { key: "completed" as const, label: "Completed", suffix: (c: number) => `${c} job${c !== 1 ? "s" : ""} done`, delay: 0.2, icon: CheckCircle2, border: "border-emerald-200", borderActive: "border-emerald-400 ring-2 ring-emerald-300/50 shadow-sm", bg: "bg-emerald-50/50", bgActive: "bg-emerald-50", iconBg: "bg-emerald-100", iconColor: "text-emerald-600", textColor: "text-emerald-700", valueColor: "text-emerald-800", subColor: "text-emerald-600", hoverBorder: "hover:border-emerald-300" },
                ] as const
              ).map((stage) => {
                const stat = stats[stage.key];
                const isExpanded = expandedStatuses.has(stage.key);
                const stageBids = bidsByStatus[stage.key];
                const StageIcon = stage.icon;

                return (
                  <motion.div
                    key={stage.key}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: stage.delay }}
                    className={`rounded-xl border transition-all ${isExpanded ? `${stage.borderActive} ${stage.bgActive}` : `${stage.border} ${stage.bg} ${stage.hoverBorder} hover:shadow-sm`}`}
                  >
                    {/* Card header - click to expand/collapse dropdown only */}
                    <div
                      onClick={() => {
                        if (stat.count > 0) {
                          toggleExpandedStatus(stage.key);
                        }
                      }}
                      className="cursor-pointer p-3 sm:p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${stage.iconBg}`}>
                            <StageIcon className={`h-4 w-4 ${stage.iconColor}`} />
                          </div>
                          <p className={`text-xs font-medium ${stage.textColor} sm:text-sm`}>{stage.label}</p>
                        </div>
                        {stat.count > 0 && (
                          <div className={`flex h-6 w-6 items-center justify-center rounded-full ${stage.iconBg} ${stage.iconColor}`}>
                            <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                              <ChevronDown className="h-3.5 w-3.5" />
                            </motion.div>
                          </div>
                        )}
                      </div>
                      <p className={`mt-2 text-lg font-bold ${stage.valueColor} sm:text-xl`}>
                        ${stat.value.toLocaleString()}
                      </p>
                      <p className={`text-[10px] ${stage.subColor} sm:text-xs`}>
                        {stage.suffix(stat.count)}
                      </p>
                    </div>

                    {/* Expandable bid list */}
                    <AnimatePresence>
                      {isExpanded && stageBids.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-border/30 px-3 pb-3 pt-2 sm:px-4 sm:pb-4">
                            <div className="space-y-1.5">
                              {stageBids.map((bid) => (
                                <div
                                  key={bid.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectBid(bid);
                                  }}
                                  className={`flex cursor-pointer items-center justify-between rounded-lg border border-border/50 bg-card/80 p-2 transition-all hover:border-primary/30 hover:bg-card sm:p-2.5 ${
                                    selectedBid?.id === bid.id ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20" : ""
                                  }`}
                                >
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-[11px] font-medium text-foreground sm:text-xs">{bid.jobTitle}</p>
                                    <p className="mt-0.5 flex items-center gap-1 text-[9px] text-muted-foreground sm:text-[10px]">
                                      <MapPin className="h-2 w-2 shrink-0 sm:h-2.5 sm:w-2.5" />
                                      <span className="truncate">{bid.homeownerLocation}</span>
                                    </p>
                                  </div>
                                  <div className="ml-2 text-right">
                                    <p className="text-[11px] font-bold text-foreground sm:text-xs">${bid.bidAmount.toLocaleString()}</p>
                                    <p className="text-[9px] text-muted-foreground sm:text-[10px]">{bid.timeline}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>

            {/* Available Jobs Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-6"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground sm:text-base">Jobs You Might Like</h3>
                </div>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  Browse all
                </span>
              </div>
              
              <div className="rounded-xl border border-dashed border-border p-6 text-center">
                <Briefcase className="mx-auto h-8 w-8 text-muted-foreground/40" />
                <p className="mt-3 text-sm text-muted-foreground">Browse open jobs to find your next opportunity</p>
                <Button asChild className="mt-4" size="sm">
                  <Link href="/contractors/jobs">View Open Jobs</Link>
                </Button>
              </div>
            </motion.div>
          </div>

          {/* Search and Filter - Hidden on mobile when viewing bid detail */}
          <div className={`mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${showMobileDetail ? "hidden lg:flex" : "flex"}`}>
            <div className="relative flex-1 max-w-md mx-auto sm:mx-0">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search bids..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center justify-center gap-2 sm:justify-start">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="not_selected">Not Selected</option>
              </select>
            </div>
          </div>

          {/* Bids Grid */}
          <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
            {/* Bids List - Hidden on mobile when detail is shown */}
            <div className={`space-y-4 ${showMobileDetail ? "hidden lg:block" : "block"}`}>
              <h2 className="text-lg font-semibold text-foreground text-center lg:text-left">Your Bids ({filteredBids.length})</h2>
              
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
                <div className="rounded-xl border border-dashed border-border p-8 text-center">
                  <Briefcase className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 font-medium text-muted-foreground">No bids yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">Browse open jobs to submit your first bid</p>
                  <Button asChild className="mt-4" size="sm" variant="outline">
                    <Link href="/contractors/jobs">Find Jobs</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-14rem)] pr-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/20">
                  {filteredBids.map((bid) => {
                    const StatusIcon = statusConfig[bid.status].icon;
                    const isEditable = bid.status === "open";

                    return (
                      <motion.div
                        key={bid.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`cursor-pointer rounded-xl border p-4 transition-all ${
                          selectedBid?.id === bid.id
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border bg-card hover:border-primary/30 hover:shadow-sm"
                        }`}
                        onClick={() => handleSelectBid(bid)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-foreground truncate">
                                {bid.jobTitle}
                              </h3>
                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${statusConfig[bid.status].color}`}>
                                <StatusIcon className="h-3 w-3" />
                                {statusConfig[bid.status].label}
                              </span>
                            </div>
                            <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" />
                                {bid.homeownerLocation}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {formatDate(bid.submittedAt)}
                              </span>
                            </div>
<div className="mt-3 flex items-center gap-3 flex-wrap">
                                              <span className="inline-flex items-center gap-1 rounded-lg bg-green-50 px-2.5 py-1 text-sm font-bold text-green-700">
                                                <DollarSign className="h-4 w-4" />
                                                {bid.bidAmount.toLocaleString()}
                                              </span>
                                              <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                                                <Clock className="h-3.5 w-3.5" />
                                                {bid.timeline}
                                              </span>
                                              {bid.financingAvailable && (
                                                <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                                                  <CreditCard className="h-3.5 w-3.5" />
                                                  Financing
                                                </span>
                                              )}
                                              <span className="text-xs text-muted-foreground">
                                                <Users className="mr-1 inline h-3.5 w-3.5" />
                                                {bid.otherBids} other bids
                                              </span>
                                            </div>
                          </div>

                          {isEditable && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="shrink-0"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleOpenMessenger(bid)}>
                                  <MessageCircle className="mr-2 h-4 w-4" />
                                  Message Homeowner
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditBid(bid)}>
                                  <Edit3 className="mr-2 h-4 w-4" />
                                  Edit Bid
                                </DropdownMenuItem>
                              <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteClick(bid)}
                              >
                              <X className="mr-2 h-4 w-4" />
                              Cancel Bid
                              </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bid Detail Panel - Full screen on mobile when shown */}
            <div ref={detailPanelRef} className={`lg:sticky lg:top-8 lg:self-start ${showMobileDetail ? "block" : "hidden lg:block"}`}>
              <AnimatePresence mode="wait">
                {selectedBid ? (
                  <motion.div
                    key={selectedBid.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="rounded-xl border border-border bg-card overflow-y-auto max-h-[calc(100vh-4rem)] lg:max-h-[calc(100vh-14rem)] scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/20"
                  >
                    {/* Mobile Back Button */}
                    <div className="flex items-center gap-3 border-b border-border p-4 lg:hidden">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleBackToList}
                        className="gap-2 bg-transparent"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Bids
                      </Button>
                    </div>

                    {/* Detail Header */}
                    <div className="border-b border-border p-6">
                      <div className="flex flex-col items-center text-center lg:flex-row lg:items-start lg:justify-between lg:text-left">
                        <div>
                          <h3 className="text-xl font-bold text-foreground">{selectedBid.jobTitle}</h3>
                          <div className="mt-2 flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${statusConfig[selectedBid.status].color}`}>
                              {statusConfig[selectedBid.status].label}
                            </span>
                          </div>
                        </div>
                        <div className="mt-4 flex flex-wrap justify-center gap-2 lg:mt-0">
                          {selectedBid.status === "open" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditBid(selectedBid)}
                                className="gap-1.5 bg-transparent"
                              >
                                <Edit3 className="h-4 w-4" />
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteClick(selectedBid)}
                                className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive bg-transparent"
                              >
                                <X className="h-4 w-4" />
                                Cancel
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Job Details */}
                    <div className="border-b border-border p-6">
                      <h4 className="mb-3 font-semibold text-foreground text-center lg:text-left">Job Details</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed text-center lg:text-left">
                        {selectedBid.jobDescription}
                      </p>
                      {selectedBid.imageCount > 0 && (
                        <button
                          type="button"
                          className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                        >
                          <ImageIcon className="h-3.5 w-3.5" />
                          See Images ({selectedBid.imageCount} photos from homeowner)
                        </button>
                      )}
                      <div className="mt-4 grid grid-cols-2 gap-4">
                        <div className={`rounded-lg p-3 text-center lg:text-left ${selectedBid.jobBudget === "TBD - Insurance Paid" ? "bg-blue-50 border border-blue-200" : "bg-muted/50"}`}>
                          <p className={`text-xs ${selectedBid.jobBudget === "TBD - Insurance Paid" ? "text-blue-600" : "text-muted-foreground"}`}>Budget Range</p>
                          <p className={`mt-1 font-semibold ${selectedBid.jobBudget === "TBD - Insurance Paid" ? "text-blue-700" : "text-foreground"}`}>{selectedBid.jobBudget}</p>
                          {selectedBid.jobBudget === "TBD - Insurance Paid" && (
                            <p className="mt-0.5 text-[10px] text-blue-600">Inspection required before payment</p>
                          )}
                        </div>
                        <div className="rounded-lg bg-muted/50 p-3 text-center lg:text-left">
                          <p className="text-xs text-muted-foreground">Desired Timeline</p>
                          <p className="mt-1 font-semibold text-foreground">{selectedBid.jobTimeline}</p>
                        </div>
                      </div>
                    </div>

                    {/* Your Bid */}
                    <div className="border-b border-border p-6">
                      <h4 className="mb-3 font-semibold text-foreground text-center lg:text-left">Your Bid</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-lg bg-green-50 p-4 text-center lg:text-left">
                          <p className="text-xs text-green-600">Your Price</p>
                          <p className="mt-1 text-2xl font-bold text-green-700">
                            ${selectedBid.bidAmount.toLocaleString()}
                          </p>
                        </div>
                        <div className="rounded-lg bg-blue-50 p-4 text-center lg:text-left">
                          <p className="text-xs text-blue-600">Your Timeline</p>
                          <p className="mt-1 text-2xl font-bold text-blue-700">{selectedBid.timeline}</p>
                        </div>
                      </div>
                    </div>

                    {/* Competition Info */}
                    <div className="border-b border-border p-6">
                      <div className="flex items-center gap-3 rounded-lg bg-amber-50 p-4">
                        <Users className="h-5 w-5 text-amber-600" />
                        <div>
                          <p className="font-medium text-amber-800">Competition</p>
                          <p className="text-sm text-amber-700">
                            {selectedBid.otherBids} other contractors have bid on this job
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2 p-6">
                      {selectedBid.job_id && (
                        <Button asChild variant="outline" className="w-full gap-2 bg-transparent">
                          <Link href={`/jobs/${selectedBid.job_id}`}>
                            <Eye className="h-4 w-4" />
                            View Job Details
                          </Link>
                        </Button>
                      )}
                      <Button 
                        className="w-full gap-2"
                        onClick={() => handleOpenMessenger(selectedBid)}
                      >
                        <MessageCircle className="h-4 w-4" />
                        Message Homeowner
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hidden lg:flex h-96 items-center justify-center rounded-xl border border-dashed border-border bg-card"
                  >
                    <div className="text-center">
                      <Eye className="mx-auto h-12 w-12 text-muted-foreground/50" />
                      <p className="mt-4 text-muted-foreground">Select a bid to view details</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>

      {/* Edit Bid Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Bid</DialogTitle>
            <DialogDescription>
              Update your bid details. Changes will be visible to the homeowner.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-amount">Bid Amount ($)</Label>
              <Input
                id="edit-amount"
                type="number"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                placeholder="Enter amount"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-timeline">Timeline</Label>
              <Input
                id="edit-timeline"
                value={editTimeline}
                onChange={(e) => setEditTimeline(e.target.value)}
                placeholder="e.g., 5-7 days"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-message">Message to Homeowner</Label>
              <Textarea
                id="edit-message"
                value={editMessage}
                onChange={(e) => setEditMessage(e.target.value)}
                rows={4}
                placeholder="Describe your approach..."
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowEditModal(false)} className="bg-transparent">
                Cancel
              </Button>
              <Button onClick={handleSaveEdit}>Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Bid Confirmation Modal */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Cancel Bid
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your bid for &quot;{bidToDelete?.jobTitle}&quot;? The property owner will be notified that you have withdrawn your bid. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} className="bg-transparent">
              Go Back
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Cancel Bid
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Messenger Modal */}
      <Dialog open={showMessenger} onOpenChange={setShowMessenger}>
        <DialogContent className="sm:max-w-lg p-0 flex flex-col max-h-[80vh]">
          {/* Header */}
          <div className="border-b border-border px-6 py-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <span className="text-lg font-semibold text-primary">
                    {messagingBid?.homeownerName?.charAt(0) || "H"}
                  </span>
                </div>
                <div>
                  <p className="font-semibold">{messagingBid?.homeownerName}</p>
                  <p className="text-xs font-normal text-muted-foreground">
                    {messagingBid?.jobTitle}
                  </p>
                </div>
              </DialogTitle>
            </DialogHeader>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 min-h-[300px]">
            {messagingBid && messages[messagingBid.id]?.length > 0 ? (
              messages[messagingBid.id].map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === "contractor" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                      msg.sender === "contractor"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted text-foreground rounded-bl-md"
                    }`}
                  >
                    <p className="text-sm">{msg.text}</p>
                    <p className={`mt-1 text-xs ${msg.sender === "contractor" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex h-full items-center justify-center text-center">
                <div>
                  <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground/30" />
                  <p className="mt-3 text-sm text-muted-foreground">
                    No messages yet. Start the conversation!
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-border px-4 py-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Job Preview Popup - Full Details with Bid & Chat */}
      <Dialog open={showJobPreview} onOpenChange={setShowJobPreview}>
        <DialogContent className="flex h-[85vh] max-h-[700px] flex-col p-0 sm:max-w-lg">
          <DialogHeader className="sr-only">
            <DialogTitle>{previewJob?.title}</DialogTitle>
            <DialogDescription>Job details, bid submission, and chat</DialogDescription>
          </DialogHeader>
          {/* Header */}
          <div className="border-b border-border px-5 pt-5 pb-3">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold text-foreground">{previewJob?.title}</h2>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span>{previewJob?.location}</span>
                  <span className="text-muted-foreground/40">|</span>
                  <span>{previewJob?.homeownerName}</span>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-4 flex gap-1 rounded-lg bg-muted p-1">
              {[
                { key: "details" as const, label: "Details", icon: FileText },
                { key: "bid" as const, label: "Place Bid", icon: DollarSign },
                { key: "chat" as const, label: "Ask Question", icon: MessageCircle },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setPreviewTab(tab.key)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-all ${
                    previewTab === tab.key
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto">
            {previewJob && previewTab === "details" && (
              <div className="space-y-4 p-5">
                {/* Urgency & Category */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                    {previewJob.category}
                  </span>
                  {previewJob.urgency === "high" && (
                    <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700">Urgent</span>
                  )}
                  {previewJob.urgency === "medium" && (
                    <span className="rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-700">Soon</span>
                  )}
                  {previewJob.urgency === "low" && (
                    <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">Flexible</span>
                  )}
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                    {previewJob.propertyType}
                  </span>
                </div>

                {/* Description */}
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Description</p>
                  <p className="text-sm text-foreground leading-relaxed">{previewJob.description}</p>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-border p-3">
                          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Budget</p>
                          <p className={`mt-1.5 flex items-center gap-1 text-sm font-bold ${previewJob.budget === "TBD - Insurance Paid" ? "text-blue-700" : "text-green-700"}`}>
                            <DollarSign className="h-3.5 w-3.5" />
                            {previewJob.budget === "TBD - Insurance Paid" ? "TBD" : previewJob.budget.replace("$", "")}
                          </p>
                          {previewJob.budget === "TBD - Insurance Paid" && (
                            <p className="mt-1 text-[10px] text-blue-600">Insurance paid - inspection required</p>
                          )}
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Timeline</p>
                    <p className="mt-1.5 flex items-center gap-1 text-sm font-bold text-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {previewJob.timeline}
                    </p>
                  </div>
                </div>

                {/* Competition */}
                <div className="flex items-center gap-4 rounded-lg bg-amber-50 p-3">
                  <div className="flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-amber-600" />
                    <span className="text-xs font-medium text-amber-800">
                      {previewJob.bidsCount} bid{previewJob.bidsCount !== 1 ? "s" : ""} so far
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-amber-600" />
                    <span className="text-xs text-amber-700">
                      Posted {Math.round((Date.now() - previewJob.postedAt.getTime()) / (1000 * 60 * 60))}h ago
                    </span>
                  </div>
                </div>

                {/* Homeowner Info */}
                <div className="rounded-lg border border-border p-3">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-2">Homeowner</p>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {previewJob.homeownerName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{previewJob.homeownerName}</p>
                      <p className="text-xs text-muted-foreground">{previewJob.propertyType}</p>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2 pt-1">
                  <Button className="flex-1 gap-2" onClick={() => setPreviewTab("bid")}>
                    <DollarSign className="h-4 w-4" />
                    Place Bid
                  </Button>
                  <Button variant="outline" className="flex-1 gap-2 bg-transparent" onClick={() => setPreviewTab("chat")}>
                    <MessageCircle className="h-4 w-4" />
                    Ask Question
                  </Button>
                </div>

                {/* View All Jobs Link */}
                <Link href="/contractors/jobs" onClick={() => setShowJobPreview(false)}>
                  <Button variant="ghost" className="w-full gap-2 text-muted-foreground hover:text-foreground">
                    <Search className="h-4 w-4" />
                    View All Matching Jobs
                  </Button>
                </Link>
              </div>
            )}

            {/* Bid Tab */}
            {previewJob && previewTab === "bid" && (
              <div className="p-5">
                {previewBidSubmitted ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <AnimatePresence>
                      {previewBidSubmitted && (
                        <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden" aria-hidden="true">
                          {Array.from({ length: 60 }).map((_, i) => {
                            const left = Math.random() * 100;
                            const delay = Math.random() * 0.8;
                            const duration = 2.5 + Math.random() * 2;
                            const size = 6 + Math.random() * 8;
                            const rotation = Math.random() * 360;
                            const colors = [
                              "#22c55e", "#16a34a", "#facc15", "#f59e0b",
                              "#3b82f6", "#ec4899", "#f97316", "#8b5cf6",
                            ];
                            const color = colors[i % colors.length];
                            const shape = i % 3;

                            return (
                              <motion.div
                                key={`confetti-${i}`}
                                initial={{ y: -20, x: `${left}vw`, opacity: 1, rotate: rotation, scale: 1 }}
                                animate={{
                                  y: "110vh",
                                  rotate: rotation + 720,
                                  opacity: [1, 1, 0.8, 0],
                                  x: `${left + (Math.random() - 0.5) * 20}vw`,
                                }}
                                exit={{ opacity: 0 }}
                                transition={{ duration, delay, ease: "easeIn" }}
                                className="absolute"
                                style={{
                                  width: shape === 2 ? size * 0.6 : size,
                                  height: shape === 1 ? size * 0.6 : size,
                                  backgroundColor: color,
                                  borderRadius: shape === 0 ? "50%" : shape === 1 ? "2px" : "1px",
                                }}
                              />
                            );
                          })}
                        </div>
                      )}
                    </AnimatePresence>
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                      <CheckCircle2 className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-foreground">
                      {previewBidMode === "inspection_only" ? "Inspection Request Sent" : "Bid Submitted"}
                    </h3>
                    <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                      {previewBidMode === "inspection_only"
                        ? `Your inspection request has been sent to ${previewJob.homeownerName}. You'll need to place a bid through HomeBids after your visit.`
                        : `Your bid of $${Number(previewBidAmount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} has been sent to ${previewJob.homeownerName}. You'll be notified when they respond.`}
                    </p>
                    <div className="mt-6 flex gap-2">
                      <Button variant="outline" className="bg-transparent" onClick={() => setPreviewTab("chat")}>
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Send a Message
                      </Button>
                      <Button onClick={() => setShowJobPreview(false)}>Done</Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Bid Mode Toggle */}
                    <div>
                      <p className="mb-2 text-xs font-medium text-foreground">How would you like to respond?</p>
                      <div className="grid grid-cols-3 gap-2">
                        {(
                          [
                            { key: "bid_only" as const, label: "Bid Only", desc: "Submit a bid based on the job description", icon: DollarSign, activeColor: "border-green-500 bg-green-50 ring-1 ring-green-200", iconColor: "text-green-600", textColor: "text-green-800", descColor: "text-green-600" },
                            { key: "bid_and_inspection" as const, label: "Bid + Inspect", desc: "Submit a bid and schedule an on-site visit", icon: Eye, activeColor: "border-blue-500 bg-blue-50 ring-1 ring-blue-200", iconColor: "text-blue-600", textColor: "text-blue-800", descColor: "text-blue-600" },
                            { key: "inspection_only" as const, label: "Inspect First", desc: "Visit the site before committing to a bid", icon: Search, activeColor: "border-amber-500 bg-amber-50 ring-1 ring-amber-200", iconColor: "text-amber-600", textColor: "text-amber-800", descColor: "text-amber-600" },
                          ] as const
                        ).map((mode) => {
                          const ModeIcon = mode.icon;
                          const isActive = previewBidMode === mode.key;
                          return (
                            <button
                              key={mode.key}
                              type="button"
                              onClick={() => setPreviewBidMode(mode.key)}
                              className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-center transition-all ${
                                isActive
                                  ? mode.activeColor
                                  : "border-border bg-background hover:border-muted-foreground/40"
                              }`}
                            >
                              <ModeIcon className={`h-4 w-4 ${isActive ? mode.iconColor : "text-muted-foreground"}`} />
                              <span className={`text-[10px] font-semibold leading-tight sm:text-xs ${isActive ? mode.textColor : "text-foreground"}`}>
                                {mode.label}
                              </span>
                              <span className={`hidden text-[9px] leading-tight sm:block ${isActive ? mode.descColor : "text-muted-foreground"}`}>
                                {mode.desc}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Job Summary */}
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground">
                        {previewBidMode === "inspection_only" ? "Requesting inspection for" : "Bidding on"}
                      </p>
                      <p className="text-sm font-semibold text-foreground">{previewJob.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Budget: <span className={`font-medium ${previewJob.budget === "TBD - Insurance Paid" ? "text-blue-700" : "text-green-700"}`}>{previewJob.budget}</span>{previewJob.budget === "TBD - Insurance Paid" && " (inspection required)"} | Timeline: {previewJob.timeline}
                      </p>
                    </div>

                    {/* Inspection-Only Notice */}
                    {previewBidMode === "inspection_only" && (
                      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                        <p className="text-[10px] leading-relaxed text-amber-800 sm:text-xs">
                          You will provide an on-site inspection without committing to a bid amount. After inspection, you are required to place your bid through HomeBids.
                        </p>
                      </div>
                    )}

                    {/* Bid Amount & Timeline -- hidden for inspection_only */}
                    {previewBidMode !== "inspection_only" && (
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="preview-bid-amount" className="text-xs font-medium">Your Bid Amount</Label>
                          <div className="relative mt-1">
                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">$</span>
                            <Input
                              id="preview-bid-amount"
                              type="number"
                              placeholder="0.00"
                              value={previewBidAmount}
                              onChange={(e) => setPreviewBidAmount(e.target.value)}
                              className="pl-7"
                            />
                          </div>
                          {previewBidAmount && (
                            <p className="mt-1 text-[10px] text-muted-foreground">
                              ${Number(previewBidAmount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          )}
                        </div>

                        {/* Deposit */}
                        <div className="rounded-xl border border-border p-3">
                          <Label className="text-xs font-medium">Upfront Deposit</Label>
                          <p className="mt-0.5 text-[10px] text-muted-foreground">
                            Applied to total bid amount. Non-refundable.
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setPreviewBidNoDeposit(previewBidNoDeposit === true ? null : true);
                                setPreviewBidDepositAmount("");
                              }}
                              className={`rounded-lg border-2 px-2.5 py-1.5 text-[10px] font-medium transition-all ${
                                previewBidNoDeposit === true
                                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                  : "border-border text-muted-foreground hover:border-muted-foreground/50"
                              }`}
                            >
                              No Deposit
                            </button>
                            <span className="text-[10px] font-medium text-muted-foreground">OR</span>
                            <div className="flex flex-1 items-center gap-1">
                              <span className="text-xs text-muted-foreground">$</span>
                              <Input
                                type="number"
                                placeholder="Deposit amount"
                                value={previewBidDepositAmount}
                                onChange={(e) => { setPreviewBidDepositAmount(e.target.value); setPreviewBidNoDeposit(false); }}
                                className="h-8 text-xs"
                              />
                            </div>
                          </div>
                          {previewBidNoDeposit === false && previewBidDepositAmount && previewBidAmount && (
                            <p className="mt-2 text-[10px] text-muted-foreground">
                              Deposit of ${Number(previewBidDepositAmount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} covers material/labor costs upfront. Remaining balance: ${(Number(previewBidAmount) - Number(previewBidDepositAmount)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          )}
                        </div>

                        <div className="rounded-xl border border-border p-3">
                          <Label className="text-xs font-medium">Do You Offer Financing?</Label>
                          <p className="mt-0.5 text-[10px] text-muted-foreground">
                            Financing options available for homeowners
                          </p>
                          <div className="mt-2 flex gap-2">
                            <button
                              type="button"
                              onClick={() => setPreviewBidFinancing(previewBidFinancing === true ? null : true)}
                              className={`flex-1 rounded-lg border-2 px-2.5 py-1.5 text-[10px] font-medium transition-all ${
                                previewBidFinancing === true
                                  ? "border-blue-500 bg-blue-50 text-blue-700"
                                  : "border-border text-muted-foreground hover:border-muted-foreground/50"
                              }`}
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              onClick={() => setPreviewBidFinancing(previewBidFinancing === false ? null : false)}
                              className={`flex-1 rounded-lg border-2 px-2.5 py-1.5 text-[10px] font-medium transition-all ${
                                previewBidFinancing === false
                                  ? "border-gray-500 bg-gray-50 text-gray-700"
                                  : "border-border text-muted-foreground hover:border-muted-foreground/50"
                              }`}
                            >
                              No
                            </button>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="preview-bid-timeline" className="text-xs font-medium">Estimated Timeline</Label>
                          <Input
                            id="preview-bid-timeline"
                            placeholder="e.g. 2-3 days"
                            value={previewBidTimeline}
                            onChange={(e) => setPreviewBidTimeline(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    )}

                    {/* Message */}
                    <div>
                      <Label htmlFor="preview-bid-message" className="text-xs font-medium">Message to Homeowner</Label>
                      <Textarea
                        id="preview-bid-message"
                        placeholder={
                          previewBidMode === "inspection_only"
                            ? "Let the homeowner know what to expect during your inspection visit..."
                            : "Describe your experience, approach, and why you're a great fit..."
                        }
                        value={previewBidMessage}
                        onChange={(e) => setPreviewBidMessage(e.target.value)}
                        rows={3}
                        className="mt-1"
                      />
                    </div>

                    {/* Inspection Fee -- shown for bid_and_inspection and inspection_only */}
                    {previewBidMode !== "bid_only" && (
                      <div className="rounded-xl border border-border p-3">
                        <Label className="text-xs font-medium">Inspection Fee</Label>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          Free or fee amount
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (previewBidFreeInspection) {
                                setPreviewBidFreeInspection(false);
                              } else {
                                setPreviewBidFreeInspection(true);
                                setPreviewBidInspectionFee("");
                              }
                            }}
                            className={`rounded-lg border-2 px-2.5 py-1.5 text-[10px] font-medium transition-all ${
                              previewBidFreeInspection
                                ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                : "border-border text-muted-foreground hover:border-muted-foreground/50"
                            }`}
                          >
                            Free
                          </button>
                          <span className="text-[10px] font-medium text-muted-foreground">OR</span>
                          <div className="flex flex-1 items-center gap-1">
                            <span className="text-xs text-muted-foreground">$</span>
                            <Input
                              type="number"
                              placeholder="Fee amount"
                              value={previewBidInspectionFee}
                              onChange={(e) => { setPreviewBidInspectionFee(e.target.value); setPreviewBidFreeInspection(false); }}
                              className="h-8 text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <Button
                      className="w-full gap-2"
                      disabled={
                        previewBidMode === "inspection_only"
                          ? (!previewBidFreeInspection && !previewBidInspectionFee)
                          : (!previewBidAmount || !previewBidTimeline)
                      }
                      onClick={handlePreviewSubmitBid}
                    >
                      <Send className="h-4 w-4" />
                      {previewBidMode === "inspection_only" ? "Submit Inspection Request" : "Submit Bid"}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Chat Tab */}
            {previewJob && previewTab === "chat" && (
              <div className="flex h-full flex-col">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4">
                  {(() => {
                    const chatMsgs = previewChatMessages[previewJob.id] || [];
                    return chatMsgs.length === 0 ? (
                      <div className="flex h-full flex-col items-center justify-center py-10 text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                          <MessageCircle className="h-6 w-6 text-muted-foreground/50" />
                        </div>
                        <p className="mt-3 text-sm font-medium text-foreground">Ask a question</p>
                        <p className="mt-1 max-w-[220px] text-xs text-muted-foreground">
                          Ask {previewJob.homeownerName} about job details, access, scheduling, or anything before placing your bid.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {chatMsgs.map((msg) => (
                          <div key={msg.id} className={`flex ${msg.sender === "contractor" ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                              msg.sender === "contractor"
                                ? "rounded-br-md bg-primary text-primary-foreground"
                                : "rounded-bl-md bg-muted text-foreground"
                            }`}>
                              <p className="text-sm leading-relaxed">{msg.text}</p>
                              <p className={`mt-1 text-[10px] ${msg.sender === "contractor" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                                {msg.time.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                {/* Chat Input */}
                <div className="border-t border-border p-3">
                  <form
                    onSubmit={(e) => { e.preventDefault(); handlePreviewSendChat(); }}
                    className="flex items-end gap-2"
                  >
                    <Textarea
                      placeholder="Type your question..."
                      value={previewChatInput}
                      onChange={(e) => setPreviewChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handlePreviewSendChat();
                        }
                      }}
                      className="min-h-[42px] max-h-[100px] flex-1 resize-none rounded-2xl px-4 py-2.5 text-sm"
                      rows={1}
                    />
                    <button
                      type="submit"
                      disabled={!previewChatInput.trim()}
                      className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all hover:opacity-90 active:scale-95 disabled:opacity-40"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Bid Confirmation Dialog */}
      <Dialog open={showBidConfirm} onOpenChange={setShowBidConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {previewBidMode === "inspection_only" ? "Confirm Inspection Request" : "Confirm Your Bid"}
            </DialogTitle>
            <DialogDescription>
              Please review the details below before submitting.
            </DialogDescription>
          </DialogHeader>
          {previewJob && (
            <div className="space-y-4">
              {/* Type badge */}
              <div className="flex justify-center">
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                  previewBidMode === "bid_only"
                    ? "bg-green-50 text-green-700"
                    : previewBidMode === "bid_and_inspection"
                    ? "bg-blue-50 text-blue-700"
                    : "bg-amber-50 text-amber-700"
                }`}>
                  {previewBidMode === "bid_only" ? "Bid Only" : previewBidMode === "bid_and_inspection" ? "Bid + Inspection" : "Inspection Only"}
                </span>
              </div>

              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-xs text-muted-foreground">Job</p>
                <p className="text-sm font-semibold text-foreground">{previewJob.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{previewJob.location}</p>
              </div>

              {/* Bid amount & timeline -- not shown for inspection_only */}
              {previewBidMode !== "inspection_only" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-green-50 p-3">
                    <p className="text-[10px] font-medium text-green-600">Your Bid</p>
                    <p className="mt-1 text-lg font-bold text-green-700">
                      ${Number(previewBidAmount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="rounded-lg bg-blue-50 p-3">
                    <p className="text-[10px] font-medium text-blue-600">Timeline</p>
                    <p className="mt-1 text-lg font-bold text-blue-700">{previewBidTimeline}</p>
                  </div>
                </div>
              )}

              {/* Deposit -- shown when bid mode is not inspection_only */}
              {previewBidMode !== "inspection_only" && previewBidNoDeposit !== null && (
                <div className={`flex items-center gap-2 rounded-lg p-3 ${
                  previewBidNoDeposit === true ? "bg-emerald-50" : "bg-violet-50"
                }`}>
                  <CreditCard className={`h-4 w-4 ${previewBidNoDeposit === true ? "text-emerald-600" : "text-violet-600"}`} />
                  <div>
                    <p className={`text-sm font-medium ${previewBidNoDeposit === true ? "text-emerald-700" : "text-violet-700"}`}>
                      {previewBidNoDeposit === true ? "No Deposit Required" : `$${Number(previewBidDepositAmount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Deposit`}
                    </p>
                    {previewBidNoDeposit === false && previewBidDepositAmount && (
                      <p className="text-[10px] text-violet-600">Non-refundable. Applied to total bid amount.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Financing -- shown when selected */}
              {previewBidFinancing !== null && (
                <div className={`flex items-center gap-2 rounded-lg p-3 ${
                  previewBidFinancing ? "bg-blue-50" : "bg-gray-50"
                }`}>
                  <DollarSign className={`h-4 w-4 ${previewBidFinancing ? "text-blue-600" : "text-gray-600"}`} />
                  <p className={`text-sm font-medium ${previewBidFinancing ? "text-blue-700" : "text-gray-700"}`}>
                    {previewBidFinancing ? "Financing Available" : "No Financing"}
                  </p>
                </div>
              )}

              {/* Inspection fee -- shown for bid_and_inspection and inspection_only */}
              {previewBidMode !== "bid_only" && (previewBidFreeInspection || previewBidInspectionFee) && (
                <div className={`flex items-center gap-2 rounded-lg p-3 ${
                  previewBidFreeInspection ? "bg-emerald-50" : "bg-amber-50"
                }`}>
                  <Eye className={`h-4 w-4 ${previewBidFreeInspection ? "text-emerald-600" : "text-amber-600"}`} />
                  <p className={`text-sm font-medium ${previewBidFreeInspection ? "text-emerald-700" : "text-amber-700"}`}>
                    {previewBidFreeInspection ? "Free Inspection" : `$${Number(previewBidInspectionFee).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Inspection Fee`}
                  </p>
                </div>
              )}

              {/* Inspection-only reminder */}
              {previewBidMode === "inspection_only" && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <p className="text-xs leading-relaxed text-amber-800">
                    After your on-site inspection, you will be required to submit a bid through HomeBids.
                  </p>
                </div>
              )}

              {previewBidMessage && (
                <div className="rounded-lg border border-border p-3">
                  <p className="text-[10px] font-medium text-muted-foreground">Your Message</p>
                  <p className="mt-1 text-xs leading-relaxed text-foreground">{previewBidMessage}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={() => setShowBidConfirm(false)}
                >
                  Go Back
                </Button>
                <Button
                  className="flex-1 gap-2"
                  onClick={handleConfirmBidSubmit}
                >
                  <Send className="h-4 w-4" />
                  {previewBidMode === "inspection_only" ? "Confirm Request" : "Confirm & Send"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ScrollToTop />
    </div>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
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
  Edit3,
  MessageCircle,
  Eye,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  TrendingUp,
  Users,
  FileText,
  X,
  CreditCard,
  Send,
  ArrowLeft,
  Calculator,
  ChevronDown,
  ImageIcon,
  Loader2,
  Copy,
  Sparkles,
  Lock,
  Unlock,
  ChevronRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { getContractorBids } from "@/lib/supabase/actions";
import { createClient } from "@/lib/supabase/client";
import { getContractorBids as getDemoContractorBids } from "@/lib/demo/services";
import { DEMO_CONTRACTOR_EMAIL } from "@/lib/demo-guard";
import { getMockUser, USE_MOCK_DATA } from "@/lib/mock-auth";

interface ActiveBid {
  id: string;
  job_id: string;
  jobTitle: string;
  jobDescription: string;
  homeownerLocation: string;
  homeownerName: string;
  homeownerPhone?: string; // only populated for contractor-owned or approved leads
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
  leadSource?: "contractor" | "homebids"; // "homebids" = relay required before approval
  directMessagingUnlocked?: boolean; // true once homeowner approves
}

interface Message {
  id: string;
  text: string;
  sender: "contractor" | "homeowner";
  timestamp: Date;
}

// ── HomeBids AI Leads ──────────────────────────────────────────────────────────
interface HomeBidsLead {
  id: string;
  title: string;
  category: string;
  location: string;
  estimatedValue: string;
  timeline: string;
  status: "new" | "bid_submitted" | "homeowner_reviewing";
  directMessagingUnlocked: boolean;
  homeownerName: string;
  homeownerGoals: string;
  scope: string;
  budgetRange: string;
  aiNotes: string;
  suggestedStrategy: string;
  recommendedPrice: string;
  suggestedResponse: string;
  objections: string[];
  nextAction: string;
  homeownerPhone?: string;
}

const DEMO_HOMEBIDS_LEADS: HomeBidsLead[] = [
  {
    id: "hbl-1",
    title: "Kitchen Cabinet Repaint",
    category: "Interior Painting",
    location: "Gilbert, AZ 85296",
    estimatedValue: "$1,200–$1,800",
    timeline: "1–2 weeks",
    status: "new",
    directMessagingUnlocked: false,
    homeownerName: "Jennifer T.",
    homeownerGoals: "Wants fresh, modern look — considering white or greige. Has kids so wants low-VOC paint.",
    scope: "Upper and lower cabinets (32 doors), light sanding, primer, 2 coats. No hardware replacement.",
    budgetRange: "$1,000–$2,000",
    aiNotes: "Comparable Gilbert jobs this month averaged $1,450. Homeowner mentioned urgency — reply fast.",
    suggestedStrategy: "Lead with low-VOC eco angle. Offer a free color consult to differentiate.",
    recommendedPrice: "$1,350–$1,600",
    suggestedResponse: "Hi Jennifer, I'd love to help refresh your cabinets with a low-VOC finish that's safe for your kids. I specialize in cabinet repaints in the Gilbert area and can get started within the week.",
    objections: ["Too expensive — counter with longevity vs. full replacement cost", "Timeline concern — offer flexible scheduling"],
    nextAction: "Generate Bid",
  },
  {
    id: "hbl-2",
    title: "Backyard Turf Install",
    category: "Landscaping",
    location: "Chandler, AZ 85226",
    estimatedValue: "$6,500–$9,000",
    timeline: "2–3 weeks",
    status: "bid_submitted",
    directMessagingUnlocked: false,
    homeownerName: "Marcus D.",
    homeownerGoals: "Replace dead grass with low-maintenance turf. Has two dogs.",
    scope: "Approx 800 sqft, existing sod removal, base prep, pet-friendly turf install, border edging.",
    budgetRange: "$6,000–$10,000",
    aiNotes: "Bid already submitted at $7,800. Homeowner viewed bid twice but hasn't responded. Consider follow-up.",
    suggestedStrategy: "Highlight pet-friendly turf warranty and drainage. Follow up within 24h.",
    recommendedPrice: "$7,500–$8,200",
    suggestedResponse: "Hi Marcus, following up on my turf proposal. Happy to answer any questions about the pet-safe material or drainage setup.",
    objections: ["HOA approval needed — offer to provide product spec sheet", "Price — emphasize 10-year lifespan vs. annual lawn care costs"],
    nextAction: "Message via HomeBids AI",
  },
  {
    id: "hbl-3",
    title: "Bathroom Vanity Replacement",
    category: "Plumbing / Remodel",
    location: "Mesa, AZ 85201",
    estimatedValue: "$850–$1,400",
    timeline: "1 week",
    status: "homeowner_reviewing",
    directMessagingUnlocked: true,
    homeownerName: "Rachel S.",
    homeownerGoals: "Upgrade dated single vanity to double. Wants modern farmhouse style.",
    scope: "Remove existing vanity, install customer-supplied 60\" double vanity, reconnect plumbing, patch drywall.",
    budgetRange: "$700–$1,500",
    aiNotes: "Homeowner approved direct contact. Follow up by phone or text today.",
    suggestedStrategy: "She's close to deciding. Text directly and confirm availability this week.",
    recommendedPrice: "$950–$1,200",
    suggestedResponse: "Hi Rachel, just checking in on the vanity project — I have availability this week and can get started right away.",
    objections: ["Scheduling — she wants it done before a family visit"],
    nextAction: "Text Homeowner",
    homeownerPhone: "",
  },
];

// ── My Leads ──────────────────────────────────────────────────────────────────
interface MyLead {
  id: string;
  customerName: string;
  projectTitle: string;
  category: string;
  estimatedValue: string;
  status: "open" | "in_progress";
  lastActivity: string;
  aiStatus: "estimate_ready" | "response_sent" | "followup_ready";
  phone?: string;
}

const DEMO_MY_LEADS: MyLead[] = [
  { id: "ml-1", customerName: "Sarah M.", projectTitle: "Interior Paint Estimate", category: "Interior Painting", estimatedValue: "$2,400", status: "open", lastActivity: "Waiting on estimate", aiStatus: "estimate_ready" },
  { id: "ml-2", customerName: "Mike R.", projectTitle: "Drywall Repair Response", category: "Drywall", estimatedValue: "$380", status: "in_progress", lastActivity: "Sent response — awaiting reply", aiStatus: "response_sent" },
  { id: "ml-3", customerName: "Janet B.", projectTitle: "Bathroom Remodel Follow-Up", category: "Remodel", estimatedValue: "$12,000", status: "open", lastActivity: "Follow-up draft ready", aiStatus: "followup_ready" },
];

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

  // Auth guard — mock mode skips all Supabase calls and never redirects.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (USE_MOCK_DATA) {
      const user = getMockUser();
      if (!user) {
        window.location.replace("/auth/sign-in");
      }
      // Contractor is authenticated in mock mode — nothing else to check.
      return;
    }

    let didRedirect = false;
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user }, error }) => {
      if (error || !user) {
        if (!didRedirect) { didRedirect = true; window.location.replace("/auth/sign-in"); }
        return;
      }
      if (user.email === DEMO_CONTRACTOR_EMAIL) return;
      const { data: profile } = await supabase
        .from("contractor_profiles")
        .select("approval_status")
        .eq("id", user.id)
        .maybeSingle();
      if (!profile) {
        if (!didRedirect) { didRedirect = true; window.location.replace("/"); }
        return;
      }
      if (profile.approval_status === "pending") {
        if (!didRedirect) { didRedirect = true; window.location.replace("/contractors/signup/pending"); }
        return;
      }
      if (profile.approval_status === "rejected") {
        if (!didRedirect) { didRedirect = true; window.location.replace("/contractors/signup/rejected"); }
      }
    });
  }, []);

  // Load bids — mock mode always uses pre-seeded demo data, no Supabase call.
  useEffect(() => {
    setBidsLoading(true);
    ;(async () => {
      if (USE_MOCK_DATA) {
        const { bids: demoBids } = await getDemoContractorBids();
        setBids((demoBids ?? []).map((b) => mapBidFromDb(b as Record<string, unknown>)));
        setBidsLoading(false);
        return;
      }

      if (typeof window !== "undefined" && window.location.hostname.includes("vusercontent.net")) {
        setBidsLoading(false);
        return;
      }

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email === DEMO_CONTRACTOR_EMAIL) {
        const { bids: demoBids } = await getDemoContractorBids();
        setBids((demoBids ?? []).map((b) => mapBidFromDb(b as Record<string, unknown>)));
        setBidsLoading(false);
        return;
      }
      const { bids: rawBids, error } = await getContractorBids();
      if (error) {
        setBidsError(error);
      } else {
        setBids((rawBids ?? []).map((b) => mapBidFromDb(b as Record<string, unknown>)));
      }
      setBidsLoading(false);
    })();
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

  // Tab state — reads from ?tab= search param (homebids | myleads | bids)
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get("tab") ?? "";
  const [activeTab, setActiveTab] = useState<"homebids" | "myleads">(
    tabParam === "myleads" ? "myleads" : "homebids"
  );

  // Lead detail modal state
  const [selectedLead, setSelectedLead] = useState<HomeBidsLead | null>(null);
  const [showLeadDetail, setShowLeadDetail] = useState(false);
  const [relayLeadMessage, setRelayLeadMessage] = useState("");
  const [relayLeadSent, setRelayLeadSent] = useState(false);
  const [showRelayLeadModal, setShowRelayLeadModal] = useState(false);

  // Messenger state
  const [showMessenger, setShowMessenger] = useState(false);
  const [messagingBid, setMessagingBid] = useState<ActiveBid | null>(null);
  const [newMessage, setNewMessage] = useState("");

  // Legacy relay state — no longer triggered from UI but kept for type-safety


  // Payout calculator state removed — contractors keep 100% with no success fees
  // Messages start empty — never seed with fake threads tied to hardcoded bid IDs.
  // Real message history is not yet persisted server-side; this is a UI-only state.
  const [messages, setMessages] = useState<Record<string, Message[]>>({});

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

  const stats = {
    open: statOf("open"),
    in_progress: statOf("in_progress"),
    completed: statOf("completed"),
    not_selected: statOf("not_selected"),
  };

  const totalPipeline =
    bidsByStatus.open.reduce((sum, b) => sum + b.bidAmount, 0) +
    bidsByStatus.in_progress.reduce((sum, b) => sum + b.bidAmount, 0);

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
                    ${totalPipeline.toLocaleString()}
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
                          <div className="bg-blue-500 transition-all" style={{ width: `${(stats.open.value / (totalPipeline || 1)) * 100}%` }} title={`Open: $${stats.open.value.toLocaleString()}`} />
                        )}
                        {stats.in_progress.value > 0 && (
                          <div className="bg-amber-500 transition-all" style={{ width: `${(stats.in_progress.value / (totalPipeline || 1)) * 100}%` }} title={`In Progress: $${stats.in_progress.value.toLocaleString()}`} />
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

            {/* Lead Count KPI Cards */}
            <div className="mb-4 grid grid-cols-2 gap-3">
              <motion.button
                type="button"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                onClick={() => setActiveTab("homebids")}
                className={`rounded-xl border p-3 text-left transition-all ${
                  activeTab === "homebids"
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                    : "border-border bg-card hover:border-primary/30 hover:shadow-sm"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${activeTab === "homebids" ? "bg-primary/20" : "bg-muted"}`}>
                    <Sparkles className={`h-4 w-4 ${activeTab === "homebids" ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <p className={`text-xs font-medium ${activeTab === "homebids" ? "text-primary" : "text-muted-foreground"}`}>HomeBids AI Leads</p>
                </div>
                <p className={`mt-2 text-2xl font-bold ${activeTab === "homebids" ? "text-primary" : "text-foreground"}`}>
                  {DEMO_HOMEBIDS_LEADS.length}
                </p>
                <p className="text-[10px] text-muted-foreground">{DEMO_HOMEBIDS_LEADS.filter(l => l.status === "new").length} new</p>
              </motion.button>

              <motion.button
                type="button"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                onClick={() => setActiveTab("myleads")}
                className={`rounded-xl border p-3 text-left transition-all ${
                  activeTab === "myleads"
                    ? "border-emerald-400 bg-emerald-50/50 ring-2 ring-emerald-300/40 shadow-sm"
                    : "border-border bg-card hover:border-emerald-300 hover:shadow-sm"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${activeTab === "myleads" ? "bg-emerald-100" : "bg-muted"}`}>
                    <Users className={`h-4 w-4 ${activeTab === "myleads" ? "text-emerald-600" : "text-muted-foreground"}`} />
                  </div>
                  <p className={`text-xs font-medium ${activeTab === "myleads" ? "text-emerald-700" : "text-muted-foreground"}`}>My Leads</p>
                </div>
                <p className={`mt-2 text-2xl font-bold ${activeTab === "myleads" ? "text-emerald-700" : "text-foreground"}`}>
                  {DEMO_MY_LEADS.length}
                </p>
                <p className="text-[10px] text-muted-foreground">{DEMO_MY_LEADS.filter(l => l.status === "open").length} open</p>
              </motion.button>
            </div>

            {/* Earnings Breakdown KPI cards */}
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
                    className={`rounded-xl border transition-all ${stage.key === "completed" ? "col-span-2 lg:col-span-1" : ""} ${isExpanded ? `${stage.borderActive} ${stage.bgActive}` : `${stage.border} ${stage.bg} ${stage.hoverBorder} hover:shadow-sm`}`}
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

            {/* AI Generated Bids preview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-6"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground sm:text-base">Your AI Generated Bids</h3>
                </div>
                <Link href="/contractors/bids" className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                  See All <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <AiGeneratedBidsSection preview />
            </motion.div>
          </div>

          {/* Leads Tabs Section */}
          <div className={showMobileDetail ? "hidden lg:block" : "block"}>
            {/* Tab Bar */}
            <div className="mb-6 flex gap-1 rounded-xl bg-muted p-1">
              <button
                type="button"
                onClick={() => setActiveTab("homebids")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  activeTab === "homebids"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                HomeBids AI Leads
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${activeTab === "homebids" ? "bg-primary/10 text-primary" : "bg-muted-foreground/20 text-muted-foreground"}`}>
                  {DEMO_HOMEBIDS_LEADS.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("myleads")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  activeTab === "myleads"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                My Leads
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${activeTab === "myleads" ? "bg-emerald-100 text-emerald-700" : "bg-muted-foreground/20 text-muted-foreground"}`}>
                  {DEMO_MY_LEADS.length}
                </span>
              </button>
            </div>

            {/* HomeBids AI Leads Tab */}
            {activeTab === "homebids" && (
              <div>
                <p className="mb-4 text-xs text-muted-foreground">
                  Leads sourced by HomeBids — win homeowner approval before texting directly.
                </p>
                <div className="space-y-4">
                  {DEMO_HOMEBIDS_LEADS.map((lead) => {
                    const statusBadge =
                      lead.status === "new"
                        ? { label: "New", class: "bg-blue-100 text-blue-700" }
                        : lead.status === "bid_submitted"
                        ? { label: "Bid Submitted", class: "bg-amber-100 text-amber-700" }
                        : { label: "Reviewing", class: "bg-purple-100 text-purple-700" };
                    return (
                      <motion.div
                        key={lead.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-semibold text-foreground">{lead.title}</h3>
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusBadge.class}`}>
                                {statusBadge.label}
                              </span>
                              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                {lead.category}
                              </span>
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 shrink-0" />
                                {lead.location}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3 shrink-0" />
                                {lead.timeline}
                              </span>
                              <span className="font-semibold text-foreground">{lead.estimatedValue}</span>
                            </div>
                            <div className="mt-2 flex items-center gap-1.5">
                              {lead.directMessagingUnlocked ? (
                                <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                                  <Unlock className="h-3 w-3" />
                                  Direct texting unlocked
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                                  <Lock className="h-3 w-3" />
                                  Contact locked — win approval first
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 gap-1 px-2.5 text-xs bg-transparent"
                            onClick={() => { setSelectedLead(lead); setShowLeadDetail(true); }}
                          >
                            <Eye className="h-3 w-3" />
                            View Details
                          </Button>
                          {!lead.directMessagingUnlocked ? (
                            <>
                              <Button size="sm" className="h-7 gap-1 px-2.5 text-xs">
                                <Calculator className="h-3 w-3" />
                                Generate Bid
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 gap-1 px-2.5 text-xs bg-transparent"
                                onClick={() => {
                                  setSelectedLead(lead);
                                  setRelayLeadMessage("");
                                  setRelayLeadSent(false);
                                  setShowRelayLeadModal(true);
                                }}
                              >
                                <MessageCircle className="h-3 w-3" />
                                Message via HomeBids AI
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              className="h-7 gap-1 px-2.5 text-xs bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => { window.location.href = `sms:${lead.homeownerPhone ?? ""}`; }}
                            >
                              <MessageCircle className="h-3 w-3" />
                              Text Homeowner
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* My Leads Tab */}
            {activeTab === "myleads" && (
              <div>
                <p className="mb-4 text-xs text-muted-foreground">
                  Your own leads — full control, text directly any time.
                </p>
                <div className="space-y-4">
                  {DEMO_MY_LEADS.map((lead) => {
                    const aiStatusBadge =
                      lead.aiStatus === "estimate_ready"
                        ? { label: "Estimate Ready", class: "bg-blue-100 text-blue-700" }
                        : lead.aiStatus === "response_sent"
                        ? { label: "Response Sent", class: "bg-amber-100 text-amber-700" }
                        : { label: "Follow-Up Ready", class: "bg-purple-100 text-purple-700" };
                    return (
                      <motion.div
                        key={lead.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl border border-border bg-card p-4 transition-all hover:border-emerald-300 hover:shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                                {lead.customerName.charAt(0)}
                              </div>
                              <div>
                                <p className="font-semibold text-foreground">{lead.customerName}</p>
                                <p className="text-xs text-muted-foreground">{lead.projectTitle}</p>
                              </div>
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                {lead.category}
                              </span>
                              <span className="font-semibold text-sm text-foreground">{lead.estimatedValue}</span>
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${aiStatusBadge.class}`}>
                                {aiStatusBadge.label}
                              </span>
                            </div>
                            <p className="mt-1.5 text-[11px] text-muted-foreground">{lead.lastActivity}</p>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" className="h-7 gap-1 px-2.5 text-xs bg-transparent">
                            <Eye className="h-3 w-3" />
                            View Lead
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 gap-1 px-2.5 text-xs bg-transparent">
                            <Calculator className="h-3 w-3" />
                            Generate Estimate
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 gap-1 px-2.5 text-xs bg-transparent">
                            <FileText className="h-3 w-3" />
                            Generate Response
                          </Button>
                          <Button
                            size="sm"
                            className="h-7 gap-1 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => { window.location.href = `sms:${lead.phone ?? ""}`; }}
                          >
                            <MessageCircle className="h-3 w-3" />
                            Text Customer
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Bid Detail Panel (kept for clicking KPI pipeline bids) */}
          {showMobileDetail && (
          <div ref={detailPanelRef} className="block lg:hidden">{/* mobile detail shown inline if a pipeline bid is selected */}</div>
          )}
          {selectedBid && (
          <div ref={detailPanelRef} className={`mt-6 lg:sticky lg:top-8 lg:self-start ${showMobileDetail ? "block" : "hidden"}`}>
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedBid.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="rounded-xl border border-border bg-card overflow-y-auto max-h-[calc(100vh-4rem)] lg:max-h-[calc(100vh-14rem)]"
              >
                {/* Mobile Back Button */}
                <div className="flex items-center gap-3 border-b border-border p-4 lg:hidden">
                  <Button variant="ghost" size="sm" onClick={handleBackToList} className="gap-2 bg-transparent">
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                </div>
                {/* Detail Header */}
                <div className="border-b border-border p-6">
                  <div className="flex flex-col items-center text-center lg:flex-row lg:items-start lg:justify-between lg:text-left">
                    <div>
                      <h3 className="text-xl font-bold text-foreground">{selectedBid.jobTitle}</h3>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${statusConfig[selectedBid.status].color}`}>
                          {statusConfig[selectedBid.status].label}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap justify-center gap-2 lg:mt-0">
                      {selectedBid.status === "open" && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => handleEditBid(selectedBid)} className="gap-1.5 bg-transparent">
                            <Edit3 className="h-4 w-4" />
                            Edit
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDeleteClick(selectedBid)} className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive bg-transparent">
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
                  <h4 className="mb-3 font-semibold text-foreground">Job Details</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{selectedBid.jobDescription}</p>
                  {selectedBid.imageCount > 0 && (
                    <button type="button" className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20">
                      <ImageIcon className="h-3.5 w-3.5" />
                      See Images ({selectedBid.imageCount} photos)
                    </button>
                  )}
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground">Budget Range</p>
                      <p className="mt-1 font-semibold text-foreground">{selectedBid.jobBudget}</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground">Timeline</p>
                      <p className="mt-1 font-semibold text-foreground">{selectedBid.jobTimeline}</p>
                    </div>
                  </div>
                </div>
                {/* Your Bid */}
                <div className="border-b border-border p-6">
                  <h4 className="mb-3 font-semibold text-foreground">Your Bid</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg bg-green-50 p-4">
                      <p className="text-xs text-green-600">Your Price</p>
                      <p className="mt-1 text-2xl font-bold text-green-700">${selectedBid.bidAmount.toLocaleString()}</p>
                    </div>
                    <div className="rounded-lg bg-blue-50 p-4">
                      <p className="text-xs text-blue-600">Your Timeline</p>
                      <p className="mt-1 text-2xl font-bold text-blue-700">{selectedBid.timeline}</p>
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
                    onClick={() => { handleOpenMessenger(selectedBid); }}
                  >
                    <MessageCircle className="h-4 w-4" />
                    Message via HomeBids AI
                  </Button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
          )}
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

      {/* HomeBids AI Relay Modal (for leads) */}
      <Dialog open={showRelayLeadModal} onOpenChange={(open) => { if (!open) setShowRelayLeadModal(false); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Message via HomeBids AI</DialogTitle>
            <DialogDescription>
              Your message will be relayed through HomeBids AI. The homeowner&apos;s contact info stays private until they approve direct messaging.
            </DialogDescription>
          </DialogHeader>
          {relayLeadSent ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
              <p className="font-semibold text-foreground">Message sent via HomeBids AI</p>
              <p className="text-sm text-muted-foreground">
                The homeowner will receive your message through our relay system. You&apos;ll be notified when they respond or approve direct contact.
              </p>
              <Button className="mt-2 w-full" onClick={() => setShowRelayLeadModal(false)}>
                Done
              </Button>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="relay-lead-message">Your message</Label>
                <Textarea
                  id="relay-lead-message"
                  value={relayLeadMessage}
                  onChange={(e) => setRelayLeadMessage(e.target.value)}
                  rows={4}
                  placeholder={selectedLead?.suggestedResponse ?? "Hi, I wanted to follow up on your project..."}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                HomeBids AI will relay this message to the homeowner on your behalf. Once they approve, direct SMS access will be unlocked.
              </p>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowRelayLeadModal(false)} className="bg-transparent">Cancel</Button>
                <Button disabled={!relayLeadMessage.trim()} onClick={() => setRelayLeadSent(true)}>
                  <Send className="mr-2 h-4 w-4" />
                  Send via AI Relay
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* HomeBids Lead Detail Modal */}
      <Dialog open={showLeadDetail} onOpenChange={setShowLeadDetail}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              {selectedLead?.title}
            </DialogTitle>
            <DialogDescription>{selectedLead?.category} — {selectedLead?.location}</DialogDescription>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-4 pt-1">
              {/* Value + timeline */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-green-50 p-3">
                  <p className="text-[10px] font-medium text-green-600">Estimated Value</p>
                  <p className="mt-1 text-lg font-bold text-green-700">{selectedLead.estimatedValue}</p>
                </div>
                <div className="rounded-lg bg-blue-50 p-3">
                  <p className="text-[10px] font-medium text-blue-600">Timeline</p>
                  <p className="mt-1 text-lg font-bold text-blue-700">{selectedLead.timeline}</p>
                </div>
              </div>

              {/* Homeowner goals */}
              <div className="rounded-lg border border-border p-3">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Homeowner Goals</p>
                <p className="text-sm text-foreground">{selectedLead.homeownerGoals}</p>
              </div>

              {/* Scope */}
              <div className="rounded-lg border border-border p-3">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Scope of Work</p>
                <p className="text-sm text-foreground">{selectedLead.scope}</p>
              </div>

              {/* Budget + AI notes */}
              <div className="rounded-lg border border-border p-3">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Budget Range</p>
                <p className="text-sm font-semibold text-foreground">{selectedLead.budgetRange}</p>
              </div>

              <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-primary/70">AI Notes</p>
                <p className="text-sm text-foreground">{selectedLead.aiNotes}</p>
              </div>

              {/* Suggested strategy */}
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-amber-700">Suggested Strategy</p>
                <p className="text-sm text-amber-900">{selectedLead.suggestedStrategy}</p>
              </div>

              {/* Recommended price */}
              <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-green-700">Recommended Price Range</p>
                <p className="text-lg font-bold text-green-700">{selectedLead.recommendedPrice}</p>
              </div>

              {/* Suggested response */}
              <div className="rounded-lg border border-border p-3">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Suggested Response</p>
                <p className="text-sm italic text-foreground">&quot;{selectedLead.suggestedResponse}&quot;</p>
              </div>

              {/* Objections */}
              <div className="rounded-lg border border-border p-3">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Objection Handling Tips</p>
                <ul className="space-y-1">
                  {selectedLead.objections.map((obj, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                      <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                      {obj}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 pt-1">
                <Button className="w-full gap-2">
                  <Calculator className="h-4 w-4" />
                  Generate Bid
                </Button>
                {!selectedLead.directMessagingUnlocked ? (
                  <Button
                    variant="outline"
                    className="w-full gap-2 bg-transparent"
                    onClick={() => {
                      setRelayLeadMessage(selectedLead.suggestedResponse);
                      setRelayLeadSent(false);
                      setShowLeadDetail(false);
                      setTimeout(() => setShowRelayLeadModal(true), 150);
                    }}
                  >
                    <MessageCircle className="h-4 w-4" />
                    Message via HomeBids AI
                  </Button>
                ) : (
                  <Button
                    className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => { window.location.href = `sms:${selectedLead.homeownerPhone ?? ""}`; }}
                  >
                    <MessageCircle className="h-4 w-4" />
                    Text Homeowner
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ScrollToTop />
    </div>
  );
}

// ── AiGeneratedBidsSection ─────────────────────────────────────────────────────
interface AiBid {
  id: string;
  title: string;
  type: "estimate" | "template" | "response" | "draft";
  summary: string;
  amount?: string;
  createdAt: Date;
}

// Offsets in ms — applied to Date.now() inside the component after mount
// so server and client produce the same output on first render.
const DEMO_AI_BID_TEMPLATES = [
  { id: "ai-1", title: "HVAC Repair Estimate",          type: "estimate"  as const, summary: "3-zone system diagnostic, refrigerant recharge, and capacitor replacement. Labor + parts included.", amount: "$485",           offsetMs: 1000 * 60 * 30 },
  { id: "ai-2", title: "Roof Leak Repair Response",     type: "response"  as const, summary: "Professional reply addressing homeowner concerns about storm damage liability and warranty coverage.",                           offsetMs: 1000 * 60 * 60 * 3 },
  { id: "ai-3", title: "Bathroom Remodel Bid Template", type: "template"  as const, summary: "Full gut remodel template — demo, tile, plumbing rough-in, fixtures, and paint. Customizable for any scope.", amount: "$8,200–$14,000", offsetMs: 1000 * 60 * 60 * 24 },
  { id: "ai-4", title: "Fence Replacement Draft",       type: "draft"     as const, summary: "Draft estimate for 180ft cedar privacy fence replacement. Awaiting final material pricing.", amount: "$3,400",                offsetMs: 1000 * 60 * 60 * 48 },
];

const typeBadge: Record<AiBid["type"], { label: string; class: string }> = {
  estimate:  { label: "Estimate",  class: "bg-blue-100 text-blue-700" },
  template:  { label: "Template",  class: "bg-purple-100 text-purple-700" },
  response:  { label: "Response",  class: "bg-amber-100 text-amber-700" },
  draft:     { label: "Draft",     class: "bg-gray-100 text-gray-600" },
};

function AiGeneratedBidsSection({ preview = false }: { preview?: boolean }) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  // Build dates after mount so server and client agree on the initial render.
  const [bids, setBids] = useState<AiBid[]>(() =>
    DEMO_AI_BID_TEMPLATES.map(({ offsetMs, ...rest }) => ({
      ...rest,
      createdAt: new Date(0), // stable placeholder — replaced after mount
    }))
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const now = Date.now();
    setBids(
      DEMO_AI_BID_TEMPLATES.map(({ offsetMs, ...rest }) => ({
        ...rest,
        createdAt: new Date(now - offsetMs),
      }))
    );
    setMounted(true);
  }, []);

  const displayBids = preview ? bids.slice(0, 3) : bids;

  const handleCopy = (id: string, summary: string) => {
    navigator.clipboard.writeText(summary).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendSms = (bid: AiBid) => {
    const body = encodeURIComponent(`${bid.title}\n\n${bid.summary}${bid.amount ? `\n\nTotal: ${bid.amount}` : ""}`);
    window.location.href = `sms:?&body=${body}`;
  };

  const formatRelative = (date: Date) => {
    const mins = Math.round((Date.now() - date.getTime()) / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.round(hrs / 24)}d ago`;
  };

  return (
    <div className="space-y-3">
      {displayBids.map((bid) => {
        const badge = typeBadge[bid.type];
        const isCopied = copiedId === bid.id;
        return (
          <div key={bid.id} className="rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{bid.title}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${badge.class}`}>{badge.label}</span>
                </div>
                {bid.amount && (
                  <p className="mt-0.5 text-sm font-bold text-primary">{bid.amount}</p>
                )}
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground line-clamp-2">{bid.summary}</p>
              </div>
              {/* Suppress until mounted to avoid server/client mismatch */}
              {mounted && (
                <span className="shrink-0 text-[10px] text-muted-foreground">{formatRelative(bid.createdAt)}</span>
              )}
            </div>

            {/* Action row */}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" className="h-7 gap-1 px-2.5 text-xs">
                <Eye className="h-3 w-3" />
                View
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 gap-1 px-2.5 text-xs"
                onClick={() => handleCopy(bid.id, bid.summary)}
              >
                {isCopied ? <CheckCircle2 className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                {isCopied ? "Copied" : "Copy"}
              </Button>
              <Button size="sm" variant="outline" className="h-7 gap-1 px-2.5 text-xs">
                <Edit3 className="h-3 w-3" />
                Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 gap-1 px-2.5 text-xs"
                onClick={() => handleSendSms(bid)}
              >
                <MessageCircle className="h-3 w-3" />
                Send via SMS
              </Button>
              <Button size="sm" variant="outline" className="h-7 gap-1 px-2.5 text-xs">
                <FileText className="h-3 w-3" />
                Export PDF
              </Button>
            </div>
          </div>
        );
      })}

      <Button variant="outline" size="sm" className="mt-1 w-full gap-1.5 text-xs">
        <Calculator className="h-3.5 w-3.5" />
        Generate New Estimate with AI
      </Button>
    </div>
  );
}

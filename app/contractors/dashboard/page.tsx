"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/header";
import { ScrollToTop } from "@/components/scroll-to-top";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { copyToClipboard } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MapPin,
  Clock,
  MessageCircle,
  Eye,
  CheckCircle2,
  Users,
  Send,
  Calculator,
  Sparkles,
  Lock,
  Unlock,
  Wrench,
  LayoutDashboard,
  LogOut,
  User,
  Phone,
  Mail,
  Bell,
  Copy,
  ChevronRight,
  Zap,
  ArrowLeft,
  ExternalLink,
  DollarSign,
  TrendingUp,
  Shield,
} from "lucide-react";
import { BidBuilderChat, type BidLeadType, type BidChatLeadContext } from "@/components/bid-builder-chat";
import { getMockUser, mockSignOut, USE_MOCK_DATA } from "@/lib/mock-auth";
import { getContractorBids } from "@/lib/supabase/actions";
import { createClient } from "@/lib/supabase/client";
import { getContractorBids as getDemoContractorBids } from "@/lib/demo/services";
import { DEMO_CONTRACTOR_EMAIL } from "@/lib/demo-guard";

// ── Types ─────────────────────────────────────────────────────────────────────

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
  zip?: string;
  photos?: number;
  missingInfo?: string[];
  aiConfidence?: string;
}

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

// ── Mock data ─────────────────────────────────────────────────────────────────

const DEMO_HOMEBIDS_LEADS: HomeBidsLead[] = [
  {
    id: "hbl-1",
    title: "Kitchen Cabinet Repaint",
    category: "Interior Painting",
    location: "Gilbert, AZ 85296",
    zip: "85296",
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
    photos: 2,
    missingInfo: ["Exact measurements", "Hardware replacement preference"],
    aiConfidence: "High",
  },
  {
    id: "hbl-2",
    title: "Backyard Turf Install",
    category: "Landscaping",
    location: "Chandler, AZ 85226",
    zip: "85226",
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
    photos: 3,
    missingInfo: ["HOA restrictions"],
    aiConfidence: "Medium",
  },
  {
    id: "hbl-3",
    title: "Bathroom Vanity Replacement",
    category: "Plumbing / Remodel",
    location: "Mesa, AZ 85201",
    zip: "85201",
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
    photos: 1,
    missingInfo: [],
    aiConfidence: "High",
  },
];

const DEMO_MY_LEADS: MyLead[] = [
  { id: "ml-1", customerName: "Sarah M.", projectTitle: "Interior Paint Estimate", category: "Interior Painting", estimatedValue: "$2,400", status: "open", lastActivity: "Waiting on estimate", aiStatus: "estimate_ready" },
  { id: "ml-2", customerName: "Mike R.", projectTitle: "Drywall Repair Response", category: "Drywall", estimatedValue: "$380", status: "in_progress", lastActivity: "Sent response — awaiting reply", aiStatus: "response_sent" },
  { id: "ml-3", customerName: "Janet B.", projectTitle: "Bathroom Remodel Follow-Up", category: "Remodel", estimatedValue: "$12,000", status: "open", lastActivity: "Follow-up draft ready", aiStatus: "followup_ready" },
];

// ── AI helper functions ────────────────────────────────────────────────────────

function getBidDefenderResponse(projectType: string, bidAmount: string, objection: string) {
  const refLink = `https://homebids.com/compare?ref=contractor-demo&project=${encodeURIComponent(projectType)}`;
  const objectionLower = objection.toLowerCase();
  const isPrice = objectionLower.includes("expens") || objectionLower.includes("price") || objectionLower.includes("cost") || objectionLower.includes("cheap");
  const isMoreBids = objectionLower.includes("bid") || objectionLower.includes("quot") || objectionLower.includes("compar");

  let response = "";
  if (isPrice) {
    response = `I completely understand — ${bidAmount} is a real investment and you deserve to feel confident about it. Here's what separates my bid from a cheaper option: [Your unique value here].\n\nI also partnered with HomeBids so you can easily compare what other qualified contractors charge for the same scope. You'll likely find my pricing is competitive for the quality you're getting:\n${refLink}\n\nEither way, I appreciate the opportunity and want you to feel great about whoever you choose.`;
  } else if (isMoreBids) {
    response = `That's completely reasonable — smart homeowners get multiple quotes. I actually partnered with HomeBids to make that easier for you. Here's a link to compare pricing from other vetted contractors in your area:\n${refLink}\n\nIf another contractor ends up being a better fit, no hard feelings. I just want the job done right for you.`;
  } else {
    response = `I understand the hesitation. I want you to feel 100% confident before you commit to anything.\n\nI partnered with HomeBids so homeowners can easily compare quotes and make the most informed decision possible:\n${refLink}\n\nIf you have any specific concerns I haven't addressed, I'm happy to talk through them directly.`;
  }

  return {
    response,
    refLink,
    earnings: { potentialPerReferral: "$45–$120", jobsReferred: 7, affiliateEarned: "$490" },
  };
}

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = "home" | "leads" | "ai" | "account";
type AiTool = "bid" | "defender" | null;

// ── AI assistant suggestions ───────────────────────────────────────────────────

// ── Main component ────────────────────────────────────────────────────────────

export default function ContractorDashboard() {
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get("tab") ?? "";

  const [activeTab, setActiveTab] = useState<Tab>(
    (tabParam === "leads" || tabParam === "ai" || tabParam === "account") ? tabParam : "home"
  );

  useEffect(() => {
    const t = searchParams?.get("tab") ?? "";
    if (t === "leads" || t === "ai" || t === "account") setActiveTab(t);
    else if (t === "" || t === "home") setActiveTab("home");
  }, [searchParams]);

  const [contractorName, setContractorName] = useState("there");
  useEffect(() => {
    // Auth guard — redirect unauthenticated users to the public contractor page.
    if (USE_MOCK_DATA) {
      const user = getMockUser();
      if (!user) {
        window.location.replace("/contractors");
        return;
      }
      if (user.role !== "contractor" && user.role !== "admin") {
        window.location.replace("/");
        return;
      }
      if (user?.firstName) setContractorName(user.firstName);
      return;
    }
    // Live mode auth guard
    ;(async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.replace("/contractors");
        return;
      }
      if (user.user_metadata?.user_type !== "contractor") {
        window.location.replace("/");
        return;
      }
      const firstName = user.user_metadata?.full_name?.split(" ")[0] ?? user.email?.split("@")[0] ?? "there";
      setContractorName(firstName);
    })();
  }, []);

  const [bidsCount, setBidsCount] = useState(0);
  useEffect(() => {
    async function load() {
      try {
        if (USE_MOCK_DATA) {
          const { bids } = await getDemoContractorBids();
          setBidsCount((bids ?? []).length);
          return;
        }
        if (typeof window !== "undefined" && window.location.hostname.includes("vusercontent.net")) return;
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email === DEMO_CONTRACTOR_EMAIL) {
          const { bids } = await getDemoContractorBids();
          setBidsCount((bids ?? []).length);
          return;
        }
        const { bids } = await getContractorBids();
        setBidsCount((bids ?? []).length);
      } catch { /* non-fatal */ }
    }
    load();
  }, []);

  // Leads segment — "myleads" is the default
  const [leadsSegment, setLeadsSegment] = useState<"myleads" | "homebids">("myleads");
  const [showRelayModal, setShowRelayModal] = useState(false);
  const [relayLead, setRelayLead] = useState<HomeBidsLead | null>(null);
  const [relayMessage, setRelayMessage] = useState("");
  const [relaySent, setRelaySent] = useState(false);

  // Lead detail modal
  const [showLeadDetail, setShowLeadDetail] = useState(false);
  const [selectedLead, setSelectedLead] = useState<HomeBidsLead | null>(null);

  // Active AI tool
  const [activeTool, setActiveTool] = useState<AiTool>(null);

  // ── Bid Builder (chat) state ─────────────────────────────────────────────────

  const [bidChatLeadType, setBidChatLeadType] = useState<BidLeadType>("my");
  const [bidChatLead, setBidChatLead] = useState<BidChatLeadContext | null>(null);
  // Track HomeBids leads that have become approved (direct messaging unlocked) in this session
  const [unlockedLeadIds, setUnlockedLeadIds] = useState<Set<string>>(new Set());

  const companyName = "[Your Company Name]";

  // Open the chat-based Bid Builder. leadType drives messaging/approval rules.
  function startBidByText(leadType: BidLeadType, lead?: BidChatLeadContext | null) {
    setBidChatLeadType(leadType);
    setBidChatLead(lead ?? null);
    setActiveTool("bid");
    setActiveTab("ai");
  }

  // Start from a HomeBids lead
  function startBidFromHomeBidsLead(lead: HomeBidsLead) {
    startBidByText("homebids", {
      id: lead.id,
      projectTitle: lead.title,
      category: lead.category,
      ownerName: lead.homeownerName,
      ownerPhone: lead.homeownerPhone,
      address: lead.location,
      timeline: lead.timeline,
      scope: lead.scope,
    });
  }

  // Start from one of the contractor's own leads
  function startBidFromMyLead(lead: MyLead) {
    startBidByText("my", {
      id: lead.id,
      projectTitle: lead.projectTitle,
      category: lead.category,
      ownerName: lead.customerName,
      ownerPhone: lead.phone,
    });
  }

  function closeBidBuilder() {
    setBidChatLead(null);
    setActiveTool(null);
  }

  function handleHomeownerApproved(leadId: string) {
    setUnlockedLeadIds((prev) => new Set(prev).add(leadId));
  }

  // A HomeBids lead's direct messaging is unlocked if it started unlocked OR was approved this session
  function isMessagingUnlocked(lead: HomeBidsLead) {
    return lead.directMessagingUnlocked || unlockedLeadIds.has(lead.id);
  }

  // ── Bid Defender state ─────────────────────────────────────────────────────

  const [defProject, setDefProject] = useState("");
  const [defBid, setDefBid] = useState("");
  const [defObjection, setDefObjection] = useState("");
  const [defResult, setDefResult] = useState<ReturnType<typeof getBidDefenderResponse> | null>(null);
  const [defLoading, setDefLoading] = useState(false);
  const [defCopied, setDefCopied] = useState(false);
  const [defLinkCopied, setDefLinkCopied] = useState(false);

  function handleBidDefender() {
    if (!defProject.trim() || !defBid.trim()) return;
    setDefLoading(true);
    setDefResult(null);
    setTimeout(() => { setDefResult(getBidDefenderResponse(defProject, defBid, defObjection)); setDefLoading(false); }, 1000);
  }

  function openSms(phone: string | undefined, body?: string) {
    // phone is required for direct-contact leads; body-only SMS uses an empty recipient
    const target = phone ?? "";
    if (!phone && !body) {
      alert("Phone number not available. Contact has not been unlocked yet.");
      return;
    }
    const href = body
      ? `sms:${target}${body ? `?body=${encodeURIComponent(body)}` : ""}`
      : `sms:${target}`;
    window.location.href = href;
  }

  const handleSignOut = () => mockSignOut();

  const newLeads = DEMO_HOMEBIDS_LEADS.filter((l) => l.status === "new").length;
  const awaitingApproval = DEMO_HOMEBIDS_LEADS.filter((l) => l.status === "homeowner_reviewing").length;
  const inProgress = DEMO_MY_LEADS.filter((l) => l.status === "in_progress").length;

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "home",    label: "Home",     icon: LayoutDashboard },
    { id: "leads",   label: "Leads",    icon: Users },
    { id: "ai",      label: "AI Tools", icon: Sparkles },
    { id: "account", label: "Account",  icon: Wrench },
  ];

  function handleTabChange(id: Tab) {
    setActiveTab(id);
    if (id !== "ai") setActiveTool(null);
  }

  // ── Lead card ──────────────────────────────────────────────────────────────

  function renderHomeBidsLeadCard(lead: HomeBidsLead) {
    const statusBadge =
      lead.status === "new" ? { label: "New", cls: "bg-blue-100 text-blue-700" }
      : lead.status === "bid_submitted" ? { label: "Bid Submitted", cls: "bg-amber-100 text-amber-700" }
      : { label: "Reviewing", cls: "bg-purple-100 text-purple-700" };

    return (
      <div key={lead.id} className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusBadge.cls}`}>{statusBadge.label}</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{lead.category}</span>
          </div>
          <span className="text-sm font-semibold text-foreground shrink-0">{lead.estimatedValue}</span>
        </div>
        <p className="mt-1.5 font-semibold text-foreground">{lead.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><MapPin className="h-3 w-3 shrink-0" />{lead.location}</span>
          <span className="flex items-center gap-1"><Clock className="h-3 w-3 shrink-0" />{lead.timeline}</span>
        </div>
        <p className="mt-2 text-[11px] italic text-primary/80">{lead.aiNotes}</p>
        <div className="mt-2">
          {isMessagingUnlocked(lead) ? (
            <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700 w-fit">
              <Unlock className="h-3 w-3" /> Direct texting unlocked
            </span>
          ) : (
            <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground w-fit">
              <Lock className="h-3 w-3" /> Contact locked
            </span>
          )}
        </div>
        <div className="mt-3 flex gap-2">
          <Button size="sm" variant="ghost" className="h-7 gap-1 px-2 text-xs text-muted-foreground" onClick={() => { setSelectedLead(lead); setShowLeadDetail(true); }}>
            <Eye className="h-3.5 w-3.5" /> Details
          </Button>
          {isMessagingUnlocked(lead) ? (
            <Button size="sm" className="h-7 gap-1 px-3 text-xs bg-green-600 hover:bg-green-700 text-white" onClick={() => openSms(lead.homeownerPhone)}>
              <MessageCircle className="h-3 w-3" /> Text Homeowner
            </Button>
          ) : lead.status === "new" ? (
            <Button size="sm" className="h-7 gap-1 px-3 text-xs" onClick={() => startBidFromHomeBidsLead(lead)}>
              <MessageCircle className="h-3 w-3" /> Start Bid by Text
            </Button>
          ) : (
            <Button size="sm" className="h-7 gap-1 px-3 text-xs" onClick={() => { setRelayLead(lead); setRelayMessage(lead.suggestedResponse); setRelaySent(false); setShowRelayModal(true); }}>
              <MessageCircle className="h-3 w-3" /> Send via HomeBids AI
            </Button>
          )}
        </div>
      </div>
    );
  }

  // ── HOME tab ───────────────────────────────────────────────────────────────

  // ── Bid status config (full set) ────────────────────────────────────────────
  const BID_STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
    draft:          { label: "Draft",           cls: "bg-muted text-muted-foreground"         },
    ready_to_send:  { label: "Ready to Send",   cls: "bg-blue-50 text-blue-700"               },
    sent:           { label: "Sent",            cls: "bg-amber-50 text-amber-700"             },
    pending:        { label: "Awaiting Review", cls: "bg-amber-50 text-amber-700"             },
    question_asked: { label: "Question Asked",  cls: "bg-purple-50 text-purple-700"           },
    approved:       { label: "Approved",        cls: "bg-green-50 text-green-700"             },
    accepted:       { label: "Approved",        cls: "bg-green-50 text-green-700"             },
    declined:       { label: "Declined",        cls: "bg-red-50 text-red-700"                 },
    rejected:       { label: "Not Selected",    cls: "bg-muted text-muted-foreground"         },
    in_progress:    { label: "In Progress",     cls: "bg-blue-50 text-blue-700"               },
    completed:      { label: "Completed",       cls: "bg-green-50 text-green-700"             },
  };

  const homeContent = (
    <div className="space-y-6">
      {/* Greeting + primary CTA */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Good morning, {contractorName}.</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            You have <span className="font-semibold text-foreground">{DEMO_HOMEBIDS_LEADS.length + DEMO_MY_LEADS.length}</span> active leads.
          </p>
        </div>
        <Button
          className="shrink-0 gap-2 rounded-full font-semibold"
          onClick={() => { setActiveTool("bid"); handleTabChange("ai"); }}
        >
          <Sparkles className="h-4 w-4" />
          Build a New Bid
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "New Leads",         value: newLeads,          color: "bg-blue-50 text-blue-700 border-blue-100" },
          { label: "Awaiting Approval", value: awaitingApproval,  color: "bg-purple-50 text-purple-700 border-purple-100" },
          { label: "In Progress",       value: inProgress,        color: "bg-amber-50 text-amber-700 border-amber-100" },
          { label: "Bids Submitted",    value: bidsCount,         color: "bg-muted text-muted-foreground border-border" },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-xl border p-3 ${color}`}>
            <p className="text-2xl font-bold">{value}</p>
            <p className="mt-0.5 text-[11px] font-medium">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Needs your attention</h2>
          <div className="space-y-3">
            {DEMO_HOMEBIDS_LEADS.map((lead) => renderHomeBidsLeadCard(lead))}
          </div>
        </div>

        <div className="lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Suggested actions</h2>
          <div className="space-y-2">
            {[
              { icon: MessageCircle, label: "Build a professional bid", sub: "Kitchen Cabinet Repaint", action: () => startBidFromHomeBidsLead(DEMO_HOMEBIDS_LEADS[0]) },
              { icon: Eye, label: "Homeowner reviewing bid", sub: "Backyard Turf Install", action: () => handleTabChange("leads") },
              { icon: Unlock, label: "Approval unlocked", sub: "Bathroom Vanity Replacement", action: () => handleTabChange("leads") },
              { icon: Shield, label: "Defend a lost bid", sub: "Use Bid Defender to recover leads", action: () => { handleTabChange("ai"); setActiveTool("defender"); } },
            ].map(({ icon: Icon, label, sub, action }) => (
              <button
                key={label}
                type="button"
                onClick={action}
                className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left transition-colors hover:border-primary/30 hover:bg-primary/5"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{sub}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => handleTabChange("ai")}
            className="mt-4 flex w-full items-center justify-between rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
          >
            <span className="flex items-center gap-2"><Zap className="h-4 w-4" />Open AI Tools</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* My Bids section */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">My Bids</h2>
          <Button size="sm" variant="ghost" className="h-7 gap-1 rounded-full px-3 text-xs" asChild>
            <a href="/contractors/bids">View all <ChevronRight className="h-3 w-3" /></a>
          </Button>
        </div>
        <div className="space-y-2">
          {/* TODO: replace with live bids from getContractorBids() once Supabase is connected */}
          {[
            { id: "cbid-1", title: "HVAC System Replacement", location: "Austin, TX", amount: 7850, status: "in_progress",    updated: "2 days ago" },
            { id: "cbid-2", title: "Water Heater Replacement", location: "Round Rock, TX", amount: 2400, status: "pending",      updated: "5 days ago" },
            { id: "cbid-3", title: "Deck Replacement",         location: "Cedar Park, TX", amount: 12400, status: "question_asked", updated: "1 day ago" },
          ].map((bid) => {
            const sc = BID_STATUS_CONFIG[bid.status] ?? BID_STATUS_CONFIG.pending;
            return (
              <div key={bid.id} className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{bid.title}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 shrink-0" />{bid.location}
                    <span className="mx-1">·</span>{bid.updated}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    ${bid.amount.toLocaleString()}
                  </span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${sc.cls}`}>
                    {sc.label}
                  </span>
                </div>
                <Button size="sm" variant="ghost" className="h-7 w-7 shrink-0 rounded-full p-0" asChild>
                  <a href={`/proposal/${bid.id}`}><ExternalLink className="h-3.5 w-3.5" /></a>
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Homeowner Opportunities (secondary) */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Homeowner Opportunities</h2>
          <Button size="sm" variant="ghost" className="h-7 gap-1 rounded-full px-3 text-xs" asChild>
            <a href="/contractors/jobs">Browse <ChevronRight className="h-3 w-3" /></a>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          {/* TODO: load from getOpenJobs() when live */}
          Jobs submitted by homeowners in your service area. Build a bid to respond.
        </p>
        <div className="space-y-2">
          {DEMO_HOMEBIDS_LEADS.slice(0, 2).map((lead) => (
            <div key={lead.id} className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{lead.title}</p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 shrink-0" />{lead.location}
                </p>
              </div>
              <span className="shrink-0 text-sm font-medium text-muted-foreground">{lead.estimatedValue}</span>
              <Button
                size="sm"
                className="h-7 shrink-0 gap-1 rounded-full px-3 text-xs"
                onClick={() => startBidFromHomeBidsLead(lead)}
              >
                <Sparkles className="h-3 w-3" /> Build Bid
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── LEADS tab ──���───────────────────────────────────────────────────────────

  const leadsContent = (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-foreground">Leads</h1>

      {/* Segmented toggle */}
      <div className="inline-flex rounded-lg border border-border bg-muted p-0.5">
        {([
          { id: "myleads",  label: "My Leads",        count: DEMO_MY_LEADS.length        },
          { id: "homebids", label: "HomeBids Leads",   count: DEMO_HOMEBIDS_LEADS.length  },
        ] as const).map((seg) => (
          <button
            key={seg.id}
            type="button"
            onClick={() => setLeadsSegment(seg.id)}
            className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-sm font-medium transition-all duration-150 ${
              leadsSegment === seg.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {seg.label}
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none ${
              leadsSegment === seg.id
                ? seg.id === "myleads"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-primary/10 text-primary"
                : "bg-muted-foreground/15 text-muted-foreground"
            }`}>
              {seg.count}
            </span>
          </button>
        ))}
      </div>

      {/* My Leads */}
      {leadsSegment === "myleads" && (
        <div className="space-y-3">
          {DEMO_MY_LEADS.map((lead) => {
            const aiStatusBadge =
              lead.aiStatus === "estimate_ready"  ? { label: "Estimate Ready",  cls: "bg-blue-100 text-blue-700"     }
              : lead.aiStatus === "response_sent" ? { label: "Response Sent",   cls: "bg-amber-100 text-amber-700"   }
              :                                    { label: "Follow-Up Ready",  cls: "bg-purple-100 text-purple-700" };
            const statusDot =
              lead.status === "in_progress" ? "bg-emerald-500" : "bg-muted-foreground/40";

            return (
              <div key={lead.id} className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/20">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                    {lead.customerName.charAt(0)}
                    <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background ${statusDot}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground">{lead.customerName}</p>
                    <p className="truncate text-xs text-muted-foreground">{lead.projectTitle}</p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-foreground">{lead.estimatedValue}</span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{lead.category}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${aiStatusBadge.cls}`}>{aiStatusBadge.label}</span>
                  <span className="text-[11px] text-muted-foreground">· {lead.lastActivity}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" className="h-7 gap-1 px-3 text-xs" onClick={() => startBidFromMyLead(lead)}>
                    <MessageCircle className="h-3 w-3" /> Start Bid by Text
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 gap-1 px-2.5 text-xs bg-transparent" onClick={() => openSms(lead.phone)}>
                    <MessageCircle className="h-3 w-3" /> Text Customer
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* HomeBids Leads */}
      {leadsSegment === "homebids" && (
        <div className="space-y-3">
          {DEMO_HOMEBIDS_LEADS.map((lead) => {
            const statusBadge =
              lead.status === "new"             ? { label: "New",        cls: "bg-blue-100 text-blue-700"     }
              : lead.status === "bid_submitted" ? { label: "Bid Sent",   cls: "bg-amber-100 text-amber-700"   }
              :                                  { label: "Reviewing",   cls: "bg-purple-100 text-purple-700" };

            return (
              <div key={lead.id} className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/20">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusBadge.cls}`}>{statusBadge.label}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{lead.category}</span>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-foreground">{lead.estimatedValue}</span>
                </div>
                <p className="mt-2 font-semibold text-foreground">{lead.title}</p>
                <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3 shrink-0" />{lead.location}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3 shrink-0" />{lead.timeline}</span>
                </div>
                <p className="mt-1.5 text-[11px] italic text-primary/80 line-clamp-2">{lead.aiNotes}</p>
                <div className="mt-1.5">
                  {isMessagingUnlocked(lead) ? (
                    <span className="flex w-fit items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                      <Unlock className="h-3 w-3" /> Direct messaging unlocked
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">Direct messaging unlocks after homeowner approval.</span>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="ghost" className="h-7 gap-1 px-2 text-xs text-muted-foreground" onClick={() => { setSelectedLead(lead); setShowLeadDetail(true); }}>
                    <Eye className="h-3 w-3" /> Details
                  </Button>
                  <Button size="sm" className="h-7 gap-1 px-3 text-xs" onClick={() => startBidFromHomeBidsLead(lead)}>
                    <MessageCircle className="h-3 w-3" /> Start Bid by Text
                  </Button>
                  {isMessagingUnlocked(lead) ? (
                    <Button size="sm" className="h-7 gap-1 px-3 text-xs bg-green-600 hover:bg-green-700 text-white" onClick={() => openSms(lead.homeownerPhone)}>
                      <MessageCircle className="h-3 w-3" /> Text Homeowner
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" className="h-7 gap-1 px-2.5 text-xs bg-transparent" onClick={() => { setRelayLead(lead); setRelayMessage(lead.suggestedResponse); setRelaySent(false); setShowRelayModal(true); }}>
                      <MessageCircle className="h-3 w-3" /> Send via HomeBids AI
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );


  // Bid Defender pane
  const bidDefenderPane = (
    <div className="space-y-5 px-4 py-5 lg:px-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
          <Shield className="h-5 w-5 text-emerald-700" />
        </div>
        <div>
          <h2 className="font-bold text-foreground">Bid Defender</h2>
          <p className="text-xs text-muted-foreground">Turn lost bids into affiliate revenue. Even when you lose, you earn.</p>
        </div>
      </div>

      {/* Affiliate stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Leads Referred", value: "7", icon: Users },
          { label: "Potential Earn", value: "$70/ea", icon: DollarSign },
          { label: "Revenue Earned", value: "$490", icon: TrendingUp },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-3 text-center">
            <Icon className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
            <p className="text-base font-bold text-foreground">{value}</p>
            <p className="text-[10px] text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Explanation callout */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <p className="text-xs font-semibold text-emerald-800 mb-1">How it works</p>
        <p className="text-sm text-emerald-900">
          When a homeowner chooses another contractor, send them your HomeBids referral link.
          If they hire someone through HomeBids, you earn <span className="font-semibold">$45–$120</span> in affiliate revenue — automatically, even though you lost the job.
        </p>
      </div>

      {/* Form */}
      <div className="space-y-3 rounded-xl border border-border bg-card p-4">
        <div className="space-y-1.5">
          <Label htmlFor="def-project" className="text-xs font-medium">Project type</Label>
          <Input id="def-project" placeholder="e.g. Kitchen cabinet repaint" value={defProject} onChange={(e) => setDefProject(e.target.value)} className="text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="def-bid" className="text-xs font-medium">Your bid amount</Label>
          <Input id="def-bid" placeholder="e.g. $1,450" value={defBid} onChange={(e) => setDefBid(e.target.value)} className="text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="def-objection" className="text-xs font-medium">Homeowner&apos;s objection</Label>
          <Input id="def-objection" placeholder={`e.g. "It's too expensive" or "I want more bids"`} value={defObjection} onChange={(e) => setDefObjection(e.target.value)} className="text-sm" />
        </div>
        <Button className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleBidDefender} disabled={!defProject.trim() || !defBid.trim() || defLoading}>
          {defLoading
            ? <span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Generating...</span>
            : <><Shield className="h-4 w-4" /> Generate Defender Response</>}
        </Button>
      </div>

      {defResult && (
        <div className="space-y-3">
          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Suggested Response</p>
            <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{defResult.response}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" className="h-7 gap-1 px-2.5 text-xs bg-transparent" onClick={() => { copyToClipboard(defResult.response); setDefCopied(true); setTimeout(() => setDefCopied(false), 2000); }}>
                <Copy className="h-3 w-3" />{defCopied ? "Copied!" : "Copy"}
              </Button>
              <Button size="sm" variant="outline" className="h-7 gap-1 px-2.5 text-xs bg-transparent" onClick={() => openSms(undefined, defResult.response)}>
                <Send className="h-3 w-3" /> Send via SMS
              </Button>
            </div>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">Your Active Referral Link</p>
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-2">
              <p className="flex-1 truncate text-xs text-foreground font-mono">{defResult.refLink}</p>
              <button type="button" onClick={() => { copyToClipboard(defResult.refLink); setDefLinkCopied(true); setTimeout(() => setDefLinkCopied(false), 2000); }} className="shrink-0 text-emerald-700 hover:text-emerald-900">
                {defLinkCopied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
              <a href={defResult.refLink} target="_blank" rel="noopener noreferrer" className="shrink-0 text-emerald-700 hover:text-emerald-900"><ExternalLink className="h-4 w-4" /></a>
            </div>
            <p className="text-xs text-emerald-800">
              Share this link with the homeowner. If they hire through HomeBids, you automatically earn <span className="font-semibold">{defResult.earnings.potentialPerReferral}</span>.
            </p>
          </div>
        </div>
      )}
    </div>
  );

  // AI Tools content — picker or active tool
  const aiContent = (() => {
    // Bid Builder is full-screen when active — chat-first experience
    if (activeTool === "bid") {
      return (
        <div className="-mx-4 overflow-hidden rounded-none border-y border-border bg-background lg:-mx-8 lg:rounded-2xl lg:border">
          <BidBuilderChat
            leadType={bidChatLeadType}
            lead={bidChatLead}
            contractorName={`${contractorName}`}
            companyName={companyName}
            onClose={closeBidBuilder}
            onHomeownerApproved={handleHomeownerApproved}
            onOpenDefender={() => setActiveTool("defender")}
          />
        </div>
      );
    }

    // Bid Defender takes up the content area
    if (activeTool === "defender") {
      return (
        <div className="-mx-4 lg:-mx-8">
          <div className="border-b border-border px-4 py-3 lg:px-6">
            <button type="button" onClick={() => setActiveTool(null)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to AI Tools
            </button>
          </div>
          {bidDefenderPane}
        </div>
      );
    }

    // Tool picker — two large featured cards
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">AI Tools</h1>
          <p className="mt-1 text-sm text-muted-foreground">Built to help you win more jobs and recover lost opportunities.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Bid Builder card */}
          <button
            type="button"
            onClick={() => startBidByText("my", null)}
            className="group flex flex-col rounded-2xl border-2 border-border bg-card p-6 text-left transition-all hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                <MessageCircle className="h-6 w-6 text-primary" />
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-foreground">Bid Builder</h3>
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
              Text rough job notes and HomeBids AI writes the whole bid for you — scope, pricing, and wording. Approve it and we generate the PDF.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {["Text-to-Bid", "AI Drafting", "Live PDF", "One-Tap Approve"].map((tag) => (
                <span key={tag} className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-medium text-primary">{tag}</span>
              ))}
            </div>
            <div className="mt-5">
              <span className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors group-hover:bg-primary/90">
                <MessageCircle className="h-4 w-4" /> Start Bid by Text
              </span>
            </div>
          </button>

          {/* Bid Defender card */}
          <button
            type="button"
            onClick={() => setActiveTool("defender")}
            className="group flex flex-col rounded-2xl border-2 border-border bg-card p-6 text-left transition-all hover:border-emerald-400/60 hover:shadow-md hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 transition-colors group-hover:bg-emerald-200">
                <Shield className="h-6 w-6 text-emerald-700" />
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-foreground">Bid Defender</h3>
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
              Turn lost bids into revenue. Handle objections, share your referral link, and earn even when the homeowner goes with someone else.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {["Objection Handling", "Referral Link", "Affiliate Revenue", "Loss Recovery"].map((tag) => (
                <span key={tag} className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-medium text-emerald-700">{tag}</span>
              ))}
            </div>
            <div className="mt-5">
              <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors group-hover:bg-emerald-700">
                <Shield className="h-4 w-4" /> Defend a Bid
              </span>
            </div>
          </button>
        </div>

        {/* Quick-start from active leads */}
        {DEMO_HOMEBIDS_LEADS.some((l) => l.status === "new") && (
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quick-start Bid Builder</p>
            <div className="space-y-2">
              {DEMO_HOMEBIDS_LEADS.filter((l) => l.status === "new").map((lead) => (
                <button
                  key={lead.id}
                  type="button"
                  onClick={() => startBidFromHomeBidsLead(lead)}
                  className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Calculator className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">{lead.title}</p>
                    <p className="text-xs text-muted-foreground">{lead.estimatedValue} · {lead.location}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">New</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  })();

  // ── ACCOUNT tab ────────────────────────────────────────────────────────────

  const accountContent = (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-foreground">Account</h1>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-start">
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Profile</h2>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
              {contractorName.charAt(0)}
            </div>
            <div>
              <p className="font-semibold text-foreground">{contractorName} Rodriguez</p>
              <p className="text-xs text-muted-foreground">Contractor</p>
            </div>
          </div>
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Mail className="h-4 w-4 shrink-0" />contractor@homebids.demo</div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Phone className="h-4 w-4 shrink-0" />(480) 555-0192</div>
          </div>
        </div>

        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2">
          <h2 className="text-sm font-semibold text-primary">Your Plan</h2>
          <p className="text-2xl font-bold text-foreground">$99 / month</p>
          <ul className="space-y-1.5 pt-1">
            {[
              "Unlimited AI-generated bids",
              "No bid fees — ever",
              "HomeBids AI lead matching",
              "Direct homeowner contact after approval",
              "Bid Builder with live PDF preview",
              "Bid Defender with affiliate revenue",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-foreground">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 space-y-3 lg:col-span-2">
          <h2 className="text-sm font-semibold text-foreground">Notifications</h2>
          <label className="flex cursor-pointer items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-foreground"><Bell className="h-4 w-4 text-muted-foreground" />New lead alerts</span>
            <input type="checkbox" defaultChecked className="h-4 w-4 accent-primary" />
          </label>
          <label className="flex cursor-pointer items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-foreground"><User className="h-4 w-4 text-muted-foreground" />Homeowner approval alerts</span>
            <input type="checkbox" defaultChecked className="h-4 w-4 accent-primary" />
          </label>
        </div>
      </div>

      <Button variant="outline" className="gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-600 bg-transparent" onClick={handleSignOut}>
        <LogOut className="h-4 w-4" />
        Sign Out
      </Button>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  const tabContent: Record<Tab, React.ReactNode> = {
    home: homeContent,
    leads: leadsContent,
    ai: aiContent,
    account: accountContent,
  };

  return (
    <div className="flex min-h-screen flex-col bg-background overflow-x-hidden">
      <Header isContractor isSignedIn />
      <ScrollToTop />

      <main className="flex-1 min-w-0">
        <div className="mx-auto w-full max-w-2xl px-4 pb-8 pt-6 lg:max-w-4xl lg:px-8 lg:pb-12 lg:pt-8">
          {tabContent[activeTab]}
        </div>
      </main>

      {/* Relay Modal */}
      <Dialog open={showRelayModal} onOpenChange={(open) => { if (!open) setShowRelayModal(false); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Message via HomeBids AI</DialogTitle>
            <DialogDescription>
              Your message will be relayed through HomeBids AI. The homeowner&apos;s contact info stays private until they approve direct messaging.
            </DialogDescription>
          </DialogHeader>
          {relaySent ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
              <p className="font-semibold text-foreground">Message sent via HomeBids AI</p>
              <p className="text-sm text-muted-foreground">You&apos;ll be notified when the homeowner responds or approves direct contact.</p>
              <Button className="mt-2 w-full" onClick={() => setShowRelayModal(false)}>Done</Button>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="relay-message">Your message</Label>
                <Textarea id="relay-message" value={relayMessage} onChange={(e) => setRelayMessage(e.target.value)} rows={4} placeholder={relayLead?.suggestedResponse ?? "Hi, I wanted to follow up on your project..."} />
              </div>
              <p className="text-xs text-muted-foreground">Once the homeowner approves, direct SMS access will be unlocked.</p>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowRelayModal(false)} className="bg-transparent">Cancel</Button>
                <Button disabled={!relayMessage.trim()} onClick={() => setRelaySent(true)}>
                  <Send className="mr-2 h-4 w-4" /> Send via AI Relay
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Lead Detail Modal */}
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
              <div className="rounded-lg border border-border p-3">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Homeowner Goals</p>
                <p className="text-sm text-foreground">{selectedLead.homeownerGoals}</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Scope of Work</p>
                <p className="text-sm text-foreground">{selectedLead.scope}</p>
              </div>
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-primary/70">AI Notes</p>
                <p className="text-sm text-foreground">{selectedLead.aiNotes}</p>
              </div>
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-amber-700">Suggested Strategy</p>
                <p className="text-sm text-amber-900">{selectedLead.suggestedStrategy}</p>
              </div>
              <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-green-700">Recommended Price</p>
                <p className="text-lg font-bold text-green-700">{selectedLead.recommendedPrice}</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Suggested Response</p>
                <p className="text-sm italic text-foreground">&quot;{selectedLead.suggestedResponse}&quot;</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Objection Handling</p>
                <ul className="space-y-1">
                  {selectedLead.objections.map((obj, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                      {obj}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col gap-2 pt-1">
              <Button className="w-full gap-2" onClick={() => { setShowLeadDetail(false); startBidFromHomeBidsLead(selectedLead); }}>
                <MessageCircle className="h-4 w-4" /> Start Bid by Text
              </Button>
                {!isMessagingUnlocked(selectedLead) ? (
                  <Button variant="outline" className="w-full gap-2 bg-transparent" onClick={() => { setRelayLead(selectedLead); setRelayMessage(selectedLead.suggestedResponse); setRelaySent(false); setShowLeadDetail(false); setTimeout(() => setShowRelayModal(true), 150); }}>
                    <MessageCircle className="h-4 w-4" /> Message via HomeBids AI
                  </Button>
                ) : (
                  <Button className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white" onClick={() => openSms(selectedLead.homeownerPhone)}>
                    <MessageCircle className="h-4 w-4" /> Text Homeowner
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

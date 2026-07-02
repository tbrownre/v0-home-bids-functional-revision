"use client";

import { useState, useEffect, useRef, useMemo } from "react";
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
  ArrowLeft,
  ExternalLink,
  Flame,
  FileText,
  Plus,
  Archive,
} from "lucide-react";
import { BidBuilderChat, type BidLeadType, type BidChatLeadContext } from "@/components/bid-builder-chat";
import { BuildBidChoiceModal } from "@/components/build-bid-choice-modal";
import { getContractorSmsLink } from "@/lib/sms-config";
import { timeAgo } from "@/lib/proposal-format";
import { getMockUser, mockSignOut, USE_MOCK_DATA, syncMirrorFromSupabase } from "@/lib/mock-auth";
import { getContractorBids } from "@/lib/supabase/actions";
import { getContractorProposals, type Proposal, type ProposalStatus } from "@/lib/supabase/proposals";
import { ContractorProposalCard } from "@/components/proposal/contractor-proposal-card";
import { ProfileCompletionSection } from "@/components/contractor/profile-completion-section";
import { loadContractorProfile, getProfileCompletion } from "@/lib/contractor-profile";
import { createClient } from "@/lib/supabase/client";
import { getContractorBids as getDemoContractorBids } from "@/lib/demo/services";
import { DEMO_CONTRACTOR_EMAIL, isDemoEmail } from "@/lib/demo-guard";

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

// ── AI helper functions ───────────��───────────────────────��───────��────────────

function _getBidDefenderResponse(projectType: string, bidAmount: string, objection: string) {
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
type AiTool = "bid" | null;

// ── Bid Momentum ────────────────────────────────────────────────────────────
// A flexible, monthly pace system (not a punitive daily streak). Goal: 30 bids
// per calendar month, with a daily nudge to build 1 bid today.

const MONTH_GOAL = 30;

interface BidMomentum {
  state: "start" | "onpace" | "ahead" | "slightly" | "far" | "complete";
  title: string;
  statusLabel: string;
  copy: string;
  ctaLabel: string;
  progressText: string;
  percent: number;
}

function computeBidMomentum(count: number, goal: number, monthFraction: number | null): BidMomentum {
  const percent = Math.max(0, Math.min(100, Math.round((count / goal) * 100)));
  const progressText = `${count} / ${goal} bids this month`;

  if (count >= goal) {
    return {
      state: "complete",
      title: "Monthly Goal Complete",
      statusLabel: "Goal Complete",
      copy: "You hit your 30-bid goal this month. Every extra bid creates another chance to win work.",
      ctaLabel: "Build Another Bid",
      progressText,
      percent,
    };
  }
  if (count === 0) {
    return {
      state: "start",
      title: "Start Your Bid Momentum",
      statusLabel: "Ready to start",
      copy: "Build your first professional bid this month and start moving your pipeline forward.",
      ctaLabel: "Build Today's Bid",
      progressText,
      percent,
    };
  }

  // Pace relative to expected progress for this point in the month.
  // Fallback (pre-mount, fraction unknown): treat as on pace to avoid a flash.
  const expected = monthFraction != null ? goal * monthFraction : count;
  const ratio = expected > 0 ? count / expected : 1;

  if (ratio >= 1.15) {
    return {
      state: "ahead",
      title: "Bid Momentum: Ahead of Pace",
      statusLabel: "Ahead of Pace",
      copy: "You're ahead of your monthly goal. Keep building while the momentum is strong.",
      ctaLabel: "Build Another Bid",
      progressText,
      percent,
    };
  }
  if (ratio >= 0.9) {
    return {
      state: "onpace",
      title: "Bid Momentum: On Pace",
      statusLabel: "On Pace",
      copy: `You're ${count} ${count === 1 ? "bid" : "bids"} into your 30-bid monthly goal. Build 1 bid today to keep your pipeline moving.`,
      ctaLabel: "Build Today's Bid",
      progressText,
      percent,
    };
  }
  if (ratio >= 0.6) {
    return {
      state: "slightly",
      title: "Bid Momentum: Slightly Behind",
      statusLabel: "Slightly Behind",
      copy: "You're a few bids behind pace. Build 1 bid today to get back on track.",
      ctaLabel: "Get Back on Track",
      progressText,
      percent,
    };
  }
  return {
    state: "far",
    title: "Rebuild Your Momentum",
    statusLabel: "Behind Pace",
    copy: "You still have time to make progress this month. Start with 1 professional bid today.",
    ctaLabel: "Build Today's Bid",
    progressText,
    percent,
  };
}

// ── Bid Inbox model ─────────────────────────────────────────────────────────
// The contractor's own customers/bids/proposals — created through HomeBids.ai,
// never a marketplace lead feed. Statuses drive the badge + primary CTA.
type InboxStatusKey =
  | "new_request" | "draft_ready" | "missing_details" | "proposal_sent"
  | "waiting_customer" | "follow_up_ready" | "changes_requested" | "accepted" | "archived";

type InboxFilter = "all" | "needs_action" | "drafts" | "sent" | "accepted" | "archived";

interface BidInboxItem {
  id: string;
  customer: string;
  project: string;
  status: InboxStatusKey;
  value: number | null;
  lastActivity: string;
  source: string;
  phone: string;
  secondary: "text" | "view";
}

const INBOX_STATUS: Record<InboxStatusKey, { label: string; cls: string; primary: string; action: "build" | "followup" | "view" }> = {
  new_request:       { label: "New Request",        cls: "bg-blue-100 text-blue-700",     primary: "Start Bid",                action: "build" },
  draft_ready:       { label: "Draft Ready",        cls: "bg-indigo-100 text-indigo-700", primary: "Review Proposal",          action: "build" },
  missing_details:   { label: "Missing Details",    cls: "bg-amber-100 text-amber-700",   primary: "Continue Bid",             action: "build" },
  proposal_sent:     { label: "Proposal Sent",      cls: "bg-sky-100 text-sky-700",       primary: "View Proposal",            action: "view"  },
  waiting_customer:  { label: "Waiting on Customer", cls: "bg-amber-100 text-amber-700",  primary: "Send Follow-Up",           action: "followup" },
  follow_up_ready:   { label: "Follow-Up Ready",    cls: "bg-purple-100 text-purple-700", primary: "Send Follow-Up",           action: "followup" },
  changes_requested: { label: "Changes Requested",  cls: "bg-orange-100 text-orange-700", primary: "Edit Proposal",            action: "build" },
  accepted:          { label: "Accepted",           cls: "bg-emerald-100 text-emerald-700", primary: "View Accepted Proposal", action: "view"  },
  archived:          { label: "Archived",           cls: "bg-muted text-muted-foreground", primary: "View Details",            action: "view"  },
};

const INBOX_FILTERS: { id: InboxFilter; label: string }[] = [
  { id: "all",          label: "All" },
  { id: "needs_action", label: "Needs Action" },
  { id: "drafts",       label: "Drafts" },
  { id: "sent",         label: "Sent" },
  { id: "accepted",     label: "Accepted" },
  { id: "archived",     label: "Archived" },
];

const INBOX_FILTER_GROUPS: Record<Exclude<InboxFilter, "all" | "archived">, InboxStatusKey[]> = {
  needs_action: ["new_request", "draft_ready", "missing_details", "changes_requested", "follow_up_ready"],
  drafts:       ["draft_ready", "missing_details"],
  sent:         ["proposal_sent", "waiting_customer"],
  accepted:     ["accepted"],
};

// Maps a real proposal's lifecycle status onto an inbox status + the right
// secondary action. Used only for real (non-demo) contractor accounts.
const PROPOSAL_STATUS_TO_INBOX: Record<ProposalStatus, { status: InboxStatusKey; secondary: "text" | "view" }> = {
  draft:             { status: "draft_ready",       secondary: "text" },
  sent:              { status: "proposal_sent",     secondary: "view" },
  viewed:            { status: "waiting_customer",  secondary: "text" },
  question_asked:    { status: "follow_up_ready",   secondary: "text" },
  approval_clicked:  { status: "waiting_customer",  secondary: "view" },
  accepted:          { status: "accepted",          secondary: "view" },
  changes_requested: { status: "changes_requested", secondary: "text" },
};

const BID_INBOX_ITEMS: BidInboxItem[] = [
  { id: "inbox-1", customer: "Sarah M.", project: "Interior Paint Estimate", status: "draft_ready",      value: 2400,  lastActivity: "Updated 12 min ago",     source: "Created from text",             phone: "+15125550142", secondary: "text" },
  { id: "inbox-2", customer: "Mike R.",  project: "Drywall Repair",          status: "waiting_customer", value: 380,   lastActivity: "Proposal sent yesterday", source: "Added by you",                  phone: "+15125550178", secondary: "view" },
  { id: "inbox-3", customer: "Janet B.", project: "Bathroom Remodel",        status: "follow_up_ready",  value: 12000, lastActivity: "Follow-up draft ready",   source: "Created from notes",            phone: "+15125550199", secondary: "text" },
  { id: "inbox-4", customer: "David K.", project: "Fence Installation",      status: "new_request",      value: null,  lastActivity: "Request received 1 hour ago", source: "Imported from SMS",         phone: "+15125550123", secondary: "text" },
  { id: "inbox-5", customer: "Lauren P.", project: "Kitchen Backsplash",     status: "accepted",         value: 3200,  lastActivity: "Accepted 3 days ago",     source: "Created from customer message", phone: "+15125550155", secondary: "view" },
  { id: "inbox-6", customer: "Tom H.",   project: "Gutter Cleaning",         status: "archived",         value: 250,   lastActivity: "Archived last week",      source: "Added by you",                  phone: "+15125550167", secondary: "view" },
];

// ── Drafts (unfinished bids) ──────────────────────────────────────────────────
// A draft is a bid started (by text or online) but not yet completed/approved
// into a hosted proposal. Real accounts derive drafts from their own proposals
// (status === "draft"); demo accounts show the sample set below.
type DraftSource = "text" | "online";

interface DraftItem {
  id: string;
  customer: string | null;
  project: string;
  status: string;
  statusCls: string;
  value: number | null;
  lastUpdated: string;
  source: DraftSource;
}

const DEMO_DRAFTS: DraftItem[] = [
  { id: "draft-1", customer: "Sarah M.", project: "Interior Paint Estimate", status: "Ready for review",     statusCls: "bg-emerald-100 text-emerald-700", value: 2400,  lastUpdated: "12 min ago", source: "text"   },
  { id: "draft-2", customer: "Mike R.",  project: "Drywall Repair",          status: "Needs pricing",        statusCls: "bg-amber-100 text-amber-700",     value: null,  lastUpdated: "1 hour ago", source: "text"   },
  { id: "draft-3", customer: "Janet B.", project: "Bathroom Remodel",        status: "AI questions pending", statusCls: "bg-purple-100 text-purple-700",   value: 12000, lastUpdated: "Yesterday",  source: "online" },
];

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
  // Demo mode is the ONLY gate for sample data / demo banner. It is true when
  // the whole app runs as a demo build (USE_MOCK_DATA) OR the signed-in account
  // is a seeded/mock demo account. Real contractor accounts are NEVER demo —
  // they show only their own real data and proper empty states.
  const [isDemoMode, setIsDemoMode] = useState(false);
  // Locally-hidden (archived) drafts for this session.
  const [dismissedDraftIds, setDismissedDraftIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    // Auth guard. Middleware already protects this route server-side; here we
    // read the session mirror for instant paint and reconcile with the real
    // Supabase session if the mirror is empty (e.g. direct navigation).
    let cancelled = false;
    (async () => {
      let user = getMockUser();
      if (!user) user = await syncMirrorFromSupabase();
      if (cancelled) return;
      if (!user) {
        window.location.replace("/auth/sign-in");
        return;
      }
      if (user.role !== "contractor" && user.role !== "admin") {
        window.location.replace("/");
        return;
      }
      if (user.firstName) setContractorName(user.firstName);
      const email = (user.email ?? "").toLowerCase();
      setIsDemoMode(USE_MOCK_DATA || isDemoEmail(email) || email.endsWith("@homebids.demo"));
    })();
    return () => { cancelled = true; };
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

  // Hosted proposals (written by the external Bid Builder workflow). Read-only
  // here — the dashboard only displays and shares them.
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [proposalsLoaded, setProposalsLoaded] = useState(false);
  useEffect(() => {
    async function loadProposals() {
      try {
        if (typeof window !== "undefined" && window.location.hostname.includes("vusercontent.net")) {
          setProposalsLoaded(true);
          return;
        }
        const { proposals: rows } = await getContractorProposals();
        setProposals(rows);
      } catch { /* non-fatal */ }
      finally { setProposalsLoaded(true); }
    }
    loadProposals();
  }, []);

  // Time-of-day greeting + month progress (computed client-side post-mount to
  // avoid hydration mismatches; both default to neutral values on first render).
  const [greeting, setGreeting] = useState("Welcome");
  const [monthFraction, setMonthFraction] = useState<number | null>(null);
  useEffect(() => {
    const d = new Date();
    const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    setMonthFraction(d.getDate() / daysInMonth);
    const h = d.getHours();
    setGreeting(h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening");
  }, []);

  const momentum = useMemo(
    () => computeBidMomentum(bidsCount, MONTH_GOAL, monthFraction),
    [bidsCount, monthFraction],
  );

  // Optional profile completion (from localStorage). Refreshes whenever the
  // active tab changes so edits made in the Account tab reflect on Home.
  const [profileCompletion, setProfileCompletion] = useState<{ completed: number; total: number; percent: number; isComplete: boolean } | null>(null);
  useEffect(() => {
    setProfileCompletion(getProfileCompletion(loadContractorProfile()));
  }, [activeTab]);

  // Leads segment — "myleads" is the default
  const [inboxFilter, setInboxFilter] = useState<InboxFilter>("needs_action");
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

  // ── Build Bid choice modal ───────────────────────────────────────────────────
  // Every contractor "build/finish/continue bid" CTA routes through this modal,
  // which offers Continue by Text (SMS) or Continue on Site (existing builder).
  const [showBuildChoice, setShowBuildChoice] = useState(false);
  const pendingOnSiteRef = useRef<(() => void) | null>(null);

  function openBuildChoice(onSite: () => void) {
    pendingOnSiteRef.current = onSite;
    setShowBuildChoice(true);
  }

  function handleContinueOnSite() {
    setShowBuildChoice(false);
    const fn = pendingOnSiteRef.current;
    pendingOnSiteRef.current = null;
    fn?.();
  }

  const handleSignOut = () => mockSignOut();

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "home",    label: "Home",     icon: LayoutDashboard },
    { id: "leads",   label: "Bid Inbox", icon: Users },
    { id: "ai",      label: "Build a Bid", icon: Sparkles },
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
            <Button size="sm" className="h-7 gap-1 px-3 text-xs" onClick={() => openBuildChoice(() => startBidFromHomeBidsLead(lead))}>
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

  // Up to 3 action items. The third card adapts: when behind pace it nudges
  // momentum; when on/ahead/complete it surfaces a fresh homeowner lead.
  // Sample homeowner leads are demo-only — never surface them in real accounts.
  const newHomeBidsLead = isDemoMode ? DEMO_HOMEBIDS_LEADS.find((l) => l.status === "new") : undefined;
  const thirdCard =
    (momentum.state === "ahead" || momentum.state === "complete" || momentum.state === "onpace") && newHomeBidsLead
      ? {
          id: "na-lead",
          title: newHomeBidsLead.title,
          sub: `New homeowner lead in ${newHomeBidsLead.location}.`,
          cta: "Build Bid",
          icon: Sparkles as React.ElementType,
          onClick: () => openBuildChoice(() => startBidFromHomeBidsLead(newHomeBidsLead)),
        }
      : {
          id: "na-momentum",
          title: "Monthly Bid Momentum",
          sub: momentum.copy,
          cta: momentum.ctaLabel,
          icon: Flame as React.ElementType,
          onClick: () => openBuildChoice(() => startBidByText("my", null)),
        };

  const needsAction: { id: string; title: string; sub: string; cta: string; icon: React.ElementType; onClick: () => void }[] = [
    {
      id: "na-draft",
      title: "Kitchen Remodel Bid",
      sub: "Draft started — project details are ready.",
      cta: "Finish Bid",
      icon: FileText,
      onClick: () => openBuildChoice(() => startBidByText("my", null)),
    },
    {
      id: "na-follow",
      title: "Bathroom Tile Proposal",
      sub: "Sent 2 days ago — this bid may need a follow-up.",
      cta: "Follow Up",
      icon: Send,
      onClick: () => handleTabChange("leads"),
    },
    thirdCard,
  ].slice(0, 3);

  const homeContent = (
    <div className="space-y-6">
      {/* Hero — greeting + Bid Momentum + daily nudge */}
      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h1 className="text-2xl font-bold text-foreground text-balance">{greeting}, {contractorName}.</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {momentum.state === "complete"
            ? "You've hit your 30-bid goal this month."
            : bidsCount > 0
              ? `You're ${bidsCount} ${bidsCount === 1 ? "bid" : "bids"} into your 30-bid monthly goal.`
              : "Let's start building your pipeline this month."}
        </p>

        <div className="mt-4 rounded-xl border border-border bg-background p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Flame className="h-4 w-4 text-primary" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">{momentum.title}</p>
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{momentum.statusLabel}</p>
              </div>
            </div>
            <span className="shrink-0 text-sm font-semibold text-foreground">{momentum.progressText}</span>
          </div>

          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={momentum.percent} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${momentum.percent}%` }} />
          </div>

          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{momentum.copy}</p>

          <Button
            className="mt-4 w-full gap-2 rounded-full font-semibold sm:w-auto"
            onClick={() => openBuildChoice(() => startBidByText("my", null))}
          >
            <Sparkles className="h-4 w-4" />
            {momentum.ctaLabel}
          </Button>
        </div>
      </section>

      {/* Profile completion — secondary nudge, only when incomplete */}
      {profileCompletion && !profileCompletion.isComplete && (
        <section className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-foreground">Complete your contractor profile</p>
                <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[11px] font-medium text-yellow-800">
                  {profileCompletion.completed} of {profileCompletion.total} complete
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Add your logo, license, services, and business details when you&apos;re ready. Your account is already active.
              </p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${profileCompletion.percent}%` }} />
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-8 shrink-0 rounded-full px-3 text-xs font-semibold bg-transparent"
              onClick={() => handleTabChange("account")}
            >
              Finish Profile
            </Button>
          </div>
        </section>
      )}

      {/* Needs Action — max 3 priority cards */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Needs Action</h2>
        {needsAction.length > 0 ? (
          <div className="space-y-2">
            {needsAction.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.id} className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{card.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{card.sub}</p>
                  </div>
                  <Button size="sm" className="h-8 shrink-0 rounded-full px-3 text-xs font-semibold" onClick={card.onClick}>
                    {card.cta}
                  </Button>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
            You&apos;re all caught up. Build a bid to keep your momentum going.
          </p>
        )}
      </section>

      {/* Your Proposals — hosted proposal links (max 3 on home) */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Your Proposals</h2>
          {proposals.length > 3 && (
            <Button size="sm" variant="ghost" className="h-7 gap-1 rounded-full px-3 text-xs" asChild>
              <a href="/contractors/bids">View all <ChevronRight className="h-3 w-3" /></a>
            </Button>
          )}
        </div>
        {proposals.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {proposals.slice(0, 4).map((p) => (
              <ContractorProposalCard key={p.id} proposal={p} />
            ))}
          </div>
        ) : proposalsLoaded ? (
          <div className="rounded-2xl border border-border bg-card px-4 py-6 text-center">
            <p className="text-sm font-medium text-foreground">No proposals yet.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Build a bid by text and your hosted proposal link will appear here.
            </p>
            <Button className="mt-3 gap-2 rounded-full font-semibold" onClick={() => openBuildChoice(() => startBidByText("my", null))}>
              <Sparkles className="h-4 w-4" /> Build Today&apos;s Bid
            </Button>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card px-4 py-6 text-center text-sm text-muted-foreground">
            Loading proposals…
          </div>
        )}
      </section>
    </div>
  );

  // ── LEADS tab ──���───────────────────────────────────────────────────────────

  // ── Bid Inbox ───────────────────────────────────────────────────────────────
  // Contractor-owned customers, bid drafts, sent proposals, and follow-ups
  // created through HomeBids.ai. This is NOT a marketplace/lead-source feed.
  //
  // Demo accounts show the sample set; REAL accounts derive the inbox solely
  // from their own proposals (RLS-scoped to contractor_id) so no contractor
  // ever sees another account's customers or sample data.
  const inboxSource: BidInboxItem[] = isDemoMode
    ? BID_INBOX_ITEMS
    : proposals.map((p) => {
        const mapped = PROPOSAL_STATUS_TO_INBOX[p.status] ?? { status: "proposal_sent" as InboxStatusKey, secondary: "view" as const };
        return {
          id: p.id,
          customer: p.homeowner_name ?? "Customer",
          project: p.project_title,
          status: mapped.status,
          value: p.total_price != null ? Number(p.total_price) : null,
          lastActivity: `Updated ${timeAgo(p.updated_at) ?? "recently"}`,
          source: "From HomeBids.ai",
          phone: p.homeowner_phone ?? "",
          secondary: mapped.secondary,
        };
      });
  const visibleInbox = inboxSource.filter((item) => {
    if (inboxFilter === "all") return item.status !== "archived";
    if (inboxFilter === "archived") return item.status === "archived";
    return INBOX_FILTER_GROUPS[inboxFilter].includes(item.status);
  });

  const leadsContent = (
    <div className="space-y-5">
      {/* Title + primary CTA (stacks on mobile) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Bid Inbox</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage customer requests, proposal drafts, sent bids, and follow-ups.
          </p>
        </div>
        <Button
          className="shrink-0 gap-2 rounded-full font-semibold"
          onClick={() => openBuildChoice(() => startBidByText("my", null))}
        >
          <Plus className="h-4 w-4" /> Build New Bid
        </Button>
      </div>

      {/* Status filters — horizontally scrollable pills on mobile */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {INBOX_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setInboxFilter(f.id)}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
              inboxFilter === f.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Cards */}
      {!isDemoMode && !proposalsLoaded ? (
        <div className="space-y-3" aria-busy="true" aria-label="Loading bids">
          {[0, 1, 2].map((i) => (
            <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 shrink-0 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-1/3 rounded bg-muted" />
                  <div className="h-2.5 w-1/2 rounded bg-muted" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : visibleInbox.length > 0 ? (
        <div className="space-y-3">
          {visibleInbox.map((item) => {
            const cfg = INBOX_STATUS[item.status];
            return (
              <div key={item.id} className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/20">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {item.customer.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground">{item.customer}</p>
                    <p className="truncate text-xs text-muted-foreground">{item.project}</p>
                  </div>
                  {item.value != null && (
                    <span className="shrink-0 text-sm font-semibold text-foreground">${item.value.toLocaleString()}</span>
                  )}
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${cfg.cls}`}>{cfg.label}</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{item.source}</span>
                  <span className="text-[11px] text-muted-foreground">· {item.lastActivity}</span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    className="h-7 gap-1 px-3 text-xs"
                    onClick={() => {
                      if (cfg.action === "build") {
                        openBuildChoice(() => startBidByText("my", {
                          id: item.id,
                          projectTitle: item.project,
                          category: item.project,
                          ownerName: item.customer,
                          ownerPhone: item.phone,
                        }));
                      } else if (cfg.action === "followup") {
                        openSms(item.phone);
                      } else {
                        window.location.href = "/contractors/bids";
                      }
                    }}
                  >
                    {cfg.action === "build" ? <FileText className="h-3 w-3" />
                      : cfg.action === "followup" ? <Send className="h-3 w-3" />
                      : <Eye className="h-3 w-3" />}
                    {cfg.primary}
                  </Button>

                  {item.secondary === "text" ? (
                    <Button size="sm" variant="outline" className="h-7 gap-1 px-2.5 text-xs bg-transparent" onClick={() => openSms(item.phone)}>
                      <MessageCircle className="h-3 w-3" /> Text Customer
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" className="h-7 gap-1 px-2.5 text-xs bg-transparent" onClick={() => { window.location.href = "/contractors/bids"; }}>
                      <ExternalLink className="h-3 w-3" /> View Proposal
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Empty state
        <div className="rounded-2xl border border-border bg-card px-4 py-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Archive className="h-6 w-6 text-primary" />
          </div>
          <p className="mt-3 text-base font-semibold text-foreground">No bids yet</p>
          <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">
            Start by texting HomeBids.ai project details, photos, screenshots, or rough notes. We&apos;ll help turn them into a professional proposal.
          </p>
          <div className="mt-4 flex flex-col items-center justify-center gap-2 sm:flex-row">
            <Button className="w-full gap-2 rounded-full font-semibold sm:w-auto" onClick={() => openBuildChoice(() => startBidByText("my", null))}>
              <Plus className="h-4 w-4" /> Build New Bid
            </Button>
            <Button variant="outline" className="w-full gap-2 rounded-full bg-transparent sm:w-auto" onClick={() => { window.location.href = getContractorSmsLink(); }}>
              <MessageCircle className="h-4 w-4" /> Text HomeBids.ai
            </Button>
          </div>
        </div>
      )}
    </div>
  );


  // Bid Builder content — picker or active tool
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
          />
        </div>
      );
    }

    // Start screen: choose how to build a bid + unfinished drafts.
    // Demo accounts show sample drafts; real accounts show ONLY their own
    // proposals still in "draft" status (filtered server-side by RLS).
    const allDrafts: DraftItem[] = isDemoMode
      ? DEMO_DRAFTS
      : proposals
          .filter((p) => p.status === "draft")
          .map((p) => ({
            id: p.id,
            customer: p.homeowner_name,
            project: p.project_title,
            status: "Draft",
            statusCls: "bg-muted text-muted-foreground",
            value: p.total_price != null ? Number(p.total_price) : null,
            lastUpdated: timeAgo(p.updated_at) ?? "recently",
            source: "online" as DraftSource,
          }));
    const drafts = allDrafts.filter((d) => !dismissedDraftIds.has(d.id));

    // Canonical contractor SMS link (number + prefilled body live in sms-config).
    const textBidHref = getContractorSmsLink();

    const startByTextBtn = (full = false) => (
      <a
        href={textBidHref}
        className={`inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 ${full ? "w-full" : ""}`}
      >
        <MessageCircle className="h-4 w-4" /> Start by Text
      </a>
    );

    return (
      <div className="space-y-8">
        {/* Title */}
        <div>
          <h1 className="text-xl font-bold text-foreground">Build a Bid</h1>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground text-pretty">
            Create a professional hosted proposal from texts, photos, screenshots, voice notes, or rough job notes.
          </p>
        </div>

        {/* Two start options — stack on mobile, side-by-side on desktop */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Start by Text (primary) */}
          <div className="flex flex-col rounded-2xl border-2 border-primary bg-card p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <MessageCircle className="h-6 w-6 text-primary" />
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">Recommended</span>
            </div>
            <h3 className="mt-4 text-lg font-bold text-foreground">Start by Text</h3>
            <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">
              Text job details, photos, screenshots, or voice notes. HomeBids.ai will ask follow-up questions and draft a clean proposal you can review, edit, and send.
            </p>
            <div className="mt-5">{startByTextBtn(true)}</div>
            <p className="mt-2 text-center text-xs text-muted-foreground">Best when you&apos;re in the field.</p>
          </div>

          {/* Build Online (secondary) */}
          <div className="flex flex-col rounded-2xl border border-border bg-card p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
              <Calculator className="h-6 w-6 text-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-foreground">Build Online</h3>
            <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">
              Enter customer info, scope, pricing, exclusions, photos, and notes in a simple guided builder.
            </p>
            <Button
              variant="outline"
              className="mt-5 w-full justify-center gap-2 rounded-xl bg-transparent py-2.5 text-sm font-semibold"
              onClick={() => startBidByText("my", null)}
            >
              <Calculator className="h-4 w-4" /> Start Online
            </Button>
            <p className="mt-2 text-center text-xs text-muted-foreground">Best when you want a more structured workflow.</p>
          </div>
        </div>

        {/* Feature chips */}
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {["Text-to-Bid", "Photo & Screenshot Intake", "Voice Notes", "Hosted Proposal Link", "PDF Included"].map((tag) => (
            <span key={tag} className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{tag}</span>
          ))}
        </div>

        {/* What happens next */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">What happens next</p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { n: 1, label: "Send job details" },
              { n: 2, label: "AI asks follow-ups" },
              { n: 3, label: "Review proposal" },
              { n: 4, label: "Send link or PDF" },
            ].map((step) => (
              <div key={step.n} className="flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{step.n}</span>
                <span className="text-sm font-medium text-foreground">{step.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Drafts — unfinished bids belonging to this contractor */}
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Drafts</h2>
          {!isDemoMode && !proposalsLoaded ? (
            <div className="space-y-2" aria-busy="true" aria-label="Loading drafts">
              {[0, 1].map((i) => (
                <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 shrink-0 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-1/3 rounded bg-muted" />
                      <div className="h-2.5 w-1/2 rounded bg-muted" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : drafts.length > 0 ? (
            <div className="space-y-2">
              {drafts.map((d) => (
                <div key={d.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {(d.customer ?? d.project).charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-foreground">{d.customer ?? d.project}</p>
                      <p className="truncate text-xs text-muted-foreground">{d.customer ? d.project : "Unfinished bid"}</p>
                    </div>
                    {d.value != null && <span className="shrink-0 text-sm font-semibold text-foreground">${d.value.toLocaleString()}</span>}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${d.statusCls}`}>{d.status}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{d.source === "text" ? "Started by text" : "Started online"}</span>
                    <span className="text-[11px] text-muted-foreground">· Updated {d.lastUpdated}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" className="h-7 gap-1 px-3 text-xs" onClick={() => openBuildChoice(() => startBidByText("my", null))}>
                      Continue
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 gap-1 px-2.5 text-xs text-muted-foreground"
                      onClick={() => setDismissedDraftIds((prev) => new Set(prev).add(d.id))}
                    >
                      <Archive className="h-3 w-3" /> Archive
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card px-4 py-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <p className="mt-3 text-base font-semibold text-foreground">No drafts yet</p>
              <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">
                Start your first bid by text or online. HomeBids.ai will help organize the scope and create a proposal you can send.
              </p>
              <div className="mt-4 flex flex-col items-center justify-center gap-2 sm:flex-row">
                {startByTextBtn(false)}
                <Button variant="outline" className="w-full gap-2 rounded-xl bg-transparent sm:w-auto" onClick={() => startBidByText("my", null)}>
                  <Calculator className="h-4 w-4" /> Start Online
                </Button>
              </div>
            </div>
          )}
        </div>
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
              "Bid Builder — shareable link + PDF included",
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

      {/* Optional profile completion — never blocks bid building */}
      <ProfileCompletionSection />

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
          {isDemoMode && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
              <span className="inline-flex items-center rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-900">
                Demo data
              </span>
              <span>The bids, customers, and metrics below are sample data for demonstration.</span>
            </div>
          )}
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
              <Button className="w-full gap-2" onClick={() => { setShowLeadDetail(false); openBuildChoice(() => startBidFromHomeBidsLead(selectedLead)); }}>
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

      {/* Build Bid choice — Continue by Text (SMS) or Continue on Site */}
      <BuildBidChoiceModal
        open={showBuildChoice}
        onOpenChange={setShowBuildChoice}
        onContinueOnSite={handleContinueOnSite}
      />
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/header";
import { ScrollToTop } from "@/components/scroll-to-top";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  FileText,
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
} from "lucide-react";
import { getMockUser, mockSignOut, USE_MOCK_DATA } from "@/lib/mock-auth";
import { getContractorBids } from "@/lib/supabase/actions";
import { createClient } from "@/lib/supabase/client";
import { getContractorBids as getDemoContractorBids } from "@/lib/demo/services";
import { DEMO_CONTRACTOR_EMAIL } from "@/lib/demo-guard";

// ── Types ────────────────────────────────────────────────────────────────────

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

const DEMO_MY_LEADS: MyLead[] = [
  { id: "ml-1", customerName: "Sarah M.", projectTitle: "Interior Paint Estimate", category: "Interior Painting", estimatedValue: "$2,400", status: "open", lastActivity: "Waiting on estimate", aiStatus: "estimate_ready" },
  { id: "ml-2", customerName: "Mike R.", projectTitle: "Drywall Repair Response", category: "Drywall", estimatedValue: "$380", status: "in_progress", lastActivity: "Sent response — awaiting reply", aiStatus: "response_sent" },
  { id: "ml-3", customerName: "Janet B.", projectTitle: "Bathroom Remodel Follow-Up", category: "Remodel", estimatedValue: "$12,000", status: "open", lastActivity: "Follow-up draft ready", aiStatus: "followup_ready" },
];

// ── AI Tools definitions ──────────────────────────────────────────────────────

const AI_TOOLS = [
  {
    id: "estimate",
    label: "Generate Estimate",
    description: "Get an AI-generated price estimate for any job type.",
    icon: Calculator,
    placeholder: "Describe the job: e.g. Interior paint, 3 bed / 2 bath, 1,800 sqft, Phoenix AZ",
    sampleOutput: "Based on your area and scope, a fair estimate for a 3-bed/2-bath interior paint in Phoenix is $2,100–$2,800 including labor and materials. Lead with $2,400 — it's competitive without undervaluing your work.",
  },
  {
    id: "pricecheck",
    label: "Price Check",
    description: "See how your bid stacks up against local market rates.",
    icon: Sparkles,
    placeholder: "Enter your bid amount and job type: e.g. $3,200 for drywall repair, Tempe AZ",
    sampleOutput: "Your bid of $3,200 is slightly above the Tempe average of $2,900 for comparable drywall work. Consider dropping to $2,950 or highlighting your warranty to justify the premium.",
  },
  {
    id: "response",
    label: "Customer Response",
    description: "Draft a professional reply to a homeowner message.",
    icon: MessageCircle,
    placeholder: "Paste the homeowner's message or describe the situation...",
    sampleOutput: "Hi Sarah, thanks for reaching out! I'd love to take a look at your kitchen — I have availability this Thursday or Friday. My process includes a full walkthrough and same-day estimate. Does either day work for you?",
  },
  {
    id: "followup",
    label: "Follow-Up Message",
    description: "Generate a follow-up for a bid you haven't heard back on.",
    icon: Send,
    placeholder: "Describe the job and when you submitted your bid: e.g. Landscaping bid submitted 5 days ago, no response",
    sampleOutput: "Hi Marcus, just checking in on the turf project I quoted last week. I wanted to make sure you received everything and answer any questions. I have a slot open next week if you'd like to move forward.",
  },
] as const;

// ── Main component ────────────────────────────────────────────────────────────

export default function ContractorDashboard() {
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get("tab") ?? "";

  type Tab = "home" | "leads" | "ai" | "account";
  const [activeTab, setActiveTab] = useState<Tab>(
    (tabParam === "leads" || tabParam === "ai" || tabParam === "account") ? tabParam : "home"
  );

  // Sync tab when URL search param changes (e.g. nav link click)
  useEffect(() => {
    const t = searchParams?.get("tab") ?? "";
    if (t === "leads" || t === "ai" || t === "account") setActiveTab(t);
    else if (t === "" || t === "home") setActiveTab("home");
  }, [searchParams]);

  // Auth
  const [contractorName, setContractorName] = useState("there");
  useEffect(() => {
    if (USE_MOCK_DATA) {
      const user = getMockUser();
      if (user?.firstName) setContractorName(user.firstName);
    }
  }, []);

  // Bids count (for home tab stats)
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
      } catch {
        // non-fatal
      }
    }
    load();
  }, []);

  // Leads segmented toggle
  const [leadsSegment, setLeadsSegment] = useState<"homebids" | "myleads">("homebids");

  // Relay modal
  const [showRelayModal, setShowRelayModal] = useState(false);
  const [relayLead, setRelayLead] = useState<HomeBidsLead | null>(null);
  const [relayMessage, setRelayMessage] = useState("");
  const [relaySent, setRelaySent] = useState(false);

  // Lead detail modal
  const [showLeadDetail, setShowLeadDetail] = useState(false);
  const [selectedLead, setSelectedLead] = useState<HomeBidsLead | null>(null);

  // AI Tools
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [toolInput, setToolInput] = useState("");
  const [toolOutput, setToolOutput] = useState<string | null>(null);
  const [toolLoading, setToolLoading] = useState(false);
  const [toolCopied, setToolCopied] = useState(false);

  function handleRunTool(toolId: string) {
    if (!toolInput.trim()) return;
    setToolLoading(true);
    setToolOutput(null);
    setTimeout(() => {
      const tool = AI_TOOLS.find((t) => t.id === toolId);
      setToolOutput(tool?.sampleOutput ?? "Output generated.");
      setToolLoading(false);
    }, 1200);
  }

  function handleCopyOutput() {
    if (!toolOutput) return;
    navigator.clipboard.writeText(toolOutput).then(() => {
      setToolCopied(true);
      setTimeout(() => setToolCopied(false), 2000);
    });
  }

  const handleSignOut = () => {
    mockSignOut();
  };

  // ── Derived stats ──────────────────────────────────────────────────────────
  const newLeads = DEMO_HOMEBIDS_LEADS.filter((l) => l.status === "new").length;
  const awaitingApproval = DEMO_HOMEBIDS_LEADS.filter((l) => l.status === "homeowner_reviewing").length;
  const inProgress = DEMO_MY_LEADS.filter((l) => l.status === "in_progress").length;

  // ── Home tab action leads (items needing attention) ──────────────────────
  const actionLeads = DEMO_HOMEBIDS_LEADS;

  // ── Tab navigation helpers ────────────────────────────────────────────────
  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "home",    label: "Home",     icon: LayoutDashboard },
    { id: "leads",   label: "Leads",    icon: Users },
    { id: "ai",      label: "AI Tools", icon: Sparkles },
    { id: "account", label: "Account",  icon: Wrench },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header isContractor isSignedIn />
      <ScrollToTop />

      {/* Main content — max-w-lg centered, generous padding */}
      <main className="mx-auto w-full max-w-lg flex-1 px-4 pb-28 pt-6">

        {/* ── HOME TAB ──────────────────────────────────────────────────── */}
        {activeTab === "home" && (
          <div className="space-y-6">
            {/* Greeting */}
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Good morning, {contractorName}.
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                You have <span className="font-semibold text-foreground">{DEMO_HOMEBIDS_LEADS.length + DEMO_MY_LEADS.length}</span> active leads.
              </p>
            </div>

            {/* Stats pills */}
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                {newLeads} new
              </span>
              <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700">
                {awaitingApproval} awaiting approval
              </span>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                {inProgress} in progress
              </span>
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                {bidsCount} bids submitted
              </span>
            </div>

            {/* Action leads */}
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Needs your attention
              </h2>
              <div className="space-y-3">
                {actionLeads.map((lead) => {
                  const statusBadge =
                    lead.status === "new"
                      ? { label: "New", cls: "bg-blue-100 text-blue-700" }
                      : lead.status === "bid_submitted"
                      ? { label: "Bid Submitted", cls: "bg-amber-100 text-amber-700" }
                      : { label: "Reviewing", cls: "bg-purple-100 text-purple-700" };

                  const cta = lead.directMessagingUnlocked
                    ? { label: "Text Homeowner", variant: "default" as const, onClick: () => { window.location.href = `sms:${lead.homeownerPhone ?? ""}`; } }
                    : lead.status === "new"
                    ? { label: "Generate Bid", variant: "default" as const, onClick: () => { setSelectedLead(lead); setShowLeadDetail(true); } }
                    : { label: "Send via HomeBids AI", variant: "outline" as const, onClick: () => { setRelayLead(lead); setRelayMessage(lead.suggestedResponse); setRelaySent(false); setShowRelayModal(true); } };

                  return (
                    <div
                      key={lead.id}
                      className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusBadge.cls}`}>
                              {statusBadge.label}
                            </span>
                            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                              {lead.category}
                            </span>
                          </div>
                          <p className="mt-1.5 font-semibold text-foreground">{lead.title}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 shrink-0" />
                              {lead.location}
                            </span>
                            <span className="font-semibold text-foreground">{lead.estimatedValue}</span>
                          </div>
                          {/* AI insight line */}
                          <p className="mt-2 text-[11px] italic text-primary/80">
                            {lead.aiNotes}
                          </p>
                          {/* Lock / unlock indicator */}
                          <div className="mt-2 flex items-center gap-1">
                            {lead.directMessagingUnlocked ? (
                              <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                                <Unlock className="h-3 w-3" /> Direct texting unlocked
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                                <Lock className="h-3 w-3" /> Contact locked
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 gap-1 px-2 text-xs text-muted-foreground"
                          onClick={() => { setSelectedLead(lead); setShowLeadDetail(true); }}
                        >
                          <Eye className="h-3.5 w-3.5" /> Details
                        </Button>
                        <Button
                          size="sm"
                          variant={cta.variant}
                          className={`h-7 gap-1 px-3 text-xs ${cta.variant === "outline" ? "bg-transparent" : ""}`}
                          onClick={cta.onClick}
                        >
                          {cta.label}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick-link to Leads tab */}
            <button
              type="button"
              onClick={() => setActiveTab("leads")}
              className="flex w-full items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                View all leads ({DEMO_HOMEBIDS_LEADS.length + DEMO_MY_LEADS.length})
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>

            {/* Quick-link to AI Tools */}
            <button
              type="button"
              onClick={() => setActiveTab("ai")}
              className="flex w-full items-center justify-between rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
            >
              <span className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Open AI Tools — generate estimates, responses &amp; more
              </span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ── LEADS TAB ─────────────────────────────────────────────────── */}
        {activeTab === "leads" && (
          <div className="space-y-5">
            <h1 className="text-xl font-bold text-foreground">Leads</h1>

            {/* Segmented toggle */}
            <div className="flex gap-1 rounded-xl bg-muted p-1">
              <button
                type="button"
                onClick={() => setLeadsSegment("homebids")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                  leadsSegment === "homebids"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                HomeBids AI
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${leadsSegment === "homebids" ? "bg-primary/10 text-primary" : "bg-muted-foreground/20 text-muted-foreground"}`}>
                  {DEMO_HOMEBIDS_LEADS.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setLeadsSegment("myleads")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                  leadsSegment === "myleads"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                My Leads
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${leadsSegment === "myleads" ? "bg-emerald-100 text-emerald-700" : "bg-muted-foreground/20 text-muted-foreground"}`}>
                  {DEMO_MY_LEADS.length}
                </span>
              </button>
            </div>

            {/* HomeBids AI Leads */}
            {leadsSegment === "homebids" && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Leads sourced by HomeBids. Win homeowner approval to unlock direct texting.
                </p>
                {DEMO_HOMEBIDS_LEADS.map((lead) => {
                  const statusBadge =
                    lead.status === "new"
                      ? { label: "New", cls: "bg-blue-100 text-blue-700" }
                      : lead.status === "bid_submitted"
                      ? { label: "Bid Submitted", cls: "bg-amber-100 text-amber-700" }
                      : { label: "Reviewing", cls: "bg-purple-100 text-purple-700" };
                  return (
                    <div key={lead.id} className="rounded-xl border border-border bg-card p-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusBadge.cls}`}>
                          {statusBadge.label}
                        </span>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                          {lead.category}
                        </span>
                      </div>
                      <p className="mt-1.5 font-semibold text-foreground">{lead.title}</p>
                      <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{lead.location}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{lead.timeline}</span>
                        <span className="font-semibold text-foreground">{lead.estimatedValue}</span>
                      </div>
                      <div className="mt-2 flex items-center gap-1">
                        {lead.directMessagingUnlocked ? (
                          <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                            <Unlock className="h-3 w-3" /> Direct texting unlocked
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                            <Lock className="h-3 w-3" /> Contact locked — win approval first
                          </span>
                        )}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1 px-2.5 text-xs bg-transparent"
                          onClick={() => { setSelectedLead(lead); setShowLeadDetail(true); }}
                        >
                          <Eye className="h-3 w-3" /> Details
                        </Button>
                        {lead.directMessagingUnlocked ? (
                          <Button
                            size="sm"
                            className="h-7 gap-1 px-3 text-xs bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => { window.location.href = `sms:${lead.homeownerPhone ?? ""}`; }}
                          >
                            <MessageCircle className="h-3 w-3" /> Text Homeowner
                          </Button>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              className="h-7 gap-1 px-3 text-xs"
                              onClick={() => { setSelectedLead(lead); setShowLeadDetail(true); }}
                            >
                              <Calculator className="h-3 w-3" /> Generate Bid
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 gap-1 px-2.5 text-xs bg-transparent"
                              onClick={() => { setRelayLead(lead); setRelayMessage(lead.suggestedResponse); setRelaySent(false); setShowRelayModal(true); }}
                            >
                              <MessageCircle className="h-3 w-3" /> Send via HomeBids AI
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* My Leads */}
            {leadsSegment === "myleads" && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Your own leads — full control, text directly any time.
                </p>
                {DEMO_MY_LEADS.map((lead) => {
                  const aiStatusBadge =
                    lead.aiStatus === "estimate_ready"
                      ? { label: "Estimate Ready", cls: "bg-blue-100 text-blue-700" }
                      : lead.aiStatus === "response_sent"
                      ? { label: "Response Sent", cls: "bg-amber-100 text-amber-700" }
                      : { label: "Follow-Up Ready", cls: "bg-purple-100 text-purple-700" };
                  return (
                    <div key={lead.id} className="rounded-xl border border-border bg-card p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-700">
                          {lead.customerName.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-foreground">{lead.customerName}</p>
                          <p className="text-xs text-muted-foreground">{lead.projectTitle}</p>
                        </div>
                        <span className="font-semibold text-foreground">{lead.estimatedValue}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{lead.category}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${aiStatusBadge.cls}`}>
                          {aiStatusBadge.label}
                        </span>
                      </div>
                      <p className="mt-1.5 text-[11px] text-muted-foreground">{lead.lastActivity}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1 px-2.5 text-xs bg-transparent"
                          onClick={() => setActiveTab("ai")}
                        >
                          <Sparkles className="h-3 w-3" /> AI Tools
                        </Button>
                        <Button
                          size="sm"
                          className="h-7 gap-1 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => { window.location.href = `sms:${lead.phone ?? ""}`; }}
                        >
                          <MessageCircle className="h-3 w-3" /> Text Customer
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── AI TOOLS TAB ──────────────────────────────────────────────── */}
        {activeTab === "ai" && (
          <div className="space-y-5">
            <div>
              <h1 className="text-xl font-bold text-foreground">AI Tools</h1>
              <p className="mt-1 text-sm text-muted-foreground">Your AI co-pilot for estimates, pricing, and customer communication.</p>
            </div>

            {/* Tool cards */}
            <div className="space-y-3">
              {AI_TOOLS.map((tool) => {
                const Icon = tool.icon;
                const isActive = activeTool === tool.id;
                return (
                  <div key={tool.id} className={`rounded-xl border bg-card transition-all ${isActive ? "border-primary/40 shadow-sm" : "border-border"}`}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 px-4 py-3 text-left"
                      onClick={() => {
                        if (isActive) {
                          setActiveTool(null);
                          setToolInput("");
                          setToolOutput(null);
                        } else {
                          setActiveTool(tool.id);
                          setToolInput("");
                          setToolOutput(null);
                        }
                      }}
                    >
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${isActive ? "bg-primary/10" : "bg-muted"}`}>
                        <Icon className={`h-4 w-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                      <div className="flex-1">
                        <p className={`font-semibold ${isActive ? "text-primary" : "text-foreground"}`}>{tool.label}</p>
                        <p className="text-xs text-muted-foreground">{tool.description}</p>
                      </div>
                      <ChevronRight className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${isActive ? "rotate-90" : ""}`} />
                    </button>

                    {isActive && (
                      <div className="border-t border-border px-4 pb-4 pt-3 space-y-3">
                        <Textarea
                          rows={3}
                          placeholder={tool.placeholder}
                          value={toolInput}
                          onChange={(e) => { setToolInput(e.target.value); setToolOutput(null); }}
                          className="resize-none text-sm"
                        />
                        <Button
                          className="w-full gap-2"
                          disabled={!toolInput.trim() || toolLoading}
                          onClick={() => handleRunTool(tool.id)}
                        >
                          {toolLoading ? (
                            <span className="flex items-center gap-2">
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                              Generating...
                            </span>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4" /> Generate
                            </>
                          )}
                        </Button>

                        {toolOutput && (
                          <div className="rounded-lg border border-border bg-muted/40 p-3">
                            <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{toolOutput}</p>
                            <div className="mt-3 flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 gap-1 px-2.5 text-xs bg-transparent"
                                onClick={handleCopyOutput}
                              >
                                <Copy className="h-3 w-3" />
                                {toolCopied ? "Copied!" : "Copy"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 gap-1 px-2.5 text-xs bg-transparent"
                                onClick={() => { window.location.href = `sms:?body=${encodeURIComponent(toolOutput)}`; }}
                              >
                                <MessageCircle className="h-3 w-3" /> Send via SMS
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 gap-1 px-2.5 text-xs bg-transparent"
                                onClick={() => window.print()}
                              >
                                <FileText className="h-3 w-3" /> Export PDF
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── ACCOUNT TAB ───────────────────────────────────────────────── */}
        {activeTab === "account" && (
          <div className="space-y-5">
            <h1 className="text-xl font-bold text-foreground">Account</h1>

            {/* Profile */}
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
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4 shrink-0" />
                  contractor@homebids.demo
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4 shrink-0" />
                  (480) 555-0192
                </div>
              </div>
            </div>

            {/* Subscription */}
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2">
              <h2 className="text-sm font-semibold text-primary">Your Plan</h2>
              <p className="text-2xl font-bold text-foreground">$99 / month</p>
              <ul className="space-y-1.5 pt-1">
                {[
                  "Unlimited AI-generated bids",
                  "No bid fees — ever",
                  "HomeBids AI lead matching",
                  "Direct homeowner contact after approval",
                  "AI estimate, price check, and response tools",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Notifications */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <h2 className="text-sm font-semibold text-foreground">Notifications</h2>
              <label className="flex cursor-pointer items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-foreground">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  New lead alerts
                </span>
                <input type="checkbox" defaultChecked className="h-4 w-4 accent-primary" />
              </label>
              <label className="flex cursor-pointer items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-foreground">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Homeowner approval alerts
                </span>
                <input type="checkbox" defaultChecked className="h-4 w-4 accent-primary" />
              </label>
            </div>

            {/* Sign out */}
            <Button
              variant="outline"
              className="w-full gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-600 bg-transparent"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        )}
      </main>

      {/* ── Bottom tab bar ─────────────────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background">
        <div className="mx-auto flex max-w-lg">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── Relay Modal ──────────────────────────────────────────────────── */}
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
              <p className="text-sm text-muted-foreground">
                You&apos;ll be notified when the homeowner responds or approves direct contact.
              </p>
              <Button className="mt-2 w-full" onClick={() => setShowRelayModal(false)}>Done</Button>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="relay-message">Your message</Label>
                <Textarea
                  id="relay-message"
                  value={relayMessage}
                  onChange={(e) => setRelayMessage(e.target.value)}
                  rows={4}
                  placeholder={relayLead?.suggestedResponse ?? "Hi, I wanted to follow up on your project..."}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Once the homeowner approves, direct SMS access will be unlocked.
              </p>
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

      {/* ── Lead Detail Modal ─────────────────────────────────────────────── */}
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
                <Button
                  className="w-full gap-2"
                  onClick={() => { setShowLeadDetail(false); setActiveTab("ai"); }}
                >
                  <Calculator className="h-4 w-4" /> Generate Bid in AI Tools
                </Button>
                {!selectedLead.directMessagingUnlocked ? (
                  <Button
                    variant="outline"
                    className="w-full gap-2 bg-transparent"
                    onClick={() => {
                      setRelayLead(selectedLead);
                      setRelayMessage(selectedLead.suggestedResponse);
                      setRelaySent(false);
                      setShowLeadDetail(false);
                      setTimeout(() => setShowRelayModal(true), 150);
                    }}
                  >
                    <MessageCircle className="h-4 w-4" /> Message via HomeBids AI
                  </Button>
                ) : (
                  <Button
                    className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => { window.location.href = `sms:${selectedLead.homeownerPhone ?? ""}`; }}
                  >
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

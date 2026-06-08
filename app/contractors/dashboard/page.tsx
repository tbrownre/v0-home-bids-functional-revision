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
  ArrowLeft,
  ExternalLink,
  DollarSign,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Plus,
  GripVertical,
  X,
  AlertCircle,
  Download,
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
  // Bid Builder-specific fields
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

interface ScopeItem {
  id: string;
  label: string;
  description: string;
  included: boolean;
  type: "labor" | "materials" | "optional" | "excluded";
  editable: boolean;
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

// Default scope items for a kitchen cabinet repaint (used as template)
const DEFAULT_SCOPE_ITEMS: ScopeItem[] = [
  { id: "1", label: "Remove cabinet doors and hardware", description: "All doors, drawers, and hardware labeled and safely stored", included: true, type: "labor", editable: true },
  { id: "2", label: "Clean and degrease surfaces", description: "TSP wash to remove grease and contaminants", included: true, type: "labor", editable: true },
  { id: "3", label: "Sand and prep cabinet faces", description: "Light sanding (220 grit) for paint adhesion", included: true, type: "labor", editable: true },
  { id: "4", label: "Prime surfaces", description: "High-adhesion bonding primer", included: true, type: "materials", editable: true },
  { id: "5", label: "Apply professional finish coat (2 coats)", description: "Benjamin Moore Advance or Sherwin Williams Emerald Urethane", included: true, type: "materials", editable: true },
  { id: "6", label: "Reinstall doors and hardware", description: "All components reinstalled and aligned", included: true, type: "labor", editable: true },
  { id: "7", label: "Cleanup work area", description: "Remove dust, debris, and protect floors", included: true, type: "labor", editable: true },
  { id: "8", label: "Soft-close hinges upgrade", description: "Add soft-close hardware to all doors (optional upgrade)", included: false, type: "optional", editable: true },
  { id: "9", label: "Cabinet box replacement", description: "Replacement of cabinet boxes not included", included: false, type: "excluded", editable: true },
];

// ── Price Check ───────────────────────────────────────────────────────────────

function getPriceCheckResponse(projectType: string, bidAmount: string, objection: string) {
  const refLink = `https://homebids.com/compare?ref=contractor-demo&project=${encodeURIComponent(projectType)}`;
  return {
    response: `I completely understand wanting to compare options — that's smart. I actually work with HomeBids, so you can easily see what other contractors are quoting for the same work and make sure you're getting a fair deal.\n\nHere's a quick link to explore additional quotes:\n${refLink}\n\nIf another contractor ends up being a better fit, no worries at all — I still appreciate the opportunity and hope the comparison is helpful.`,
    refLink,
    earnings: { potentialPerReferral: "$45–$120", jobsReferred: 7, affiliateEarned: "$490" },
  };
}

// ── Customer Response ─────────────────────────────────────────────────────────

function getCustomerResponse(message: string, tone: string, goal: string) {
  const toneMap: Record<string, string> = { professional: "professional and clear", friendly: "warm and friendly", direct: "direct and confident" };
  const toneLabel = toneMap[tone] ?? "professional";
  return {
    full: `Hi there,\n\nThank you for reaching out! ${goal ? `Regarding your question about "${goal.slice(0, 60)}" — ` : ""}I wanted to make sure I got back to you quickly.\n\nI'd love to help with your project. Based on what you've shared, I can schedule a walkthrough at your convenience — I typically have availability within 2–3 business days and can provide a same-day written estimate after the visit.\n\nFeel free to call or text me anytime. Looking forward to connecting!\n\n— [Your Name]`,
    sms: `Hi! Got your message. Happy to help with your project — I can come take a look in the next 2–3 days and give you a written estimate same day. When works for you? — [Your Name]`,
    short: `Thanks for reaching out! I'd love to help. I'm available for a walkthrough this week — does any day work for you?`,
    toneNote: `Tone applied: ${toneLabel}`,
  };
}

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = "home" | "leads" | "ai" | "account";
type AiTool = "bid" | "pricecheck" | "response" | null;
type BidStep = "review" | "scope" | "pricing" | "inspection" | "draft" | "pdf";

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

  // Auth
  const [contractorName, setContractorName] = useState("there");
  useEffect(() => {
    if (USE_MOCK_DATA) {
      const user = getMockUser();
      if (user?.firstName) setContractorName(user.firstName);
    }
  }, []);

  // Bids count
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

  // Leads segment
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
  const [activeTool, setActiveTool] = useState<AiTool>(null);

  // ── Bid Builder full wizard state ──────────────────────────────────────────

  const [bidBuilderOpen, setBidBuilderOpen] = useState(false);
  const [bidBuilderLead, setBidBuilderLead] = useState<HomeBidsLead | null>(null);
  const [bidStep, setBidStep] = useState<BidStep>("review");

  // Scope builder
  const [scopeItems, setScopeItems] = useState<ScopeItem[]>(DEFAULT_SCOPE_ITEMS);
  const [expandedScopes, setExpandedScopes] = useState<Record<string, boolean>>({});

  function toggleScope(id: string) {
    setExpandedScopes((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function toggleScopeIncluded(id: string) {
    setScopeItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, included: !item.included } : item
      )
    );
  }

  function updateScopeDescription(id: string, description: string) {
    setScopeItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, description } : item))
    );
  }

  function moveScopeUp(id: string) {
    const idx = scopeItems.findIndex((s) => s.id === id);
    if (idx <= 0) return;
    const next = [...scopeItems];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    setScopeItems(next);
  }

  function moveScopeDown(id: string) {
    const idx = scopeItems.findIndex((s) => s.id === id);
    if (idx < 0 || idx >= scopeItems.length - 1) return;
    const next = [...scopeItems];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    setScopeItems(next);
  }

  function addCustomScope() {
    const newId = `custom-${Date.now()}`;
    setScopeItems((prev) => [
      ...prev,
      {
        id: newId,
        label: "New custom item",
        description: "Click edit to customize",
        included: true,
        type: "labor",
        editable: true,
      },
    ]);
  }

  function deleteScope(id: string) {
    setScopeItems((prev) => prev.filter((s) => s.id !== id));
  }

  // Pricing
  const [laborCost, setLaborCost] = useState("800");
  const [materialCost, setMaterialCost] = useState("400");
  const [markup, setMarkup] = useState("15");
  const [complexity, setComplexity] = useState<"low" | "medium" | "high">("medium");
  const [urgency, setUrgency] = useState<"standard" | "urgent">("standard");

  const laborNum = parseFloat(laborCost) || 0;
  const materialNum = parseFloat(materialCost) || 0;
  const markupNum = parseFloat(markup) || 0;
  const subtotal = laborNum + materialNum;
  const markupAmount = subtotal * (markupNum / 100);
  const totalPrice = subtotal + markupAmount;

  // AI pricing guidance
  const priceRangeAI = complexity === "low" ? "$1,100–$1,400" : complexity === "medium" ? "$1,300–$1,700" : "$1,600–$2,100";
  const priceConfidence = complexity === "low" || complexity === "medium" ? "High" : "Medium";
  const priceWarning =
    totalPrice < 1100 ? "Your bid may be too low for this scope. Consider increasing labor or materials." :
    totalPrice > 2100 ? "Your bid is on the high end. Make sure to justify value in your proposal." :
    null;

  // Inspection request
  const [inspectionRequested, setInspectionRequested] = useState(false);
  const [inspectionMessage, setInspectionMessage] = useState("");

  // Bid draft
  const [bidDraft, setBidDraft] = useState("");
  const [draftCopied, setDraftCopied] = useState(false);

  function generateBidDraft() {
    const includedItems = scopeItems.filter((s) => s.included && s.type !== "excluded");
    const optionalItems = scopeItems.filter((s) => s.type === "optional");
    const excludedItems = scopeItems.filter((s) => s.type === "excluded");

    const draft = `
**PROJECT ESTIMATE**

${bidBuilderLead?.title ?? "Project"}
${bidBuilderLead?.location ?? ""}

**Homeowner:** ${bidBuilderLead?.homeownerName ?? "Homeowner"}
**Contractor:** [Your Company Name]
**Date:** ${new Date().toLocaleDateString()}
**Estimate Valid Through:** ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}

---

**PROJECT SUMMARY**

${bidBuilderLead?.scope ?? "As discussed"}

---

**SCOPE OF WORK**

${includedItems.map((item, i) => `${i + 1}. **${item.label}**\n   ${item.description}`).join("\n\n")}

---

**PRICING BREAKDOWN**

Labor: $${laborNum.toFixed(2)}
Materials: $${materialNum.toFixed(2)}
Subtotal: $${subtotal.toFixed(2)}
Markup (${markupNum}%): $${markupAmount.toFixed(2)}

**Total Estimate: $${totalPrice.toFixed(2)}**

---

**OPTIONAL UPGRADES**

${optionalItems.length > 0 ? optionalItems.map((item) => `• ${item.label} — ${item.description}`).join("\n") : "None"}

---

**EXCLUSIONS**

${excludedItems.length > 0 ? excludedItems.map((item) => `• ${item.label}`).join("\n") : "None"}

---

**PAYMENT TERMS**

50% deposit upon acceptance
50% upon completion

---

**TIMELINE**

${bidBuilderLead?.timeline ?? "1–2 weeks"}

---

**ACCEPTANCE**

I accept the above estimate and authorize work to begin.

Homeowner Signature: _____________________  Date: __________

---

**NOTES**

This estimate is based on the information provided. Any changes to scope may require a revised estimate. All work guaranteed for 1 year.
    `.trim();

    setBidDraft(draft);
  }

  function openBidBuilder(lead: HomeBidsLead) {
    setBidBuilderLead(lead);
    setBidStep("review");
    setScopeItems(DEFAULT_SCOPE_ITEMS);
    setLaborCost("800");
    setMaterialCost("400");
    setMarkup("15");
    setComplexity("medium");
    setUrgency("standard");
    setInspectionRequested(false);
    setInspectionMessage("");
    setBidDraft("");
    setBidBuilderOpen(true);
    setActiveTool("bid");
    setActiveTab("ai");
  }

  function closeBidBuilder() {
    setBidBuilderOpen(false);
    setBidBuilderLead(null);
    setBidStep("review");
  }

  function goToStep(step: BidStep) {
    if (step === "draft") generateBidDraft();
    setBidStep(step);
  }

  // Price Check
  const [pcProject, setPcProject] = useState("");
  const [pcBid, setPcBid] = useState("");
  const [pcObjection, setPcObjection] = useState("");
  const [pcResult, setPcResult] = useState<ReturnType<typeof getPriceCheckResponse> | null>(null);
  const [pcLoading, setPcLoading] = useState(false);
  const [pcCopied, setPcCopied] = useState(false);
  const [pcLinkCopied, setPcLinkCopied] = useState(false);

  function handlePriceCheck() {
    if (!pcProject.trim() || !pcBid.trim()) return;
    setPcLoading(true);
    setPcResult(null);
    setTimeout(() => { setPcResult(getPriceCheckResponse(pcProject, pcBid, pcObjection)); setPcLoading(false); }, 1000);
  }

  // Customer Response
  const [crMessage, setCrMessage] = useState("");
  const [crTone, setCrTone] = useState("professional");
  const [crGoal, setCrGoal] = useState("");
  const [crResult, setCrResult] = useState<ReturnType<typeof getCustomerResponse> | null>(null);
  const [crLoading, setCrLoading] = useState(false);
  const [crVersion, setCrVersion] = useState<"full" | "sms" | "short">("full");
  const [crCopied, setCrCopied] = useState(false);

  function handleCustomerResponse() {
    if (!crMessage.trim()) return;
    setCrLoading(true);
    setCrResult(null);
    setTimeout(() => { setCrResult(getCustomerResponse(crMessage, crTone, crGoal)); setCrLoading(false); }, 1000);
  }

  const handleSignOut = () => mockSignOut();

  // Derived stats
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

  // ── Shared lead card renderer ─────────────────────────────────────────────

  function renderHomeBidsLeadCard(lead: HomeBidsLead, compact = false) {
    const statusBadge =
      lead.status === "new" ? { label: "New", cls: "bg-blue-100 text-blue-700" }
      : lead.status === "bid_submitted" ? { label: "Bid Submitted", cls: "bg-amber-100 text-amber-700" }
      : { label: "Reviewing", cls: "bg-purple-100 text-purple-700" };

    const cta = lead.directMessagingUnlocked
      ? { label: "Text Homeowner", primary: true, green: true, onClick: () => { window.location.href = `sms:${lead.homeownerPhone ?? ""}`; } }
      : lead.status === "new"
      ? { label: "Build Bid", primary: true, green: false, onClick: () => openBidBuilder(lead) }
      : { label: "Send via HomeBids AI", primary: true, green: false, onClick: () => { setRelayLead(lead); setRelayMessage(lead.suggestedResponse); setRelaySent(false); setShowRelayModal(true); } };

    return (
      <div key={lead.id} className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30">
        {/* Top row */}
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

        {!compact && <p className="mt-2 text-[11px] italic text-primary/80">{lead.aiNotes}</p>}

        <div className="mt-2">
          {lead.directMessagingUnlocked ? (
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
          <Button
            size="sm"
            className={`h-7 gap-1 px-3 text-xs ${cta.green ? "bg-green-600 hover:bg-green-700 text-white" : ""}`}
            onClick={cta.onClick}
          >
            {cta.label}
          </Button>
        </div>
      </div>
    );
  }

  // ── HOME tab content ───────────────────────────────────────────────────────

  const homeContent = (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Good morning, {contractorName}.</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          You have <span className="font-semibold text-foreground">{DEMO_HOMEBIDS_LEADS.length + DEMO_MY_LEADS.length}</span> active leads.
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "New Leads",        value: newLeads,          color: "bg-blue-50 text-blue-700 border-blue-100" },
          { label: "Awaiting Approval", value: awaitingApproval, color: "bg-purple-50 text-purple-700 border-purple-100" },
          { label: "In Progress",      value: inProgress,        color: "bg-amber-50 text-amber-700 border-amber-100" },
          { label: "Bids Submitted",   value: bidsCount,         color: "bg-muted text-muted-foreground border-border" },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-xl border p-3 ${color}`}>
            <p className="text-2xl font-bold">{value}</p>
            <p className="mt-0.5 text-[11px] font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Two-column on desktop */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Left: Priority leads */}
        <div className="lg:col-span-3">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Needs your attention</h2>
          <div className="space-y-3">
            {DEMO_HOMEBIDS_LEADS.map((lead) => renderHomeBidsLeadCard(lead, false))}
          </div>
        </div>

        {/* Right: Suggested actions panel */}
        <div className="lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Suggested actions</h2>
          <div className="space-y-2">
            {[
              { icon: Calculator, label: "Build a professional bid", sub: "Kitchen Cabinet Repaint", action: () => openBidBuilder(DEMO_HOMEBIDS_LEADS[0]) },
              { icon: Eye, label: "Homeowner reviewing bid", sub: "Backyard Turf Install", action: () => handleTabChange("leads") },
              { icon: Unlock, label: "Approval unlocked", sub: "Bathroom Vanity Replacement", action: () => handleTabChange("leads") },
              { icon: MessageCircle, label: "Generate a response", sub: "Use AI Customer Response tool", action: () => { handleTabChange("ai"); setActiveTool("response"); } },
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
    </div>
  );

  // ── LEADS tab content ──────────────────────────────────────────────────────

  const leadsContent = (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-foreground">Leads</h1>

      {/* Segment toggle */}
      <div className="flex gap-1 rounded-xl bg-muted p-1">
        {(["homebids", "myleads"] as const).map((seg) => (
          <button
            key={seg}
            type="button"
            onClick={() => setLeadsSegment(seg)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
              leadsSegment === seg ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {seg === "homebids" ? <Sparkles className="h-3.5 w-3.5" /> : <Users className="h-3.5 w-3.5" />}
            {seg === "homebids" ? "HomeBids AI" : "My Leads"}
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
              leadsSegment === seg
                ? seg === "homebids" ? "bg-primary/10 text-primary" : "bg-emerald-100 text-emerald-700"
                : "bg-muted-foreground/20 text-muted-foreground"
            }`}>
              {seg === "homebids" ? DEMO_HOMEBIDS_LEADS.length : DEMO_MY_LEADS.length}
            </span>
          </button>
        ))}
      </div>

      {leadsSegment === "homebids" && (
        <div>
          <p className="mb-3 text-xs text-muted-foreground">AI-matched leads. Win approval to unlock direct contact.</p>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {DEMO_HOMEBIDS_LEADS.map((lead) => {
              const statusBadge =
                lead.status === "new" ? { label: "New", cls: "bg-blue-100 text-blue-700" }
                : lead.status === "bid_submitted" ? { label: "Bid Submitted", cls: "bg-amber-100 text-amber-700" }
                : { label: "Reviewing", cls: "bg-purple-100 text-purple-700" };
              return (
                <div key={lead.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusBadge.cls}`}>{statusBadge.label}</span>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{lead.category}</span>
                    </div>
                    <span className="shrink-0 font-semibold text-foreground">{lead.estimatedValue}</span>
                  </div>
                  <p className="mt-2 font-semibold text-foreground">{lead.title}</p>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{lead.location}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{lead.timeline}</span>
                  </div>
                  <p className="mt-2 text-[11px] italic text-primary/80 line-clamp-2">{lead.aiNotes}</p>
                  <div className="mt-2">
                    {lead.directMessagingUnlocked ? (
                      <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700 w-fit">
                        <Unlock className="h-3 w-3" /> Direct texting unlocked
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground w-fit">
                        <Lock className="h-3 w-3" /> Contact locked — win approval first
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" className="h-7 gap-1 px-2.5 text-xs bg-transparent" onClick={() => { setSelectedLead(lead); setShowLeadDetail(true); }}>
                      <Eye className="h-3 w-3" /> Details
                    </Button>
                    {lead.directMessagingUnlocked ? (
                      <Button size="sm" className="h-7 gap-1 px-3 text-xs bg-green-600 hover:bg-green-700 text-white" onClick={() => { window.location.href = `sms:${lead.homeownerPhone ?? ""}`; }}>
                        <MessageCircle className="h-3 w-3" /> Text Homeowner
                      </Button>
                    ) : (
                      <>
                        <Button size="sm" className="h-7 gap-1 px-3 text-xs" onClick={() => openBidBuilder(lead)}>
                          <Calculator className="h-3 w-3" /> Build Bid
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 gap-1 px-2.5 text-xs bg-transparent" onClick={() => { setRelayLead(lead); setRelayMessage(lead.suggestedResponse); setRelaySent(false); setShowRelayModal(true); }}>
                          <MessageCircle className="h-3 w-3" /> Send via HomeBids AI
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {leadsSegment === "myleads" && (
        <div>
          <p className="mb-3 text-xs text-muted-foreground">Your own leads — full control, text directly any time.</p>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {DEMO_MY_LEADS.map((lead) => {
              const aiStatusBadge =
                lead.aiStatus === "estimate_ready" ? { label: "Estimate Ready", cls: "bg-blue-100 text-blue-700" }
                : lead.aiStatus === "response_sent" ? { label: "Response Sent", cls: "bg-amber-100 text-amber-700" }
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
                    <span className="shrink-0 font-semibold text-foreground">{lead.estimatedValue}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{lead.category}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${aiStatusBadge.cls}`}>{aiStatusBadge.label}</span>
                  </div>
                  <p className="mt-1.5 text-[11px] text-muted-foreground">{lead.lastActivity}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" className="h-7 gap-1 px-2.5 text-xs bg-transparent" onClick={() => handleTabChange("ai")}>
                      <Sparkles className="h-3 w-3" /> AI Tools
                    </Button>
                    <Button size="sm" className="h-7 gap-1 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => { window.location.href = `sms:${lead.phone ?? ""}`; }}>
                      <MessageCircle className="h-3 w-3" /> Text Customer
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  // ── AI TOOLS tab content ───────────────────────────────────────────────────

  // Tool picker
  const aiToolList = (
    <div className="space-y-2">
      {[
        { id: "bid" as AiTool, label: "Bid Builder", desc: "Build professional estimates step by step.", icon: Calculator, bg: "bg-primary/10", iconCls: "text-primary" },
        { id: "pricecheck" as AiTool, label: "Price Check", desc: "Handle objections and earn affiliate revenue.", icon: DollarSign, bg: "bg-emerald-100", iconCls: "text-emerald-700" },
        { id: "response" as AiTool, label: "Customer Response", desc: "Generate professional replies in seconds.", icon: MessageCircle, bg: "bg-blue-100", iconCls: "text-blue-700" },
      ].map(({ id, label, desc, icon: Icon, bg, iconCls }) => (
        <button
          key={id}
          type="button"
          onClick={() => { setActiveTool(id); if (id === "bid") setBidBuilderOpen(false); }}
          className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors ${
            activeTool === id
              ? "border-primary/40 bg-primary/5"
              : "border-border bg-card hover:border-primary/30 hover:bg-primary/5"
          }`}
        >
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${bg}`}>
            <Icon className={`h-4 w-4 ${iconCls}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">{label}</p>
            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{desc}</p>
          </div>
          <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground lg:hidden" />
        </button>
      ))}
    </div>
  );

  // ── Bid Builder wizard panes ──────────────────────────────────────────────

  const bidBuilderPane = !bidBuilderLead ? (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-3">
        <Calculator className="h-7 w-7 text-primary" />
      </div>
      <p className="font-semibold text-foreground">Select a lead to build a bid</p>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">Go to Home or Leads tab and click &quot;Build Bid&quot; on any HomeBids AI lead.</p>
    </div>
  ) : (
    <div className="space-y-5">
      {/* Step nav */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {(["review", "scope", "pricing", "inspection", "draft", "pdf"] as BidStep[]).map((step, i) => {
          const stepLabels: Record<BidStep, string> = { review: "1. Review", scope: "2. Scope", pricing: "3. Pricing", inspection: "4. Inspection", draft: "5. Draft", pdf: "6. PDF" };
          const isActive = bidStep === step;
          const isPast = (["review", "scope", "pricing", "inspection", "draft", "pdf"] as BidStep[]).indexOf(bidStep) > i;
          return (
            <button
              key={step}
              type="button"
              onClick={() => goToStep(step)}
              className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                isActive ? "border-primary bg-primary/10 text-primary" :
                isPast ? "border-border bg-muted text-foreground hover:bg-muted/80" :
                "border-border bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              {stepLabels[step]}
            </button>
          );
        })}
      </div>

      {/* Step 1: Review */}
      {bidStep === "review" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Project Details</h2>
            <Button size="sm" variant="ghost" className="text-xs" onClick={closeBidBuilder}><X className="h-4 w-4" /> Close</Button>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <p className="text-sm font-semibold text-foreground">{bidBuilderLead.title}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted p-2">
                <p className="text-[10px] font-medium text-muted-foreground">Category</p>
                <p className="mt-0.5 text-sm font-semibold text-foreground">{bidBuilderLead.category}</p>
              </div>
              <div className="rounded-lg bg-muted p-2">
                <p className="text-[10px] font-medium text-muted-foreground">Location</p>
                <p className="mt-0.5 text-sm font-semibold text-foreground">{bidBuilderLead.location}</p>
              </div>
              <div className="rounded-lg bg-muted p-2">
                <p className="text-[10px] font-medium text-muted-foreground">Timeline</p>
                <p className="mt-0.5 text-sm font-semibold text-foreground">{bidBuilderLead.timeline}</p>
              </div>
              <div className="rounded-lg bg-muted p-2">
                <p className="text-[10px] font-medium text-muted-foreground">Budget Range</p>
                <p className="mt-0.5 text-sm font-semibold text-foreground">{bidBuilderLead.budgetRange}</p>
              </div>
            </div>
            <div className="pt-1">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Homeowner Goals</p>
              <p className="text-sm text-foreground">{bidBuilderLead.homeownerGoals}</p>
            </div>
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Known Scope</p>
              <p className="text-sm text-foreground">{bidBuilderLead.scope}</p>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">{bidBuilderLead.photos ?? 0} photo{(bidBuilderLead.photos ?? 0) !== 1 ? "s" : ""} attached</p>
            </div>
          </div>

          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary/80">
              <Sparkles className="h-3.5 w-3.5" /> HomeBids AI Summary
            </p>
            <p className="text-sm text-foreground">{bidBuilderLead.aiNotes}</p>
            {bidBuilderLead.missingInfo && bidBuilderLead.missingInfo.length > 0 && (
              <div className="mt-2 pt-2 border-t border-primary/20">
                <p className="text-xs font-medium text-foreground mb-1">Missing Information:</p>
                <ul className="space-y-0.5">
                  {bidBuilderLead.missingInfo.map((item, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                      <AlertCircle className="h-3 w-3 shrink-0 mt-0.5 text-amber-600" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex items-center gap-2 pt-1">
              <p className="text-xs text-muted-foreground">AI Confidence:</p>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                bidBuilderLead.aiConfidence === "High" ? "bg-green-100 text-green-700" :
                bidBuilderLead.aiConfidence === "Medium" ? "bg-amber-100 text-amber-700" :
                "bg-red-100 text-red-700"
              }`}>
                {bidBuilderLead.aiConfidence ?? "Unknown"}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="flex items-center gap-2 text-xs font-semibold text-amber-700 mb-1">
              <Sparkles className="h-3.5 w-3.5" /> AI Guidance
            </p>
            <p className="text-sm text-amber-900">
              HomeBids AI has enough information to help you draft a bid, but you may want to confirm prep work and material preferences before final pricing.
            </p>
          </div>

          <Button className="w-full gap-2" onClick={() => goToStep("scope")}>
            Continue to Scope Builder <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Step 2: Scope Builder */}
      {bidStep === "scope" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Scope Builder</h2>
            <Button size="sm" variant="ghost" className="text-xs" onClick={() => goToStep("review")}><ArrowLeft className="h-4 w-4" /> Back</Button>
          </div>

          <p className="text-sm text-muted-foreground">Select, edit, reorder, and customize the scope items for this bid.</p>

          <div className="space-y-2">
            {scopeItems.map((item, idx) => (
              <div key={item.id} className={`rounded-xl border p-3 ${item.included ? "border-primary/30 bg-primary/5" : "border-border bg-card"}`}>
                <div className="flex items-start gap-2">
                  <Checkbox
                    checked={item.included}
                    onCheckedChange={() => toggleScopeIncluded(item.id)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${item.included ? "text-foreground" : "text-muted-foreground line-through"}`}>
                      {item.label}
                      {item.type === "optional" && <span className="ml-2 rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-semibold text-blue-700">Optional</span>}
                      {item.type === "excluded" && <span className="ml-2 rounded-full bg-red-100 px-1.5 py-0.5 text-[9px] font-semibold text-red-700">Excluded</span>}
                    </p>
                    {expandedScopes[item.id] && (
                      <div className="mt-2 space-y-2">
                        <Textarea
                          value={item.description}
                          onChange={(e) => updateScopeDescription(item.id, e.target.value)}
                          rows={2}
                          className="text-xs resize-none"
                        />
                      </div>
                    )}
                    {!expandedScopes[item.id] && (
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{item.description}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button type="button" onClick={() => toggleScope(item.id)} className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground">
                      {expandedScopes[item.id] ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>
                    <button type="button" onClick={() => moveScopeUp(item.id)} disabled={idx === 0} className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground disabled:opacity-30">
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={() => moveScopeDown(item.id)} disabled={idx === scopeItems.length - 1} className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground disabled:opacity-30">
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                    {item.id.startsWith("custom-") && (
                      <button type="button" onClick={() => deleteScope(item.id)} className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button variant="outline" size="sm" className="gap-2 bg-transparent" onClick={addCustomScope}>
            <Plus className="h-4 w-4" /> Add Custom Scope Item
          </Button>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="flex items-center gap-2 text-xs font-semibold text-amber-700 mb-1">
              <Sparkles className="h-3.5 w-3.5" /> AI Guidance
            </p>
            <p className="text-sm text-amber-900">
              You may want to exclude drywall repair unless confirmed. Consider adding a soft-close hinges upsell for extra value.
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 bg-transparent" onClick={() => goToStep("review")}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <Button className="flex-1 gap-2" onClick={() => goToStep("pricing")}>
              Continue to Pricing <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Pricing Guidance */}
      {bidStep === "pricing" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Pricing Guidance</h2>
            <Button size="sm" variant="ghost" className="text-xs" onClick={() => goToStep("scope")}><ArrowLeft className="h-4 w-4" /> Back</Button>
          </div>

          <p className="text-sm text-muted-foreground">Enter your labor, materials, and markup. AI will provide pricing guidance.</p>

          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="labor" className="text-xs font-medium">Labor Cost ($)</Label>
              <Input id="labor" type="number" value={laborCost} onChange={(e) => setLaborCost(e.target.value)} className="text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="materials" className="text-xs font-medium">Materials Cost ($)</Label>
              <Input id="materials" type="number" value={materialCost} onChange={(e) => setMaterialCost(e.target.value)} className="text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="markup" className="text-xs font-medium">Markup (%)</Label>
              <Input id="markup" type="number" value={markup} onChange={(e) => setMarkup(e.target.value)} className="text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Project Complexity</Label>
              <div className="flex gap-2">
                {(["low", "medium", "high"] as const).map((c) => (
                  <button key={c} type="button" onClick={() => setComplexity(c)}
                    className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium capitalize transition-colors ${
                      complexity === c ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground hover:text-foreground"
                    }`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Timeline Urgency</Label>
              <div className="flex gap-2">
                {(["standard", "urgent"] as const).map((u) => (
                  <button key={u} type="button" onClick={() => setUrgency(u)}
                    className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium capitalize transition-colors ${
                      urgency === u ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground hover:text-foreground"
                    }`}>
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary/80">
              <Sparkles className="h-3.5 w-3.5" /> Your Bid Total
            </p>
            <p className="text-3xl font-bold text-foreground">${totalPrice.toFixed(2)}</p>
            <div className="grid grid-cols-2 gap-2 pt-1 text-xs text-muted-foreground">
              <p>Labor: ${laborNum.toFixed(2)}</p>
              <p>Materials: ${materialNum.toFixed(2)}</p>
              <p>Subtotal: ${subtotal.toFixed(2)}</p>
              <p>Markup: ${markupAmount.toFixed(2)}</p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">AI Pricing Guidance</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-muted p-2">
                <p className="text-[10px] text-muted-foreground">Suggested Range</p>
                <p className="mt-0.5 text-sm font-semibold text-foreground">{priceRangeAI}</p>
              </div>
              <div className="rounded-lg bg-muted p-2">
                <p className="text-[10px] text-muted-foreground">Confidence</p>
                <p className="mt-0.5 text-sm font-semibold text-foreground">{priceConfidence}</p>
              </div>
            </div>
            {priceWarning && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2 mt-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                <p className="text-xs text-amber-900">{priceWarning}</p>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="flex items-center gap-2 text-xs font-semibold text-amber-700 mb-1">
              <Sparkles className="h-3.5 w-3.5" /> AI Guidance
            </p>
            <p className="text-sm text-amber-900">
              This timeline sounds urgent. Consider adding a rush fee or confirming availability. The homeowner mentioned budget sensitivity — lead with value and warranty.
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 bg-transparent" onClick={() => goToStep("scope")}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <Button className="flex-1 gap-2" onClick={() => goToStep("inspection")}>
              Continue <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Inspection Request Option */}
      {bidStep === "inspection" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Inspection Request</h2>
            <Button size="sm" variant="ghost" className="text-xs" onClick={() => goToStep("pricing")}><ArrowLeft className="h-4 w-4" /> Back</Button>
          </div>

          <p className="text-sm text-muted-foreground">If you need more information before submitting a final bid, request an in-person inspection.</p>

          {!inspectionRequested ? (
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <p className="text-sm font-medium text-foreground">Do you have enough information to submit a bid?</p>
              <div className="flex gap-2">
                <Button className="flex-1 gap-2" onClick={() => goToStep("draft")}>
                  Yes — Generate Bid <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" className="flex-1 gap-2 bg-transparent" onClick={() => setInspectionRequested(true)}>
                  No — Request Inspection
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-2">
                <p className="flex items-center gap-2 text-xs font-semibold text-amber-700">
                  <AlertCircle className="h-3.5 w-3.5" /> Inspection Request
                </p>
                <p className="text-sm text-amber-900">
                  Your inspection request will be sent through HomeBids AI. The homeowner will be asked to approve or decline. If approved, you&apos;ll coordinate next steps.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                <Label htmlFor="inspection-msg" className="text-xs font-medium">Message to homeowner</Label>
                <Textarea
                  id="inspection-msg"
                  value={inspectionMessage}
                  onChange={(e) => setInspectionMessage(e.target.value)}
                  rows={4}
                  placeholder={`Thanks for the project details. To give you an accurate bid, I'd like to complete a quick in-person inspection first. I need to verify measurements, material condition, and access before final pricing. Would you like to approve this inspection request?`}
                  className="text-sm resize-none"
                />
                <Button className="w-full gap-2" disabled={!inspectionMessage.trim()}>
                  <Send className="h-4 w-4" /> Send Inspection Request
                </Button>
              </div>
              <Button variant="outline" className="w-full bg-transparent" onClick={() => setInspectionRequested(false)}>
                Cancel — Go Back
              </Button>
            </>
          )}
        </div>
      )}

      {/* Step 5: AI Bid Draft */}
      {bidStep === "draft" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Bid Draft</h2>
            <Button size="sm" variant="ghost" className="text-xs" onClick={() => goToStep("pricing")}><ArrowLeft className="h-4 w-4" /> Back</Button>
          </div>

          <p className="text-sm text-muted-foreground">Review your AI-generated bid draft. You can copy, edit, or export as PDF.</p>

          <div className="rounded-xl border border-border bg-muted/40 p-4 max-h-[400px] overflow-y-auto">
            <pre className="whitespace-pre-wrap text-xs leading-relaxed text-foreground">{bidDraft}</pre>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="flex items-center gap-2 text-xs font-semibold text-amber-700 mb-1">
              <Sparkles className="h-3.5 w-3.5" /> AI Guidance
            </p>
            <p className="text-sm text-amber-900">
              Make the bid more homeowner-friendly by leading with value and warranty. Add a line about your availability and response time.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" className="gap-1 bg-transparent" onClick={() => { copyToClipboard(bidDraft).then(() => { setDraftCopied(true); setTimeout(() => setDraftCopied(false), 2000); }); }}>
              <Copy className="h-3.5 w-3.5" />{draftCopied ? "Copied!" : "Copy Bid"}
            </Button>
            <Button size="sm" variant="outline" className="gap-1 bg-transparent" onClick={() => goToStep("pdf")}>
              <FileText className="h-3.5 w-3.5" /> View PDF
            </Button>
            <Button size="sm" variant="outline" className="gap-1 bg-transparent" onClick={() => { window.location.href = `sms:?body=${encodeURIComponent(bidDraft.slice(0, 300) + "...")}`; }}>
              <Send className="h-3.5 w-3.5" /> Send via SMS
            </Button>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 bg-transparent" onClick={() => goToStep("pricing")}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <Button className="flex-1 gap-2" onClick={() => goToStep("pdf")}>
              Continue to PDF <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 6: PDF Generation & Submit */}
      {bidStep === "pdf" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">PDF & Submit</h2>
            <Button size="sm" variant="ghost" className="text-xs" onClick={() => goToStep("draft")}><ArrowLeft className="h-4 w-4" /> Back</Button>
          </div>

          <p className="text-sm text-muted-foreground">Your bid is ready. Download the PDF and submit to the homeowner.</p>

          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center space-y-2">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <FileText className="h-8 w-8 text-primary" />
              </div>
            </div>
            <p className="font-semibold text-foreground">{bidBuilderLead.title}</p>
            <p className="text-sm text-muted-foreground">Total: ${totalPrice.toFixed(2)}</p>
            <Button className="w-full gap-2 mt-2" onClick={() => window.print()}>
              <Download className="h-4 w-4" /> Download PDF
            </Button>
          </div>

          {bidBuilderLead.directMessagingUnlocked ? (
            <>
              <div className="rounded-xl border border-green-200 bg-green-50 p-4 space-y-2">
                <p className="flex items-center gap-2 text-xs font-semibold text-green-700">
                  <Unlock className="h-3.5 w-3.5" /> Direct Messaging Unlocked
                </p>
                <p className="text-sm text-green-900">You can text the homeowner directly with your bid.</p>
              </div>
              <Button className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white" onClick={() => { window.location.href = `sms:${bidBuilderLead.homeownerPhone ?? ""}?body=${encodeURIComponent("Hi! I've completed your estimate. I'll send the PDF shortly.")}`; }}>
                <MessageCircle className="h-4 w-4" /> Text Homeowner
              </Button>
            </>
          ) : (
            <>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-2">
                <p className="flex items-center gap-2 text-xs font-semibold text-amber-700">
                  <Lock className="h-3.5 w-3.5" /> Contact Locked
                </p>
                <p className="text-sm text-amber-900">
                  Direct messaging unlocks after homeowner approval. Submit your bid through HomeBids AI.
                </p>
              </div>
              <Button className="w-full gap-2" onClick={() => { setRelayLead(bidBuilderLead); setRelayMessage(`Hi ${bidBuilderLead.homeownerName}, I've completed your estimate for ${bidBuilderLead.title}. I'd love to discuss the details and answer any questions.`); setRelaySent(false); setShowRelayModal(true); closeBidBuilder(); }}>
                <Send className="h-4 w-4" /> Submit Bid via HomeBids AI
              </Button>
            </>
          )}

          <Button variant="outline" className="w-full gap-2 bg-transparent" onClick={closeBidBuilder}>
            <CheckCircle2 className="h-4 w-4" /> Done — Close Bid Builder
          </Button>
        </div>
      )}
    </div>
  );

  // Price check pane
  const priceCheckPane = (
    <div className="space-y-5">
      <div className="flex items-center gap-3 lg:hidden">
        <button type="button" onClick={() => setActiveTool(null)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h2 className="font-bold text-foreground">Price Check</h2>
          <p className="text-xs text-muted-foreground">Turn pricing objections into affiliate revenue</p>
        </div>
      </div>
      <div className="hidden lg:block">
        <h2 className="font-bold text-foreground">Price Check</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">Turn pricing objections into affiliate revenue</p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[{ label: "Jobs Referred", value: "7", icon: Users }, { label: "Avg. Earn/Job", value: "$70", icon: DollarSign }, { label: "Total Earned", value: "$490", icon: TrendingUp }].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-3 text-center">
            <Icon className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
            <p className="text-base font-bold text-foreground">{value}</p>
            <p className="text-[10px] text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3 rounded-xl border border-border bg-card p-4">
        <div className="space-y-1.5">
          <Label htmlFor="pc-project" className="text-xs font-medium">Project type</Label>
          <Input id="pc-project" placeholder="e.g. Kitchen cabinet repaint" value={pcProject} onChange={(e) => setPcProject(e.target.value)} className="text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pc-bid" className="text-xs font-medium">Your bid amount</Label>
          <Input id="pc-bid" placeholder="e.g. $1,450" value={pcBid} onChange={(e) => setPcBid(e.target.value)} className="text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pc-objection" className="text-xs font-medium">Homeowner objection (optional)</Label>
          <Input id="pc-objection" placeholder={`e.g. "I want to get more bids first"`} value={pcObjection} onChange={(e) => setPcObjection(e.target.value)} className="text-sm" />
        </div>
        <Button className="w-full gap-2" onClick={handlePriceCheck} disabled={!pcProject.trim() || !pcBid.trim() || pcLoading}>
          {pcLoading ? <span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />Generating...</span> : <><Sparkles className="h-4 w-4" /> Generate Response &amp; Referral Link</>}
        </Button>
      </div>

      {pcResult && (
        <div className="space-y-3">
          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Suggested Response</p>
            <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{pcResult.response}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" className="h-7 gap-1 px-2.5 text-xs bg-transparent" onClick={() => { copyToClipboard(pcResult.response); setPcCopied(true); setTimeout(() => setPcCopied(false), 2000); }}>
                <Copy className="h-3 w-3" />{pcCopied ? "Copied!" : "Copy"}
              </Button>
              <Button size="sm" variant="outline" className="h-7 gap-1 px-2.5 text-xs bg-transparent" onClick={() => { window.location.href = `sms:?body=${encodeURIComponent(pcResult.response)}`; }}>
                <Send className="h-3 w-3" /> Send via SMS
              </Button>
            </div>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">Your HomeBids Referral Link</p>
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-2">
              <p className="flex-1 truncate text-xs text-foreground font-mono">{pcResult.refLink}</p>
              <button type="button" onClick={() => { copyToClipboard(pcResult.refLink); setPcLinkCopied(true); setTimeout(() => setPcLinkCopied(false), 2000); }} className="shrink-0 text-emerald-700 hover:text-emerald-900">
                {pcLinkCopied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
              <a href={pcResult.refLink} target="_blank" rel="noopener noreferrer" className="shrink-0 text-emerald-700 hover:text-emerald-900"><ExternalLink className="h-4 w-4" /></a>
            </div>
            <p className="text-xs text-emerald-800">
              If the homeowner hires another contractor through HomeBids, you earn <span className="font-semibold">{pcResult.earnings.potentialPerReferral}</span> in affiliate revenue — automatically.
            </p>
          </div>
        </div>
      )}
    </div>
  );

  // Customer response pane
  const customerResponsePane = (
    <div className="space-y-5">
      <div className="flex items-center gap-3 lg:hidden">
        <button type="button" onClick={() => setActiveTool(null)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h2 className="font-bold text-foreground">Customer Response</h2>
          <p className="text-xs text-muted-foreground">Generate a professional reply in seconds</p>
        </div>
      </div>
      <div className="hidden lg:block">
        <h2 className="font-bold text-foreground">Customer Response</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">Generate a professional reply in seconds</p>
      </div>

      <div className="space-y-3 rounded-xl border border-border bg-card p-4">
        <div className="space-y-1.5">
          <Label htmlFor="cr-message" className="text-xs font-medium">Homeowner message or situation</Label>
          <Textarea id="cr-message" rows={3} placeholder={`e.g. "Your quote seems high. Can you do it for less?"`} value={crMessage} onChange={(e) => setCrMessage(e.target.value)} className="resize-none text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Tone</Label>
          <div className="flex gap-2">
            {(["professional", "friendly", "direct"] as const).map((t) => (
              <button key={t} type="button" onClick={() => setCrTone(t)}
                className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium capitalize transition-colors ${
                  crTone === t ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:text-foreground"
                }`}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cr-goal" className="text-xs font-medium">Desired outcome (optional)</Label>
          <Input id="cr-goal" placeholder="e.g. Schedule a walkthrough, defend pricing, follow up" value={crGoal} onChange={(e) => setCrGoal(e.target.value)} className="text-sm" />
        </div>
        <Button className="w-full gap-2" onClick={handleCustomerResponse} disabled={!crMessage.trim() || crLoading}>
          {crLoading ? <span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />Generating...</span> : <><Sparkles className="h-4 w-4" /> Generate Response</>}
        </Button>
      </div>

      {crResult && (
        <div className="space-y-3">
          <div className="flex gap-1 rounded-lg bg-muted p-1">
            {(["full", "sms", "short"] as const).map((v) => (
              <button key={v} type="button" onClick={() => setCrVersion(v)}
                className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${crVersion === v ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                {v === "full" ? "Full" : v === "sms" ? "SMS" : "Short"}
              </button>
            ))}
          </div>
          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{crResult[crVersion]}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" className="h-7 gap-1 px-2.5 text-xs bg-transparent"
                onClick={() => { copyToClipboard(crResult[crVersion]); setCrCopied(true); setTimeout(() => setCrCopied(false), 2000); }}>
                <Copy className="h-3 w-3" />{crCopied ? "Copied!" : "Copy"}
              </Button>
              <Button size="sm" variant="outline" className="h-7 gap-1 px-2.5 text-xs bg-transparent"
                onClick={() => { window.location.href = `sms:?body=${encodeURIComponent(crResult[crVersion])}`; }}>
                <Send className="h-3 w-3" /> Send via SMS
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const aiContent = (
    <>
      {/* ── MOBILE: single-pane with back navigation ── */}
      <div className="lg:hidden space-y-5">
        {activeTool === null && (
          <>
            <div>
              <h1 className="text-xl font-bold text-foreground">AI Tools</h1>
              <p className="mt-1 text-sm text-muted-foreground">Your AI co-pilot for bids, pricing, and customer communication.</p>
            </div>
            {aiToolList}
          </>
        )}
        {activeTool === "bid" && bidBuilderPane}
        {activeTool === "pricecheck" && priceCheckPane}
        {activeTool === "response" && customerResponsePane}
      </div>

      {/* ── DESKTOP: two-column workspace ── */}
      <div className="hidden lg:flex lg:gap-6" style={{ minHeight: "calc(100vh - 200px)" }}>
        {/* Left: tool list */}
        <div className="w-64 shrink-0">
          <div className="mb-4">
            <h1 className="text-lg font-bold text-foreground">AI Tools</h1>
            <p className="mt-0.5 text-xs text-muted-foreground">Select a tool to get started.</p>
          </div>
          {aiToolList}
        </div>
        {/* Right: active tool workspace */}
        <div className="flex-1 min-w-0 rounded-xl border border-border bg-card p-6">
          {activeTool === null && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-3">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <p className="font-semibold text-foreground">Choose a tool to get started</p>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">Select Bid Builder, Price Check, or Customer Response from the panel on the left.</p>
            </div>
          )}
          {activeTool === "bid" && bidBuilderPane}
          {activeTool === "pricecheck" && priceCheckPane}
          {activeTool === "response" && customerResponsePane}
        </div>
      </div>
    </>
  );

  // ── ACCOUNT tab content ────────────────────────────────────────────────────

  const accountContent = (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-foreground">Account</h1>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-start">
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
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Mail className="h-4 w-4 shrink-0" />contractor@homebids.demo</div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Phone className="h-4 w-4 shrink-0" />(480) 555-0192</div>
          </div>
        </div>

        {/* Plan */}
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2">
          <h2 className="text-sm font-semibold text-primary">Your Plan</h2>
          <p className="text-2xl font-bold text-foreground">$99 / month</p>
          <ul className="space-y-1.5 pt-1">
            {[
              "Unlimited AI-generated bids",
              "No bid fees — ever",
              "HomeBids AI lead matching",
              "Direct homeowner contact after approval",
              "AI Bid Builder, Price Check, and Customer Response tools",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-foreground">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Notifications */}
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
    <div className="flex min-h-screen flex-col bg-background">
      <Header isContractor isSignedIn />
      <ScrollToTop />

      {/* Main content */}
      <main className="flex-1 min-w-0">
        <div className="mx-auto w-full max-w-2xl px-4 pb-28 pt-6 lg:max-w-3xl lg:px-8 lg:pb-24 lg:pt-8">
          {tabContent[activeTab]}
        </div>
      </main>

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background">
        <div className="mx-auto flex max-w-3xl">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
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
                <Button className="w-full gap-2" onClick={() => { setShowLeadDetail(false); openBidBuilder(selectedLead); }}>
                  <Calculator className="h-4 w-4" /> Build Bid
                </Button>
                {!selectedLead.directMessagingUnlocked ? (
                  <Button variant="outline" className="w-full gap-2 bg-transparent" onClick={() => { setRelayLead(selectedLead); setRelayMessage(selectedLead.suggestedResponse); setRelaySent(false); setShowLeadDetail(false); setTimeout(() => setShowRelayModal(true), 150); }}>
                    <MessageCircle className="h-4 w-4" /> Message via HomeBids AI
                  </Button>
                ) : (
                  <Button className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white" onClick={() => { window.location.href = `sms:${selectedLead.homeownerPhone ?? ""}`; }}>
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

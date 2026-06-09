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
  X,
  AlertCircle,
  Download,
  Shield,
} from "lucide-react";
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
type BidStep = "notes" | "review" | "scope" | "pricing" | "draft";

// ── AI assistant suggestions ───────────────────────────────────────────────────

const AI_SUGGESTIONS = [
  "Cabinet jobs like this typically include hardware removal and door labeling to avoid reinstall errors.",
  "The homeowner mentioned timeline urgency — you may want to add a rush availability note.",
  "Consider excluding drywall repair unless it's been confirmed in scope. It's a common surprise cost.",
  "Similar projects in Gilbert this month averaged $4,800–$6,200. Your pricing looks competitive.",
  "Adding a soft-close hinge upsell here could increase your ticket by $150–$250 with minimal effort.",
  "Homeowner mentioned kids at home — lead with your low-VOC paint selection in the proposal intro.",
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
  useEffect(() => {
    if (USE_MOCK_DATA) {
      const user = getMockUser();
      if (user?.firstName) setContractorName(user.firstName);
    }
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

  // ── Bid Builder state ──────────────────────────────────────────────────────

  const [bidBuilderLead, setBidBuilderLead] = useState<HomeBidsLead | null>(null);
  const [bidStep, setBidStep] = useState<BidStep>("notes");

  // Rough notes entry (step 1)
  const [roughNotes, setRoughNotes] = useState("");
  const [roughCustomer, setRoughCustomer] = useState("");
  const [roughLocation, setRoughLocation] = useState("");
  const [roughTimeline, setRoughTimeline] = useState("");
  const [roughBudget, setRoughBudget] = useState("");

  // AI follow-up answers
  const [aiFollowUpAnswers, setAiFollowUpAnswers] = useState<string[]>(["", "", "", ""]);
  const [aiOrganizing, setAiOrganizing] = useState(false);
  const [scopeItems, setScopeItems] = useState<ScopeItem[]>(DEFAULT_SCOPE_ITEMS);
  const [expandedScopes, setExpandedScopes] = useState<Record<string, boolean>>({});
  const [laborCost, setLaborCost] = useState("800");
  const [materialCost, setMaterialCost] = useState("400");
  const [markup, setMarkup] = useState("15");
  const [complexity, setComplexity] = useState<"low" | "medium" | "high">("medium");
  const [bidNotes, setBidNotes] = useState("");
  const [bidDraft, setBidDraft] = useState("");
  const [draftCopied, setDraftCopied] = useState(false);
  const [aiSuggestionIdx, setAiSuggestionIdx] = useState(0);
  const suggestionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const laborNum = parseFloat(laborCost) || 0;
  const materialNum = parseFloat(materialCost) || 0;
  const markupNum = parseFloat(markup) || 0;
  const subtotal = laborNum + materialNum;
  const markupAmount = subtotal * (markupNum / 100);
  const totalPrice = subtotal + markupAmount;

  const priceRangeAI = complexity === "low" ? "$1,100–$1,400" : complexity === "medium" ? "$1,300–$1,700" : "$1,600–$2,100";
  const priceWarning =
    totalPrice < 1100 ? "Your bid may be too low for this scope. Consider increasing labor or materials." :
    totalPrice > 2100 ? "Your bid is on the high end. Make sure to justify value in your proposal." :
    null;

  function toggleScope(id: string) {
    setExpandedScopes((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function toggleScopeIncluded(id: string) {
    setScopeItems((prev) => prev.map((item) => item.id === id ? { ...item, included: !item.included } : item));
  }

  function updateScopeDescription(id: string, description: string) {
    setScopeItems((prev) => prev.map((item) => item.id === id ? { ...item, description } : item));
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
      { id: newId, label: "New custom item", description: "Click edit to customize", included: true, type: "labor", editable: true },
    ]);
  }

  function deleteScope(id: string) {
    setScopeItems((prev) => prev.filter((s) => s.id !== id));
  }

  function generateBidDraft() {
    const includedItems = scopeItems.filter((s) => s.included && s.type !== "excluded");
    const optionalItems = scopeItems.filter((s) => s.type === "optional");
    const excludedItems = scopeItems.filter((s) => s.type === "excluded");
    const draft = `PROJECT ESTIMATE\n\n${bidBuilderLead?.title ?? "Project"}\n${bidBuilderLead?.location ?? ""}\n\nHomeowner: ${bidBuilderLead?.homeownerName ?? "Homeowner"}\nContractor: [Your Company Name]\nDate: ${new Date().toLocaleDateString()}\nEstimate Valid Through: ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}\n\n---\n\nPROJECT SUMMARY\n\n${bidBuilderLead?.scope ?? "As discussed"}\n\n---\n\nSCOPE OF WORK\n\n${includedItems.map((item, i) => `${i + 1}. ${item.label}\n   ${item.description}`).join("\n\n")}\n\n---\n\nPRICING BREAKDOWN\n\nLabor: $${laborNum.toFixed(2)}\nMaterials: $${materialNum.toFixed(2)}\nSubtotal: $${subtotal.toFixed(2)}\nMarkup (${markupNum}%): $${markupAmount.toFixed(2)}\n\nTotal Estimate: $${totalPrice.toFixed(2)}\n\n---\n\nOPTIONAL UPGRADES\n\n${optionalItems.length > 0 ? optionalItems.map((item) => `• ${item.label} — ${item.description}`).join("\n") : "None"}\n\n---\n\nEXCLUSIONS\n\n${excludedItems.length > 0 ? excludedItems.map((item) => `• ${item.label}`).join("\n") : "None"}\n\n---\n\nPAYMENT TERMS\n\n50% deposit upon acceptance\n50% upon completion\n\n---\n\nTIMELINE\n\n${bidBuilderLead?.timeline ?? "1–2 weeks"}\n\n---\n\nNOTES\n\n${bidNotes || "This estimate is based on the information provided. Any changes to scope may require a revised estimate. All work guaranteed for 1 year."}\n\n---\n\nACCEPTANCE\n\nI accept the above estimate and authorize work to begin.\n\nHomeowner Signature: _____________________  Date: __________`;
    setBidDraft(draft);
  }

  function createNewBid(lead?: HomeBidsLead) {
    // Always start completely fresh — no stale data ever carries over
    setBidBuilderLead(lead ?? null);
    setBidStep("notes");
    setRoughNotes(lead ? `${lead.title}. ${lead.scope}` : "");
    setRoughCustomer(lead ? lead.homeownerName : "");
    setRoughLocation(lead ? lead.location : "");
    setRoughTimeline(lead ? lead.timeline : "");
    setRoughBudget(lead ? lead.budgetRange : "");
    setAiFollowUpAnswers(["", "", "", ""]);
    setAiOrganizing(false);
    setScopeItems(DEFAULT_SCOPE_ITEMS);
    setLaborCost("800");
    setMaterialCost("400");
    setMarkup("15");
    setComplexity("medium");
    setBidNotes("");
    setBidDraft("");
    setAiSuggestionIdx(0);
    setActiveTool("bid");
    setActiveTab("ai");
  }

  // Legacy alias so existing lead card buttons still work
  const openBidBuilder = createNewBid;

  function closeBidBuilder() {
    setBidBuilderLead(null);
    setBidStep("notes");
    setRoughNotes("");
    setRoughCustomer("");
    setRoughLocation("");
    setRoughTimeline("");
    setRoughBudget("");
    setAiFollowUpAnswers(["", "", "", ""]);
    setAiOrganizing(false);
    setActiveTool(null);
  }

  function goToStep(step: BidStep) {
    if (step === "draft") generateBidDraft();
    setBidStep(step);
  }

  // Simulate AI organizing rough notes → moves to review step
  function organizeWithAI() {
    setAiOrganizing(true);
    setTimeout(() => {
      setAiOrganizing(false);
      setBidStep("review");
    }, 1800);
  }

  // Rotate AI suggestions in Bid Mode
  useEffect(() => {
    if (activeTool === "bid" && bidBuilderLead) {
      suggestionTimerRef.current = setInterval(() => {
        setAiSuggestionIdx((i) => (i + 1) % AI_SUGGESTIONS.length);
      }, 8000);
    }
    return () => { if (suggestionTimerRef.current) clearInterval(suggestionTimerRef.current); };
  }, [activeTool, bidBuilderLead]);

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
          {lead.directMessagingUnlocked ? (
            <Button size="sm" className="h-7 gap-1 px-3 text-xs bg-green-600 hover:bg-green-700 text-white" onClick={() => openSms(lead.homeownerPhone)}>
              <MessageCircle className="h-3 w-3" /> Text Homeowner
            </Button>
          ) : lead.status === "new" ? (
            <Button size="sm" className="h-7 gap-1 px-3 text-xs" onClick={() => openBidBuilder(lead)}>
              <Calculator className="h-3 w-3" /> Build Bid
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

  const homeContent = (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Good morning, {contractorName}.</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          You have <span className="font-semibold text-foreground">{DEMO_HOMEBIDS_LEADS.length + DEMO_MY_LEADS.length}</span> active leads.
        </p>
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
              { icon: Calculator, label: "Build a professional bid", sub: "Kitchen Cabinet Repaint", action: () => openBidBuilder(DEMO_HOMEBIDS_LEADS[0]) },
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
    </div>
  );

  // ── LEADS tab ──────────────────────────────────────────────────────────────

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
                  <Button size="sm" className="h-7 gap-1 px-3 text-xs" onClick={() => {
                    setRoughNotes(lead.projectTitle);
                    setRoughCustomer(lead.customerName);
                    createNewBid();
                  }}>
                    <Calculator className="h-3 w-3" /> Create New Bid
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
                  {lead.directMessagingUnlocked ? (
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
                  <Button size="sm" className="h-7 gap-1 px-3 text-xs" onClick={() => openBidBuilder(lead)}>
                    <Calculator className="h-3 w-3" /> Build Bid
                  </Button>
                  {lead.directMessagingUnlocked ? (
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

        {/* ── LEFT: My Leads (primary) ── */}
  // ── AI TOOLS tab ───────────────────────────────────────────────────────────

  // Live PDF preview (used in Bid Mode right panel)
  const livePdfPreview = (
    <div className="rounded-xl border border-border bg-white text-[11px] leading-relaxed text-foreground shadow-sm">
      {/* PDF header */}
      <div className="border-b border-border bg-muted/30 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-foreground">[Your Company Name]</p>
            <p className="text-muted-foreground">Professional Estimate</p>
          </div>
          <div className="text-right text-muted-foreground">
            <p>Date: {new Date().toLocaleDateString()}</p>
            <p>Valid 30 days</p>
          </div>
        </div>
      </div>
      {/* Client + project */}
      <div className="border-b border-border px-4 py-3">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="font-semibold text-muted-foreground uppercase tracking-wider" style={{ fontSize: "9px" }}>Client</p>
            <p className="font-medium">{bidBuilderLead?.homeownerName ?? "Homeowner"}</p>
            <p className="text-muted-foreground">{bidBuilderLead?.location ?? ""}</p>
          </div>
          <div>
            <p className="font-semibold text-muted-foreground uppercase tracking-wider" style={{ fontSize: "9px" }}>Project</p>
            <p className="font-medium">{bidBuilderLead?.title ?? "Project"}</p>
            <p className="text-muted-foreground">{bidBuilderLead?.timeline ?? ""}</p>
          </div>
        </div>
      </div>
      {/* Scope */}
      <div className="border-b border-border px-4 py-3">
        <p className="mb-2 font-semibold text-muted-foreground uppercase tracking-wider" style={{ fontSize: "9px" }}>Scope of Work</p>
        {scopeItems.filter((s) => s.included && s.type !== "excluded").map((item, i) => (
          <div key={item.id} className="mb-1 flex gap-2">
            <span className="shrink-0 font-medium">{i + 1}.</span>
            <div>
              <span className="font-medium">{item.label}</span>
              <span className="text-muted-foreground"> — {item.description}</span>
            </div>
          </div>
        ))}
      </div>
      {/* Pricing */}
      <div className="border-b border-border px-4 py-3">
        <p className="mb-2 font-semibold text-muted-foreground uppercase tracking-wider" style={{ fontSize: "9px" }}>Pricing</p>
        <div className="space-y-0.5">
          <div className="flex justify-between"><span>Labor</span><span>${laborNum.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Materials</span><span>${materialNum.toFixed(2)}</span></div>
          {markupNum > 0 && <div className="flex justify-between text-muted-foreground"><span>Markup ({markupNum}%)</span><span>${markupAmount.toFixed(2)}</span></div>}
          <div className="flex justify-between border-t border-border pt-1 font-bold">
            <span>Total Estimate</span><span>${totalPrice.toFixed(2)}</span>
          </div>
        </div>
      </div>
      {/* Exclusions */}
      {scopeItems.some((s) => s.type === "excluded") && (
        <div className="border-b border-border px-4 py-3">
          <p className="mb-1.5 font-semibold text-muted-foreground uppercase tracking-wider" style={{ fontSize: "9px" }}>Exclusions</p>
          {scopeItems.filter((s) => s.type === "excluded").map((item) => (
            <p key={item.id} className="text-muted-foreground">• {item.label}</p>
          ))}
        </div>
      )}
      {/* Notes + acceptance */}
      {bidNotes && (
        <div className="border-b border-border px-4 py-3">
          <p className="mb-1 font-semibold text-muted-foreground uppercase tracking-wider" style={{ fontSize: "9px" }}>Notes</p>
          <p className="text-muted-foreground">{bidNotes}</p>
        </div>
      )}
      <div className="px-4 py-3">
        <p className="mb-2 font-semibold text-muted-foreground uppercase tracking-wider" style={{ fontSize: "9px" }}>Acceptance</p>
        <p className="text-muted-foreground">Homeowner Signature: _____________________ &nbsp; Date: __________</p>
        <p className="mt-2 text-muted-foreground" style={{ fontSize: "9px" }}>50% deposit on acceptance · 50% on completion · 1-year workmanship guarantee</p>
      </div>
    </div>
  );

  // Create New Bid — full immersive workspace
  // Always renders the workspace; bidBuilderLead is optional context
  const bidBuilderWorkspace = (
    // Create New Bid workspace
    <div className="flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3 lg:px-6 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
            <Calculator className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Create New Bid</p>
            <p className="text-[10px] text-muted-foreground">
              {bidBuilderLead ? `${bidBuilderLead.title} · ${bidBuilderLead.homeownerName}` : "New bid — no lead selected"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Step pills */}
          <div className="hidden sm:flex items-center gap-1">
            {(["notes", "review", "scope", "pricing", "draft"] as BidStep[]).map((step, i) => {
              const labels: Record<BidStep, string> = { notes: "Details", review: "Review", scope: "Scope", pricing: "Pricing", draft: "Draft" };
              const steps: BidStep[] = ["notes", "review", "scope", "pricing", "draft"];
              const isPast = steps.indexOf(bidStep) > i;
              const isActive = bidStep === step;
              return (
                <button
                  key={step}
                  type="button"
                  onClick={() => step !== "notes" || bidStep !== "notes" ? goToStep(step) : undefined}
                  className={`rounded-full px-3 py-1 text-[10px] font-semibold transition-colors ${
                    isActive ? "bg-primary text-primary-foreground" :
                    isPast ? "bg-primary/20 text-primary" :
                    "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {i + 1}. {labels[step]}
                </button>
              );
            })}
          </div>
          <Button size="sm" variant="ghost" className="h-7 gap-1 px-2 text-xs text-muted-foreground" onClick={closeBidBuilder}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Bid Mode content */}
      <div className="flex flex-col lg:flex-row lg:min-h-[600px]">

        {/* ── LEFT: Scope workspace ── */}
        <div className="flex-1 min-w-0 px-4 py-5 lg:px-6">

          {/* Mobile step pills */}
          <div className="mb-4 flex items-center gap-1 sm:hidden overflow-x-auto pb-1">
            {(["notes", "review", "scope", "pricing", "draft"] as BidStep[]).map((step, i) => {
              const labels: Record<BidStep, string> = { notes: "Details", review: "Review", scope: "Scope", pricing: "Pricing", draft: "Draft" };
              const steps: BidStep[] = ["notes", "review", "scope", "pricing", "draft"];
              const isActive = bidStep === step;
              const isPast = steps.indexOf(bidStep) > i;
              return (
                <button
                  key={step}
                  type="button"
                  onClick={() => goToStep(step)}
                  className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-semibold transition-colors ${
                    isActive ? "bg-primary text-primary-foreground" :
                    isPast ? "bg-primary/20 text-primary" :
                    "bg-muted text-muted-foreground"
                  }`}
                >
                  {i + 1}. {labels[step]}
                </button>
              );
            })}
          </div>

          {/* Step 0: Rough Notes + AI Questions */}
          {bidStep === "notes" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-foreground">Create New Bid</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add rough project details and HomeBids AI will turn them into a clean, professional bid.
                </p>
              </div>

              {/* Primary: rough notes textarea */}
              <div className="space-y-1.5">
                <Label htmlFor="rough-notes" className="text-xs font-medium">Project notes <span className="text-muted-foreground font-normal">(required)</span></Label>
                <Textarea
                  id="rough-notes"
                  rows={4}
                  placeholder={"e.g. Kitchen cabinet repaint, 28 doors, white finish, homeowner wants it done next month.\nor: Backyard turf install, about 900 sqft, needs removal of old grass.\nor: Bathroom vanity replacement, homeowner has vanity already, need install and plumbing hookup."}
                  value={roughNotes}
                  onChange={(e) => setRoughNotes(e.target.value)}
                  className="text-sm resize-none"
                />
              </div>

              {/* Optional detail fields */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="rough-customer" className="text-xs font-medium">Customer name <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <Input id="rough-customer" placeholder="e.g. Sarah M." value={roughCustomer} onChange={(e) => setRoughCustomer(e.target.value)} className="text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="rough-location" className="text-xs font-medium">Location <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <Input id="rough-location" placeholder="e.g. Gilbert, AZ" value={roughLocation} onChange={(e) => setRoughLocation(e.target.value)} className="text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="rough-timeline" className="text-xs font-medium">Timeline <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <Input id="rough-timeline" placeholder="e.g. 1–2 weeks" value={roughTimeline} onChange={(e) => setRoughTimeline(e.target.value)} className="text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="rough-budget" className="text-xs font-medium">Approx budget or bid amount <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <Input id="rough-budget" placeholder="e.g. $1,500 or $1,000–$2,000" value={roughBudget} onChange={(e) => setRoughBudget(e.target.value)} className="text-sm" />
                </div>
              </div>

              {/* AI follow-up questions — appear once notes are typed */}
              {roughNotes.trim().length > 20 && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">HomeBids AI — a few quick questions</p>
                  </div>
                  <p className="text-sm text-muted-foreground -mt-2">
                    Got it. I&apos;ll help build this into a professional bid. Answer what you can — AI will fill the rest.
                  </p>
                  {[
                    "Are there any specific materials, brands, or products the customer wants?",
                    "Are there items that should be explicitly excluded from scope?",
                    "Any optional upgrades or upsells you want to include?",
                    "Any special conditions — access issues, timing constraints, permits needed?",
                  ].map((question, i) => (
                    <div key={i} className="space-y-1.5">
                      <Label className="text-xs font-medium text-foreground">{question}</Label>
                      <Input
                        placeholder="Type your answer or leave blank — AI will infer"
                        value={aiFollowUpAnswers[i]}
                        onChange={(e) => {
                          const updated = [...aiFollowUpAnswers];
                          updated[i] = e.target.value;
                          setAiFollowUpAnswers(updated);
                        }}
                        className="text-sm"
                      />
                    </div>
                  ))}
                </div>
              )}

              <Button
                className="w-full gap-2"
                disabled={roughNotes.trim().length < 5 || aiOrganizing}
                onClick={organizeWithAI}
              >
                {aiOrganizing ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    AI is organizing your bid...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> Let AI Build My Bid
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Step 1: Review */}
          {bidStep === "review" && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-foreground">Project Details</h3>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { label: "Category", value: bidBuilderLead?.category ?? roughNotes.split(",")[0] ?? "—" },
                  { label: "Location", value: bidBuilderLead?.location ?? (roughLocation || "—") },
                  { label: "Timeline", value: bidBuilderLead?.timeline ?? (roughTimeline || "—") },
                  { label: "Budget Range", value: bidBuilderLead?.budgetRange ?? (roughBudget || "—") },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-lg bg-muted p-2.5">
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
                    <p className="mt-0.5 text-sm font-semibold text-foreground">{value}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-3 rounded-xl border border-border bg-card p-4">
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Homeowner Goals</p>
                  <p className="text-sm text-foreground">{bidBuilderLead?.homeownerGoals ?? "Based on your project notes above."}</p>
                </div>
                <div className="border-t border-border pt-3">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Known Scope</p>
                  <p className="text-sm text-foreground">{bidBuilderLead?.scope ?? roughNotes}</p>
                </div>
                {(bidBuilderLead?.photos ?? 0) > 0 && (
                  <div className="flex items-center gap-2 border-t border-border pt-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">{bidBuilderLead!.photos} photo{bidBuilderLead!.photos !== 1 ? "s" : ""} attached</p>
                  </div>
                )}
              </div>

              {(bidBuilderLead?.missingInfo?.length ?? 0) > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-amber-700">
                    <AlertCircle className="h-3.5 w-3.5" /> Missing Information
                  </p>
                  {bidBuilderLead!.missingInfo!.map((item, i) => (
                    <p key={i} className="text-sm text-amber-900">• {item}</p>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2">
                <p className="text-xs text-muted-foreground">AI Confidence</p>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  bidBuilderLead?.aiConfidence === "High" ? "bg-green-100 text-green-700" :
                  bidBuilderLead?.aiConfidence === "Medium" ? "bg-amber-100 text-amber-700" :
                  "bg-blue-100 text-blue-700"
                }`}>{bidBuilderLead?.aiConfidence ?? "Ready"}</span>
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
                <h3 className="text-base font-bold text-foreground">Scope Builder</h3>
                <Button size="sm" variant="ghost" className="h-7 gap-1 px-2 text-xs" onClick={() => goToStep("review")}><ArrowLeft className="h-3.5 w-3.5" />Back</Button>
              </div>
              <p className="text-sm text-muted-foreground">Check, reorder, and customize scope items. The live preview updates automatically.</p>

              <div className="space-y-2">
                {scopeItems.map((item, idx) => (
                  <div key={item.id} className={`rounded-xl border p-3 ${item.included ? "border-primary/30 bg-primary/5" : "border-border bg-card"}`}>
                    <div className="flex items-start gap-2">
                      <Checkbox checked={item.included} onCheckedChange={() => toggleScopeIncluded(item.id)} className="mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${item.included ? "text-foreground" : "text-muted-foreground line-through"}`}>
                          {item.label}
                          {item.type === "optional" && <span className="ml-2 rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-semibold text-blue-700">Optional</span>}
                          {item.type === "excluded" && <span className="ml-2 rounded-full bg-red-100 px-1.5 py-0.5 text-[9px] font-semibold text-red-700">Excluded</span>}
                        </p>
                        {expandedScopes[item.id] ? (
                          <Textarea value={item.description} onChange={(e) => updateScopeDescription(item.id, e.target.value)} rows={2} className="mt-2 text-xs resize-none" />
                        ) : (
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
                <Plus className="h-4 w-4" /> Add Custom Item
              </Button>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 bg-transparent" onClick={() => goToStep("review")}><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
                <Button className="flex-1 gap-2" onClick={() => goToStep("pricing")}>Continue to Pricing <ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}

          {/* Step 3: Pricing */}
          {bidStep === "pricing" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-foreground">Pricing</h3>
                <Button size="sm" variant="ghost" className="h-7 gap-1 px-2 text-xs" onClick={() => goToStep("scope")}><ArrowLeft className="h-3.5 w-3.5" />Back</Button>
              </div>

              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="labor" className="text-xs font-medium">Labor ($)</Label>
                  <Input id="labor" type="number" value={laborCost} onChange={(e) => setLaborCost(e.target.value)} className="text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="materials" className="text-xs font-medium">Materials ($)</Label>
                  <Input id="materials" type="number" value={materialCost} onChange={(e) => setMaterialCost(e.target.value)} className="text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="markup" className="text-xs font-medium">Markup (%)</Label>
                  <Input id="markup" type="number" value={markup} onChange={(e) => setMarkup(e.target.value)} className="text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Complexity</Label>
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
                  <Label htmlFor="bid-notes" className="text-xs font-medium">Notes (optional)</Label>
                  <Textarea id="bid-notes" value={bidNotes} onChange={(e) => setBidNotes(e.target.value)} rows={2} className="text-xs resize-none" placeholder="Any special conditions, warranty info, or clarifications..." />
                </div>
              </div>

              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary/80 mb-1">Your Total</p>
                <p className="text-3xl font-bold text-foreground">${totalPrice.toFixed(2)}</p>
                <p className="mt-1 text-xs text-muted-foreground">AI suggested range: <span className="font-semibold text-foreground">{priceRangeAI}</span></p>
                {priceWarning && (
                  <div className="mt-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2">
                    <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                    <p className="text-xs text-amber-900">{priceWarning}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 bg-transparent" onClick={() => goToStep("scope")}><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
                <Button className="flex-1 gap-2" onClick={() => goToStep("draft")}>Generate Bid Draft <ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}

          {/* Step 4: Draft + Submit */}
          {bidStep === "draft" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-foreground">Bid Draft</h3>
                <Button size="sm" variant="ghost" className="h-7 gap-1 px-2 text-xs" onClick={() => goToStep("pricing")}><ArrowLeft className="h-3.5 w-3.5" />Back</Button>
              </div>

              <div className="rounded-xl border border-border bg-muted/40 p-4 max-h-72 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-xs leading-relaxed text-foreground">{bidDraft}</pre>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" className="gap-1 bg-transparent" onClick={() => { copyToClipboard(bidDraft).then(() => { setDraftCopied(true); setTimeout(() => setDraftCopied(false), 2000); }); }}>
                  <Copy className="h-3.5 w-3.5" />{draftCopied ? "Copied!" : "Copy Bid"}
                </Button>
                <Button size="sm" variant="outline" className="gap-1 bg-transparent" onClick={() => window.print()}>
                  <Download className="h-3.5 w-3.5" /> Download PDF
                </Button>
                <Button size="sm" variant="outline" className="gap-1 bg-transparent" onClick={() => openSms(undefined, bidDraft.slice(0, 300) + "...")}>
                  <Send className="h-3.5 w-3.5" /> Send via SMS
                </Button>
              </div>

              {bidBuilderLead?.directMessagingUnlocked ? (
                <Button className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white" onClick={() => openSms(bidBuilderLead?.homeownerPhone, "Hi! I've completed your estimate — I'll send the PDF shortly.")}>
                  <MessageCircle className="h-4 w-4" /> Text Homeowner
                </Button>
              ) : bidBuilderLead ? (
                <Button className="w-full gap-2" onClick={() => { setRelayLead(bidBuilderLead); setRelayMessage(`Hi ${bidBuilderLead.homeownerName}, I've completed your estimate for ${bidBuilderLead.title}. I'd love to discuss the details.`); setRelaySent(false); setShowRelayModal(true); closeBidBuilder(); }}>
                  <Send className="h-4 w-4" /> Submit via HomeBids AI
                </Button>
              ) : null}
              <Button variant="outline" className="w-full bg-transparent gap-2" onClick={closeBidBuilder}>
                <CheckCircle2 className="h-4 w-4" /> Done — Save &amp; Close
              </Button>
            </div>
          )}
        </div>

        {/* ── RIGHT: AI assistant + live PDF preview (desktop only) ── */}
        <div className="hidden lg:flex lg:w-72 xl:w-80 shrink-0 flex-col border-l border-border overflow-hidden">
          {/* AI assistant */}
          <div className="border-b border-border bg-muted/20 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
              </div>
              <p className="text-xs font-semibold text-foreground">AI Assistant</p>
            </div>
            <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5 min-h-[56px]">
              <p className="text-xs leading-relaxed text-foreground italic">{AI_SUGGESTIONS[aiSuggestionIdx]}</p>
            </div>
            <div className="mt-2 flex justify-center gap-1">
              {AI_SUGGESTIONS.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setAiSuggestionIdx(i)}
                  className={`h-1.5 rounded-full transition-all ${i === aiSuggestionIdx ? "w-4 bg-primary" : "w-1.5 bg-muted-foreground/30"}`}
                />
              ))}
            </div>
          </div>

          {/* Live PDF preview */}
          <div className="flex-1 overflow-y-auto p-4 min-h-0">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Live PDF Preview</p>
              <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[9px] font-medium text-green-700">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" /> Live
              </span>
            </div>
            {livePdfPreview}
          </div>
        </div>
      </div>
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
    // Bid Builder is full-screen when active
    if (activeTool === "bid") {
      return (
        <div className="-mx-4 lg:-mx-8">
          {bidBuilderWorkspace}
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
            onClick={() => createNewBid()}
            className="group flex flex-col rounded-2xl border-2 border-border bg-card p-6 text-left transition-all hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                <Calculator className="h-6 w-6 text-primary" />
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-foreground">Bid Builder</h3>
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
              Build professional estimates with a live PDF preview. AI guides your scope, pricing, and wording in real time.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {["Scope Builder", "Live PDF Preview", "AI Guidance", "Submit"].map((tag) => (
                <span key={tag} className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-medium text-primary">{tag}</span>
              ))}
            </div>
            <div className="mt-5">
              <span className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors group-hover:bg-primary/90">
                <Zap className="h-4 w-4" /> Create New Bid
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
                  onClick={() => openBidBuilder(lead)}
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
                <Button className="w-full gap-2" onClick={() => { setShowLeadDetail(false); openBidBuilder(selectedLead); }}>
                  <Calculator className="h-4 w-4" /> Build Bid
                </Button>
                {!selectedLead.directMessagingUnlocked ? (
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

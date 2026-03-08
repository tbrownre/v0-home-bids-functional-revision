"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { getOpenJobs, submitBid } from "@/lib/supabase/actions";
import { isDemoModeClient } from "@/lib/demo/config";
import * as demoServices from "@/lib/demo/services";
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
  Search,
  Filter,
  Users,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Zap,
  Home,
  Wrench,
  Flame,
  Droplets,
  Wind,
  Hammer,
  ChevronRight,
  ChevronLeft,
  Star,
  Send,
  Eye,
  CreditCard,
  ImageIcon,
  X,
  Loader2,
} from "lucide-react";
import Link from "next/link";

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
  preferredContact: string;
  imageCount: number;
}

// Sample available jobs
const allAvailableJobs: AvailableJob[] = [
  {
    id: "aj1",
    title: "AC Unit Not Cooling",
    description: "Central AC running but not cooling effectively. House is 1800 sq ft. Unit is about 8 years old. Looking for diagnosis and repair.",
    location: "Austin, TX 78704",
    budget: "$500 - $1,500",
    timeline: "ASAP",
    postedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    category: "HVAC",
    urgency: "high",
    bidsCount: 2,
    homeownerName: "Jennifer M.",
    propertyType: "Single Family Home",
    preferredContact: "Phone or Text",
    imageCount: 3,
  },
  {
    id: "aj2",
    title: "Roof Leak Repair",
    description: "Small leak in master bedroom ceiling after recent rain. Need inspection and repair. Roof is about 15 years old, asphalt shingles.",
    location: "Round Rock, TX 78681",
    budget: "$300 - $800",
    timeline: "This week",
    postedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    category: "Roofing",
    urgency: "high",
    bidsCount: 4,
    homeownerName: "Robert K.",
    propertyType: "Single Family Home",
    preferredContact: "Email",
    imageCount: 5,
  },
  {
    id: "aj3",
    title: "Water Heater Replacement",
    description: "50-gallon gas water heater needs replacement. Current unit is 12 years old and leaking. Looking for energy-efficient options.",
    location: "Cedar Park, TX 78613",
    budget: "$1,500 - $3,000",
    timeline: "1-2 weeks",
    postedAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
    category: "Plumbing",
    urgency: "medium",
    bidsCount: 3,
    homeownerName: "Amanda S.",
    propertyType: "Single Family Home",
    preferredContact: "Phone",
    imageCount: 2,
  },
  {
    id: "aj4",
    title: "Thermostat Installation",
    description: "Want to upgrade to smart thermostat. Currently have basic programmable unit. Considering Nest or Ecobee.",
    location: "Pflugerville, TX 78660",
    budget: "$150 - $400",
    timeline: "Flexible",
    postedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    category: "HVAC",
    urgency: "low",
    bidsCount: 1,
    homeownerName: "Chris L.",
    propertyType: "Townhouse",
    preferredContact: "Text",
    imageCount: 0,
  },
  {
    id: "aj5",
    title: "Gutter Cleaning & Repair",
    description: "Full gutter cleaning and minor repair. Two-story home, approximately 180 linear feet. Some sections may need reattachment.",
    location: "Austin, TX 78745",
    budget: "$200 - $500",
    timeline: "This month",
    postedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    category: "Roofing",
    urgency: "low",
    bidsCount: 5,
    homeownerName: "Patricia W.",
    propertyType: "Single Family Home",
    preferredContact: "Email",
    imageCount: 4,
  },
  {
    id: "aj6",
    title: "Electrical Panel Upgrade",
    description: "Need to upgrade from 100A to 200A panel. Planning to add EV charger and home office. House built in 1985.",
    location: "Austin, TX 78731",
    budget: "$2,000 - $4,000",
    timeline: "2-3 weeks",
    postedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    category: "Electrical",
    urgency: "medium",
    bidsCount: 2,
    homeownerName: "Michael T.",
    propertyType: "Single Family Home",
    preferredContact: "Phone",
    imageCount: 1,
  },
  {
    id: "aj7",
    title: "Bathroom Faucet Replacement",
    description: "Replace two bathroom faucets - one in master bath, one in guest bath. Would like modern brushed nickel fixtures.",
    location: "Lakeway, TX 78734",
    budget: "$200 - $400",
    timeline: "Flexible",
    postedAt: new Date(Date.now() - 18 * 60 * 60 * 1000),
    category: "Plumbing",
    urgency: "low",
    bidsCount: 6,
    homeownerName: "Linda B.",
    propertyType: "Single Family Home",
    preferredContact: "Text",
    imageCount: 2,
  },
  {
    id: "aj8",
    title: "HVAC Annual Maintenance",
    description: "Looking for a reliable company for annual AC tune-up and maintenance. 3-ton unit, about 5 years old.",
    location: "Georgetown, TX 78626",
    budget: "$100 - $200",
    timeline: "Next 2 weeks",
    postedAt: new Date(Date.now() - 30 * 60 * 60 * 1000),
    category: "HVAC",
    urgency: "low",
    bidsCount: 8,
    homeownerName: "David R.",
    propertyType: "Single Family Home",
    preferredContact: "Email",
    imageCount: 0,
  },
  {
    id: "aj9",
    title: "Kitchen Sink Clog",
    description: "Kitchen sink draining very slowly. Tried basic drain cleaner with no success. May need professional snaking.",
    location: "Austin, TX 78759",
    budget: "$100 - $250",
    timeline: "ASAP",
    postedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    category: "Plumbing",
    urgency: "high",
    bidsCount: 1,
    homeownerName: "Nancy H.",
    propertyType: "Condo",
    preferredContact: "Phone",
    imageCount: 1,
  },
  {
    id: "aj10",
    title: "Ceiling Fan Installation",
    description: "Install 3 ceiling fans in bedrooms. Electrical boxes already in place. Fans will be provided by homeowner.",
    location: "Bee Cave, TX 78738",
    budget: "$300 - $500",
    timeline: "1-2 weeks",
    postedAt: new Date(Date.now() - 36 * 60 * 60 * 1000),
    category: "Electrical",
    urgency: "low",
    bidsCount: 4,
    homeownerName: "Steve G.",
    propertyType: "Single Family Home",
    preferredContact: "Text",
    imageCount: 0,
  },
  {
    id: "aj11",
    title: "Storm Damage Roof Repair",
    description: "Major hail damage to roof from recent storm. Multiple shingles missing, possible structural damage to decking. Insurance claim filed and approved. Contractor inspection required before work begins.",
    location: "Round Rock, TX 78664",
    budget: "TBD - Insurance Paid",
    timeline: "2-3 weeks",
    postedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    category: "Roofing",
    urgency: "high",
    bidsCount: 1,
    homeownerName: "Karen D.",
    propertyType: "Single Family Home",
    preferredContact: "Phone",
    imageCount: 7,
  },
];

const categories = [
  { id: "all", label: "All Jobs", icon: Briefcase },
  { id: "HVAC", label: "HVAC", icon: Wind },
  { id: "Plumbing", label: "Plumbing", icon: Droplets },
  { id: "Electrical", label: "Electrical", icon: Zap },
  { id: "Roofing", label: "Roofing", icon: Home },
];

const urgencyConfig = {
  high: { label: "Urgent", color: "bg-red-100 text-red-700 border-red-200" },
  medium: { label: "Soon", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  low: { label: "Flexible", color: "bg-green-100 text-green-700 border-green-200" },
};

export default function ContractorJobsMarketplace() {
  const searchParams = useSearchParams();
  const [jobs, setJobs] = useState<AvailableJob[]>(allAvailableJobs);

  // Fetch jobs from Supabase (or demo data when in demo mode)
  useEffect(() => {
    const loader = isDemoModeClient() ? demoServices.getOpenJobs : getOpenJobs;
    loader().then(({ jobs: dbJobs }) => {
      if (dbJobs && dbJobs.length > 0) {
        const mapped: AvailableJob[] = dbJobs.map((j: any) => ({
          id: j.id,
          title: j.title,
          description: j.description,
          location: j.location,
          budget: j.budget_min && j.budget_max ? `$${j.budget_min}–$${j.budget_max}` : j.budget_min ? `$${j.budget_min}+` : "Negotiable",
          timeline: "Flexible",
          postedAt: new Date(j.created_at),
          category: j.category,
          urgency: "medium" as const,
          bidsCount: j.bids?.[0]?.count ?? 0,
          homeownerName: j.profiles?.full_name
            ? j.profiles.full_name.split(" ")[0] + " " + (j.profiles.full_name.split(" ")[1]?.[0] ?? "") + "."
            : "Homeowner",
        }));
        setJobs(mapped);
      }
    });
  }, []);
  const [selectedJob, setSelectedJob] = useState<AvailableJob | null>(null);
  const [showMobileDetail, setShowMobileDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterUrgency, setFilterUrgency] = useState("all");
  
  // Bid submission modal state
  const [showBidModal, setShowBidModal] = useState(false);
  const [bidJob, setBidJob] = useState<AvailableJob | null>(null);
  const [bidAmount, setBidAmount] = useState("");
  const [bidTimeline, setBidTimeline] = useState("");
  const [bidMessage, setBidMessage] = useState("");
  const [bidMode, setBidMode] = useState<"bid_only" | "bid_and_inspection" | "inspection_only">("bid_only");
  const [bidInspectionFee, setBidInspectionFee] = useState("");
  const [bidFreeInspection, setBidFreeInspection] = useState(false);
  const [bidFinancing, setBidFinancing] = useState<boolean | null>(null);
  const [bidSubmitted, setBidSubmitted] = useState(false);
  const [showBidConfirm, setShowBidConfirm] = useState(false);
  const [bidSubmitting, setBidSubmitting] = useState(false);
  const [bidError, setBidError] = useState<string | null>(null);

  // Image gallery state
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [galleryJobTitle, setGalleryJobTitle] = useState("");

  // Messenger state
  const [showMessenger, setShowMessenger] = useState(false);
  const [messengerJob, setMessengerJob] = useState<AvailableJob | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState<{ id: string; text: string; sender: "contractor" | "homeowner"; time: Date }[]>([]);

  // Auto-select job from URL param (e.g. ?jobId=aj1)
  // If ?action=chat, also open the messenger for that job
  // Uses a ref guard to only process URL params once on mount
  const didProcessParams = useRef(false);
  useEffect(() => {
    if (didProcessParams.current) return;
    const jobId = searchParams.get("jobId");
    const action = searchParams.get("action");
    if (jobId) {
      const matchedJob = allAvailableJobs.find((j) => j.id === jobId);
      if (matchedJob) {
        didProcessParams.current = true;
        setSelectedJob(matchedJob);
        setShowMobileDetail(true);
        if (action === "chat") {
          setMessengerJob(matchedJob);
          setMessages([]);
          setMessageInput("");
          setShowMessenger(true);
        }
      }
    }
  }, [searchParams]);

  const handleSelectJob = (job: AvailableJob) => {
    setSelectedJob(job);
    setShowMobileDetail(true);
  };

  const handleBackToList = () => {
    setShowMobileDetail(false);
  };

  const handleOpenBidModal = (job: AvailableJob) => {
    setBidJob(job);
    setBidMode("bid_only");
    setBidAmount("");
    setBidTimeline("");
    setBidMessage("");
    setBidInspectionFee("");
    setBidFreeInspection(false);
    setBidSubmitted(false);
    setShowBidConfirm(false);
    setShowBidModal(true);
  };

  const handleSubmitBid = () => {
    if (!bidJob) return;
    if (bidMode === "inspection_only") {
      if (!bidFreeInspection && !bidInspectionFee) return;
    } else {
      if (!bidAmount || !bidTimeline) return;
    }
    setShowBidConfirm(true);
  };

  const handleConfirmBidSubmit = async () => {
    if (!bidJob || bidSubmitting) return;
    setBidSubmitting(true);
    setBidError(null);
    const result = await submitBid({
      job_id: bidJob.id,
      amount: parseFloat(bidAmount) || 0,
      message: bidMessage,
      timeline: bidTimeline || undefined,
    });
    setBidSubmitting(false);
    if (result.error) {
      setBidError(result.error);
      return;
    }
    setShowBidConfirm(false);
    setBidSubmitted(true);
  };

  const handleOpenMessenger = (job: AvailableJob) => {
    setMessengerJob(job);
    setMessageInput("");
    setMessages([]);
    setShowMessenger(true);
  };

  const handleSendMessage = () => {
    if (!messageInput.trim() || !messengerJob) return;
    const newMessage = {
      id: Date.now().toString(),
      text: messageInput.trim(),
      sender: "contractor" as const,
      time: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
    setMessageInput("");

    // Simulate homeowner auto-reply after a short delay
    setTimeout(() => {
      const replies = [
        "Thanks for reaching out! Let me get back to you on that shortly.",
        "Good question. I'll check and get back to you within the hour.",
        "Hi! Yes, I can provide more details. Give me a moment.",
        "Thanks for asking. I'll send over some photos as well.",
      ];
      const reply = {
        id: (Date.now() + 1).toString(),
        text: replies[Math.floor(Math.random() * replies.length)],
        sender: "homeowner" as const,
        time: new Date(),
      };
      setMessages((prev) => [...prev, reply]);
    }, 1500);
  };

  // Stock images per category for demo
  const stockImages: Record<string, string[]> = {
    HVAC: [
      "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&q=80",
      "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800&q=80",
      "https://images.unsplash.com/photo-1631545806609-22fbc6d4a9aa?w=800&q=80",
      "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&q=80",
      "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80",
    ],
    Plumbing: [
      "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800&q=80",
      "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=800&q=80",
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80",
      "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80",
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80",
    ],
    Electrical: [
      "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&q=80",
      "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80",
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80",
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80",
      "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800&q=80",
    ],
    Roofing: [
      "https://images.unsplash.com/photo-1632759145351-1d592919f522?w=800&q=80",
      "https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=800&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
      "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80",
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80",
    ],
  };

  const handleOpenImageGallery = (job: AvailableJob) => {
    const imgs = stockImages[job.category] || stockImages.HVAC;
    setGalleryImages(imgs.slice(0, job.imageCount));
    setGalleryIndex(0);
    setGalleryJobTitle(job.title);
    setShowImageGallery(true);
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "all" || job.category === filterCategory;
    const matchesUrgency = filterUrgency === "all" || job.urgency === filterUrgency;
    return matchesSearch && matchesCategory && matchesUrgency;
  });

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "1 day ago";
    return `${diffDays} days ago`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header isContractor />

      <main className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Page Header */}
          <div className={`mb-6 ${showMobileDetail ? "hidden lg:block" : "block"}`}>
            <div className="flex items-center gap-3 mb-4">
              <Link
                href="/contractors/dashboard"
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Link>
            </div>
            <div className="text-center lg:text-left">
              <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Available Jobs</h1>
              <p className="mt-2 text-muted-foreground">
                Browse and bid on jobs that match your expertise
              </p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className={`mb-6 space-y-4 ${showMobileDetail ? "hidden lg:block" : "block"}`}>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search jobs by title, location, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setFilterCategory(cat.id)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all sm:text-sm ${
                    filterCategory === cat.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  <cat.icon className="h-3.5 w-3.5" />
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Urgency Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={filterUrgency}
                onChange={(e) => setFilterUrgency(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
              >
                <option value="all">All Urgency</option>
                <option value="high">Urgent Only</option>
                <option value="medium">Soon</option>
                <option value="low">Flexible</option>
              </select>
              <span className="ml-auto text-xs text-muted-foreground sm:text-sm">
                {filteredJobs.length} job{filteredJobs.length !== 1 ? "s" : ""} available
              </span>
            </div>
          </div>

          {/* Jobs Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Jobs List */}
            <div className={`space-y-3 ${showMobileDetail ? "hidden lg:block" : "block"}`}>
              {filteredJobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-8 text-center">
                  <Briefcase className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 font-medium text-foreground">No jobs found</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Try adjusting your filters or check back later
                  </p>
                </div>
              ) : (
                filteredJobs.map((job) => (
                  <motion.button
                    key={job.id}
                    type="button"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => handleSelectJob(job)}
                    className={`relative w-full rounded-xl p-4 text-left transition-all ${
                      selectedJob?.id === job.id
                        ? "bg-primary/10 ring-2 ring-primary shadow-sm"
                        : "bg-card hover:bg-muted/50 border border-border hover:border-primary/30 hover:shadow-sm"
                    }`}
                  >
                    {/* Urgency Badge */}
                    {job.urgency === "high" && (
                      <span className="absolute -top-2 right-3 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                        Urgent
                      </span>
                    )}

                    <div className="flex items-start gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        selectedJob?.id === job.id ? "bg-primary text-primary-foreground" : "bg-primary/10"
                      }`}>
                        {job.category === "HVAC" && <Wind className={`h-5 w-5 ${selectedJob?.id === job.id ? "" : "text-primary"}`} />}
                        {job.category === "Plumbing" && <Droplets className={`h-5 w-5 ${selectedJob?.id === job.id ? "" : "text-primary"}`} />}
                        {job.category === "Electrical" && <Zap className={`h-5 w-5 ${selectedJob?.id === job.id ? "" : "text-primary"}`} />}
                        {job.category === "Roofing" && <Home className={`h-5 w-5 ${selectedJob?.id === job.id ? "" : "text-primary"}`} />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-foreground text-sm sm:text-base">{job.title}</h3>
                          <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${urgencyConfig[job.urgency].color}`}>
                            {urgencyConfig[job.urgency].label}
                          </span>
                        </div>

                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {job.location}
                        </p>

                        <p className="mt-2 line-clamp-2 text-xs text-muted-foreground sm:text-sm">
                          {job.description}
                        </p>
                        {job.imageCount > 0 && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleOpenImageGallery(job); }}
                            className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                          >
                            <ImageIcon className="h-3 w-3" />
                            See Images ({job.imageCount})
                          </button>
                        )}

                        <div className="mt-3 flex flex-wrap items-center gap-2 sm:gap-3">
                          <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold ${
                            job.budget === "TBD - Insurance Paid"
                              ? "bg-blue-50 text-blue-700"
                              : "bg-green-50 text-green-700"
                          }`}>
                            <DollarSign className="h-3 w-3" />
                            {job.budget}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {job.timeline}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="h-3 w-3" />
                            {job.bidsCount} bid{job.bidsCount !== 1 ? "s" : ""}
                          </span>
                          <span className="ml-auto text-[10px] text-muted-foreground/70">
                            {formatTimeAgo(job.postedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.button>
                ))
              )}
            </div>

            {/* Job Detail Panel */}
            <div className={`lg:sticky lg:top-8 lg:self-start ${showMobileDetail ? "block" : "hidden lg:block"}`}>
              <AnimatePresence mode="wait">
                {selectedJob ? (
                  <motion.div
                    key={selectedJob.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="rounded-xl border border-border bg-card overflow-y-auto max-h-[calc(100vh-4rem)] lg:max-h-[calc(100vh-6rem)]"
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
                        Back to Jobs
                      </Button>
                    </div>

                    {/* Header */}
                    <div className="border-b border-border p-6">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${urgencyConfig[selectedJob.urgency].color}`}>
                              {urgencyConfig[selectedJob.urgency].label}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Posted {formatTimeAgo(selectedJob.postedAt)}
                            </span>
                          </div>
                          <h2 className="mt-2 text-xl font-bold text-foreground">{selectedJob.title}</h2>
                          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            {selectedJob.location}
                          </p>
                        </div>
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                          {selectedJob.category === "HVAC" && <Wind className="h-6 w-6 text-primary" />}
                          {selectedJob.category === "Plumbing" && <Droplets className="h-6 w-6 text-primary" />}
                          {selectedJob.category === "Electrical" && <Zap className="h-6 w-6 text-primary" />}
                          {selectedJob.category === "Roofing" && <Home className="h-6 w-6 text-primary" />}
                        </div>
                      </div>
                    </div>

                    {/* Job Details */}
                    <div className="border-b border-border p-6">
                      <h3 className="font-semibold text-foreground mb-3">Job Description</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {selectedJob.description}
                      </p>
                      {selectedJob.imageCount > 0 && (
                        <button
                          type="button"
                          onClick={() => handleOpenImageGallery(selectedJob)}
                          className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                        >
                          <ImageIcon className="h-3.5 w-3.5" />
                          See Images ({selectedJob.imageCount} photos from homeowner)
                        </button>
                      )}

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className={`rounded-lg p-3 ${selectedJob.budget === "TBD - Insurance Paid" ? "bg-blue-50 border border-blue-200" : "bg-green-50"}`}>
                          <p className={`text-xs ${selectedJob.budget === "TBD - Insurance Paid" ? "text-blue-600" : "text-green-600"}`}>Budget</p>
                          <p className={`mt-1 text-lg font-bold ${selectedJob.budget === "TBD - Insurance Paid" ? "text-blue-700" : "text-green-700"}`}>{selectedJob.budget}</p>
                          {selectedJob.budget === "TBD - Insurance Paid" && (
                            <p className="mt-1 text-[10px] text-blue-600">Inspection required before payment</p>
                          )}
                        </div>
                        <div className="rounded-lg bg-blue-50 p-3">
                          <p className="text-xs text-blue-600">Timeline</p>
                          <p className="mt-1 text-lg font-bold text-blue-700">{selectedJob.timeline}</p>
                        </div>
                      </div>
                    </div>

                    {/* Homeowner Info */}
                    <div className="border-b border-border p-6">
                      <h3 className="font-semibold text-foreground mb-3">Property Details</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Homeowner</span>
                          <span className="text-sm font-medium text-foreground">{selectedJob.homeownerName}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Property Type</span>
                          <span className="text-sm font-medium text-foreground">{selectedJob.propertyType}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Preferred Contact</span>
                          <span className="text-sm font-medium text-foreground">{selectedJob.preferredContact}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Current Bids</span>
                          <span className="text-sm font-medium text-foreground">{selectedJob.bidsCount} contractor{selectedJob.bidsCount !== 1 ? "s" : ""}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bid Action */}
                    <div className="p-6 space-y-3">
                      <Button
                        className="w-full gap-2"
                        size="lg"
                        onClick={() => handleOpenBidModal(selectedJob)}
                      >
                        <Send className="h-4 w-4" />
                        Submit Your Bid
                      </Button>
                      
                      {/* iMessage-style Ask Question Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenMessenger(selectedJob)}
                        className="group relative w-full flex items-center gap-3 rounded-[22px] bg-[#007AFF] px-4 py-3 text-white transition-all hover:bg-[#0066DD] active:scale-[0.98]"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                          <svg 
                            viewBox="0 0 24 24" 
                            className="h-4 w-4 fill-current"
                          >
                            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12zM7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/>
                          </svg>
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium">Ask {selectedJob.homeownerName} a Question</p>
                          <p className="text-[11px] text-white/70">Get more details before bidding</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-white/50 transition-transform group-hover:translate-x-0.5" />
                      </button>
                      
                      <p className="text-center text-xs text-muted-foreground">
                        You keep 100% — no commission fees
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hidden lg:flex h-96 items-center justify-center rounded-xl border border-dashed border-border bg-card"
                  >
                    <div className="text-center">
                      <Briefcase className="mx-auto h-12 w-12 text-muted-foreground/50" />
                      <p className="mt-4 text-muted-foreground">Select a job to view details</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>

      {/* Bid Submission Modal */}
      <Dialog open={showBidModal} onOpenChange={setShowBidModal}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {bidSubmitted
                ? bidMode === "inspection_only" ? "Inspection Request Sent" : "Bid Submitted!"
                : bidMode === "inspection_only" ? "Request Inspection" : "Submit Your Bid"}
            </DialogTitle>
            <DialogDescription>
              {bidSubmitted 
                ? bidMode === "inspection_only"
                  ? "Your inspection request has been sent to the homeowner."
                  : "Your bid has been sent to the homeowner."
                : bidJob?.title
              }
            </DialogDescription>
          </DialogHeader>

          {bidSubmitted ? (
            <div className="py-6 text-center">
              <AnimatePresence>
                {bidSubmitted && (
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
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                {bidMode === "inspection_only"
                  ? `${bidJob?.homeownerName} will review your inspection request. You will be required to place a bid through HomeBids after your visit.`
                  : `${bidJob?.homeownerName} will review your bid and contact you if interested.`}
              </p>
              <Button className="mt-6 w-full" onClick={() => setShowBidModal(false)}>
                Continue Browsing
              </Button>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
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
                    const isActive = bidMode === mode.key;
                    return (
                      <button
                        key={mode.key}
                        type="button"
                        onClick={() => setBidMode(mode.key)}
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
                        <span className={`text-[9px] leading-tight ${isActive ? mode.descColor : "text-muted-foreground"}`}>
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
                  {bidMode === "inspection_only" ? "Requesting inspection for" : "Bidding on"}
                </p>
                <p className="text-sm font-semibold text-foreground">{bidJob?.title}</p>
                {bidJob && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Budget: <span className={`font-medium ${bidJob.budget === "TBD - Insurance Paid" ? "text-blue-700" : "text-green-700"}`}>{bidJob.budget}</span>{bidJob.budget === "TBD - Insurance Paid" && " (inspection required)"} | Timeline: {bidJob.timeline}
                  </p>
                )}
              </div>

              {/* Inspection-Only Notice */}
              {bidMode === "inspection_only" && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <p className="text-xs leading-relaxed text-amber-800">
                    You will provide an on-site inspection without committing to a bid amount. After inspection, you are required to place your bid through HomeBids.
                  </p>
                </div>
              )}

              {bidMode !== "inspection_only" && (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="bidAmount" className="text-xs font-medium">Your Bid Amount</Label>
                    <div className="relative mt-1">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">$</span>
                      <Input
                        id="bidAmount"
                        type="number"
                        placeholder="0.00"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        className="pl-7"
                      />
                    </div>
                    {bidAmount && (
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        ${Number(bidAmount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    )}
                  </div>

                  {/* Bid Fee Notice */}
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                    <p className="text-xs font-semibold text-amber-800">Bid Fee</p>
                    <p className="mt-1 text-[10px] text-amber-700">
                      A bid fee will be charged when you submit. The fee depends on your current subscription plan (Starter: $10, Pro: $7, Elite: $4).
                    </p>
                  </div>

                  <div className="rounded-xl border border-border p-3">
                    <Label className="text-xs font-medium">Do You Offer Financing?</Label>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      Financing options available for homeowners
                    </p>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setBidFinancing(bidFinancing === true ? null : true)}
                        className={`flex-1 rounded-lg border-2 px-2.5 py-1.5 text-[10px] font-medium transition-all ${
                          bidFinancing === true
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-border text-muted-foreground hover:border-muted-foreground/50"
                        }`}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setBidFinancing(bidFinancing === false ? null : false)}
                        className={`flex-1 rounded-lg border-2 px-2.5 py-1.5 text-[10px] font-medium transition-all ${
                          bidFinancing === false
                            ? "border-gray-500 bg-gray-50 text-gray-700"
                            : "border-border text-muted-foreground hover:border-muted-foreground/50"
                        }`}
                      >
                        No
                      </button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="bidTimeline" className="text-xs font-medium">Estimated Timeline</Label>
                    <Input
                      id="bidTimeline"
                      placeholder="e.g. 2-3 days"
                      value={bidTimeline}
                      onChange={(e) => setBidTimeline(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              )}

              {/* Message */}
              <div>
                <Label htmlFor="bidMessage" className="text-xs font-medium">Message to Homeowner</Label>
                <Textarea
                  id="bidMessage"
                  placeholder={
                    bidMode === "inspection_only"
                      ? "Let the homeowner know what to expect during your inspection visit..."
                      : "Describe your experience, approach, and why you're a great fit..."
                  }
                  value={bidMessage}
                  onChange={(e) => setBidMessage(e.target.value)}
                  rows={3}
                  className="mt-1"
                />
              </div>

              {/* Inspection Fee */}
              {bidMode !== "bid_only" && (
                <div className="rounded-xl border border-border p-3">
                  <Label className="text-xs font-medium">Inspection Fee</Label>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    Free or fee amount
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (bidFreeInspection) {
                          setBidFreeInspection(false);
                        } else {
                          setBidFreeInspection(true);
                          setBidInspectionFee("");
                        }
                      }}
                      className={`rounded-lg border-2 px-2.5 py-1.5 text-[10px] font-medium transition-all ${
                        bidFreeInspection
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
                        value={bidInspectionFee}
                        onChange={(e) => { setBidInspectionFee(e.target.value); setBidFreeInspection(false); }}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">
                  <strong>Note:</strong> Payments are handled directly between you and the homeowner. HomeBids does not deduct any fees from your payment.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={() => setShowBidModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 gap-2"
                  onClick={handleSubmitBid}
                  disabled={
                    bidMode === "inspection_only"
                      ? (!bidFreeInspection && !bidInspectionFee)
                      : (!bidAmount || !bidTimeline)
                  }
                >
                  <Send className="h-4 w-4" />
                  {bidMode === "inspection_only" ? "Submit Request" : "Submit Bid"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bid Confirmation Dialog */}
      <Dialog open={showBidConfirm} onOpenChange={setShowBidConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {bidMode === "inspection_only" ? "Confirm Inspection Request" : "Confirm Your Bid"}
            </DialogTitle>
            <DialogDescription>
              Please review the details below before submitting.
            </DialogDescription>
          </DialogHeader>
          {bidJob && (
            <div className="space-y-4">
              {/* Type badge */}
              <div className="flex justify-center">
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                  bidMode === "bid_only"
                    ? "bg-green-50 text-green-700"
                    : bidMode === "bid_and_inspection"
                    ? "bg-blue-50 text-blue-700"
                    : "bg-amber-50 text-amber-700"
                }`}>
                  {bidMode === "bid_only" ? "Bid Only" : bidMode === "bid_and_inspection" ? "Bid + Inspection" : "Inspection Only"}
                </span>
              </div>

              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-xs text-muted-foreground">Job</p>
                <p className="text-sm font-semibold text-foreground">{bidJob.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{bidJob.location}</p>
              </div>

              {/* Bid amount & timeline -- not shown for inspection_only */}
              {bidMode !== "inspection_only" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-green-50 p-3">
                    <p className="text-[10px] font-medium text-green-600">Your Bid</p>
                    <p className="mt-1 text-lg font-bold text-green-700">
                      ${Number(bidAmount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="rounded-lg bg-blue-50 p-3">
                    <p className="text-[10px] font-medium text-blue-600">Timeline</p>
                    <p className="mt-1 text-lg font-bold text-blue-700">{bidTimeline}</p>
                  </div>
                </div>
              )}

              {/* Bid Fee */}
              {bidMode !== "inspection_only" && (
                <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-3">
                  <CreditCard className="h-4 w-4 text-amber-600" />
                  <div>
                    <p className="text-sm font-medium text-amber-700">Bid fee charged on submission</p>
                    <p className="text-[10px] text-amber-600">Based on your subscription plan. Non-refundable.</p>
                  </div>
                </div>
              )}

              {/* Inspection fee -- shown for bid_and_inspection and inspection_only */}
              {bidMode !== "bid_only" && (bidFreeInspection || bidInspectionFee) && (
                <div className={`flex items-center gap-2 rounded-lg p-3 ${
                  bidFreeInspection ? "bg-emerald-50" : "bg-amber-50"
                }`}>
                  <Eye className={`h-4 w-4 ${bidFreeInspection ? "text-emerald-600" : "text-amber-600"}`} />
                  <p className={`text-sm font-medium ${bidFreeInspection ? "text-emerald-700" : "text-amber-700"}`}>
                    {bidFreeInspection ? "Free Inspection" : `$${Number(bidInspectionFee).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Inspection Fee`}
                  </p>
                </div>
              )}

              {/* Inspection-only reminder */}
              {bidMode === "inspection_only" && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <p className="text-xs leading-relaxed text-amber-800">
                    After your on-site inspection, you will be required to submit a bid through HomeBids.
                  </p>
                </div>
              )}

              {bidMessage && (
                <div className="rounded-lg border border-border p-3">
                  <p className="text-[10px] font-medium text-muted-foreground">Your Message</p>
                  <p className="mt-1 text-xs leading-relaxed text-foreground">{bidMessage}</p>
                </div>
              )}

              {bidError && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {bidError}
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={() => setShowBidConfirm(false)}
                  disabled={bidSubmitting}
                >
                  Go Back
                </Button>
                <Button
                  className="flex-1 gap-2"
                  onClick={handleConfirmBidSubmit}
                  disabled={bidSubmitting}
                >
                  {bidSubmitting ? (
                    <><Loader2 className="h-4 w-4 animate-spin" />Submitting...</>
                  ) : (
                    <><Send className="h-4 w-4" />{bidMode === "inspection_only" ? "Confirm Request" : "Confirm & Send"}</>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Ask Question Messenger Modal */}
      <Dialog open={showMessenger} onOpenChange={setShowMessenger}>
        <DialogContent className="flex h-[70vh] max-h-[600px] flex-col p-0 sm:max-w-md">
          {/* Messenger Header */}
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#007AFF]/10">
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-[#007AFF]">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12zM7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">
                {messengerJob?.homeownerName}
              </p>
              <p className="text-xs text-muted-foreground">
                {messengerJob?.title}
              </p>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                  <svg viewBox="0 0 24 24" className="h-6 w-6 fill-muted-foreground/50">
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12zM7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z" />
                  </svg>
                </div>
                <p className="mt-3 text-sm font-medium text-foreground">
                  Ask a question
                </p>
                <p className="mt-1 max-w-[240px] text-xs text-muted-foreground">
                  Ask {messengerJob?.homeownerName} about job details, access, scheduling, or anything else before placing your bid.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === "contractor" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                        msg.sender === "contractor"
                          ? "rounded-br-md bg-[#007AFF] text-white"
                          : "rounded-bl-md bg-muted text-foreground"
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                      <p
                        className={`mt-1 text-[10px] ${
                          msg.sender === "contractor" ? "text-white/60" : "text-muted-foreground"
                        }`}
                      >
                        {msg.time.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-border px-3 py-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-end gap-2"
            >
              <Textarea
                placeholder="Type your question..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="min-h-[42px] max-h-[120px] flex-1 resize-none rounded-2xl border-border px-4 py-2.5 text-sm"
                rows={1}
              />
              <button
                type="submit"
                disabled={!messageInput.trim()}
                className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-[#007AFF] text-white transition-all hover:bg-[#0066DD] active:scale-95 disabled:opacity-40 disabled:hover:bg-[#007AFF]"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Gallery Modal */}
      <Dialog open={showImageGallery} onOpenChange={setShowImageGallery}>
        <DialogContent className="max-w-3xl border-none bg-black/95 p-0 sm:rounded-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Photos from homeowner</DialogTitle>
            <DialogDescription>Property images for {galleryJobTitle}</DialogDescription>
          </DialogHeader>

          {/* Close button */}
          <button
            type="button"
            onClick={() => setShowImageGallery(false)}
            className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/80 backdrop-blur-sm transition-colors hover:bg-white/20 hover:text-white"
            aria-label="Close gallery"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Title bar */}
          <div className="px-6 pt-5 pb-2">
            <p className="text-sm font-semibold text-white">{galleryJobTitle}</p>
            <p className="text-xs text-white/50">
              {galleryIndex + 1} of {galleryImages.length} photos from homeowner
            </p>
          </div>

          {/* Main image area */}
          <div className="relative flex items-center justify-center px-4 pb-2" style={{ minHeight: 350 }}>
            {/* Prev */}
            {galleryImages.length > 1 && (
              <button
                type="button"
                onClick={() => setGalleryIndex((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1))}
                className="absolute left-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/80 backdrop-blur-sm transition-colors hover:bg-white/20 hover:text-white"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}

            <AnimatePresence mode="wait">
              <motion.img
                key={galleryIndex}
                src={galleryImages[galleryIndex]}
                alt={`Property photo ${galleryIndex + 1} of ${galleryImages.length}`}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.2 }}
                className="max-h-[420px] w-full rounded-xl object-contain"
                crossOrigin="anonymous"
              />
            </AnimatePresence>

            {/* Next */}
            {galleryImages.length > 1 && (
              <button
                type="button"
                onClick={() => setGalleryIndex((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1))}
                className="absolute right-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/80 backdrop-blur-sm transition-colors hover:bg-white/20 hover:text-white"
                aria-label="Next image"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Thumbnail strip */}
          {galleryImages.length > 1 && (
            <div className="flex items-center justify-center gap-2 px-6 pb-5">
              {galleryImages.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setGalleryIndex(i)}
                  className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                    i === galleryIndex
                      ? "border-white ring-1 ring-white/30 scale-105"
                      : "border-transparent opacity-50 hover:opacity-80"
                  }`}
                >
                  <img
                    src={img}
                    alt={`Thumbnail ${i + 1}`}
                    className="h-full w-full object-cover"
                    crossOrigin="anonymous"
                  />
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ScrollToTop />
    </div>
  );
}

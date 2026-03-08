"use client";

import React from "react";

import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Star,
  Clock,
  DollarSign,
  MessageCircle,
  Send,
  CheckCircle2,
  Shield,
  MapPin,
  Phone,
  Mail,
  ChevronRight,
  FileText,
  Globe,
  Heart,
  CreditCard,
} from "lucide-react";
import { selectBidAsWinner } from "@/lib/job-store";
import { acceptBid as acceptBidAction, getJobById } from "@/lib/supabase/actions";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ScrollToTop } from "@/components/scroll-to-top";
import { Header } from "@/components/header";

interface Bid {
  id: string;
  companyName: string;
  companyLogo: string;
  price: number;
  timeline: string;
  rating: number;
  reviewCount: number;
  message: string;
  verified: boolean;
  yearsInBusiness: number;
  location: string;
  phone: string;
  email: string;
  website: string;
  completedJobs: number;
  responseTime: string;
  financingAvailable?: boolean;
  inspectionFee?: string; // e.g. "Free", "$75", "$150"
  depositRequired?: string; // e.g. "None", "$500", "$1,200"
  }

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
  isOwn: boolean;
}

// Sample bid data
const sampleBids: Bid[] = [
  {
    id: "1",
    companyName: "ABC Plumbing & Roofing",
    companyLogo: "/images/contractor-placeholder.png",
    price: 8500,
    timeline: "5-7 days",
    rating: 4.9,
    reviewCount: 127,
    message: "Hi! We'd love to help with your roof replacement. We specialize in residential roofing and have completed over 500 projects in your area. Our team uses premium materials with a 25-year warranty. We can start as early as next week.",
    verified: true,
    yearsInBusiness: 15,
    location: "Austin, TX",
    phone: "(512) 555-0123",
    email: "contact@abcplumbing.com",
    website: "www.abcplumbing.com",
    completedJobs: 523,
    responseTime: "Usually responds within 2 hours",
    financingAvailable: true,
    inspectionFee: "Free",
    depositRequired: "None",
  },
  {
    id: "2",
    companyName: "ProFix Home Services",
    companyLogo: "/images/contractor-placeholder.png",
    price: 7200,
    timeline: "7-10 days",
    rating: 4.7,
    reviewCount: 89,
    message: "Thank you for considering us! We've reviewed your project details and believe we're a great fit. Our competitive pricing includes all materials and labor, with no hidden fees. We also offer financing options if needed.",
    verified: true,
    yearsInBusiness: 8,
    location: "Round Rock, TX",
    phone: "(512) 555-0456",
    email: "info@profixhome.com",
    website: "www.profixhome.com",
    completedJobs: 312,
    responseTime: "Usually responds within 4 hours",
    financingAvailable: true,
    inspectionFee: "$75",
    depositRequired: "$1,500",
  },
  {
    id: "3",
    companyName: "Quality Home Co.",
    companyLogo: "/images/contractor-placeholder.png",
    price: 9100,
    timeline: "3-5 days",
    rating: 4.8,
    reviewCount: 203,
    message: "We're excited about your project! As a family-owned business with 20 years of experience, we pride ourselves on quality craftsmanship. Our faster timeline is possible because we have a dedicated roofing crew available immediately.",
    verified: true,
    yearsInBusiness: 20,
    location: "Cedar Park, TX",
    phone: "(512) 555-0789",
    email: "hello@qualityhomeco.com",
    website: "www.qualityhomeco.com",
    completedJobs: 847,
    responseTime: "Usually responds within 1 hour",
    inspectionFee: "Free",
    depositRequired: "$2,000",
  },
  {
    id: "4",
    companyName: "Summit Roofing Pros",
    companyLogo: "/images/contractor-placeholder.png",
    price: 7850,
    timeline: "6-8 days",
    rating: 4.6,
    reviewCount: 156,
    message: "Hello! Summit Roofing has been serving the Austin metro for over a decade. We offer comprehensive roofing solutions with a focus on durability and aesthetics. Free inspection included with every bid!",
    verified: true,
    yearsInBusiness: 12,
    location: "Pflugerville, TX",
    phone: "(512) 555-1234",
    email: "info@summitroofing.com",
    website: "www.summitroofingpros.com",
    completedJobs: 428,
    responseTime: "Usually responds within 3 hours",
    inspectionFee: "Free",
    depositRequired: "None",
  },
  {
    id: "5",
    companyName: "Lone Star Exteriors",
    companyLogo: "/images/contractor-placeholder.png",
    price: 8200,
    timeline: "4-6 days",
    rating: 4.9,
    reviewCount: 312,
    message: "Howdy! We're a Texas-proud company with the best warranties in the state. Our crews are GAF Master Elite certified, meaning top-tier installation quality. We'd be honored to work on your home.",
    verified: true,
    yearsInBusiness: 18,
    location: "Austin, TX",
    phone: "(512) 555-2345",
    email: "hello@lonestarexteriors.com",
    website: "www.lonestarexteriors.com",
    completedJobs: 692,
    responseTime: "Usually responds within 1 hour",
    inspectionFee: "$100",
    depositRequired: "$1,800",
  },
  {
    id: "6",
    companyName: "Blue Sky Contractors",
    companyLogo: "/images/contractor-placeholder.png",
    price: 6900,
    timeline: "10-14 days",
    rating: 4.5,
    reviewCount: 67,
    message: "We appreciate you considering Blue Sky! While our timeline is a bit longer, we ensure meticulous attention to detail. Our lower price reflects our efficient operations, not compromised quality.",
    verified: false,
    yearsInBusiness: 5,
    location: "Georgetown, TX",
    phone: "(512) 555-3456",
    email: "contact@blueskycontractors.com",
    website: "www.blueskycontractors.com",
    completedJobs: 145,
    responseTime: "Usually responds within 6 hours",
    inspectionFee: "$50",
    depositRequired: "None",
  },
  {
    id: "7",
    companyName: "Premier Roofing Solutions",
    companyLogo: "/images/contractor-placeholder.png",
    price: 9800,
    timeline: "3-4 days",
    rating: 5.0,
    reviewCount: 89,
    message: "At Premier, we deliver exactly what our name suggests - premium service. Our expedited timeline and premium materials come at a higher cost, but our 5-star rating speaks for itself. Excellence guaranteed.",
    verified: true,
    yearsInBusiness: 10,
    location: "Lakeway, TX",
    phone: "(512) 555-4567",
    email: "info@premierroofing.com",
    website: "www.premierroofingsolutions.com",
    completedJobs: 234,
    responseTime: "Usually responds within 30 minutes",
    financingAvailable: true,
    inspectionFee: "Free",
    depositRequired: "$2,500",
  },
  {
    id: "8",
    companyName: "Hill Country Roofing",
    companyLogo: "/images/contractor-placeholder.png",
    price: 7500,
    timeline: "8-10 days",
    rating: 4.7,
    reviewCount: 198,
    message: "Family-owned since 1998! We know Texas weather and build roofs to withstand it. Our mid-range pricing offers the best value without cutting corners. References available upon request.",
    verified: true,
    yearsInBusiness: 26,
    location: "Dripping Springs, TX",
    phone: "(512) 555-5678",
    email: "team@hillcountryroofing.com",
    website: "www.hillcountryroofing.com",
    completedJobs: 1024,
    responseTime: "Usually responds within 2 hours",
    financingAvailable: true,
    inspectionFee: "$125",
    depositRequired: "$1,000",
  },
];

// Sample messages
const sampleMessages: Record<string, Message[]> = {
  "1": [
    {
      id: "m1",
      senderId: "contractor",
      text: "Hi! Thanks for your interest. Do you have any specific material preferences for the shingles?",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      isOwn: false,
    },
    {
      id: "m2",
      senderId: "homeowner",
      text: "I was thinking architectural shingles. What brands do you recommend?",
      timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
      isOwn: true,
    },
    {
      id: "m3",
      senderId: "contractor",
      text: "Great choice! We typically use GAF or Owens Corning. Both come with excellent warranties. GAF Timberline is our most popular option.",
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
      isOwn: false,
    },
  ],
  "2": [],
  "3": [
    {
      id: "m1",
      senderId: "contractor",
      text: "Hello! We noticed you're looking at our bid. Let us know if you have any questions!",
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      isOwn: false,
    },
  ],
  "4": [],
  "5": [
    {
      id: "m1",
      senderId: "contractor",
      text: "Thanks for viewing our bid! We're ready to start whenever works for you.",
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
      isOwn: false,
    },
  ],
  "6": [],
  "7": [
    {
      id: "m1",
      senderId: "contractor",
      text: "Hi there! Premier Roofing here. Happy to answer any questions about our premium service.",
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
      isOwn: false,
    },
  ],
  "8": [],
};

export default function BidsPage() {
  const searchParams = useSearchParams();
  const { id: jobId } = useParams<{ id: string }>();
  const [bids, setBids] = useState<Bid[]>(sampleBids);
  const [selectedBid, setSelectedBid] = useState<Bid | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>(sampleMessages);

  // Fetch real bids from Supabase for this job, fall back to sample data
  useEffect(() => {
    if (!jobId) return;
    getJobById(jobId).then(({ job }) => {
      if (job?.bids && job.bids.length > 0) {
        const mapped: Bid[] = job.bids.map((b: any) => ({
          id: b.id,
          companyName: b.contractor_profiles?.business_name ?? `${b.profiles?.first_name} ${b.profiles?.last_name}`,
          companyLogo: "/images/contractor-placeholder.png",
          price: b.amount,
          timeline: b.timeline ?? "Flexible",
          rating: 0,
          reviewCount: 0,
          message: b.message,
          verified: false,
          yearsInBusiness: 0,
          location: "",
          phone: "",
          email: "",
          website: "",
          completedJobs: 0,
          responseTime: "",
        }));
        setBids(mapped);
      }
    });
  }, [jobId]);
  const [newMessage, setNewMessage] = useState("");
  const [showMobileDetail, setShowMobileDetail] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatSectionRef = useRef<HTMLDivElement>(null);
  const detailPanelRef = useRef<HTMLDivElement>(null);
  const didProcessParams = useRef(false);
  const [favoriteBids, setFavoriteBids] = useState<Set<string>>(new Set());

  // Auto-select bid from URL param (e.g. ?bidId=1)
  useEffect(() => {
    if (didProcessParams.current) return;
    const bidId = searchParams.get("bidId");
    const action = searchParams.get("action");
    if (bidId) {
      const matchedBid = bids.find((b) => b.id === bidId);
      if (matchedBid) {
        didProcessParams.current = true;
        setSelectedBid(matchedBid);
        setShowMobileDetail(true);
        // Scroll to top first, then to chat if action=chat
        window.scrollTo({ top: 0 });
        if (action === "chat") {
          setTimeout(() => {
            chatSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
          }, 400);
        }
      }
    }
  }, [searchParams]);
  
  // Contractor selection state
  const [showPayment, setShowPayment] = useState(false);
  const [acceptedBid, setAcceptedBid] = useState<Bid | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingBid, setPendingBid] = useState<Bid | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (selectedBid) {
      scrollToBottom();
    }
  }, [selectedBid, messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedBid) return;

    const message: Message = {
      id: Math.random().toString(36).substring(7),
      senderId: "homeowner",
      text: newMessage.trim(),
      timestamp: new Date(),
      isOwn: true,
    };

    setMessages((prev) => ({
      ...prev,
      [selectedBid.id]: [...(prev[selectedBid.id] || []), message],
    }));
    setNewMessage("");
  };

  const handleSelectBid = (bid: Bid) => {
    setSelectedBid(bid);
    setShowMobileDetail(true);
    // Scroll to top of detail panel on desktop, top of page on mobile
    requestAnimationFrame(() => {
      const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
      if (isDesktop && detailPanelRef.current) {
        detailPanelRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  };

  const toggleFavorite = (e: React.MouseEvent, bidId: string) => {
    e.stopPropagation();
    setFavoriteBids((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(bidId)) {
        newFavorites.delete(bidId);
      } else {
        newFavorites.add(bidId);
      }
      return newFavorites;
    });
  };

  const handleAcceptBid = async (bid: Bid) => {
    setAcceptedBid(bid);
    // Update both local store and Supabase
    if (jobId) {
      selectBidAsWinner(jobId, bid.id);
      await acceptBidAction(bid.id, jobId);
    }
    setShowPayment(true);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header backHref="/?showJobs=true" backLabel="Back to Jobs" isSignedIn />

      <main className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Page Header */}
          <div className={`mb-6 ${showMobileDetail ? "hidden lg:block" : "block"}`}>
            <div className="flex items-center gap-3 mb-4">
              <Link
                href="/?showJobs=true"
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Your Jobs
              </Link>
            </div>
            <div className="text-center lg:text-left">
              <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Contractor Bids</h1>
              <p className="mt-2 text-muted-foreground">
                {bids.length} bids received. Select a bid to view details and message the contractor.
              </p>
            </div>
          </div>

          {/* Grid Layout */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Bids List */}
            <div className={`space-y-3 ${showMobileDetail ? "hidden lg:block" : "block"}`}>
              {bids.map((bid, index) => {
                const bidMessages = messages[bid.id] || [];
                const hasUnread = bidMessages.length > 0 && !bidMessages[bidMessages.length - 1].isOwn;
                
                return (
                  <motion.button
                    key={bid.id}
                    type="button"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleSelectBid(bid)}
                    className={`relative w-full rounded-xl p-4 text-left transition-all ${
                      selectedBid?.id === bid.id 
                        ? "bg-primary/10 ring-2 ring-primary shadow-sm" 
                        : "bg-card hover:bg-muted/50 border border-border hover:border-primary/30 hover:shadow-sm"
                    }`}
                  >
                    {/* Favorite button */}
                    <button
                      type="button"
                      onClick={(e) => toggleFavorite(e, bid.id)}
                      className="absolute right-3 top-3 z-10 flex h-9 w-9 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-background/90 backdrop-blur-sm border border-border/50 shadow-sm transition-all hover:scale-110 hover:bg-background active:scale-95"
                      aria-label={favoriteBids.has(bid.id) ? "Remove from favorites" : "Add to favorites"}
                    >
                      <Heart 
                        className={`h-4 w-4 transition-colors ${
                          favoriteBids.has(bid.id) 
                            ? "fill-red-500 text-red-500" 
                            : "text-muted-foreground hover:text-red-400"
                        }`}
                      />
                    </button>

                    {/* Unread message indicator */}
                    {hasUnread && (
                      <div className="absolute -left-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 shadow-lg shadow-blue-500/30">
                        <MessageCircle className="h-3.5 w-3.5 text-white fill-white" />
                      </div>
                    )}

                    <div className="flex items-start gap-3">
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                        selectedBid?.id === bid.id ? "bg-primary text-primary-foreground" : "bg-primary/10"
                      }`}>
                        <span className={`text-lg font-bold ${selectedBid?.id === bid.id ? "" : "text-primary"}`}>
                          {bid.companyName.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0 pr-8">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground truncate text-sm sm:text-base">
                            {bid.companyName}
                          </span>
                          {bid.verified && (
                            <span className="shrink-0 flex items-center rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700">
                              <Shield className="h-3 w-3" />
                            </span>
                          )}
                        </div>
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1 rounded-lg bg-green-50 px-2 py-1 text-xs sm:text-sm font-bold text-green-700">
                            <DollarSign className="h-3 w-3" />
                            {bid.price.toLocaleString()}
                          </span>
  <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-[10px] sm:text-xs font-medium text-blue-700">
  <Clock className="h-3 w-3" />
  {bid.timeline}
  </span>
  {bid.inspectionFee && (
    <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] sm:text-xs font-medium ${
      bid.inspectionFee === "Free"
        ? "bg-emerald-50 text-emerald-700"
        : "bg-amber-50 text-amber-700"
    }`}>
      <Shield className="h-3 w-3" />
  {bid.inspectionFee === "Free" ? "Free Inspection" : `${bid.inspectionFee} Inspection`}
  </span>
  )}
  {bid.depositRequired && bid.depositRequired !== "None" && (
    <span className="inline-flex items-center gap-1 rounded-lg bg-violet-50 px-2 py-1 text-[10px] sm:text-xs font-medium text-violet-700">
      <CreditCard className="h-3 w-3" />
      {bid.depositRequired} Deposit
    </span>
  )}
  {bid.depositRequired === "None" && (
    <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-[10px] sm:text-xs font-medium text-emerald-700">
      <CreditCard className="h-3 w-3" />
      No Deposit
    </span>
  )}
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${i < Math.floor(bid.rating) ? "fill-yellow-400 text-yellow-400" : "fill-muted text-muted"}`} 
                                />
                              ))}
                            </div>
                            <span className="text-[10px] sm:text-xs font-medium text-foreground ml-1">{bid.rating}</span>
                            <span className="text-[10px] sm:text-xs text-muted-foreground">
                              ({bid.reviewCount})
                            </span>
                          </div>
                          <ChevronRight className={`h-4 w-4 transition-transform ${selectedBid?.id === bid.id ? "text-primary translate-x-0.5" : "text-muted-foreground"}`} />
                        </div>
                      </div>
                    </div>

                    {/* Badges */}
                    {(index === 0 || bid.rating === 5.0 || bid.financingAvailable) && (
                      <div className="mt-3 flex items-center gap-1.5 flex-wrap text-xs">
                        {index === 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-amber-700 font-medium">
                            Best Value
                          </span>
                        )}
                        {bid.rating === 5.0 && index !== 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-purple-700 font-medium">
                            Top Rated
                          </span>
                        )}
                        {bid.financingAvailable && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700 font-medium">
                            <CreditCard className="h-3 w-3" />
                            Financing
                          </span>
                        )}
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Bid Detail Panel */}
            <div ref={detailPanelRef} className={`lg:sticky lg:top-8 lg:self-start ${showMobileDetail ? "block" : "hidden lg:block"}`}>
              <AnimatePresence mode="wait">
                {selectedBid ? (
                  <motion.div
                    key={selectedBid.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="rounded-xl border border-border bg-card overflow-hidden"
                  >
                    {/* Mobile Back */}
                    <div className="flex items-center gap-3 border-b border-border p-4 lg:hidden">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowMobileDetail(false)}
                        className="gap-2 bg-transparent"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Bids
                      </Button>
                    </div>

                    {/* Company Header */}
                    <div className="border-b border-border p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                          <span className="text-xl font-bold text-primary">
                            {selectedBid.companyName.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h2 className="text-lg font-bold text-foreground">{selectedBid.companyName}</h2>
                                {selectedBid.verified && (
                                  <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                                    <Shield className="h-3 w-3" />
                                    Verified
                                  </span>
                                )}
                              </div>
                              <div className="mt-1 flex items-center gap-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm font-semibold">{selectedBid.rating}</span>
                                <span className="text-xs text-muted-foreground">({selectedBid.reviewCount} reviews)</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => toggleFavorite(e, selectedBid.id)}
                              className="flex h-9 w-9 items-center justify-center rounded-full bg-muted border border-border transition-all hover:scale-110"
                              aria-label={favoriteBids.has(selectedBid.id) ? "Remove from favorites" : "Add to favorites"}
                            >
                              <Heart 
                                className={`h-4 w-4 transition-colors ${
                                  favoriteBids.has(selectedBid.id) 
                                    ? "fill-red-500 text-red-500" 
                                    : "text-muted-foreground hover:text-red-400"
                                }`}
                              />
                            </button>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {selectedBid.yearsInBusiness} years in business | {selectedBid.completedJobs} jobs completed
                          </p>
                        </div>
                      </div>

                      {/* Price & Timeline Cards */}
                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-green-50 p-3">
                          <p className="text-xs text-green-600">Bid Price</p>
                          <p className="mt-1 text-xl font-bold text-green-700">${selectedBid.price.toLocaleString()}</p>
                        </div>
  <div className="rounded-xl bg-blue-50 p-3">
  <p className="text-xs text-blue-600">Timeline</p>
  <p className="mt-1 text-xl font-bold text-blue-700">{selectedBid.timeline}</p>
  </div>
  </div>
  {selectedBid.inspectionFee && (
    <div className={`mt-3 flex items-center gap-2 rounded-xl p-3 ${
      selectedBid.inspectionFee === "Free"
        ? "bg-emerald-50 border border-emerald-200"
        : "bg-amber-50 border border-amber-200"
    }`}>
      <Shield className={`h-4 w-4 ${selectedBid.inspectionFee === "Free" ? "text-emerald-600" : "text-amber-600"}`} />
      <div>
        <p className={`text-sm font-medium ${selectedBid.inspectionFee === "Free" ? "text-emerald-700" : "text-amber-700"}`}>
          {selectedBid.inspectionFee === "Free" ? "Free In-Person Inspection" : `${selectedBid.inspectionFee} Inspection Fee`}
        </p>
        <p className={`text-[10px] ${selectedBid.inspectionFee === "Free" ? "text-emerald-600" : "text-amber-600"}`}>
          {selectedBid.inspectionFee === "Free"
            ? "This contractor offers a free on-site inspection before starting work"
            : "This fee covers the initial on-site inspection and is deducted from the final bid if accepted"}
        </p>
  </div>
  </div>
  )}
  {selectedBid.depositRequired && (
    <div className={`mt-3 flex items-center gap-2 rounded-xl p-3 ${
      selectedBid.depositRequired === "None"
        ? "bg-emerald-50 border border-emerald-200"
        : "bg-violet-50 border border-violet-200"
    }`}>
      <CreditCard className={`h-4 w-4 ${selectedBid.depositRequired === "None" ? "text-emerald-600" : "text-violet-600"}`} />
      <div>
        <p className={`text-sm font-medium ${selectedBid.depositRequired === "None" ? "text-emerald-700" : "text-violet-700"}`}>
          {selectedBid.depositRequired === "None" ? "No Deposit Required" : `${selectedBid.depositRequired} Upfront Deposit`}
        </p>
        <p className={`text-[10px] ${selectedBid.depositRequired === "None" ? "text-emerald-600" : "text-violet-600"}`}>
          {selectedBid.depositRequired === "None"
            ? "This contractor does not require any upfront payment"
            : "Non-refundable deposit applied to total bid amount to cover material and labor costs"}
        </p>
      </div>
    </div>
  )}
  
                    {/* Badges */}
                      {(selectedBid.financingAvailable || selectedBid.rating === 5.0) && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {selectedBid.financingAvailable && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                              <CreditCard className="h-3 w-3" />
                              Financing Available
                            </span>
                          )}
                          {selectedBid.rating === 5.0 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-1 text-xs font-medium text-purple-700">
                              <Star className="h-3 w-3 fill-purple-600" />
                              Top Rated
                            </span>
                          )}
                        </div>
                      )}

                      {/* Select Contractor CTA */}
                      <div className="mt-4 space-y-2">
                        <Button
                          className="w-full gap-2"
                          size="lg"
                          onClick={() => { setPendingBid(selectedBid); setShowConfirm(true); }}
                        >
                          <CheckCircle2 className="h-5 w-5" />
                          Select This Contractor
                        </Button>
                        <p className="text-center text-xs text-muted-foreground">
                          Your contact info will be shared with {selectedBid.companyName}.
                        </p>
                      </div>
                    </div>

                    {/* Contractor Message */}
                    <div className="border-b border-border p-6">
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <MessageCircle className="h-4 w-4" />
                        Message from {selectedBid.companyName}
                      </h3>
                      <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                        {selectedBid.message}
                      </p>
                    </div>

                    {/* Contact Info */}
                    <div className="border-b border-border p-6">
                      <h3 className="text-sm font-semibold text-foreground mb-3">Contact Information</h3>
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-3 text-sm">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <span className="text-foreground">{selectedBid.location}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <span className="text-foreground">{selectedBid.phone}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <span className="text-foreground">{selectedBid.email}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <a 
                            href={`https://${selectedBid.website}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {selectedBid.website}
                          </a>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <span className="text-muted-foreground">{selectedBid.responseTime}</span>
                        </div>
                      </div>
                    </div>

                    {/* Chat Section */}
                    <div ref={chatSectionRef} className="border-b border-border p-6">
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <MessageCircle className="h-4 w-4" />
                        Chat with {selectedBid.companyName}
                      </h3>
                      <div className="mt-4 rounded-xl border border-border bg-muted/30 overflow-hidden">
                        {/* Messages */}
                        <div className="h-56 overflow-y-auto p-4">
                          {(messages[selectedBid.id] || []).length === 0 ? (
                            <div className="flex h-full flex-col items-center justify-center text-center">
                              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                                <MessageCircle className="h-5 w-5 text-muted-foreground/50" />
                              </div>
                              <p className="mt-2 text-sm text-muted-foreground">
                                No messages yet. Start the conversation!
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {messages[selectedBid.id].map((msg) => (
                                <div
                                  key={msg.id}
                                  className={`flex ${msg.isOwn ? "justify-end" : "justify-start"}`}
                                >
                                  <div
                                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                                      msg.isOwn
                                        ? "rounded-br-md bg-primary text-primary-foreground"
                                        : "rounded-bl-md bg-background border border-border"
                                    }`}
                                  >
                                    <p className="text-sm leading-relaxed">{msg.text}</p>
                                    <p
                                      className={`mt-1 text-[10px] ${
                                        msg.isOwn
                                          ? "text-primary-foreground/60"
                                          : "text-muted-foreground"
                                      }`}
                                    >
                                      {formatTime(msg.timestamp)}
                                    </p>
                                  </div>
                                </div>
                              ))}
                              <div ref={messagesEndRef} />
                            </div>
                          )}
                        </div>

                        {/* Message Input */}
                        <div className="border-t border-border p-3">
                          <div className="flex items-center gap-2">
                            <Input
                              placeholder="Type a message..."
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSendMessage();
                                }
                              }}
                              className="flex-1 rounded-full"
                            />
                            <button
                              type="button"
                              onClick={handleSendMessage}
                              disabled={!newMessage.trim()}
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all hover:opacity-90 active:scale-95 disabled:opacity-40"
                            >
                              <Send className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>


                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hidden lg:flex h-96 items-center justify-center rounded-xl border border-dashed border-border bg-card"
                  >
                    <div className="text-center">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                        <MessageCircle className="h-8 w-8 text-muted-foreground/50" />
                      </div>
                      <p className="mt-4 font-medium text-foreground">Select a bid to view details</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Click on a bid from the list to see contractor info and chat
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>

      {/* Are You Sure Confirmation Dialog */}
      <AnimatePresence>
        {showConfirm && pendingBid && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl"
            >
              {/* Icon */}
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle2 className="h-7 w-7 text-primary" />
              </div>

              <div className="mt-4 text-center">
                <h2 className="text-lg font-bold text-foreground">Select this contractor?</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  You&apos;re about to select{" "}
                  <span className="font-semibold text-foreground">{pendingBid.companyName}</span>{" "}
                  for this job at{" "}
                  <span className="font-semibold text-foreground">${pendingBid.price.toLocaleString()}</span>.
                </p>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Your contact information will be shared with the contractor. Payments are handled directly between you and the contractor.
                </p>
              </div>

              <div className="mt-6 flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => { setShowConfirm(false); setPendingBid(null); }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 gap-2"
                  onClick={() => {
                    setShowConfirm(false);
                    handleAcceptBid(pendingBid);
                  }}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Yes, Select
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contractor Selected Confirmation Overlay */}
      <AnimatePresence>
        {showPayment && acceptedBid && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-y-auto"
          >
            <div className="flex min-h-full items-center justify-center p-4 py-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-lg"
              >
                <div className="relative rounded-2xl border border-border bg-card p-8 shadow-xl text-center">
                  {/* Confetti */}
                  <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden" aria-hidden="true">
                    {Array.from({ length: 60 }).map((_, i) => {
                      const left = Math.random() * 100;
                      const delay = Math.random() * 0.8;
                      const duration = 2.5 + Math.random() * 2;
                      const size = 6 + Math.random() * 8;
                      const rotation = Math.random() * 360;
                      const colors = ["#22c55e", "#16a34a", "#facc15", "#f59e0b", "#3b82f6", "#ec4899", "#f97316"];
                      const color = colors[i % colors.length];
                      const shape = i % 3;
                      return (
                        <motion.div
                          key={`confetti-${i}`}
                          initial={{ y: -20, x: `${left}vw`, opacity: 1, rotate: rotation, scale: 1 }}
                          animate={{ y: "110vh", rotate: rotation + 720, opacity: [1, 1, 0.8, 0], x: `${left + (Math.random() - 0.5) * 20}vw` }}
                          exit={{ opacity: 0 }}
                          transition={{ duration, delay, ease: "easeIn" }}
                          className="absolute"
                          style={{ width: shape === 2 ? size * 0.6 : size, height: shape === 1 ? size * 0.6 : size, backgroundColor: color, borderRadius: shape === 0 ? "50%" : shape === 1 ? "2px" : "1px" }}
                        />
                      );
                    })}
                  </div>

                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-green-100"
                  >
                    <CheckCircle2 className="h-12 w-12 text-green-600" />
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <h2 className="mt-6 text-2xl font-bold text-foreground">Contractor Selected!</h2>
                    <p className="mt-2 text-lg text-green-600 font-medium">
                      You&apos;ve selected {acceptedBid.companyName}
                    </p>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-8 rounded-xl bg-muted/50 p-6 text-left">
                    <h3 className="flex items-center gap-2 font-semibold text-foreground">
                      <FileText className="h-5 w-5" />
                      What happens next?
                    </h3>
                    <div className="mt-4 space-y-4">
                      {[
                        { step: "1", title: "Contractor Contact", desc: `${acceptedBid.companyName} will reach out within 24 hours to schedule the work.` },
                        { step: "2", title: "Coordinate Directly", desc: "Discuss project details, timeline, and payment terms directly with your contractor." },
                        { step: "3", title: "Mark Complete", desc: "Once work is done, mark the job as complete in your HomeBids dashboard." },
                      ].map(({ step, title, desc }) => (
                        <div key={step} className="flex items-start gap-3">
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{step}</div>
                          <div>
                            <p className="font-medium text-foreground">{title}</p>
                            <p className="text-sm text-muted-foreground">{desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-4 text-xs text-muted-foreground">
                    HomeBids connects you with contractors. Payments and project agreements occur directly between both parties.
                  </motion.p>

                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mt-6">
                    <Button asChild className="w-full gap-2" size="lg">
                      <Link href="/?showJobs=true">
                        <CheckCircle2 className="h-4 w-4" />
                        Go to Dashboard
                      </Link>
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <ScrollToTop />
    </div>
  );
}

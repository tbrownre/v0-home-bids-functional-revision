"use client";

import React from "react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  DollarSign,
  CheckCircle2,
  XCircle,
  MessageCircle,
  Send,
  FileText,
  AlertTriangle,
  ImageIcon as LucideImage,
  Star,
  Loader2,
} from "lucide-react";
import NextImage from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Header } from "@/components/header";
import { completeJob, archiveJob, type JobStatusOwner } from "@/lib/job-store";
import { Label } from "@/components/ui/label";
import { getJobById } from "@/lib/supabase/actions";

interface Message {
  id: string;
  text: string;
  imageUrl?: string;
  timestamp: Date;
  isOwn: boolean;
  senderName: string;
}

// Shape of a job record returned from Supabase
interface JobRecord {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  status: string;
  urgency?: string;
  budget_min?: number | null;
  budget_max?: number | null;
  created_at: string;
  images?: string[];
  bids?: { id: string }[];
}

function formatBudget(min?: number | null, max?: number | null): string {
  if (!min && !max) return "TBD";
  if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
  if (min) return `From $${min.toLocaleString()}`;
  if (max) return `Up to $${max.toLocaleString()}`;
  return "TBD";
}

function dbStatusToOwnerStatus(dbStatus: string): JobStatusOwner {
  switch (dbStatus) {
    case "open": return "receiving_bids";
    case "in_progress": return "in_progress";
    case "completed": return "completed";
    case "contractor_selected": return "contractor_selected";
    default: return "receiving_bids";
  }
}

export default function JobDetailsPage() {
  const { id } = useParams<{ id: string }>();

  const [jobData, setJobData] = useState<JobRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getJobById(id).then(({ job, error }) => {
      if (error || !job) {
        setFetchError(error ?? "Job not found");
      } else {
        setJobData(job as JobRecord);
      }
      setLoading(false);
    });
  }, [id]);

  const initialStatus: JobStatusOwner | "declined" = jobData
    ? dbStatusToOwnerStatus(jobData.status)
    : "receiving_bids";

  const [status, setStatus] = useState<JobStatusOwner | "declined">(initialStatus);
  // Sync status when job data loads
  useEffect(() => {
    if (jobData) {
      setStatus(dbStatusToOwnerStatus(jobData.status));
    }
  }, [jobData]);

  const [showDeclineConfirm, setShowDeclineConfirm] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  // Review state
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [showLeaveReview, setShowLeaveReview] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasLoadedRef = useRef(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPendingImage(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    const t = setTimeout(() => {
      hasLoadedRef.current = true;
    }, 300);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!hasLoadedRef.current) return;
    const chatContainer = messagesEndRef.current?.parentElement;
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [messages]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (fetchError || !jobData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-foreground">Job Not Found</h1>
          <p className="mt-2 text-muted-foreground">
            {fetchError ?? "This job does not exist or has been removed."}
          </p>
          <Button asChild className="mt-6">
            <Link href="/?showJobs=true">Back to Jobs</Link>
          </Button>
        </div>
      </div>
    );
  }

  const job = jobData;
  const daysAgo = Math.floor(
    (Date.now() - new Date(job.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );

  const budget = formatBudget(job.budget_min, job.budget_max);
  const bidsCount = job.bids?.length ?? 0;

  const handleMarkComplete = () => setShowCompleteModal(true);

  const confirmComplete = (skipReview: boolean) => {
    const reviewData =
      !skipReview && reviewRating > 0
        ? { rating: reviewRating, text: reviewText }
        : undefined;
    completeJob(id, id, reviewData);
    setStatus("completed");
    setShowCompleteModal(false);
    if (!skipReview && reviewRating > 0) {
      setReviewSubmitted(true);
    }
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 4000);
  };

  const handleDecline = () => {
    setStatus("declined");
    archiveJob(id);
    setShowDeclineConfirm(false);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() && !pendingImage) return;
    setMessages((prev) => [
      ...prev,
      {
        id: String(prev.length + 1),
        text: newMessage.trim(),
        imageUrl: pendingImage || undefined,
        timestamp: new Date(),
        isOwn: true,
        senderName: "You",
      },
    ]);
    setNewMessage("");
    setPendingImage(null);
  };

  const statusConfig: Record<string, { label: string; className: string }> = {
    receiving_bids: { label: "Receiving Bids", className: "bg-green-100 text-green-800" },
    contractor_selected: { label: "Contractor Selected", className: "bg-orange-100 text-orange-800" },
    in_progress: { label: "In Progress", className: "bg-blue-100 text-blue-800" },
    completed: { label: "Completed", className: "bg-green-50 text-green-700 ring-1 ring-green-200" },
    declined: { label: "Declined", className: "bg-gray-100 text-gray-800" },
  };

  const currentStatus = statusConfig[status] || statusConfig.receiving_bids;

  return (
    <div className="min-h-screen bg-background">
      <Header backHref="/?showJobs=true" backLabel="Back to Jobs" isSignedIn />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {/* Job Header */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                      {job.category}
                    </span>
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${currentStatus.className}`}>
                      {currentStatus.label}
                    </span>
                  </div>
                  <h1 className="mt-3 text-2xl font-semibold text-foreground">
                    {job.title}
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Posted {daysAgo} {daysAgo === 1 ? "day" : "days"} ago
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Timeline</p>
                    <p className="text-sm font-medium text-foreground">{job.urgency ?? "Flexible"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Budget</p>
                    <p className="text-sm font-medium text-foreground">{budget}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Location</p>
                    <p className="text-sm font-medium text-foreground">{job.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Bids Received</p>
                    <p className="text-sm font-medium text-foreground">{bidsCount} bid{bidsCount !== 1 ? "s" : ""}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 rounded-2xl border border-border bg-card p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Actions
              </h3>
              <div className="mt-4 flex flex-wrap gap-3">
                {bidsCount > 0 && status === "receiving_bids" && (
                  <Button variant="outline" className="gap-2 bg-transparent" asChild>
                    <Link href={`/jobs/${job.id}/bids`}>
                      <FileText className="h-4 w-4" />
                      View Bids ({bidsCount})
                    </Link>
                  </Button>
                )}
                {(status === "contractor_selected" || status === "in_progress") && (
                  <Button className="gap-2 bg-green-600 text-white hover:bg-green-700" onClick={handleMarkComplete}>
                    <CheckCircle2 className="h-4 w-4" />
                    Mark as Complete
                  </Button>
                )}
                {status === "completed" && !reviewSubmitted && (
                  <Button
                    variant="outline"
                    className="gap-2 bg-transparent"
                    onClick={() => setShowLeaveReview(true)}
                  >
                    <Star className="h-4 w-4" />
                    Leave a Review
                  </Button>
                )}
                {status !== "completed" && status !== "declined" && (
                  <Button
                    variant="outline"
                    className="gap-2 bg-transparent text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => setShowDeclineConfirm(true)}
                  >
                    <XCircle className="h-4 w-4" />
                    {status === "receiving_bids" ? "Cancel Job" : "Cancel"}
                  </Button>
                )}
              </div>
              {/* Status Banners */}
              {status === "receiving_bids" && (
                <div className="mt-4 flex items-center gap-2 rounded-xl bg-green-50 p-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <p className="text-sm font-medium text-green-800">Actively receiving bids from contractors</p>
                </div>
              )}
              {status === "contractor_selected" && (
                <div className="mt-4 flex items-center gap-2 rounded-xl bg-orange-50 p-3">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <p className="text-sm font-medium text-orange-800">Contractor selected — coordinate directly with your contractor to start the project.</p>
                </div>
              )}
              {status === "in_progress" && (
                <div className="mt-4 flex items-center gap-2 rounded-xl bg-blue-50 p-3">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <p className="text-sm font-medium text-blue-800">Work is in progress. Mark as complete when the job is finished.</p>
                </div>
              )}
              {status === "completed" && (
                <div className="mt-4 flex items-center gap-2 rounded-xl bg-green-50 p-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <p className="text-sm font-medium text-green-800">
                    {reviewSubmitted ? "Job complete — thank you for your review!" : "Hooray! This job has been completed!"}
                  </p>
                </div>
              )}
              {/* Messaging disclaimer */}
              <p className="mt-3 text-xs text-muted-foreground">
                HomeBids connects you with contractors. Payments and project agreements occur directly between both parties.
              </p>
            </div>

            {/* Full Description */}
            <div className="mt-6 rounded-2xl border border-border bg-card p-6">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <FileText className="h-5 w-5 text-muted-foreground" />
                Project Description
              </h2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                {job.description}
              </p>
              {(job.images ?? []).length > 0 && (
                <div className="mt-6">
                  <h3 className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <LucideImage className="h-4 w-4 text-muted-foreground" />
                    Attached Photos
                  </h3>
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    {(job.images ?? []).map((img, i) => (
                      <div
                        key={`img-${i}`}
                        className="aspect-square overflow-hidden rounded-xl border border-border bg-muted"
                      >
                        <NextImage
                          src={img || "/placeholder.svg"}
                          alt={`Project photo ${i + 1}`}
                          width={200}
                          height={200}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Message Service Professional */}
            <div className="rounded-2xl border border-border bg-card">
              <div className="flex items-center gap-2 border-b border-border p-4">
                <MessageCircle className="h-5 w-5 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">
                  Message Service Professional
                </h3>
                <span className="ml-auto flex h-2 w-2 rounded-full bg-green-500" />
              </div>
              <div className="max-h-72 overflow-y-auto p-4">
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.isOwn ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
                          msg.isOwn
                            ? "rounded-br-md bg-primary text-primary-foreground"
                            : "rounded-bl-md bg-muted text-foreground"
                        }`}
                      >
                        <p className="text-[11px] font-medium opacity-70">{msg.senderName}</p>
                        {msg.imageUrl && (
                          <div className="mt-1.5 overflow-hidden rounded-lg">
                            <img
                              src={msg.imageUrl}
                              alt="Shared image"
                              className="max-h-48 w-full object-cover"
                            />
                          </div>
                        )}
                        {msg.text && <p className="mt-0.5 text-sm leading-relaxed">{msg.text}</p>}
                        <p className="mt-1 text-right text-[10px] opacity-50">
                          {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>
              <div className="border-t border-border p-3">
                {pendingImage && (
                  <div className="mb-2 relative inline-block">
                    <img
                      src={pendingImage}
                      alt="Pending attachment"
                      className="h-20 w-20 rounded-lg object-cover border border-border"
                    />
                    <button
                      type="button"
                      onClick={() => setPendingImage(null)}
                      className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs"
                      aria-label="Remove image"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    aria-label="Attach image"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 shrink-0 rounded-xl text-muted-foreground hover:text-foreground"
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Attach image"
                  >
                    <LucideImage className="h-4 w-4" />
                  </Button>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type a message..."
                    className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() && !pendingImage}
                    size="icon"
                    className="h-10 w-10 shrink-0 rounded-xl"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>



            {/* Need Help */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Need Help?
              </h3>
              <p className="mt-3 text-sm text-muted-foreground">
                If you have any questions about your job or need assistance, our support team is here to help.
              </p>
              <Button variant="outline" className="mt-4 w-full bg-transparent" asChild>
                <a href="mailto:support@homebids.io">Contact Support</a>
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Decline Confirmation Dialog */}
      <AnimatePresence>
        {showDeclineConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowDeclineConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Cancel Job</h3>
                  <p className="text-sm text-muted-foreground">This action cannot be undone</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Are you sure you want to cancel this job? Contractors will be notified that the job is no longer available.
              </p>
              <div className="mt-6 flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={() => setShowDeclineConfirm(false)}
                >
                  Go Back
                </Button>
                <Button
                  className="flex-1 bg-red-600 text-white hover:bg-red-700"
                  onClick={handleDecline}
                >
                  Cancel Job
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Complete Job + Review Modal */}
      <AnimatePresence>
        {(showCompleteModal || showLeaveReview) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
            onClick={() => { setShowCompleteModal(false); setShowLeaveReview(false); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.3, bounce: 0.15 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-green-50 px-6 pt-6 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {showLeaveReview ? "Leave a Review" : "Job Complete?"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {showLeaveReview
                        ? "Share your experience with this contractor"
                        : "Please confirm the work has been completed"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="px-6 pt-4 pb-6 space-y-4">
                {!showLeaveReview && (
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Leave a quick review for your contractor to help other homeowners on HomeBids.
                  </p>
                )}

                {/* Star Rating */}
                <div>
                  <Label className="text-sm font-medium">Rating</Label>
                  <div className="mt-2 flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="transition-transform hover:scale-110 active:scale-95"
                      >
                        <Star
                          className={`h-7 w-7 ${
                            star <= reviewRating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted-foreground"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Review text */}
                <div>
                  <Label htmlFor="review-text" className="text-sm font-medium">
                    Review <span className="text-muted-foreground font-normal">(optional)</span>
                  </Label>
                  <textarea
                    id="review-text"
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Describe your experience with this contractor..."
                    className="mt-1.5 min-h-[80px] w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  {showCompleteModal && (
                    <Button
                      variant="outline"
                      className="flex-1 bg-transparent"
                      onClick={() => { setShowCompleteModal(false); confirmComplete(true); }}
                    >
                      Skip for Now
                    </Button>
                  )}
                  {showLeaveReview && (
                    <Button
                      variant="outline"
                      className="flex-1 bg-transparent"
                      onClick={() => setShowLeaveReview(false)}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    className="flex-1 bg-green-600 text-white hover:bg-green-700"
                    disabled={reviewRating === 0}
                    onClick={() => {
                      if (showLeaveReview) {
                        setReviewSubmitted(true);
                        setShowLeaveReview(false);
                      } else {
                        confirmComplete(false);
                      }
                    }}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Submit Review
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confetti */}
      <AnimatePresence>
        {showConfetti && (
          <div className="pointer-events-none fixed inset-0 z-[70] overflow-hidden" aria-hidden="true">
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
    </div>
  );
}

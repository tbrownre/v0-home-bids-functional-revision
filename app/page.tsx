"use client";

import Link from "next/link"

import React from "react";

import { useState, useRef, useCallback, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  FileText,
  ArrowUp,
  ArrowLeft,
  ImagePlus,
  X,
  Menu,
  Home,
  Upload,
  CheckCircle2,
  LogIn,
  LogOut,
  User,
  Bell,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SignInModal } from "@/components/sign-in-modal";
import { Briefcase, Info, Settings, HelpCircle, Building2, Repeat, AlertTriangle, Shield, Sparkles, MapPin, Clock, Tag } from "lucide-react";
import Image from "next/image";
import { ScrollToTop } from "@/components/scroll-to-top";
import { AddressAutocomplete } from "@/components/address-autocomplete";
import { SubscriptionCheckout } from "@/components/subscription-checkout";
import { getJobStatus, subscribe, isJobArchived, type JobStatusOwner, getJobStatusLabel } from "@/lib/job-store";
import { signUpHomeowner, createJob, getHomeownerJobs } from "@/lib/supabase/actions";
import { createClient } from "@/lib/supabase/client";

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
}

interface ContactInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

type Step = "describe" | "timeline" | "photos" | "contact" | "trial" | "success";

interface Job {
  id: string;
  description: string;
  status: JobStatusOwner;
  createdAt: Date;
  bidsCount: number;
}

export default function HomePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>("describe");
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [showJobsBoard, setShowJobsBoard] = useState(false);
  const [creatingNewJob, setCreatingNewJob] = useState(false);

  // Auth state from Supabase only
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isContractor, setIsContractor] = useState(false);
  const homeownerUnreadCount = 0; // inbox wired separately

  useEffect(() => {
    // Skip Supabase entirely in the v0 preview sandbox — it blocks external fetch
    if (typeof window === "undefined") return;
    if (window.location.hostname.includes("vusercontent.net")) return;
    let subscription: { unsubscribe: () => void } | null = null;
    try {
      const supabase = createClient();
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const type = session.user.user_metadata?.user_type;
          if (type === "contractor") {
            router.replace("/contractors/dashboard");
          } else {
            setIsSignedIn(true);
            setIsContractor(false);
          }
        } else {
          setIsSignedIn(false);
          setIsContractor(false);
        }
      });
      subscription = data.subscription;
    } catch {
      // Silently no-op if Supabase is unavailable (e.g. preview sandbox)
    }
    return () => subscription?.unsubscribe();
  }, [router]);

  // Handle URL query params and restore jobs board for signed-in users
  useEffect(() => {
    if (searchParams.get("newJob") === "true") {
      // User clicked "Post a job" - show the new job form
      setShowJobsBoard(false);
      setCreatingNewJob(true);
      router.replace("/", { scroll: false });
    } else if (searchParams.get("showJobs") === "true") {
      setShowJobsBoard(true);
      router.replace("/", { scroll: false });
    } else if (isSignedIn && !showJobsBoard && !creatingNewJob) {
      // If already signed in as homeowner (e.g. navigated back), restore the jobs board
      setShowJobsBoard(true);
    }
  }, [searchParams, router, isSignedIn, showJobsBoard, creatingNewJob]);

  const examplePrompts = [
    "We have a leak under our kitchen sink that's been getting worse over the past few days. Looking for a licensed plumber to inspect and repair it within the next week.",
    "Need pressure washing for our driveway and backyard patio. Both areas have built-up dirt and stains and we'd like pricing and availability.",
    "Several outlets in our living room stopped working suddenly. Looking for an electrician to troubleshoot, repair, and confirm everything is safe.",
    "Our AC is running but not cooling the house properly. Airflow feels weak and indoor temps won't drop below 78. Need HVAC diagnosis and repair.",
    "Fence has multiple broken panels from recent wind. Looking for repair or partial replacement and a cost estimate.",
    "Looking for ongoing lawn care including mowing, edging, and weed control. Yard is medium-sized and service would be biweekly.",
    "The heater won't turn on and the house stays cold even when the thermostat is set higher. Need HVAC service as soon as possible.",
    "Breaker keeps tripping whenever we use the microwave or toaster at the same time. Need an electrician to inspect and resolve.",
    "Drywall damage in the hallway from a small plumbing leak. Need drywall repair, texture matching, and repainting.",
    "Large tree in the backyard is leaning and dropping branches. Looking for removal or trimming and safety assessment.",
    "Garage door opens inconsistently and sometimes gets stuck halfway. Looking for repair service and availability this week.",
    "Low water pressure in two bathrooms and the kitchen. Need a plumber to inspect the system and recommend a fix.",
    "Need a ceiling fan installed in the master bedroom. Existing wiring is in place. Looking for pricing and scheduling.",
    "Several interior doors don't close properly and rub against the frame. Looking for a handyman to realign and fix.",
    "Seeing ants and spiders inside the house, especially in the kitchen and bathrooms. Looking for pest control service and prevention treatment.",
    "Roof developed a small leak after recent rainstorms. Need inspection, repair, and estimate for any additional work needed.",
    "Lights flicker occasionally throughout the house, especially in the evenings. Need an electrician to diagnose and make repairs.",
    "Interested in seasonal HVAC servicing before summer. Looking for system inspection, cleaning, and performance check.",
    "Loose handrail on our stairway that needs to be secured for safety. Looking for a quick repair.",
    "Water heater is inconsistent and sometimes runs out of hot water quickly. Need evaluation for repair or replacement options.",
    "Looking to mount a 65\" TV in the living room and hide cables inside the wall. Need installation and pricing.",
    "Main drain appears clogged and is causing slow drainage in multiple sinks. Looking for urgent plumbing service.",
    "Cracked bathroom tiles near the shower area. Need tile replacement and sealing to prevent water damage.",
    "AC unit is making loud rattling noises when running. Need someone to inspect and let us know what's wrong.",
    "Our toilet keeps running and occasionally overflows. Looking for a plumber to fix the issue and provide an estimate.",
    "Interested in installing outdoor lighting around the front walkway and backyard. Looking for design suggestions and pricing.",
    "Uneven temperatures throughout the home with some rooms much warmer than others. Need HVAC inspection and airflow recommendations.",
    "Upgrading an older electrical panel to support new appliances. Looking for a licensed electrician and full quote.",
    "Noticing wasps near the roofline and backyard. Need pest control inspection and removal as soon as possible.",
    "Need tree trimming for two mature trees near the driveway. Looking for cleanup included and pricing.",
    "Front lawn has dead patches and weeds. Looking for lawn restoration and regular maintenance options.",
  ];

  // Rotate example prompts
  useEffect(() => {
    if (currentStep !== "describe" || showJobsBoard) return;
    
    const interval = setInterval(() => {
      setExampleIndex((prev) => (prev + 1) % examplePrompts.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [currentStep, showJobsBoard, examplePrompts.length]);

  const [userJobs, setUserJobs] = useState<Job[]>([
    {
      id: "1",
      description: "Roof replacement - 2000 sq ft shingled roof",
      status: "receiving_bids",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      bidsCount: 3,
    },
    {
      id: "2",
      description: "HVAC system repair - central air not cooling",
      status: "receiving_bids",
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      bidsCount: 0,
    },
    {
      id: "3",
      description: "Kitchen remodel - full renovation with new cabinets",
      status: "contractor_selected",
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      bidsCount: 5,
    },
    {
      id: "4",
      description: "Fence repair - 3 broken panels from wind damage",
      status: "in_progress",
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      bidsCount: 4,
    },
    {
      id: "5",
      description: "Bathroom tile replacement and waterproofing",
      status: "receiving_bids",
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      bidsCount: 2,
    },
    {
      id: "6",
      description: "Garage door spring replacement and alignment",
      status: "completed",
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      bidsCount: 3,
    },
  ]);
  const [jobDescription, setJobDescription] = useState("");
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [password, setPassword] = useState("");
  const [showTrialCheckout, setShowTrialCheckout] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [timeline, setTimeline] = useState("");
  const [budget, setBudget] = useState("");
  const [isRecurringJob, setIsRecurringJob] = useState(false);
  const [requiresInPerson, setRequiresInPerson] = useState<boolean | null>(null);
  const [exampleIndex, setExampleIndex] = useState(0);

  // Subscribe to job status changes from other pages
  useEffect(() => {
    const unsubscribe = subscribe(() => {
      // Force re-render to reflect status changes from job-store
      setUserJobs((prevJobs) =>
        prevJobs
          .map((job) => {
            const storedStatus = getJobStatus(job.id);
            if (storedStatus && storedStatus !== job.status) {
              return { ...job, status: storedStatus };
            }
            return job;
          })
          .filter((job) => !isJobArchived(job.id)) // Filter out archived jobs
      );
    });
    return unsubscribe;
  }, []);

  // Load real jobs from Supabase when user is signed in
  useEffect(() => {
    getHomeownerJobs().then(({ jobs: dbJobs }) => {
      if (dbJobs && dbJobs.length > 0) {
        setUserJobs(dbJobs.map((j: any) => ({
          id: j.id,
          description: j.description,
          status: (j.status === "open" ? "receiving_bids" : j.status) as JobStatusOwner,
          createdAt: new Date(j.created_at),
          bidsCount: j.bids?.[0]?.count ?? 0,
        })));
      }
    });
  }, []);

  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;

      const newImages: UploadedImage[] = Array.from(files).map((file) => ({
        id: Math.random().toString(36).substring(7),
        file,
        preview: URL.createObjectURL(file),
      }));

      setUploadedImages((prev) => [...prev, ...newImages]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    []
  );

  const removeImage = useCallback((id: string) => {
    setUploadedImages((prev) => {
      const imageToRemove = prev.find((img) => img.id === id);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      return prev.filter((img) => img.id !== id);
    });
  }, []);

  const isContactValid =
    !!contactInfo.firstName.trim() &&
    !!contactInfo.lastName.trim() &&
    !!contactInfo.email.trim() &&
    !!contactInfo.phone.trim() &&
    !!contactInfo.address.trim() &&
    !!contactInfo.city.trim() &&
    !!contactInfo.state.trim() &&
    !!contactInfo.zip.trim();

  const handleNextStep = useCallback(() => {
    if (currentStep === "describe" && jobDescription.trim()) {
      setCurrentStep("timeline");
    } else if (currentStep === "timeline" && timeline.trim()) {
      setCurrentStep("photos");
    } else if (currentStep === "photos") {
      setCurrentStep("contact");
    } else if (currentStep === "contact" && isContactValid) {
      setCurrentStep("trial");
    }
  }, [currentStep, jobDescription, timeline, isContactValid]);

  const handleBackStep = useCallback(() => {
    if (currentStep === "timeline") {
      setCurrentStep("describe");
    } else if (currentStep === "photos") {
      setCurrentStep("timeline");
    } else if (currentStep === "contact") {
      setCurrentStep("photos");
    } else if (currentStep === "trial") {
      setShowTrialCheckout(false);
      setCurrentStep("contact");
    }
  }, [currentStep]);

  const handleSubmitJob = useCallback(() => {
    // Show password modal before final submission
    setShowPasswordModal(true);
  }, []);

  const [submitJobError, setSubmitJobError] = useState("");
  const [submittingJob, setSubmittingJob] = useState(false);

  const handleFinalSubmit = useCallback(async () => {
    if (submittingJob) return; // double-submit guard
    setSubmittingJob(true);
    setSubmitJobError("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // New user — sign up. Email confirmation required before they can log in.
      const signUpResult = await signUpHomeowner({
        email: contactInfo.email,
        password,
        firstName: contactInfo.firstName,
        lastName: contactInfo.lastName,
      });
      if (signUpResult.error && signUpResult.error !== "already_registered") {
        setSubmitJobError(typeof signUpResult.error === "string" ? signUpResult.error : "Signup failed. Please try again.");
        setSubmittingJob(false);
        return;
      }
      // Can't create the job yet — no confirmed session. Show success and
      // let the webhook (fired by signUpHomeowner) capture the intent.
      setShowPasswordModal(false);
      setSubmittingJob(false);
      setCurrentStep("success");
      return;
    }

    // Existing signed-in user — create the job directly
    const jobResult = await createJob({
      title: jobDescription.slice(0, 80),
      description: jobDescription,
      category: "General",
      location: `${contactInfo.city}, ${contactInfo.state}`,
      budget_min: budget ? Number(budget.replace(/\D/g, "")) : undefined,
    });

    if (jobResult.error) {
      setSubmitJobError(jobResult.error);
      setSubmittingJob(false);
      return;
    }

    const newJob: Job = {
      id: jobResult.job?.id ?? String(Date.now()),
      description: jobDescription.trim(),
      status: "receiving_bids",
      createdAt: new Date(),
      bidsCount: 0,
    };
    setUserJobs((prev) => [newJob, ...prev]);
    setShowPasswordModal(false);
    setSubmittingJob(false);
    setCurrentStep("success");
  }, [submittingJob, jobDescription, contactInfo, password, budget]);

  const handleBackToHome = useCallback(() => {
    setJobDescription("");
    setUploadedImages([]);
    setContactInfo({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zip: "",
    });
    setPassword("");
    setConfirmPassword("");
    setTimeline("");
    setBudget("");
    setIsRecurringJob(false);
    setRequiresInPerson(null);
    setCurrentStep("describe");
    setShowJobsBoard(false);
    setCreatingNewJob(true);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleNextStep();
      }
    },
    [handleNextStep]
  );

  const handleTextareaChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setJobDescription(e.target.value);
      // Auto-resize textarea
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    },
    []
  );

  const handleContactChange = useCallback(
    (field: keyof ContactInfo) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setContactInfo((prev) => ({ ...prev, [field]: e.target.value }));
    },
    []
  );

  const resetForm = useCallback(() => {
    setJobDescription("");
    setUploadedImages([]);
    setContactInfo({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zip: "",
    });
    setPassword("");
    setConfirmPassword("");
    setTimeline("");
    setBudget("");
    setIsRecurringJob(false);
    setRequiresInPerson(null);
    setCurrentStep("describe");
    setShowJobsBoard(false);
    setCreatingNewJob(true);
  }, []);

  const handleYourJobsClick = useCallback(() => {
    if (isSignedIn) {
      setShowJobsBoard(true);
      setCreatingNewJob(false);
    } else {
      setShowSignInModal(true);
    }
  }, [isSignedIn]);



  const handleSignOut = useCallback(() => {
    authSignOut();
    setShowJobsBoard(false);
    setCurrentStep("describe");
    setJobDescription("");
  }, []);

  return (
    <div className="flex h-screen bg-background">
      {/* Main Content */}
      <main className="relative flex flex-1 flex-col overflow-y-auto">
        {/* Top bar with logo */}
        <div className="flex shrink-0 items-center justify-between border-b border-border bg-background px-3 py-0.5 md:px-4">
          <div className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="relative flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label={`Menu${isSignedIn && homeownerUnreadCount > 0 ? ` (${homeownerUnreadCount} notifications)` : ""}`}
                >
                  <Menu className="h-4 w-4" />
                  {isSignedIn && homeownerUnreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                      {homeownerUnreadCount > 9 ? "9+" : homeownerUnreadCount}
                    </span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52">
                {/* Public navigation */}
                <DropdownMenuItem asChild>
                  <Link href="/" className="flex cursor-pointer items-center gap-2">
                    <Home className="h-4 w-4" />
                    Home
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/services" className="flex cursor-pointer items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Services
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/how-it-works" className="flex cursor-pointer items-center gap-2">
                    <HelpCircle className="h-4 w-4" />
                    How It Works
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/subscribe" className="flex cursor-pointer items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Pricing
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link href="/about" className="flex cursor-pointer items-center gap-2">
                    <Info className="h-4 w-4" />
                    About Us
                  </Link>
                </DropdownMenuItem>

                {/* Account section */}
                <DropdownMenuSeparator />
                {isSignedIn && (
                  <DropdownMenuItem asChild>
                    <Link href="/inbox?type=homeowner" className="flex cursor-pointer items-center gap-2">
                      <Bell className="h-4 w-4" />
                      <span className="flex-1">Notifications</span>
                      {homeownerUnreadCount > 0 && (
                        <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                          {homeownerUnreadCount > 9 ? "9+" : homeownerUnreadCount}
                        </span>
                      )}
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  className="flex cursor-pointer items-center gap-2"
                  onSelect={() => resetForm()}
                >
                  <Plus className="h-4 w-4" />
                  Post a Job
                </DropdownMenuItem>
                {isSignedIn && (
                  <DropdownMenuItem
                    className="flex cursor-pointer items-center gap-2"
                    onSelect={() => handleYourJobsClick()}
                  >
                    <FileText className="h-4 w-4" />
                    Your Jobs
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {isSignedIn ? (
                  <DropdownMenuItem
                    className="flex cursor-pointer items-center gap-2 text-red-600 focus:text-red-600"
                    onSelect={(e) => {
                      e.preventDefault();
                      handleSignOut();
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    className="flex cursor-pointer items-center gap-2"
                    onSelect={(e) => {
                      e.preventDefault();
                      setShowSignInModal(true);
                    }}
                  >
                    <LogIn className="h-4 w-4" />
                    Sign In
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Link
            href="/"
            onClick={handleBackToHome}
            className="relative z-10 -ml-4 block cursor-pointer p-2 md:-ml-6"
            aria-label="HomeBids - Go to home"
          >
            <Image
              src="/images/homebids-logo-new.png"
              alt="HomeBids"
              width={702}
              height={176}
              className="h-[5rem] w-auto object-contain md:h-[6rem]"
              priority
              unoptimized
            />
          </Link>
        </div>

        {/* Step Content */}
        <div className="flex flex-1 flex-col items-center justify-center px-3 pb-8 pt-6 sm:px-4">
          <AnimatePresence mode="wait">
            {/* Jobs Board View */}
            {showJobsBoard && isSignedIn && (
              <motion.div
                key="jobs-board"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-3xl"
              >
                <div className="mb-8 flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-semibold text-foreground">
                      Your Jobs
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground sm:text-base">
                      Track your projects and manage bids
                    </p>
                  </div>
                  <Button onClick={resetForm} className="gap-2">
                    <Plus className="h-4 w-4" />
                    New Job
                  </Button>
                </div>

                {userJobs.length === 0 ? (
                  <div className="rounded-2xl border border-border bg-card p-12 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h2 className="mt-4 text-lg font-medium text-foreground">
                      No jobs yet
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Post your first job to start receiving bids from local
                      contractors
                    </p>
                    <Button onClick={resetForm} className="mt-6 gap-2">
                      <Plus className="h-4 w-4" />
                      Post Your First Job
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {[...userJobs].map((j) => ({
                      ...j,
                      status: (getJobStatus(j.id) as JobStatusOwner) || j.status,
                    })).sort((a, b) => {
                      const order: Record<string, number> = { receiving_bids: 0, contractor_selected: 1, in_progress: 2, completed: 3 };
                      return (order[a.status] ?? 9) - (order[b.status] ?? 9);
                    }).map((job) => (
                      <motion.div
                        key={job.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-md ${job.status === "completed" ? "opacity-70" : ""}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-foreground">
                              {job.description}
                            </p>
                            <div className="mt-2 flex items-center gap-4">
                              <span className="text-sm text-muted-foreground">
                                Posted{" "}
                                {Math.floor(
                                  (Date.now() - job.createdAt.getTime()) /
                                    (1000 * 60 * 60 * 24)
                                )}{" "}
                                days ago
                              </span>
                              {job.bidsCount > 0 && (
                                <span className="text-sm font-medium text-primary">
                                  {job.bidsCount} bid
                                  {job.bidsCount !== 1 ? "s" : ""} received
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="ml-4">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                                job.status === "completed"
                                  ? "bg-green-50 text-green-700 ring-1 ring-green-200"
                                  : job.status === "in_progress"
                                    ? "bg-blue-100 text-blue-800"
                                    : job.status === "contractor_selected"
                                      ? "bg-orange-100 text-orange-800"
                                      : "bg-green-100 text-green-800"
                              }`}
                            >
                              {job.status === "completed" && <CheckCircle2 className="h-3 w-3" />}
                              {getJobStatusLabel(job.status)}
                            </span>
                          </div>
                        </div>
                        <div className="mt-4 flex items-center gap-3">
                          <Button variant="outline" className="bg-transparent" size="sm" asChild>
                            <a href={`/jobs/${job.id}`}>
                              View Details
                            </a>
                          </Button>
                          {job.bidsCount > 0 && (
                            <Button variant="outline" className="bg-transparent" size="sm" asChild>
                              <Link href={`/jobs/${job.id}/bids`}>
                                View Bids
                              </Link>
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 1: Describe your project */}
            {currentStep === "describe" && !showJobsBoard && (
              <motion.div
                key="describe"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-2xl px-1 sm:px-0"
              >
                <div className="text-center">
                  <h1 className="text-balance text-2xl font-semibold text-foreground sm:text-3xl md:text-4xl">
                    What home project can we help with?
                  </h1>
                  
                </div>

                {/* Input area */}
                <div className="mt-8 w-full">
                  <div className="relative rounded-2xl border border-border bg-card shadow-lg sm:rounded-3xl">
                    {/* Input row */}
                    <div className="flex items-end gap-2 p-2 sm:p-3">
                      {/* Text input */}
                      <textarea
                        ref={textareaRef}
                        value={jobDescription}
                        onChange={handleTextareaChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Describe your project..."
                        className="min-h-[44px] flex-1 resize-none bg-transparent px-1 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none sm:px-2 sm:text-base"
                        rows={1}
                      />

                      {/* Submit button */}
                      <Button
                        type="button"
                        size="icon"
                        className="h-10 w-10 shrink-0 rounded-full"
                        onClick={handleNextStep}
                        disabled={!jobDescription.trim()}
                        aria-label="Continue to photos"
                      >
                        <ArrowUp className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Helper text */}
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  <span className="block sm:inline">HomeBids connects you with verified local contractors.</span>{" "}
                  <span className="block sm:inline">Get multiple bids, compare, and choose.</span>
                </p>
                <p className="mt-1 text-center text-[10px] text-muted-foreground/60">
                  *Your contact info is never shared until you approve a bid.
                </p>

                {/* Rotating Example Prompts */}
                <div className="mt-20 flex flex-col items-center">
                  <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                    Example projects
                  </p>
                  <div className="relative min-h-[4.5rem] w-full max-w-lg sm:min-h-[3.5rem]">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={exampleIndex}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="absolute inset-x-0 top-0 px-4 py-2"
                      >
                        <p className="text-center text-sm italic leading-relaxed text-muted-foreground/80">
                          &ldquo;{examplePrompts[exampleIndex]}&rdquo;
                        </p>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                  {/* Progress dots */}
                  <div className="mt-4 flex items-center gap-1">
                    {examplePrompts.slice(0, 5).map((_, i) => (
                      null
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Timeline & Budget */}
            {currentStep === "timeline" && !showJobsBoard && (
              <motion.div
                key="timeline"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-2xl"
              >
                <div className="text-center">
                  <h1 className="text-balance text-3xl font-semibold text-foreground md:text-4xl">
                    Let&apos;s get your project started
                  </h1>
                  <p className="mt-3 text-muted-foreground">
                    Help contractors understand your timeline and budget expectations
                  </p>
                </div>

                <div className="mt-8 space-y-6">
                  {/* In-Person Visit Question */}
                  <div className="rounded-2xl border border-border bg-card p-6">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                        <Home className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <Label className="text-base font-medium">Would you like to receive bids online or in-person?</Label>
                        <p className="mt-1 text-sm text-muted-foreground">
                          We know some jobs might require an in-person visit before a contractor can provide an accurate bid.
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-3">
                      <button
                        type="button"
                        onClick={() => setRequiresInPerson(false)}
                        className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all ${
                          requiresInPerson === false
                            ? "border-primary bg-primary/5 text-foreground"
                            : "border-border text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground"
                        }`}
                      >
                        Online Bids
                        <p className="mt-0.5 text-xs font-normal text-muted-foreground">
                          Contractors bid based on your description
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRequiresInPerson(true)}
                        className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all ${
                          requiresInPerson === true
                            ? "border-primary bg-primary/5 text-foreground"
                            : "border-border text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground"
                        }`}
                      >
                        In-Person First
                        <p className="mt-0.5 text-xs font-normal text-muted-foreground">
                          Contractors visit before bidding
                        </p>
                      </button>
                    </div>
                    {requiresInPerson === true && (
                      <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                        <p className="text-xs leading-relaxed text-amber-800">
                          Contractors will include their inspection fee (or note if it&apos;s free) when responding to your job. No payment is required until you accept a bid.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Timeline Selection */}
                  <div className="rounded-2xl border border-border bg-card p-6">
                    <Label className="text-base font-medium">Project Timeline</Label>
                    <p className="mt-1 text-sm text-muted-foreground">
                      When would you like the work to be completed?
                    </p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {[
                        { value: "urgent", label: "Urgent", desc: "Within 1 week" },
                        { value: "soon", label: "Soon", desc: "1-2 weeks" },
                        { value: "flexible", label: "Flexible", desc: "2-4 weeks" },
                        { value: "planning", label: "Planning Ahead", desc: "1+ months" },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setTimeline(option.value)}
                          className={`flex flex-col items-start rounded-xl border-2 p-4 text-left transition-all ${
                            timeline === option.value
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-muted-foreground/50"
                          }`}
                        >
                          <span className="font-medium text-foreground">{option.label}</span>
                          <span className="text-sm text-muted-foreground">{option.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Budget Input (Optional) */}
                  <div className="rounded-2xl border border-border bg-card p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base font-medium">Budget Range</Label>
                        
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Share your budget to receive more accurate bids
                    </p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {[
                        { value: "under500", label: "Under $500" },
                        { value: "500-2500", label: "$500 - $2,500" },
                        { value: "2500-5000", label: "$2,500 - $5,000" },
                        { value: "5000-10000", label: "$5,000 - $10,000" },
                        { value: "10000+", label: "$10,000+" },
                        { value: "unsure", label: "Not sure yet" },
                        { value: "insurance", label: "Insurance Paid" },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setBudget(budget === option.value ? "" : option.value)}
                          className={`rounded-xl border-2 px-4 py-3 text-sm transition-all ${
                            budget === option.value
                              ? option.value === "insurance"
                                ? "border-blue-500 bg-blue-50 font-medium text-blue-800"
                                : "border-primary bg-primary/5 font-medium"
                              : "border-border hover:border-muted-foreground/50"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                    {budget === "insurance" && (
                      <div className="mt-3 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                        <p className="text-xs leading-relaxed text-blue-800">
                          Insurance-paid jobs will display budget as <span className="font-semibold">TBD</span> to contractors. A contractor inspection is required before any payment is processed. Contractors will coordinate with your insurance provider.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Recurring Job Toggle */}
                  <div className="rounded-2xl border border-border bg-card p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                          <Repeat className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <Label className="text-base font-medium">Recurring Service</Label>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Is this an ongoing service? (e.g., pool cleaning, landscaping, pest control)
                          </p>
                        </div>
                      </div>
                      <div className="flex rounded-xl bg-muted p-1">
                        <button
                          type="button"
                          onClick={() => setIsRecurringJob(false)}
                          className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                            !isRecurringJob
                              ? "bg-background text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          No
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsRecurringJob(true)}
                          className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                            isRecurringJob
                              ? "bg-background text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          Yes
                        </button>
                      </div>
                    </div>
                    {isRecurringJob && (
                      <p className="mt-4 rounded-lg bg-primary/5 px-4 py-3 text-sm text-primary">
                        Great! Contractors will include recurring service options in their bids.
                      </p>
                    )}
                  </div>
                </div>

                {/* Navigation buttons */}
                <div className="mt-8 flex items-center justify-between">
                  <Button
                    variant="ghost"
                    onClick={handleBackStep}
                    className="gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    onClick={handleNextStep}
                    disabled={!timeline.trim() || requiresInPerson === null}
                    className="gap-2"
                  >
                    Continue
                    <ArrowUp className="h-4 w-4 rotate-90" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Upload Photos */}
            {currentStep === "photos" && !showJobsBoard && (
              <motion.div
                key="photos"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-2xl"
              >
                <div className="text-center">
                  <h1 className="text-balance text-3xl font-semibold text-foreground md:text-4xl">
                    Add photos of your project
                  </h1>
                  <p className="mt-3 text-muted-foreground">
                    Upload 3-5 photos to help contractors give you accurate bids
                  </p>
                </div>

                {/* Upload area */}
                <div className="mt-8">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />

                  {/* Drop zone */}
                  <label
                    htmlFor="image-upload"
                    className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-card p-8 transition-colors hover:border-primary/50 hover:bg-muted/50"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="mt-4 text-sm font-medium text-foreground">
                      Click to upload photos
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      PNG, JPG up to 10MB each
                    </p>
                  </label>

                  {/* Uploaded images grid */}
                  {uploadedImages.length > 0 && (
                    <div className="mt-6">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">
                          {uploadedImages.length} photo
                          {uploadedImages.length !== 1 ? "s" : ""} added
                        </p>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          <ImagePlus className="h-4 w-4" />
                          Add more
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                        {uploadedImages.map((image) => (
                          <motion.div
                            key={image.id}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="group relative aspect-square"
                          >
                            <div className="relative h-full w-full overflow-hidden rounded-xl">
                              <Image
                                src={image.preview || "/placeholder.svg"}
                                alt="Uploaded preview"
                                fill
                                className="object-cover"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeImage(image.id)}
                              className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-background shadow-md transition-opacity"
                              aria-label="Remove image"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Navigation buttons */}
                <div className="mt-8 flex items-center justify-between">
                  <Button
                    variant="ghost"
                    onClick={handleBackStep}
                    className="gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                  <Button onClick={handleNextStep} className="gap-2">
                    Continue
                    <ArrowUp className="h-4 w-4 rotate-90" />
                  </Button>
                </div>

                <p className="mt-4 text-center text-xs text-muted-foreground">
                  Photos are optional but help contractors provide more accurate
                  estimates
                </p>
              </motion.div>
            )}

            {/* Step 4: Contact Info & Subscription */}
            {currentStep === "contact" && !showJobsBoard && (
              <motion.div
                key="contact"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-2xl"
              >
                <div className="text-center">
                  <h1 className="text-balance text-3xl font-semibold text-foreground md:text-4xl">
                    Almost there! Add your details
                  </h1>
                  <p className="mt-3 text-muted-foreground">
                    Your info stays private until you approve a bid
                  </p>
                </div>

                {/* Contact form */}
                <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-lg">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        placeholder="John"
                        value={contactInfo.firstName}
                        onChange={handleContactChange("firstName")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        placeholder="Smith"
                        value={contactInfo.lastName}
                        onChange={handleContactChange("lastName")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        value={contactInfo.email}
                        onChange={handleContactChange("email")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="(555) 123-4567"
                        value={contactInfo.phone}
                        onChange={handleContactChange("phone")}
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="address">Street Address</Label>
                      <AddressAutocomplete
                        id="address"
                        value={contactInfo.address}
                        onChange={(val) =>
                          setContactInfo((prev) => ({ ...prev, address: val }))
                        }
                        onSelect={(selected) =>
                          setContactInfo((prev) => ({
                            ...prev,
                            address: selected.address,
                            city: selected.city,
                            state: selected.state,
                            zip: selected.zip,
                          }))
                        }
                        placeholder="Start typing your address..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        placeholder="Austin"
                        value={contactInfo.city}
                        onChange={handleContactChange("city")}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          placeholder="TX"
                          value={contactInfo.state}
                          onChange={handleContactChange("state")}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="zip">ZIP</Label>
                        <Input
                          id="zip"
                          placeholder="78701"
                          value={contactInfo.zip}
                          onChange={handleContactChange("zip")}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Navigation */}
                  <div className="mt-6 flex items-center justify-between">
                    <Button variant="ghost" onClick={handleBackStep} className="gap-2">
                      <ArrowLeft className="h-4 w-4" />
                      Back
                    </Button>
                    <Button
                      onClick={handleNextStep}
                      disabled={!isContactValid}
                      className="gap-2"
                    >
                      Next
                      <ArrowUp className="h-4 w-4 rotate-90" />
                    </Button>
                  </div>
                </div>

                <p className="mt-4 text-center text-xs text-muted-foreground">
                  Your contact info is never shared until you approve a bid.
                </p>
              </motion.div>
            )}

            {/* Step 5: Free Trial Subscription */}
            {currentStep === "trial" && !showJobsBoard && (
              <motion.div
                key="trial"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-lg"
              >
                <AnimatePresence mode="wait">
                  {!showTrialCheckout ? (
                    <motion.div
                      key="trial-card"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      {/* Pending job banner */}
                      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100">
                          <Clock className="h-4 w-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-amber-900">Your job is ready — but not posted yet</p>
                          <p className="mt-0.5 text-sm text-amber-700">
                            Start your free trial to publish your job and start receiving bids from contractors.
                          </p>
                        </div>
                      </div>

                      {/* Job preview */}
                      <div className="rounded-2xl border border-border bg-card overflow-hidden">
                        <div className="flex items-center justify-between border-b border-border bg-muted/40 px-5 py-3">
                          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Job Preview</p>
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Pending
                          </span>
                        </div>
                        <div className="p-5">
                          <p className="text-sm leading-relaxed text-foreground line-clamp-2">
                            {jobDescription || "Your job description will appear here."}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                            {contactInfo.city && contactInfo.state && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {contactInfo.city}, {contactInfo.state}
                              </span>
                            )}
                            {timeline && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {timeline}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Subscription card */}
                      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
                        {/* Header */}
                        <div className="border-b border-border px-5 py-5">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Homeowner Plan</p>
                              <div className="mt-2 flex items-baseline gap-1.5">
                                <span className="text-5xl font-bold tracking-tight text-foreground">$0</span>
                                <span className="text-base font-medium text-muted-foreground">today</span>
                              </div>
                              <p className="mt-1 text-sm text-muted-foreground">
                                then <span className="font-medium text-foreground">$9.99/mo</span> after 3 days
                              </p>
                            </div>
                            <span className="mt-1 inline-flex shrink-0 items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                              <CheckCircle2 className="h-3 w-3" />
                              Free trial
                            </span>
                          </div>
                        </div>

                        {/* Features */}
                        <div className="px-5 py-4">
                          <ul className="space-y-2.5">
                            {[
                              "Unlimited job posts",
                              "Unlimited contractor bids",
                              "Messaging with contractors",
                              "Job management dashboard",
                            ].map((text) => (
                              <li key={text} className="flex items-center gap-2.5 text-sm text-foreground">
                                <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                                {text}
                              </li>
                            ))}
                          </ul>

                          {/* Timeline */}
                          <div className="mt-4 flex items-stretch gap-0 rounded-xl overflow-hidden border border-border text-xs">
                            <div className="flex-1 bg-green-50 px-3 py-2.5 text-center">
                              <p className="font-bold text-green-700">Today</p>
                              <p className="text-green-600 mt-0.5">Trial starts · $0</p>
                            </div>
                            <div className="w-px bg-border" />
                            <div className="flex-1 px-3 py-2.5 text-center">
                              <p className="font-bold text-foreground">Day 4</p>
                              <p className="text-muted-foreground mt-0.5">$9.99 billed</p>
                            </div>
                            <div className="w-px bg-border" />
                            <div className="flex-1 px-3 py-2.5 text-center">
                              <p className="font-bold text-foreground">Monthly</p>
                              <p className="text-muted-foreground mt-0.5">Auto-renews</p>
                            </div>
                          </div>

                          <p className="mt-3 text-center text-[11px] text-muted-foreground">
                            Cancel anytime before day 4 and you won&apos;t be charged.
                          </p>
                        </div>

                        {/* CTA */}
                        <div className="border-t border-border px-5 py-4">
                          <Button
                            className="w-full gap-2"
                            size="lg"
                            onClick={() => setShowTrialCheckout(true)}
                          >
                            <Sparkles className="h-4 w-4" />
                            Start Free Trial &amp; Post Job
                          </Button>
                        </div>
                      </div>

                      {/* Back link */}
                      <button
                        type="button"
                        onClick={handleBackStep}
                        className="flex w-full items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Back to contact info
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="stripe-checkout"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      className="rounded-2xl border border-border bg-card shadow-lg overflow-hidden"
                    >
                      <div className="flex items-center justify-between border-b border-border px-6 py-4">
                        <div>
                          <p className="font-semibold text-foreground">Complete Your Free Trial</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            3 days free, then $9.99/month — cancel anytime
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowTrialCheckout(false)}
                        >
                          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                          Back
                        </Button>
                      </div>
                      <div className="p-4">
                        <SubscriptionCheckout
                          planId="homeowner-monthly"
                          onSuccess={handleSubmitJob}
                          onCancel={() => setShowTrialCheckout(false)}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Step 6: Success */}
            {currentStep === "success" && !showJobsBoard && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-2xl"
              >
                {/* Success celebration */}
                <div className="relative text-center">
                  {/* Green glow background */}
                  <div className="absolute inset-0 -z-10 mx-auto h-32 w-32 rounded-full bg-green-500/20 blur-3xl" />
                  
                  {/* Checkmark icon */}
                  
                  
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <h1 className="mt-6 text-balance text-3xl font-bold text-foreground md:text-4xl">
                      Congratulations!
                    </h1>
                    <p className="mt-2 text-lg text-green-600 font-medium">
                      Your job has been posted successfully
                    </p>
                    <p className="mt-2 text-muted-foreground">
                      Local contractors are being notified and will start sending bids soon.
                    </p>
                  </motion.div>
                </div>

                {/* Next Steps Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mt-8 rounded-2xl border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-6"
                >
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-green-800">
                    <FileText className="h-5 w-5" />
                    What happens next?
                  </h3>
                  <div className="mt-4 space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-600 text-sm font-bold text-white">
                        1
                      </div>
                      <div>
                        <p className="font-medium text-green-900">Contractors review your job</p>
                        <p className="text-sm text-green-700">Qualified pros in your area will see your project details</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-600 text-sm font-bold text-white">
                        2
                      </div>
                      <div>
                        <p className="font-medium text-green-900">Receive competitive bids</p>
                        <p className="text-sm text-green-700">{"You'll be notified via email and text when new bids arrive"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-600 text-sm font-bold text-white">
                        3
                      </div>
                      <div>
                        <p className="font-medium text-green-900">Compare and choose</p>
                        <p className="text-sm text-green-700">Review bids, check reviews, and pick the best fit for your project</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-600 text-sm font-bold text-white">
                        4
                      </div>
                      <div>
                        <p className="font-medium text-green-900">Connect with your pro</p>
                        <p className="text-sm text-green-700">Your contact info is only shared once you approve a bid</p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Estimated timeline */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-4 rounded-xl bg-muted/50 p-4 text-center"
                >
                  <p className="text-sm text-muted-foreground">
                    Most homeowners receive their first bid within <span className="font-semibold text-foreground">24-48 hours</span>
                  </p>
                </motion.div>

                {/* Action buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="mt-8"
                >
                  <p className="mb-4 text-center text-sm text-muted-foreground">
                    What would you like to do next?
                  </p>
                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                    <Button
                      onClick={resetForm}
                      variant="outline"
                      className="gap-2 border-green-300 bg-transparent text-green-700 hover:bg-green-50 hover:text-green-800"
                      size="lg"
                    >
                      <Plus className="h-4 w-4" />
                      Post Another Job
                    </Button>
                    <Button
                      onClick={() => {
                        setShowJobsBoard(true);
                        setCurrentStep("describe");
                      }}
                      className="gap-2 bg-green-600 text-white shadow-lg shadow-green-600/30 hover:bg-green-500"
                      size="lg"
                    >
                      <FileText className="h-4 w-4" />
                      Go to Dashboard
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Sign In Modal */}
      <SignInModal
        open={showSignInModal}
        onOpenChange={setShowSignInModal}
        onSignIn={() => {
          setShowJobsBoard(true);
        }}
      />

      {/* Create Password Modal */}
      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent className="sm:max-w-md">
          <div className="relative">
            {/* Decorative gradient background */}
            <div className="absolute -top-4 left-1/2 h-24 w-24 -translate-x-1/2 rounded-full bg-gradient-to-br from-green-400/30 to-emerald-500/30 blur-2xl" />
            
            <DialogHeader className="relative">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-600 shadow-lg shadow-green-500/30">
                <CheckCircle2 className="h-8 w-8 text-white" />
              </div>
              <DialogTitle className="text-center text-2xl">
                Almost there!
              </DialogTitle>
              <DialogDescription className="text-center">
                Create a password to track your job and receive bid notifications
              </DialogDescription>
            </DialogHeader>

            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="create-password">Password</Label>
                <Input
                  id="create-password"
                  type="password"
                  placeholder="Create a secure password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-create-password">Confirm Password</Label>
                <Input
                  id="confirm-create-password"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-12"
                />
              </div>

              {/* Password requirements hint */}
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">
                  Password should be at least 8 characters with a mix of letters and numbers
                </p>
              </div>

              {submitJobError && (
                <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {submitJobError}
                </p>
              )}
              <Button
                className="h-12 w-full gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30 hover:from-green-400 hover:to-emerald-500"
                onClick={handleFinalSubmit}
                disabled={submittingJob || !password.trim() || !confirmPassword.trim() || password !== confirmPassword}
              >
                {submittingJob ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Creating your account...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5" />
                    Complete & Post Job
                  </>
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                By continuing, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ScrollToTop />
    </div>
  );
}

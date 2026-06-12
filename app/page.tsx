"use client";

import Link from "next/link";
import React, { useState, useRef, useCallback, useEffect } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { copyToClipboard } from "@/lib/utils";
import {
  Plus,
  FileText,
  ArrowUp,
  ArrowLeft,
  ImagePlus,
  X,
  Home,
  Upload,
  CheckCircle2,
  User,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SignInModal } from "@/components/sign-in-modal";
import { Info, Settings, Building2, Repeat, AlertTriangle, Shield, Sparkles, MapPin, Clock, Tag, Zap } from "lucide-react";
import Image from "next/image";
import { ScrollToTop } from "@/components/scroll-to-top";
import { AddressAutocomplete } from "@/components/address-autocomplete";
import { getJobStatus, subscribe, isJobArchived, type JobStatusOwner, getJobStatusLabel } from "@/lib/job-store";
import { signUpHomeowner, createJob, getHomeownerJobs } from "@/lib/supabase/actions";
import { createClient } from "@/lib/supabase/client";
import { isDemoEmail, DEMO_HOMEOWNER_EMAIL, DEMO_CONTRACTOR_EMAIL } from "@/lib/demo-guard";
import { getHomeownerJobs as getDemoHomeownerJobs } from "@/lib/demo/services";
import { getMockUser, mockSignOut, USE_MOCK_DATA } from "@/lib/mock-auth";
import { getSmsLink, isMobileDevice, SMS_PHONE_DISPLAY } from "@/lib/sms-config";
import { SmsIphonePreview } from "@/components/sms-iphone-preview";
import { HomeLanding } from "@/components/home-landing";
import { MessageSquare, Copy, Check, Smartphone, MessageCircle, PlusCircle } from "lucide-react";
import { Header } from "@/components/header";

// Centralized sign-out: uses mock auth in demo mode.
async function performSignOut() {
  mockSignOut();
}

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

type Step = "describe" | "timeline" | "photos" | "contact" | "confirm" | "success";

interface Job {
  id: string;
  description: string;
  status: JobStatusOwner;
  createdAt: Date;
  bidsCount: number;
}

export default function HomePage() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [currentStep, setCurrentStep] = useState<Step>("describe");
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [showJobsBoard, setShowJobsBoard] = useState(false);
  const [creatingNewJob, setCreatingNewJob] = useState(false);
  const [showFormFallback, setShowFormFallback] = useState(false);
  const [showDesktopSmsDialog, setShowDesktopSmsDialog] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState(false);

  // Auth state from Supabase only
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isContractor, setIsContractor] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const homeownerUnreadCount = 0; // inbox wired separately

  // Ref-based flags so the restore logic never creates a dep-loop.
  // Each ref mirrors its corresponding state value but is readable synchronously
  // inside async callbacks and event listeners without stale closure issues.
  const showJobsBoardRef = useRef(false);
  const creatingNewJobRef = useRef(false);
  // currentStepRef mirrors currentStep so auth listeners can check it without deps.
  const currentStepRef = useRef<Step>("describe");
  // jobsBoardRestoredForSession: once we auto-show the jobs board for a session,
  // we never auto-show it again — preventing re-trigger on any re-render.
  const jobsBoardRestoredForSession = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // If the user clicked the logo (/?home=1), stay on the home page — never redirect.
    const stayOnHome = new URLSearchParams(window.location.search).has("home");
    if (stayOnHome) {
      setIsSignedIn(true);
      return;
    }

    if (USE_MOCK_DATA) {
      // Mock mode — read session synchronously, no network call.
      const user = getMockUser();
      if (!user) {
        window.location.replace("/gateway");
        return;
      }
      if (user) {
        if (user.role === "contractor") {
          window.location.replace("/contractors/dashboard");
          return;
        }
        if (user.role === "admin") {
          // Admin route removed — treat as homeowner
          setIsSignedIn(true);
        }
        setIsSignedIn(true);
        setIsContractor(false);
        setUserEmail(user.email);

        if (
          !creatingNewJobRef.current &&
          !showJobsBoardRef.current &&
          !jobsBoardRestoredForSession.current &&
          currentStepRef.current === "describe"
        ) {
          jobsBoardRestoredForSession.current = true;
          showJobsBoardRef.current = true;
          setShowJobsBoard(true);
        }
      }
      return;
    }

    // Live mode — Supabase auth (kept for production)
    let subscription: { unsubscribe: () => void } | null = null;
    try {
      const supabase = createClient();
      supabase.auth.getUser().then(async ({ data: { user } }) => {
        if (!user) {
          window.location.replace("/gateway");
          return;
        }
        if (user) {
          const type = user.user_metadata?.user_type;
          if (type === "contractor") {
            const { data: profile } = await supabase
              .from("contractor_profiles")
              .select("approval_status")
              .eq("id", user.id)
              .maybeSingle();
            const isApproved = profile?.approval_status === "approved";
            const isDemoAccount = user.email === DEMO_CONTRACTOR_EMAIL;
            if (isApproved || isDemoAccount) {
              window.location.replace("/contractors/dashboard");
            } else if (profile?.approval_status === "pending") {
              window.location.replace("/contractors/signup/pending");
            }
            return;
          } else {
            setIsSignedIn(true);
            setIsContractor(false);
            setUserEmail(user.email ?? null);
            if (
              !creatingNewJobRef.current &&
              !showJobsBoardRef.current &&
              !jobsBoardRestoredForSession.current &&
              currentStepRef.current === "describe"
            ) {
              jobsBoardRestoredForSession.current = true;
              showJobsBoardRef.current = true;
              setShowJobsBoard(true);
            }
          }
        }
      });
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === "INITIAL_SESSION") {
          if (!session?.user) {
            window.location.replace("/gateway");
          }
          return;
        }
        if (session?.user) {
          const type = session.user.user_metadata?.user_type;
          if (type === "contractor") {
            const { data: profile } = await supabase
              .from("contractor_profiles")
              .select("approval_status")
              .eq("id", session.user.id)
              .maybeSingle();
            const isApproved = profile?.approval_status === "approved";
            const isDemoAccount = session.user.email === DEMO_CONTRACTOR_EMAIL;
            if (isApproved || isDemoAccount) {
              window.location.replace("/contractors/dashboard");
            } else if (profile?.approval_status === "pending") {
              window.location.replace("/contractors/signup/pending");
            }
            return;
          } else {
            setIsSignedIn(true);
            setIsContractor(false);
            setUserEmail(session.user.email ?? null);
            if (
              event === "SIGNED_IN" &&
              !creatingNewJobRef.current &&
              !showJobsBoardRef.current &&
              !jobsBoardRestoredForSession.current &&
              currentStepRef.current === "describe"
            ) {
              jobsBoardRestoredForSession.current = true;
              showJobsBoardRef.current = true;
              setShowJobsBoard(true);
            }
          }
        } else {
          setIsSignedIn(false);
          setIsContractor(false);
          showJobsBoardRef.current = false;
          jobsBoardRestoredForSession.current = false;
          setShowJobsBoard(false);
        }
      });
      subscription = data.subscription;
    } catch {
      // Silently no-op if Supabase is unavailable
    }
    return () => subscription?.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle ?newJob and ?showJobs URL params only — no auto-restore logic here.
  // Keeping router out of the deps array since Next.js router has an unstable
  // reference that would cause this effect to re-run on every render.
  useEffect(() => {
    const newJob = searchParams.get("newJob");
    const showJobs = searchParams.get("showJobs");
    if (newJob === "true") {
      showJobsBoardRef.current = false;
      creatingNewJobRef.current = true;
      setShowJobsBoard(false);
      setCreatingNewJob(true);
      window.history.replaceState(null, "", "/");
    } else if (showJobs === "true") {
      showJobsBoardRef.current = true;
      setShowJobsBoard(true);
      window.history.replaceState(null, "", "/");
    }
  // searchParams is stable from Next.js — safe as the only dep here.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // setCurrentStepSafe: always call this instead of setCurrentStep directly
  // so that currentStepRef stays in sync with the React state value.
  const setCurrentStepSafe = useCallback((step: Step) => {
    currentStepRef.current = step;
    setCurrentStep(step);
  }, []);

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

  // Start with empty jobs — real data is loaded from Supabase in the effect below.
  // Never seed with mock data: new users would see phantom jobs they never created.
  const [userJobs, setUserJobs] = useState<Job[]>([]);
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

  // Load jobs — mock mode always uses pre-seeded demo data.
  useEffect(() => {
    if (!isSignedIn || userEmail === null) return;

    const loadJobs = USE_MOCK_DATA
      ? getDemoHomeownerJobs()
      : isDemoEmail(userEmail)
        ? getDemoHomeownerJobs()
        : getHomeownerJobs();

    loadJobs.then(({ jobs: dbJobs, error }) => {
      if (!error && Array.isArray(dbJobs)) {
        setUserJobs(dbJobs.map((j: any) => ({
          id: j.id,
          description: j.description,
          status: (j.status === "open" ? "receiving_bids" : j.status) as JobStatusOwner,
          createdAt: new Date(j.created_at),
          bidsCount: j.bids?.[0]?.count ?? 0,
        })));
      }
    });
  }, [isSignedIn, userEmail]);

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
      setCurrentStepSafe("timeline");
    } else if (currentStep === "timeline" && timeline.trim()) {
      setCurrentStepSafe("photos");
    } else if (currentStep === "photos") {
      setCurrentStepSafe("contact");
    } else if (currentStep === "contact" && isContactValid) {
      setCurrentStepSafe("confirm");
    }
  }, [currentStep, jobDescription, timeline, isContactValid, setCurrentStepSafe]);

  const handleBackStep = useCallback(() => {
    if (currentStep === "timeline") {
      setCurrentStepSafe("describe");
    } else if (currentStep === "photos") {
      setCurrentStepSafe("timeline");
    } else if (currentStep === "contact") {
      setCurrentStepSafe("photos");
    } else if (currentStep === "confirm") {
      setCurrentStepSafe("contact");
    }
  }, [currentStep, setCurrentStepSafe]);

  const handleSubmitJob = useCallback(() => {
    // Show password modal before final submission
    setShowPasswordModal(true);
  }, []);

  const [submitJobError, setSubmitJobError] = useState("");
  const [submittingJob, setSubmittingJob] = useState(false);

  const handleFinalSubmit = useCallback(async () => {
    if (submittingJob) return;
    setSubmittingJob(true);
    setSubmitJobError("");

    if (USE_MOCK_DATA) {
      // Mock mode — save a fake job to local state, no backend call.
      const newJob: Job = {
        id: `mock-new-${Date.now()}`,
        description: jobDescription.trim(),
        status: "receiving_bids",
        createdAt: new Date(),
        bidsCount: 0,
      };
      setUserJobs((prev) => [newJob, ...prev]);
      creatingNewJobRef.current = false;
      showJobsBoardRef.current = true;
      jobsBoardRestoredForSession.current = true;
      setShowPasswordModal(false);
      setSubmittingJob(false);
      setCreatingNewJob(false);
      setJobDescription("");
      setTimeline("");
      setBudget("");
      setContactInfo({ firstName: "", lastName: "", email: "", phone: "", address: "", city: "", state: "", zip: "" });
      setPassword("");
      setConfirmPassword("");
      setUploadedImages([]);
      setCurrentStepSafe("describe");
      setShowJobsBoard(true);
      return;
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
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
      jobsBoardRestoredForSession.current = true;
      setCurrentStepSafe("success");
      setShowPasswordModal(false);
      setSubmittingJob(false);
      return;
    }

    const budgetRangeMap: Record<string, { min?: number; max?: number }> = {
      under500:    { max: 500 },
      "500-2500":  { min: 500,   max: 2500 },
      "2500-5000": { min: 2500,  max: 5000 },
      "5000-10000":{ min: 5000,  max: 10000 },
      "10000+":    { min: 10000 },
      unsure:      {},
      insurance:   {},
    };
    const budgetRange = budgetRangeMap[budget] ?? {};

    const jobResult = await createJob({
      title: jobDescription.slice(0, 80),
      description: jobDescription,
      category: "General",
      location: `${contactInfo.city}, ${contactInfo.state}`,
      budget_min: budgetRange.min,
      budget_max: budgetRange.max,
    });

    if (jobResult.error) {
      setSubmitJobError(jobResult.error);
      setSubmittingJob(false);
      return;
    }

    // Pre-populate the jobs board with the new job so it's visible immediately.
    const newJob: Job = {
      id: jobResult.job?.id ?? String(Date.now()),
      description: jobDescription.trim(),
      status: "receiving_bids",
      createdAt: new Date(),
      bidsCount: 0,
    };
    setUserJobs((prev) => [newJob, ...prev]);

    // Update refs synchronously BEFORE any state changes so the auth listener
    // and restore logic cannot fire an auto-restore while we're mid-transition.
    creatingNewJobRef.current = false;
    showJobsBoardRef.current = true;
    jobsBoardRestoredForSession.current = true;

    // Reset form state and navigate to dashboard in one React batch.
    // Critically: do NOT reset currentStep here — leave it alone so no
    // restore-logic condition ("describe" + not creatingNewJob) becomes
    // briefly true and triggers a second setShowJobsBoard call.
    setShowPasswordModal(false);
    setSubmittingJob(false);
    setCreatingNewJob(false);
    setJobDescription("");
    setTimeline("");
    setBudget("");
    setContactInfo({ firstName: "", lastName: "", email: "", phone: "", address: "", city: "", state: "", zip: "" });
    setPassword("");
    setConfirmPassword("");
    setUploadedImages([]);
    setCurrentStepSafe("describe");
    setShowJobsBoard(true);
  }, [submittingJob, jobDescription, contactInfo, password, budget, setCurrentStepSafe]);

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
    showJobsBoardRef.current = false;
    creatingNewJobRef.current = true;
    setCurrentStepSafe("describe");
    setShowJobsBoard(false);
    setCreatingNewJob(true);
  }, [setCurrentStepSafe]);

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
      // Mark user as mid-flow so the jobs-board auth-restore never fires while
      // they are actively typing. Sync both state AND the ref so the auth
      // listener (which reads the ref, not state) sees the correct value.
      if (e.target.value.trim()) {
        creatingNewJobRef.current = true;
        setCreatingNewJob(true);
      }
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
    showJobsBoardRef.current = false;
    creatingNewJobRef.current = true;
    setCurrentStepSafe("describe");
    setShowJobsBoard(false);
    setCreatingNewJob(true);
  }, [setCurrentStepSafe]);

  const handleYourJobsClick = useCallback(() => {
    if (isSignedIn) {
      showJobsBoardRef.current = true;
      creatingNewJobRef.current = false;
      setShowJobsBoard(true);
      setCreatingNewJob(false);
    } else {
      setShowSignInModal(true);
    }
  }, [isSignedIn]);

  // Clicking "Home" always returns to the job-input form, dismissing the jobs board.
  const handleHomeClick = useCallback(() => {
    showJobsBoardRef.current = false;
    creatingNewJobRef.current = false;
    setShowJobsBoard(false);
    setCurrentStepSafe("describe");
  }, [setCurrentStepSafe]);

  // Listen for "hb:home" dispatched by header.tsx when the homeowner clicks "Home".
  useEffect(() => {
    const onHome = () => handleHomeClick();
    window.addEventListener("hb:home", onHome);
    return () => window.removeEventListener("hb:home", onHome);
  }, [handleHomeClick]);

  const handleSignOut = useCallback(() => {
    showJobsBoardRef.current = false;
    creatingNewJobRef.current = false;
    jobsBoardRestoredForSession.current = false;
    setShowJobsBoard(false);
    setCurrentStepSafe("describe");
    setJobDescription("");
    performSignOut();
  }, [setCurrentStepSafe]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header isSignedIn={isSignedIn} onSignIn={() => setShowSignInModal(true)} />

      {/* Main Content */}
      <main className="relative flex flex-1 flex-col">
        {/* Step Content */}
        <div className={`flex flex-1 flex-col ${currentStep === "describe" && !showJobsBoard ? "items-stretch" : "items-center justify-center px-3 pb-8 pt-6 sm:px-4"}`}>
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
                  <Button asChild className="gap-2">
                    <Link href="/new-job">
                      <Plus className="h-4 w-4" />
                      New Job
                    </Link>
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
                    <Button asChild className="mt-6 gap-2">
                      <Link href="/new-job">
                        <Plus className="h-4 w-4" />
                        Post Your First Job
                      </Link>
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
                                  ? "bg-[#0A84FF]/10 text-[#0A84FF] ring-1 ring-[#0A84FF]/30"
                                  : job.status === "in_progress"
                                    ? "bg-blue-100 text-blue-800"
                                    : job.status === "contractor_selected"
                                      ? "bg-orange-100 text-orange-800"
                                      : "bg-[#0A84FF]/10 text-[#0A84FF]"
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

            {/* Step 1: Landing page or Form Fallback */}
            {currentStep === "describe" && !showJobsBoard && (
              <motion.div
                key="describe"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                {!showFormFallback ? (
                  <HomeLanding onOpenForm={() => setShowFormFallback(true)} />
                ) : (
                  <>
                    {/* Original Form (fallback) */}
                    <div className="mx-auto w-full max-w-2xl px-4 pb-8 pt-6 sm:px-6">
                    <div className="mb-4 flex items-center">
                      <button
                        type="button"
                        onClick={() => setShowFormFallback(false)}
                        className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                      </button>
                    </div>

                    <div className="text-center">
                      <h1 className="text-balance text-2xl font-semibold text-foreground sm:text-3xl md:text-4xl">
                        What home project can we help with?
                      </h1>
                    </div>

                    {/* Input area */}
                    <div className="mt-8 w-full">
                      <div className="relative rounded-2xl border border-border bg-card shadow-lg sm:rounded-3xl">
                        <div className="flex items-end gap-2 p-2 sm:p-3">
                          <textarea
                            ref={textareaRef}
                            value={jobDescription}
                            onChange={handleTextareaChange}
                            onKeyDown={handleKeyDown}
                            placeholder="Describe your project..."
                            className="min-h-[44px] flex-1 resize-none bg-transparent px-1 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none sm:px-2 sm:text-base"
                            rows={1}
                          />
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
                    </div>
                    </div>
                  </>
                )}
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

            {/* Step 5: Confirm & Post — Free for Homeowners */}
            {currentStep === "confirm" && !showJobsBoard && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-lg"
              >
                <div className="space-y-4">
                  {/* Job preview */}
                  <div className="rounded-2xl border border-border bg-card overflow-hidden">
                    <div className="flex items-center justify-between border-b border-border bg-muted/40 px-5 py-3">
                      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Job Preview</p>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Ready to Post
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

                  {/* Free posting card */}
                  <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
                    {/* Header */}
                    <div className="border-b border-border px-5 py-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Homeowner Plan</p>
                          <div className="mt-2 flex items-baseline gap-1.5">
                            <span className="text-5xl font-bold tracking-tight text-foreground">$0</span>
                            <span className="text-base font-medium text-muted-foreground">forever</span>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Completely free. No credit card required.
                          </p>
                        </div>
                        <span className="mt-1 inline-flex shrink-0 items-center gap-1 rounded-full bg-[#0A84FF]/10 px-2.5 py-1 text-xs font-semibold text-[#0A84FF]">
                          <CheckCircle2 className="h-3 w-3" />
                          Free
                        </span>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="px-5 py-4">
                      <ul className="space-y-2.5">
                        {[
                          "Post your project for free",
                          "Receive bids from local contractors",
                          "Messaging with contractors",
                          "Job management dashboard",
                        ].map((text) => (
                          <li key={text} className="flex items-center gap-2.5 text-sm text-foreground">
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#0A84FF]" />
                            {text}
                          </li>
                        ))}
                      </ul>

                      <p className="mt-4 text-center text-[11px] text-muted-foreground">
                        Zero cost to homeowners — contractors pay to bid on your project.
                      </p>
                    </div>

                    {/* CTA */}
                    <div className="border-t border-border px-5 py-4">
                      <Button
                        className="w-full gap-2"
                        size="lg"
                        onClick={handleSubmitJob}
                      >
                        <Sparkles className="h-4 w-4" />
                        Post My Job — Free
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
                </div>
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
                  <div className="absolute inset-0 -z-10 mx-auto h-32 w-32 rounded-full bg-[#0A84FF]/20 blur-3xl" />
                  
                  {/* Checkmark icon */}
                  
                  
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <h1 className="mt-6 text-balance text-3xl font-bold text-foreground md:text-4xl">
                      Congratulations!
                    </h1>
                    <p className="mt-2 text-lg text-[#0A84FF] font-medium">
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
                  className="mt-8 rounded-2xl border border-[#0A84FF]/30 bg-[#0A84FF]/5 p-6"
                >
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                    <FileText className="h-5 w-5" />
                    What happens next?
                  </h3>
                  <div className="mt-4 space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0A84FF] text-sm font-bold text-white">
                        1
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Contractors review your job</p>
                        <p className="text-sm text-muted-foreground">Qualified pros in your area will see your project details</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0A84FF] text-sm font-bold text-white">
                        2
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Receive competitive bids</p>
                        <p className="text-sm text-muted-foreground">{"You'll be notified via email and text when new bids arrive"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0A84FF] text-sm font-bold text-white">
                        3
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Compare and choose</p>
                        <p className="text-sm text-muted-foreground">Review bids, check reviews, and pick the best fit for your project</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0A84FF] text-sm font-bold text-white">
                        4
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Connect with your pro</p>
                        <p className="text-sm text-muted-foreground">Your contact info is only shared once you approve a bid</p>
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
                      asChild
                      variant="outline"
                      className="gap-2 border-[#0A84FF]/40 bg-transparent text-[#0A84FF] hover:bg-[#0A84FF]/5 hover:text-[#0A84FF]"
                      size="lg"
                    >
                      <Link href="/new-job">
                        <Plus className="h-4 w-4" />
                        Post Another Job
                      </Link>
                    </Button>
                    <Button
                      onClick={() => {
                        // Set board first, THEN reset step — order matters.
                        // If step resets to "describe" before showJobsBoard is
                        // true, AnimatePresence briefly renders the describe
                        // screen before the board replaces it.
                        showJobsBoardRef.current = true;
                        jobsBoardRestoredForSession.current = true;
                        setShowJobsBoard(true);
                        setCurrentStepSafe("describe");
                      }}
                      className="gap-2 bg-[#0A84FF] text-white shadow-lg shadow-[#0A84FF]/30 hover:bg-[#0A84FF]/90"
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
          // Keep refs in sync so the auth listener doesn't fire a redundant restore.
          showJobsBoardRef.current = true;
          jobsBoardRestoredForSession.current = true;
          setShowJobsBoard(true);
        }}
      />

      {/* Create Password Modal */}
      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent className="sm:max-w-md">
          <div className="relative">
            {/* Decorative gradient background */}
            <div className="absolute -top-4 left-1/2 h-24 w-24 -translate-x-1/2 rounded-full bg-[#0A84FF]/20 blur-2xl" />
            
            <DialogHeader className="relative">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#0A84FF] shadow-lg shadow-[#0A84FF]/30">
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
                className="h-12 w-full gap-2 bg-[#0A84FF] text-white shadow-lg shadow-[#0A84FF]/30 hover:bg-[#0A84FF]/90"
                onClick={handleFinalSubmit}
                disabled={submittingJob || !password.trim() || password.length < 6 || !confirmPassword.trim() || password !== confirmPassword}
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

      {/* Desktop SMS Fallback Dialog */}
      <Dialog open={showDesktopSmsDialog} onOpenChange={setShowDesktopSmsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Text us to get started
            </DialogTitle>
            <DialogDescription>
              Send a text from your phone to start your project. No app or account needed.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="rounded-xl border border-border bg-secondary/50 px-6 py-4 text-center">
              <p className="text-2xl font-bold tracking-wide text-foreground">
                {SMS_PHONE_DISPLAY}
              </p>
            </div>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => {
                copyToClipboard(SMS_PHONE_DISPLAY);
                setCopiedNumber(true);
                setTimeout(() => setCopiedNumber(false), 2000);
              }}
            >
              {copiedNumber ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy number
                </>
              )}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              {"Just text: \"Hey HomeBids, I need help with...\""}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/header";
import { ScrollToTop } from "@/components/scroll-to-top";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { signUpContractor } from "@/lib/supabase/actions";
import { createClient } from "@/lib/supabase/client";
import { checkContractorSubscription } from "@/lib/subscription-check";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  User,
  Wrench,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Clock,
  Shield,
  Zap,
} from "lucide-react";

type Step = "info" | "trial";

const trades = [
  "Roofing",
  "Electrical",
  "Plumbing",
  "HVAC",
  "Garage Door",
  "Landscaping",
  "Painting",
  "Flooring",
  "Windows & Doors",
  "Kitchen & Bath",
  "Concrete & Masonry",
  "Siding",
  "Pest Control",
  "Appliance Repair",
  "Cleaning",
  "Home Security",
  "Pool & Spa",
  "Handyman",
  "Insulation",
  "Solar",
  "General Contractor",
  "Other",
];

export default function ContractorSignupPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>("info");
  const [checking, setChecking] = useState(true);

  // If a signed-in contractor with no subscription tries to re-signup, send to payment
  useEffect(() => {
    const checkExistingContractor = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          // Check the user's profile to see if they're a contractor or homeowner
          const { data: profile } = await supabase
            .from('profiles')
            .select('user_type')
            .eq('id', user.id)
            .single();

          const userType = profile?.user_type ?? 'homeowner';

          // If this is a signed-in homeowner, show error message instead
          if (userType === 'homeowner') {
            setHomeownerError(true);
            setChecking(false);
            return;
          }

          const { hasValidSubscription } = await checkContractorSubscription(user.id);
          if (hasValidSubscription) {
            // Already has a subscription — shouldn't be on signup page
            router.push("/contractors/dashboard");
            return;
          }
          // No subscription but signed in as contractor — send to payment with userId
          router.push(`/subscribe?type=contractor&userId=${user.id}`);
          return;
        }

        // Not signed in — allow access to signup
        setChecking(false);
      } catch (e) {
        console.error("[contractors-signup] Check failed:", e);
        setChecking(false);
      }
    };

    checkExistingContractor();
  }, [router]);

  const [homeownerError, setHomeownerError] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    companyName: "",
    trade: "",
    serviceArea: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const update = (field: keyof typeof formData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  // Step 1 is valid when the required account + business basics are present.
  const infoValid =
    formData.fullName.trim() !== "" &&
    formData.phone.trim() !== "" &&
    formData.companyName.trim() !== "" &&
    formData.trade !== "" &&
    formData.serviceArea.trim() !== "" &&
    /\S+@\S+\.\S+/.test(formData.email) &&
    formData.password.length >= 8 &&
    formData.password === formData.confirmPassword;

  const handleSubmit = async () => {
    setSubmitError("");
    if (!infoValid) {
      setSubmitError("Please complete all required fields before continuing.");
      return;
    }

    setSubmitting(true);
    const result = await signUpContractor({
      email: formData.email,
      password: formData.password,
      fullName: formData.fullName,
      phone: formData.phone,
      companyName: formData.companyName,
      trade: formData.trade,
      serviceArea: formData.serviceArea,
    });
    setSubmitting(false);

    if (result.error) {
      if (result.error === "already_registered") {
        setSubmitError("An account with this email already exists. Try signing in instead.");
        return;
      }
      setSubmitError(result.error);
      return;
    }

    // Route to payment with the new userId so checkout links the subscription correctly
    const params = new URLSearchParams({
      type: 'contractor',
      userId: result.userId ?? '',
    });
    router.push(`/subscribe?${params.toString()}`);
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Checking account status...</div>
      </div>
    );
  }

  if (homeownerError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-foreground mb-2">Already Signed In</h1>
          <p className="text-muted-foreground mb-6">You&apos;re signed in as a homeowner. Sign out to create a contractor account.</p>
          <form action="/auth/sign-out" method="POST">
            <button type="submit" className="inline-flex h-10 px-6 rounded-full bg-foreground text-background font-semibold hover:opacity-90 transition-opacity">
              Sign Out
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-xl">
          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 text-center"
          >
            <h1 className="text-3xl font-bold text-foreground sm:text-4xl text-balance">
              Start Your Free Trial
            </h1>
            <p className="mt-3 text-muted-foreground text-pretty">
              Create your account in under a minute. You can build your first bid right after —
              no license, insurance, or portfolio required to get started.
            </p>
          </motion.div>

          {/* Progress */}
          <div className="mb-8 flex items-center justify-center gap-3">
            {(
              [
                { key: "info", label: "Your Info", icon: User },
                { key: "trial", label: "Start Trial", icon: Zap },
              ] as { key: Step; label: string; icon: React.ElementType }[]
            ).map((s, i) => {
              const active = currentStep === s.key;
              const done = currentStep === "trial" && s.key === "info";
              return (
                <div key={s.key} className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors ${
                        active || done
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-muted-foreground"
                      }`}
                    >
                      {done ? <CheckCircle2 className="h-5 w-5" /> : <s.icon className="h-4 w-4" />}
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        active || done ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i === 0 && <div className="h-0.5 w-8 bg-border" />}
                </div>
              );
            })}
          </div>

          <Card className="border-border">
            <CardContent className="p-6 sm:p-8">
              {/* Step 1: Your Info */}
              {currentStep === "info" && (
                <motion.div
                  key="info"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-5"
                >
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">Your Info</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Just the essentials to create your account.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) => update("fullName", e.target.value)}
                        placeholder="John Smith"
                        className="mt-1.5"
                        autoComplete="name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => update("phone", e.target.value)}
                        placeholder="(512) 555-0123"
                        className="mt-1.5"
                        autoComplete="tel"
                      />
                    </div>

                    <div>
                      <Label htmlFor="companyName">Company Name *</Label>
                      <Input
                        id="companyName"
                        value={formData.companyName}
                        onChange={(e) => update("companyName", e.target.value)}
                        placeholder="ABC Plumbing"
                        className="mt-1.5"
                        autoComplete="organization"
                      />
                    </div>

                    <div>
                      <Label htmlFor="trade">Primary Trade *</Label>
                      <select
                        id="trade"
                        value={formData.trade}
                        onChange={(e) => update("trade", e.target.value)}
                        className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="">Select your trade...</option>
                        {trades.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="serviceArea">Service Area *</Label>
                      <Input
                        id="serviceArea"
                        value={formData.serviceArea}
                        onChange={(e) => update("serviceArea", e.target.value)}
                        placeholder="Austin, TX or 78701"
                        className="mt-1.5"
                      />
                    </div>
                  </div>

                  {/* Account credentials */}
                  <div className="space-y-4 border-t border-border pt-5">
                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => update("email", e.target.value)}
                        placeholder="john@abcplumbing.com"
                        className="mt-1.5"
                        autoComplete="email"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="password">Password *</Label>
                        <div className="relative mt-1.5">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={formData.password}
                            onChange={(e) => update("password", e.target.value)}
                            placeholder="Min. 8 characters"
                            className="pr-10"
                            autoComplete="new-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {formData.password.length > 0 &&
                          (() => {
                            const len = formData.password.length;
                            const hasUpper = /[A-Z]/.test(formData.password);
                            const hasNumber = /\d/.test(formData.password);
                            const hasSpecial = /[^A-Za-z0-9]/.test(formData.password);
                            const score =
                              (len >= 8 ? 1 : 0) +
                              (len >= 12 ? 1 : 0) +
                              (hasUpper ? 1 : 0) +
                              (hasNumber ? 1 : 0) +
                              (hasSpecial ? 1 : 0);
                            const label =
                              score <= 1 ? "Weak" : score <= 3 ? "Fair" : score <= 4 ? "Good" : "Strong";
                            const color =
                              score <= 1
                                ? "bg-destructive"
                                : score <= 3
                                  ? "bg-yellow-500"
                                  : score <= 4
                                    ? "bg-blue-500"
                                    : "bg-green-500";
                            return (
                              <div className="mt-2 space-y-1">
                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                                  <div
                                    className={`h-full rounded-full transition-all ${color}`}
                                    style={{ width: `${Math.min(score * 20, 100)}%` }}
                                  />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Strength: <span className="font-medium text-foreground">{label}</span>
                                  {len < 8 && " — must be at least 8 characters"}
                                </p>
                              </div>
                            );
                          })()}
                      </div>

                      <div>
                        <Label htmlFor="confirmPassword">Confirm Password *</Label>
                        <div className="relative mt-1.5">
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            value={formData.confirmPassword}
                            onChange={(e) => update("confirmPassword", e.target.value)}
                            placeholder="Re-enter your password"
                            className="pr-10"
                            autoComplete="new-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword((v) => !v)}
                            className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        {formData.confirmPassword.length > 0 && (
                          <p
                            className={`mt-2 flex items-center gap-1.5 text-xs font-medium ${
                              formData.password === formData.confirmPassword
                                ? "text-green-600"
                                : "text-destructive"
                            }`}
                          >
                            {formData.password === formData.confirmPassword ? (
                              <>
                                <CheckCircle2 className="h-3.5 w-3.5" /> Passwords match
                              </>
                            ) : (
                              <>
                                <AlertCircle className="h-3.5 w-3.5" /> Passwords do not match
                              </>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Start Trial */}
              {currentStep === "trial" && (
                <motion.div
                  key="trial"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">Start Your Free Trial</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Try HomeBids free for 3 days. Cancel anytime before it ends and you won&apos;t be charged.
                    </p>
                  </div>

                  <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
                    <div className="flex items-baseline justify-between">
                      <p className="text-2xl font-bold text-foreground">$99 / month</p>
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                        <Clock className="h-3 w-3" /> 3-day free trial
                      </span>
                    </div>
                    <ul className="mt-4 space-y-2">
                      {[
                        "Unlimited AI-generated bids",
                        "Build professional proposals by text",
                        "Shareable proposal link + PDF included",
                        "No bid fees — ever",
                      ].map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm text-foreground">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Account summary */}
                  <div className="rounded-lg border border-border p-4">
                    <h3 className="text-sm font-semibold text-foreground">Account Summary</h3>
                    <div className="mt-2 grid gap-1 text-sm">
                      <p>
                        <span className="text-muted-foreground">Name:</span> {formData.fullName}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Company:</span> {formData.companyName}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Trade:</span> {formData.trade}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Service Area:</span>{" "}
                        {formData.serviceArea}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Email:</span> {formData.email}
                      </p>
                    </div>
                  </div>

                  <label className="flex items-start gap-3">
                    <Checkbox
                      checked={formData.agreeToTerms}
                      onCheckedChange={(checked) => update("agreeToTerms", checked as boolean)}
                      className="mt-0.5"
                    />
                    <span className="text-sm text-muted-foreground">
                      I agree to the{" "}
                      <Link href="/terms" className="text-primary hover:underline">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy" className="text-primary hover:underline">
                        Privacy Policy
                      </Link>
                      .
                    </span>
                  </label>
                </motion.div>
              )}

              {/* Navigation */}
              <div className="mt-8 space-y-4 border-t border-border pt-6">
                {submitError && (
                  <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  {currentStep === "trial" ? (
                    <Button variant="outline" onClick={() => setCurrentStep("info")} disabled={submitting}>
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                  ) : (
                    <Button variant="outline" asChild>
                      <Link href="/contractors">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Cancel
                      </Link>
                    </Button>
                  )}

                  {currentStep === "info" ? (
                    <Button
                      onClick={() => {
                        setSubmitError("");
                        if (!infoValid) {
                          setSubmitError("Please complete all required fields before continuing.");
                          return;
                        }
                        setCurrentStep("trial");
                        scrollToTop();
                      }}
                    >
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button onClick={handleSubmit} disabled={!formData.agreeToTerms || submitting}>
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating Account...
                        </>
                      ) : (
                        <>
                          Start Free Trial
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-6 text-center text-sm text-muted-foreground"
          >
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>SSL Encrypted</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Cancel Anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              <span>Build Bids Instantly</span>
            </div>
          </motion.div>
        </div>
      </main>

      <ScrollToTop />
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Loader2, ArrowLeft, Home, Hammer, Eye, EyeOff, MailCheck } from "lucide-react";
import { HomeBidsLogo } from "@/components/homebids-logo";
import { createClient } from "@/lib/supabase/client";
import {
  realSignIn,
  getMockUser,
  redirectAfterSignIn,
} from "@/lib/mock-auth";
import { phoneSignIn } from "@/lib/supabase/actions";

type View = "signin" | "forgot" | "forgot-sent";
type UserType = "contractor" | "homeowner";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignInPage() {
  const router = useRouter();
  const [view, setView] = useState<View>("signin");
  const [userType, setUserType] = useState<UserType>("contractor");
  const [usePhoneForHomeowner, setUsePhoneForHomeowner] = useState(true);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Forgot-password sub-form state
  const [resetEmail, setResetEmail] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  // Redirect if already signed in (avoids showing the form to a logged-in user).
  useEffect(() => {
    // Deep-link support: /auth/sign-in?forgot=1 opens the reset form directly
    // (used by the "Request New Link" CTA on an expired reset link).
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("forgot") === "1") {
        setView("forgot");
      }
    }

    const user = getMockUser();
    if (user) {
      redirectAfterSignIn(user.role);
      return;
    }
    setCheckingSession(false);
  }, []);

  async function handleForgotSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = resetEmail.trim();
    if (!trimmed) {
      setResetError("Please enter your email address.");
      return;
    }
    if (!EMAIL_REGEX.test(trimmed)) {
      setResetError("Please enter a valid email address.");
      return;
    }
    setResetLoading(true);
    setResetError("");
    try {
      const supabase = createClient();
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      // Always show the generic success state — never reveal whether the email
      // is registered. Only surface a message for genuine transport failures.
      if (resetErr) {
        console.error("[v0] resetPasswordForEmail error:", resetErr.message);
      }
      setView("forgot-sent");
    } catch {
      setResetError("Something went wrong. Please try again.");
    } finally {
      setResetLoading(false);
    }
  }

  function openForgot() {
    setResetEmail(email.trim());
    setResetError("");
    setView("forgot");
  }

  function backToLogin() {
    setResetError("");
    setError("");
    setView("signin");
  }

  async function handlePasswordSignIn(e: React.FormEvent) {
    e.preventDefault();

    if (userType === "homeowner" && usePhoneForHomeowner) {
      // Homeowner phone sign-in
      if (!phone.trim() || !password) {
        setError("Please enter your phone and password.");
        return;
      }
      setLoading(true);
      setError("");
      const result = await phoneSignIn(phone, password);
      if (result.error) {
        setError(result.error);
        setLoading(false);
      } else if (result.success) {
        // Redirect client-side on success
        router.push("/homeowners/dashboard");
      }
    } else {
      // Contractor or homeowner email sign-in
      if (!email.trim() || !password) {
        setError("Please enter your email and password.");
        return;
      }
      setLoading(true);
      setError("");
      const result = await realSignIn(email, password);
      if (result.user) {
        redirectAfterSignIn(result.user.role);
      } else {
        setError(result.error ?? "Unable to sign in.");
        setLoading(false);
      }
    }
  }

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top bar — logo is absolutely centered so the back link never pushes it off */}
      <div className="relative flex items-center border-b border-border px-4 py-3">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <Link
          href="/"
          className="absolute left-1/2 -translate-x-1/2 flex items-center focus-visible:outline-none"
        >
          <HomeBidsLogo size="clamp(22px, 3vw, 28px)" linked={false} />
        </Link>
      </div>

      {/* Content */}
      <div className="flex flex-1 items-start justify-center px-4 pt-8 pb-16">
        <div className="w-full max-w-sm space-y-5">
          {view === "signin" && (
          <>
          {/* User Type Toggle */}
          <div className="flex gap-2 rounded-lg border border-border bg-muted/50 p-1">
            <button
              type="button"
              onClick={() => {
                setUserType("contractor");
                setUsePhoneForHomeowner(false);
              }}
              className={`flex-1 rounded px-3 py-2 text-sm font-medium transition-colors ${
                userType === "contractor"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Contractor
            </button>
            <button
              type="button"
              onClick={() => setUserType("homeowner")}
              className={`flex-1 rounded px-3 py-2 text-sm font-medium transition-colors ${
                userType === "homeowner"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Homeowner
            </button>
          </div>

          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome back to HomeBids</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {userType === "contractor"
                ? "Sign in to view your project, bids, messages, and contractor activity."
                : "Sign in to view your project and bids."}
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handlePasswordSignIn} className="space-y-3">
            {userType === "homeowner" && (
              <>
                {usePhoneForHomeowner ? (
                  <div className="space-y-1.5">
                    <label htmlFor="phone" className="text-sm font-medium text-foreground">
                      Phone Number
                    </label>
                    <Input
                      id="phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="(555) 123-4567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-11"
                      disabled={loading}
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label htmlFor="email" className="text-sm font-medium text-foreground">
                      Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-11"
                      disabled={loading}
                    />
                  </div>
                )}
                <p className="text-center text-xs text-muted-foreground">
                  {usePhoneForHomeowner ? (
                    <button
                      type="button"
                      onClick={() => setUsePhoneForHomeowner(false)}
                      className="font-medium text-primary hover:underline"
                    >
                      Prefer email? Sign in with email
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setUsePhoneForHomeowner(true)}
                      className="font-medium text-primary hover:underline"
                    >
                      Sign in with phone instead
                    </button>
                  )}
                </p>
              </>
            )}
            {userType === "contractor" && (
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11"
                  disabled={loading}
                />
              </div>
            )}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </label>
                <button
                  type="button"
                  onClick={openForgot}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 pr-10"
                  disabled={loading}
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
            </div>
            <Button type="submit" className="w-full h-11 cursor-pointer" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            New contractor?{" "}
            <Link href="/contractors/signup" className="font-medium text-primary hover:underline">
              Create an account
            </Link>
          </p>
          </>
          )}

          {view === "forgot" && (
            <>
              <div className="text-center">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Reset your password</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Enter the email connected to your HomeBids account and we&apos;ll send you a reset link.
                </p>
              </div>

              {resetError && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {resetError}
                </div>
              )}

              <form onSubmit={handleForgotSubmit} className="space-y-3">
                <div className="space-y-1.5">
                  <label htmlFor="reset-email" className="text-sm font-medium text-foreground">
                    Email
                  </label>
                  <Input
                    id="reset-email"
                    type="email"
                    autoComplete="email"
                    placeholder="Email address"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="h-11"
                    disabled={resetLoading}
                  />
                </div>
                <Button type="submit" className="w-full h-11 cursor-pointer" disabled={resetLoading}>
                  {resetLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Reset Link
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground">
                <button type="button" onClick={backToLogin} className="font-medium text-primary hover:underline">
                  Back to Login
                </button>
              </p>
            </>
          )}

          {view === "forgot-sent" && (
            <div className="space-y-5 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <MailCheck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Check your email</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  If an account exists for that email, we&apos;ll send a password reset link.
                </p>
              </div>
              <Button onClick={backToLogin} className="w-full h-11 cursor-pointer">
                Back to Login
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

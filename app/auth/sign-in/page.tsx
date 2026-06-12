"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Loader2, ArrowLeft, Home, Hammer } from "lucide-react";
import { HomeBidsLogo } from "@/components/homebids-logo";
import {
  mockGoogleSignIn,
  mockAppleSignIn,
  mockPhoneOtpSignIn,
  mockEmailMagicLinkSignIn,
  mockSignIn,
  redirectAfterSignIn,
  MOCK_OTP_CODE,
  type MockRole,
} from "@/lib/mock-auth";

// ── Types ─────────────────────────────────────────────────────────────────────

type Screen =
  | "home"
  | "phone-entry"
  | "phone-otp"
  | "email-entry"
  | "email-sent"
  | "role-selection";

interface PendingAuth {
  provider: "google" | "apple" | "phone" | "email";
  phone?: string;
  email?: string;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function RoleCard({
  role,
  title,
  description,
  icon,
  onSelect,
  loading,
}: {
  role: MockRole;
  title: string;
  description: string;
  icon: React.ReactNode;
  onSelect: (role: MockRole) => void;
  loading: boolean;
}) {
  return (
    <button
      type="button"
      disabled={loading}
      onClick={() => onSelect(role)}
      className="flex w-full items-start gap-4 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary/50 hover:bg-primary/5 disabled:opacity-60 cursor-pointer"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <div>
        <p className="font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      </div>
    </button>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SignInPage() {
  const [screen, setScreen] = useState<Screen>("home");
  const [pending, setPending] = useState<PendingAuth | null>(null);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Auto-redirect if already signed in
  useEffect(() => {
    const { getMockUser } = require("@/lib/mock-auth");
    const user = getMockUser();
    if (user) redirectAfterSignIn(user.role);
  }, []);

  function resetError() {
    setError("");
  }

  // ── Provider handlers ──────────────────────────────────────────────────────

  function handleProvider(provider: "google" | "apple") {
    setLoading(true);
    resetError();
    // Simulate brief loading
    setTimeout(() => {
      setLoading(false);
      setPending({ provider });
      setScreen("role-selection");
    }, 800);
  }

  function handlePhoneSend() {
    if (!phone.trim()) { setError("Please enter a phone number."); return; }
    setLoading(true);
    resetError();
    setTimeout(() => {
      setLoading(false);
      setPending({ provider: "phone", phone });
      setScreen("phone-otp");
    }, 600);
  }

  function handleOtpVerify() {
    if (!otp.trim()) { setError("Please enter the 6-digit code."); return; }
    const result = mockPhoneOtpSignIn(phone, otp, undefined);
    if (result.error === "role_selection_required") {
      setPending({ provider: "phone", phone });
      setScreen("role-selection");
      return;
    }
    if (result.error) { setError(result.error); return; }
    if (result.user) redirectAfterSignIn(result.user.role);
  }

  function handleEmailSend() {
    if (!email.trim()) { setError("Please enter your email address."); return; }
    setLoading(true);
    resetError();
    setTimeout(() => {
      setLoading(false);
      setPending({ provider: "email", email });
      setScreen("email-sent");
    }, 600);
  }

  function handleEmailContinue() {
    const result = mockEmailMagicLinkSignIn(email, "homeowner");
    if (result.user) {
      setPending({ provider: "email", email });
      setScreen("role-selection");
    }
  }

  function handleRoleSelect(role: MockRole) {
    if (!pending) return;
    setLoading(true);
    let result;
    if (pending.provider === "google") result = mockGoogleSignIn(role);
    else if (pending.provider === "apple") result = mockAppleSignIn(role);
    else if (pending.provider === "phone") result = mockPhoneOtpSignIn(pending.phone!, otp, role);
    else result = mockEmailMagicLinkSignIn(pending.email!, role);

    if (result?.user) {
      redirectAfterSignIn(result.user.role);
    } else {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  function handleDemoSignIn(demoEmail: string) {
    setLoading(true);
    const result = mockSignIn(demoEmail, "demo");
    if (result.user) {
      redirectAfterSignIn(result.user.role);
    } else {
      setError(result.error ?? "Demo sign-in failed.");
      setLoading(false);
    }
  }

  // ── Layout wrapper ─────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top bar — logo is absolutely centered so the back link never pushes it off */}
      <div className="relative flex items-center border-b border-border px-4 py-3">
        <Link href="/" className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <Link
          href="/"
          className="absolute left-1/2 -translate-x-1/2 flex items-center focus-visible:outline-none"
          style={{ pointerEvents: "auto" }}
        >
          <HomeBidsLogo height="clamp(26px, 5vw, 40px)" linked={false} />
        </Link>
      </div>

      {/* Content */}
      <div className="flex flex-1 items-start justify-center px-4 pt-8 pb-16">
        <div className="w-full max-w-sm">

          {/* ── Home screen ── */}
          {screen === "home" && (
            <div className="space-y-5">
              <div className="text-center">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome back to HomeBids</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Sign in to view your project, bids, messages, and contractor activity.
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full h-11 gap-3 font-medium cursor-pointer"
                  disabled={loading}
                  onClick={() => handleProvider("google")}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  )}
                  Continue with Google
                </Button>

                <Button
                  variant="outline"
                  className="w-full h-11 gap-3 font-medium cursor-pointer"
                  disabled={loading}
                  onClick={() => handleProvider("apple")}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-foreground" aria-hidden="true">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                    </svg>
                  )}
                  Continue with Apple
                </Button>

                <Button
                  variant="outline"
                  className="w-full h-11 gap-3 font-medium cursor-pointer"
                  disabled={loading}
                  onClick={() => { resetError(); setScreen("phone-entry"); }}
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  Continue with phone number
                </Button>

                <Button
                  variant="outline"
                  className="w-full h-11 gap-3 font-medium cursor-pointer"
                  disabled={loading}
                  onClick={() => { resetError(); setScreen("email-entry"); }}
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="2" y="4" width="20" height="16" rx="2"/>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                  Email me a sign-in link
                </Button>
              </div>

              {/* Demo accounts */}
              <div className="rounded-xl border border-dashed border-border bg-muted/40 p-4">
                <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Or jump into a demo
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleDemoSignIn("homeowner@homebids.demo")}
                    className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50 cursor-pointer"
                  >
                    <Home className="h-4 w-4 text-muted-foreground" />
                    Homeowner demo
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleDemoSignIn("contractor@homebids.demo")}
                    className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50 cursor-pointer"
                  >
                    <Hammer className="h-4 w-4 text-muted-foreground" />
                    Contractor demo
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleDemoSignIn("admin@homebids.demo")}
                    className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50 cursor-pointer"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2 text-muted-foreground" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M12 2a5 5 0 1 0 0 10A5 5 0 0 0 12 2zm0 12c-6 0-9 2.7-9 4v2h18v-2c0-1.3-3-4-9-4z"/>
                    </svg>
                    Admin demo
                  </button>
                </div>
              </div>

              <p className="text-center text-xs text-muted-foreground/60">
                Demo mode: authentication is mocked for flow testing.
              </p>
            </div>
          )}

          {/* ── Phone entry ── */}
          {screen === "phone-entry" && (
            <div className="space-y-5">
              <div className="text-center">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Enter your number</h1>
                <p className="mt-2 text-sm text-muted-foreground">We&apos;ll send a one-time code to verify your number.</p>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <Input
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-11"
                autoFocus
              />
              <Button className="w-full h-11 cursor-pointer" disabled={loading || !phone.trim()} onClick={handlePhoneSend}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send code
              </Button>
              <button type="button" onClick={() => { setScreen("home"); resetError(); }} className="flex w-full items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground cursor-pointer">
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>
            </div>
          )}

          {/* ── Phone OTP ── */}
          {screen === "phone-otp" && (
            <div className="space-y-5">
              <div className="text-center">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Enter the code</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Sent to {phone}.{" "}
                  <span className="font-medium text-foreground">Demo code: {MOCK_OTP_CODE}</span>
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="123456"
                value={otp}
                onChange={(e) => { setOtp(e.target.value); resetError(); }}
                className="h-11 text-center text-lg tracking-widest font-mono"
                autoFocus
              />
              <Button className="w-full h-11 cursor-pointer" disabled={loading || otp.length < 6} onClick={handleOtpVerify}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify
              </Button>
              <button type="button" onClick={() => { setScreen("phone-entry"); resetError(); setOtp(""); }} className="flex w-full items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground cursor-pointer">
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>
            </div>
          )}

          {/* ── Email entry ── */}
          {screen === "email-entry" && (
            <div className="space-y-5">
              <div className="text-center">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Enter your email</h1>
                <p className="mt-2 text-sm text-muted-foreground">We&apos;ll send a magic sign-in link.</p>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
                autoFocus
              />
              <Button className="w-full h-11 cursor-pointer" disabled={loading || !email.trim()} onClick={handleEmailSend}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send magic link
              </Button>
              <button type="button" onClick={() => { setScreen("home"); resetError(); }} className="flex w-full items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground cursor-pointer">
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>
            </div>
          )}

          {/* ── Email sent ── */}
          {screen === "email-sent" && (
            <div className="space-y-5 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <svg viewBox="0 0 24 24" className="h-8 w-8 fill-none stroke-primary stroke-2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Magic link sent.</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Demo mode: click below to continue.
                </p>
              </div>
              <Button className="w-full h-11 cursor-pointer" onClick={handleEmailContinue}>
                Continue in demo mode
              </Button>
              <button type="button" onClick={() => { setScreen("home"); resetError(); }} className="flex w-full items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground cursor-pointer">
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>
            </div>
          )}

          {/* ── Role selection ── */}
          {screen === "role-selection" && (
            <div className="space-y-5">
              <div className="text-center">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">How are you using HomeBids?</h1>
                <p className="mt-2 text-sm text-muted-foreground">Choose your role to continue.</p>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-3">
                <RoleCard
                  role="homeowner"
                  title="Homeowner"
                  description="Post projects, compare bids, and message contractors."
                  icon={<Home className="h-5 w-5" />}
                  onSelect={handleRoleSelect}
                  loading={loading}
                />
                <RoleCard
                  role="contractor"
                  title="Contractor"
                  description="Find local jobs, submit bids, and grow your business."
                  icon={<Hammer className="h-5 w-5" />}
                  onSelect={handleRoleSelect}
                  loading={loading}
                />
              </div>

              <button type="button" onClick={() => { setScreen("home"); resetError(); }} className="flex w-full items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground cursor-pointer">
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

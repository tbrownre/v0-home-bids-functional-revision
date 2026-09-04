"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Loader2, ArrowLeft, MailCheck } from "lucide-react";
import { HomeBidsLogo } from "@/components/homebids-logo";
import { createClient } from "@/lib/supabase/client";

type Tab = "contractor" | "homeowner";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ForgotPasswordInner() {
  const searchParams = useSearchParams();
  const initialTab: Tab = searchParams?.get("type") === "homeowner" ? "homeowner" : "contractor";

  const [tab, setTab] = useState<Tab>(initialTab);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  function switchTab(next: Tab) {
    setTab(next);
    setError("");
  }

  async function handleContractorSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Please enter your email address.");
      return;
    }
    if (!EMAIL_REGEX.test(trimmed)) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      // Never reveal whether the email is registered — only log transport errors.
      if (resetErr) {
        console.error("[v0] resetPasswordForEmail error:", resetErr.message);
      }
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleHomeownerSubmit(e: React.FormEvent) {
    e.preventDefault();
    const digits = phone.replace(/\D/g, "").slice(-10);
    if (digits.length !== 10) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      // Neutral by design — always resolves to the same success state.
      await fetch("/api/homeowner-reset", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top bar */}
      <div className="relative flex items-center border-b border-border px-4 py-3">
        <Link
          href="/auth/sign-in"
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Login
        </Link>
        <Link
          href="/"
          className="absolute left-1/2 -translate-x-1/2 flex items-center focus-visible:outline-none"
        >
          <HomeBidsLogo size="clamp(22px, 3vw, 28px)" linked={false} />
        </Link>
      </div>

      <div className="flex flex-1 items-start justify-center px-4 pt-8 pb-16">
        <div className="w-full max-w-sm space-y-5">
          {sent ? (
            <div className="space-y-5 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <MailCheck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  {tab === "contractor" ? "Check your email" : "Check your texts"}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  {tab === "contractor"
                    ? "If that email has an account, a reset link is on its way."
                    : "If that number has an account, a reset link is on its way by text."}
                </p>
              </div>
              <Button asChild className="w-full h-11">
                <Link href="/auth/sign-in">Back to Login</Link>
              </Button>
            </div>
          ) : (
            <>
              {/* Tab toggle — matches the sign-in modal pill style */}
              <div
                role="radiogroup"
                aria-label="Select account type"
                className="flex items-center gap-1 rounded-full border border-border bg-muted/60 p-1"
              >
                <button
                  type="button"
                  role="radio"
                  aria-checked={tab === "contractor"}
                  onClick={() => switchTab("contractor")}
                  className={`flex-1 rounded-full px-3 py-2 text-center text-sm font-medium transition-all duration-200 ease-out ${
                    tab === "contractor"
                      ? "border border-[#0A84FF] bg-[#0A84FF] text-white shadow-sm"
                      : "border border-transparent bg-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Contractor
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={tab === "homeowner"}
                  onClick={() => switchTab("homeowner")}
                  className={`flex-1 rounded-full px-3 py-2 text-center text-sm font-medium transition-all duration-200 ease-out ${
                    tab === "homeowner"
                      ? "border border-[#0A84FF] bg-[#0A84FF] text-white shadow-sm"
                      : "border border-transparent bg-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Homeowner
                </button>
              </div>

              <div className="text-center">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Reset your password</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  {tab === "contractor"
                    ? "Enter the email connected to your HomeBids account and we'll send you a reset link."
                    : "Enter the phone number connected to your HomeBids account and we'll text you a reset link."}
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              {tab === "contractor" ? (
                <form onSubmit={handleContractorSubmit} className="space-y-3">
                  <div className="space-y-1.5">
                    <label htmlFor="reset-email" className="text-sm font-medium text-foreground">
                      Email
                    </label>
                    <Input
                      id="reset-email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-11"
                      disabled={loading}
                    />
                  </div>
                  <Button type="submit" className="w-full h-11 cursor-pointer" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Send Reset Link
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleHomeownerSubmit} className="space-y-3">
                  <div className="space-y-1.5">
                    <label htmlFor="reset-phone" className="text-sm font-medium text-foreground">
                      Phone Number
                    </label>
                    <Input
                      id="reset-phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="(555) 123-4567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-11"
                      disabled={loading}
                    />
                  </div>
                  <Button type="submit" className="w-full h-11 cursor-pointer" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Text Me a Reset Link
                  </Button>
                </form>
              )}

              <p className="text-center text-sm text-muted-foreground">
                <Link href="/auth/sign-in" className="font-medium text-primary hover:underline">
                  Back to Login
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ForgotPasswordInner />
    </Suspense>
  );
}

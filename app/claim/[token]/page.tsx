"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Loader2, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { HomeBidsLogo } from "@/components/homebids-logo";
import { claimAccount, getClaimInfo } from "@/lib/supabase/actions";

interface ClaimPageProps {
  params: Promise<{
    token: string;
  }>;
}

type PageState = "loading" | "invalid" | "already_claimed" | "form";
type FormState = "idle" | "submitting";

export default function ClaimPage({ params: paramsPromise }: ClaimPageProps) {
  const router = useRouter();
  const { token } = React.use(paramsPromise);
  const [state, setState] = useState<PageState>("loading");
  const [formState, setFormState] = useState<FormState>("idle");
  const [firstName, setFirstName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");

  // Validate and load profile data on mount (server-side via getClaimInfo)
  React.useEffect(() => {
    async function loadProfile() {
      const claimInfo = await getClaimInfo(token);

      if (!claimInfo) {
        setState("invalid");
        return;
      }

      if (claimInfo.alreadyClaimed) {
        setState("already_claimed");
        return;
      }

      setFirstName(claimInfo.firstName || "");
      setPhone(claimInfo.phoneMasked || "");
      setState("form");
    }

    loadProfile();
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!password || !confirmPassword) {
      setError("Please enter and confirm your password.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setFormState("submitting");
    setError("");

    try {
      const result = await claimAccount(token, password);
      if (result.error) {
        setError(result.error);
        setFormState("idle");
      }
      // On success, redirect happens server-side
    } catch (e) {
      setError((e as Error).message || "Something went wrong.");
      setFormState("idle");
    }
  }

  function maskPhone(phone: string): string {
    if (!phone || phone.length < 4) return phone;
    const last4 = phone.slice(-4);
    return `(•••) •••-${last4}`;
  }

  if (state === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top bar */}
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
          {state === "invalid" && (
            <div className="text-center space-y-3">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Link Invalid or Expired
              </h1>
              <p className="text-sm text-muted-foreground">
                This claim link has expired or is no longer valid.
              </p>
              <Button asChild className="w-full h-11 cursor-pointer">
                <Link href="/">Go Home</Link>
              </Button>
            </div>
          )}

          {state === "already_claimed" && (
            <div className="text-center space-y-3">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Account Already Claimed
              </h1>
              <p className="text-sm text-muted-foreground">
                This account has already been activated. Please sign in below.
              </p>
              <Button asChild className="w-full h-11 cursor-pointer">
                <Link href="/auth/sign-in">Sign In</Link>
              </Button>
            </div>
          )}

          {state === "form" && (
            <>
              <div className="text-center">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Welcome{firstName ? ` back, ${firstName}` : ""}!
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Set a password to see your project and bids.
                </p>
              </div>

              {/* Phone display */}
              <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
                <p className="text-xs text-muted-foreground">Phone on file</p>
                <p className="text-sm font-medium text-foreground">{maskPhone(phone)}</p>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="space-y-1.5">
                  <label htmlFor="password" className="text-sm font-medium text-foreground">
                    New Password (min 8 characters)
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Enter a password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 pr-10"
                      disabled={formState === "submitting"}
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

                <div className="space-y-1.5">
                  <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-11 pr-10"
                      disabled={formState === "submitting"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                      aria-label={showConfirm ? "Hide password" : "Show password"}
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full h-11 cursor-pointer" disabled={formState === "submitting"}>
                  {formState === "submitting" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Activate Account
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground">
                Already have a password?{" "}
                <Link href="/auth/sign-in" className="font-medium text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

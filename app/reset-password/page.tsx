"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Loader2, ArrowLeft, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { HomeBidsLogo } from "@/components/homebids-logo";
import { createClient } from "@/lib/supabase/client";

type Status = "checking" | "ready" | "invalid" | "done";

const MIN_PASSWORD_LENGTH = 8;

export default function ResetPasswordPage() {
  const [status, setStatus] = useState<Status>("checking");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Establish the password-recovery session from the email link. The browser
  // client (PKCE + detectSessionInUrl) auto-exchanges the `?code=` param on
  // load and fires PASSWORD_RECOVERY, so we listen for that and also fall back
  // to getSession() in case the event already fired before we subscribed.
  useEffect(() => {
    const supabase = createClient();
    let settled = false;

    const url = new URL(window.location.href);
    const errorParam = url.searchParams.get("error_description") || url.searchParams.get("error");

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        settled = true;
        setStatus("ready");
      }
    });

    async function verify() {
      if (errorParam) {
        setStatus("invalid");
        return;
      }
      // Give detectSessionInUrl a moment to process the recovery link.
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        settled = true;
        setStatus("ready");
        return;
      }
      setTimeout(async () => {
        if (settled) return;
        const { data: retry } = await supabase.auth.getSession();
        setStatus(retry.session ? "ready" : "invalid");
      }, 2000);
    }

    verify();
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!password) {
      setError("New password is required.");
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (!confirmPassword) {
      setError("Please confirm your new password.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError("Something went wrong. Please try again.");
        setLoading(false);
        return;
      }
      // Sign out so the temporary recovery session can't linger, then send the
      // user to a clean login.
      await supabase.auth.signOut();
      setStatus("done");
    } catch {
      setError("Something went wrong. Please try again.");
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

      <div className="flex flex-1 items-start justify-center px-4 pt-10 pb-16">
        <div className="w-full max-w-sm space-y-5">
          {status === "checking" && (
            <div className="flex flex-col items-center gap-3 pt-8 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Verifying your reset link…</p>
            </div>
          )}

          {status === "invalid" && (
            <div className="space-y-5 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Reset link expired</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  This reset link is invalid or expired. Please request a new one.
                </p>
              </div>
              <Button asChild className="w-full h-11">
                <Link href="/auth/sign-in?forgot=1">Request New Link</Link>
              </Button>
            </div>
          )}

          {status === "done" && (
            <div className="space-y-5 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Password updated</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your password has been updated. You can now log in.
                </p>
              </div>
              <Button asChild className="w-full h-11">
                <Link href="/auth/sign-in">Log In</Link>
              </Button>
            </div>
          )}

          {status === "ready" && (
            <>
              <div className="text-center">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Create a new password</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Enter a new password for your HomeBids account.
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleUpdatePassword} className="space-y-3">
                <div className="space-y-1.5">
                  <label htmlFor="new-password" className="text-sm font-medium text-foreground">
                    New password
                  </label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Min. 8 characters"
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
                <div className="space-y-1.5">
                  <label htmlFor="confirm-password" className="text-sm font-medium text-foreground">
                    Confirm new password
                  </label>
                  <Input
                    id="confirm-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Re-enter your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-11"
                    disabled={loading}
                  />
                </div>
                <Button type="submit" className="w-full h-11 cursor-pointer" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Password
                </Button>
              </form>

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

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Loader2, ArrowLeft, Home, Hammer, Eye, EyeOff } from "lucide-react";
import { HomeBidsLogo } from "@/components/homebids-logo";
import {
  realSignIn,
  realDemoSignIn,
  getMockUser,
  redirectAfterSignIn,
} from "@/lib/mock-auth";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already signed in (avoids showing the form to a logged-in user).
  useEffect(() => {
    const user = getMockUser();
    if (user) {
      redirectAfterSignIn(user.role);
      return;
    }
    setCheckingSession(false);
  }, []);

  async function handlePasswordSignIn(e: React.FormEvent) {
    e.preventDefault();
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

  async function handleDemoSignIn(role: "homeowner" | "contractor") {
    setLoading(true);
    setError("");
    const result = await realDemoSignIn(role);
    if (result.user) {
      redirectAfterSignIn(result.user.role);
    } else {
      setError(result.error ?? "Demo sign-in failed.");
      setLoading(false);
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

          <form onSubmit={handlePasswordSignIn} className="space-y-3">
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
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </label>
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

          {/* Demo accounts — real seeded Supabase sessions */}
          <div className="rounded-xl border border-dashed border-border bg-muted/40 p-4">
            <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Or explore a demo account
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleDemoSignIn("homeowner")}
                className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50 cursor-pointer"
              >
                <Home className="h-4 w-4 text-muted-foreground" />
                Homeowner demo
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleDemoSignIn("contractor")}
                className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50 cursor-pointer"
              >
                <Hammer className="h-4 w-4 text-muted-foreground" />
                Contractor demo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

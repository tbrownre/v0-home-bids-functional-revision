"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Home, Hammer, AlertCircle, Loader2, MailCheck, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import {
  realSignIn,
  redirectAfterSignIn,
  type MockRole,
} from "@/lib/mock-auth";
import { phoneSignIn } from "@/lib/supabase/actions";

interface SignInModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignIn?: (type: "homeowner" | "contractor") => void;
}

type ModalView = "signin" | "forgot" | "forgot-sent";
type UserType = "contractor" | "homeowner";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SIGNIN_ROLE_KEY = "homebids_signin_role";

// Read the last selected role from this device. Defaults to "homeowner" for
// first-time visitors with no saved preference.
function getSavedRole(): UserType {
  if (typeof window !== "undefined") {
    const saved = window.localStorage.getItem(SIGNIN_ROLE_KEY);
    if (saved === "contractor" || saved === "homeowner") return saved;
  }
  return "homeowner";
}

export function SignInModal({ open, onOpenChange, onSignIn }: SignInModalProps) {
  const router = useRouter();
  const [view, setView] = useState<ModalView>("signin");
  const [userType, setUserType] = useState<UserType>(() => getSavedRole());
  const [usePhoneForHomeowner, setUsePhoneForHomeowner] = useState(() => getSavedRole() === "homeowner");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Forgot-password sub-form state
  const [resetEmail, setResetEmail] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  function handleClose() {
    onOpenChange(false);
    setTimeout(() => {
      setView("signin");
      const savedRole = getSavedRole();
      setUserType(savedRole);
      setUsePhoneForHomeowner(savedRole === "homeowner");
      setEmail("");
      setPhone("");
      setPassword("");
      setError("");
      setLoading(false);
      setShowPassword(false);
      setResetEmail("");
      setResetError("");
      setResetLoading(false);
    }, 200);
  }

  function openForgot() {
    setResetEmail(email.trim());
    setResetError("");
    setView("forgot");
  }

  function backToSignIn() {
    setResetError("");
    setError("");
    setView("signin");
  }

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
      // is registered. Only log genuine transport failures.
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

  function finishSignIn(role: MockRole) {
    onSignIn?.(role === "contractor" ? "contractor" : "homeowner");
    handleClose();
    redirectAfterSignIn(role);
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
        // Close modal and redirect client-side on success
        handleClose();
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
        finishSignIn(result.user.role);
      } else {
        setError(result.error ?? "Unable to sign in.");
        setLoading(false);
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) handleClose(); }}>
      <DialogContent className="sm:max-w-sm gap-0 p-6">
        <div className="space-y-5">
          {view === "signin" && (
          <>
          {/* User Type Toggle */}
          <div
            role="radiogroup"
            aria-label="Select account type"
            className="flex items-center gap-1 rounded-full border border-border bg-muted/60 p-1"
          >
            <button
              type="button"
              role="radio"
              aria-checked={userType === "contractor"}
              onClick={() => {
                setUserType("contractor");
                setUsePhoneForHomeowner(false);
                if (typeof window !== "undefined") {
                  window.localStorage.setItem(SIGNIN_ROLE_KEY, "contractor");
                }
              }}
              className={`flex-1 rounded-full px-3 py-2 text-center text-sm font-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF] focus-visible:ring-offset-2 ${
                userType === "contractor"
                  ? "border border-[#0A84FF] bg-[#0A84FF] text-white shadow-sm"
                  : "border border-transparent bg-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Contractor
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={userType === "homeowner"}
              onClick={() => {
                setUserType("homeowner");
                setUsePhoneForHomeowner(true);
                if (typeof window !== "undefined") {
                  window.localStorage.setItem(SIGNIN_ROLE_KEY, "homeowner");
                }
              }}
              className={`flex-1 rounded-full px-3 py-2 text-center text-sm font-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF] focus-visible:ring-offset-2 ${
                userType === "homeowner"
                  ? "border border-[#0A84FF] bg-[#0A84FF] text-white shadow-sm"
                  : "border border-transparent bg-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Homeowner
            </button>
          </div>

          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Welcome to HomeBids</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {userType === "contractor"
                ? "Sign in to view your project, bids, and messages."
                : "Sign in to view your project and bids."}
            </DialogDescription>
          </DialogHeader>

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
                    <label htmlFor="modal-phone" className="text-sm font-medium text-foreground">
                      Phone Number
                    </label>
                    <Input
                      id="modal-phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="(555) 123-4567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-11"
                      disabled={loading}
                      autoFocus
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label htmlFor="modal-email" className="text-sm font-medium text-foreground">
                      Email
                    </label>
                    <Input
                      id="modal-email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-11"
                      disabled={loading}
                      autoFocus
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
                <label htmlFor="modal-email" className="text-sm font-medium text-foreground">
                  Email
                </label>
                <Input
                  id="modal-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11"
                  disabled={loading}
                  autoFocus
                />
              </div>
            )}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="modal-password" className="text-sm font-medium text-foreground">
                  Password
                </label>
                {userType === "contractor" && (
                  <button
                    type="button"
                    onClick={openForgot}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Input
                  id="modal-password"
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
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full h-10 cursor-pointer" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            New contractor?{" "}
            <Link
              href="/contractors/signup"
              onClick={handleClose}
              className="font-medium text-primary hover:underline"
            >
              Create an account
            </Link>
          </p>
          </>
          )}

          {view === "forgot" && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">Reset your password</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  Enter the email connected to your HomeBids account and we&apos;ll send you a reset link.
                </DialogDescription>
              </DialogHeader>

              {resetError && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {resetError}
                </div>
              )}

              <form onSubmit={handleForgotSubmit} className="space-y-3">
                <div className="space-y-1.5">
                  <label htmlFor="modal-reset-email" className="text-sm font-medium text-foreground">
                    Email
                  </label>
                  <Input
                    id="modal-reset-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="h-11"
                    disabled={resetLoading}
                    autoFocus
                  />
                </div>
                <Button type="submit" className="w-full h-10 cursor-pointer" disabled={resetLoading}>
                  {resetLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Reset Link
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground">
                <button type="button" onClick={backToSignIn} className="font-medium text-primary hover:underline">
                  Back to Sign In
                </button>
              </p>
            </>
          )}

          {view === "forgot-sent" && (
            <div className="space-y-5 text-center">
              <DialogHeader className="sr-only">
                <DialogTitle>Check your email</DialogTitle>
                <DialogDescription>Password reset link sent.</DialogDescription>
              </DialogHeader>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <MailCheck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Check your email</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  If an account exists for that email, we&apos;ll send a password reset link.
                </p>
              </div>
              <Button onClick={backToSignIn} className="w-full h-10 cursor-pointer">
                Back to Sign In
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

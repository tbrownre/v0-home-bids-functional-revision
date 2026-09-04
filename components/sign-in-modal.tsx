"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Loader2, Eye, EyeOff, Info } from "lucide-react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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

type UserType = "contractor" | "homeowner";

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
  const [userType, setUserType] = useState<UserType>(() => getSavedRole());
  const [usePhoneForHomeowner, setUsePhoneForHomeowner] = useState(() => getSavedRole() === "homeowner");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function handleClose() {
    onOpenChange(false);
    setTimeout(() => {
      const savedRole = getSavedRole();
      setUserType(savedRole);
      setUsePhoneForHomeowner(savedRole === "homeowner");
      setEmail("");
      setPhone("");
      setPassword("");
      setError("");
      setLoading(false);
      setShowPassword(false);
    }, 200);
  }

  // Forgot Password now lives on its own page with Contractor / Homeowner tabs.
  // Close the modal and route there, pre-selecting the current tab.
  function openForgot() {
    handleClose();
    router.push(`/auth/forgot-password?type=${userType}`);
  }

  function finishSignIn(role: MockRole) {
    onSignIn?.(role === "contractor" ? "contractor" : "homeowner");
    handleClose();
    redirectAfterSignIn(role);
  }

  async function handlePasswordSignIn(e: React.FormEvent) {
    e.preventDefault();

    if (userType === "homeowner" && usePhoneForHomeowner) {
      // Homeowner phone sign-in maps {last-10-digits} → {1XXXXXXXXXX}@sms.homebids.ai
      // under the hood (resolved server-side in phoneSignIn).
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
                setError("");
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
                setError("");
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

          {userType === "homeowner" && (
            <div className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-left">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p className="text-xs leading-relaxed text-muted-foreground">
                Homeowners: no password needed — your private project link (texted to you) is your
                login. Want dashboard access? Use &quot;Forgot Password&quot; to get a reset link by text.
              </p>
            </div>
          )}

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

          {userType === "homeowner" ? (
            <p className="text-center text-sm text-muted-foreground">
              New to HomeBids?{" "}
              <a
                href="https://www.homebids.ai/homeowners"
                target="_top"
                className="font-medium text-primary hover:underline"
              >
                Click here.
              </a>
            </p>
          ) : (
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
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

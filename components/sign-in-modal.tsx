"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Home, LogIn, Briefcase, AlertCircle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { signIn } from "@/lib/supabase/actions";

interface SignInModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignIn?: (type: "homeowner" | "contractor") => void;
}

export function SignInModal({ open, onOpenChange, onSignIn }: SignInModalProps) {
  const [signInType, setSignInType] = useState<"homeowner" | "contractor">("homeowner");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setEmail("");
      setPassword("");
      setError("");
      setLoading(false);
    }, 200);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn(email, password);

    if (result.error) {
      // Unconfirmed email — redirect to verify-email page with resend CTA
      if (
        result.error.toLowerCase().includes("email not confirmed") ||
        result.error.toLowerCase().includes("not confirmed")
      ) {
        handleClose();
        window.location.href = `/auth/verify-email?status=pending&email=${encodeURIComponent(email)}`;
        return;
      }
      setError(result.error);
      setLoading(false);
      return;
    }

    const userType = result.userType as "homeowner" | "contractor";
    onSignIn?.(userType);
    handleClose();

    // Hard navigation so middleware flushes the new session cookie before
    // the destination page attempts auth state reads.
    if (userType === "contractor") {
      window.location.replace("/contractors/dashboard");
    } else {
      window.location.replace("/?showJobs=true");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) handleClose(); }}>
      <DialogContent className="sm:max-w-md p-0 gap-0">
        <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-6 pt-8 pb-6 rounded-t-lg">
          <DialogHeader className="relative">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
              <Home className="h-7 w-7 text-primary" />
            </div>
            <DialogTitle className="text-center text-2xl font-semibold">Welcome back</DialogTitle>
            <DialogDescription className="text-center text-muted-foreground">
              {signInType === "homeowner" ? "Sign in to manage your projects" : "Sign in to your contractor dashboard"}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 pb-6">
          {/* Account type toggle */}
          <div className="mb-5">
            <div className="flex rounded-xl bg-muted p-1">
              <button
                type="button"
                onClick={() => { setSignInType("homeowner"); setError(""); }}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${signInType === "homeowner" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Home className="h-4 w-4" />
                Property Owner
              </button>
              <button
                type="button"
                onClick={() => { setSignInType("contractor"); setError(""); }}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${signInType === "contractor" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Briefcase className="h-4 w-4" />
                Contractor
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="modal-email">Email</Label>
              <Input
                id="modal-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="modal-password">Password</Label>
              <Input
                id="modal-password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11"
                required
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full h-11 gap-2 text-base" disabled={loading || !email || !password}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              Sign In
            </Button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">New to HomeBids?</span>
            </div>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            {signInType === "homeowner" ? (
              <p>
                {"Don't have an account? "}
                <Link href="/auth/sign-up/homeowner" onClick={handleClose} className="font-medium text-primary hover:underline">
                  Create one free
                </Link>
              </p>
            ) : (
              <p>
                {"Want to join as a contractor? "}
                <Link href="/subscribe?type=contractor" onClick={handleClose} className="font-medium text-primary hover:underline">
                  Click here
                </Link>
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

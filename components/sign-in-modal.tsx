"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Home, Hammer, AlertCircle, Loader2 } from "lucide-react";
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
  realDemoSignIn,
  redirectAfterSignIn,
  type MockRole,
} from "@/lib/mock-auth";

interface SignInModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignIn?: (type: "homeowner" | "contractor") => void;
}

export function SignInModal({ open, onOpenChange, onSignIn }: SignInModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleClose() {
    onOpenChange(false);
    setTimeout(() => {
      setEmail("");
      setPassword("");
      setError("");
      setLoading(false);
    }, 200);
  }

  function finishSignIn(role: MockRole) {
    onSignIn?.(role === "contractor" ? "contractor" : "homeowner");
    handleClose();
    redirectAfterSignIn(role);
  }

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
      finishSignIn(result.user.role);
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
      finishSignIn(result.user.role);
    } else {
      setError(result.error ?? "Demo sign-in failed.");
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) handleClose(); }}>
      <DialogContent className="sm:max-w-sm gap-0 p-6">
        <div className="space-y-5">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Welcome back to HomeBids</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Sign in to view your project, bids, and messages.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handlePasswordSignIn} className="space-y-3">
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
            <div className="space-y-1.5">
              <label htmlFor="modal-password" className="text-sm font-medium text-foreground">
                Password
              </label>
              <Input
                id="modal-password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11"
                disabled={loading}
              />
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

          {/* Demo accounts — real seeded Supabase sessions */}
          <div className="rounded-lg border border-dashed border-border bg-muted/40 p-3">
            <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Or explore a demo account
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleDemoSignIn("homeowner")}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border bg-background px-2 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50 cursor-pointer"
              >
                <Home className="h-3.5 w-3.5" /> Homeowner
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleDemoSignIn("contractor")}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border bg-background px-2 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50 cursor-pointer"
              >
                <Hammer className="h-3.5 w-3.5" /> Contractor
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

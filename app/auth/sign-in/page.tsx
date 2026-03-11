"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Loader2 } from "lucide-react";
import { signIn } from "@/lib/supabase/actions";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn(email, password);

    if (result.error) {
      // Unconfirmed email — send to verify-email with resend CTA
      if (
        result.error.toLowerCase().includes("email not confirmed") ||
        result.error.toLowerCase().includes("not confirmed")
      ) {
        window.location.href = `/auth/verify-email?status=pending&email=${encodeURIComponent(email)}`;
        return;
      }
      setError(result.error);
      setLoading(false);
      return;
    }

    // Hard navigation so the middleware runs and the session cookie is available
    // before the destination page attempts to read auth state.
    if (result.userType === "contractor") {
      window.location.replace("/contractors/dashboard");
    } else {
      window.location.replace("/?showJobs=true");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="mb-2 inline-block text-lg font-bold text-primary">
            HomeBids.io
          </Link>
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </form>
          <div className="mt-6 space-y-2 text-center text-sm text-muted-foreground">
            <p>
              New homeowner?{" "}
              <Link href="/auth/sign-up/homeowner" className="font-medium text-primary hover:underline">
                Create an account
              </Link>
            </p>
            <p>
              Contractor?{" "}
              <Link href="/subscribe?type=contractor" className="font-medium text-primary hover:underline">
                Join as a contractor
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

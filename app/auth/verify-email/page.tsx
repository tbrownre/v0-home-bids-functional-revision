"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Mail, RefreshCw, Loader2 } from "lucide-react";
import { resendConfirmation } from "@/lib/supabase/actions";

type UIState = "pending" | "resent" | "expired" | "invalid" | "error";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const initialStatus = (searchParams.get("status") as UIState | null) ?? "pending";
  const emailParam = searchParams.get("email") ?? "";

  const [uiState, setUiState] = useState<UIState>(initialStatus);
  const [email, setEmail] = useState(emailParam);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleResend(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setErrorMsg("");
    const result = await resendConfirmation(email.trim());
    setLoading(false);
    if (result.error) {
      setErrorMsg(result.error);
      setUiState("error");
    } else {
      setUiState("resent");
    }
  }

  const configs: Record<UIState, {
    icon: React.ReactNode;
    title: string;
    body: string;
    showResend: boolean;
  }> = {
    pending: {
      icon: <Mail className="mx-auto mb-4 h-12 w-12 text-primary" />,
      title: "Check your inbox",
      body: `We sent a confirmation link to ${email || "your email address"}. Click the link to activate your account. The link expires in 24 hours.`,
      showResend: true,
    },
    resent: {
      icon: <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-green-500" />,
      title: "New link sent",
      body: `A fresh confirmation link has been sent to ${email || "your email"}. Check your spam folder if you don't see it within a minute.`,
      showResend: true,
    },
    expired: {
      icon: <AlertCircle className="mx-auto mb-4 h-12 w-12 text-amber-500" />,
      title: "Link expired",
      body: "That confirmation link has expired or was already used. Enter your email below to receive a new one.",
      showResend: true,
    },
    invalid: {
      icon: <AlertCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />,
      title: "Invalid link",
      body: "This confirmation link is invalid or malformed. Please request a new one below.",
      showResend: true,
    },
    error: {
      icon: <AlertCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />,
      title: "Something went wrong",
      body: errorMsg || "We could not send a confirmation email. Please try again.",
      showResend: true,
    },
  };

  const config = configs[uiState];

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardContent className="px-6 py-10">
          <div className="text-center">
            {config.icon}
            <h1 className="text-xl font-bold text-foreground">{config.title}</h1>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              {config.body}
            </p>
          </div>

          {config.showResend && (
            <form onSubmit={handleResend} className="mt-6 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="resend-email">Email address</Label>
                <Input
                  id="resend-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="h-11"
                />
              </div>
              <Button
                type="submit"
                className="w-full h-11 gap-2"
                disabled={loading || !email.trim()}
                variant={uiState === "resent" ? "outline" : "default"}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                {uiState === "resent" ? "Resend again" : "Send confirmation email"}
              </Button>
            </form>
          )}

          <div className="mt-6 flex flex-col items-center gap-2 text-sm text-muted-foreground">
            <Link
              href="/auth/sign-in"
              className="font-medium text-primary hover:underline"
            >
              Back to sign in
            </Link>
            <span className="text-xs">
              Need help?{" "}
              <Link href="/contact" className="hover:text-foreground underline">
                Contact support
              </Link>
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

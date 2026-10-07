"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Loader2, ArrowLeft, Eye, EyeOff, MailCheck, Mail, KeyRound } from "lucide-react";
import { HomeBidsLogo } from "@/components/homebids-logo";
import { createClient } from "@/lib/supabase/client";
import {
  realSignIn,
  syncMirrorFromSupabase,
  redirectAfterSignIn,
  quietSignOut,
} from "@/lib/mock-auth";
import { phoneSignIn } from "@/lib/supabase/actions";
import {
  getLastLogin,
  rememberLogin,
  forgetLogin,
  fetchProviderFlags,
  rememberNextPath,
  firstNameOf,
  type LastLogin,
  type ProviderFlags,
} from "@/lib/auth-options";

/**
 * FASTSIGNIN (Tim, Oct 7 — Trello "Improve Returning User Sign-In — Faster, Easier Access"):
 *   - the device remembers who signed in → "Welcome back, Dillon", one field, Face ID / Touch ID autofill
 *     through the browser's own password manager (standard username + current-password fields)
 *   - passwordless: "Email me a sign-in link" (Supabase magic link) + the 6-digit code from the same email
 *   - Sign in with Google / Apple — buttons appear automatically once the provider is enabled in Supabase
 *   - password stays as the fallback; sessions already persist 400 days (stay signed in)
 *   - mobile-first: 16px inputs (no iOS zoom), 48px tap targets, one column
 */

type View = "signin" | "magic-sent" | "forgot" | "forgot-sent";
type UserType = "contractor" | "homeowner";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// DEEPLINK (Tim, Sep 28): a texted link like /contractors/profile must land on
// that page after sign-in. Only same-site contractor/admin paths are honored.
function safeRedirect(raw: string | null): string | null {
  if (!raw) return null;
  if (!/^\/(?!\/)[A-Za-z0-9\-._~/?&=%]*$/.test(raw)) return null;
  if (!raw.startsWith("/contractors/") && !raw.startsWith("/admin")) return null;
  return raw;
}

export default function SignInPage() {
  const router = useRouter();
  const [view, setView] = useState<View>("signin");
  const [userType, setUserType] = useState<UserType>("contractor");
  const [usePhoneForHomeowner, setUsePhoneForHomeowner] = useState(true);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);
  const [switchedOut, setSwitchedOut] = useState(false);

  // FASTSIGNIN state
  const [last, setLast] = useState<LastLogin | null>(null);
  const [useRemembered, setUseRemembered] = useState(false);
  const [providers, setProviders] = useState<ProviderFlags>({ google: false, apple: false });
  const [socialBusy, setSocialBusy] = useState<"google" | "apple" | null>(null);
  const [magicBusy, setMagicBusy] = useState(false);
  const [magicEmail, setMagicEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpBusy, setOtpBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const passwordRef = useRef<HTMLInputElement | null>(null);

  // Forgot-password sub-form state
  const [resetEmail, setResetEmail] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  // Redirect if already signed in (avoids showing the form to a logged-in user).
  useEffect(() => {
    let target: string | null = null;
    let wantsSwitch = false;
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      // Deep-link support: /auth/sign-in?forgot=1 opens the reset form directly
      // (used by the "Request New Link" CTA on an expired reset link).
      if (params.get("forgot") === "1") setView("forgot");
      // DEEPLINK: remember where a contractor link wanted to go; ?switch=1 means
      // that link opened in a browser signed in as someone else.
      target = safeRedirect(params.get("redirect")) ?? safeRedirect(params.get("next"));
      wantsSwitch = params.get("switch") === "1";
      if (target || wantsSwitch) {
        setUserType("contractor");
        setUsePhoneForHomeowner(false);
      }
      setRedirectTo(target);
      const n = params.get("notice");
      if (n === "no-account") setNotice("No HomeBids account uses that Google/Apple email yet. Sign in with your HomeBids email below, or create an account.");
      if (n === "link-expired") setNotice("That sign-in link has expired or was already used. Request a new one below.");
      if (n === "link-invalid") setNotice("That sign-in link didn't work. Request a new one below.");

      // Returning user on this device → one-field sign-in
      const remembered = getLastLogin();
      if (remembered) {
        setLast(remembered);
        setUseRemembered(true);
        setEmail(remembered.email);
        setUserType("contractor");
        setUsePhoneForHomeowner(false);
      }
      void fetchProviderFlags().then(setProviders);
    }

    let cancelled = false;
    (async () => {
      // Verify the REAL Supabase session — not the possibly-stale local mirror.
      // syncMirrorFromSupabase clears the mirror when the real session is gone,
      // so a ghost mirror can't bounce us into the server-guarded dashboard and
      // create a sign-in ⇄ dashboard redirect loop.
      const user = await syncMirrorFromSupabase();
      if (cancelled) return;
      if (user) {
        const isPro = user.role === "contractor" || user.role === "admin";
        if (!isPro && wantsSwitch) {
          // A homeowner session is in the way of a contractor link: end it
          // quietly and let them sign in with their contractor account.
          await quietSignOut();
          if (cancelled) return;
          setSwitchedOut(true);
          setCheckingSession(false);
          return;
        }
        if (isPro && target) {
          window.location.replace(target);
          return;
        }
        redirectAfterSignIn(user.role);
        return;
      }
      setCheckingSession(false);
    })();
    return () => { cancelled = true; };
  }, []);

  // Focus the password box when we already know who this is (one tap to Face ID autofill on iPhone).
  useEffect(() => {
    if (!checkingSession && useRemembered && view === "signin") {
      const t = window.setTimeout(() => passwordRef.current?.focus({ preventScroll: true }), 50);
      return () => window.clearTimeout(t);
    }
  }, [checkingSession, useRemembered, view]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = window.setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [resendIn]);

  const landingFor = (role: string) => {
    const isPro = role === "contractor" || role === "admin";
    if (isPro && redirectTo) return redirectTo;
    if (role === "admin") return "/admin/links";
    return isPro ? "/contractors/dashboard" : "/homeowners/dashboard";
  };

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
      // is registered. Only surface a message for genuine transport failures.
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

  function openForgot() {
    setResetEmail(email.trim());
    setResetError("");
    setView("forgot");
  }

  function backToLogin() {
    setResetError("");
    setError("");
    setOtp("");
    setView("signin");
  }

  function notYou() {
    forgetLogin();
    setLast(null);
    setUseRemembered(false);
    setEmail("");
    setPassword("");
    setError("");
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
        // Redirect client-side on success
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
        rememberLogin({ email: result.user.email || email, name: result.user.name, method: "password" });
        const isPro = result.user.role === "contractor" || result.user.role === "admin";
        if (isPro && redirectTo) {
          window.location.replace(redirectTo);
        } else {
          redirectAfterSignIn(result.user.role);
        }
      } else {
        setError(result.error ?? "Unable to sign in.");
        setLoading(false);
      }
    }
  }

  /** Passwordless: Supabase emails a one-time link (and a 6-digit code — same email). Existing accounts only. */
  async function sendMagicLink() {
    const target = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(target)) {
      setError("Enter your email first and we'll send you a sign-in link.");
      return;
    }
    setMagicBusy(true);
    setError("");
    try {
      rememberNextPath(redirectTo);
      const supabase = createClient();
      const { error: otpErr } = await supabase.auth.signInWithOtp({
        email: target,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: `${window.location.origin}/auth/callback?via=magic${redirectTo ? `&next=${encodeURIComponent(redirectTo)}` : ""}`,
        },
      });
      if (otpErr) {
        const msg = otpErr.message.toLowerCase();
        if (msg.includes("signups not allowed") || msg.includes("not found") || msg.includes("user not found")) {
          setError("We couldn't find a HomeBids account with that email. Check the spelling or create an account.");
        } else if (msg.includes("rate limit") || msg.includes("too many")) {
          setError("Too many sign-in emails just now. Please wait a minute and try again.");
        } else {
          setError(otpErr.message);
        }
        return;
      }
      setMagicEmail(target);
      setOtp("");
      setResendIn(60);
      setView("magic-sent");
    } catch {
      setError("Couldn't send the sign-in link. Please try again.");
    } finally {
      setMagicBusy(false);
    }
  }

  /** The 6-digit code from the same email — works even when the email opens on another device. */
  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    const token = otp.replace(/\D/g, "");
    if (token.length !== 6) {
      setError("Enter the 6-digit code from the email.");
      return;
    }
    setOtpBusy(true);
    setError("");
    try {
      const supabase = createClient();
      const { data, error: vErr } = await supabase.auth.verifyOtp({ email: magicEmail, token, type: "email" });
      if (vErr || !data.user) {
        setError("That code didn't work. Check the newest email or request a new one.");
        return;
      }
      const user = await syncMirrorFromSupabase();
      rememberLogin({ email: user?.email || magicEmail, name: user?.name, method: "magic" });
      window.location.replace(landingFor(user?.role ?? "contractor"));
    } catch {
      setError("Couldn't verify the code. Please try again.");
    } finally {
      setOtpBusy(false);
    }
  }

  async function signInWith(provider: "google" | "apple") {
    setSocialBusy(provider);
    setError("");
    try {
      rememberNextPath(redirectTo);
      const supabase = createClient();
      const { error: oErr } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?via=${provider}${redirectTo ? `&next=${encodeURIComponent(redirectTo)}` : ""}`,
        },
      });
      if (oErr) {
        setError(oErr.message);
        setSocialBusy(null);
      }
      // success → the browser is navigating to the provider
    } catch {
      setError(`Couldn't start ${provider === "google" ? "Google" : "Apple"} sign-in. Please try again.`);
      setSocialBusy(null);
    }
  }

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const showSocial = userType === "contractor" && (providers.google || providers.apple);
  const socialFirst = useRemembered && last && (last.method === "google" || last.method === "apple");
  const firstName = firstNameOf(last?.name, last?.email);

  const socialButtons = showSocial ? (
    <div className="space-y-2" data-hb-social>
      {providers.google && (
        <Button type="button" variant="outline" className="h-12 w-full text-base font-semibold" onClick={() => signInWith("google")} disabled={!!socialBusy} data-hb-signin="google">
          {socialBusy === "google" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Continue with Google
        </Button>
      )}
      {providers.apple && (
        <Button type="button" variant="outline" className="h-12 w-full text-base font-semibold" onClick={() => signInWith("apple")} disabled={!!socialBusy} data-hb-signin="apple">
          {socialBusy === "apple" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Continue with Apple
        </Button>
      )}
    </div>
  ) : null;

  const divider = (
    <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-muted-foreground">
      <span className="h-px flex-1 bg-border" />
      or
      <span className="h-px flex-1 bg-border" />
    </div>
  );

  const magicButton = (
    <Button type="button" variant="secondary" className="h-12 w-full text-base font-semibold" onClick={sendMagicLink} disabled={magicBusy || loading} data-hb-signin="magic">
      {magicBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
      Email me a sign-in link
    </Button>
  );

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
      <div className="flex flex-1 items-start justify-center px-4 pt-6 pb-16 sm:pt-10">
        <div className="w-full max-w-sm space-y-5">
          {view === "signin" && (
          <>
          {/* User Type Toggle — hidden while we already know this device belongs to a contractor */}
          {!useRemembered && (
          <div className="flex gap-2 rounded-lg border border-border bg-muted/50 p-1">
            <button
              type="button"
              onClick={() => {
                setUserType("contractor");
                setUsePhoneForHomeowner(false);
              }}
              className={`flex-1 rounded px-3 py-2.5 text-sm font-medium transition-colors ${
                userType === "contractor"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Contractor
            </button>
            <button
              type="button"
              onClick={() => setUserType("homeowner")}
              className={`flex-1 rounded px-3 py-2.5 text-sm font-medium transition-colors ${
                userType === "homeowner"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Homeowner
            </button>
          </div>
          )}

          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-foreground" data-hb-signin-title>
              {useRemembered && last ? `Welcome back${firstName ? `, ${firstName}` : ""}` : "Welcome back to HomeBids"}
            </h1>
            {switchedOut && (
              <p className="mt-2 rounded-lg bg-muted px-3 py-2 text-sm text-foreground">
                This device was signed in as a homeowner, so we signed that out. Sign in with your contractor account to continue.
              </p>
            )}
            {useRemembered && last ? (
              <p className="mt-2 text-sm text-muted-foreground" data-hb-remembered>
                <span className="font-medium text-foreground">{last.email}</span>
                {" · "}
                <button type="button" onClick={notYou} className="font-medium text-primary hover:underline" data-hb-not-you>
                  Not you?
                </button>
              </p>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                {redirectTo
                  ? `Sign in to continue to your ${redirectTo.includes("/profile") ? "profile" : "dashboard"}.`
                  : userType === "contractor"
                  ? "Sign in to view your bids, leads, and messages."
                  : "Sign in to view your project and bids."}
              </p>
            )}
          </div>

          {notice && (
            <div className="rounded-lg border border-border bg-muted/60 px-3 py-2 text-sm text-foreground" data-hb-notice>
              {notice}
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Returning user who last used Google/Apple: that button first */}
          {socialFirst && socialButtons}
          {socialFirst && divider}

          <form onSubmit={handlePasswordSignIn} className="space-y-3" data-hb-signin-form>
            {userType === "homeowner" && (
              <>
                {usePhoneForHomeowner ? (
                  <div className="space-y-1.5">
                    <label htmlFor="phone" className="text-sm font-medium text-foreground">
                      Phone Number
                    </label>
                    <Input
                      id="phone"
                      type="tel"
                      autoComplete="tel"
                      inputMode="tel"
                      placeholder="(555) 123-4567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-12 text-base"
                      disabled={loading}
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label htmlFor="email" className="text-sm font-medium text-foreground">
                      Email
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="username"
                      inputMode="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 text-base"
                      disabled={loading}
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
            {userType === "contractor" && !useRemembered && (
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  inputMode="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 text-base"
                  disabled={loading}
                />
              </div>
            )}
            {userType === "contractor" && useRemembered && (
              // keeps the password manager / passkey autofill paired with the remembered email
              <input type="email" name="email" value={email} readOnly autoComplete="username" tabIndex={-1} aria-hidden="true" className="sr-only" />
            )}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
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
                  ref={passwordRef}
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder={useRemembered ? "Your password" : "Enter your password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 pr-10 text-base"
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
            <Button type="submit" className="h-12 w-full cursor-pointer text-base font-semibold" disabled={loading} data-hb-signin="password">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </form>

          {userType === "contractor" && (
            <>
              {divider}
              {magicButton}
              {!socialFirst && socialButtons}
            </>
          )}

          <p className="text-center text-sm text-muted-foreground">
            New contractor?{" "}
            <Link href="/contractors/signup" className="font-medium text-primary hover:underline">
              Create an account
            </Link>
          </p>
          </>
          )}

          {view === "magic-sent" && (
            <div className="space-y-5" data-hb-magic-sent>
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <MailCheck className="h-6 w-6 text-primary" />
                </div>
                <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">Check your email</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  We sent a sign-in link to <span className="font-medium text-foreground">{magicEmail}</span>. Tap it on this device and you&apos;re in.
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={verifyCode} className="space-y-3">
                <label htmlFor="otp" className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <KeyRound className="h-4 w-4 text-muted-foreground" />
                  Or enter the 6-digit code from the email
                </label>
                <Input
                  id="otp"
                  name="otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="h-12 text-center text-lg tracking-[0.4em]"
                  disabled={otpBusy}
                />
                <Button type="submit" className="h-12 w-full text-base font-semibold" disabled={otpBusy || otp.length !== 6} data-hb-signin="otp">
                  {otpBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verify code
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground">
                Didn&apos;t get it?{" "}
                <button type="button" onClick={sendMagicLink} disabled={resendIn > 0 || magicBusy} className="font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-60" data-hb-resend>
                  {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend email"}
                </button>
                {" · "}
                <button type="button" onClick={backToLogin} className="font-medium text-primary hover:underline">
                  Use password
                </button>
              </p>
            </div>
          )}

          {view === "forgot" && (
            <>
              <div className="text-center">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Reset your password</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Enter the email connected to your HomeBids account and we&apos;ll send you a reset link.
                </p>
              </div>

              {resetError && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {resetError}
                </div>
              )}

              <form onSubmit={handleForgotSubmit} className="space-y-3">
                <div className="space-y-1.5">
                  <label htmlFor="reset-email" className="text-sm font-medium text-foreground">
                    Email
                  </label>
                  <Input
                    id="reset-email"
                    type="email"
                    autoComplete="username"
                    inputMode="email"
                    placeholder="Email address"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="h-12 text-base"
                    disabled={resetLoading}
                  />
                </div>
                <Button type="submit" className="h-12 w-full cursor-pointer text-base font-semibold" disabled={resetLoading}>
                  {resetLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Reset Link
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground">
                <button type="button" onClick={backToLogin} className="font-medium text-primary hover:underline">
                  Back to Login
                </button>
              </p>
            </>
          )}

          {view === "forgot-sent" && (
            <div className="space-y-5 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <MailCheck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Check your email</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  If an account exists for that email, we&apos;ll send a password reset link.
                </p>
              </div>
              <Button onClick={backToLogin} className="h-12 w-full cursor-pointer text-base font-semibold">
                Back to Login
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

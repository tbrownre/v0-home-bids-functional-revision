"use client";

import { useEffect, useState } from "react";
import { HomeBidsLogo } from "@/components/homebids-logo";
import { PhoneUpgradeCheckout } from "@/components/phone-upgrade-checkout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { realSignIn, redirectAfterSignIn } from "@/lib/mock-auth";
import { createProAccount } from "@/app/actions/create-pro-account";
import {
  Infinity as InfinityIcon,
  FileText,
  Link2,
  MessageCircle,
  Zap,
  Calendar,
  CheckCircle2,
  ArrowRight,
  ChevronLeft,
  Lock,
  Loader2,
} from "lucide-react";

/**
 * /upgrade v4 ACCOUNTLOGIN — Tim + Abir (Sep 25): the old "Create password"
 * button pointed at /auth/sign-up, which does not exist (404), and the
 * signup pages carry free-trial language a paid Pro must never see.
 * Step 3 now creates the login RIGHT HERE: email + password with their paid
 * number locked in. Real email = /auth/forgot-password works for them later.
 * Skipping stays harmless — the number itself is the subscription.
 * Steps 1–2 unchanged from v3.1 COMPACT. Tagline carries NO ™ (Tim's note).
 */

const PERKS = [
  { icon: InfinityIcon, text: "Unlimited bids" },
  { icon: FileText, text: "Your company branding" },
  { icon: Link2, text: "Shareable proposals (link + PDF)" },
  { icon: MessageCircle, text: "iMessage support included" },
  { icon: Zap, text: "Save time. Win more jobs" },
  { icon: Calendar, text: "Cancel anytime" },
];

const DONE_PERKS = [
  { icon: InfinityIcon, text: "Unlimited bids" },
  { icon: FileText, text: "Your branding enabled" },
  { icon: Link2, text: "Shareable proposals" },
  { icon: MessageCircle, text: "iMessage support included" },
  { icon: Zap, text: "Get back to building" },
];

function digitsOf(v: string): string {
  return String(v || "").replace(/\D/g, "").slice(-10);
}

function formatPhone(d: string): string {
  return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : d;
}

type Step = "pitch" | "pay" | "done";
type AccountState = "form" | "working" | "created";

export default function UpgradePage() {
  const [step, setStep] = useState<Step>("pitch");
  const [phone, setPhone] = useState<string | null>(null);
  const [entry, setEntry] = useState("");

  const [acct, setAcct] = useState<AccountState>("form");
  const [acctEmail, setAcctEmail] = useState("");
  const [acctPw, setAcctPw] = useState("");
  const [acctErr, setAcctErr] = useState<string | null>(null);

  useEffect(() => {
    try {
      const p = new URLSearchParams(window.location.search).get("p");
      const d = digitsOf(p || "");
      if (d.length === 10) setPhone(d);
    } catch {
      // no-op — manual entry covers it
    }
  }, []);

  useEffect(() => {
    try {
      window.scrollTo({ top: 0 });
    } catch {
      // no-op
    }
  }, [step]);

  const submitEntry = () => {
    const d = digitsOf(entry);
    if (d.length === 10) setPhone(d);
  };

  const acctEmailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(acctEmail.trim());
  const acctPwOk = acctPw.length >= 8;

  const submitAccount = async () => {
    if (!phone || acct === "working" || !acctEmailOk || !acctPwOk) return;
    setAcctErr(null);
    setAcct("working");
    const res = await createProAccount({ phone, email: acctEmail, password: acctPw });
    if (!res.ok) {
      setAcct("form");
      setAcctErr(
        res.error === "email_exists"
          ? "That email already has an account — use Sign in below instead."
          : res.error === "weak_password"
            ? "Password needs at least 8 characters."
            : res.error === "invalid_email"
              ? "That email doesn't look right."
              : "Couldn't create the account — please try again.",
      );
      return;
    }
    try {
      // Same bridge the sign-in page uses: signs in AND syncs the local
      // session mirror, so the dashboard guard recognizes them.
      await realSignIn(acctEmail.trim().toLowerCase(), acctPw);
    } catch {
      // account exists either way; worst case they sign in manually
    }
    setAcct("created");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-4 py-3">
        <div className="mx-auto flex max-w-md items-center justify-center">
          {step === "pay" && (
            <button
              type="button"
              onClick={() => setStep("pitch")}
              className="absolute left-4 flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Back"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          <HomeBidsLogo size="22px" />
        </div>
      </header>

      <main className="mx-auto max-w-md px-5 py-5 sm:max-w-lg">
        {/* ── STEP 1 — pitch ─────────────────────────────────────────── */}
        {step === "pitch" && (
          <div>
            <h1 className="text-balance text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl">
              Go Pro. Build Faster.
            </h1>
            <p className="mt-1.5 text-base text-muted-foreground">
              Unlimited professional bids for busy contractors.
            </p>

            <ul className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
              {PERKS.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-2.5 text-sm font-medium text-foreground">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10">
                    <Icon className="h-3.5 w-3.5 text-primary" />
                  </span>
                  {text}
                </li>
              ))}
            </ul>

            <div className="mt-5 rounded-2xl bg-primary/5 p-4 text-center">
              <p>
                <span className="text-4xl font-extrabold tracking-tight text-primary">$99</span>
                <span className="ml-1.5 text-base font-medium text-muted-foreground">/ month</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">No contracts. Cancel anytime.</p>
            </div>

            <Button
              className="mt-4 h-12 w-full gap-2 rounded-xl text-base font-semibold"
              onClick={() => setStep("pay")}
            >
              Continue to payment
              <ArrowRight className="h-[18px] w-[18px]" />
            </Button>

            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="h-3.5 w-3.5" />
              Secure checkout powered by Stripe
            </p>
          </div>
        )}

        {/* ── STEP 2 — payment only ──────────────────────────────────── */}
        {step === "pay" && (
          <div>
            {phone ? (
              <PhoneUpgradeCheckout phone={phone} onPaid={() => setStep("done")} />
            ) : (
              <div className="rounded-2xl border border-border bg-card p-6">
                <p className="font-semibold text-foreground">What number do you text your bids from?</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  That&apos;s how we unlock your unlimited bids the moment you&apos;re done.
                </p>
                <Input
                  type="tel"
                  inputMode="tel"
                  placeholder="(480) 555-0192"
                  value={entry}
                  onChange={(e) => setEntry(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitEntry();
                  }}
                  className="mt-4 h-12"
                />
                <Button
                  className="mt-3 h-11 w-full font-semibold"
                  onClick={submitEntry}
                  disabled={digitsOf(entry).length !== 10}
                >
                  Continue
                </Button>
              </div>
            )}
            <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="h-3.5 w-3.5" />
              Payments are secure and encrypted by Stripe
            </p>
          </div>
        )}

        {/* ── STEP 3 — you're in + create login ──────────────────────── */}
        {step === "done" && (
          <div className="flex flex-col items-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-10 w-10 text-primary" />
            </div>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-foreground">You&apos;re in!</h1>
            <p className="mt-2 text-lg text-muted-foreground">HomeBids Pro is now active.</p>

            <ul className="mt-7 w-full rounded-2xl bg-primary/5 p-6 text-left">
              {DONE_PERKS.map(({ icon: Icon, text }, i) => (
                <li
                  key={text}
                  className={`flex items-center gap-3 text-[15px] font-medium text-foreground ${i > 0 ? "mt-4" : ""}`}
                >
                  <Icon className="h-4.5 w-4.5 shrink-0 text-primary" />
                  {text}
                </li>
              ))}
            </ul>

            {acct !== "created" && (
              <div className="mt-6 w-full rounded-2xl border border-border bg-card p-5 text-left">
                <p className="font-semibold text-foreground">Create your login</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Manage your bids, branding, and billing at homebids.ai. Your Pro number is already attached.
                </p>

                {phone && (
                  <div className="mt-4 flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2.5 text-sm font-medium text-foreground">
                    <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    {formatPhone(phone)}
                    <span className="ml-auto text-xs font-semibold text-primary">Pro active</span>
                  </div>
                )}

                <Input
                  type="email"
                  inputMode="email"
                  placeholder="you@email.com"
                  value={acctEmail}
                  onChange={(e) => setAcctEmail(e.target.value)}
                  className="mt-3 h-12"
                />
                <Input
                  type="password"
                  placeholder="Choose a password (8+ characters)"
                  value={acctPw}
                  onChange={(e) => setAcctPw(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitAccount();
                  }}
                  className="mt-2.5 h-12"
                />

                {acctErr && <p className="mt-2 text-sm font-medium text-destructive">{acctErr}</p>}

                <Button
                  className="mt-3 h-12 w-full gap-2 font-semibold"
                  onClick={submitAccount}
                  disabled={!acctEmailOk || !acctPwOk || acct === "working"}
                >
                  {acct === "working" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating your account…
                    </>
                  ) : (
                    "Create my account"
                  )}
                </Button>

                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Optional — your number stays unlocked either way.{" "}
                  <a href="/auth/sign-in" className="font-semibold text-primary hover:underline">
                    Already have an account? Sign in
                  </a>
                </p>
              </div>
            )}

            {acct === "created" && (
              <div className="mt-6 w-full rounded-2xl bg-primary/5 p-5">
                <p className="font-semibold text-foreground">Your login is ready ✅</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Same email + password works anytime at homebids.ai.
                </p>
                <Button
                  className="mt-4 h-12 w-full rounded-xl font-semibold"
                  onClick={() => redirectAfterSignIn("contractor")}
                >
                  Go to my dashboard
                </Button>
              </div>
            )}

            <a
              href="sms:+12832291348?body=Let%27s%20create%20a%20new%20bid!"
              className="mt-5 text-sm font-semibold text-primary hover:underline"
            >
              Return to Messages
            </a>

            <p className="mt-8 text-lg italic text-muted-foreground" style={{ fontFamily: "cursive" }}>
              Better bids. Better homes.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

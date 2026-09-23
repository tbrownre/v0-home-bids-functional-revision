"use client";

import { useEffect, useState } from "react";
import { HomeBidsLogo } from "@/components/homebids-logo";
import { PhoneUpgradeCheckout } from "@/components/phone-upgrade-checkout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "lucide-react";

/**
 * /upgrade v3 STEPFLOW — Tim's mock (Sep 23): "That's each page, step by step."
 * Step 1: "Go Pro. Build Faster." pitch. Step 2: payment only (Stripe embedded;
 * Apple/Google Pay appear once enabled in Stripe settings). Step 3: "You're in!"
 * with Create password + Return to Messages. Tagline carries NO ™ (Tim's note).
 * ?p=<phone> keys the checkout to the contractor; without it, one phone field
 * appears between steps 1 and 2. No account, no sign-in, ever.
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

type Step = "pitch" | "pay" | "done";

export default function UpgradePage() {
  const [step, setStep] = useState<Step>("pitch");
  const [phone, setPhone] = useState<string | null>(null);
  const [entry, setEntry] = useState("");

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

        {/* ── STEP 3 — you're in ─────────────────────────────────────── */}
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

            <Button asChild className="mt-7 h-13 w-full rounded-xl py-4 text-base font-semibold">
              <a href="/auth/sign-up">Create password</a>
            </Button>
            <a
              href="sms:+12832291348?body=Let%27s%20create%20a%20new%20bid!"
              className="mt-4 text-sm font-semibold text-primary hover:underline"
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

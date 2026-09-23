"use client";

import { useEffect, useState } from "react";
import { HomeBidsLogo } from "@/components/homebids-logo";
import { PhoneUpgradeCheckout } from "@/components/phone-upgrade-checkout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2 } from "lucide-react";

/**
 * /upgrade v2 — A2 PHONEUNLOCK (Sep 23).
 * Was: a bare redirect into /subscribe, which demanded an account before
 * payment ("the paywall experience was awful" — Tim, Sep 21).
 * Now: the page the wall text links to (/upgrade?p=<phone>) — one purpose,
 * card form immediately, no sign-in. No ?p (old links / manual sends) →
 * one phone field, then the same checkout.
 */

const PERKS = [
  "Unlimited professional bids + estimates",
  "Your company branding + license info on every bid",
  "Cancel anytime — no contracts",
];

function digitsOf(v: string): string {
  return String(v || "").replace(/\D/g, "").slice(-10);
}

export default function UpgradePage() {
  const [phone, setPhone] = useState<string | null>(null);
  const [entry, setEntry] = useState("");
  const [checked, setChecked] = useState(false);

  // Read ?p= via window.location so the page needs no Suspense boundary.
  useEffect(() => {
    try {
      const p = new URLSearchParams(window.location.search).get("p");
      const d = digitsOf(p || "");
      if (d.length === 10) setPhone(d);
    } catch {
      // no-op — fall through to manual entry
    }
    setChecked(true);
  }, []);

  const submitEntry = () => {
    const d = digitsOf(entry);
    if (d.length === 10) setPhone(d);
  };

  if (!checked) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-4 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-center">
          <HomeBidsLogo size="22px" />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <div className="text-center">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
            HomeBids Pro
          </span>
          <h1 className="mt-4 text-balance text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Unlimited bids. <span className="text-primary">$99/mo.</span>
          </h1>
          <p className="mt-2 text-muted-foreground">Billed monthly. Cancel anytime.</p>
          <ul className="mx-auto mt-5 flex max-w-md flex-col gap-2 text-left">
            {PERKS.map((perk) => (
              <li key={perk} className="flex items-center gap-2.5 text-sm text-foreground">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                {perk}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8">
          {phone ? (
            <PhoneUpgradeCheckout phone={phone} />
          ) : (
            <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-6">
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
                Continue to checkout
              </Button>
            </div>
          )}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Secure checkout by Stripe. Questions?{" "}
          <a
            className="font-semibold text-primary"
            href="sms:+12832291348?body=I%20have%20a%20question%20about%20HomeBids%20Pro."
          >
            Text us
          </a>
          .
        </p>
      </main>
    </div>
  );
}

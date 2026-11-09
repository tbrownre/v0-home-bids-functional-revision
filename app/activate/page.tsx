import type { Metadata } from "next";
import Link from "next/link";
import { Bell, Check, ClipboardList, Clock3 } from "lucide-react";
import { Header } from "@/components/header";
import { ActivateCta } from "@/components/activate-cta";
import { CONTRACTOR_SMS_PHONE_DISPLAY } from "@/lib/sms-config";

/**
 * /activate — ACTIVATE (Tim, Nov 10 02:07: "Can we create a simple page that we can use temporarily for opt-in? Just one
 * CTA. TEXT US to get activated. … make it easy and super clear. This is meant for our trial/paid users.")
 *
 * Why it exists: every alert and Bid Builder reply we send comes from the HomeBids line by text. A contractor who has
 * never texted that line can't be reached by it (Danny Gomez: every text bounced), so the one thing a new trial/paid
 * contractor has to do is send us one text. This page is that one step — one button, the number as a fallback, a QR
 * for desktops, and the opt-in language the carriers expect. Temporary by design: no nav changes, noindex.
 */
export const metadata: Metadata = {
  title: "Text us to get activated — HomeBids",
  description: "One text from your phone turns on your HomeBids alerts and Bid Builder replies.",
  robots: { index: false, follow: false },
};

export default function ActivatePage() {
  return (
    <div className="min-h-screen bg-[linear-gradient(125deg,#f2f7ff_0%,#ffffff_70%)]" data-hb-activate>
      <Header />
      <main className="mx-auto flex w-full max-w-[640px] flex-col items-center px-5 pb-20 pt-12 text-center sm:pt-20">
        <span className="inline-flex items-center gap-2 rounded-full bg-[#e8f2ff] px-3.5 py-2 text-xs font-extrabold uppercase tracking-[0.08em] text-primary">
          <Clock3 className="h-3.5 w-3.5" aria-hidden /> One step · takes 10 seconds
        </span>

        <h1 className="mt-6 text-[2.6rem] font-extrabold leading-[1.05] tracking-[-0.045em] text-foreground sm:text-[3.6rem]">
          Text us to get <span className="text-primary">activated.</span>
        </h1>

        <p className="mt-5 max-w-[520px] text-lg leading-relaxed text-muted-foreground">
          Your lead alerts and Bid Builder replies come by <b className="font-bold text-foreground">text</b>. Send us one text
          from your mobile so our number can text you back — that&apos;s it.
        </p>

        <div className="mt-8 w-full">
          <ActivateCta />
        </div>

        <ul className="mt-9 grid w-full gap-3 text-left sm:grid-cols-3" data-hb-activate-points>
          {[
            { Icon: Bell, text: "Lead Radar alerts start arriving" },
            { Icon: ClipboardList, text: "Bid Builder answers your texts" },
            { Icon: Check, text: "Reply STOP any time to pause" },
          ].map(({ Icon, text }) => (
            <li key={text} className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 text-sm font-semibold text-foreground shadow-sm">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              {text}
            </li>
          ))}
        </ul>

        <p className="mt-9 max-w-[560px] text-xs leading-relaxed text-muted-foreground">
          By texting HomeBids at {CONTRACTOR_SMS_PHONE_DISPLAY} you agree to receive text messages about your account, your
          leads and your bids at the number you text from. Message frequency varies. Msg &amp; data rates may apply. Reply
          STOP to opt out or HELP for help.{" "}
          <Link href="/privacy" className="underline underline-offset-2">Privacy</Link> ·{" "}
          <Link href="/terms" className="underline underline-offset-2">Terms</Link>
        </p>
      </main>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { HomeBidsLogo } from "@/components/homebids-logo";
import { MessageCircle } from "lucide-react";
import {
  SMS_PHONE_NUMBER,
  SMS_PHONE_DISPLAY,
  HOMEOWNER_STARTER_MESSAGE,
  getSmsHref,
} from "@/lib/sms-config";

// Destination that a scanned QR code lands on. Immediately hands off to the
// device's native messaging app with the HomeBids number + starter message.
export default function TextPage() {
  const [smsHref, setSmsHref] = useState("");

  useEffect(() => {
    const href = getSmsHref(SMS_PHONE_NUMBER, HOMEOWNER_STARTER_MESSAGE);
    setSmsHref(href);
    // Auto-open the messaging app once on load.
    window.location.href = href;
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center font-sans">
      <HomeBidsLogo size="28px" linked={false} />

      <div className="flex flex-col items-center gap-2">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
          Opening your messages…
        </h1>
        <p className="max-w-sm text-pretty leading-relaxed text-muted-foreground">
          {"If your messaging app didn't open automatically, tap the button below to text HomeBids."}
        </p>
      </div>

      <a
        href={smsHref || undefined}
        className="inline-flex h-12 items-center justify-center gap-2.5 rounded-full bg-[#0A84FF] px-8 text-base font-semibold text-white transition-colors hover:bg-[#0A84FF]/90"
      >
        <MessageCircle className="h-[18px] w-[18px] shrink-0" />
        Text {SMS_PHONE_DISPLAY}
      </a>

      <p className="text-xs text-muted-foreground/70 tracking-wide">
        No app. No account. Just text.
      </p>
    </main>
  );
}

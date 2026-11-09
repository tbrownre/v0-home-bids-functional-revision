"use client";

import { useCallback, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Check, Copy, MessageSquareText } from "lucide-react";
import { copyToClipboard } from "@/lib/utils";
import { CONTRACTOR_SMS_PHONE_DISPLAY, CONTRACTOR_SMS_PHONE_NUMBER, getSmsHref } from "@/lib/sms-config";

/** The one text a contractor sends to open the line (ACTIVATE, Tim Nov 10). */
export const ACTIVATE_BODY = "Activate my HomeBids account";

/**
 * The single CTA of /activate: on a phone the button opens Messages with the text pre-filled; on a desktop the same
 * sms: link is a QR code to scan, with the number itself one tap to copy. Nothing else on the page is interactive.
 */
export function ActivateCta() {
  const [copied, setCopied] = useState(false);
  const href = getSmsHref(CONTRACTOR_SMS_PHONE_NUMBER, ACTIVATE_BODY);

  const copyNumber = useCallback(async () => {
    await copyToClipboard(CONTRACTOR_SMS_PHONE_DISPLAY);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  return (
    <div className="w-full" data-hb-activate-cta>
      <a
        href={href}
        className="flex h-16 w-full items-center justify-center gap-3 rounded-full bg-primary px-6 text-lg font-extrabold text-primary-foreground shadow-[0_10px_26px_rgba(8,121,252,0.35)] transition-transform active:scale-[0.99] sm:text-xl"
        data-hb-activate-text
      >
        <MessageSquareText className="h-6 w-6 shrink-0" aria-hidden />
        TEXT US to get activated
      </a>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Or text <span className="font-bold text-foreground">ACTIVATE</span> to{" "}
        <button type="button" onClick={copyNumber} className="inline-flex items-center gap-1 font-bold text-foreground underline decoration-dotted underline-offset-4" data-hb-activate-copy>
          {CONTRACTOR_SMS_PHONE_DISPLAY}
          {copied ? <Check className="h-3.5 w-3.5 text-green-700" aria-hidden /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />}
        </button>
        {copied && <span className="ml-1 font-semibold text-green-700">Copied</span>}
      </p>

      {/* desktop: scan with the phone — same sms: link */}
      <div className="mt-6 hidden flex-col items-center rounded-2xl border border-border bg-card px-6 py-5 shadow-sm sm:flex" data-hb-activate-qr>
        <p className="text-sm font-bold text-foreground">On a computer? Scan with your phone</p>
        <div className="mt-3 rounded-xl border border-border bg-white p-3">
          <QRCodeSVG
            value={href}
            size={150}
            level="M"
            marginSize={0}
            fgColor="#0A1A2F"
            bgColor="#ffffff"
            role="img"
            aria-label="QR code that opens a text to HomeBids with the activation message"
            style={{ height: "auto", width: "150px", maxWidth: "100%" }}
          />
        </div>
        <p className="mt-3 text-center text-xs text-muted-foreground">Your camera opens Messages with the text ready to send.</p>
      </div>
    </div>
  );
}

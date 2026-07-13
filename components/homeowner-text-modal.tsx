"use client";

import { useState, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Check, Copy, MessageSquareText, Phone } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HomeBidsLogo } from "@/components/homebids-logo";
import { copyToClipboard } from "@/lib/utils";
import {
  SMS_PHONE_NUMBER,
  SMS_PHONE_DISPLAY,
  HOMEOWNER_STARTER_MESSAGE,
  getSmsHref,
} from "@/lib/sms-config";

// URL a scanned QR code lands on — hands off to the messaging app on the phone.
const QR_TARGET_URL = "https://www.homebids.ai/text?source=homeowner-desktop";

/**
 * Desktop fallback for the "I'm a Homeowner" CTA. Shown only on devices that
 * cannot reliably open an SMS/iMessage conversation (Windows, Linux, Chromebook).
 */
export function HomeownerTextModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState<"number" | "message" | null>(null);

  const directSmsHref = getSmsHref(SMS_PHONE_NUMBER, HOMEOWNER_STARTER_MESSAGE);

  const handleCopyNumber = useCallback(async () => {
    await copyToClipboard(SMS_PHONE_DISPLAY);
    setCopied("number");
    setTimeout(() => setCopied((c) => (c === "number" ? null : c)), 2000);
  }, []);

  const handleCopyMessage = useCallback(async () => {
    await copyToClipboard(HOMEOWNER_STARTER_MESSAGE);
    setCopied("message");
    setTimeout(() => setCopied((c) => (c === "message" ? null : c)), 2000);
  }, []);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent
        className="max-w-md overflow-hidden rounded-3xl p-0"
        style={{
          background: "linear-gradient(160deg, #ffffff 0%, #f0f4ff 100%)",
          boxShadow: "0 32px 80px rgba(10,132,255,0.18), 0 8px 24px rgba(0,0,0,0.10)",
        }}
      >
        <div className="flex flex-col items-center px-7 pt-8 pb-7">
          {/* Logo */}
          <div className="mb-5 flex justify-center">
            <HomeBidsLogo size="28px" linked={false} />
          </div>

          {/* Headline */}
          <DialogTitle className="text-center text-[22px] font-extrabold leading-tight tracking-tight text-foreground">
            Start your home project by text
          </DialogTitle>

          {/* Supporting copy */}
          <DialogDescription className="mt-2.5 text-center text-sm leading-relaxed text-muted-foreground">
            Scan the QR code with your phone or text us directly. {"We'll"} ask a few
            quick questions, organize your project details, and help you find
            qualified, affordable contractors.
          </DialogDescription>

          {/* QR code section */}
          <div className="mt-6 flex w-full flex-col items-center rounded-2xl border border-[#0A84FF]/15 bg-white px-6 py-6 shadow-sm">
            <p className="text-sm font-bold text-foreground">Scan to start your project</p>
            <div className="mt-4 rounded-xl border border-border bg-white p-3">
              <QRCodeSVG
                value={QR_TARGET_URL}
                size={168}
                level="M"
                marginSize={0}
                fgColor="#0A1A2F"
                bgColor="#ffffff"
                role="img"
                aria-label="QR code that opens a text message to HomeBids"
                style={{ height: "auto", width: "168px", maxWidth: "100%" }}
              />
            </div>
            <p className="mt-3 max-w-[260px] text-center text-xs leading-relaxed text-muted-foreground">
              {"Open your phone's camera and scan the code to text HomeBids."}
            </p>
          </div>

          {/* Divider — text directly */}
          <div className="mt-6 flex w-full items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs font-medium text-muted-foreground">Or text us directly</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          {/* Phone number — prominent */}
          <a
            href={directSmsHref}
            className="mt-4 text-center text-[26px] font-extrabold tracking-tight text-[#0A84FF] hover:underline"
          >
            {SMS_PHONE_DISPLAY}
          </a>

          {/* Actions */}
          <div className="mt-5 flex w-full flex-col gap-2.5">
            <Button
              type="button"
              onClick={handleCopyNumber}
              className="h-11 w-full gap-2 rounded-full bg-[#0A84FF] text-base font-semibold text-white hover:bg-[#0A84FF]/90"
            >
              {copied === "number" ? (
                <>
                  <Check className="h-[18px] w-[18px] shrink-0" />
                  Number copied!
                </>
              ) : (
                <>
                  <Phone className="h-[18px] w-[18px] shrink-0" />
                  Copy phone number
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleCopyMessage}
              className="h-11 w-full gap-2 rounded-full bg-white/80 text-base font-semibold text-foreground hover:bg-white hover:text-foreground"
            >
              {copied === "message" ? (
                <>
                  <Check className="h-[18px] w-[18px] shrink-0" />
                  Message copied!
                </>
              ) : (
                <>
                  <Copy className="h-[18px] w-[18px] shrink-0" />
                  Copy starter message
                </>
              )}
            </Button>
          </div>

          {/* Footer reassurance */}
          <p className="mt-5 flex items-center gap-1.5 text-center text-[11px] text-muted-foreground/70">
            <MessageSquareText className="h-3.5 w-3.5 shrink-0" />
            No app. No account. Just text.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

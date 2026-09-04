"use client";

import { useState, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Check, Copy, MessageSquareText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { copyToClipboard } from "@/lib/utils";
import {
  SMS_PHONE_NUMBER,
  SMS_PHONE_DISPLAY,
  getSmsHref,
} from "@/lib/sms-config";

const NEW_PROJECT_BODY = "Hi HomeBids! I need help with a new project";

/**
 * Shared modal for every "start a project" CTA on the homeowner side.
 * Projects start over text — mobile users tap the SMS button, desktop users
 * scan the QR code (same sms: link to the homeowner HomeBids number).
 */
export function StartProjectModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const smsHref = getSmsHref(SMS_PHONE_NUMBER, NEW_PROJECT_BODY);

  const handleCopy = useCallback(async () => {
    await copyToClipboard(SMS_PHONE_DISPLAY);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md overflow-hidden rounded-3xl p-0">
        <div className="flex flex-col items-center px-7 pb-7 pt-8">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
            <MessageSquareText className="h-6 w-6 text-primary" />
          </div>

          <DialogTitle className="text-center text-[22px] font-extrabold leading-tight tracking-tight text-foreground">
            Projects start by text
          </DialogTitle>

          <DialogDescription className="mt-2.5 max-w-[320px] text-center text-sm leading-relaxed text-muted-foreground">
            Text what you need done — HomeBids takes it from there.
          </DialogDescription>

          {/* QR — desktop scan target (same sms: link) */}
          <div className="mt-6 hidden w-full flex-col items-center rounded-2xl border border-border bg-card px-6 py-6 shadow-sm sm:flex">
            <p className="text-sm font-bold text-foreground">Scan to start a project</p>
            <div className="mt-4 rounded-xl border border-border bg-white p-3">
              <QRCodeSVG
                value={smsHref}
                size={160}
                level="M"
                marginSize={0}
                fgColor="#0A1A2F"
                bgColor="#ffffff"
                role="img"
                aria-label="QR code that opens a text message to HomeBids"
                style={{ height: "auto", width: "160px", maxWidth: "100%" }}
              />
            </div>
            <p className="mt-3 max-w-[240px] text-center text-xs leading-relaxed text-muted-foreground">
              {"Open your phone's camera and scan to text HomeBids."}
            </p>
          </div>

          {/* Primary SMS action */}
          <Button
            asChild
            className="mt-6 h-12 w-full gap-2 rounded-full text-base font-semibold"
          >
            <a href={smsHref}>
              <MessageSquareText className="h-[18px] w-[18px] shrink-0" />
              Text {SMS_PHONE_DISPLAY}
            </a>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleCopy}
            className="mt-2.5 h-11 w-full gap-2 rounded-full text-sm font-semibold"
          >
            {copied ? (
              <>
                <Check className="h-[18px] w-[18px] shrink-0" />
                Number copied!
              </>
            ) : (
              <>
                <Copy className="h-[18px] w-[18px] shrink-0" />
                Copy phone number
              </>
            )}
          </Button>

          <p className="mt-5 text-center text-[11px] text-muted-foreground/70">
            No app. No account. Just text.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

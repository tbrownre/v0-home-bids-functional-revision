"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { QRCodeSVG } from "qrcode.react";
import { isSmsCapableDevice } from "@/lib/sms-config";

/**
 * ADLAND client island: the only JavaScript on an ad landing page.
 *   - label: "Open iMessage" on iPhone/iPad/Mac (the creative's words), "Open Messages" on Android, QR + number on
 *     desktops that cannot open sms: links
 *   - tracking: Meta Pixel (Contact + custom OpenMessages), GTM dataLayer, and a server beacon to /api/ads/event
 *     with the same event_id so the Conversions API can de-duplicate. Only fixed, allow-listed values go out —
 *     the page never reads free text from the URL (utm values are reduced to [a-z0-9_-] and capped).
 */

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export interface AdLandingClientProps {
  slug: string;
  audience: "homeowner" | "contractor";
  href: string;
  phone: string;
  display: string;
  body: string;
  children: ReactNode;
}

const clean = (v: string | null, max = 64) => String(v ?? "").toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, max);

function utmFromUrl() {
  if (typeof window === "undefined") return {};
  const q = new URLSearchParams(window.location.search);
  const out: Record<string, string> = {};
  for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]) {
    const v = clean(q.get(k));
    if (v) out[k] = v;
  }
  return out;
}

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const m = document.cookie.split(";").map((c) => c.trim()).find((c) => c.startsWith(name + "="));
  return m ? m.slice(name.length + 1) : undefined;
}

function eventId() {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

export function AdLandingClient({ slug, audience, href, phone, display, body, children }: AdLandingClientProps) {
  const [label, setLabel] = useState("Open iMessage");
  const [desktop, setDesktop] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const ua = navigator.userAgent;
    const android = /Android/i.test(ua);
    const capable = isSmsCapableDevice();
    setLabel(android ? "Open Messages" : "Open iMessage");
    setDesktop(!capable);
    // keep every CTA label on the page in sync (the final CTA is server-rendered outside this island)
    document.querySelectorAll<HTMLElement>("[data-hb-cta-label]").forEach((el) => {
      el.textContent = android ? "Open Messages" : "Open iMessage";
    });

    const track = (ev: Event) => {
      const a = (ev.target as HTMLElement | null)?.closest?.("a[data-hb-cta]") as HTMLAnchorElement | null;
      if (!a) return;
      const placement = clean(a.getAttribute("data-hb-cta"), 16) || "hero";
      const id = eventId();
      const utm = utmFromUrl();
      const params = { content_name: slug, content_category: audience, placement, ...utm };
      try {
        window.fbq?.("track", "Contact", params, { eventID: id });
        window.fbq?.("trackCustom", "OpenMessages", params, { eventID: id });
      } catch {
        /* pixel absent */
      }
      try {
        (window.dataLayer = window.dataLayer || []).push({ event: "open_messages", ...params, event_id: id });
      } catch {
        /* ignore */
      }
      try {
        const payload = JSON.stringify({
          event_id: id,
          event_name: "Contact",
          slug,
          audience,
          placement,
          utm,
          fbp: readCookie("_fbp"),
          fbc: readCookie("_fbc"),
          url: window.location.origin + window.location.pathname,
        });
        if (!navigator.sendBeacon?.("/api/ads/event", new Blob([payload], { type: "application/json" }))) {
          void fetch("/api/ads/event", { method: "POST", body: payload, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => {});
        }
      } catch {
        /* never block the tap */
      }
    };
    document.addEventListener("click", track, true);
    return () => document.removeEventListener("click", track, true);
  }, [slug, audience]);

  return (
    <div ref={rootRef} className="cta-island" data-hb-cta-island data-hb-label={label} data-hb-desktop={desktop ? "1" : "0"}>
      {children}
      {/* Desktop (no Messages app): scan to text, or type the number — same starter text either way */}
      <div className={`alt-cta${desktop ? " on" : ""}`} data-hb-desktop-fallback>
        <div className="qr">
          <QRCodeSVG value={href} size={132} level="M" includeMargin={false} aria-label={`QR code to text ${display}`} />
          <div className="qt">
            <b>Text {display}</b>
            <small>Scan with your phone, or text us: “{body}”</small>
          </div>
        </div>
      </div>
      <span hidden data-hb-phone={phone} />
    </div>
  );
}

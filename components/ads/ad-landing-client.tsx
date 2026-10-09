"use client";

import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { QRCodeSVG } from "qrcode.react";
import { isSmsCapableDevice } from "@/lib/sms-config";
import { mountAdExperience, type ExperienceConfig } from "@/lib/ads/experience-engine";

/**
 * ADLAND v2 client island (the replica). Owns everything that needs JavaScript on an ad landing page:
 *   - the experience engine (typewriter + conversation + ambient) mounted on the server-rendered markup
 *   - the full-page link: the whole screen is one <a href="sms:…"> (z-index above everything but the pause button
 *     and the fallback card), exactly like the reference page — tap anywhere → Messages with the starter text
 *   - label by device: "Open iMessage" on Apple, "Open Messages" on Android
 *   - desktops / devices without a Messages handler: the tap opens a card with the number, the message, copy
 *     buttons and a QR code that opens the same sms: link on a phone
 *   - tracking: Meta Pixel (Contact + custom OpenMessages), GTM dataLayer, and a beacon to /api/ads/event with the
 *     same event_id so the Conversions API de-duplicates. Only fixed, allow-listed values go out — utm values are
 *     reduced to [a-z0-9_-] and capped; nothing free-text from the URL is read or rendered.
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
  config: ExperienceConfig;
}

type Placement = "cta" | "page";

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

function track(slug: string, audience: string, placement: Placement) {
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
}

type EngineRoot = HTMLElement & { __hbx?: { launch(): void; resume(): void } };

export function AdLandingClient({ slug, audience, href, phone, display, body, config }: AdLandingClientProps) {
  // The island is rendered INSIDE the server-rendered <main class="hbx"> (first child); the root is its parent.
  const linkRef = useRef<HTMLAnchorElement | null>(null);
  const rootRef = useRef<EngineRoot | null>(null);
  const [android, setAndroid] = useState(false);
  const [capable, setCapable] = useState(true);
  const [fallback, setFallback] = useState(false);
  const [status, setStatus] = useState("");
  const resumeTimer = useRef<number | null>(null);
  const cfgRef = useRef(config);

  // device: label + whether sms: links can open here
  useEffect(() => {
    const root = (linkRef.current?.closest("main.hbx") as EngineRoot | null) ?? null;
    rootRef.current = root;
    const isAndroid = /Android/i.test(navigator.userAgent);
    const can = isSmsCapableDevice();
    setAndroid(isAndroid);
    setCapable(can);
    const label = isAndroid ? "Open Messages" : "Open iMessage";
    root?.querySelectorAll<HTMLElement>("[data-hb-cta-label]").forEach((el) => {
      el.textContent = label;
    });
    root?.setAttribute("data-hb-capable", can ? "1" : "0");
    root?.setAttribute("data-hb-label", label);
  }, []);

  // the experience engine (mounted once; the config is static per page)
  useEffect(() => {
    const root = rootRef.current ?? (linkRef.current?.closest("main.hbx") as EngineRoot | null);
    if (!root) return;
    return mountAdExperience(root, cfgRef.current);
  }, []);

  // Escape closes the fallback card
  useEffect(() => {
    if (!fallback) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFallback(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [fallback]);

  const onPageClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      const root = rootRef.current;
      const cta = root?.querySelector<HTMLElement>(".message-cta");
      let placement: Placement = "page";
      if (cta) {
        const r = cta.getBoundingClientRect();
        if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) placement = "cta";
      }
      track(slug, audience, placement);
      if (!capable) {
        // no Messages app here: keep the visitor on the page and show the number + QR instead
        e.preventDefault();
        setStatus("");
        setFallback(true);
        return;
      }
      // Messages is opening: freeze the scene so it is where they left it when they come back
      root?.__hbx?.launch();
      if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
      resumeTimer.current = window.setTimeout(() => root?.__hbx?.resume(), 8000);
    },
    [slug, audience, capable],
  );

  const copy = useCallback(async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setStatus(`${what} copied`);
    } catch {
      setStatus(`Select the ${what.toLowerCase()} above and copy it`);
    }
  }, []);

  const label = android ? "Open Messages" : "Open iMessage";

  return (
    <>
      <a
        ref={linkRef}
        className="page-message-link"
        href={href}
        rel="nofollow"
        aria-label={`${label} and text HomeBids at ${display}`}
        data-hb-cta="page"
        onClick={onPageClick}
      />
      {fallback && (
        <aside className="sms-fallback" role="dialog" aria-label="Text HomeBids from your phone" data-hb-fallback>
          <button type="button" className="fallback-close" aria-label="Close" onClick={() => setFallback(false)}>
            ×
          </button>
          <strong>Text us from your phone</strong>
          <p>This computer can’t open Messages. Scan the code with your phone’s camera, or send the text yourself:</p>
          <div className="fallback-qr">
            <QRCodeSVG value={href} size={104} level="M" includeMargin={false} aria-label={`QR code to text ${display}`} />
            <p>Scan → your Messages app opens with the text ready to send.</p>
          </div>
          <label>
            Number
            <input readOnly value={display} onFocus={(e) => e.currentTarget.select()} />
          </label>
          <label>
            Message
            <input readOnly value={body} onFocus={(e) => e.currentTarget.select()} />
          </label>
          <div className="fallback-actions">
            <button type="button" onClick={() => copy(phone, "Number")}>
              Copy number
            </button>
            <button type="button" onClick={() => copy(body, "Message")}>
              Copy message
            </button>
          </div>
          <span className="copy-status" aria-live="polite">
            {status}
          </span>
          <p className="fallback-hint">{audience === "homeowner" ? "Free for homeowners. No app, no account." : "14-day free trial. No app to download."}</p>
        </aside>
      )}
    </>
  );
}

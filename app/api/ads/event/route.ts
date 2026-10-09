import { type NextRequest, NextResponse } from "next/server";
import { LANDING_SLUGS } from "@/lib/ads/landing-pages";

/**
 * ADLAND: server-side copy of the landing-page click (Meta Conversions API). The browser pixel can be blocked
 * (iOS, ad blockers, in-app browsers); this beacon carries the same event_id so Meta de-duplicates and still
 * learns from every tap. Forwards only when META_PIXEL_ID + META_CAPI_TOKEN are set in Vercel; otherwise 204.
 *
 * Hardened: 2 KB body cap, slug / event / placement allow-lists, utm values reduced to [a-z0-9_-], nothing echoed
 * back, nothing stored. Always answers 204 so a bad payload cannot be probed.
 */

export const runtime = "nodejs";

const EVENTS = new Set(["Contact"]);
const PLACEMENTS = new Set(["hero", "final"]);
const clean = (v: unknown, max = 64) => String(v ?? "").toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, max);

export async function POST(req: NextRequest) {
  const done = () => new NextResponse(null, { status: 204 });
  try {
    const raw = await req.text();
    if (!raw || raw.length > 2048) return done();
    const body = JSON.parse(raw) as Record<string, unknown>;
    const slug = clean(body.slug);
    const eventName = String(body.event_name ?? "");
    const placement = clean(body.placement, 16);
    if (!LANDING_SLUGS.includes(slug) || !EVENTS.has(eventName) || !PLACEMENTS.has(placement)) return done();
    const eventId = String(body.event_id ?? "").replace(/[^A-Za-z0-9-]/g, "").slice(0, 64);
    const audience = clean(body.audience, 16);
    const utm: Record<string, string> = {};
    if (body.utm && typeof body.utm === "object") {
      for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]) {
        const v = clean((body.utm as Record<string, unknown>)[k]);
        if (v) utm[k] = v;
      }
    }
    const fbp = String(body.fbp ?? "").replace(/[^A-Za-z0-9._-]/g, "").slice(0, 80) || undefined;
    const fbc = String(body.fbc ?? "").replace(/[^A-Za-z0-9._-]/g, "").slice(0, 160) || undefined;
    const url = `https://www.homebids.ai/go/${slug}`;

    const pixel = (process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID || "").replace(/\D/g, "");
    const token = process.env.META_CAPI_TOKEN;
    if (!pixel || !token || !eventId) {
      console.log("[ads/event]", JSON.stringify({ slug, audience, placement, utm, capi: false }));
      return done();
    }
    const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || undefined;
    const ua = req.headers.get("user-agent") || undefined;
    const payload = {
      data: [
        {
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          event_id: eventId,
          event_source_url: url,
          action_source: "website",
          user_data: { client_ip_address: ip, client_user_agent: ua, fbp, fbc },
          custom_data: { content_name: slug, content_category: audience, placement, ...utm },
        },
      ],
      ...(process.env.META_CAPI_TEST_CODE ? { test_event_code: process.env.META_CAPI_TEST_CODE } : {}),
    };
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 4000);
    const res = await fetch(`https://graph.facebook.com/v21.0/${pixel}/events?access_token=${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: ctl.signal,
    });
    clearTimeout(t);
    if (!res.ok) console.warn("[ads/event] CAPI", res.status, (await res.text().catch(() => "")).slice(0, 200));
    return done();
  } catch {
    return done();
  }
}

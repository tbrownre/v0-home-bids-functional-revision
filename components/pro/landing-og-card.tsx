import { ImageResponse } from "next/og";
import { HOMEBIDS_LOGO_PNG } from "@/lib/brand/logo-png";

/**
 * Link-preview card for a contractor's /pro/<slug> landing page (Tim, Oct 4: "OG image still says
 * HOMEBIDS. We want the contractor info listed in the image.").
 *
 * Until now /pro pages had no image route at all, so previews fell back to the site-wide HomeBids
 * card. This draws the same visual language as the bid card (HomeBids wordmark, pill, big name,
 * blue button) but with the CONTRACTOR as the subject: business name, trade · city, and the
 * "Get an estimate" call to action. Shared by opengraph-image.tsx and twitter-image.tsx.
 */

export const OG_SIZE = { width: 1200, height: 630 };

// SHARESPIN (Tim, Oct 4: "Trying to share the landing page.. its not letting me"): the iOS share
// sheet spins while it downloads this image, and an uncached render (fonts + Supabase + draw) is a
// 2–3 s cold hit. Same lever that fixed the /j card on Sep 19 (2.8 s MISS → 0.4 s HIT): let Vercel's
// CDN serve it for an hour and refresh in the background for a day. A renamed business shows on the
// card within the hour.
const OG_CACHE = { "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400" };

type LandingCard = {
  company: string;
  trade: string;
  city: string;
  logoUrl: string | null;
};

const digitsOnly = (v: unknown) => String(v ?? "").replace(/\D/g, "");

// Direct keyed REST fetch — no cookie client inside an image route (same approach as /p/[shareToken]).
export async function getLandingCard(slug: string): Promise<LandingCard> {
  const fallback: LandingCard = { company: "Your Local Pro", trade: "", city: "", logoUrl: null };
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const apiKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !apiKey || !slug) return fallback;
    const headers = { apikey: apiKey, Authorization: `Bearer ${apiKey}` };

    const lpRes = await fetch(
      `${supabaseUrl}/rest/v1/contractor_landing_pages?slug=eq.${encodeURIComponent(slug)}&select=contractor_id,config&limit=1`,
      { headers, cache: "no-store" },
    );
    if (!lpRes.ok) return fallback;
    const lpRows = (await lpRes.json()) as Array<{ contractor_id?: string | null; config?: Record<string, any> | null }>;
    const lp = lpRows[0];
    if (!lp) return fallback;

    const brand = (lp.config && lp.config.brand) || {};
    let company = String(brand.company_name ?? "").trim();
    let logoUrl: string | null = brand.logo_url ? String(brand.logo_url) : null;

    // Live business name wins (same rule as the page itself); the demo account keeps its demo brand.
    const isDemo = /^0{8}-/.test(String(lp.contractor_id ?? ""));
    if (lp.contractor_id && !isDemo) {
      const prRes = await fetch(
        `${supabaseUrl}/rest/v1/contractor_profiles?id=eq.${encodeURIComponent(String(lp.contractor_id))}&select=business_name,logo_url&limit=1`,
        { headers, cache: "no-store" },
      );
      if (prRes.ok) {
        const pr = ((await prRes.json()) as Array<{ business_name?: string | null; logo_url?: string | null }>)[0];
        const live = String(pr?.business_name ?? "").trim();
        if (live) company = live;
        if (!logoUrl && pr?.logo_url) logoUrl = String(pr.logo_url);
      }
    }

    const cities: string[] = Array.isArray(brand.cities) ? brand.cities.filter(Boolean).map(String) : [];
    const city = String(brand.city ?? cities[0] ?? "").trim();
    const trade = String(brand.trade ?? "").trim();
    return { company: company || fallback.company, trade, city, logoUrl: await inlineLogo(logoUrl) };
  } catch {
    return fallback;
  }
}

// Satori renders PNG/JPEG/GIF only and throws on a fetch it can't complete, so the logo is
// fetched here and inlined as a data URL; anything else (missing, svg/webp, huge, 403) → monogram.
async function inlineLogo(url: string | null): Promise<string | null> {
  if (!url || !/^https?:\/\//.test(url)) return null;
  try {
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) return null;
    const type = (r.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    if (!/^image\/(png|jpeg|jpg|gif)$/.test(type)) return null;
    const buf = Buffer.from(await r.arrayBuffer());
    if (!buf.length || buf.length > 3_000_000) return null;
    return `data:${type};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

type FontEntry = { name: string; data: ArrayBuffer; weight: 900 | 700 | 500; style: "normal" };

// Satori measures words without the font's GPOS kerning but draws them with it, so any word
// starting with a kerned pair ("Te…", "To…") gets a visible hole after it ("Tempe  Plumbing").
// Renaming the kerning tables in the table directory makes opentype.js skip them — uniform,
// un-kerned spacing instead of holes. Byte-level, no re-layout; any surprise → font used as-is.
function stripKerning(data: ArrayBuffer | Uint8Array): ArrayBuffer {
  const asBuffer = (v: ArrayBuffer | Uint8Array): ArrayBuffer =>
    v instanceof Uint8Array ? (v.buffer.slice(v.byteOffset, v.byteOffset + v.byteLength) as ArrayBuffer) : v;
  try {
    // Fresh, offset-0 copy: at runtime fetch() may hand back a pooled Buffer, so never trust `.buffer` as-is.
    const src = data instanceof Uint8Array ? data : new Uint8Array(data);
    const b = new Uint8Array(src.byteLength);
    b.set(src);
    const dv = new DataView(b.buffer);
    const ver = dv.getUint32(0);
    if (ver !== 0x00010000 && ver !== 0x4f54544f && ver !== 0x74727565) return asBuffer(data); // TTF / OTTO / 'true' only
    const n = dv.getUint16(4);
    if (12 + n * 16 > b.length) return asBuffer(data);
    for (let i = 0; i < n; i++) {
      const o = 12 + i * 16;
      const tag = String.fromCharCode(b[o], b[o + 1], b[o + 2], b[o + 3]);
      if (tag === "GPOS" || tag === "kern") b[o] = b[o + 1] = b[o + 2] = b[o + 3] = 0x58; // "XXXX"
    }
    return b.buffer;
  } catch {
    return asBuffer(data);
  }
}

// Red Hat Display, loaded once per instance; a font failure degrades to sans-serif, never to an error.
const loadFonts = (async (): Promise<FontEntry[]> => {
  const out: FontEntry[] = [];
  const pick = async (weight: 900 | 700 | 500) => {
    try {
      const css = await (await fetch(`https://fonts.googleapis.com/css2?family=Red+Hat+Display:wght@${weight}`)).text();
      const url = css.match(/url\((https:[^)]+\.ttf)\)/)?.[1];
      if (!url) return;
      const r = await fetch(url);
      if (r.ok) out.push({ name: "Red Hat Display", data: stripKerning(await r.arrayBuffer()), weight, style: "normal" });
    } catch {}
  };
  await Promise.all([pick(900), pick(700), pick(500)]);
  return out;
})();

function titleCase(s: string) {
  return s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

function splitName(name: string): string[] {
  if (name.length <= 18) return [name];
  const mid = name.length / 2;
  let best = -1;
  let bestDist = Infinity;
  for (let i = 0; i < name.length; i++) {
    if (name[i] !== " ") continue;
    const dist = Math.abs(i - mid);
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  }
  if (best === -1) return [name];
  return [name.slice(0, best), name.slice(best + 1)];
}

export async function renderLandingCard(slug: string) {
  const card = await getLandingCard(slug);
  const raw = card.company.trim();
  const name = raw.length > 44 ? raw.slice(0, 44).trimEnd() + "…" : raw;
  const lines = splitName(name);
  const nameSize = name.length <= 18 ? 84 : name.length <= 30 ? 66 : 52;
  const subline = [card.trade ? titleCase(card.trade) : "", card.city].filter(Boolean).join("  ·  ");
  const monogram = (() => {
    const parts = raw.split(" ").filter(Boolean);
    return parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : raw.slice(0, 2).toUpperCase();
  })();

  const fonts = await loadFonts;
  const hasRHD = fonts.length > 0;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          background: "#FFFFFF",
          fontFamily: hasRHD ? "Red Hat Display" : "sans-serif",
          color: "#05070A",
        }}
      >
        {/* soft brand glow, top-right (same mood as the dashboard cards) */}
        <div
          style={{
            position: "absolute",
            right: "-160px",
            top: "-200px",
            width: "560px",
            height: "560px",
            borderRadius: "9999px",
            background: "rgba(10,132,255,0.07)",
            display: "flex",
          }}
        />

        {/* header: wordmark + pill */}
        <div style={{ display: "flex", flexDirection: "column", padding: "56px 90px 0 90px" }}>
          {/* Official logo file (lib/brand/logo-png.ts) — identical to the site header */}
          <img src={HOMEBIDS_LOGO_PNG.dataUrl} width={Math.round(40 * HOMEBIDS_LOGO_PNG.ratio)} height={40} alt="" />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginTop: "22px",
              padding: "12px 22px",
              borderRadius: "9999px",
              background: "#EAF3FF",
              color: "#0A84FF",
              fontSize: "22px",
              fontWeight: 700,
              letterSpacing: "0.12em",
              alignSelf: "flex-start",
            }}
          >
            <div
              style={{
                width: "26px",
                height: "26px",
                borderRadius: "9999px",
                background: "#0A84FF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* check mark as a path — Red Hat Display has no ✓ glyph */}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M4 12.5l5 5L20 6.5" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            GET AN ESTIMATE BY TEXT
          </div>
        </div>

        {/* contractor block */}
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", padding: "46px 90px 0 90px", gap: "34px" }}>
          {card.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={card.logoUrl}
              width={120}
              height={120}
              alt=""
              style={{ width: "120px", height: "120px", borderRadius: "28px", objectFit: "cover", border: "2px solid #E7E4DE" }}
            />
          ) : (
            <div
              style={{
                width: "120px",
                height: "120px",
                borderRadius: "28px",
                background: "#05070A",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "48px",
                fontWeight: 900,
                letterSpacing: "-0.02em",
              }}
            >
              {monogram}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", maxWidth: "860px" }}>
            <div style={{ display: "flex", flexDirection: "column", fontSize: `${nameSize}px`, fontWeight: 900, lineHeight: 0.98, letterSpacing: "-0.03em" }}>
              {lines.map((line, i) => (
                <div key={i} style={{ display: "flex" }}>
                  {line}
                </div>
              ))}
            </div>
            {subline ? (
              <div style={{ display: "flex", marginTop: "16px", fontSize: "30px", fontWeight: 500, color: "#5C6470" }}>{subline}</div>
            ) : null}
          </div>
        </div>

        {/* CTA + footer */}
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: "0 90px", marginTop: "auto", marginBottom: "52px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#0A84FF",
              color: "#FFFFFF",
              borderRadius: "22px",
              padding: "26px 44px",
              fontSize: "34px",
              fontWeight: 700,
              letterSpacing: "-0.01em",
              gap: "16px",
            }}
          >
            <div style={{ display: "flex" }}>Text for a quote</div>
            {/* arrow as a path — not relying on a → glyph */}
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
              <path d="M4 12h15M13 6l6 6-6 6" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", color: "#5C6470", fontSize: "22px", fontWeight: 500 }}>
            <div style={{ display: "flex" }}>Real quotes. Real fast.</div>
            <div style={{ display: "flex", marginTop: "6px" }}>homebids.ai/pro/{slug}</div>
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, headers: OG_CACHE, ...(fonts.length ? { fonts } : {}) },
  );
}

import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "New bid on HomeBids";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface ImageProps {
  params: Promise<{ shareToken: string }>;
}

type ProposalDetails = {
  company: string | null;
  projectTitle: string | null;
  totalPrice: number | null;
};

// Direct keyed REST fetch to the token-based RPC — no cookie client, so this
// works inside the OG route without a request scope. Mirrors app/j/[token].
async function getProposalDetails(shareToken: string): Promise<ProposalDetails | null> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const apiKey = serviceRoleKey || anonKey;

    if (!supabaseUrl || !apiKey || !shareToken) return null;

    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/get_proposal_by_share_token`, {
      method: "POST",
      headers: {
        apikey: apiKey,
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ p_token: shareToken }),
    });

    if (!response.ok) return null;

    const data = (await response.json()) as
      | { contractor_company_name?: string | null; project_title?: string | null; total_price?: number | null }
      | Array<{ contractor_company_name?: string | null; project_title?: string | null; total_price?: number | null }>
      | null;
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return null;

    return {
      company: row.contractor_company_name ?? null,
      projectTitle: row.project_title ?? null,
      totalPrice: row.total_price ?? null,
    };
  } catch {
    return null;
  }
}

type FontEntry = { name: string; data: ArrayBuffer; weight: 900; style: "normal" };

// Load Red Hat Display 900 once at module scope. The fetch is wrapped so a
// network/font failure degrades gracefully — the name still renders in sans.
const loadFonts = (async (): Promise<FontEntry[]> => {
  const out: FontEntry[] = [];
  try {
    const css = await (await fetch("https://fonts.googleapis.com/css2?family=Red+Hat+Display:wght@900")).text();
    const url = css.match(/url\((https:[^)]+\.ttf)\)/)?.[1];
    if (url) {
      const r = await fetch(url);
      if (r.ok) out.push({ name: "Red Hat Display", data: await r.arrayBuffer(), weight: 900, style: "normal" });
    }
  } catch {}
  return out;
})();

// Split a name into at most two balanced lines, breaking at the space nearest
// the midpoint. Short names and spaceless names stay on a single line.
function splitName(name: string): string[] {
  if (name.length <= 14) return [name];
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

export default async function Image({ params }: ImageProps) {
  const { shareToken } = await params;
  const proposal = await getProposalDetails(shareToken);

  const raw = (proposal?.company ?? "Your Contractor").trim();
  const name = raw.length > 40 ? raw.slice(0, 40).trimEnd() + "..." : raw;
  const nameSize = name.length <= 14 ? 76 : name.length <= 28 ? 60 : 46;
  const lines = splitName(name);

  const fonts = await loadFonts;
  const hasRHD = fonts.length > 0;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "#FFFFFF",
          fontFamily: hasRHD ? "Red Hat Display" : "sans-serif",
        }}
      >
        {/* Hosted template — everything except the name + burst is baked in */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://xfopiidfpnwfwdcjdpaj.supabase.co/storage/v1/object/public/job-photos/brand/bid-card-template.png"
          width={1200}
          height={630}
          alt=""
          style={{ position: "absolute", top: 0, left: 0, width: "1200px", height: "630px" }}
        />

        {/* Dynamic unit: company name + burst */}
        <div
          style={{
            position: "absolute",
            left: "86px",
            top: "172px",
            display: "flex",
            flexDirection: "row",
            alignItems: "flex-start",
            gap: "10px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              color: "#05070A",
              fontWeight: 900,
              fontSize: `${nameSize}px`,
              lineHeight: 0.95,
              letterSpacing: "-0.03em",
            }}
          >
            {lines.map((line, i) => (
              <div key={i} style={{ display: "flex" }}>
                {line}
              </div>
            ))}
          </div>
          <svg
            width="110"
            height="130"
            viewBox="0 0 110 130"
            style={{ display: "flex", marginTop: `${Math.round(nameSize * 0.72 - 118)}px` }}
          >
            <line x1="12" y1="80" x2="25" y2="42" stroke="#0A84FF" strokeWidth="11" strokeLinecap="round" />
            <line x1="32" y1="93" x2="63" y2="69" stroke="#0A84FF" strokeWidth="11" strokeLinecap="round" />
            <line x1="40" y1="118" x2="74" y2="118" stroke="#0A84FF" strokeWidth="11" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    ),
    { ...size, ...(fonts.length ? { fonts } : {}) },
  );
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

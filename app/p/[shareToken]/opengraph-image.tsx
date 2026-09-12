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

type FontWeight = 500 | 600 | 700 | 800 | 900;
type FontEntry = { name: string; data: ArrayBuffer; weight: FontWeight; style: "normal" };

// Load fonts once at module scope. Every fetch is wrapped so a network/font
// failure degrades gracefully — the card still renders with sans-serif.
const loadFonts = (async (): Promise<FontEntry[]> => {
  const out: FontEntry[] = [];
  const grab = async (cssUrl: string, name: string, weights: FontWeight[]) => {
    try {
      const css = await (await fetch(cssUrl)).text();
      for (const w of weights) {
        const block = css.split("@font-face").find((b) => b.includes(`font-weight: ${w}`));
        const url = block?.match(/url\((https:[^)]+\.ttf)\)/)?.[1];
        if (!url) continue;
        const r = await fetch(url);
        if (!r.ok) continue;
        out.push({ name, data: await r.arrayBuffer(), weight: w, style: "normal" });
      }
    } catch {}
  };
  await grab(
    "https://fonts.googleapis.com/css2?family=Red+Hat+Display:wght@500;600;700;800;900",
    "Red Hat Display",
    [500, 600, 700, 800, 900],
  );
  await grab("https://fonts.googleapis.com/css2?family=Caveat:wght@700", "Caveat", [700]);
  return out;
})();

export default async function Image({ params }: ImageProps) {
  const { shareToken } = await params;
  const proposal = await getProposalDetails(shareToken);

  const companyRaw = proposal?.company ?? "Your Contractor";
  // Allow wrapping to two lines; truncate very long names.
  const company = companyRaw.length > 44 ? `${companyRaw.slice(0, 44)}...` : companyRaw;
  // Scale the name down as it gets longer so it never overflows the column.
  const nameSize = company.length <= 20 ? 68 : company.length <= 30 ? 52 : 44;
  const projectTitle = proposal?.projectTitle ?? "Project bid";
  // Price is masked in the share card — never expose the numeric amount.
  const hasPrice = proposal?.totalPrice != null;

  const fonts = await loadFonts;
  const hasRHD = fonts.some((f) => f.name === "Red Hat Display");
  const hasCaveat = fonts.some((f) => f.name === "Caveat");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: "16px",
          background: "#FFFFFF",
          padding: "40px 84px",
          fontFamily: hasRHD ? "Red Hat Display" : "sans-serif",
        }}
      >
        {/* Main column (left) */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "20px" }}>
          {/* 1. Wordmark */}
          <div style={{ display: "flex", fontSize: 42, fontWeight: 700, lineHeight: 1 }}>
            <span style={{ color: "#0A84FF" }}>HOME</span>
            <span style={{ color: "#05070A" }}>BIDS</span>
            {hasRHD ? (
              <span style={{ display: "flex", fontSize: 20, fontWeight: 700, color: "#05070A", marginTop: "2px", marginLeft: "2px" }}>
                ™
              </span>
            ) : null}
          </div>

          {/* 2. Pill */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              background: "#EAF3FF",
              borderRadius: "999px",
              height: "48px",
              padding: "0 26px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "30px",
                height: "30px",
                borderRadius: "999px",
                background: "#0A84FF",
              }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div style={{ display: "flex", color: "#0A84FF", fontWeight: 700, fontSize: 20, letterSpacing: "0.16em" }}>
              NEW BID RECEIVED
            </div>
          </div>

          {/* 3. Company name + burst */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
            <div
              style={{
                display: "flex",
                color: "#05070A",
                fontWeight: 900,
                fontSize: nameSize,
                letterSpacing: "-0.03em",
                lineHeight: 1.0,
                maxWidth: "720px",
              }}
            >
              {company}
            </div>
            <svg style={{ marginTop: "-10px" }} width="100" height="90" viewBox="0 0 100 90" fill="none">
              <line x1="12" y1="72" x2="30" y2="46" stroke="#0A84FF" strokeWidth="10" strokeLinecap="round" />
              <line x1="44" y1="58" x2="54" y2="26" stroke="#0A84FF" strokeWidth="10" strokeLinecap="round" />
              <line x1="70" y1="62" x2="90" y2="50" stroke="#0A84FF" strokeWidth="10" strokeLinecap="round" />
            </svg>
          </div>

          {/* 4. Subline */}
          <div style={{ display: "flex", color: "#858990", fontSize: 40, fontWeight: 600 }}>
            sent you a bid.
          </div>

          {/* 5. Price teaser + doodles */}
          <div style={{ display: "flex", flexDirection: "row", alignItems: "center", position: "relative" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "22px",
              width: "560px",
              height: "104px",
              background: "#F6F7F8",
              borderRadius: "20px",
              padding: "0 28px",
            }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m14.5 5.5-2 2" />
              <path d="M12.5 7.5 4 16a2.12 2.12 0 0 0 3 3l8.5-8.5" />
              <path d="M17.64 15 22 10.64" />
              <path d="m20.91 11.7-1.25-1.25c-.6-.6-.93-1.4-.93-2.25v-.86L16.01 4.6a5.56 5.56 0 0 0-3.94-1.64H9l.92.82A6.18 6.18 0 0 1 12 8.4v1.56l2 2h.86c.85 0 1.65.34 2.25.93l1.25 1.25" />
            </svg>
            {hasPrice ? (
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div style={{ display: "flex", color: "#858990", fontWeight: 600, fontSize: 19, letterSpacing: "0.08em" }}>
                  TOTAL ESTIMATE
                </div>
                <div style={{ display: "flex", alignItems: "center", marginTop: "8px" }}>
                  <div style={{ display: "flex", color: "#858990", fontWeight: 700, fontSize: 32 }}>$</div>
                  <div style={{ display: "flex", width: "16px", height: "16px", borderRadius: "999px", background: "#9AA0A6", marginLeft: "8px" }} />
                  <div style={{ display: "flex", width: "16px", height: "16px", borderRadius: "999px", background: "#9AA0A6", marginLeft: "8px" }} />
                  <div style={{ display: "flex", width: "16px", height: "16px", borderRadius: "999px", background: "#9AA0A6", marginLeft: "8px" }} />
                  <div style={{ display: "flex", width: "16px", height: "16px", borderRadius: "999px", background: "#9AA0A6", marginLeft: "8px" }} />
                  <div style={{ display: "flex", width: "16px", height: "16px", borderRadius: "999px", background: "#9AA0A6", marginLeft: "8px" }} />
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", color: "#05070A", fontWeight: 700, fontSize: 30 }}>{projectTitle}</div>
            )}
          </div>
          {hasCaveat ? (
            <div style={{ position: "absolute", left: "600px", top: "-118px", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "6px" }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  fontFamily: "Caveat",
                  fontWeight: 700,
                  fontSize: "38px",
                  color: "#05070A",
                  transform: "rotate(-4deg)",
                  lineHeight: 1.25,
                }}
              >
                <div style={{ display: "flex" }}>Real bids.</div>
                <div style={{ display: "flex" }}>Real contractors.</div>
                <div style={{ display: "flex" }}>Real fast.</div>
              </div>
              <svg style={{ marginLeft: "-48px" }} width="150" height="110" viewBox="0 0 150 110" fill="none" stroke="#05070A" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M138 8 C 118 66, 76 96, 14 84" />
                <polyline points="38,70 14,84 40,98" />
              </svg>
            </div>
          ) : null}
          </div>

          {/* 6. CTA */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              width: "560px",
              height: "84px",
              background: "#0A84FF",
              borderRadius: "22px",
            }}
          >
            <div style={{ display: "flex", color: "#FFFFFF", fontWeight: 700, fontSize: 32 }}>View Your Bid</div>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="12" x2="20" y2="12" />
              <polyline points="13 5 20 12 13 19" />
            </svg>
          </div>

          {/* 7. Footer */}
          <div style={{ display: "flex", color: "#858990", fontSize: 17, fontWeight: 500 }}>
            Powered by HomeBids
          </div>
        </div>
      </div>
    ),
    { ...size, ...(fonts.length ? { fonts } : {}) },
  );
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

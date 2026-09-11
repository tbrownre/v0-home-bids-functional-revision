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

export default async function Image({ params }: ImageProps) {
  const { shareToken } = await params;
  const proposal = await getProposalDetails(shareToken);

  const companyRaw = proposal?.company ?? "Your Contractor";
  // Keep the name on a single line — truncate very long names.
  const company = companyRaw.length > 24 ? `${companyRaw.slice(0, 24)}...` : companyRaw;
  const projectTitle = proposal?.projectTitle ?? "Project bid";
  const price =
    proposal?.totalPrice != null
      ? `$${Math.round(proposal.totalPrice).toLocaleString("en-US")}`
      : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          gap: "22px",
          background: "#FFFFFF",
          padding: "40px 72px",
          fontFamily: "sans-serif",
        }}
      >
        {/* 1. Wordmark */}
        <div style={{ display: "flex", alignItems: "flex-start", fontSize: 44, fontWeight: 800, lineHeight: 1 }}>
          <span style={{ color: "#0A84FF" }}>HOME</span>
          <span style={{ color: "#111111" }}>BIDS</span>
        </div>

        {/* 2. Pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            background: "#E7F0FE",
            borderRadius: "999px",
            padding: "8px 22px",
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
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div style={{ display: "flex", color: "#0A84FF", fontWeight: 800, letterSpacing: "0.14em", fontSize: 20 }}>
            NEW BID RECEIVED
          </div>
        </div>

        {/* 3. Company name */}
        <div
          style={{
            display: "flex",
            textAlign: "center",
            color: "#111111",
            fontWeight: 800,
            fontSize: 60,
            lineHeight: 1.05,
            maxWidth: "1000px",
            whiteSpace: "nowrap",
          }}
        >
          {company}
        </div>

        {/* 4. Subline */}
        <div style={{ display: "flex", color: "#6B7280", fontSize: 32, fontWeight: 500 }}>
          sent you a bid.
        </div>

        {/* 5. Info box */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "28px",
            background: "#F3F4F6",
            borderRadius: "24px",
            padding: "20px 32px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "72px",
              height: "72px",
              borderRadius: "18px",
              background: "#E5E7EB",
            }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m14.5 5.5-2 2" />
              <path d="M12.5 7.5 4 16a2.12 2.12 0 0 0 3 3l8.5-8.5" />
              <path d="M17.64 15 22 10.64" />
              <path d="m20.91 11.7-1.25-1.25c-.6-.6-.93-1.4-.93-2.25v-.86L16.01 4.6a5.56 5.56 0 0 0-3.94-1.64H9l.92.82A6.18 6.18 0 0 1 12 8.4v1.56l2 2h.86c.85 0 1.65.34 2.25.93l1.25 1.25" />
            </svg>
          </div>
          <div style={{ display: "flex", width: "2px", height: "64px", background: "#D1D5DB" }} />
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ display: "flex", color: "#111111", fontWeight: 700, fontSize: 32 }}>{projectTitle}</div>
            {price ? (
              <div style={{ display: "flex", color: "#6B7280", fontWeight: 700, fontSize: 26, marginTop: "8px" }}>{price}</div>
            ) : null}
          </div>
        </div>

        {/* 6. Button look */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            background: "#0A84FF",
            color: "#FFFFFF",
            borderRadius: "999px",
            padding: "16px 56px",
            fontWeight: 700,
            fontSize: 30,
          }}
        >
          View Your Bid
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="12" x2="20" y2="12" />
            <polyline points="13 5 20 12 13 19" />
          </svg>
        </div>

        {/* 7. Footer */}
        <div style={{ display: "flex", color: "#9CA3AF", fontSize: 20 }}>
          Powered by HomeBids
        </div>
      </div>
    ),
    { ...size },
  );
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

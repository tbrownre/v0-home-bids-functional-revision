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

  const company = proposal?.company ?? "Your Contractor";
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
          justifyContent: "space-between",
          background: "#0B0F1A",
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div
            style={{
              fontSize: 34,
              fontWeight: 800,
              letterSpacing: "0.14em",
              color: "#FFFFFF",
            }}
          >
            HOMEBIDS
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "#0A84FF",
              color: "#FFFFFF",
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "0.08em",
              padding: "8px 18px",
              borderRadius: "999px",
            }}
          >
            NEW BID
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ fontSize: 68, fontWeight: 800, color: "#FFFFFF", lineHeight: 1.05 }}>
            {company}
          </div>
          <div style={{ fontSize: 40, color: "#A7B0C0", lineHeight: 1.15 }}>
            {projectTitle}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          {price ? (
            <div style={{ fontSize: 56, fontWeight: 800, color: "#34C759" }}>{price}</div>
          ) : (
            <div />
          )}
          <div style={{ fontSize: 26, color: "#6B7688" }}>homebids.ai</div>
        </div>
      </div>
    ),
    { ...size },
  );
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

import { ImageResponse } from "next/og";
import { getProposalByShareToken } from "@/lib/supabase/proposals";

export const runtime = "nodejs";
export const alt = "New bid on HomeBids";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: { shareToken: string } }) {
  const { proposal } = await getProposalByShareToken(params.shareToken);

  const company = proposal?.contractor_company_name ?? "Your Contractor";
  const projectTitle = proposal?.project_title ?? "Project bid";
  const price =
    proposal?.total_price != null
      ? `$${Math.round(proposal.total_price).toLocaleString("en-US")}`
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

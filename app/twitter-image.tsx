import { ImageResponse } from "next/og";

// Using nodejs runtime for stable deployment
export const runtime = "nodejs";

export const alt = "HomeBids - Better bids. Better homes.";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          backgroundColor: "#ffffff",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <span
            style={{
              fontSize: 96,
              fontWeight: 300,
              letterSpacing: "0.15em",
              color: "#1a1a1a",
            }}
          >
            HOME
          </span>
          <span
            style={{
              fontSize: 96,
              fontWeight: 300,
              letterSpacing: "0.15em",
              color: "#9ca3af",
            }}
          >
            BIDS
          </span>
        </div>
        <span
          style={{
            fontSize: 28,
            fontWeight: 400,
            letterSpacing: "0.05em",
            color: "#6b7280",
            marginTop: 24,
          }}
        >
          Better bids. Better homes.
        </span>
      </div>
    ),
    {
      ...size,
    }
  );
}

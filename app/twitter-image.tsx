import { ImageResponse } from "@vercel/og";

export const runtime = "edge";
export const alt = "HomeBids - Better bids. Better homes.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#FAFAFA",
          gap: "28px",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        {/* Wordmark: HOME in blue + BIDS in black */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0px",
            fontSize: "120px",
            fontWeight: 800,
            letterSpacing: "-3px",
            lineHeight: 1,
          }}
        >
          <span style={{ color: "#0A84FF" }}>HOME</span>
          <span style={{ color: "#000000" }}>BIDS</span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: "42px",
            fontWeight: 500,
            color: "#616161",
            letterSpacing: "-0.5px",
            lineHeight: 1,
          }}
        >
          Better bids. Better homes.
        </div>
      </div>
    ),
    size
  );
}

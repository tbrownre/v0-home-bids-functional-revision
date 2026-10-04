import { ImageResponse } from "@vercel/og";
import { HOMEBIDS_LOGO_PNG } from "@/lib/brand/logo-png";

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
        {/* Official logo file (lib/brand/logo-png.ts) — same image as the site header */}
        <img src={HOMEBIDS_LOGO_PNG.dataUrl} width={Math.round(132 * HOMEBIDS_LOGO_PNG.ratio)} height={132} alt="" />

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

import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";

export const alt = "HomeBids - Better bids. Better homes.";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

// Logo native dimensions: 2100 × 1097 (aspect ratio ≈ 1.913)
const LOGO_NATIVE_W = 2100;
const LOGO_NATIVE_H = 1097;

export default async function Image() {
  const logoData = await readFile(
    join(process.cwd(), "public/images/homebids-logo-new.png")
  );
  const logoBase64 = `data:image/png;base64,${logoData.toString("base64")}`;

  const logoWidth = 860;
  const logoHeight = Math.round(logoWidth * (LOGO_NATIVE_H / LOGO_NATIVE_W));

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "1200px",
          height: "630px",
          backgroundColor: "#ffffff",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoBase64}
          width={logoWidth}
          height={logoHeight}
          alt="HomeBids"
          style={{
            objectFit: "contain",
            display: "block",
            flexShrink: 0,
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: "20px",
            fontSize: "40px",
            fontWeight: 600,
            color: "#0A84FF",
            letterSpacing: "-0.02em",
            fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
            lineHeight: 1,
            whiteSpace: "nowrap",
          }}
        >
          Better bids. Better homes.
        </div>
      </div>
    ),
    { ...size }
  );
}

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

// Logo native dimensions: 2100 × 1097
const LOGO_NATIVE_W = 2100;
const LOGO_NATIVE_H = 1097;

export default async function Image() {
  const logoData = await readFile(
    join(process.cwd(), "public/images/homebids-logo-new.png")
  );
  const logoBase64 = `data:image/png;base64,${logoData.toString("base64")}`;

  // Scale logo to ~980px wide — approximately 2.5× the previous 700px size.
  // This keeps it within safe 40px horizontal margins (1200 - 980) / 2 = 110px each side.
  const logoWidth = 980;
  const logoHeight = Math.round(logoWidth * (LOGO_NATIVE_H / LOGO_NATIVE_W)); // ≈ 512px

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
          gap: "0px",
        }}
      >
        {/* Logo — dominant focal point */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoBase64}
          width={logoWidth}
          height={logoHeight}
          alt="HomeBids"
          style={{ objectFit: "contain", display: "block" }}
        />

        {/* Tagline — brand blue, positioned cleanly below the logo */}
        <p
          style={{
            margin: "0",
            marginTop: "12px",
            fontSize: "36px",
            fontWeight: 600,
            color: "#0A84FF",
            letterSpacing: "-0.01em",
            fontFamily: "system-ui, -apple-system, sans-serif",
            lineHeight: 1,
          }}
        >
          Better bids. Better homes.
        </p>
      </div>
    ),
    { ...size }
  );
}

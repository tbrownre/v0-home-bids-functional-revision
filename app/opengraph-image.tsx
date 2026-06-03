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

export default async function Image() {
  // Read the logo from the public directory at build/request time
  const logoData = await readFile(
    join(process.cwd(), "public/images/homebids-logo-new.png")
  );
  const logoBase64 = `data:image/png;base64,${logoData.toString("base64")}`;

  // Logo is 2100×1097. Fit within a 700px wide safe zone at center.
  // Height = 700 * (1097 / 2100) ≈ 366px — well within the 630px canvas.
  const logoWidth = 700;
  const logoHeight = Math.round(700 * (1097 / 2100));

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          backgroundColor: "#ffffff",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoBase64}
          width={logoWidth}
          height={logoHeight}
          alt="HomeBids"
          style={{ objectFit: "contain" }}
        />
      </div>
    ),
    { ...size }
  );
}

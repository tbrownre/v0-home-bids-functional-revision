import { ImageResponse } from "next/og";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const alt = "HomeBids job share";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface ImageProps {
  params: Promise<{ token: string }>;
}

function getCity(location: string | null, title: string | null): string {
  const source = location || title || "";
  const match = source.match(/(?:in|near|of)\s+([A-Za-z][A-Za-z .'-]+?)(?:,\s*[A-Z]{2}|\s+AZ|$)/i);
  if (match?.[1]) return match[1].trim();

  const commaCity = source.match(/,\s*([^,]+?)(?:,\s*[A-Z]{2}|$)/);
  if (commaCity?.[1]) return commaCity[1].trim();

  return "your area";
}

async function getJobDetails(token: string) {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("jobs")
      .select("category, location, title")
      .eq("share_token", token)
      .maybeSingle();

    return {
      trade: data?.category?.trim().toLowerCase() || "a local pro",
      city: getCity(data?.location, data?.title),
    };
  } catch {
    return { trade: "a local pro", city: "your area" };
  }
}

export default async function Image({ params }: ImageProps) {
  const { token } = await params;
  const { trade, city } = await getJobDetails(token);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "54px 72px 42px",
          backgroundColor: "#FAFAFB",
          color: "#111111",
          fontFamily: "Arial, Helvetica, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: "360px",
            height: "360px",
            borderRadius: "0 0 360px 0",
            backgroundColor: "#E7F0FE",
            top: 0,
            left: 0,
          }}
        />
        <div
          style={{
            position: "absolute",
            width: "360px",
            height: "360px",
            borderRadius: "360px 0 0 0",
            backgroundColor: "#E7F0FE",
            bottom: 0,
            right: 0,
          }}
        />

        <div
          style={{
            display: "flex",
            fontSize: "42px",
            fontWeight: 800,
            letterSpacing: "7px",
            zIndex: 1,
          }}
        >
          <span style={{ color: "#0A84FF" }}>HOME</span>
          <span style={{ color: "#111111" }}>BIDS</span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            fontSize: "88px",
            fontWeight: 800,
            lineHeight: 1.08,
            letterSpacing: "-3px",
            zIndex: 1,
          }}
        >
          <div>Looking for a</div>
          <div style={{ color: "#0A84FF" }}>{trade} in {city}?</div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "10px",
            zIndex: 1,
          }}
        >
          <div style={{ display: "flex", fontSize: "18px", letterSpacing: "5px", fontWeight: 700 }}>
            <span style={{ color: "#666666" }}>POWERED BY </span>
            <span style={{ color: "#0A84FF" }}>HOMEBIDS.AI</span>
          </div>
          <div style={{ color: "#777777", fontSize: "24px" }}>Better bids. Better homes.</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

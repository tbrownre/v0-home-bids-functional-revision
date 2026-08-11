import { ImageResponse } from "next/og";

export const alt = "HomeBids job share";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface ImageProps {
  params: Promise<{ token: string }>;
}

type JobDetails = {
  firstName: string;
  trade: string;
  city: string;
};

const fallback: JobDetails = {
  firstName: "A homeowner",
  trade: "local pro",
  city: "your area",
};

function titleCase(value: string): string {
  return value.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

function getCity(location: string | null, _title: string | null): string {
  const city = location?.split(",")[0]?.trim();
  return city || fallback.city;
}

async function getJobDetails(token: string): Promise<JobDetails> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const apiKey = serviceRoleKey || anonKey;

    if (!supabaseUrl || !apiKey || !token) return fallback;

    const response = await fetch(
      `${supabaseUrl}/rest/v1/jobs?select=category,title,location,homeowner_id,profiles(full_name)&share_token=eq.${encodeURIComponent(token)}`,
      {
        headers: {
          apikey: apiKey,
          Authorization: `Bearer ${apiKey}`,
        },
      },
    );

    if (!response.ok) return fallback;

    const rows = (await response.json()) as Array<{
      category?: string | null;
      title?: string | null;
      location?: string | null;
      profiles?: { full_name?: string | null } | Array<{ full_name?: string | null }> | null;
    }>;
    const job = rows[0];

    if (!job) return fallback;

    const profile = Array.isArray(job.profiles) ? job.profiles[0] : job.profiles;
    const firstName = profile?.full_name?.trim().split(/\s+/)[0] || fallback.firstName;
    const rawTrade = job.category?.trim();

    return {
      firstName,
      trade: rawTrade ? titleCase(rawTrade) : fallback.trade,
      city: getCity(job.location ?? null, job.title ?? null),
    };
  } catch {
    return fallback;
  }
}

function renderCard({ firstName, trade, city }: JobDetails) {
  const firstLine = `${firstName} is looking for`;
  const firstLineFontSize = firstLine.length > 20 ? 70 : 84;
  const secondLine = `a ${trade} in ${city}`;
  const secondLineFontSize = secondLine.length > 26 ? 70 : 84;

  return (
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
        fontFamily: "sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", position: "absolute", width: "420px", height: "420px", borderRadius: "50%", backgroundColor: "#E7F0FE", top: "-210px", left: "-210px" }} />
      <div style={{ display: "flex", position: "absolute", width: "420px", height: "420px", borderRadius: "50%", backgroundColor: "#E7F0FE", bottom: "-210px", right: "-210px" }} />

      <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", fontSize: 42, fontWeight: 800, zIndex: 1 }}>
        <div style={{ display: "flex", color: "#0A84FF", letterSpacing: 7 }}>HOME</div>
        <div style={{ display: "flex", color: "#111111", letterSpacing: 7 }}>BIDS</div>
      </div>

      <div style={{ display: "flex", width: "100%", maxWidth: "1060px", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", zIndex: 1 }}>
        <div style={{ display: "flex", width: "100%", justifyContent: "center", textAlign: "center", color: "#111111", fontSize: firstLineFontSize, fontWeight: 800, lineHeight: 1.08 }}>{firstLine}</div>
        <div style={{ display: "flex", width: "100%", justifyContent: "center", textAlign: "center", color: "#0A84FF", fontSize: secondLineFontSize, fontWeight: 800, lineHeight: 1.08 }}>{secondLine}</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, zIndex: 1 }}>
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, fontSize: 18, fontWeight: 700 }}>
          <div style={{ display: "flex", color: "#666666", letterSpacing: 5 }}>POWERED BY</div>
          <div style={{ display: "flex", color: "#0A84FF", letterSpacing: 5 }}>HOMEBIDS.AI</div>
        </div>
        <div style={{ display: "flex", color: "#777777", fontSize: 24, fontWeight: 400 }}>Better bids. Better homes.</div>
      </div>
    </div>
  );
}

export default async function Image({ params }: ImageProps) {
  try {
    const { token } = await params;
    const details = await getJobDetails(token);
    return new ImageResponse(renderCard(details), { width: 1200, height: 630 });
  } catch {
    return new ImageResponse(renderCard(fallback), { width: 1200, height: 630 });
  }
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";

const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 30; // 30 min

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") || "";

  if (q.length < 2) {
    return NextResponse.json([]);
  }

  const cacheKey = q.toLowerCase().trim();
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data, {
      headers: { "X-Cache": "HIT", "Cache-Control": "public, max-age=1800" },
    });
  }

  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", q);
    url.searchParams.set("format", "json");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("countrycodes", "us");
    url.searchParams.set("limit", "8");
    url.searchParams.set("dedupe", "1");

    const res = await fetch(url.toString(), {
      headers: {
        "User-Agent": "HomeBids/1.0 (https://homebids.io)",
        "Accept-Language": "en-US,en",
      },
    });

    if (!res.ok) {
      return NextResponse.json([], { status: 502 });
    }

    const data = await res.json();

    cache.set(cacheKey, { data, timestamp: Date.now() });

    // Evict old entries
    if (cache.size > 500) {
      const now = Date.now();
      for (const [key, val] of cache) {
        if (now - val.timestamp > CACHE_TTL) cache.delete(key);
      }
    }

    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, max-age=1800" },
    });
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}

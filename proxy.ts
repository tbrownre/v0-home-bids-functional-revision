import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  try {
    return await updateSession(request);
  } catch {
    // If Supabase env vars are missing or the session check throws, allow the
    // request to proceed rather than returning a 502. Public pages and the
    // sign-in flow will still work; protected routes will simply not be
    // guarded until the env vars are set correctly.
    return NextResponse.next({ request });
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}

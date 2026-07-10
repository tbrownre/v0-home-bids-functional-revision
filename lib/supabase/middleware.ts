import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Routes that require an authenticated user. Everything else is public
 * (marketing pages, contractor signup, SMS demo flows, etc.).
 */
const PROTECTED_PREFIXES = ["/contractors/dashboard", "/contractors/jobs", "/profile", "/admin"];

/** Auth pages a signed-in user should be bounced away from. */
const AUTH_PREFIXES = ["/auth/sign-in", "/auth/sign-up", "/signup"];

function startsWithAny(pathname: string, prefixes: string[]) {
  return prefixes.some((p) => pathname === p || pathname.startsWith(p + "/") || pathname.startsWith(p));
}

export async function updateSession(request: NextRequest) {
  // If Supabase env vars are not configured (e.g. preview deploys without
  // secrets), skip all auth logic and let the request pass through. This
  // prevents a 502 ROUTER_EXTERNAL_TARGET_ERROR on the Edge runtime.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: do not run code between createServerClient and getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Logged-out users hitting a protected route → clean redirect to sign-in.
  if (!user && startsWithAny(pathname, PROTECTED_PREFIXES)) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/sign-in";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Signed-in users visiting an auth page → send them to the right home.
  if (user && startsWithAny(pathname, AUTH_PREFIXES)) {
    const url = request.nextUrl.clone();
    url.search = "";
    url.pathname =
      user.user_metadata?.user_type === "contractor" ? "/contractors/dashboard" : "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

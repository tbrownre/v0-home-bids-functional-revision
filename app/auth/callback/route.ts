import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { lastLoginCookieValue, LAST_LOGIN_COOKIE, LAST_LOGIN_COOKIE_MAX_AGE } from "@/lib/auth-options";

/**
 * FASTSIGNIN (Tim, Oct 7): where Supabase sends the browser back after
 *   - Sign in with Google / Apple            (?code=…&via=google|apple)
 *   - a magic link that uses {{ .ConfirmationURL }} (?code=…&via=magic)
 * We swap the one-time code for a session (cookies), work out who this is, and send them on:
 *   contractor/admin → the deep-link target (?next=… or the hb_next cookie) or the dashboard
 *   homeowner        → their dashboard
 *   nobody           → signed out again + sign-in page with a notice (social login never creates a
 *                      HomeBids account by itself — the contractor sign-up flow does that).
 * The device remembers how they got in through the hb_last_login cookie (the sign-in page reads it).
 */

function safeNext(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (!/^\/(?!\/)[A-Za-z0-9\-._~/?&=%]*$/.test(raw)) return null;
  if (!raw.startsWith("/contractors/") && !raw.startsWith("/admin")) return null;
  return raw;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const via = searchParams.get("via") ?? "password";
  const cookieStore = await cookies();
  const next = safeNext(searchParams.get("next")) ?? safeNext(cookieStore.get("hb_next")?.value ? decodeURIComponent(cookieStore.get("hb_next")!.value) : null);

  const back = (notice: string) => {
    const res = NextResponse.redirect(`${origin}/auth/sign-in?notice=${notice}`);
    res.cookies.set("hb_next", "", { maxAge: 0, path: "/" });
    return res;
  };

  // Supabase reports provider errors on the query string (user cancelled, provider misconfigured…)
  if (searchParams.get("error") || !code) {
    return back(searchParams.get("error_code") === "otp_expired" ? "link-expired" : "link-invalid");
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    },
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    return back(/expired/i.test(error?.message ?? "") ? "link-expired" : "link-invalid");
  }

  // Who is this? profiles.user_type is the source of truth; metadata is the fallback for brand-new rows.
  let userType: string | null = null;
  let fullName: string | null = null;
  try {
    const { data: profile } = await supabase.from("profiles").select("user_type, full_name").eq("id", data.user.id).maybeSingle();
    const p = profile as { user_type?: string | null; full_name?: string | null } | null;
    userType = p?.user_type ?? null;
    fullName = p?.full_name ?? null;
  } catch {
    /* fall through to metadata */
  }
  if (!userType) userType = (data.user.user_metadata?.user_type as string | undefined) ?? null;

  const hasAccount = userType === "contractor" || userType === "admin" || userType === "homeowner";
  if (!hasAccount && (via === "google" || via === "apple")) {
    // A Google/Apple identity with no HomeBids profile: don't leave a half-account signed in.
    await supabase.auth.signOut();
    return back("no-account");
  }

  const isPro = userType === "contractor" || userType === "admin";
  const target = isPro && next ? next : isPro ? (userType === "admin" ? "/admin/links" : "/contractors/dashboard") : "/homeowners/dashboard";
  const res = NextResponse.redirect(`${origin}${target}`);
  res.cookies.set("hb_next", "", { maxAge: 0, path: "/" });
  // this device now opens on "Welcome back" with the same method as the primary button
  const method = via === "google" || via === "apple" || via === "magic" ? via : "password";
  if (data.user.email) {
    res.cookies.set(LAST_LOGIN_COOKIE, lastLoginCookieValue({ email: data.user.email, name: fullName ?? (data.user.user_metadata?.full_name as string | undefined) ?? null, method }), {
      maxAge: LAST_LOGIN_COOKIE_MAX_AGE,
      path: "/",
      sameSite: "lax",
      secure: origin.startsWith("https://"),
    });
  }
  return res;
}

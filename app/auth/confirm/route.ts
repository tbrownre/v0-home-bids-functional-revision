import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { lastLoginCookieValue, LAST_LOGIN_COOKIE, LAST_LOGIN_COOKIE_MAX_AGE } from "@/lib/auth-options";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const cookieStore = await cookies();
  // FASTSIGNIN (Tim, Oct 7): magic-link emails that use {{ .TokenHash }} land here. The device that asked for
  // the link may not be the one opening the email, so the deep-link target also rides in the hb_next cookie.
  const isMagic = type === "magiclink" || type === "email";
  const safeNext = (raw: string | null | undefined) =>
    raw && /^\/(?!\/)[A-Za-z0-9\-._~/?&=%]*$/.test(raw) && (raw.startsWith("/contractors/") || raw.startsWith("/admin")) ? raw : null;
  // next param lets deep-linking override default redirect
  const next = safeNext(searchParams.get("next")) ?? (isMagic ? safeNext(cookieStore.get("hb_next")?.value ? decodeURIComponent(cookieStore.get("hb_next")!.value) : null) : null);

  // Invalid / missing params — send to error page
  if (!token_hash || !type) {
    return NextResponse.redirect(
      isMagic ? `${origin}/auth/sign-in?notice=link-invalid` : `${origin}/auth/verify-email?status=invalid`
    );
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
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { data, error } = await supabase.auth.verifyOtp({
    type,
    token_hash,
  });

  if (error || !data.user) {
    // Expired or already-used link
    return NextResponse.redirect(
      isMagic ? `${origin}/auth/sign-in?notice=link-expired` : `${origin}/auth/verify-email?status=expired`
    );
  }

  // Successful confirmation — determine where to send user
  let userType: string = data.user.user_metadata?.user_type ?? "homeowner";
  if (isMagic) {
    // profiles.user_type is the source of truth for existing accounts (metadata can be stale/empty)
    let fullName: string | null = null;
    try {
      const { data: profile } = await supabase.from("profiles").select("user_type, full_name").eq("id", data.user.id).maybeSingle();
      const p = profile as { user_type?: string | null; full_name?: string | null } | null;
      if (p?.user_type) userType = p.user_type;
      fullName = p?.full_name ?? null;
    } catch {
      /* keep metadata value */
    }
    const isPro = userType === "contractor" || userType === "admin";
    const target = isPro && next ? next : isPro ? (userType === "admin" ? "/admin/links" : "/contractors/dashboard") : "/homeowners/dashboard";
    const res = NextResponse.redirect(`${origin}${target}`);
    res.cookies.set("hb_next", "", { maxAge: 0, path: "/" });
    // this device now opens on "Welcome back" with "Email me a sign-in link" as the primary path
    if (data.user.email) {
      res.cookies.set(LAST_LOGIN_COOKIE, lastLoginCookieValue({ email: data.user.email, name: fullName ?? (data.user.user_metadata?.full_name as string | undefined) ?? null, method: "magic" }), {
        maxAge: LAST_LOGIN_COOKIE_MAX_AGE,
        path: "/",
        sameSite: "lax",
        secure: origin.startsWith("https://"),
      });
    }
    return res;
  }

  if (next) {
    return NextResponse.redirect(`${origin}${next}`);
  }

  if (userType === "contractor") {
    // Middleware will check approval_status and redirect to pending/dashboard as needed
    return NextResponse.redirect(`${origin}/contractors/dashboard`);
  }

  // Homeowners land on their "Your Jobs" board.
  return NextResponse.redirect(`${origin}/jobs`);
}

import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  // next param lets deep-linking override default redirect
  const next = searchParams.get("next") ?? null;

  // Invalid / missing params — send to error page
  if (!token_hash || !type) {
    return NextResponse.redirect(
      `${origin}/auth/verify-email?status=invalid`
    );
  }

  const cookieStore = await cookies();

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
      `${origin}/auth/verify-email?status=expired`
    );
  }

  // Successful confirmation — determine where to send user
  const userType = data.user.user_metadata?.user_type ?? "homeowner";

  if (next) {
    return NextResponse.redirect(`${origin}${next}`);
  }

  if (userType === "contractor") {
    // Middleware will check approval_status and redirect to pending/dashboard as needed
    return NextResponse.redirect(`${origin}/contractors/dashboard`);
  }

  return NextResponse.redirect(`${origin}/?showJobs=true`);
}

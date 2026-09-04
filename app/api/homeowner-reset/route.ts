import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

/**
 * POST /api/homeowner-reset  { phone }
 *
 * Server-only password-recovery kickoff for homeowners, who authenticate with
 * a synthetic {1XXXXXXXXXX}@sms.homebids.ai email. Generates a Supabase
 * recovery link and queues an SMS with that link. Always returns { ok: true }
 * (except for a missing service key) so the endpoint can never be used to
 * enumerate which phone numbers have accounts.
 */
export async function POST(request: Request) {
  let phoneInput = "";
  try {
    const body = await request.json();
    phoneInput = typeof body?.phone === "string" ? body.phone : "";
  } catch {
    // Malformed body — treat as a no-op success (no enumeration signal).
    return NextResponse.json({ ok: true });
  }

  // Normalize to the 10-digit core (drops country code, formatting, etc.).
  const digits = phoneInput.replace(/\D/g, "").slice(-10);
  if (digits.length !== 10) {
    return NextResponse.json({ ok: true });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    return NextResponse.json({ error: "missing-service-key" }, { status: 500 });
  }

  const admin = createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Homeowner auth email: leading "1" + 10 digits, as stored at signup.
  const email = `1${digits}@sms.homebids.ai`;

  try {
    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: "https://www.homebids.ai/auth/reset-password" },
    });

    // No such user (or any other error) — stay neutral, no enumeration.
    if (error) {
      return NextResponse.json({ ok: true });
    }

    const actionLink = data?.properties?.action_link;
    if (actionLink) {
      const body =
        "HomeBids password reset - tap to set a new password:\n\n" +
        actionLink +
        "\n\nLink expires in 1 hour. Ignore this if you didn't request it.";
      // Queue the SMS. Swallow insert failures so the response stays neutral.
      const { error: outboxError } = await admin.from("notify_outbox").insert({
        to_number: "+1" + digits,
        from_number: "+14043952879",
        body,
        dedupe_key: "pwr-" + digits + "-" + new Date().toISOString().slice(0, 13),
      });
      if (outboxError) {
        console.error("[v0] homeowner-reset outbox insert error:", outboxError.message);
      }
    }
  } catch (err) {
    console.error("[v0] homeowner-reset error:", err);
  }

  return NextResponse.json({ ok: true });
}

import "server-only";

/**
 * CANCELFLOW (Tim, Oct 7): the one place the app sends an email from. Transactional only — today
 * that is the cancellation feedback to tim@homebids.ai. Uses Resend's REST API with no SDK; when
 * RESEND_API_KEY is not set the caller gets { sent: false } and keeps going (nothing user-facing
 * depends on the email landing — the same text is saved on the subscription row).
 *
 * Env: RESEND_API_KEY (required to send) · EMAIL_FROM (optional; default is Resend's shared sender,
 * which can only deliver to the address that owns the Resend account — fine for tim@homebids.ai).
 */
export async function sendEmail(opts: {
  to: string;
  subject: string;
  text: string;
  replyTo?: string | null;
}): Promise<{ sent: boolean; error: string | null }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { sent: false, error: "RESEND_API_KEY not set" };
  const from = process.env.EMAIL_FROM || "HomeBids <onboarding@resend.dev>";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [opts.to],
        subject: opts.subject,
        text: opts.text,
        ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
      }),
    });
    if (!res.ok) {
      const body = (await res.text().catch(() => "")).slice(0, 300);
      return { sent: false, error: `Resend ${res.status}: ${body}` };
    }
    return { sent: true, error: null };
  } catch (e) {
    return { sent: false, error: e instanceof Error ? e.message : "email failed" };
  }
}

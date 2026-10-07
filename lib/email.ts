import "server-only";

/**
 * CANCELFLOW (Tim, Oct 7): the one place the app sends an email from. Transactional only — today
 * that is the cancellation feedback to tim@homebids.ai.
 *
 * v2 (Abir, Oct 7: "we could use the n8n also"): the email goes out through n8n — the website POSTs the
 * message to the "HomeBids - Cancel Feedback" workflow (webhook `cancel-feedback`) and n8n's SMTP node
 * sends it. No new accounts or keys on the web side. If a RESEND_API_KEY is ever set, Resend is used
 * directly instead. Either way a failure here never blocks the cancellation — the same text is saved on
 * the subscription row.
 *
 * Env (all optional): CANCEL_FEEDBACK_WEBHOOK (default: the HomeBids n8n webhook) · RESEND_API_KEY · EMAIL_FROM
 */
const N8N_WEBHOOK = process.env.CANCEL_FEEDBACK_WEBHOOK || "https://vmi3163821.contaboserver.net/webhook/cancel-feedback";

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  replyTo?: string | null;
  /** Structured copy of the same facts, for the n8n workflow (optional). */
  meta?: Record<string, string | null | undefined>;
}

export async function sendEmail(msg: EmailMessage): Promise<{ sent: boolean; via: "resend" | "n8n" | null; error: string | null }> {
  const key = process.env.RESEND_API_KEY;
  if (key) {
    const from = process.env.EMAIL_FROM || "HomeBids <onboarding@resend.dev>";
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to: [msg.to], subject: msg.subject, text: msg.text, ...(msg.replyTo ? { reply_to: msg.replyTo } : {}) }),
      });
      if (res.ok) return { sent: true, via: "resend", error: null };
      const body = (await res.text().catch(() => "")).slice(0, 300);
      return { sent: false, via: "resend", error: `Resend ${res.status}: ${body}` };
    } catch (e) {
      return { sent: false, via: "resend", error: e instanceof Error ? e.message : "email failed" };
    }
  }

  // n8n: hand the message over; the workflow answers immediately and sends via its SMTP credential.
  try {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 8000);
    const res = await fetch(N8N_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: msg.to, subject: msg.subject, text: msg.text, replyTo: msg.replyTo ?? "", ...(msg.meta ?? {}) }),
      signal: ctl.signal,
    });
    clearTimeout(timer);
    if (res.ok) return { sent: true, via: "n8n", error: null };
    return { sent: false, via: "n8n", error: `n8n webhook ${res.status}` };
  } catch (e) {
    return { sent: false, via: "n8n", error: e instanceof Error ? e.message : "webhook failed" };
  }
}

import { getResendClient } from "./client";

const DEFAULT_FROM = "SneakNDrip <onboarding@resend.dev>";

export type SendEmailResult =
  | { ok: true; skipped?: boolean }
  | { ok: false; error: string };

/**
 * Sends one email via Resend. Never throws — always resolves to a discriminated
 * result so call sites can log/aggregate failures instead of losing them to an
 * unhandled rejection or a swallowed .catch(() => {}).
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  opts?: { from?: string; replyTo?: string },
): Promise<SendEmailResult> {
  const resend = getResendClient();
  if (!resend) {
    console.warn(`[email] skipped "${subject}" to ${to}: RESEND_API_KEY not set`);
    return { ok: true, skipped: true };
  }

  const from = opts?.from ?? process.env.RESEND_FROM_EMAIL ?? DEFAULT_FROM;

  try {
    const { error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
      ...(opts?.replyTo ? { replyTo: opts.replyTo } : {}),
    });
    if (error) {
      console.error(`[email] send failed "${subject}" to ${to}:`, error);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err) {
    console.error(`[email] send threw "${subject}" to ${to}:`, err);
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

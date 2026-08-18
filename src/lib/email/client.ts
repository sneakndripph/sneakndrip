import { Resend } from "resend";

let cachedClient: Resend | null | undefined;

/**
 * Singleton Resend client. Returns null when RESEND_API_KEY is unset — callers
 * (see send.ts) treat null as "email sending disabled" and skip instead of erroring.
 */
export function getResendClient(): Resend | null {
  if (cachedClient !== undefined) return cachedClient;
  const apiKey = process.env.RESEND_API_KEY;
  cachedClient = apiKey ? new Resend(apiKey) : null;
  return cachedClient;
}

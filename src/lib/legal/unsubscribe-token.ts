import { createHmac, timingSafeEqual } from "node:crypto";
import { SITE_URL } from "@/lib/constants";
import type { EmailType } from "@/lib/email/preferences";

/**
 * Signed one-click unsubscribe links for recipients who may not have (or be
 * signed in to) an account. Signatures never expire, so rotating
 * UNSUBSCRIBE_SECRET invalidates every unsubscribe link ever sent — treat it
 * as permanent.
 */
const SECRET = process.env.UNSUBSCRIBE_SECRET;
// Fail fast: without the secret no link can be signed or verified, and every
// marketing send would go out without a working unsubscribe.
if (!SECRET) throw new Error("Missing required environment variable: UNSUBSCRIBE_SECRET");

export function signUnsubscribePayload(email: string, category: EmailType): string {
  return createHmac("sha256", SECRET!).update(`${email.trim().toLowerCase()}:${category}`).digest("hex");
}

export function verifyUnsubscribePayload(email: string, category: EmailType, signature: string): boolean {
  const expected = Buffer.from(signUnsubscribePayload(email, category), "hex");
  const given = Buffer.from(signature, "hex");
  // timingSafeEqual throws on a length mismatch (and hex decoding drops bad chars).
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export function buildUnsubscribeUrl(email: string, category: EmailType): string {
  const params = new URLSearchParams({ email, category, sig: signUnsubscribePayload(email, category) });
  return `${SITE_URL}/unsubscribe?${params}`;
}

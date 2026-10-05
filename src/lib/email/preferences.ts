import { createAdminClient } from "@/lib/supabase/admin-server";

/** Marketing email categories a customer can opt out of individually. */
export const EmailType = {
  CartReminder: "cart_reminder",
  NewArrival: "new_arrival",
  RestockAlert: "restock_alert",
  Newsletter: "newsletter",
} as const;
export type EmailType = (typeof EmailType)[keyof typeof EmailType];

/** customers column that gates each email type (migration 042). */
export const PREFERENCE_COLUMNS = {
  cart_reminder: "cart_reminders_enabled",
  new_arrival: "new_arrivals_enabled",
  restock_alert: "restock_alerts_enabled",
  newsletter: "newsletter_enabled",
} as const satisfies Record<EmailType, string>;

export type PreferenceColumn = (typeof PREFERENCE_COLUMNS)[EmailType];

/**
 * Whether a marketing email of `emailType` may be sent to this customer.
 * Fails closed: a lookup error or a missing customer row returns false, since
 * a skipped promo is harmless but mailing someone who opted out is not.
 */
export async function checkCanSendEmail(customerId: string, emailType: EmailType): Promise<boolean> {
  const column = PREFERENCE_COLUMNS[emailType];
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("customers")
    .select(column)
    .eq("id", customerId)
    .maybeSingle();
  if (error || !data) return false;
  return (data as Record<PreferenceColumn, boolean>)[column] === true;
}

// Keeps each `IN (...)` filter well under PostgREST's URL length limit.
const OPT_OUT_CHUNK_SIZE = 100;

/**
 * Lowercased addresses among `emails` whose customer row has explicitly
 * turned `emailType` off. Recipients with no customer row (guest restock
 * signups, newsletter-only subscribers) are not opted out — their consent
 * lives in their own subscription table. Returns null on a lookup error so
 * the caller can skip the batch rather than mail people who opted out.
 * Compare with `optedOut.has(email.toLowerCase())`.
 */
export async function getOptedOutEmails(emails: string[], emailType: EmailType): Promise<Set<string> | null> {
  const column = PREFERENCE_COLUMNS[emailType];
  // Match both the stored spelling and its lowercase form: subscription tables
  // keep whatever casing was typed, while customers.email comes from auth.
  const candidates = [...new Set(emails.flatMap(e => [e, e.toLowerCase()]))];
  const optedOut = new Set<string>();
  if (candidates.length === 0) return optedOut;

  const admin = createAdminClient();
  for (let i = 0; i < candidates.length; i += OPT_OUT_CHUNK_SIZE) {
    const { data, error } = await admin
      .from("customers")
      .select("email")
      .in("email", candidates.slice(i, i + OPT_OUT_CHUNK_SIZE))
      .eq(column, false);
    if (error) {
      console.error(`[email-preferences] opt-out lookup failed for ${emailType}:`, error);
      return null;
    }
    for (const row of data ?? []) optedOut.add(row.email.toLowerCase());
  }
  return optedOut;
}

/**
 * Lowercased addresses among `emails` that belong to a customer account.
 * Returns null on a lookup error. Used only to shape email content (whether a
 * footer can link to account preferences), never to decide who gets mailed.
 */
export async function getCustomerEmails(emails: string[]): Promise<Set<string> | null> {
  const candidates = [...new Set(emails.flatMap(e => [e, e.toLowerCase()]))];
  const found = new Set<string>();
  if (candidates.length === 0) return found;

  const admin = createAdminClient();
  for (let i = 0; i < candidates.length; i += OPT_OUT_CHUNK_SIZE) {
    const { data, error } = await admin
      .from("customers")
      .select("email")
      .in("email", candidates.slice(i, i + OPT_OUT_CHUNK_SIZE));
    if (error) {
      console.error("[email-preferences] customer lookup failed:", error);
      return null;
    }
    for (const row of data ?? []) found.add(row.email.toLowerCase());
  }
  return found;
}

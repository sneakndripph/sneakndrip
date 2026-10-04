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

import { createAdminClient } from "@/lib/supabase/admin-server";
import { verifyUnsubscribePayload } from "@/lib/legal/unsubscribe-token";
import { EmailType, PREFERENCE_COLUMNS } from "./preferences";

export type SignedUnsubscribe = { email: string; category: EmailType };

const CATEGORIES = Object.values(EmailType) as string[];

/** Parsed email + category when `sig` is valid for them; null for any missing or tampered field. */
export function parseSignedUnsubscribe(
  email: string | null | undefined,
  category: string | null | undefined,
  sig: string | null | undefined,
): SignedUnsubscribe | null {
  if (!email || !category || !sig || !CATEGORIES.includes(category)) return null;
  if (!verifyUnsubscribePayload(email, category as EmailType, sig)) return null;
  return { email, category: category as EmailType };
}

// Case-insensitive exact match; escape LIKE wildcards (`_` is common in emails).
const ilikeExact = (email: string) => email.trim().replace(/[\\%_]/g, "\\$&");

/**
 * Applies a verified unsubscribe. Newsletter goes to newsletter_subscribers;
 * the other categories flip the customer's preference flag. A restock opt-out
 * from a guest (no customer row) has no flag to set, so their pending
 * one-shot sign-ups are deleted instead — otherwise other products they
 * signed up for would keep emailing them. Returns false on a database error.
 */
export async function applyUnsubscribe({ email, category }: SignedUnsubscribe): Promise<boolean> {
  const admin = createAdminClient();

  if (category === EmailType.Newsletter) {
    const { error } = await admin
      .from("newsletter_subscribers")
      .update({ unsubscribed_at: new Date().toISOString() })
      .ilike("email", ilikeExact(email))
      .is("unsubscribed_at", null);
    if (error) console.error("[unsubscribe] newsletter update failed:", error);
    return !error;
  }

  const { data: customers, error } = await admin
    .from("customers")
    .update({ [PREFERENCE_COLUMNS[category]]: false })
    .ilike("email", ilikeExact(email))
    .select("id");
  if (error) {
    console.error(`[unsubscribe] ${category} update failed:`, error);
    return false;
  }

  if (category === EmailType.RestockAlert && (customers ?? []).length === 0) {
    const { error: deleteError } = await admin
      .from("restock_notifications")
      .delete()
      .eq("source", "explicit")
      .ilike("email", ilikeExact(email));
    if (deleteError) {
      console.error("[unsubscribe] guest restock delete failed:", deleteError);
      return false;
    }
  }
  return true;
}

export type ResubscribeResult = {
  /** Whether a subscription was found and turned back on. */
  resubscribed: boolean;
  /** Whether the address belongs to a customer account (decides the follow-up link). */
  hasAccount: boolean;
};

/**
 * Reverses a verified unsubscribe. Never creates rows: a guest's deleted
 * restock sign-ups can't be restored, so they get resubscribed: false and are
 * pointed back to the product page. Returns null on a database error.
 */
export async function applyResubscribe({ email, category }: SignedUnsubscribe): Promise<ResubscribeResult | null> {
  const admin = createAdminClient();

  if (category === EmailType.Newsletter) {
    const { data: rows, error } = await admin
      .from("newsletter_subscribers")
      .update({ unsubscribed_at: null })
      .ilike("email", ilikeExact(email))
      .select("id");
    const { data: customer, error: customerError } = await admin
      .from("customers")
      .select("id")
      .ilike("email", ilikeExact(email))
      .maybeSingle();
    if (error || customerError) {
      console.error("[unsubscribe] newsletter resubscribe failed:", error ?? customerError);
      return null;
    }
    return { resubscribed: (rows ?? []).length > 0, hasAccount: Boolean(customer) };
  }

  const { data: customers, error } = await admin
    .from("customers")
    .update({ [PREFERENCE_COLUMNS[category]]: true })
    .ilike("email", ilikeExact(email))
    .select("id");
  if (error) {
    console.error(`[unsubscribe] ${category} resubscribe failed:`, error);
    return null;
  }
  const hasAccount = (customers ?? []).length > 0;
  return { resubscribed: hasAccount, hasAccount };
}

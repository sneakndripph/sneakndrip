import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin-server";
import { findOrHealCustomer } from "@/lib/supabase/resolve-customer";

/** How soon after the auth user is created a sign-up still counts as new (for /consent and Google sign-up). */
export const NEW_ACCOUNT_WINDOW_MS = 2 * 60_000;

/**
 * True for an account that has never accepted any Terms version and was
 * created within `windowMs`. Only new accounts are offered the sign-up
 * marketing choice, so re-consenting after a Terms change never resets an
 * existing customer's email preferences.
 */
export function isNewAccount(user: User, windowMs = NEW_ACCOUNT_WINDOW_MS): boolean {
  if (user.user_metadata?.terms_version) return false;
  return Date.now() - new Date(user.created_at).getTime() <= windowMs;
}

/**
 * Applies the marketing opt-in chosen at sign-up (user_metadata.marketing_opted_in),
 * once per account. Opted in: joins the newsletter list (re-subscribing a previously
 * unsubscribed row, as /api/newsletter/subscribe does); the customers preference flags keep their
 * default true. Opted out: turns off all four customers preference flags, leaving
 * any earlier newsletter_subscribers row alone. Accounts with no recorded choice
 * (everyone from before this flow) are skipped. marketing_choice_applied_at is set
 * only after the change succeeds, so a failure is retried on the next sign-in.
 */
export async function applyMarketingChoice(user: User): Promise<void> {
  const meta = user.user_metadata ?? {};
  const optedIn = meta.marketing_opted_in;
  if (typeof optedIn !== "boolean" || meta.marketing_choice_applied_at) return;

  const admin = createAdminClient();
  if (optedIn) {
    if (!user.email) throw new Error("marketing opt-in: user has no email");
    // Insert, or re-subscribe an existing row: ticking the box is the user's current intent.
    const { error } = await admin
      .from("newsletter_subscribers")
      .upsert({ email: user.email, unsubscribed_at: null }, { onConflict: "email" });
    if (error) throw new Error(`marketing opt-in: newsletter insert failed: ${error.message}`);
  } else {
    const customer = await findOrHealCustomer(user.id, user.email);
    if (!customer) throw new Error("marketing opt-out: customers row not found");
    const { error } = await admin
      .from("customers")
      .update({
        cart_reminders_enabled: false,
        new_arrivals_enabled: false,
        restock_alerts_enabled: false,
        newsletter_enabled: false,
      })
      .eq("id", customer.id);
    if (error) throw new Error(`marketing opt-out: preference update failed: ${error.message}`);
  }

  const { error: metaError } = await admin.auth.admin.updateUserById(user.id, {
    user_metadata: { marketing_choice_applied_at: new Date().toISOString() },
  });
  if (metaError) throw new Error(`marketing choice: metadata update failed: ${metaError.message}`);
}

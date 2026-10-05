import { createAdminClient } from "@/lib/supabase/admin-server";
import { sendEmail } from "./send";
import { newArrival } from "./templates/newArrival";
import { getOptedOutEmails, getCustomerEmails, EmailType } from "./preferences";
import { buildUnsubscribeUrl } from "@/lib/legal/unsubscribe-token";

/**
 * Announces a product to newsletter subscribers, at most once per product.
 *
 * The product is claimed first by atomically setting notified_at where it is
 * still NULL and the product is published; only the caller that wins the claim
 * sends. Repeat saves, double-clicks and concurrent admins therefore never
 * re-broadcast. Returns null when the product was not claimed (already
 * notified, unpublished, or missing). If the broadcast fails before any email
 * goes out the claim is released so it can be retried; after that it is kept,
 * since a retry would re-email the recipients who already got it.
 */
export async function sendNewArrivalBroadcast(
  productId: string,
  actorEmail: string | null,
): Promise<{ sent: number; eligible: number; optedOut: number } | null> {
  const admin = createAdminClient();

  const { data: claimed, error: claimError } = await admin
    .from("products")
    .update({ notified_at: new Date().toISOString() })
    .eq("id", productId)
    .eq("is_published", true)
    .is("notified_at", null)
    .select("name, brand, slug, images, full_payment_price");
  if (claimError) throw new Error(`new-arrival claim failed: ${claimError.message}`);
  const product = claimed?.[0];
  if (!product) return null;

  let sentCount = 0;
  try {
    const { data: subscribers, error: subscribersError } = await admin
      .from("newsletter_subscribers")
      .select("email, unsubscribe_token")
      .is("unsubscribed_at", null);
    if (subscribersError) throw new Error(`newsletter subscriber lookup failed: ${subscribersError.message}`);

    const allSubscribers = subscribers ?? [];
    const optedOut = await getOptedOutEmails(allSubscribers.map(s => s.email), EmailType.NewArrival);
    if (!optedOut) throw new Error("new-arrival preference lookup failed");
    const recipients = allSubscribers.filter(s => !optedOut.has(s.email.toLowerCase()));
    const skippedCount = allSubscribers.length - recipients.length;

    // Newsletter-only subscribers have no account to manage preferences in,
    // so they get a signed one-click unsubscribe link. If the lookup fails,
    // everyone gets the signed link, which works for account holders too.
    const accountEmails = (await getCustomerEmails(recipients.map(s => s.email))) ?? new Set<string>();

    for (const subscriber of recipients) {
      const { subject, html } = newArrival({
        customerEmail: subscriber.email,
        unsubscribeToken: subscriber.unsubscribe_token,
        signedUnsubscribeUrl: accountEmails.has(subscriber.email.toLowerCase())
          ? undefined
          : buildUnsubscribeUrl(subscriber.email, EmailType.Newsletter),
        product: {
          name: product.name,
          brand: product.brand,
          slug: product.slug,
          imageUrl: product.images?.[0],
          price: product.full_payment_price,
        },
      });
      const result = await sendEmail(subscriber.email, subject, html);
      if (result.ok && !result.skipped) sentCount++;
    }

    console.log(`[new-arrival-notify] ${product.name}: ${sentCount} sent, ${allSubscribers.length} eligible, ${skippedCount} opted out`);

    const { error: notifyLogError } = await admin.from("activity_log").insert({
      action: "new_arrival_notified",
      entity_type: "product",
      entity_id: productId,
      entity_name: product.name,
      actor_email: actorEmail,
      details: {
        product_id: productId,
        subscriber_count: sentCount,
        eligible_count: allSubscribers.length,
        opted_out_count: skippedCount,
      },
    });
    if (notifyLogError) console.error("[activity_log] new_arrival_notified insert failed:", notifyLogError);

    return { sent: sentCount, eligible: allSubscribers.length, optedOut: skippedCount };
  } catch (err) {
    if (sentCount === 0) {
      await admin.from("products").update({ notified_at: null }).eq("id", productId);
    }
    throw err;
  }
}

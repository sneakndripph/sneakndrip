import { createAdminClient } from "@/lib/supabase/admin-server";
import { sendEmail } from "./send";
import { restockAlert } from "./templates/restockAlert";
import { getOptedOutEmails, EmailType } from "./preferences";

type NotifySource = "explicit" | "wishlist";

/**
 * Emails everyone subscribed to restock alerts for one product+size, then
 * clears only the notification rows that sent successfully. Explicit
 * opt-ins are one-shot (deleted after a successful send); wishlist-derived
 * rows are a standing subscription and are kept so the next restock alerts
 * the user again for as long as the product stays wishlisted. A failed send
 * stays queued for the next restock instead of being silently dropped.
 */
export async function sendRestockEmailsForSize(
  productId: string,
  size: string,
  productName: string,
  productSlug: string,
  imageUrl?: string,
): Promise<void> {
  const admin = createAdminClient();
  const { data: notifs } = await admin
    .from("restock_notifications")
    .select("email, source")
    .eq("product_id", productId)
    .eq("size", size);

  const allSubscribers = (notifs ?? []).filter((n): n is { email: string; source: NotifySource } => Boolean(n.email));
  if (allSubscribers.length === 0) return;

  // The restock_alerts_enabled preference is a master switch over every
  // per-product subscription. Opted-out rows are left in place (not deleted)
  // so turning the preference back on resumes their alerts.
  const optedOut = await getOptedOutEmails(allSubscribers.map(s => s.email), EmailType.RestockAlert);
  if (!optedOut) {
    console.error(`Restock emails for ${productName} (${size}) skipped: preference lookup failed`);
    return;
  }
  const subscribers = allSubscribers.filter(s => !optedOut.has(s.email.toLowerCase()));
  const skippedCount = allSubscribers.length - subscribers.length;
  if (subscribers.length === 0) {
    console.log(`Restock emails for ${productName} (${size}): 0 sent, ${skippedCount} skipped (opted out)`);
    return;
  }

  const templates: Record<NotifySource, { subject: string; html: string }> = {
    explicit: restockAlert({ productName, productSlug, size, imageUrl, source: "explicit" }),
    wishlist: restockAlert({ productName, productSlug, size, imageUrl, source: "wishlist" }),
  };

  const results = await Promise.allSettled(
    subscribers.map(({ email, source }) => {
      const { subject, html } = templates[source];
      return sendEmail(email, subject, html);
    }),
  );

  const successfulExplicitEmails: string[] = [];
  let successCount = 0;
  let failedCount = 0;
  results.forEach((result, i) => {
    const ok = result.status === "fulfilled" && result.value.ok && !result.value.skipped;
    if (ok) {
      successCount++;
      if (subscribers[i].source === "explicit") successfulExplicitEmails.push(subscribers[i].email);
    } else {
      failedCount++;
    }
  });

  console.log(`Restock emails for ${productName} (${size}): ${successCount} sent, ${failedCount} failed, ${skippedCount} skipped (opted out)`);

  if (successfulExplicitEmails.length > 0) {
    await admin.from("restock_notifications").delete()
      .eq("product_id", productId).eq("size", size)
      .eq("source", "explicit")
      .in("email", successfulExplicitEmails);
  }
}

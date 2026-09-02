import { createAdminClient } from "@/lib/supabase/admin-server";
import { sendEmail } from "./send";
import { restockAlert } from "./templates/restockAlert";

/**
 * Emails everyone subscribed to restock alerts for one product+size, then
 * clears only the notification rows that sent successfully so a failed send
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
    .select("email")
    .eq("product_id", productId)
    .eq("size", size);

  const emails = (notifs ?? []).map(n => n.email).filter((e): e is string => Boolean(e));
  if (emails.length === 0) return;

  const { subject, html } = restockAlert({ productName, productSlug, size, imageUrl });

  const results = await Promise.allSettled(
    emails.map(email => sendEmail(email, subject, html)),
  );

  const successfulEmails: string[] = [];
  const failedEmails: string[] = [];
  results.forEach((result, i) => {
    const ok = result.status === "fulfilled" && result.value.ok && !result.value.skipped;
    (ok ? successfulEmails : failedEmails).push(emails[i]);
  });

  console.log(`Restock emails for ${productName} (${size}): ${successfulEmails.length} sent, ${failedEmails.length} failed`);

  if (successfulEmails.length > 0) {
    await admin.from("restock_notifications").delete()
      .eq("product_id", productId).eq("size", size)
      .in("email", successfulEmails);
  }
}

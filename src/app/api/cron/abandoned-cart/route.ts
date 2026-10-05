import { createAdminClient } from "@/lib/supabase/admin-server";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { validateEnv } from "@/lib/env";
import { abandonedCart, type AbandonedCartItem } from "@/lib/email/templates/abandonedCart";
import { SITE_URL } from "@/lib/constants";
import { getOptedOutEmails, EmailType } from "@/lib/email/preferences";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

type CartItem = {
  product: { name: string; images?: string[]; brand: string; bg?: string; srp_price?: number };
  size: string;
  quantity: number;
  unit_price: number;
  payment_type: "full_payment" | "downpayment";
};

type AbandonedCartRow = { id: string; email: string; cart_items: unknown; subtotal: number };

function toAbandonedCartItems(items: CartItem[]): AbandonedCartItem[] {
  return items.map(item => ({
    name: item.product.name,
    size: item.size,
    imageUrl: item.product.images?.[0],
    quantity: item.quantity,
    unit_price: item.unit_price,
    srp_price: item.product.srp_price,
    brand: item.product.brand,
    paymentType: item.payment_type,
  }));
}

export async function GET(req: NextRequest) {
  // Verify this is called by Vercel Cron (or our secret in dev). Fail closed: an
  // unset secret must refuse to run, not silently skip the auth check.
  const env = validateEnv();
  const secret = env.CRON_SECRET;
  if (!secret) {
    console.error("[cron/abandoned-cart] CRON_SECRET not configured — refusing to run");
    return NextResponse.json({ error: "CRON_SECRET not configured — refusing to run" }, { status: 500 });
  }
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!resend) return NextResponse.json({ ok: true, skipped: "no resend key" });

  const admin = createAdminClient();
  const now = new Date();

  // 1-hour abandoned carts
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
  const { data: carts1h } = await admin
    .from("abandoned_carts")
    .select("*")
    .lt("updated_at", oneHourAgo)
    .is("email_1h_sent_at", null)
    .is("recovered_at", null)
    .not("cart_items", "eq", "[]")
    .limit(50);

  // 24-hour abandoned carts
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const { data: carts24h } = await admin
    .from("abandoned_carts")
    .select("*")
    .lt("updated_at", twentyFourHoursAgo)
    .not("email_1h_sent_at", "is", null)
    .is("email_24h_sent_at", null)
    .is("recovered_at", null)
    .not("cart_items", "eq", "[]")
    .limit(50);

  const allCarts = [...(carts1h ?? []), ...(carts24h ?? [])];
  const optedOut = await getOptedOutEmails(allCarts.map(c => c.email), EmailType.CartReminder);
  if (!optedOut) {
    console.error("[cron/abandoned-cart] preference lookup failed — skipping all sends this run");
    return NextResponse.json({ error: "Preference lookup failed" }, { status: 500 });
  }

  const sendBatch = async (carts: AbandonedCartRow[], variant: "1h" | "24h") => {
    const sentAtColumn = variant === "1h" ? "email_1h_sent_at" : "email_24h_sent_at";
    let sent = 0;
    let skipped = 0;
    for (const cart of carts) {
      try {
        // Opted-out carts are stamped as sent too, so they drop out of the
        // next run's query instead of crowding the limit(50) window forever.
        if (optedOut.has(cart.email.toLowerCase())) {
          await admin.from("abandoned_carts").update({ [sentAtColumn]: now.toISOString() }).eq("id", cart.id);
          skipped++;
          continue;
        }
        const { subject, html } = abandonedCart({
          variant,
          items: toAbandonedCartItems(cart.cart_items as CartItem[]),
          subtotal: cart.subtotal,
          cartUrl: `${SITE_URL}/resume-cart`,
        });
        await resend.emails.send({ from: `Sneak N' Drip <${FROM_EMAIL}>`, to: cart.email, subject, html });
        await admin.from("abandoned_carts").update({ [sentAtColumn]: now.toISOString() }).eq("id", cart.id);
        sent++;
      } catch { /* continue */ }
    }
    console.log(`[cron/abandoned-cart] ${variant}: ${carts.length} due, ${sent} sent, ${skipped} skipped (opted out)`);
    return { sent, skipped };
  };

  const { sent: sent1h, skipped: skipped1h } = await sendBatch(carts1h ?? [], "1h");
  const { sent: sent24h, skipped: skipped24h } = await sendBatch(carts24h ?? [], "24h");

  return NextResponse.json({ ok: true, sent1h, sent24h, skipped1h, skipped24h });
}

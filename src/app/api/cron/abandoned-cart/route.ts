import { createAdminClient } from "@/lib/supabase/admin-server";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
const BRAND_TEAL = "#5BB8B4";
const BRAND_BLACK = "#0D0D0D";
const BRAND_BG = "#F2F0EF";
const SITE_URL = "https://sneakndrip.ph";

function h(s: unknown): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

type CartItem = {
  product: { name: string; images?: string[]; brand: string; bg?: string };
  size: string;
  quantity: number;
  unit_price: number;
  payment_type: "full_payment" | "downpayment";
};

function buildEmail(items: CartItem[], subtotal: number, isReminder: boolean): string {
  const rows = items.map(item => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #eee;vertical-align:middle">
        <div style="display:flex;align-items:center;gap:12px">
          ${item.product.images?.[0]
            ? `<img src="${h(item.product.images[0])}" width="56" height="56" alt="${h(item.product.name)}" style="border-radius:8px;object-fit:cover;flex-shrink:0">`
            : `<div style="width:56px;height:56px;border-radius:8px;background:${BRAND_BG};flex-shrink:0"></div>`
          }
          <div>
            <p style="margin:0 0 2px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#888">${h(item.product.brand)}</p>
            <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:${BRAND_BLACK}">${h(item.product.name)}</p>
            <p style="margin:0;font-size:12px;color:#888">Size ${h(item.size)} · ${item.payment_type === "downpayment" ? "Downpayment" : "Full Payment"} · x${item.quantity}</p>
          </div>
        </div>
      </td>
      <td style="padding:12px 0;border-bottom:1px solid #eee;text-align:right;font-weight:700;color:${BRAND_BLACK};vertical-align:middle;white-space:nowrap">
        ₱${(item.unit_price * item.quantity).toLocaleString()}
      </td>
    </tr>
  `).join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
    <div style="background:${BRAND_BLACK};padding:28px 36px;text-align:center">
      <img src="${SITE_URL}/sneakndrip-logo.gif" alt="SNEAK N' DRIP" width="180" style="display:block;margin:0 auto;border:0;max-width:180px">
    </div>
    <div style="padding:32px 36px">
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:900;color:${BRAND_BLACK};letter-spacing:0.5px">
        ${isReminder ? "Still thinking about it?" : "You left something behind"}
      </h1>
      <p style="margin:0 0 24px;color:#555;font-size:15px;line-height:1.6">
        ${isReminder
          ? "Your cart is still waiting. These pairs might not last — grab yours before they're gone."
          : "You've got heat sitting in your cart. These are going fast — don't let someone else cop your size."
        }
      </p>

      <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
        ${rows}
        <tr>
          <td style="padding:12px 0 0;font-size:15px;color:#555">Subtotal</td>
          <td style="padding:12px 0 0;text-align:right;font-weight:900;font-size:18px;color:${BRAND_TEAL}">
            ₱${subtotal.toLocaleString()}
          </td>
        </tr>
      </table>

      <div style="text-align:center;margin:24px 0">
        <a href="${SITE_URL}/cart"
          style="display:inline-block;background:${BRAND_BLACK};color:#fff;font-size:15px;font-weight:700;padding:16px 40px;border-radius:4px;text-decoration:none;letter-spacing:0.5px">
          Complete My Order →
        </a>
      </div>

      <p style="margin:0;font-size:12px;color:#aaa;text-align:center">
        Questions? Message us on
        <a href="https://www.facebook.com/SneakNDrip/" style="color:${BRAND_TEAL}">Facebook</a> or
        <a href="https://www.instagram.com/sneakndripph/" style="color:${BRAND_TEAL}">Instagram</a>.
      </p>
    </div>
    <div style="background:${BRAND_BLACK};padding:16px 36px;text-align:center">
      <p style="color:#666;font-size:11px;margin:0">© 2025 Sneak N' Drip · Philippines · 100% Authentic Sneakers</p>
    </div>
  </div>
</body>
</html>`;
}

export async function GET(req: NextRequest) {
  // Verify this is called by Vercel Cron (or our secret in dev)
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
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

  let sent1h = 0;
  let sent24h = 0;

  for (const cart of carts1h ?? []) {
    try {
      await resend.emails.send({
        from: `Sneak N' Drip <${FROM_EMAIL}>`,
        to: cart.email,
        subject: "You left something in your cart",
        html: buildEmail(cart.cart_items as CartItem[], cart.subtotal, false),
      });
      await admin
        .from("abandoned_carts")
        .update({ email_1h_sent_at: now.toISOString() })
        .eq("id", cart.id);
      sent1h++;
    } catch { /* continue */ }
  }

  for (const cart of carts24h ?? []) {
    try {
      await resend.emails.send({
        from: `Sneak N' Drip <${FROM_EMAIL}>`,
        to: cart.email,
        subject: "Still thinking about it? Your cart is waiting",
        html: buildEmail(cart.cart_items as CartItem[], cart.subtotal, true),
      });
      await admin
        .from("abandoned_carts")
        .update({ email_24h_sent_at: now.toISOString() })
        .eq("id", cart.id);
      sent24h++;
    } catch { /* continue */ }
  }

  return NextResponse.json({ ok: true, sent1h, sent24h });
}

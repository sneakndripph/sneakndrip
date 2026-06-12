import { createAdminClient } from "@/lib/supabase/admin-server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = "orders@sneakndrip.ph";
const BRAND_TEAL = "#5BB8B4";
const BRAND_BLACK = "#0D0D0D";
const BRAND_BG = "#F2F0EF";

async function getRequestingUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

function statusEmailContent(
  status: string,
  orderNumber: string,
  customerName: string,
  trackingNumber: string | null,
  isCOD: boolean,
): { subject: string; body: string } | null {
  const greeting = `Hi <strong>${customerName}</strong>,`;

  const messages: Record<string, { subject: string; body: string }> = {
    paid: {
      subject: `Payment Confirmed — ${orderNumber} | Sneak N' Drip`,
      body: `
        <p style="color:#555;font-size:15px;margin:0 0 16px;line-height:1.6">${greeting}</p>
        <p style="color:#555;font-size:15px;margin:0 0 16px;line-height:1.6">
          Your payment for order <strong style="color:${BRAND_BLACK}">${orderNumber}</strong> has been verified and confirmed!
        </p>
        <div style="background:${BRAND_BG};border-left:4px solid ${BRAND_TEAL};padding:16px 20px;border-radius:4px;margin-bottom:20px">
          <p style="margin:0;color:${BRAND_BLACK};font-size:14px;font-weight:600">What happens next?</p>
          <p style="margin:6px 0 0;color:#555;font-size:13px;line-height:1.8">
            1. We prepare and pack your order<br>
            2. We ship your pair and send a tracking number<br>
            3. Your sneakers arrive at your door
          </p>
        </div>
      `,
    },
    processing: {
      subject: `Order Being Packed — ${orderNumber} | Sneak N' Drip`,
      body: `
        <p style="color:#555;font-size:15px;margin:0 0 16px;line-height:1.6">${greeting}</p>
        <p style="color:#555;font-size:15px;margin:0 0 16px;line-height:1.6">
          Great news! Your order <strong style="color:${BRAND_BLACK}">${orderNumber}</strong> is now being packed and prepared for shipment.
        </p>
        <p style="color:#888;font-size:14px">We'll send you another update with your tracking number once your order ships.</p>
      `,
    },
    shipped: {
      subject: `Your Order Has Shipped! — ${orderNumber} | Sneak N' Drip`,
      body: `
        <p style="color:#555;font-size:15px;margin:0 0 16px;line-height:1.6">${greeting}</p>
        <p style="color:#555;font-size:15px;margin:0 0 16px;line-height:1.6">
          Your order <strong style="color:${BRAND_BLACK}">${orderNumber}</strong> is on its way! 🚚
        </p>
        ${trackingNumber ? `
        <div style="background:${BRAND_BG};border-radius:8px;padding:20px;margin-bottom:20px;text-align:center">
          <p style="margin:0 0 6px;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px">Tracking Number</p>
          <p style="margin:0;color:${BRAND_BLACK};font-size:20px;font-weight:900;letter-spacing:2px">${trackingNumber}</p>
        </div>` : ""}
        <p style="color:#888;font-size:14px">Use your tracking number on your courier's website to monitor your delivery.</p>
      `,
    },
    delivered: {
      subject: isCOD
        ? `Order Delivered & Payment Collected — ${orderNumber} | Sneak N' Drip`
        : `Order Delivered! — ${orderNumber} | Sneak N' Drip`,
      body: `
        <p style="color:#555;font-size:15px;margin:0 0 16px;line-height:1.6">${greeting}</p>
        <p style="color:#555;font-size:15px;margin:0 0 16px;line-height:1.6">
          ${isCOD
            ? `Your order <strong style="color:${BRAND_BLACK}">${orderNumber}</strong> has been delivered and payment collected. Thank you!`
            : `Your order <strong style="color:${BRAND_BLACK}">${orderNumber}</strong> has been delivered. Enjoy your kicks! 👟`
          }
        </p>
        <p style="color:#888;font-size:14px">
          Happy with your purchase? We'd love a review! Message us on
          <a href="https://www.facebook.com/SneakNDrip/" style="color:${BRAND_TEAL}">Facebook</a> or
          <a href="https://www.instagram.com/sneakndripph/" style="color:${BRAND_TEAL}">Instagram</a>.
        </p>
      `,
    },
  };

  return messages[status] ?? null;
}

function wrapEmail(bodyContent: string, orderNumber: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <div style="max-width:580px;margin:40px auto;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
    <div style="background:${BRAND_BLACK};padding:28px 40px;text-align:center">
      <div style="background:${BRAND_BG};display:inline-block;padding:8px 18px;border-radius:4px;margin-bottom:12px">
        <span style="font-size:18px;font-weight:900;letter-spacing:2px;color:${BRAND_BLACK}">SNEAK N' DRIP</span>
      </div>
      <p style="color:${BRAND_TEAL};margin:0;font-size:13px;font-weight:600">${orderNumber}</p>
    </div>
    <div style="padding:32px 40px">${bodyContent}</div>
    <div style="background:${BRAND_BLACK};padding:18px 40px;text-align:center">
      <p style="color:#666;font-size:12px;margin:0">© 2025 Sneak N' Drip · Philippines · 100% Authentic Sneakers</p>
    </div>
  </div>
</body>
</html>`;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getRequestingUser();
  if (!user || user.user_metadata?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json() as { status?: string; tracking_number?: string };

  const admin = createAdminClient();

  // Fetch current order before updating (needed for notifications + inventory)
  const { data: currentOrder } = await admin
    .from("orders")
    .select("status, payment_method, order_number, customer_name, customer_email, tracking_number, order_items(product_id, size, quantity)")
    .eq("id", id)
    .single();

  const update: Record<string, unknown> = {};
  if (body.status) update.status = body.status;
  if (body.tracking_number !== undefined) update.tracking_number = body.tracking_number;

  // Also sync payment_status when order is accepted/paid or COD delivered
  const isCODOrder = currentOrder?.payment_method === "cod";
  if (body.status === "paid" && !isCODOrder) update.payment_status = "paid";
  if (body.status === "delivered" && isCODOrder) update.payment_status = "paid";

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { error } = await admin.from("orders").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // ── Status change notification email ────────────────────────────────────
  if (body.status && currentOrder?.customer_email && resend) {
    const trackingNum = body.tracking_number ?? currentOrder.tracking_number ?? null;
    const emailContent = statusEmailContent(
      body.status,
      currentOrder.order_number,
      currentOrder.customer_name,
      trackingNum,
      isCODOrder,
    );
    if (emailContent) {
      resend.emails.send({
        from: `Sneak N' Drip <${FROM_EMAIL}>`,
        to: currentOrder.customer_email,
        subject: emailContent.subject,
        html: wrapEmail(emailContent.body, currentOrder.order_number),
      }).catch(err => console.error("Status email error:", err));
    }
  }

  return NextResponse.json({ ok: true });
}

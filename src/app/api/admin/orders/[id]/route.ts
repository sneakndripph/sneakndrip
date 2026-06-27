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
  try {
    const cookieStore = await cookies();
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      anonKey,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
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
          <p style="margin:0 0 12px;color:${BRAND_BLACK};font-size:20px;font-weight:900;letter-spacing:2px">${trackingNumber}</p>
          <a href="https://www.jtexpress.ph/trajectoryQuery?billCode=${trackingNumber}"
            style="display:inline-block;background:${BRAND_TEAL};color:#fff;font-size:13px;font-weight:700;padding:10px 22px;border-radius:4px;text-decoration:none;letter-spacing:0.5px">
            Track via J&amp;T Express →
          </a>
        </div>` : ""}
        <p style="color:#888;font-size:14px">Track your delivery using the link above or visit <a href="https://www.jtexpress.ph" style="color:${BRAND_TEAL}">J&amp;T Express</a>.</p>
      `,
    },
    stock_on_hand: {
      subject: `Your Pre-Order Has Arrived! — ${orderNumber} | Sneak N' Drip`,
      body: `
        <p style="color:#555;font-size:15px;margin:0 0 16px;line-height:1.6">${greeting}</p>
        <p style="color:#555;font-size:15px;margin:0 0 16px;line-height:1.6">
          Great news! Your pre-order <strong style="color:${BRAND_BLACK}">${orderNumber}</strong> has arrived and is now with us. 🎉
        </p>
        <div style="background:${BRAND_BG};border-left:4px solid ${BRAND_TEAL};padding:16px 20px;border-radius:4px;margin-bottom:20px">
          <p style="margin:0;color:${BRAND_BLACK};font-size:14px;font-weight:600">What's next?</p>
          <p style="margin:6px 0 0;color:#555;font-size:13px;line-height:1.8">
            1. Please settle your remaining balance before we ship your order<br>
            2. Once balance is confirmed, we'll pack and ship your pair<br>
            3. We'll send you a tracking number once it's on the way
          </p>
        </div>
        <div style="text-align:center;margin-bottom:20px">
          <a href="https://sneakndrip.ph/account?order=${orderNumber}"
            style="display:inline-block;background:${BRAND_TEAL};color:#ffffff;font-size:14px;font-weight:700;padding:14px 32px;border-radius:4px;text-decoration:none;letter-spacing:0.5px">
            Pay Balance Now →
          </a>
        </div>
        <p style="color:#888;font-size:13px;text-align:center">
          Or message us on <a href="https://www.facebook.com/SneakNDrip/" style="color:${BRAND_TEAL}">Facebook</a> or <a href="https://www.instagram.com/sneakndripph/" style="color:${BRAND_TEAL}">Instagram</a>.
        </p>
      `,
    },
    delivered: {
      subject: isCOD
        ? `Order Delivered & Payment Collected — ${orderNumber} | Sneak N' Drip`
        : `Your Sneakers Have Landed! — ${orderNumber} | Sneak N' Drip`,
      body: `
        <p style="color:#555;font-size:15px;margin:0 0 16px;line-height:1.6">${greeting}</p>
        <p style="color:#555;font-size:15px;margin:0 0 16px;line-height:1.6">
          ${isCOD
            ? `Your order <strong style="color:${BRAND_BLACK}">${orderNumber}</strong> has been delivered and payment collected. Thank you for trusting Sneak N' Drip! 🙏`
            : `Your order <strong style="color:${BRAND_BLACK}">${orderNumber}</strong> has been delivered. Your pair is finally home! 👟🔥`
          }
        </p>
        <div style="background:${BRAND_BG};border-left:4px solid ${BRAND_TEAL};padding:16px 20px;border-radius:4px;margin-bottom:20px">
          <p style="margin:0;color:${BRAND_BLACK};font-size:14px;font-weight:600">Thank you for trusting us! 🙏</p>
          <p style="margin:6px 0 0;color:#555;font-size:13px;line-height:1.8">
            Your support means the world to us. We hope you love your pair as much as we loved getting it to you.<br>
            Come back soon — more heat dropping soon! 🔥
          </p>
        </div>
        <p style="color:#888;font-size:14px">
          Tag us in your fit! Share on
          <a href="https://www.facebook.com/SneakNDrip/" style="color:${BRAND_TEAL}">Facebook</a> or
          <a href="https://www.instagram.com/sneakndripph/" style="color:${BRAND_TEAL}">Instagram</a>
          and we might feature you. 📸
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
      <img src="https://sneakndrip.ph/sneakndrip-logo.gif" alt="SNEAK N' DRIP" width="200" style="display:block;margin:0 auto;border:0;max-width:200px" />
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
  const isAdmin = user?.user_metadata?.role === "admin" || user?.app_metadata?.role === "admin";
  if (!user || !isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json() as { status?: string; tracking_number?: string; admin_notes?: string };

  const admin = createAdminClient();

  // Fetch current order before updating (needed for notifications + inventory)
  const { data: currentOrder } = await admin
    .from("orders")
    .select("status, payment_method, order_number, customer_name, customer_email, tracking_number, order_items(product_id, size, quantity, products(name))")
    .eq("id", id)
    .single();

  const update: Record<string, unknown> = {};
  if (body.status) update.status = body.status;
  if (body.tracking_number !== undefined) update.tracking_number = body.tracking_number;
  if (body.admin_notes !== undefined) update.admin_notes = body.admin_notes;

  // Also sync payment_status when order is accepted/paid or COD delivered
  const isCODOrder = currentOrder?.payment_method === "cod";
  if (body.status === "paid" && !isCODOrder) update.payment_status = "paid";
  if (body.status === "delivered" && isCODOrder) update.payment_status = "paid";

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { error } = await admin.from("orders").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Restore stock + log inventory when admin cancels an active order
  const RESTOCKABLE = ["pending", "paid", "processing"];
  if (body.status === "cancelled" && currentOrder && RESTOCKABLE.includes(currentOrder.status)) {
    for (const item of (currentOrder.order_items as { product_id: string; size: string; quantity: number; products: { name: string }[] | null }[])) {
      if (!item.product_id) continue;
      const { data: row } = await admin.from("product_sizes").select("stock").eq("product_id", item.product_id).eq("size", item.size).single();
      if (row) {
        const newStock = row.stock + item.quantity;
        await admin.from("product_sizes").update({ stock: newStock }).eq("product_id", item.product_id).eq("size", item.size);
        void admin.from("inventory_log").insert({
          product_id: item.product_id,
          product_name: item.products?.[0]?.name ?? "Unknown",
          size: item.size,
          old_stock: row.stock,
          new_stock: newStock,
          reason: "order_cancelled",
          changed_by: user.email ?? "admin",
          order_number: currentOrder.order_number,
        });
      }
    }
  }

  // Log the activity
  if (body.status && currentOrder) {
    void admin.from("activity_log").insert({
      action: "status_updated",
      entity_type: "order",
      entity_id: id,
      entity_name: currentOrder.order_number,
      actor_email: user.email ?? null,
      details: { from: currentOrder.status, to: body.status, ...(body.tracking_number ? { tracking: body.tracking_number } : {}) },
    });
  }

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

  // ── Insert in-app notification for stock_on_hand ────────────────────────
  if (body.status === "stock_on_hand" && currentOrder?.customer_email) {
    void admin.from("notifications").insert({
      user_email: currentOrder.customer_email,
      title: "Your pre-order has arrived in the Philippines! 🇵🇭",
      message: `Order ${currentOrder.order_number} is here. Please settle your balance so we can ship it to you.`,
      order_number: currentOrder.order_number,
      type: "order",
    });
  }

  // ── Tracking number added/updated on shipped order → notify customer ──
  if (!body.status && body.tracking_number && currentOrder?.status === "shipped" && currentOrder.customer_email && resend) {
    const emailContent = statusEmailContent("shipped", currentOrder.order_number, currentOrder.customer_name, body.tracking_number, isCODOrder);
    if (emailContent) {
      resend.emails.send({
        from: `Sneak N' Drip <${FROM_EMAIL}>`,
        to: currentOrder.customer_email,
        subject: `Tracking Number Updated — ${currentOrder.order_number} | Sneak N' Drip`,
        html: wrapEmail(emailContent.body, currentOrder.order_number),
      }).catch(err => console.error("Tracking email error:", err));
    }
  }

  return NextResponse.json({ ok: true });
}

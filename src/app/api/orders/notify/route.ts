import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const ADMIN_EMAIL = "donjulio263@gmail.com";
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
const BRAND_TEAL = "#5BB8B4";
const BRAND_BLACK = "#0D0D0D";
const BRAND_BG = "#F2F0EF";

export async function POST(req: NextRequest) {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ ok: true, skipped: "no api key" });
  }

  const body = await req.json();
  const { orderNumber, customer, items, total, shipping, subtotal, paymentMethod, paymentType, shippingAddress, isCOD } = body;

  const itemRows = items.map((item: { name: string; size: string; quantity: number; price: number; payment_type: string }) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #eee;">
        <strong style="color:${BRAND_BLACK}">${item.name}</strong><br>
        <span style="color:#888;font-size:13px;">Size: ${item.size} &nbsp;·&nbsp; ${item.payment_type === "downpayment" ? "Downpayment" : "Full Payment"} &nbsp;·&nbsp; x${item.quantity}</span>
      </td>
      <td style="padding:12px 0;border-bottom:1px solid #eee;text-align:right;font-weight:bold;color:${BRAND_BLACK}">
        ₱${item.price.toLocaleString()}
      </td>
    </tr>
  `).join("");

  const paymentLabel: Record<string, string> = {
    gcash: "GCash",
    maya: "Maya",
    bank_transfer: "Bank Transfer",
    cod: "Cash on Delivery",
  };

  const customerHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <div style="max-width:580px;margin:40px auto;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
    <!-- Header -->
    <div style="background:${BRAND_BLACK};padding:32px 40px;text-align:center">
      <img src="https://sneakndrip.vercel.app/sneakndrip-logo.png" alt="SNEAK N' DRIP" width="200" style="display:block;margin:0 auto 16px;border:0;max-width:200px" />
      <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:900;letter-spacing:2px">ORDER CONFIRMED!</h1>
    </div>

    <!-- Body -->
    <div style="padding:32px 40px">
      <p style="color:${BRAND_BLACK};font-size:16px;margin:0 0 24px">Hi <strong>${customer.name}</strong>,</p>
      <p style="color:#555;font-size:15px;margin:0 0 24px;line-height:1.6">
        ${isCOD
          ? "Your order has been confirmed! We'll contact you on your mobile number before delivery."
          : "We've received your order and proof of payment. We'll verify your payment and process your order shortly."}
      </p>

      <!-- Order items -->
      <div style="background:${BRAND_BG};border-radius:8px;padding:24px;margin-bottom:24px">
        <h3 style="margin:0 0 16px;color:${BRAND_BLACK};font-size:14px;text-transform:uppercase;letter-spacing:2px">Your Order</h3>
        <table style="width:100%;border-collapse:collapse">
          ${itemRows}
          <tr>
            <td style="padding:8px 0;color:#888;font-size:14px">Subtotal</td>
            <td style="padding:8px 0;text-align:right;color:#888;font-size:14px">₱${subtotal.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#888;font-size:14px">Shipping</td>
            <td style="padding:8px 0;text-align:right;color:#888;font-size:14px">${shipping === 0 ? "FREE" : "₱" + shipping.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding:12px 0 0;font-weight:900;color:${BRAND_BLACK};font-size:18px">TOTAL</td>
            <td style="padding:12px 0 0;text-align:right;font-weight:900;color:${BRAND_TEAL};font-size:18px">₱${total.toLocaleString()}</td>
          </tr>
        </table>
      </div>

      <!-- Shipping & Payment -->
      <div style="display:grid;gap:16px;margin-bottom:24px">
        <div style="border:1px solid #eee;border-radius:8px;padding:20px">
          <h4 style="margin:0 0 10px;color:${BRAND_BLACK};font-size:13px;text-transform:uppercase;letter-spacing:1px">Ship To</h4>
          <p style="margin:0;color:#555;font-size:14px;line-height:1.6">
            ${shippingAddress.street}, ${shippingAddress.barangay}<br>
            ${shippingAddress.city}, ${shippingAddress.province} ${shippingAddress.postal}<br>
            📱 ${customer.mobile}
          </p>
        </div>
        <div style="border:1px solid #eee;border-radius:8px;padding:20px">
          <h4 style="margin:0 0 10px;color:${BRAND_BLACK};font-size:13px;text-transform:uppercase;letter-spacing:1px">Payment</h4>
          <p style="margin:0;color:#555;font-size:14px">
            ${paymentLabel[paymentMethod] ?? paymentMethod} &nbsp;·&nbsp; ${paymentType === "downpayment" ? "Downpayment" : "Full Payment"}
          </p>
          ${!isCOD ? `<p style="margin:6px 0 0;color:#888;font-size:13px">We'll verify your payment within 1–2 hours.</p>` : ""}
        </div>
      </div>

      <!-- What's next -->
      ${!isCOD ? `
      <div style="background:#FFF8F0;border-left:4px solid ${BRAND_TEAL};padding:16px 20px;border-radius:4px;margin-bottom:24px">
        <p style="margin:0;color:${BRAND_BLACK};font-size:14px;font-weight:600">What happens next?</p>
        <p style="margin:6px 0 0;color:#555;font-size:13px;line-height:1.6">
          1. We verify your payment (1–2 hrs)<br>
          2. We prepare and pack your order<br>
          3. We ship and send you a tracking number
        </p>
      </div>` : ""}

      <p style="color:#888;font-size:13px;margin:0">Questions? Message us on <a href="https://www.facebook.com/SneakNDrip/" style="color:${BRAND_TEAL}">Facebook</a> or <a href="https://www.instagram.com/sneakndripph/" style="color:${BRAND_TEAL}">Instagram</a>.</p>
    </div>

    <!-- Footer -->
    <div style="background:${BRAND_BLACK};padding:20px 40px;text-align:center">
      <p style="color:#666;font-size:12px;margin:0">© 2025 Sneak N' Drip · Philippines · 100% Authentic Sneakers</p>
    </div>
  </div>
</body>
</html>`;

  const adminHtml = `
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;max-width:500px;margin:20px auto;padding:20px">
  <h2 style="color:${BRAND_BLACK}">🛍️ New Order: ${orderNumber}</h2>
  <table style="width:100%;border-collapse:collapse;font-size:14px">
    <tr><td style="padding:8px 0;color:#888;width:120px">Customer</td><td style="font-weight:bold">${customer.name}</td></tr>
    <tr><td style="padding:8px 0;color:#888">Email</td><td>${customer.email}</td></tr>
    <tr><td style="padding:8px 0;color:#888">Mobile</td><td>${customer.mobile}</td></tr>
    <tr><td style="padding:8px 0;color:#888">Payment</td><td>${paymentLabel[paymentMethod] ?? paymentMethod} · ${paymentType === "downpayment" ? "Downpayment" : "Full Payment"}</td></tr>
    <tr><td style="padding:8px 0;color:#888">Total</td><td style="font-weight:bold;color:${BRAND_TEAL}">₱${total.toLocaleString()}</td></tr>
    <tr><td style="padding:8px 0;color:#888;vertical-align:top">Ship To</td><td>${shippingAddress.street}, ${shippingAddress.barangay}, ${shippingAddress.city}, ${shippingAddress.province}</td></tr>
  </table>
  <hr style="margin:16px 0">
  <h3 style="font-size:14px">Items</h3>
  <ul style="font-size:14px;line-height:2">
    ${items.map((i: { name: string; size: string; quantity: number; price: number }) => `<li>${i.name} — ${i.size} x${i.quantity} — ₱${i.price.toLocaleString()}</li>`).join("")}
  </ul>
  <p style="font-size:12px;color:#888">Check Supabase orders table for full details.</p>
</body>
</html>`;

  try {
    await Promise.all([
      resend!.emails.send({
        from: `Sneak N' Drip <${FROM_EMAIL}>`,
        to: customer.email,
        subject: `Order Confirmed — ${orderNumber} | Sneak N' Drip`,
        html: customerHtml,
      }),
      resend!.emails.send({
        from: `Sneak N' Drip Orders <${FROM_EMAIL}>`,
        to: ADMIN_EMAIL,
        subject: `🛍️ New Order ${orderNumber} — ₱${total.toLocaleString()} (${paymentLabel[paymentMethod] ?? paymentMethod})`,
        html: adminHtml,
      }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Email error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

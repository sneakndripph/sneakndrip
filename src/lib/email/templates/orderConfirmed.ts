import {
  h, stripNewlines, wrapEmail, h1, h2, paragraph, productLine, divider, socialLinks,
  FONT_STACK, BRAND_INK, BRAND_INK_MUTED,
  BRAND_TEAL, BRAND_BLACK,
} from "../helpers";

export type OrderConfirmedData = {
  orderNumber: string;
  customer: { name: string; email: string; mobile: string };
  items: { name: string; size: string; quantity: number; price: number; payment_type: string; imageUrl?: string | null }[];
  total: number;
  shipping: number;
  subtotal: number;
  paymentMethod: string;
  paymentType: string;
  shippingAddress: { street: string; barangay: string; city: string; province: string; postal: string };
  isCOD: boolean;
};

const PAYMENT_LABEL: Record<string, string> = {
  gcash: "GCash",
  maya: "Maya",
  bank_transfer: "Bank Transfer",
  cod: "Cash on Delivery",
};

function itemLines(items: OrderConfirmedData["items"]): string {
  return items.map(item => {
    const meta = [
      `x${item.quantity}`,
      item.payment_type === "downpayment" ? "Downpayment" : "Full Payment",
    ].join(" &middot; ");
    return productLine({
      name: h(item.name),
      size: `${h(item.size)} &middot; ${meta}`,
      price: item.price,
      imageUrl: item.imageUrl ?? undefined,
    });
  }).join("");
}

function totalsRow(label: string, value: string, opts?: { strong?: boolean }): string {
  const size = opts?.strong ? "16px" : "14px";
  const weight = opts?.strong ? "500" : "400";
  const color = opts?.strong ? BRAND_INK : BRAND_INK_MUTED;
  return `<tr>
    <td style="padding:6px 0;font-family:${FONT_STACK};font-size:${size};font-weight:${weight};color:${color}">${label}</td>
    <td style="padding:6px 0;text-align:right;font-family:${FONT_STACK};font-size:${size};font-weight:${weight};color:${color}">${value}</td>
  </tr>`;
}

/** Customer-facing order confirmation email. */
export function orderConfirmedCustomer(order: OrderConfirmedData): { subject: string; html: string } {
  const safeOrderNumber = stripNewlines(order.orderNumber);

  const body = `
    ${h1("Order Confirmed")}
    ${paragraph(`Hi <strong>${h(order.customer.name)}</strong>, ${
      order.isCOD
        ? "your order has been confirmed. We'll contact you on your mobile number before delivery."
        : "we've received your order and proof of payment. We'll verify your payment and process your order shortly."
    }`)}

    ${divider()}

    ${h2("Your Order")}
    ${itemLines(order.items)}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 0">
      ${totalsRow("Subtotal", `₱${order.subtotal.toLocaleString()}`)}
      ${totalsRow("Shipping", order.shipping === 0 ? "FREE" : `₱${order.shipping.toLocaleString()}`)}
      ${totalsRow("Total", `₱${order.total.toLocaleString()}`, { strong: true })}
    </table>

    ${divider()}

    ${h2("Shipping To")}
    ${paragraph(`
      ${h(order.shippingAddress.street)}, ${h(order.shippingAddress.barangay)}<br>
      ${h(order.shippingAddress.city)}, ${h(order.shippingAddress.province)} ${h(order.shippingAddress.postal)}<br>
      ${h(order.customer.mobile)}
    `)}

    ${h2("Payment")}
    ${paragraph(`
      ${h(PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod)} &middot; ${order.paymentType === "downpayment" ? "Downpayment" : "Full Payment"}
      ${!order.isCOD ? `<br><span style="color:${BRAND_INK_MUTED};font-size:13px">We'll verify your payment within 1–2 hours.</span>` : ""}
    `)}

    ${!order.isCOD ? `
    ${h2("What Happens Next")}
    ${paragraph("1. We verify your payment (1–2 hrs)<br>2. We prepare and pack your order<br>3. We ship and send you a tracking number")}
    ` : ""}

    ${divider()}

    ${paragraph("Questions? Message us on Instagram, TikTok, or Facebook.")}
    ${socialLinks()}
  `;

  return {
    subject: `Order Confirmed — ${safeOrderNumber} | Sneak N' Drip`,
    html: wrapEmail(body, { previewText: `Your order ${safeOrderNumber} has been confirmed.` }),
  };
}

/** Internal admin alert for a new order. Plain layout — not the branded customer wrapper. */
export function orderConfirmedAdmin(order: OrderConfirmedData): { subject: string; html: string } {
  const safeOrderNumber = stripNewlines(order.orderNumber);
  const paymentLabel = stripNewlines(PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod);

  const html = `<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;max-width:500px;margin:20px auto;padding:20px">
  <h2 style="color:${BRAND_BLACK}">New Order: ${h(order.orderNumber)}</h2>
  <table style="width:100%;border-collapse:collapse;font-size:14px">
    <tr><td style="padding:8px 0;color:#888;width:120px">Customer</td><td style="font-weight:bold">${h(order.customer.name)}</td></tr>
    <tr><td style="padding:8px 0;color:#888">Email</td><td>${h(order.customer.email)}</td></tr>
    <tr><td style="padding:8px 0;color:#888">Mobile</td><td>${h(order.customer.mobile)}</td></tr>
    <tr><td style="padding:8px 0;color:#888">Payment</td><td>${h(PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod)} · ${order.paymentType === "downpayment" ? "Downpayment" : "Full Payment"}</td></tr>
    <tr><td style="padding:8px 0;color:#888">Total</td><td style="font-weight:bold;color:${BRAND_TEAL}">₱${order.total.toLocaleString()}</td></tr>
    <tr><td style="padding:8px 0;color:#888;vertical-align:top">Ship To</td><td>${h(order.shippingAddress.street)}, ${h(order.shippingAddress.barangay)}, ${h(order.shippingAddress.city)}, ${h(order.shippingAddress.province)}</td></tr>
  </table>
  <hr style="margin:16px 0">
  <h3 style="font-size:14px">Items</h3>
  <ul style="font-size:14px;line-height:2">
    ${order.items.map(i => `<li>${h(i.name)} — ${h(i.size)} x${i.quantity} — ₱${i.price.toLocaleString()}</li>`).join("")}
  </ul>
  <p style="font-size:12px;color:#888">Check Supabase orders table for full details.</p>
</body>
</html>`;

  return {
    subject: `New Order ${safeOrderNumber} — ₱${order.total.toLocaleString()} (${paymentLabel})`,
    html,
  };
}

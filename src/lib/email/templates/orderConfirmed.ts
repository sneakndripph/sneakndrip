import { h, stripNewlines, wrapEmail, BRAND_TEAL, BRAND_BLACK, BRAND_BG } from "../helpers";

export type OrderConfirmedData = {
  orderNumber: string;
  customer: { name: string; email: string; mobile: string };
  items: { name: string; size: string; quantity: number; price: number; payment_type: string }[];
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

function itemRows(items: OrderConfirmedData["items"]): string {
  return items.map(item => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #eee;">
        <strong style="color:${BRAND_BLACK}">${h(item.name)}</strong><br>
        <span style="color:#888;font-size:13px;">Size: ${h(item.size)} &nbsp;·&nbsp; ${item.payment_type === "downpayment" ? "Downpayment" : "Full Payment"} &nbsp;·&nbsp; x${item.quantity}</span>
      </td>
      <td style="padding:12px 0;border-bottom:1px solid #eee;text-align:right;font-weight:bold;color:${BRAND_BLACK}">
        ₱${item.price.toLocaleString()}
      </td>
    </tr>
  `).join("");
}

/** Customer-facing order confirmation email. */
export function orderConfirmedCustomer(order: OrderConfirmedData): { subject: string; html: string } {
  const safeOrderNumber = stripNewlines(order.orderNumber);

  const body = `
    <h1 style="color:${BRAND_BLACK};margin:0 0 24px;font-size:24px;font-weight:900;letter-spacing:1px">ORDER CONFIRMED!</h1>
    <p style="color:${BRAND_BLACK};font-size:16px;margin:0 0 24px">Hi <strong>${h(order.customer.name)}</strong>,</p>
    <p style="color:#555;font-size:15px;margin:0 0 24px;line-height:1.6">
      ${order.isCOD
        ? "Your order has been confirmed! We'll contact you on your mobile number before delivery."
        : "We've received your order and proof of payment. We'll verify your payment and process your order shortly."}
    </p>

    <div style="background:${BRAND_BG};border-radius:8px;padding:24px;margin-bottom:24px">
      <h3 style="margin:0 0 16px;color:${BRAND_BLACK};font-size:14px;text-transform:uppercase;letter-spacing:2px">Your Order</h3>
      <table style="width:100%;border-collapse:collapse">
        ${itemRows(order.items)}
        <tr>
          <td style="padding:8px 0;color:#888;font-size:14px">Subtotal</td>
          <td style="padding:8px 0;text-align:right;color:#888;font-size:14px">₱${order.subtotal.toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#888;font-size:14px">Shipping</td>
          <td style="padding:8px 0;text-align:right;color:#888;font-size:14px">${order.shipping === 0 ? "FREE" : "₱" + order.shipping.toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding:12px 0 0;font-weight:900;color:${BRAND_BLACK};font-size:18px">TOTAL</td>
          <td style="padding:12px 0 0;text-align:right;font-weight:900;color:${BRAND_TEAL};font-size:18px">₱${order.total.toLocaleString()}</td>
        </tr>
      </table>
    </div>

    <div style="display:grid;gap:16px;margin-bottom:24px">
      <div style="border:1px solid #eee;border-radius:8px;padding:20px">
        <h4 style="margin:0 0 10px;color:${BRAND_BLACK};font-size:13px;text-transform:uppercase;letter-spacing:1px">Ship To</h4>
        <p style="margin:0;color:#555;font-size:14px;line-height:1.6">
          ${h(order.shippingAddress.street)}, ${h(order.shippingAddress.barangay)}<br>
          ${h(order.shippingAddress.city)}, ${h(order.shippingAddress.province)} ${h(order.shippingAddress.postal)}<br>
          ${h(order.customer.mobile)}
        </p>
      </div>
      <div style="border:1px solid #eee;border-radius:8px;padding:20px">
        <h4 style="margin:0 0 10px;color:${BRAND_BLACK};font-size:13px;text-transform:uppercase;letter-spacing:1px">Payment</h4>
        <p style="margin:0;color:#555;font-size:14px">
          ${h(PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod)} &nbsp;·&nbsp; ${order.paymentType === "downpayment" ? "Downpayment" : "Full Payment"}
        </p>
        ${!order.isCOD ? `<p style="margin:6px 0 0;color:#888;font-size:13px">We'll verify your payment within 1–2 hours.</p>` : ""}
      </div>
    </div>

    ${!order.isCOD ? `
    <div style="background:#FFF8F0;border-left:4px solid ${BRAND_TEAL};padding:16px 20px;border-radius:4px;margin-bottom:24px">
      <p style="margin:0;color:${BRAND_BLACK};font-size:14px;font-weight:600">What happens next?</p>
      <p style="margin:6px 0 0;color:#555;font-size:13px;line-height:1.6">
        1. We verify your payment (1–2 hrs)<br>
        2. We prepare and pack your order<br>
        3. We ship and send you a tracking number
      </p>
    </div>` : ""}

    <p style="color:#888;font-size:13px;margin:0">Questions? Message us on <a href="https://www.facebook.com/SneakNDrip/" style="color:${BRAND_TEAL}">Facebook</a> or <a href="https://www.instagram.com/sneakndripph/" style="color:${BRAND_TEAL}">Instagram</a>.</p>
  `;

  return {
    subject: `Order Confirmed — ${safeOrderNumber} | Sneak N' Drip`,
    html: wrapEmail(body),
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

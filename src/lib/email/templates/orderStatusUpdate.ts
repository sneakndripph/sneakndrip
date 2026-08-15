import { h, wrapEmail, BRAND_TEAL, BRAND_BLACK, BRAND_BG } from "../helpers";

export type OrderStatusUpdateData = {
  orderNumber: string;
  customerName: string;
  trackingNumber: string | null;
  isCOD: boolean;
};

type Content = { subject: string; body: string };

function messages(data: OrderStatusUpdateData): Record<string, Content> {
  const { orderNumber, customerName, trackingNumber, isCOD } = data;
  const greeting = `Hi <strong>${h(customerName)}</strong>,`;

  return {
    paid: {
      subject: `Payment Confirmed — ${orderNumber} | Sneak N' Drip`,
      body: `
        <p style="color:#555;font-size:15px;margin:0 0 16px;line-height:1.6">${greeting}</p>
        <p style="color:#555;font-size:15px;margin:0 0 16px;line-height:1.6">
          Your payment for order <strong style="color:${BRAND_BLACK}">${h(orderNumber)}</strong> has been verified and confirmed!
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
          Great news! Your order <strong style="color:${BRAND_BLACK}">${h(orderNumber)}</strong> is now being packed and prepared for shipment.
        </p>
        <p style="color:#888;font-size:14px">We'll send you another update with your tracking number once your order ships.</p>
      `,
    },
    shipped: {
      subject: `Your Order Has Shipped! — ${orderNumber} | Sneak N' Drip`,
      body: `
        <p style="color:#555;font-size:15px;margin:0 0 16px;line-height:1.6">${greeting}</p>
        <p style="color:#555;font-size:15px;margin:0 0 16px;line-height:1.6">
          Your order <strong style="color:${BRAND_BLACK}">${h(orderNumber)}</strong> is on its way.
        </p>
        ${trackingNumber ? `
        <div style="background:${BRAND_BG};border-radius:8px;padding:20px;margin-bottom:20px;text-align:center">
          <p style="margin:0 0 6px;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px">Tracking Number</p>
          <p style="margin:0 0 12px;color:${BRAND_BLACK};font-size:20px;font-weight:900;letter-spacing:2px">${h(trackingNumber)}</p>
          <a href="https://www.jtexpress.ph/trajectoryQuery?billCode=${encodeURIComponent(String(trackingNumber ?? ""))}"
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
          Great news! Your pre-order <strong style="color:${BRAND_BLACK}">${h(orderNumber)}</strong> has arrived and is now with us.
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
          <a href="https://sneakndrip.ph/account?order=${encodeURIComponent(String(orderNumber ?? ""))}"
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
            ? `Your order <strong style="color:${BRAND_BLACK}">${h(orderNumber)}</strong> has been delivered and payment collected. Thank you for trusting Sneak N' Drip.`
            : `Your order <strong style="color:${BRAND_BLACK}">${h(orderNumber)}</strong> has been delivered. Your pair is finally home.`
          }
        </p>
        <div style="background:${BRAND_BG};border-left:4px solid ${BRAND_TEAL};padding:16px 20px;border-radius:4px;margin-bottom:20px">
          <p style="margin:0;color:${BRAND_BLACK};font-size:14px;font-weight:600">Thank you for trusting us.</p>
          <p style="margin:6px 0 0;color:#555;font-size:13px;line-height:1.8">
            Your support means the world to us. We hope you love your pair as much as we loved getting it to you.<br>
            Come back soon — more drops on the way.
          </p>
        </div>
        <p style="color:#888;font-size:14px">
          Tag us in your fit! Share on
          <a href="https://www.facebook.com/SneakNDrip/" style="color:${BRAND_TEAL}">Facebook</a> or
          <a href="https://www.instagram.com/sneakndripph/" style="color:${BRAND_TEAL}">Instagram</a>
          and we might feature you.
        </p>
      `,
    },
    cancelled: {
      subject: `Order Cancelled — ${orderNumber} | Sneak N' Drip`,
      body: `
        <p style="color:#555;font-size:15px;margin:0 0 16px;line-height:1.6">${greeting}</p>
        <p style="color:#555;font-size:15px;margin:0 0 16px;line-height:1.6">
          Your order <strong style="color:${BRAND_BLACK}">${h(orderNumber)}</strong> has been cancelled.
        </p>
        <div style="background:${BRAND_BG};border-left:4px solid ${BRAND_TEAL};padding:16px 20px;border-radius:4px;margin-bottom:20px">
          <p style="margin:0;color:${BRAND_BLACK};font-size:14px;font-weight:600">If you already paid</p>
          <p style="margin:6px 0 0;color:#555;font-size:13px;line-height:1.8">
            We'll process your refund within 3–5 business days to your original payment method.
          </p>
        </div>
        <p style="color:#888;font-size:14px">
          Questions? Message us on <a href="https://www.facebook.com/SneakNDrip/" style="color:${BRAND_TEAL}">Facebook</a> or
          <a href="https://www.instagram.com/sneakndripph/" style="color:${BRAND_TEAL}">Instagram</a>.
        </p>
      `,
    },
    returned: {
      subject: `Return Received — ${orderNumber} | Sneak N' Drip`,
      body: `
        <p style="color:#555;font-size:15px;margin:0 0 16px;line-height:1.6">${greeting}</p>
        <p style="color:#555;font-size:15px;margin:0 0 16px;line-height:1.6">
          We've received your returned order <strong style="color:${BRAND_BLACK}">${h(orderNumber)}</strong>.
        </p>
        <div style="background:${BRAND_BG};border-left:4px solid ${BRAND_TEAL};padding:16px 20px;border-radius:4px;margin-bottom:20px">
          <p style="margin:0;color:${BRAND_BLACK};font-size:14px;font-weight:600">What's next?</p>
          <p style="margin:6px 0 0;color:#555;font-size:13px;line-height:1.8">
            Our team will inspect the item and process your refund within 3–5 business days of approval.
          </p>
        </div>
        <p style="color:#888;font-size:14px">
          Questions? Message us on <a href="https://www.facebook.com/SneakNDrip/" style="color:${BRAND_TEAL}">Facebook</a> or
          <a href="https://www.instagram.com/sneakndripph/" style="color:${BRAND_TEAL}">Instagram</a>.
        </p>
      `,
    },
  };
}

/** Returns null for statuses with no customer-facing email (e.g. "pending"). */
export function orderStatusUpdate(status: string, data: OrderStatusUpdateData): { subject: string; html: string } | null {
  const content = messages(data)[status];
  if (!content) return null;
  return { subject: content.subject, html: wrapEmail(content.body) };
}

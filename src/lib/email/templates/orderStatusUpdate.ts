import { h, stripNewlines, wrapEmail, h1, h2, paragraph, button, divider, socialLinks } from "../helpers";

export type OrderStatusUpdateData = {
  orderNumber: string;
  customerName: string;
  trackingNumber: string | null;
  isCOD: boolean;
};

type Content = { subject: string; preview: string; body: string };

function messages(data: OrderStatusUpdateData): Record<string, Content> {
  const { customerName, trackingNumber, isCOD } = data;
  const orderNumber = stripNewlines(data.orderNumber);
  const greeting = `Hi <strong>${h(customerName)}</strong>,`;

  return {
    paid: {
      subject: `Payment Confirmed — ${orderNumber} | Sneak N' Drip`,
      preview: `Your payment for ${orderNumber} has been verified.`,
      body: `
        ${h1("Payment Confirmed")}
        ${paragraph(`${greeting} your payment for order <strong>${h(orderNumber)}</strong> has been verified and confirmed!`)}

        ${divider()}

        ${h2("What Happens Next")}
        ${paragraph("1. We prepare and pack your order<br>2. We ship your pair and send a tracking number<br>3. Your sneakers arrive at your door")}
      `,
    },
    processing: {
      subject: `Order Being Packed — ${orderNumber} | Sneak N' Drip`,
      preview: `${orderNumber} is being packed and prepared for shipment.`,
      body: `
        ${h1("Order Being Packed")}
        ${paragraph(`${greeting} your order <strong>${h(orderNumber)}</strong> is now being packed and prepared for shipment.`)}
        ${paragraph("We'll send you another update with your tracking number once your order ships.")}
      `,
    },
    shipped: {
      subject: `Your Order Has Shipped! — ${orderNumber} | Sneak N' Drip`,
      preview: `${orderNumber} is on its way.`,
      body: `
        ${h1("Your Order Has Shipped")}
        ${paragraph(`${greeting} your order <strong>${h(orderNumber)}</strong> is on its way.`)}

        ${trackingNumber ? `
        ${divider()}

        ${h2("Tracking Number")}
        ${paragraph(`<strong style="font-size:20px;letter-spacing:0.05em">${h(trackingNumber)}</strong>`)}
        ${button("Track via J&amp;T Express →", `https://www.jtexpress.ph/trajectoryQuery?billCode=${encodeURIComponent(String(trackingNumber ?? ""))}`)}
        ` : ""}

        ${paragraph(`Track your delivery using the link above or visit <a href="https://www.jtexpress.ph">J&amp;T Express</a>.`)}
      `,
    },
    stock_on_hand: {
      subject: `Your Pre-Order Has Arrived! — ${orderNumber} | Sneak N' Drip`,
      preview: `${orderNumber} has arrived and is now with us.`,
      body: `
        ${h1("Your Pre-Order Has Arrived")}
        ${paragraph(`${greeting} great news — your pre-order <strong>${h(orderNumber)}</strong> has arrived and is now with us.`)}

        ${divider()}

        ${h2("What's Next")}
        ${paragraph("1. Please settle your remaining balance before we ship your order<br>2. Once balance is confirmed, we'll pack and ship your pair<br>3. We'll send you a tracking number once it's on the way")}
        ${button("Pay Balance Now →", `https://sneakndrip.ph/account?order=${encodeURIComponent(String(orderNumber ?? ""))}`)}

        ${divider()}

        ${paragraph("Questions? Message us on Instagram, TikTok, or Facebook.")}
        ${socialLinks()}
      `,
    },
    delivered: {
      subject: isCOD
        ? `Order Delivered & Payment Collected — ${orderNumber} | Sneak N' Drip`
        : `Your Sneakers Have Landed! — ${orderNumber} | Sneak N' Drip`,
      preview: isCOD ? `${orderNumber} delivered, payment collected.` : `${orderNumber} has landed.`,
      body: `
        ${h1(isCOD ? "Order Delivered" : "Your Sneakers Have Landed")}
        ${paragraph(
          isCOD
            ? `${greeting} your order <strong>${h(orderNumber)}</strong> has been delivered and payment collected. Thank you for trusting Sneak N' Drip.`
            : `${greeting} your order <strong>${h(orderNumber)}</strong> has been delivered. Your pair is finally home.`,
        )}

        ${divider()}

        ${h2("Thank You For Trusting Us")}
        ${paragraph("Your support means the world to us. We hope you love your pair as much as we loved getting it to you.<br>Come back soon — more drops on the way.")}
        ${paragraph("Tag us in your fit — share on Instagram, TikTok, or Facebook and we might feature you.")}
        ${socialLinks()}
      `,
    },
    cancelled: {
      subject: `Order Cancelled — ${orderNumber} | Sneak N' Drip`,
      preview: `${orderNumber} has been cancelled.`,
      body: `
        ${h1("Order Cancelled")}
        ${paragraph(`${greeting} your order <strong>${h(orderNumber)}</strong> has been cancelled.`)}

        ${divider()}

        ${h2("If You Already Paid")}
        ${paragraph("We'll process your refund within 3–5 business days to your original payment method.")}

        ${divider()}

        ${paragraph("Questions? Message us on Instagram, TikTok, or Facebook.")}
        ${socialLinks()}
      `,
    },
    returned: {
      subject: `Return Received — ${orderNumber} | Sneak N' Drip`,
      preview: `We've received your return for ${orderNumber}.`,
      body: `
        ${h1("Return Received")}
        ${paragraph(`${greeting} we've received your returned order <strong>${h(orderNumber)}</strong>.`)}

        ${divider()}

        ${h2("What's Next")}
        ${paragraph("Our team will inspect the item and process your refund within 3–5 business days of approval.")}

        ${divider()}

        ${paragraph("Questions? Message us on Instagram, TikTok, or Facebook.")}
        ${socialLinks()}
      `,
    },
  };
}

/** Returns null for statuses with no customer-facing email (e.g. "pending"). */
export function orderStatusUpdate(status: string, data: OrderStatusUpdateData): { subject: string; html: string } | null {
  const content = messages(data)[status];
  if (!content) return null;
  return { subject: content.subject, html: wrapEmail(content.body, { previewText: content.preview }) };
}

import {
  h, stripNewlines, wrapEmail, h1, paragraph, productLine, button, divider, socialLinks,
  FONT_STACK, BRAND_INK, BRAND_INK_MUTED,
} from "../helpers";

export type AbandonedCartItem = {
  name: string;
  size: string;
  imageUrl?: string;
  quantity: number;
  unit_price: number;
  /** SRP, if this product has one — used for the "You save" line. */
  srp_price?: number;
  brand?: string;
  paymentType: "full_payment" | "downpayment";
};

export type AbandonedCartData = {
  variant: "1h" | "24h";
  customerName?: string;
  items: AbandonedCartItem[];
  subtotal: number;
  /** Smart-routed URL (resume-cart) that resolves to /cart or /login at click-time. */
  cartUrl: string;
};

const COPY = {
  "1h": {
    subject: "You left something behind",
    heading: "You left something behind",
    body: "Your selections are still in your cart. Complete your order to secure them.",
  },
  "24h": {
    subject: "Still thinking about it?",
    heading: "Still thinking about it?",
    body: "Your cart is still saved. Sizes go quickly — return anytime to check out.",
  },
} as const;

function itemLines(items: AbandonedCartItem[]): string {
  return items.map(item => {
    const meta = [
      `x${item.quantity}`,
      item.paymentType === "downpayment" ? "Downpayment" : "Full Payment",
    ].join(" &middot; ");
    return productLine({
      name: `${item.brand ? `${h(item.brand)} — ` : ""}${h(item.name)}`,
      size: `${h(item.size)} &middot; ${meta}`,
      price: item.unit_price * item.quantity,
      imageUrl: item.imageUrl,
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

/**
 * Cart abandonment email (1h nudge / 24h reminder). Savings only counts
 * full-payment lines — a downpayment's unit_price is a partial amount, so
 * srp_price minus it would overstate what the customer actually saves.
 */
export function abandonedCart(data: AbandonedCartData): { subject: string; html: string } {
  const { variant, customerName, items, subtotal, cartUrl } = data;
  const copy = COPY[variant];
  const savings = items.reduce(
    (sum, item) => item.paymentType === "full_payment" && item.srp_price != null
      ? sum + Math.max(0, item.srp_price - item.unit_price) * item.quantity
      : sum,
    0
  );

  const body = `
    ${h1(copy.heading)}
    ${paragraph(`${customerName ? `Hi <strong>${h(customerName)}</strong>, ` : ""}${copy.body}`)}

    ${divider()}

    ${itemLines(items)}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 24px">
      ${totalsRow("Subtotal", `₱${subtotal.toLocaleString()}`, { strong: true })}
      ${savings > 0 ? totalsRow("You save", `₱${savings.toLocaleString()}`) : ""}
    </table>

    ${button("Complete My Order →", cartUrl)}

    ${divider()}

    ${paragraph("Questions? Message us on Instagram, TikTok, or Facebook.")}
    ${socialLinks()}
  `;

  return {
    subject: stripNewlines(copy.subject),
    html: wrapEmail(body, { previewText: copy.body }),
  };
}

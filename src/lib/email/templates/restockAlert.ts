import { h } from "../helpers";

export type RestockAlertData = {
  productName: string;
  productSlug: string;
  size: string;
};

/** Customer-facing "back in stock" alert. Plain layout — not the branded wrapEmail. */
export function restockAlert(data: RestockAlertData): { subject: string; html: string } {
  const { productName, productSlug, size } = data;
  const productUrl = `https://sneakndrip.ph/shop/${productSlug}`;

  const html = `
    <div style="max-width:500px;margin:0 auto;font-family:Arial,sans-serif;padding:24px">
      <h2 style="color:#0D0D0D">Back In Stock!</h2>
      <p style="color:#555;font-size:15px">Good news! <strong>${h(productName)}</strong> in size <strong>${h(size)}</strong> is now available.</p>
      <a href="${productUrl}" style="display:inline-block;background:#5BB8B4;color:#fff;padding:12px 24px;text-decoration:none;font-weight:bold;margin-top:12px">Grab It Now →</a>
      <p style="color:#aaa;font-size:12px;margin-top:24px">You requested to be notified when this item restocked. Reply to unsubscribe.</p>
    </div>`;

  return {
    subject: `${productName} (${size}) is back in stock!`,
    html,
  };
}

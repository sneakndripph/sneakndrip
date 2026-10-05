import { h, stripNewlines, wrapEmail, h1, paragraph, productLine, button, divider, socialLinks, reasonLine } from "../helpers";

export type RestockAlertData = {
  productName: string;
  productSlug: string;
  size: string;
  imageUrl?: string;
  source?: "explicit" | "wishlist";
  /**
   * Whether the recipient has a customer account, which decides if the footer
   * links to email preferences. Wishlist recipients always do; explicit
   * sign-ups may be guests, whose one-shot row is deleted after this send.
   */
  hasAccount?: boolean;
};

const FOOTER_COPY: Record<"explicit" | "wishlist", string> = {
  explicit: "You're receiving this because you asked to be notified when this item restocks.",
  wishlist: "You're receiving this because this item is on your wishlist.",
};

/** Customer-facing "back in stock" alert, sent to restock_notifications subscribers. */
export function restockAlert(data: RestockAlertData): { subject: string; html: string } {
  const { productName, size, imageUrl, source = "explicit", hasAccount = false } = data;
  const productSlug = stripNewlines(data.productSlug);
  const productUrl = `https://sneakndrip.ph/shop/${productSlug}`;

  const body = `
    ${h1("Back In Stock")}
    ${paragraph("The item you asked about is available again.")}
    ${productLine({ name: h(productName), size: h(size), imageUrl })}
    ${button("Shop Now →", productUrl)}

    ${divider()}

    ${reasonLine(FOOTER_COPY[source], { preferencesLink: source === "wishlist" || hasAccount })}
    ${socialLinks()}
  `;

  return {
    subject: `${stripNewlines(productName)} (${stripNewlines(size)}) is back in stock!`,
    html: wrapEmail(body, { previewText: `${productName} (${size}) is back in stock.` }),
  };
}

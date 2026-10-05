import { h, stripNewlines, wrapEmail, h1, paragraph, productLine, button, divider, socialLinks, reasonLine, unsubscribeUrlLink } from "../helpers";

export type RestockAlertData = {
  productName: string;
  productSlug: string;
  size: string;
  imageUrl?: string;
  source?: "explicit" | "wishlist";
  /**
   * Set for guest recipients (explicit sign-ups without a customer account):
   * a signed one-click unsubscribe link replaces the email preferences link,
   * since they have no account to manage. Wishlist recipients always have one.
   */
  signedUnsubscribeUrl?: string;
};

const FOOTER_COPY: Record<"explicit" | "wishlist", string> = {
  explicit: "You're receiving this because you asked to be notified when this item restocks.",
  wishlist: "You're receiving this because this item is on your wishlist.",
};

/** Customer-facing "back in stock" alert, sent to restock_notifications subscribers. */
export function restockAlert(data: RestockAlertData): { subject: string; html: string } {
  const { productName, size, imageUrl, source = "explicit", signedUnsubscribeUrl } = data;
  const productSlug = stripNewlines(data.productSlug);
  const productUrl = `https://sneakndrip.ph/shop/${productSlug}`;

  const body = `
    ${h1("Back In Stock")}
    ${paragraph("The item you asked about is available again.")}
    ${productLine({ name: h(productName), size: h(size), imageUrl })}
    ${button("Shop Now →", productUrl)}

    ${divider()}

    ${reasonLine(FOOTER_COPY[source], { preferencesLink: !signedUnsubscribeUrl })}
    ${socialLinks()}
    ${signedUnsubscribeUrl ? unsubscribeUrlLink(signedUnsubscribeUrl) : ""}
  `;

  return {
    subject: `${stripNewlines(productName)} (${stripNewlines(size)}) is back in stock!`,
    html: wrapEmail(body, { previewText: `${productName} (${size}) is back in stock.` }),
  };
}

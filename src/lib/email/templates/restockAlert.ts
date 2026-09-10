import { h, stripNewlines, wrapEmail, h1, paragraph, productLine, button, divider, socialLinks } from "../helpers";

export type RestockAlertData = {
  productName: string;
  productSlug: string;
  size: string;
  imageUrl?: string;
  source?: "explicit" | "wishlist";
};

const FOOTER_COPY: Record<"explicit" | "wishlist", string> = {
  explicit: "You're getting this because you asked to be notified when this item restocked.",
  wishlist: "You're getting this because this item is on your wishlist.",
};

/** Customer-facing "back in stock" alert, sent to restock_notifications subscribers. */
export function restockAlert(data: RestockAlertData): { subject: string; html: string } {
  const { productName, size, imageUrl, source = "explicit" } = data;
  const productSlug = stripNewlines(data.productSlug);
  const productUrl = `https://sneakndrip.ph/shop/${productSlug}`;

  const body = `
    ${h1("Back In Stock")}
    ${paragraph("The item you asked about is available again.")}
    ${productLine({ name: h(productName), size: h(size), imageUrl })}
    ${button("Shop Now →", productUrl)}

    ${divider()}

    ${paragraph(FOOTER_COPY[source])}
    ${socialLinks()}
  `;

  return {
    subject: `${stripNewlines(productName)} (${stripNewlines(size)}) is back in stock!`,
    html: wrapEmail(body, { previewText: `${productName} (${size}) is back in stock.` }),
  };
}

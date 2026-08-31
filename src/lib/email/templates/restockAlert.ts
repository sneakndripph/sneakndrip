import { h, stripNewlines, wrapEmail, h1, paragraph, productLine, button, divider, socialLinks } from "../helpers";

export type RestockAlertData = {
  productName: string;
  productSlug: string;
  size: string;
  imageUrl?: string;
};

/** Customer-facing "back in stock" alert, sent to restock_notifications subscribers. */
export function restockAlert(data: RestockAlertData): { subject: string; html: string } {
  const { productName, size, imageUrl } = data;
  const productSlug = stripNewlines(data.productSlug);
  const productUrl = `https://sneakndrip.ph/shop/${productSlug}`;

  const body = `
    ${h1("Back In Stock")}
    ${paragraph("The item you asked about is available again.")}
    ${productLine({ name: h(productName), size: h(size), imageUrl })}
    ${button("Shop Now →", productUrl)}

    ${divider()}

    ${paragraph("You're getting this because you asked to be notified when this item restocked.")}
    ${socialLinks()}
  `;

  return {
    subject: `${stripNewlines(productName)} (${stripNewlines(size)}) is back in stock!`,
    html: wrapEmail(body, { previewText: `${productName} (${size}) is back in stock.` }),
  };
}

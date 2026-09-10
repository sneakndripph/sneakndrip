import { h, stripNewlines, wrapEmail, h1, paragraph, productLine, button, divider, socialLinks, unsubscribeLink } from "../helpers";

export type NewArrivalData = {
  customerEmail: string;
  unsubscribeToken: string;
  product: {
    name: string;
    brand: string;
    slug: string;
    imageUrl?: string;
    price: number;
  };
};

/** New-arrival announcement, sent to newsletter subscribers when an admin publishes a product with notifications on. */
export function newArrival(data: NewArrivalData): { subject: string; html: string } {
  const { unsubscribeToken, product } = data;
  const productSlug = stripNewlines(product.slug);
  const productUrl = `https://sneakndrip.ph/shop/${productSlug}`;

  const body = `
    ${h1("New Arrival")}
    ${paragraph("Just added to our collection.")}
    ${productLine({ name: h(`${product.brand} ${product.name}`), imageUrl: product.imageUrl })}
    ${paragraph(`₱${product.price.toLocaleString()}`)}
    ${button("Shop Now →", productUrl)}

    ${divider()}

    ${socialLinks()}
    ${unsubscribeLink(unsubscribeToken)}
  `;

  return {
    subject: `New arrival: ${stripNewlines(product.name)}`,
    html: wrapEmail(body, { previewText: `${product.brand} ${product.name} just dropped.` }),
  };
}

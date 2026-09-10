import { wrapEmail, h1, paragraph, button, divider, socialLinks, unsubscribeLink } from "../helpers";

/** Welcome email sent to a new newsletter subscriber. `unsubscribeToken` is that subscriber's row token. */
export function newsletterWelcome(unsubscribeToken: string): { subject: string; html: string } {
  const body = `
    ${h1("You're On The List")}
    ${paragraph("Welcome to Sneak N' Drip. You'll be the first to know about new drops, restocks, and exclusive below-SRP deals.")}
    ${button("Shop Now →", "https://sneakndrip.ph/shop")}

    ${divider()}

    ${paragraph("Questions? Message us on Instagram, TikTok, or Facebook.")}
    ${socialLinks()}
    ${unsubscribeLink(unsubscribeToken)}
  `;

  return {
    subject: "You're in! Welcome to Sneak N' Drip",
    html: wrapEmail(body, { previewText: "New drops, restocks, and exclusive below-SRP deals — first look." }),
  };
}

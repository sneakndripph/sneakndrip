import { h, stripNewlines, wrapEmail, h1, h2, paragraph, divider, socialLinks } from "../helpers";

export type ReturnDeniedData = {
  orderNumber: string;
  customerName: string;
  /**
   * Free-text reason the admin entered when denying. The admin UI requires this
   * field non-empty on deny (see src/app/admin/returns/page.tsx), unlike the
   * optional note on approve — there is no separate deny_reason column, both
   * actions write to the shared admin_note field.
   */
  adminNote: string;
};

/** Customer-facing "your return was denied" email. */
export function returnDenied(data: ReturnDeniedData): { subject: string; html: string } {
  const { customerName, adminNote } = data;
  const orderNumber = stripNewlines(data.orderNumber);

  const body = `
    ${h1("Return Request Update")}
    ${paragraph(`Hi <strong>${h(customerName)}</strong>, we've reviewed your return request for order <strong>${h(orderNumber)}</strong> and unfortunately it has not been approved.`)}

    ${divider()}

    ${h2("Reason")}
    ${paragraph(h(adminNote))}

    ${divider()}

    ${paragraph("If you believe this is a mistake, message us on Instagram, TikTok, or Facebook and we'll take another look.")}
    ${socialLinks()}
  `;

  return {
    subject: `Return Request Update — ${orderNumber} | Sneak N' Drip`,
    html: wrapEmail(body, { previewText: `An update on your return request for ${orderNumber}.` }),
  };
}

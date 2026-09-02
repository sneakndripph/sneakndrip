import { h, stripNewlines, wrapEmail, h1, h2, paragraph, divider, socialLinks } from "../helpers";

export type ReturnApprovedData = {
  orderNumber: string;
  customerName: string;
  /** Free-text note the admin entered when approving (refund amount + comments, if any). */
  adminNote: string | null;
};

/** Customer-facing "your return was approved" email. */
export function returnApproved(data: ReturnApprovedData): { subject: string; html: string } {
  const { customerName, adminNote } = data;
  const orderNumber = stripNewlines(data.orderNumber);

  const body = `
    ${h1("Return Approved")}
    ${paragraph(`Hi <strong>${h(customerName)}</strong>, your return request for order <strong>${h(orderNumber)}</strong> has been approved.`)}

    ${adminNote ? `
    ${divider()}

    ${h2("Note From Our Team")}
    ${paragraph(h(adminNote))}
    ` : ""}

    ${divider()}

    ${paragraph("Your refund will be processed within 3–5 business days. Questions? Message us on Instagram, TikTok, or Facebook.")}
    ${socialLinks()}
  `;

  return {
    subject: `Return Approved — ${orderNumber} | Sneak N' Drip`,
    html: wrapEmail(body, { previewText: `Your return for ${orderNumber} has been approved.` }),
  };
}

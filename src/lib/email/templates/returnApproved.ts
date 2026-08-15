import { h, wrapEmail, BRAND_TEAL, BRAND_BLACK, BRAND_BG } from "../helpers";

export type ReturnApprovedData = {
  orderNumber: string;
  customerName: string;
  /** Free-text note the admin entered when approving (refund amount + comments, if any). */
  adminNote: string | null;
};

/** Customer-facing "your return was approved" email. */
export function returnApproved(data: ReturnApprovedData): { subject: string; html: string } {
  const { orderNumber, customerName, adminNote } = data;

  const body = `
    <p style="color:#555;font-size:15px;margin:0 0 16px;line-height:1.6">Hi <strong>${h(customerName)}</strong>,</p>
    <p style="color:#555;font-size:15px;margin:0 0 16px;line-height:1.6">
      Your return request for order <strong style="color:${BRAND_BLACK}">${h(orderNumber)}</strong> has been <strong style="color:${BRAND_TEAL}">approved</strong>.
    </p>
    ${adminNote ? `
    <div style="background:${BRAND_BG};border-left:4px solid ${BRAND_TEAL};padding:16px 20px;border-radius:4px;margin-bottom:20px">
      <p style="margin:0;color:${BRAND_BLACK};font-size:14px;font-weight:600">Note from our team</p>
      <p style="margin:6px 0 0;color:#555;font-size:13px;line-height:1.8">${h(adminNote)}</p>
    </div>` : ""}
    <p style="color:#888;font-size:14px">
      Your refund will be processed within 3–5 business days. Questions? Message us on
      <a href="https://www.facebook.com/SneakNDrip/" style="color:${BRAND_TEAL}">Facebook</a> or
      <a href="https://www.instagram.com/sneakndripph/" style="color:${BRAND_TEAL}">Instagram</a>.
    </p>
  `;

  return {
    subject: `Return Approved — ${orderNumber} | Sneak N' Drip`,
    html: wrapEmail(body),
  };
}

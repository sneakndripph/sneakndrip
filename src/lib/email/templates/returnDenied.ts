import { h, wrapEmail, BRAND_TEAL, BRAND_BLACK, BRAND_BG } from "../helpers";

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
  const { orderNumber, customerName, adminNote } = data;

  const body = `
    <p style="color:#555;font-size:15px;margin:0 0 16px;line-height:1.6">Hi <strong>${h(customerName)}</strong>,</p>
    <p style="color:#555;font-size:15px;margin:0 0 16px;line-height:1.6">
      We've reviewed your return request for order <strong style="color:${BRAND_BLACK}">${h(orderNumber)}</strong> and unfortunately it has not been approved.
    </p>
    <div style="background:${BRAND_BG};border-left:4px solid ${BRAND_BLACK};padding:16px 20px;border-radius:4px;margin-bottom:20px">
      <p style="margin:0;color:${BRAND_BLACK};font-size:14px;font-weight:600">Reason</p>
      <p style="margin:6px 0 0;color:#555;font-size:13px;line-height:1.8">${h(adminNote)}</p>
    </div>
    <p style="color:#888;font-size:14px">
      If you believe this is a mistake, message us on
      <a href="https://www.facebook.com/SneakNDrip/" style="color:${BRAND_TEAL}">Facebook</a> or
      <a href="https://www.instagram.com/sneakndripph/" style="color:${BRAND_TEAL}">Instagram</a> and we'll take another look.
    </p>
  `;

  return {
    subject: `Return Request Update — ${orderNumber} | Sneak N' Drip`,
    html: wrapEmail(body),
  };
}

export const BRAND_TEAL = "#5BB8B4";
export const BRAND_BLACK = "#0D0D0D";
export const BRAND_BG = "#F2F0EF";

/** HTML-escape untrusted text before interpolating into an email template. */
export function h(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Strips CRLF so untrusted text can't inject headers into email subjects. */
export function stripNewlines(s: unknown): string {
  return String(s ?? "").replace(/[\r\n]/g, "");
}

/** Formats a whole-peso amount (this codebase stores/passes totals as whole pesos, not cents). */
export function formatCurrency(amount: number): string {
  return `₱${amount.toLocaleString()}`;
}

/** Outer branded <html>/<body> wrapper shared by all customer-facing emails. */
export function wrapEmail(bodyHtml: string, options?: { previewText?: string }): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  ${options?.previewText ? `<div style="display:none;max-height:0;overflow:hidden">${h(options.previewText)}</div>` : ""}
  <div style="max-width:580px;margin:40px auto;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
    <div style="background:${BRAND_BLACK};padding:28px 40px;text-align:center">
      <img src="https://sneakndrip.ph/sneakndrip-logo.gif" alt="SNEAK N' DRIP" width="200" style="display:block;margin:0 auto;border:0;max-width:200px" />
    </div>
    <div style="padding:32px 40px">${bodyHtml}</div>
    <div style="background:${BRAND_BLACK};padding:18px 40px;text-align:center">
      <p style="color:#666;font-size:12px;margin:0">© 2025 Sneak N' Drip · Philippines · 100% Authentic Sneakers</p>
    </div>
  </div>
</body>
</html>`;
}

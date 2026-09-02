// ─── Legacy brand tokens ──────────────────────────────────────────────────
// Still used by templates not yet migrated to the paper & ink system below
// (orderConfirmed, orderStatusUpdate, returnApproved, returnDenied). Keep
// until those are redesigned, then remove.
export const BRAND_TEAL = "#5BB8B4";
export const BRAND_BLACK = "#0D0D0D";
export const BRAND_BG = "#F2F0EF";

// ─── Paper & ink design system ───────────────────────────────────────────
// Mirrors the website's tokens in src/app/globals.css (--paper, --ink, --line).
export const BRAND_PAPER = "#FAFAF8";
export const BRAND_INK = "#0A0A0A";
export const BRAND_INK_MUTED = "#6B6B65";
export const BRAND_LINE = "#E5E4E0";

export const FONT_STACK = "'Inter Tight',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";

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

/**
 * Outer branded wrapper: paper background, "SNEAK N' DRIP" text wordmark header,
 * thin divider + minimal copyright footer. Table-based layout for Outlook/Gmail
 * compatibility; all component styles are inline, only the mobile breakpoint
 * lives in a <style> block since media queries can't be inlined.
 *
 * `bodyHtml` is trusted HTML — build it with the h1/h2/paragraph/button/etc
 * helpers below and escape any dynamic values with h() before interpolating.
 */
export function wrapEmail(bodyHtml: string, options?: { previewText?: string }): string {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  @media only screen and (max-width:600px) {
    .sd-px { padding-left:24px !important; padding-right:24px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${BRAND_PAPER};font-family:${FONT_STACK};">
  ${options?.previewText ? `<div style="display:none;max-height:0;overflow:hidden">${h(options.previewText)}</div>` : ""}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND_PAPER}">
    <tr>
      <td align="center" style="padding:0 20px">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px">
          <tr>
            <td align="center" style="padding:40px 20px 32px">
              <span style="font-family:${FONT_STACK};font-size:28px;font-weight:500;letter-spacing:-0.03em;color:${BRAND_INK}">SNEAK N' DRIP</span>
            </td>
          </tr>
          <tr>
            <td class="sd-px" style="padding:0 48px 40px">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td class="sd-px" style="padding:0 48px">
              <div style="border-top:1px solid ${BRAND_LINE};font-size:0;line-height:0">&nbsp;</div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:24px 20px 40px">
              <p style="margin:0;font-family:${FONT_STACK};font-size:12px;color:${BRAND_INK_MUTED}">© ${year} Sneak N' Drip &middot; Philippines</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Composable content helpers ──────────────────────────────────────────
// All accept pre-built HTML strings — escape dynamic values with h() at the
// call site before interpolating, same convention as the wrapEmail body.

/** Big display heading, ~32px, matching the website's editorial headings. */
export function h1(text: string): string {
  return `<h1 style="margin:0 0 20px;font-family:${FONT_STACK};font-size:32px;font-weight:500;letter-spacing:-0.03em;line-height:1.2;color:${BRAND_INK}">${text}</h1>`;
}

/** Section heading, ~20px. */
export function h2(text: string): string {
  return `<h2 style="margin:0 0 12px;font-family:${FONT_STACK};font-size:20px;font-weight:500;letter-spacing:-0.01em;color:${BRAND_INK}">${text}</h2>`;
}

/** Body copy paragraph. */
export function paragraph(text: string): string {
  return `<p style="margin:0 0 16px;font-family:${FONT_STACK};font-size:15px;line-height:24px;color:${BRAND_INK}">${text}</p>`;
}

/** Solid ink button, white label — matches the website's primary CTA (bg-ink text-paper). */
export function button(label: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 8px"><tr>
    <td align="center" style="border-radius:6px;background:${BRAND_INK}">
      <a href="${url}" style="display:inline-block;padding:14px 32px;font-family:${FONT_STACK};font-size:15px;font-weight:500;color:#FFFFFF;text-decoration:none">${label}</a>
    </td>
  </tr></table>`;
}

export type ProductLineItem = {
  /** Pre-escaped product name (wrap dynamic values with h() before passing in). */
  name: string;
  size?: string;
  price?: number;
  imageUrl?: string;
};

/**
 * Inline product row: 60x60 thumbnail slot left (vertically centered, 16px
 * gap), name + size + price right. No card/box background. The slot always
 * renders so layout stays consistent — with an <img> when imageUrl is given,
 * or a plain BRAND_LINE-filled square otherwise. A load failure on a present
 * URL is a client-side concern email HTML can't intercept; the square's own
 * background keeps that case tidy too.
 */
export function productLine(product: ProductLineItem): string {
  const { name, size, price, imageUrl } = product;
  const meta = [size ? `Size ${size}` : null, price != null ? formatCurrency(price) : null]
    .filter(Boolean)
    .join(" &middot; ");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px"><tr>
    <td width="60" style="width:60px;padding-right:16px;vertical-align:middle">
      ${imageUrl
        ? `<img src="${imageUrl}" width="60" height="60" alt="" style="display:block;width:60px;height:60px;object-fit:cover;border-radius:6px;border:1px solid ${BRAND_LINE};background:${BRAND_LINE}">`
        : `<div style="width:60px;height:60px;border-radius:6px;background:${BRAND_LINE}"></div>`}
    </td>
    <td style="vertical-align:middle">
      <p style="margin:0 0 4px;font-family:${FONT_STACK};font-size:15px;font-weight:500;color:${BRAND_INK}">${name}</p>
      ${meta ? `<p style="margin:0;font-family:${FONT_STACK};font-size:13px;color:${BRAND_INK_MUTED}">${meta}</p>` : ""}
    </td>
  </tr></table>`;
}

/** Thin horizontal divider. */
export function divider(): string {
  return `<div style="border-top:1px solid ${BRAND_LINE};margin:24px 0;font-size:0;line-height:0">&nbsp;</div>`;
}

const SOCIAL_LINKS = [
  { name: "Instagram", href: "https://www.instagram.com/sneakndripph/" },
  { name: "TikTok", href: "https://www.tiktok.com/@sneakyjuls" },
  { name: "Facebook", href: "https://www.facebook.com/SneakNDrip/" },
];

/** Minimal "Instagram · TikTok · Facebook" link row for template footers. */
export function socialLinks(): string {
  const links = SOCIAL_LINKS.map(
    l => `<a href="${l.href}" style="color:${BRAND_INK_MUTED};text-decoration:underline">${l.name}</a>`,
  ).join(" &middot; ");
  return `<p style="margin:0;font-family:${FONT_STACK};font-size:12px;color:${BRAND_INK_MUTED}">${links}</p>`;
}

/** Small unsubscribe link for template footers. */
export function unsubscribeLink(url: string): string {
  return `<p style="margin:8px 0 0;font-family:${FONT_STACK};font-size:12px;color:${BRAND_INK_MUTED}">
    <a href="${url}" style="color:${BRAND_INK_MUTED};text-decoration:underline">Unsubscribe</a>
  </p>`;
}

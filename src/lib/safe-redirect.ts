/**
 * Validates a user-supplied post-auth redirect target (e.g. ?next=). Only plain
 * same-site paths pass; anything else returns `fallback`. Callers build
 * `${origin}${next}`, so a value like "@evil.com" would otherwise become
 * https://site@evil.com and send the browser off-site.
 */
export function safeNext(next: string | null | undefined, fallback = "/shop"): string {
  if (!next) return fallback;
  if (!next.startsWith("/")) return fallback;
  // Protocol-relative ("//evil.com"); browsers also treat "\" as "/"
  if (next.startsWith("//") || next.includes("\\")) return fallback;
  // Userinfo exploit ("@evil.com" → https://site@evil.com)
  if (next.includes("@")) return fallback;
  // Browsers strip tabs/newlines from URLs, so "/\t/evil.com" would become "//evil.com"
  if (/[\x00-\x1f\x7f]/.test(next)) return fallback;
  if (/^[a-z][a-z0-9+.-]*:/i.test(next)) return fallback;
  return next;
}

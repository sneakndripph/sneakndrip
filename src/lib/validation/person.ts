// Client-side checks for customer name/mobile fields. Returns an error message, or "" when valid.

const NAME_RE = /^\p{L}[\p{L}\p{M} .'-]*$/u; // letters (incl. ñ, accents), spaces, . ' -

export function nameError(value: string, label: string): string {
  const v = value.trim();
  if (!v) return `${label} is required`;
  if (v.length < 2) return `${label} must be at least 2 characters`;
  if (v.length > 50) return `${label} must be 50 characters or less`;
  if (!NAME_RE.test(v)) return `${label} can only contain letters, spaces, hyphens, apostrophes and periods`;
  return "";
}

export function mobileError(value: string): string {
  if (!value) return "Mobile number is required";
  if (!/^09\d{9}$/.test(value)) return "Enter an 11-digit mobile number starting with 09";
  return "";
}

/** Best-effort split for accounts saved before first/last name existed: last word is the last name. */
export function splitFullName(full: string): { first: string; last: string } {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return { first: parts[0] ?? "", last: "" };
  return { first: parts.slice(0, -1).join(" "), last: parts[parts.length - 1] };
}

/** Collapses repeated spaces so "Juan  Dela   Cruz" saves cleanly. */
export const cleanName = (v: string) => v.trim().replace(/\s+/g, " ");

/**
 * Current Terms of Service / Privacy Policy versions, as dates (YYYY-MM-DD).
 * Matches the site_pages rows for "terms" and "privacy" updated 2026-10-02
 * (mirrored in the FALLBACK constants in src/app/(store)/{terms,privacy}/page.tsx).
 * Bump these whenever either policy changes materially — users whose
 * user_metadata.terms_version doesn't match are asked to re-accept on their
 * next OAuth sign-in (see src/app/auth/callback/route.ts).
 */
export const TERMS_VERSION = "2026-10-02";
export const PRIVACY_VERSION = "2026-10-02";

export type ConsentSource = "register" | "oauth";

/** user_metadata fields recording Terms/Privacy acceptance. */
export function consentMetadata(source: ConsentSource) {
  return {
    terms_accepted_at: new Date().toISOString(),
    terms_version: TERMS_VERSION,
    privacy_version: PRIVACY_VERSION,
    consent_source: source,
  };
}

/** True if the user has accepted the current Terms and Privacy Policy versions. */
export function hasCurrentConsent(meta: Record<string, unknown> | undefined | null): boolean {
  return meta?.terms_version === TERMS_VERSION && meta?.privacy_version === PRIVACY_VERSION;
}

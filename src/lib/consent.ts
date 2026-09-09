// Shared cookie-consent storage schema, read/written by both CookieBanner
// (writer) and GoogleAnalytics (reader). Kept in one place so the two never
// drift on key names or the migration rule.

export type ConsentState = {
  essential: true;
  analytics: boolean;
  consented_at: number;
};

export const CONSENT_STORAGE_KEY = "cookie-consent";
const LEGACY_STORAGE_KEY = "cookie-consent-accepted";

/** Fired on window whenever consent is saved, so listeners (e.g. GoogleAnalytics) can react mid-session. */
export const CONSENT_CHANGE_EVENT = "sneakndrip:cookie-consent-changed";

function readStored(): ConsentState | null {
  const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed?.analytics !== "boolean") return null;
    return { essential: true, analytics: parsed.analytics, consented_at: parsed.consented_at ?? Date.now() };
  } catch {
    return null;
  }
}

/**
 * Reads the current consent decision, migrating the legacy flat
 * "cookie-consent-accepted" key if present. Migration defaults analytics to
 * false (the safer choice) since the old key never captured an analytics
 * preference. Returns null if the visitor hasn't decided yet.
 */
export function getConsent(): ConsentState | null {
  try {
    const current = readStored();
    if (current) return current;

    if (localStorage.getItem(LEGACY_STORAGE_KEY)) {
      const migrated: ConsentState = { essential: true, analytics: false, consented_at: Date.now() };
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(migrated));
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      return migrated;
    }
    return null;
  } catch {
    return null;
  }
}

export function setConsent(analytics: boolean): void {
  const state: ConsentState = { essential: true, analytics, consented_at: Date.now() };
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(state));
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    /* localStorage unavailable — consent won't persist, banner will reappear next visit */
  }
  window.dispatchEvent(new CustomEvent<ConsentState>(CONSENT_CHANGE_EVENT, { detail: state }));
}

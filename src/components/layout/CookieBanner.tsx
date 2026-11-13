"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getConsent, setConsent, CONSENT_CHANGE_EVENT } from "@/lib/consent";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!getConsent()) setVisible(true);
    } catch {
      /* localStorage unavailable — skip banner */
    }
    // A choice saved elsewhere (e.g. /cookie-settings) answers the banner too
    const hide = () => setVisible(false);
    window.addEventListener(CONSENT_CHANGE_EVENT, hide);
    return () => window.removeEventListener(CONSENT_CHANGE_EVENT, hide);
  }, []);

  function save(analytics: boolean) {
    try { setConsent(analytics); } catch { /* ignore */ }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 pointer-events-none">
      <div className="max-w-2xl mx-auto px-3 md:px-8 pb-3 md:pb-5">
        <div
          role="region"
          aria-label="Cookie consent"
          className="pointer-events-auto flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-4 py-3 rounded-md bg-paper border border-line shadow-sm"
        >
          <p className="text-xs sm:text-body-sm text-ink-2 leading-snug sm:flex-1">
            We use cookies for essentials and, if you allow, analytics.{" "}
            <Link href="/cookies-policy" className="text-ink underline hover:opacity-60 transition-opacity">
              Learn more
            </Link>
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => save(false)}
              className="flex-1 sm:flex-none text-xs sm:text-body-sm font-medium px-3 py-1.5 rounded-md border border-line text-ink hover:border-ink transition-colors"
            >
              Essential only
            </button>
            <button
              onClick={() => save(true)}
              className="flex-1 sm:flex-none text-xs sm:text-body-sm font-medium px-3 py-1.5 rounded-md bg-ink text-paper hover:bg-ink-2 transition-colors"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

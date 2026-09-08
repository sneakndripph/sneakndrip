"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "cookie-consent-accepted";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      /* localStorage unavailable — skip banner */
    }
  }, []);

  function accept() {
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch { /* ignore */ }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 pointer-events-none">
      <div className="max-w-3xl mx-auto px-5 md:px-8 pb-5">
        <div className="pointer-events-auto flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-5 py-4 rounded-md bg-paper border border-line shadow-sm">
          <p className="flex-1 text-body-sm text-ink-2 leading-relaxed">
            We use essential cookies to run this site. See our{" "}
            <Link href="/cookies-policy" className="text-ink underline hover:opacity-60 transition-opacity">
              Cookies Policy
            </Link>{" "}
            for details.
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/cookies-policy"
              className="text-body-sm font-medium px-4 py-2 rounded-md border border-line text-ink hover:border-ink transition-colors"
            >
              View Policy
            </Link>
            <button
              onClick={accept}
              className="text-body-sm font-medium px-4 py-2 rounded-md bg-ink text-paper hover:bg-ink-2 transition-colors"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

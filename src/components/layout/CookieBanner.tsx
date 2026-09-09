"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getConsent, setConsent } from "@/lib/consent";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [analytics, setAnalytics] = useState(false);

  useEffect(() => {
    try {
      if (!getConsent()) setVisible(true);
    } catch {
      /* localStorage unavailable — skip banner */
    }
  }, []);

  function save() {
    try { setConsent(analytics); } catch { /* ignore */ }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 pointer-events-none">
      <div className="max-w-3xl mx-auto px-5 md:px-8 pb-5">
        <div className="pointer-events-auto flex flex-col gap-4 px-5 py-4 rounded-md bg-paper border border-line shadow-sm">
          <p className="text-body-sm text-ink-2 leading-relaxed">
            We use essential cookies to run this site, and — with your permission — analytics
            cookies to understand how it&apos;s used. See our{" "}
            <Link href="/cookies-policy" className="text-ink underline hover:opacity-60 transition-opacity">
              Cookies Policy
            </Link>{" "}
            for details.
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <label className="flex items-center gap-2 text-body-sm text-ink-3">
              <input type="checkbox" checked disabled className="w-4 h-4 rounded-sm accent-ink opacity-60" />
              Essential cookies
            </label>
            <label className="flex items-center gap-2 text-body-sm text-ink cursor-pointer">
              <input
                type="checkbox"
                checked={analytics}
                onChange={e => setAnalytics(e.target.checked)}
                className="w-4 h-4 rounded-sm accent-ink"
              />
              Analytics cookies
            </label>
          </div>

          <div className="flex items-center gap-2 sm:self-end">
            <Link
              href="/cookies-policy"
              className="text-body-sm font-medium px-4 py-2 rounded-md border border-line text-ink hover:border-ink transition-colors"
            >
              View Policy
            </Link>
            <button
              onClick={save}
              className="text-body-sm font-medium px-4 py-2 rounded-md bg-ink text-paper hover:bg-ink-2 transition-colors"
            >
              Save preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

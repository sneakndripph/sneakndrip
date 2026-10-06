"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { getConsent, setConsent, CONSENT_CHANGE_EVENT } from "@/lib/consent";

const ESSENTIAL_ITEMS: { name: string; description: string }[] = [
  { name: "Supabase auth session", description: "Keeps you signed in for your account, checkout, and order tracking." },
  { name: "snd-cart (local storage)", description: "Keeps your cart contents between visits." },
  { name: "cookie-consent (local storage)", description: "Remembers the choice you make on this page." },
];

const ANALYTICS_ITEMS: { name: string; description: string }[] = [
  { name: "_ga", description: "A random identifier that distinguishes visitors. Expires after 2 years." },
  { name: "_ga_<ID>", description: "Keeps track of your current session. Expires after 2 years." },
];

function ItemList({ items }: { items: { name: string; description: string }[] }) {
  return (
    <ul className="mt-4 space-y-3">
      {items.map(item => (
        <li key={item.name}>
          <p className="text-sm font-semibold text-ink font-mono break-words">{item.name}</p>
          <p className="text-sm mt-0.5 text-ink-2">{item.description}</p>
        </li>
      ))}
    </ul>
  );
}

type ConsentStatus = "loading" | "unset" | "on" | "off";

// Stays in sync when the banner, another tab, or this component saves a choice.
function subscribe(onChange: () => void) {
  window.addEventListener(CONSENT_CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CONSENT_CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getStatus(): ConsentStatus {
  const consent = getConsent();
  if (!consent) return "unset";
  return consent.analytics ? "on" : "off";
}

/**
 * Lets a visitor change their cookie choice after the banner. Saves on each
 * toggle via setConsent, whose change event updates GoogleAnalytics and hides
 * the banner. Used by /cookie-settings and the /account Cookie Settings tab.
 */
export default function CookieSettings() {
  const status = useSyncExternalStore(subscribe, getStatus, () => "loading" as const);
  const analyticsOn = status === "on";

  function toggleAnalytics() {
    setConsent(!analyticsOn);
    toast.success("Cookie preferences saved");
  }

  return (
    <div>
      <p className="text-sm mb-6 text-ink-2">
        Choose which optional cookies we may use. See our{" "}
        <Link href="/cookies-policy" className="text-ink underline hover:opacity-60 transition-opacity">Cookies Policy</Link>{" "}
        for details.
      </p>

      <div className="rounded-xl bg-paper-2 border border-line">
        {/* Essential */}
        <div className="p-5 border-b border-line">
          <div className="flex items-start justify-between gap-4">
            <p className="font-black text-sm text-ink">Essential cookies &amp; storage</p>
            <span className="shrink-0 text-micro text-ink-3">Always on</span>
          </div>
          <p className="text-sm mt-1 text-ink-2">
            These are required for the site to function and cannot be disabled.
          </p>
          <ItemList items={ESSENTIAL_ITEMS} />
        </div>

        {/* Analytics */}
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p id="cookie-analytics" className="font-black text-sm text-ink">Analytics cookies</p>
              <p className="text-sm mt-1 text-ink-2">
                Google Analytics 4 helps us understand how the store is used. Optional.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={analyticsOn}
              aria-labelledby="cookie-analytics"
              onClick={toggleAnalytics}
              disabled={status === "loading"}
              className={`relative shrink-0 mt-0.5 w-11 h-6 rounded-full border transition-colors disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2 ${
                analyticsOn ? "bg-ink border-ink" : "bg-line border-line"
              }`}>
              <span className={`absolute top-0.5 left-0.5 w-[18px] h-[18px] rounded-full bg-paper transition-transform ${
                analyticsOn ? "translate-x-5" : "translate-x-0"
              }`} />
            </button>
          </div>
          {status === "unset" && (
            <p className="text-micro mt-2 text-ink-3">You haven&apos;t made a choice yet.</p>
          )}
          <ItemList items={ANALYTICS_ITEMS} />
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

type PreferenceKey = "cart_reminders_enabled" | "new_arrivals_enabled" | "restock_alerts_enabled" | "newsletter_enabled";
type Preferences = Record<PreferenceKey, boolean>;

const OPTIONS: { key: PreferenceKey; label: string; description: string }[] = [
  {
    key: "cart_reminders_enabled",
    label: "Cart reminder emails",
    description: "A reminder when you leave items in your cart, sent up to twice per cart.",
  },
  {
    key: "new_arrivals_enabled",
    label: "New arrival announcements",
    description: "Be the first to know when new pairs are in stock.",
  },
  {
    key: "restock_alerts_enabled",
    label: "Restock alerts",
    description: "An alert when a size you asked about or wishlisted is available again.",
  },
  {
    key: "newsletter_enabled",
    label: "Newsletter",
    description: "General updates, drops, and promotions.",
  },
];

/** Account tab for per-category marketing email opt-outs. Saves on each toggle. */
export default function EmailPreferences() {
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState<PreferenceKey | null>(null);

  useEffect(() => {
    fetch("/api/account/email-preferences")
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(data => setPrefs(data.preferences as Preferences))
      .catch(() => setLoadError(true));
  }, []);

  async function toggle(key: PreferenceKey) {
    if (!prefs || saving) return;
    const value = !prefs[key];
    setPrefs({ ...prefs, [key]: value });
    setSaving(key);
    const res = await fetch("/api/account/email-preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: value }),
    }).catch(() => null);
    if (res?.ok) {
      toast.success("Email preferences saved");
    } else {
      setPrefs(prev => (prev ? { ...prev, [key]: !value } : prev));
      toast.error("Couldn't save your preference. Try again.");
    }
    setSaving(null);
  }

  return (
    <div>
      <h2 className="font-black text-lg mb-2 text-ink">Email Preferences</h2>
      <p className="text-sm mb-6 text-ink-2">
        Choose which emails you get from us. Order, shipping, and return updates are always sent.
      </p>

      {loadError ? (
        <div className="px-4 py-3 rounded text-sm font-medium bg-state-error/[7%] text-state-error border border-state-error/[19%]">
          Couldn&apos;t load your email preferences. Refresh to try again.
        </div>
      ) : !prefs ? (
        <div className="py-12 text-center text-sm text-ink-2">Loading preferences…</div>
      ) : (
        <div className="rounded-xl bg-paper-2 border border-line">
          {OPTIONS.map((opt, idx) => {
            const on = prefs[opt.key];
            return (
              <div key={opt.key}
                className={`flex items-start justify-between gap-4 p-5 ${idx < OPTIONS.length - 1 ? "border-b border-line" : ""}`}>
                <div className="min-w-0">
                  <p id={`pref-${opt.key}`} className="font-black text-sm text-ink">{opt.label}</p>
                  <p className="text-sm mt-1 text-ink-2">{opt.description}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={on}
                  aria-labelledby={`pref-${opt.key}`}
                  onClick={() => toggle(opt.key)}
                  disabled={saving !== null}
                  className={`relative shrink-0 mt-0.5 w-11 h-6 rounded-full border transition-colors disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2 ${
                    on ? "bg-ink border-ink" : "bg-line border-line"
                  }`}>
                  <span className={`absolute top-0.5 left-0.5 w-[18px] h-[18px] rounded-full bg-paper transition-transform ${
                    on ? "translate-x-5" : "translate-x-0"
                  }`} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

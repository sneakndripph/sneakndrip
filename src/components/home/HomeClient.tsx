"use client";

import { useState } from "react";

export default function HomeClient() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState(false);

  async function handleSubscribe() {
    if (!email || loading) return;
    if (!consent) {
      setConsentError(true);
      setError("Please agree to receive marketing emails to subscribe.");
      return;
    }
    setConsentError(false);
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setSubscribed(true);
      } else {
        const data = await res.json();
        setError(data.error || "Something went wrong");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="border-t border-line bg-paper">
      <div className="max-w-2xl mx-auto px-5 md:px-8 py-16 lg:py-24 text-center">
        <p className="text-eyebrow text-ink-3 mb-4">Stay in the loop</p>
        <h2 className="text-display-s lg:text-display text-ink font-display font-medium leading-tight tracking-[-0.02em] mb-4">
          First in line.<br />Zero spam.
        </h2>
        <p className="text-body-sm text-ink-2 mb-8">
          New drops, restocks, exclusive below-SRP deals — straight to your inbox.
        </p>
        {subscribed ? (
          <p className="text-body text-ink font-medium">You&apos;re in. Welcome.</p>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
              <input
                value={email}
                onChange={e => { setEmail(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handleSubscribe()}
                type="email"
                placeholder="your@email.com"
                className="flex-1 bg-paper-2 text-ink placeholder:text-ink-3 border-0 rounded-md px-4 py-3 text-body-sm focus:outline-2 focus:outline-ink focus:outline-offset-1"
              />
              <button
                onClick={handleSubscribe}
                disabled={loading || !email}
                className="bg-ink text-paper text-body-sm font-medium px-6 py-3 rounded-md hover:bg-ink-2 transition-colors disabled:opacity-50"
              >
                {loading ? "…" : "Subscribe"}
              </button>
            </div>
            <label className="flex items-start gap-2.5 max-w-md mx-auto mt-3 text-left cursor-pointer">
              <input
                type="checkbox"
                checked={consent}
                onChange={e => { setConsent(e.target.checked); if (e.target.checked) setConsentError(false); }}
                className={`mt-0.5 w-4 h-4 shrink-0 rounded-sm accent-ink ${consentError ? "outline outline-2 outline-state-error" : ""}`}
              />
              <span className="text-micro text-ink-2 leading-relaxed">
                I agree to receive marketing emails from Sneak N&apos; Drip
              </span>
            </label>
            {error && <p className="mt-3 text-micro text-state-error">{error}</p>}
          </>
        )}
      </div>
    </section>
  );
}

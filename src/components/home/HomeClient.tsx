"use client";

import { useState } from "react";

export default function HomeClient() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubscribe() {
    if (!email || loading) return;
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
    <section className="py-20 bg-snd-teal">
      <div className="max-w-xl mx-auto px-4 text-center">
        <h2 className="font-heading leading-none tracking-[0.04em] text-white text-[clamp(2rem,7vw,3.2rem)]">
          FIRST TO KNOW
        </h2>
        <p className="mt-3 mb-8 text-sm text-white/75">
          New drops, restocks, and exclusive below-SRP deals — straight to your inbox.
        </p>
        {subscribed ? (
          <p className="text-lg font-bold text-white">
            You&apos;re in! Welcome to the family.
          </p>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row shadow-lg gap-2 sm:gap-0">
              <input
                value={email}
                onChange={e => { setEmail(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handleSubscribe()}
                type="email"
                placeholder="your@email.com"
                className="flex-1 px-5 py-4 text-sm focus:outline-none border-none bg-white/18 text-white"
              />
              <button
                onClick={handleSubscribe}
                disabled={loading || !email}
                className="px-7 py-4 text-sm font-black uppercase tracking-widest transition-opacity hover:opacity-90 disabled:opacity-60 bg-snd-black text-snd-bg"
              >
                {loading ? "…" : "Subscribe"}
              </button>
            </div>
            {error && <p className="mt-2 text-sm text-white/80">{error}</p>}
          </>
        )}
      </div>
    </section>
  );
}

"use client";

import { useState } from "react";
import { BRAND, FONTS } from "@/lib/constants";

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
    <section className="py-20" style={{ background: BRAND.teal }}>
      <div className="max-w-xl mx-auto px-4 text-center">
        <h2 style={{ fontFamily: FONTS.display, fontSize: "3.2rem", letterSpacing: "0.04em", color: "#fff", lineHeight: 1 }}>
          FIRST TO KNOW
        </h2>
        <p className="mt-3 mb-8 text-sm" style={{ color: "rgba(255,255,255,0.75)", fontFamily: FONTS.body }}>
          New drops, restocks, and exclusive below-SRP deals — straight to your inbox.
        </p>
        {subscribed ? (
          <p className="text-lg font-bold text-white" style={{ fontFamily: FONTS.body }}>
            You&apos;re in! Welcome to the family 🤙
          </p>
        ) : (
          <>
            <div className="flex shadow-lg">
              <input
                value={email}
                onChange={e => { setEmail(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handleSubscribe()}
                type="email"
                placeholder="your@email.com"
                className="flex-1 px-5 py-4 text-sm focus:outline-none"
                style={{ background: "rgba(255,255,255,0.18)", color: "#fff", border: "none", fontFamily: FONTS.body }}
              />
              <button
                onClick={handleSubscribe}
                disabled={loading || !email}
                className="px-7 py-4 text-sm font-black uppercase tracking-widest transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ background: BRAND.black, color: BRAND.bg, fontFamily: FONTS.body }}
              >
                {loading ? "…" : "Subscribe"}
              </button>
            </div>
            {error && <p className="mt-2 text-sm" style={{ color: "rgba(255,255,255,0.8)" }}>{error}</p>}
          </>
        )}
      </div>
    </section>
  );
}

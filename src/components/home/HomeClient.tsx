"use client";

import { useState } from "react";
import { BRAND, FONTS } from "@/lib/constants";

export default function HomeClient() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

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
          <div className="flex shadow-lg">
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              type="email"
              placeholder="your@email.com"
              className="flex-1 px-5 py-4 text-sm focus:outline-none"
              style={{ background: "rgba(255,255,255,0.18)", color: "#fff", border: "none", fontFamily: FONTS.body }}
            />
            <button
              onClick={() => email && setSubscribed(true)}
              className="px-7 py-4 text-sm font-black uppercase tracking-widest transition-opacity hover:opacity-90"
              style={{ background: BRAND.black, color: BRAND.bg, fontFamily: FONTS.body }}
            >
              Subscribe
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

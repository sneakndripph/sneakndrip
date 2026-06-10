import Link from "next/link";
import { BRAND, FONTS } from "@/lib/constants";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — Sneak N' Drip",
  description: "Learn about Sneak N' Drip — your trusted source for 100% authentic sneakers in the Philippines.",
};

export default function AboutPage() {
  return (
    <div style={{ background: BRAND.bg, fontFamily: FONTS.body }}>
      {/* Hero */}
      <section
        className="relative py-24 px-4 text-center overflow-hidden"
        style={{ background: BRAND.black }}
      >
        <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(${BRAND.teal} 1px, transparent 1px), linear-gradient(90deg, ${BRAND.teal} 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }} />
        <div className="relative max-w-3xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: BRAND.teal }}>
            Our Story
          </p>
          <h1
            style={{
              fontFamily: FONTS.display,
              fontSize: "clamp(3rem, 8vw, 6rem)",
              letterSpacing: "0.04em",
              color: "#F2F0EF",
              lineHeight: 1,
            }}
          >
            SNEAK N&apos; DRIP
          </h1>
          <p className="mt-6 text-base leading-relaxed max-w-xl mx-auto" style={{ color: "#888" }}>
            Your trusted source for 100% authentic sneakers in the Philippines.
            On hand and pre-order. Always legit. Always below SRP.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: BRAND.teal }}>
              Who We Are
            </p>
            <h2 style={{ fontFamily: FONTS.display, fontSize: "2.5rem", letterSpacing: "0.04em", color: BRAND.black, lineHeight: 1 }}>
              BUILT FOR<br />SNEAKER<br />LOVERS
            </h2>
            <p className="mt-5 text-sm leading-relaxed" style={{ color: BRAND.muted }}>
              Sneak N&apos; Drip was born out of a simple frustration: finding authentic sneakers in the Philippines at fair prices was too hard. So we built the solution.
            </p>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: BRAND.muted }}>
              We source directly from trusted and verified suppliers — locally and internationally — so every pair that leaves our hands is 100% legit. No reps. No fakes. Ever.
            </p>
          </div>
          <div className="space-y-4">
            {[
              { n: "2,400+", label: "Pairs Sold" },
              { n: "100%", label: "Authentic — Always" },
              { n: "1,800+", label: "Happy Customers" },
              { n: "3", label: "Years in Business" },
            ].map(stat => (
              <div key={stat.label} className="flex items-center gap-5 px-6 py-4 rounded-xl"
                style={{ background: BRAND.card, border: `1px solid ${BRAND.cardBorder}` }}>
                <span style={{ fontFamily: FONTS.display, fontSize: "2rem", color: BRAND.teal, letterSpacing: "0.02em", minWidth: "80px" }}>
                  {stat.n}
                </span>
                <span className="text-sm font-semibold" style={{ color: BRAND.black }}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20" style={{ background: BRAND.card, borderTop: `1px solid ${BRAND.border}`, borderBottom: `1px solid ${BRAND.border}` }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: BRAND.teal }}>What We Stand For</p>
            <h2 style={{ fontFamily: FONTS.display, fontSize: "2.5rem", letterSpacing: "0.04em", color: BRAND.black }}>
              OUR PROMISE
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                icon: "🔐",
                title: "100% Authentic",
                desc: "Every pair is verified authentic. Sourced from trusted local and international suppliers. No fakes, no reps — ever. We stake our reputation on it.",
              },
              {
                icon: "💰",
                title: "Below SRP Prices",
                desc: "We believe you shouldn't have to pay above retail for authentic sneakers. Most of our pairs are priced below SRP — good kicks at fair prices.",
              },
              {
                icon: "⚡",
                title: "Fast & Reliable",
                desc: "On-hand orders ship within 1–3 business days for Metro Manila, 3–7 days provincial. Pre-orders come with a firm ETA and regular updates.",
              },
            ].map(v => (
              <div key={v.title} className="p-7 rounded-xl" style={{ border: `1px solid ${BRAND.border}` }}>
                <div className="text-4xl mb-4">{v.icon}</div>
                <h3 className="font-black mb-3 text-base" style={{ color: BRAND.black }}>{v.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: BRAND.muted }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact / Social */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-20 text-center">
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: BRAND.teal }}>Get in Touch</p>
        <h2 style={{ fontFamily: FONTS.display, fontSize: "2.5rem", letterSpacing: "0.04em", color: BRAND.black }}>
          WE&apos;D LOVE TO HEAR FROM YOU
        </h2>
        <p className="text-sm mt-4 mb-10 max-w-md mx-auto" style={{ color: BRAND.muted }}>
          Have a question about a pair, want to check availability, or just want to connect? Hit us up anytime.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <a href="https://www.facebook.com/SneakNDrip/" target="_blank" rel="noopener noreferrer"
            className="px-7 py-3.5 font-bold text-sm uppercase tracking-wider transition-opacity hover:opacity-80"
            style={{ background: BRAND.black, color: BRAND.bg }}>
            Facebook
          </a>
          <a href="https://www.instagram.com/sneakndripph/" target="_blank" rel="noopener noreferrer"
            className="px-7 py-3.5 font-bold text-sm uppercase tracking-wider transition-opacity hover:opacity-80"
            style={{ border: `1.5px solid ${BRAND.black}`, color: BRAND.black }}>
            Instagram
          </a>
          <Link href="/shop"
            className="px-7 py-3.5 font-bold text-sm uppercase tracking-wider transition-opacity hover:opacity-80"
            style={{ background: BRAND.teal, color: "#fff" }}>
            Shop Now
          </Link>
        </div>
      </section>
    </div>
  );
}

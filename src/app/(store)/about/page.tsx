import Link from "next/link";
import { BRAND, FONTS } from "@/lib/constants";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — Sneak N' Drip",
  description: "Learn about Sneak N' Drip — your trusted source for 100% authentic sneakers in the Philippines.",
};

const VALUES = [
  {
    title: "100% Authentic",
    desc: "Every pair is verified authentic. Sourced from trusted local and international suppliers. No fakes, no reps — ever. We stake our reputation on it.",
  },
  {
    title: "Below SRP Prices",
    desc: "You shouldn't have to pay above retail for authentic sneakers. Most of our pairs are priced below SRP — good kicks at fair prices.",
  },
  {
    title: "Fast & Reliable",
    desc: "On-hand orders ship within 1–3 days Metro Manila, 3–7 days provincial. Pre-orders come with a firm ETA and regular updates.",
  },
];

const STATS = [
  { n: "2,400+", label: "Pairs Sold" },
  { n: "100%",   label: "Authentic" },
  { n: "1,800+", label: "Happy Customers" },
  { n: "3",      label: "Years Running" },
];

export default function AboutPage() {
  return (
    <div style={{ background: BRAND.bg, fontFamily: FONTS.body }}>

      {/* Hero */}
      <section style={{ background: BRAND.black }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-28">
          <div className="max-w-2xl">
            <p
              className="snd-label mb-8"
              style={{ color: BRAND.teal, fontFamily: FONTS.body }}
            >
              Our Story
            </p>
            <h1
              style={{
                fontFamily: FONTS.display,
                fontSize: "var(--text-display-lg)",
                letterSpacing: "0.03em",
                color: "#F2F0EF",
                lineHeight: 0.9,
              }}
            >
              SNEAK N&apos;<br />DRIP
            </h1>
            <p
              className="mt-10 text-sm leading-relaxed max-w-md"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              Your trusted source for 100% authentic sneakers in the Philippines.
              On hand and pre-order. Always legit. Always below SRP.
            </p>
          </div>
        </div>
      </section>

      {/* Mission + Stats */}
      <section className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 snd-section">
        <div className="grid lg:grid-cols-2 gap-20 items-start">

          {/* Left — copy */}
          <div>
            <h2
              style={{
                fontFamily: FONTS.display,
                fontSize: "var(--text-display-md)",
                letterSpacing: "0.03em",
                color: BRAND.black,
                lineHeight: 0.92,
              }}
            >
              BUILT FOR<br /><span style={{ color: BRAND.teal }}>SNEAKER<br />LOVERS.</span>
            </h2>
            <p
              className="mt-8 text-sm leading-relaxed max-w-md"
              style={{ color: BRAND.muted }}
            >
              Sneak N&apos; Drip was born out of a simple frustration: finding authentic sneakers
              in the Philippines at fair prices was too hard. So we built the solution.
            </p>
            <p
              className="mt-5 text-sm leading-relaxed max-w-md"
              style={{ color: BRAND.muted }}
            >
              We source directly from trusted and verified suppliers — locally and internationally —
              so every pair that leaves our hands is 100% legit. No reps. No fakes. Ever.
            </p>
          </div>

          {/* Right — stats, editorial row */}
          <div
            className="grid grid-cols-2 gap-8 pt-4"
            style={{ borderTop: `2px solid ${BRAND.black}` }}
          >
            {STATS.map(stat => (
              <div key={stat.label} className="py-4">
                <p
                  style={{
                    fontFamily: FONTS.display,
                    fontSize: "clamp(2rem, 5vw, 3rem)",
                    color: BRAND.black,
                    letterSpacing: "0.02em",
                    lineHeight: 1,
                  }}
                >
                  {stat.n}
                </p>
                <p
                  className="snd-label mt-2"
                  style={{ color: BRAND.mutedLight, fontFamily: FONTS.body }}
                >
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Divider */}
      <div style={{ height: "1px", background: BRAND.border }} />

      {/* Values */}
      <section className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 snd-section">
        <div className="grid lg:grid-cols-2 gap-16 items-start">

          <div className="lg:sticky lg:top-24">
            <p
              className="snd-label mb-5"
              style={{ color: BRAND.mutedLight, fontFamily: FONTS.body }}
            >
              Philosophy
            </p>
            <h2
              style={{
                fontFamily: FONTS.display,
                fontSize: "var(--text-display-md)",
                letterSpacing: "0.03em",
                color: BRAND.black,
                lineHeight: 0.92,
              }}
            >
              WHAT WE<br />STAND FOR
            </h2>
          </div>

          <div>
            {VALUES.map((v, i) => (
              <div
                key={v.title}
                className="flex items-start gap-6 py-7"
                style={{
                  borderBottom: i < VALUES.length - 1 ? `1px solid ${BRAND.border}` : "none",
                }}
              >
                <span
                  className="snd-label shrink-0 pt-0.5"
                  style={{ color: BRAND.mutedLight, fontFamily: FONTS.body, width: "1.5rem" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <p
                    className="text-sm font-bold mb-2"
                    style={{ color: BRAND.black }}
                  >
                    {v.title}
                  </p>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: BRAND.muted }}
                  >
                    {v.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Divider */}
      <div style={{ height: "1px", background: BRAND.border }} />

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 snd-section">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2
              style={{
                fontFamily: FONTS.display,
                fontSize: "var(--text-display-md)",
                letterSpacing: "0.03em",
                color: BRAND.black,
                lineHeight: 0.92,
              }}
            >
              GET IN TOUCH
            </h2>
            <p
              className="text-sm mt-6 leading-relaxed max-w-sm"
              style={{ color: BRAND.muted }}
            >
              Have a question about a pair, want to check availability, or just want to connect?
              Hit us up anytime on Facebook, Instagram, or TikTok.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://www.facebook.com/SneakNDrip/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-7 py-3.5 font-bold text-sm uppercase tracking-wider transition-opacity hover:opacity-80"
              style={{ background: BRAND.black, color: BRAND.bg }}
            >
              Facebook
            </a>
            <a
              href="https://www.instagram.com/sneakndripph/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-7 py-3.5 font-bold text-sm uppercase tracking-wider transition-opacity hover:opacity-80"
              style={{ border: `1.5px solid ${BRAND.black}`, color: BRAND.black }}
            >
              Instagram
            </a>
            <Link
              href="/shop"
              className="px-7 py-3.5 font-bold text-sm uppercase tracking-wider transition-opacity hover:opacity-80 text-white"
              style={{ background: BRAND.teal }}
            >
              Shop Now
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}

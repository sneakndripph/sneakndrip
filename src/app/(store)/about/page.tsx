import Link from "next/link";
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
    <div className="max-w-3xl mx-auto px-5 md:px-8 py-16 lg:py-24">
      <h1 className="text-display text-ink font-display leading-tight tracking-[-0.03em] mb-8">
        Your trusted source for authentic sneakers.
      </h1>
      <p className="text-body text-ink-2 leading-relaxed">
        Sneak N&apos; Drip was born out of a simple frustration: finding authentic sneakers in the
        Philippines at fair prices was too hard. So we built the solution. We source directly from
        trusted and verified suppliers — locally and internationally — so every pair that leaves
        our hands is 100% legit. No reps. No fakes. Ever.
      </p>

      <div className="grid grid-cols-2 gap-8 mt-12 pt-8 border-t border-line">
        {STATS.map(stat => (
          <div key={stat.label}>
            <p className="text-display-s text-ink font-display font-medium">{stat.n}</p>
            <p className="text-micro text-ink-3 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <h2 className="text-display-s text-ink font-display font-medium mt-12 mb-4">
        What we stand for
      </h2>
      <div>
        {VALUES.map((v, i) => (
          <div
            key={v.title}
            className={`flex items-start gap-5 py-6 ${i < VALUES.length - 1 ? "border-b border-line" : ""}`}
          >
            <span className="text-micro text-ink-3 shrink-0 pt-0.5">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <p className="text-body text-ink font-medium mb-1">{v.title}</p>
              <p className="text-body text-ink-2 leading-relaxed">{v.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-display-s text-ink font-display font-medium mt-12 mb-4">
        Get in touch
      </h2>
      <p className="text-body text-ink-2 leading-relaxed mb-6">
        Have a question about a pair, want to check availability, or just want to connect? Hit us
        up anytime on Facebook, Instagram, or TikTok.
      </p>
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <a
          href="https://www.facebook.com/SneakNDrip/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-ink underline hover:opacity-60 transition-opacity"
        >
          Facebook
        </a>
        <a
          href="https://www.instagram.com/sneakndripph/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-ink underline hover:opacity-60 transition-opacity"
        >
          Instagram
        </a>
        <Link href="/shop" className="text-ink underline hover:opacity-60 transition-opacity">
          Shop now
        </Link>
      </div>
    </div>
  );
}

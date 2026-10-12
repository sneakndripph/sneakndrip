import Link from "next/link";
import type { Metadata } from "next";
import { getSettings } from "@/lib/supabase/products";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "About — Sneak N' Drip",
  description: "Learn about Sneak N' Drip — your trusted source for 100% authentic sneakers in the Philippines.",
};

const DEFAULTS: Record<string, string> = {
  about_headline: "Your trusted source for authentic sneakers.",
  about_intro: "Sneak N' Drip was born out of a simple frustration: finding authentic sneakers in the Philippines at fair prices was too hard. So we built the solution. We source directly from trusted and verified suppliers — locally and internationally — so every pair that leaves our hands is 100% legit. No reps. No fakes. Ever.",
  about_stat1_number: "2,400+", about_stat1_label: "Pairs Sold",
  about_stat2_number: "100%", about_stat2_label: "Authentic",
  about_stat3_number: "1,800+", about_stat3_label: "Happy Customers",
  about_stat4_number: "3", about_stat4_label: "Years Running",
  about_values_heading: "What we stand for",
  about_value1_title: "100% Authentic",
  about_value1_desc: "Every pair is verified authentic. Sourced from trusted local and international suppliers. No fakes, no reps — ever. We stake our reputation on it.",
  about_value2_title: "Below SRP Prices",
  about_value2_desc: "You shouldn't have to pay above retail for authentic sneakers. Most of our pairs are priced below SRP — good kicks at fair prices.",
  about_value3_title: "Fast & Reliable",
  about_value3_desc: "On-hand orders ship within 1–3 days Metro Manila, 3–7 days provincial. Pre-orders come with a firm ETA and regular updates.",
  about_contact_heading: "Get in touch",
  about_contact_text: "Have a question about a pair, want to check availability, or just want to connect? Hit us up anytime on Facebook, Instagram, or TikTok.",
};

export default async function AboutPage() {
  const settings = await getSettings();
  const g = (k: string) => settings[k] || DEFAULTS[k] || "";

  const stats = [1, 2, 3, 4].map(i => ({ n: g(`about_stat${i}_number`), label: g(`about_stat${i}_label`) }));
  const values = [1, 2, 3].map(i => ({ title: g(`about_value${i}_title`), desc: g(`about_value${i}_desc`) }));

  return (
    <div className="max-w-3xl mx-auto px-5 md:px-8 py-16 lg:py-24">
      <h1 className="text-display text-ink font-display leading-tight tracking-[-0.03em] mb-8">{g("about_headline")}</h1>
      <p className="text-body text-ink-2 leading-relaxed">{g("about_intro")}</p>

      <div className="grid grid-cols-2 gap-8 mt-12 pt-8 border-t border-line">
        {stats.map((stat, i) => (
          <div key={i}>
            <p className="text-display-s text-ink font-display font-medium">{stat.n}</p>
            <p className="text-micro text-ink-3 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <h2 className="text-display-s text-ink font-display font-medium mt-12 mb-4">{g("about_values_heading")}</h2>
      <div>
        {values.map((v, i) => (
          <div key={i} className={`flex items-start gap-5 py-6 ${i < values.length - 1 ? "border-b border-line" : ""}`}>
            <span className="text-micro text-ink-3 shrink-0 pt-0.5">{String(i + 1).padStart(2, "0")}</span>
            <div>
              <p className="text-body text-ink font-medium mb-1">{v.title}</p>
              <p className="text-body text-ink-2 leading-relaxed">{v.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-display-s text-ink font-display font-medium mt-12 mb-4">{g("about_contact_heading")}</h2>
      <p className="text-body text-ink-2 leading-relaxed mb-6">{g("about_contact_text")}</p>
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <a href="https://www.facebook.com/SneakNDrip/" target="_blank" rel="noopener noreferrer" className="text-ink underline hover:opacity-60 transition-opacity">Facebook</a>
        <a href="https://www.instagram.com/sneakndripph/" target="_blank" rel="noopener noreferrer" className="text-ink underline hover:opacity-60 transition-opacity">Instagram</a>
        <Link href="/shop" className="text-ink underline hover:opacity-60 transition-opacity">Shop now</Link>
      </div>
    </div>
  );
}

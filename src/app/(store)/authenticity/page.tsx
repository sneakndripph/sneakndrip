import { BRAND, FONTS } from "@/lib/constants";
import { getPageContent } from "@/lib/page-content";
import { PageContent } from "@/components/ui/PageContent";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Authenticity Guarantee — Sneak N' Drip",
  description: "How Sneak N' Drip guarantees 100% authentic sneakers on every order.",
};

const FALLBACK = `## Our Promise
Every pair sold by Sneak N' Drip is 100% authentic. No replicas. No fakes. No exceptions. We stake our reputation on this guarantee.

## How We Source
We source directly from authorized retailers, brand distributors, and verified resellers with proven track records. Every supplier is vetted before we work with them.

## Legit Check Process
Before any pair is listed or shipped, it goes through our internal authentication process: box inspection, stitching quality, tongue label, insole markings, and sole pattern verification. We cross-reference with established legit check databases and community standards.

## Our Guarantee
In the extremely unlikely event that an item is proven non-authentic, we will issue a full refund including all shipping costs. No questions asked. This has never happened, and we intend to keep it that way.

## Pricing
Most of our pairs are priced at or below SRP. Being authentic does not mean being overpriced — we believe everyone deserves access to real sneakers at fair prices.`;

export default async function AuthenticityPage() {
  const content = await getPageContent("authenticity", FALLBACK);

  return (
    <div style={{ background: BRAND.bg, fontFamily: FONTS.body }}>
      <section className="relative py-20 px-4 text-center overflow-hidden" style={{ background: BRAND.black }}>
        <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(${BRAND.teal} 1px, transparent 1px), linear-gradient(90deg, ${BRAND.teal} 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }} />
        <div className="relative max-w-3xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: BRAND.teal }}>Our Guarantee</p>
          <h1 style={{ fontFamily: FONTS.display, fontSize: "clamp(2.5rem, 7vw, 5rem)", letterSpacing: "0.04em", color: "#F2F0EF", lineHeight: 1 }}>
            100% AUTHENTIC
          </h1>
          <p className="mt-5 text-sm leading-relaxed max-w-md mx-auto" style={{ color: "#888" }}>
            Every pair we sell is verified authentic. Here&apos;s how we back that up.
          </p>
        </div>
      </section>
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid sm:grid-cols-3 gap-4 mb-12">
          {[
            { icon: "🔐", label: "Verified Sources" },
            { icon: "🧐", label: "Legit Checked" },
            { icon: "💯", label: "Full Refund Guarantee" },
          ].map(f => (
            <div key={f.label} className="flex flex-col items-center gap-2 p-6 rounded-xl text-center"
              style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <span className="text-3xl">{f.icon}</span>
              <span className="text-sm" style={{ color: BRAND.black, fontWeight: 500 }}>{f.label}</span>
            </div>
          ))}
        </div>
        <div className="p-8 rounded-2xl" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
          <PageContent text={content} />
        </div>
      </section>
    </div>
  );
}

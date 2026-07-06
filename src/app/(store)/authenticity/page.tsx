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

const PILLARS = [
  { n: "01", title: "Verified Sources",     desc: "Only from vetted local & international suppliers" },
  { n: "02", title: "Legit Checked",         desc: "Every pair passes our internal authentication process" },
  { n: "03", title: "Full Refund Guarantee", desc: "Proven fake? Full refund, no questions asked" },
];

export default async function AuthenticityPage() {
  const content = await getPageContent("authenticity", FALLBACK);

  return (
    <div style={{ background: BRAND.bg, fontFamily: FONTS.body }}>

      {/* Hero */}
      <section style={{ background: BRAND.black }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-28">
          <div className="grid lg:grid-cols-2 gap-16 items-end">
            <div>
              <p
                className="snd-label mb-8"
                style={{ color: BRAND.teal, fontFamily: FONTS.body }}
              >
                Our Guarantee
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
                100%<br />AUTHENTIC.<br />ALWAYS.
              </h1>
            </div>
            <div>
              <p
                className="text-sm leading-relaxed max-w-sm"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                Every pair we sell is verified authentic. Not sometimes. Not usually. Every single time.
                Here&apos;s exactly how we back that up.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pillars — clean columns, no patchwork */}
      <section style={{ borderBottom: `1px solid ${BRAND.border}` }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid md:grid-cols-3" style={{ borderLeft: `1px solid ${BRAND.border}` }}>
            {PILLARS.map((p, i) => (
              <div
                key={p.n}
                className="px-8 py-10"
                style={{ borderRight: `1px solid ${BRAND.border}` }}
              >
                <span
                  className="snd-label block mb-4"
                  style={{ color: BRAND.teal, fontFamily: FONTS.body }}
                >
                  {p.n}
                </span>
                <p
                  className="text-sm font-bold mb-2"
                  style={{ color: BRAND.black }}
                >
                  {p.title}
                </p>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: BRAND.muted }}
                >
                  {p.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 snd-section">
        <div className="grid lg:grid-cols-3 gap-16">
          <div className="lg:sticky lg:top-24 lg:col-span-1">
            <p
              className="snd-label mb-5"
              style={{ color: BRAND.teal, fontFamily: FONTS.body }}
            >
              Process
            </p>
            <h2
              style={{
                fontFamily: FONTS.display,
                fontSize: "var(--text-display-sm)",
                letterSpacing: "0.03em",
                color: BRAND.black,
                lineHeight: 0.92,
              }}
            >
              HOW WE<br />CHECK EVERY<br />PAIR
            </h2>
          </div>
          <div className="lg:col-span-2">
            <PageContent text={content} />
          </div>
        </div>
      </section>

    </div>
  );
}

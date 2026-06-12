import { BRAND, FONTS } from "@/lib/constants";
import { getPageContent } from "@/lib/page-content";
import { PageContent } from "@/components/ui/PageContent";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Returns Policy — Sneak N' Drip",
  description: "Returns and exchange policy for Sneak N' Drip orders.",
};

const FALLBACK = `## Our Policy
We stand behind every pair we sell. All sneakers are 100% authentic and inspected before shipping. We do not accept returns or exchanges for change of mind.

## Eligible Exchanges
We accept exchange requests within 7 days of receiving your order if:
- You received the wrong item (wrong model, colorway, or size).
- The item has a verified manufacturing defect.
- The size sent differs from what was ordered.

## Conditions
Items must be unworn with no signs of use, in original packaging with all accessories and tags intact. Worn or used items cannot be exchanged.

## How to Request
Message us on Facebook or Instagram within 7 days of receipt. Include your order number, clear photos of the issue, and your preferred resolution. We will review and respond within 48 hours.

## Return Shipping
If the exchange is due to our error, we cover the return shipping cost. If the request does not meet our criteria, the shipping cost is borne by the buyer.`;

export default async function ReturnsPage() {
  const content = await getPageContent("returns", FALLBACK);

  return (
    <div style={{ background: BRAND.bg, fontFamily: FONTS.body }}>
      <section className="relative py-20 px-4 text-center overflow-hidden" style={{ background: BRAND.black }}>
        <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(${BRAND.teal} 1px, transparent 1px), linear-gradient(90deg, ${BRAND.teal} 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }} />
        <div className="relative max-w-3xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: BRAND.teal }}>Help</p>
          <h1 style={{ fontFamily: FONTS.display, fontSize: "clamp(2.5rem, 7vw, 5rem)", letterSpacing: "0.04em", color: "#F2F0EF", lineHeight: 1 }}>
            RETURNS POLICY
          </h1>
          <p className="mt-5 text-sm leading-relaxed max-w-md mx-auto" style={{ color: "#888" }}>
            Our exchange policy — built around fairness to both buyer and seller.
          </p>
        </div>
      </section>
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <div className="p-8 rounded-2xl" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
          <PageContent text={content} />
        </div>
      </section>
    </div>
  );
}

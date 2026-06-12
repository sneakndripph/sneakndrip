import { BRAND, FONTS } from "@/lib/constants";
import { getPageContent } from "@/lib/page-content";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shipping Information — Sneak N' Drip",
  description: "Delivery timelines, shipping fees, and courier info for Sneak N' Drip orders.",
};

const FALLBACK = `## Delivery Timelines
Metro Manila: 1–3 business days after payment confirmation.
Provincial: 3–7 business days depending on location.
Pre-orders: ETA communicated at the time of order. We send updates throughout.
COD orders: dispatched after our team confirms details with you via Messenger or phone.

## Shipping Fees (Online Payment)
1–2 items — Metro Manila: ₱220, Provincial: ₱250
3+ items — Metro Manila: ₱450, Provincial: ₱550
Free shipping on orders ₱5,000 and above (excludes COD).

## Shipping Fees (Cash on Delivery)
COD has no free shipping option.
1–2 items — Luzon: ₱250, Visayas & Mindanao: ₱350
3+ items — Luzon: ₱450, Visayas & Mindanao: ₱550

## Couriers
We ship via J&T Express, LBC, and Ninja Van depending on your location. A tracking number is sent once your order is dispatched.

## Important Notes
Orders placed on weekends or public holidays are processed on the next business day. We reserve the right to cancel orders with unverifiable payment.`;

function ContentBlock({ text }: { text: string }) {
  const paragraphs = text.split("\n\n").filter(Boolean);
  return (
    <div>
      {paragraphs.map((p, i) => {
        if (p.startsWith("## ")) {
          return (
            <h3 key={i} className="font-black text-base mt-8 mb-3 first:mt-0"
              style={{ fontFamily: FONTS.display, letterSpacing: "0.03em", color: BRAND.black }}>
              {p.slice(3)}
            </h3>
          );
        }
        const lines = p.split("\n").filter(Boolean);
        if (lines.length > 1 && lines.every(l => l.startsWith("- ") || l.startsWith("• ") || /^\S.+:/.test(l))) {
          return (
            <ul key={i} className="space-y-2 mb-4">
              {lines.map((l, j) => (
                <li key={j} className="flex gap-2 text-sm leading-relaxed" style={{ color: BRAND.muted }}>
                  <span style={{ color: BRAND.teal, flexShrink: 0 }}>—</span>
                  <span>{l.replace(/^[•-] /, "")}</span>
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="text-sm leading-relaxed mb-4" style={{ color: BRAND.muted }}>
            {p}
          </p>
        );
      })}
    </div>
  );
}

export default async function ShippingPage() {
  const content = await getPageContent("shipping", FALLBACK);

  return (
    <div style={{ background: BRAND.bg, fontFamily: FONTS.body }}>
      {/* Hero */}
      <section className="relative py-20 px-4 text-center overflow-hidden" style={{ background: BRAND.black }}>
        <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(${BRAND.teal} 1px, transparent 1px), linear-gradient(90deg, ${BRAND.teal} 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }} />
        <div className="relative max-w-3xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: BRAND.teal }}>Help</p>
          <h1 style={{ fontFamily: FONTS.display, fontSize: "clamp(2.5rem, 7vw, 5rem)", letterSpacing: "0.04em", color: "#F2F0EF", lineHeight: 1 }}>
            SHIPPING INFO
          </h1>
          <p className="mt-5 text-sm leading-relaxed max-w-md mx-auto" style={{ color: "#888" }}>
            Delivery timelines, shipping rates, and everything you need to know about getting your pair.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <div className="p-8 rounded-2xl" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
          <ContentBlock text={content} />
        </div>
      </section>
    </div>
  );
}

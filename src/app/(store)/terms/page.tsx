import { BRAND, FONTS } from "@/lib/constants";
import { getPageContent } from "@/lib/page-content";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Terms of Service — Sneak N' Drip",
  description: "Terms and conditions for purchasing from Sneak N' Drip.",
};

const FALLBACK = `## Acceptance of Terms
By placing an order on Sneak N' Drip, you agree to these terms and conditions. Please read them carefully before purchasing.

## Orders and Payment
Orders are confirmed only upon receipt and verification of payment. For GCash, Maya, or bank transfer, your order is confirmed when we verify your proof of payment. For COD, confirmation is via a follow-up call or message before dispatch.

## Pricing
All prices are in Philippine Pesos (PHP). Prices are subject to change without notice, but confirmed orders will honor the price at the time of purchase.

## Delivery
We make every effort to deliver within stated timelines, but delays due to courier issues, weather, or force majeure are beyond our control. We will notify you of any significant delays.

## Cancellations
Orders may be cancelled before dispatch. Once dispatched, cancellations are not accepted. To request a cancellation, message us immediately via Messenger.

## Product Condition
All products are brand new, authentic, and in original packaging unless explicitly stated otherwise. Any listing described as "preloved" will be clearly marked.

## Limitation of Liability
Our liability is limited to the value of the product purchased. We are not liable for indirect damages, loss of use, or consequential losses arising from the purchase.

## Disputes
In the event of a dispute, we encourage you to contact us first. We will make every effort to resolve issues fairly and promptly.

## Governing Law
These terms are governed by the laws of the Republic of the Philippines.

Last updated: June 2025`;

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
        return (
          <p key={i} className="text-sm leading-relaxed mb-4" style={{ color: BRAND.muted }}>
            {p}
          </p>
        );
      })}
    </div>
  );
}

export default async function TermsPage() {
  const content = await getPageContent("terms", FALLBACK);

  return (
    <div style={{ background: BRAND.bg, fontFamily: FONTS.body }}>
      <section className="relative py-20 px-4 text-center overflow-hidden" style={{ background: BRAND.black }}>
        <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(${BRAND.teal} 1px, transparent 1px), linear-gradient(90deg, ${BRAND.teal} 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }} />
        <div className="relative max-w-3xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: BRAND.teal }}>Legal</p>
          <h1 style={{ fontFamily: FONTS.display, fontSize: "clamp(2.5rem, 7vw, 5rem)", letterSpacing: "0.04em", color: "#F2F0EF", lineHeight: 1 }}>
            TERMS OF SERVICE
          </h1>
          <p className="mt-5 text-sm leading-relaxed max-w-md mx-auto" style={{ color: "#888" }}>
            The terms and conditions that govern purchases from our store.
          </p>
        </div>
      </section>
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <div className="p-8 rounded-2xl" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
          <ContentBlock text={content} />
        </div>
      </section>
    </div>
  );
}

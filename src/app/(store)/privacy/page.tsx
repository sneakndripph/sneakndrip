import { BRAND, FONTS } from "@/lib/constants";
import { getPageContent } from "@/lib/page-content";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Privacy Policy — Sneak N' Drip",
  description: "Privacy policy for Sneak N' Drip — how we collect and protect your data.",
};

const FALLBACK = `## Overview
Sneak N' Drip is committed to protecting your personal information in accordance with the Philippine Data Privacy Act of 2012 (Republic Act No. 10173).

## Information We Collect
When you place an order, we collect: your full name, email address, mobile number, and shipping address. We also collect payment confirmation details for order verification purposes.

## How We Use Your Information
Your information is used solely to:
- Process and fulfill your order.
- Send order status updates and delivery notifications.
- Contact you regarding your order.
- Improve our service and customer experience.

## Data Storage
Your personal data is stored securely in our encrypted systems. Payment proofs are stored in secured cloud storage and are accessible only to authorized staff.

## Data Sharing
We do not sell, trade, or share your personal information with third parties except where necessary to fulfill your order (such as sharing your address with our courier partners).

## Your Rights
Under the Data Privacy Act, you have the right to access, correct, or request deletion of your personal data. Contact us at hello@sneakndrip.ph to exercise these rights.

## Cookies
Our website may use cookies to improve your browsing experience. You can disable cookies in your browser settings at any time.

## Changes to This Policy
We may update this policy from time to time. Changes will be posted on this page.

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
        const lines = p.split("\n").filter(Boolean);
        if (lines.length > 1 && lines.some(l => l.startsWith("- ") || l.startsWith("• "))) {
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

export default async function PrivacyPage() {
  const content = await getPageContent("privacy", FALLBACK);

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
            PRIVACY POLICY
          </h1>
          <p className="mt-5 text-sm leading-relaxed max-w-md mx-auto" style={{ color: "#888" }}>
            How we collect, use, and protect your personal information.
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

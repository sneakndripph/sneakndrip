import { BRAND, FONTS } from "@/lib/constants";
import { getPageContent } from "@/lib/page-content";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact Us — Sneak N' Drip",
  description: "Get in touch with Sneak N' Drip via Messenger, Instagram, or email.",
};

const FALLBACK = `## Messenger (Fastest Response)
Message us directly at m.me/SneakNDrip. We typically respond within 1–2 hours during business hours. This is the fastest way to reach us.

## Social Media
Facebook: facebook.com/SneakNDrip
Instagram: @sneakndripph
TikTok: @sneakyjuls

## Phone and Email
Mobile: 0961 177 4119
Email: hello@sneakndrip.ph

## Business Hours
Monday to Saturday: 9AM – 9PM
Sunday: 10AM – 6PM
Closed on major public holidays.

## For Order Inquiries
Have your order number ready when messaging us. This helps us assist you faster. You can also track your order from your account page.`;

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
        if (lines.length > 1) {
          return (
            <ul key={i} className="space-y-1.5 mb-4">
              {lines.map((l, j) => (
                <li key={j} className="flex gap-2 text-sm leading-relaxed" style={{ color: BRAND.muted }}>
                  <span style={{ color: BRAND.teal, flexShrink: 0 }}>—</span>
                  <span>{l}</span>
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

export default async function ContactPage() {
  const content = await getPageContent("contact", FALLBACK);

  return (
    <div style={{ background: BRAND.bg, fontFamily: FONTS.body }}>
      <section className="relative py-20 px-4 text-center overflow-hidden" style={{ background: BRAND.black }}>
        <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(${BRAND.teal} 1px, transparent 1px), linear-gradient(90deg, ${BRAND.teal} 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }} />
        <div className="relative max-w-3xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: BRAND.teal }}>We&apos;re Here</p>
          <h1 style={{ fontFamily: FONTS.display, fontSize: "clamp(2.5rem, 7vw, 5rem)", letterSpacing: "0.04em", color: "#F2F0EF", lineHeight: 1 }}>
            CONTACT US
          </h1>
          <p className="mt-5 text-sm leading-relaxed max-w-md mx-auto" style={{ color: "#888" }}>
            Have a question? We&apos;d love to hear from you.
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid sm:grid-cols-2 gap-6 mb-8">
          {[
            { icon: "💬", label: "Messenger", val: "m.me/SneakNDrip", href: "https://m.me/SneakNDrip" },
            { icon: "📱", label: "Facebook", val: "SneakNDrip", href: "https://www.facebook.com/SneakNDrip/" },
            { icon: "📸", label: "Instagram", val: "@sneakndripph", href: "https://www.instagram.com/sneakndripph/" },
            { icon: "📞", label: "Mobile", val: "0961 177 4119", href: "tel:+639611774119" },
          ].map(c => (
            <a key={c.label} href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined}
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-5 rounded-xl transition-opacity hover:opacity-80"
              style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <span className="text-2xl shrink-0">{c.icon}</span>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: BRAND.muted }}>{c.label}</p>
                <p className="font-semibold text-sm" style={{ color: BRAND.black }}>{c.val}</p>
              </div>
            </a>
          ))}
        </div>

        <div className="p-8 rounded-2xl" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
          <ContentBlock text={content} />
        </div>

        <div className="mt-8 p-5 rounded-xl text-center" style={{ background: `${BRAND.teal}10`, border: `1px solid ${BRAND.teal}30` }}>
          <p className="text-sm font-semibold" style={{ color: BRAND.black }}>
            You can also use the chat widget in the bottom-right corner of our site to message us directly.
          </p>
        </div>
      </section>
    </div>
  );
}

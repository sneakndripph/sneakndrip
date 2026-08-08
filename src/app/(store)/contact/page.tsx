import { getPageContent } from "@/lib/page-content";
import { PageContent } from "@/components/ui/PageContent";
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

const CONTACTS = [
  { label: "Messenger", val: "m.me/SneakNDrip",  href: "https://m.me/SneakNDrip" },
  { label: "Facebook",  val: "SneakNDrip",         href: "https://www.facebook.com/SneakNDrip/" },
  { label: "Instagram", val: "@sneakndripph",       href: "https://www.instagram.com/sneakndripph/" },
  { label: "Mobile",    val: "0961 177 4119",       href: "tel:+639611774119" },
];

export default async function ContactPage() {
  const content = await getPageContent("contact", FALLBACK);

  return (
    <div className="max-w-3xl mx-auto px-5 md:px-8 py-16 lg:py-24">
      <h1 className="text-display text-ink font-display leading-tight tracking-[-0.03em] mb-8">
        Contact Us
      </h1>

      <div className="mb-12">
        {CONTACTS.map(c => (
          <a
            key={c.label}
            href={c.href}
            target={c.href.startsWith("http") ? "_blank" : undefined}
            rel="noopener noreferrer"
            className="flex items-center justify-between py-4 border-b border-line transition-opacity hover:opacity-60"
          >
            <p className="text-eyebrow text-ink-3">{c.label}</p>
            <p className="text-body text-ink font-medium">{c.val}</p>
          </a>
        ))}
      </div>

      <PageContent text={content} />
    </div>
  );
}

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
    <div className="bg-snd-bg font-body">

      {/* Hero */}
      <section className="bg-snd-black">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-24">
          <p
            className="snd-label mb-8 text-snd-teal font-body"
          >
            We&apos;re Here
          </p>
          <h1
            className="font-heading"
            style={{
              fontSize: "var(--text-display-lg)",
              letterSpacing: "0.03em",
              color: "#F2F0EF",
              lineHeight: 0.9,
            }}
          >
            CONTACT<br />US
          </h1>
          <p
            className="mt-8 text-sm leading-relaxed max-w-xs"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            Have a question? We&apos;d love to hear from you.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 snd-section">
        <div className="grid lg:grid-cols-3 gap-16">

          {/* Left — contact methods */}
          <div>
            <p
              className="snd-label mb-6 text-snd-muted-lt font-body"
            >
              Reach Us
            </p>

            <div>
              {CONTACTS.map((c, i) => (
                <a
                  key={c.label}
                  href={c.href}
                  target={c.href.startsWith("http") ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className="flex items-center justify-between py-4 transition-opacity hover:opacity-70 border-b border-snd-border"
                >
                  <p
                    className="snd-label text-snd-muted-lt font-body"
                  >
                    {c.label}
                  </p>
                  <p
                    className="text-sm font-semibold text-snd-black"
                  >
                    {c.val}
                  </p>
                </a>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t-2 border-snd-teal">
              <p
                className="text-xs leading-relaxed text-snd-muted"
              >
                Use the chat widget at the bottom-right of any page to message us directly.
              </p>
            </div>
          </div>

          {/* Right — content */}
          <div className="lg:col-span-2">
            <PageContent text={content} />
          </div>

        </div>
      </section>
    </div>
  );
}

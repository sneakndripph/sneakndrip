import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authenticity Guarantee — Sneak N' Drip",
  description: "How Sneak N' Drip guarantees 100% authentic sneakers on every order.",
};

const STEPS = [
  {
    n: "01",
    text: "Sourced only from verified stockists in Tokyo, Seoul, Hong Kong",
    photo: "Photo: storefront of a verified stockist",
  },
  {
    n: "02",
    text: "In-store inspection — box, laces, insole, stitching, tag",
    photo: "Photo: close-up inspection of stitching and tag",
  },
  {
    n: "03",
    text: "Receipt kept, timestamped photo taken",
    photo: "Photo: receipt and timestamped proof-of-purchase",
  },
  {
    n: "04",
    text: "Second review before shipping to buyer",
    photo: "Photo: final review before packing for shipment",
  },
];

export default function AuthenticityPage() {
  return (
    <div className="max-w-3xl mx-auto px-5 md:px-8 py-16 lg:py-24">
      <h1 className="text-display text-ink font-display leading-tight tracking-[-0.03em] mb-8">
        Every pair, verified in person.
      </h1>

      <p className="text-body text-ink-2 leading-relaxed">
        We don&apos;t list a pair we haven&apos;t held. Every sneaker sold on Sneak N&apos; Drip
        is sourced and physically inspected in person — at the point of purchase, before it ever
        gets packed for the trip to the Philippines. No drop-shipping, no blind sourcing, no
        exceptions. Here&apos;s exactly how each pair is checked.
      </p>

      <div className="mt-12 space-y-12">
        {STEPS.map(step => (
          <div key={step.n} className="grid sm:grid-cols-[auto_1fr] gap-5 sm:gap-8">
            <span className="text-display-s text-ink-3 font-display font-medium">{step.n}</span>
            <div>
              <p className="text-body text-ink-2 leading-relaxed mb-4">{step.text}</p>
              <div className="aspect-video bg-paper-2 border border-line flex items-center justify-center">
                <span className="text-micro text-ink-3">{step.photo}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-display-s text-ink font-display font-medium mt-12 mb-4">
        Our guarantee
      </h2>
      <p className="text-body text-ink-2 leading-relaxed">
        In the extremely unlikely event a pair is ever proven non-authentic, we refund it in
        full — including shipping. No questions asked. Questions before that point? Reach out on{" "}
        <a
          href="https://www.facebook.com/SneakNDrip/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-ink underline hover:opacity-60 transition-opacity"
        >
          Facebook
        </a>{" "}
        or through our{" "}
        <a href="/contact" className="text-ink underline hover:opacity-60 transition-opacity">
          contact page
        </a>
        .
      </p>
    </div>
  );
}

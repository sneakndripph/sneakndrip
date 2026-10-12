import type { Metadata } from "next";
import { getSettings } from "@/lib/supabase/products";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Authenticity Guarantee — Sneak N' Drip",
  description: "How Sneak N' Drip guarantees 100% authentic sneakers on every order.",
};

const DEFAULTS: Record<string, string> = {
  authenticity_headline: "Every pair, verified in person.",
  authenticity_intro: "We don't list a pair we haven't held. Every sneaker sold on Sneak N' Drip is sourced and physically inspected in person — at the point of purchase, before it ever gets packed for the trip to the Philippines. No drop-shipping, no blind sourcing, no exceptions. Here's exactly how each pair is checked.",
  authenticity_step1_text: "Sourced only from verified stockists in Tokyo, Seoul, Hong Kong",
  authenticity_step1_photo: "Photo: storefront of a verified stockist",
  authenticity_step1_image_url: "",
  authenticity_step2_text: "In-store inspection — box, laces, insole, stitching, tag",
  authenticity_step2_photo: "Photo: close-up inspection of stitching and tag",
  authenticity_step2_image_url: "",
  authenticity_step3_text: "Receipt kept, timestamped photo taken",
  authenticity_step3_photo: "Photo: receipt and timestamped proof-of-purchase",
  authenticity_step3_image_url: "",
  authenticity_step4_text: "Second review before shipping to buyer",
  authenticity_step4_photo: "Photo: final review before packing for shipment",
  authenticity_step4_image_url: "",
  authenticity_guarantee_heading: "Our guarantee",
  authenticity_guarantee_text: "In the extremely unlikely event a pair is ever proven non-authentic, we refund it in full — including shipping. No questions asked.",
};

export default async function AuthenticityPage() {
  const settings = await getSettings();
  const g = (k: string) => settings[k] || DEFAULTS[k] || "";

  const steps = [1, 2, 3, 4].map(n => ({
    n: String(n).padStart(2, "0"),
    text: g(`authenticity_step${n}_text`),
    photo: g(`authenticity_step${n}_photo`),
    imageUrl: g(`authenticity_step${n}_image_url`),
  }));

  return (
    <div className="max-w-3xl mx-auto px-5 md:px-8 py-16 lg:py-24">
      <h1 className="text-display text-ink font-display leading-tight tracking-[-0.03em] mb-8">{g("authenticity_headline")}</h1>
      <p className="text-body text-ink-2 leading-relaxed">{g("authenticity_intro")}</p>

      <div className="mt-12 space-y-12">
        {steps.map(step => (
          <div key={step.n} className="grid sm:grid-cols-[auto_1fr] gap-5 sm:gap-8">
            <span className="text-display-s text-ink-3 font-display font-medium">{step.n}</span>
            <div>
              <p className="text-body text-ink-2 leading-relaxed mb-4">{step.text}</p>
              <div className="aspect-video bg-paper-2 border border-line flex items-center justify-center overflow-hidden">
                {step.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- admin-supplied URL from any host
                  <img src={step.imageUrl} alt={step.text} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-micro text-ink-3">{step.photo}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-display-s text-ink font-display font-medium mt-12 mb-4">{g("authenticity_guarantee_heading")}</h2>
      <p className="text-body text-ink-2 leading-relaxed">
        {g("authenticity_guarantee_text")} Questions before that point? Reach out on{" "}
        <a href="https://www.facebook.com/SneakNDrip/" target="_blank" rel="noopener noreferrer" className="text-ink underline hover:opacity-60 transition-opacity">Facebook</a>{" "}
        or through our{" "}
        <a href="/contact" className="text-ink underline hover:opacity-60 transition-opacity">contact page</a>.
      </p>
    </div>
  );
}

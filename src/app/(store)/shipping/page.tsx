import { getPageContent } from "@/lib/page-content";
import { PageContent } from "@/components/ui/PageContent";
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

export default async function ShippingPage() {
  const content = await getPageContent("shipping", FALLBACK);

  return (
    <div className="max-w-3xl mx-auto px-5 md:px-8 py-16 lg:py-24">
      <h1 className="text-display text-ink font-display leading-tight tracking-[-0.03em] mb-8">
        Shipping Info
      </h1>
      <PageContent text={content} />
    </div>
  );
}

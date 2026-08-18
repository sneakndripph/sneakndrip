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
    <div className="max-w-3xl mx-auto px-5 md:px-8 py-16 lg:py-24">
      <h1 className="text-display text-ink font-display leading-tight tracking-[-0.03em] mb-8">
        Returns Policy
      </h1>
      <PageContent text={content} />
    </div>
  );
}

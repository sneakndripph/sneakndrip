import { getPageContent } from "@/lib/page-content";
import { PageContent } from "@/components/ui/PageContent";
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
All products are brand new, authentic, and in original packaging unless explicitly stated otherwise.

## Limitation of Liability
Our liability is limited to the value of the product purchased. We are not liable for indirect damages, loss of use, or consequential losses arising from the purchase.

## Disputes
In the event of a dispute, we encourage you to contact us first. We will make every effort to resolve issues fairly and promptly.

## Governing Law
These terms are governed by the laws of the Republic of the Philippines.

Last updated: June 2025`;

export default async function TermsPage() {
  const content = await getPageContent("terms", FALLBACK);

  return (
    <div className="max-w-3xl mx-auto px-5 md:px-8 py-16 lg:py-24">
      <h1 className="text-display text-ink font-display leading-tight tracking-[-0.03em] mb-8">
        Terms of Service
      </h1>
      <PageContent text={content} />
    </div>
  );
}

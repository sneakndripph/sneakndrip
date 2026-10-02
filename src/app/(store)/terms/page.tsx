import { getPageContent } from "@/lib/page-content";
import { PageContent } from "@/components/ui/PageContent";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Terms of Service — Sneak N' Drip",
  description: "Terms and conditions for purchasing from Sneak N' Drip.",
};

const FALLBACK = `## About Us
These terms apply to purchases from and use of sneakndrip.ph, operated by Sneak N' Drip, Taytay, Rizal, Philippines. Contact: hello@sneakndrip.ph · 0961 177 4119.

## Acceptance of Terms
By creating an account or placing an order on Sneak N' Drip, you agree to these terms, our Privacy Policy, and our Returns Policy. Please read them carefully before purchasing.

## Accounts
- You must provide accurate, current information when creating an account and keep it up to date.
- You are responsible for keeping your password secure and for activity under your account. Tell us right away if you suspect unauthorized use.
- One account per person. We may suspend or close accounts used for fraud, abuse, or in breach of these terms.
- You must be at least 18 years old, or have a parent or guardian's permission, to create an account or place an order.

## Orders and Payment
Orders are confirmed only upon receipt and verification of payment. For GCash, Maya, or bank transfer payments, your order is confirmed once we verify your proof of payment. For COD orders, confirmation is via a follow-up call or message before dispatch. We may cancel orders with unverifiable payment or that appear fraudulent, and refund any amount received.

## Pricing
All prices are in Philippine Pesos (PHP) inclusive of applicable taxes. Prices are subject to change without notice, but confirmed orders will honor the price at the time of purchase. If an item is listed at an obviously incorrect price due to an error, we may cancel the order and refund any payment.

## Pre-orders and Down Payment
- Pre-order items are sourced after you order. The ETA shown is an estimate and may change due to supplier, customs, or shipping delays. We'll keep you updated.
- Items bought on the down-payment plan require a ₱1,000 reserve per item at checkout. The remaining balance must be paid before the item is released or shipped.
- We'll notify you when your item arrives and the balance is due. If the balance isn't paid within 7 days of that notice, the reservation is automatically cancelled and the ₱1,000 reserve is non-refundable.
- If we can't fulfill a pre-order, you'll receive a full refund of everything you've paid.

## Vouchers and Coupons
- One voucher code per order.
- Vouchers may have a minimum order amount, usage limit, or expiry date, shown when the code is issued or applied.
- Vouchers have no cash value, cannot be exchanged for cash, and cannot be applied to past orders.
- We may cancel vouchers obtained or used fraudulently.

## Store Credit
Store credit issued for approved COD refunds is tied to the customer who placed the original order and can be used on a future order by messaging us with your order number. Store credit has no cash value and expires 30 days from issuance.

## Delivery
We make every effort to deliver within stated timelines, but delays due to courier issues, weather, or force majeure are beyond our control. We will notify you of any significant delays. See our Shipping Info page for fees and timelines.

## Cancellations
Orders may be cancelled before dispatch. Once dispatched, cancellations are not accepted. To request a cancellation, message us immediately via Messenger. Pre-order cancellations are covered under Pre-orders and Down Payment above.

## Returns and Refunds
Exchanges and refunds are handled under our Returns Policy.

## Product Condition
All products are brand new, authentic, and in original packaging unless explicitly stated otherwise. Any listing described as "preloved" or "used" will be clearly marked.

## Intellectual Property
All site content — including text, photos, graphics, and the Sneak N' Drip name and logo — belongs to Sneak N' Drip or its licensors. You may not copy or reuse it without our written permission. Brand names and trademarks of the products we sell belong to their respective owners.

## Limitation of Liability
To the extent allowed by law, our liability is limited to the value of the product purchased. We are not liable for indirect damages, loss of use, or consequential losses arising from the purchase. Nothing in these terms limits your rights under the Consumer Act of the Philippines (RA 7394) or other applicable law.

## Disputes
In the event of a dispute, we encourage you to contact us first. We will make every effort to resolve issues fairly and promptly.

## Governing Law
These terms are governed by the laws of the Republic of the Philippines. Any unresolved disputes will be subject to the jurisdiction of the proper courts of Rizal.

## Severability
If any part of these terms is found invalid or unenforceable, the rest remains in full effect.

## Changes to These Terms
We may update these terms from time to time. Changes will be posted on this page with an updated date and apply to orders placed after that date.

Last updated: October 2026`;

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

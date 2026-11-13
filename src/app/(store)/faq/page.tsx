import Link from "next/link";
import type { Metadata } from "next";
import { getPageContent } from "@/lib/page-content";
import { PageContent } from "@/components/ui/PageContent";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "FAQ — Sneak N' Drip",
  description: "Answers on authenticity, pre-orders, down payments, shipping, payment and exchanges at Sneak N' Drip.",
};

// Each "## " line is a question; everything under it is the answer. Editable in Admin → Content.
const FALLBACK = `## Are your sneakers authentic?
Yes, 100%. Every pair is sourced only from verified stockists in Tokyo, Seoul and Hong Kong and inspected in person — box, laces, insole, stitching and tag — before it's packed. See our Authenticity page for the full process.

## What's the difference between On Hand and Pre-Order?
On Hand pairs are already with us and ship after your payment is confirmed. Pre-Order pairs are sourced after you order; the ETA shown is an estimate and may change due to supplier, customs or shipping delays. We'll keep you updated.

## How does the down payment plan work?
Reserve an item with ₱1,000 per item at checkout. We'll notify you when it arrives and the balance is due. The remaining balance must be paid before the item is released or shipped.
If the balance isn't paid within 7 days of that notice, the reservation is automatically cancelled and the ₱1,000 reserve is non-refundable.

## What if you can't get my pre-order?
You'll receive a full refund of everything you've paid.

## How do I pay?
GCash, Maya, bank transfer, or Cash on Delivery. For online payments, send the exact amount shown at checkout and upload your proof of payment.
Cash on Delivery isn't available for orders with pre-order items.

## How long does delivery take?
Metro Manila: 1–3 business days after payment confirmation. Provincial: 3–7 business days depending on location. Orders placed on weekends or public holidays are processed on the next business day.

## How much is shipping?
Online payment, 1–2 items: ₱220 Metro Manila, ₱250 Provincial. 3+ items: ₱450 Metro Manila, ₱550 Provincial. Free shipping on orders ₱5,000 and above (excludes COD).
See the Shipping Info page for COD rates.

## How do I track my order?
A tracking number is sent once your order is dispatched. You can also check your order status anytime on the Track Order page or in your account.

## Can I return or exchange my pair?
We don't accept returns for change of mind. Exchanges are accepted within 7 days of receiving your order if you got the wrong item or size, or the pair has a verified manufacturing defect. Items must be unworn and in original packaging.

## Can I cancel my order?
Orders may be cancelled before dispatch. Once dispatched, cancellations are not accepted. Message us on Messenger as soon as possible.

## How do I contact you?
Message us on Messenger, Facebook or Instagram (@sneakndripph), call 0961 177 4119, or email hello@sneakndrip.ph. Have your order number ready.`;

function parseFaq(text: string) {
  return text
    .replace(/\r\n?/g, "\n")
    .split(/^## /m)
    .map(block => block.trim())
    .filter(Boolean)
    .map(block => {
      const [q, ...rest] = block.split("\n");
      return { q: q.trim(), a: rest.join("\n").trim() };
    });
}

export default async function FaqPage() {
  const faqs = parseFaq(await getPageContent("faq", FALLBACK));

  return (
    <div className="max-w-3xl mx-auto px-5 md:px-8 py-16 lg:py-24">
      <h1 className="text-display text-ink font-display leading-tight tracking-[-0.03em] mb-8">
        FAQ
      </h1>
      <div className="border-t border-line">
        {faqs.map(({ q, a }) => (
          <details key={q} className="group border-b border-line">
            <summary className="flex items-center justify-between gap-4 py-5 cursor-pointer list-none text-body text-ink font-medium [&::-webkit-details-marker]:hidden">
              {q}
              <span aria-hidden className="text-ink-3 text-xl leading-none transition-transform group-open:rotate-45">+</span>
            </summary>
            <div className="pb-6 text-ink-2">
              <PageContent text={a} />
            </div>
          </details>
        ))}
      </div>
      <p className="text-body-sm text-ink-3 mt-10">
        Still have a question? <Link href="/contact" className="underline text-ink">Contact us</Link>.
      </p>
    </div>
  );
}

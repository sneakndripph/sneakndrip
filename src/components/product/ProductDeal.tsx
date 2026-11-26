import Link from "next/link";
import { Tag } from "lucide-react";
import type { Product } from "@/lib/types";

/** Under the buy box: the pre-order final-sale note and, when the product is in an active deal, the deal panel. */
export default function ProductDeal({
  product,
  isPreOrder,
  soldOut,
}: {
  product: Product;
  isPreOrder: boolean;
  soldOut: boolean;
}) {
  if (!isPreOrder && !(product.deal && !soldOut)) return null;
  return (
    <div className="space-y-3 mt-5">
      {isPreOrder && (
        <p className="text-micro text-state-preorder">
          Pre-orders are final sale: no returns, size changes, or change of mind once the order is placed.
        </p>
      )}

      {product.deal && !soldOut && (
        <div className="flex gap-3 p-4 rounded-md border border-state-error/30 bg-state-error/5">
          <span className="shrink-0 w-9 h-9 rounded-full bg-paper flex items-center justify-center text-state-error">
            <Tag className="w-4 h-4" />
          </span>
          <div className="min-w-0 text-body-sm text-ink">
            <p>
              <strong className="font-semibold">{product.deal.label}</strong>, mix and match.{" "}
              <Link href="/shop?category=deals" className="underline underline-offset-2">See all deal items</Link>
            </p>
            <p className="text-micro text-ink-3 mt-0.5">Use code <strong className="font-bold text-ink">{product.deal.code}</strong> at checkout.</p>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { Star, Clock, ShieldCheck, Truck } from "lucide-react";
import type { Product, Review } from "@/lib/types";

function formatETA(start: string, end?: string) {
  const s = new Date(start);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  if (!end) return `${months[s.getMonth()]} ${s.getDate()}`;
  const e = new Date(end);
  if (s.getMonth() === e.getMonth())
    return `${months[s.getMonth()]} ${s.getDate()}–${e.getDate()}`;
  return `${months[s.getMonth()]} ${s.getDate()} – ${months[e.getMonth()]} ${e.getDate()}`;
}

function truncateDescription(text: string, maxLen = 150): { teaser: string; truncated: boolean } {
  if (text.length <= maxLen) return { teaser: text, truncated: false };
  const slice = text.slice(0, maxLen);
  const lastPunct = Math.max(slice.lastIndexOf("."), slice.lastIndexOf("!"), slice.lastIndexOf("?"));
  if (lastPunct > maxLen * 0.4) {
    return { teaser: slice.slice(0, lastPunct + 1), truncated: true };
  }
  const lastSpace = slice.lastIndexOf(" ");
  return { teaser: `${slice.slice(0, lastSpace > 0 ? lastSpace : maxLen)}…`, truncated: true };
}

export default function ProductInfo({
  product,
  reviews,
  isPreOrder,
  settings,
  onSwitchTab,
}: {
  product: Product;
  reviews: Review[];
  isPreOrder: boolean;
  settings: Record<string, string>;
  onSwitchTab: (tab: "description" | "reviews") => void;
}) {
  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const hasDescription = Boolean(product.description && product.description.trim());
  const rawDescription = product.description?.trim() || "Premium authentic sneakers from verified suppliers.";
  const { teaser, truncated } = hasDescription ? truncateDescription(rawDescription) : { teaser: rawDescription, truncated: false };
  const metroFee = settings.metro_shipping_fee || "150";
  const provFee = settings.provincial_shipping_fee || "250";
  const freeThreshold = settings.free_shipping_threshold || "5000";

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 mb-4 text-micro text-ink-3 overflow-hidden">
        <Link href="/" className="hover:text-ink transition-colors">Home</Link>
        <span>/</span>
        <Link href="/shop" className="hover:text-ink transition-colors">Shop</Link>
        <span>/</span>
        <span className="truncate">{product.brand}</span>
      </div>

      <p className="text-eyebrow text-ink-3 mb-2">{product.brand}</p>
      <h1 className="text-display-s lg:text-display text-ink font-display font-medium leading-tight tracking-[-0.02em] mb-2">
        {product.name}
      </h1>
      {product.colorway && <p className="text-body-sm text-ink-2 mb-6">{product.colorway}</p>}

      {/* Status pill + ETA */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {isPreOrder ? (
          <span className="bg-paper border border-line text-state-preorder text-eyebrow px-2 py-0.5 rounded-sm">Pre-order</span>
        ) : (
          <span className="bg-paper border border-line text-state-onhand text-eyebrow px-2 py-0.5 rounded-sm">On hand</span>
        )}
        {isPreOrder && product.eta_start && (
          <span className="inline-flex items-center gap-1.5 text-micro text-ink-3">
            <Clock className="w-3 h-3" />
            ETA {formatETA(product.eta_start, product.eta_end)}
          </span>
        )}
      </div>

      {/* Rating summary */}
      {reviews.length > 0 && (
        <div className="flex items-center gap-2 mb-6">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(n => (
              <Star key={n} className={`w-3.5 h-3.5 ${n <= Math.round(avgRating) ? "text-ink" : "text-line-strong"}`} fill={n <= Math.round(avgRating) ? "currentColor" : "none"} />
            ))}
          </div>
          <span className="text-body-sm font-medium text-ink">{avgRating.toFixed(1)}</span>
          <button onClick={() => onSwitchTab("reviews")} className="text-micro text-ink-3 underline hover:text-ink transition-colors">
            ({reviews.length} review{reviews.length !== 1 ? "s" : ""})
          </button>
        </div>
      )}

      {/* Description teaser — full text lives in the Description tab */}
      <div className="border-t border-line pt-4">
        <p className="text-eyebrow text-ink-3 mb-3">Description</p>
        <p className="text-body-sm lg:text-body text-ink-2 leading-relaxed">
          {teaser}
          {truncated && (
            <>
              {" "}
              <button onClick={() => onSwitchTab("description")} className="underline hover:text-ink transition-colors whitespace-nowrap">
                Read more
              </button>
            </>
          )}
        </p>
      </div>

      {/* Authenticity mini-section */}
      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-line text-micro text-ink-3">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
        <span>100% authenticity guaranteed.</span>
        <Link href="/authenticity" className="underline hover:text-ink transition-colors whitespace-nowrap">
          How we verify →
        </Link>
      </div>

      {/* Shipping mini-section */}
      <div className="mt-4 pt-4 border-t border-line text-micro text-ink-3">
        <div className="flex items-start gap-2">
          <Truck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            Metro Manila ₱{Number(metroFee).toLocaleString()} (1–3 days) · Provincial ₱{Number(provFee).toLocaleString()} (3–7 days) · Free shipping ₱{Number(freeThreshold).toLocaleString()}+. Tracking number included.
          </span>
        </div>
        {isPreOrder && (
          <p className="text-state-preorder mt-2">
            Pre-orders are final sale — no returns, size changes, or change of mind once order is placed.
          </p>
        )}
      </div>
    </div>
  );
}

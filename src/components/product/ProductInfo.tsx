"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Star, Clock } from "lucide-react";
import { now } from "@/lib/utils";
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

/** Product header: breadcrumb, name, price with SRP and colourway. Status/Sale pills live on the photo. */
export default function ProductInfo({
  product,
  reviews,
  isPreOrder,
  onSwitchTab,
}: {
  product: Product;
  reviews: Review[];
  isPreOrder: boolean;
  onSwitchTab: (tab: "description" | "reviews") => void;
}) {
  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const isOnSale = useMemo(() => {
    if (product.sale_price == null) return false;
    const nowTs = now();
    return (!product.sale_start || new Date(product.sale_start).getTime() <= nowTs) &&
           (!product.sale_end   || new Date(product.sale_end).getTime()   >= nowTs);
  }, [product.sale_price, product.sale_start, product.sale_end]);
  const price = isOnSale ? product.sale_price! : product.full_payment_price;

  return (
    <div>
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 mb-3 text-eyebrow text-ink-3 overflow-hidden">
        <Link href="/" className="hover:text-ink transition-colors">Home</Link>
        <span>/</span>
        <Link href="/shop" className="hover:text-ink transition-colors">Shop</Link>
        <span>/</span>
        <Link href={`/shop?brand=${encodeURIComponent(product.brand)}`} className="truncate text-ink hover:underline">{product.brand}</Link>
      </nav>

      <h1 className="text-display-s lg:text-display text-ink font-display font-medium leading-tight tracking-[-0.02em]">
        {product.name}
      </h1>
      {product.colorway && <p className="text-body text-ink-3 mt-1">{product.colorway}</p>}

      {/* Price · SRP */}
      <div className="flex flex-wrap items-baseline gap-x-3 mt-3">
        <p className="text-display-s text-ink font-display font-medium">₱{price.toLocaleString()}</p>
        {product.srp_price > price && (
          <span className="text-body-sm text-ink-3 line-through">₱{product.srp_price.toLocaleString()}</span>
        )}
      </div>

      {isPreOrder && product.eta_start && (
        <p className="inline-flex items-center gap-1.5 mt-3 text-micro text-ink-3">
          <Clock className="w-3 h-3" />
          ETA {formatETA(product.eta_start, product.eta_end)}
        </p>
      )}

      {reviews.length > 0 && (
        <div className="flex items-center gap-2 mt-3">
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

      <hr className="border-line mt-5 mb-5" />
    </div>
  );
}

"use client";

import Link from "next/link";
import Image from "next/image";
import { Product } from "@/lib/types";
import { useState, useMemo } from "react";
import { Heart } from "lucide-react";
import { useWishlist } from "@/hooks/useWishlist";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [imgError, setImgError] = useState(false);

  const availableSizes = product.sizes.filter(s => s.stock > 0);
  const isPreOrder = product.status === "pre-order";
  const soldOut = availableSizes.length === 0;

  const isOnSale = useMemo(() => {
    if (product.sale_price == null) return false;
    const now = Date.now();
    return (!product.sale_start || new Date(product.sale_start).getTime() <= now) &&
           (!product.sale_end   || new Date(product.sale_end).getTime()   >= now);
  }, [product.sale_price, product.sale_start, product.sale_end]);
  const displayPrice = isOnSale ? product.sale_price! : product.full_payment_price;

  const { toggle, isWishlisted } = useWishlist();
  const wishlisted = isWishlisted(product.id);

  return (
    <Link href={`/shop/${product.slug}`} className="group block">
      {/* Image container */}
      <div className="relative aspect-square overflow-hidden rounded-md bg-paper-2">
        {product.images?.[0] && !imgError ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover object-center transition-transform duration-slow ease-smooth group-hover:scale-[1.02]"
            sizes="(max-width: 768px) 50vw, 25vw"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="font-display text-display-l text-ink/5 select-none">
              {product.brand.toUpperCase()}
            </span>
          </div>
        )}

        {/* Status pill — top left */}
        <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
          {soldOut ? (
            <span className="bg-ink/85 backdrop-blur-sm text-paper text-eyebrow px-2 py-0.5 rounded-sm">
              Sold out
            </span>
          ) : isPreOrder ? (
            <span className="bg-paper border border-line text-state-preorder text-eyebrow px-2 py-0.5 rounded-sm">
              Pre-order
            </span>
          ) : (
            <span className="bg-paper border border-line text-state-onhand text-eyebrow px-2 py-0.5 rounded-sm">
              On hand
            </span>
          )}
        </div>

        {/* Discount pill — top right */}
        {isOnSale && (
          <div className="absolute top-2 right-2 z-10">
            <span className="bg-paper border border-line text-state-error text-eyebrow px-2 py-0.5 rounded-sm">
              Sale
            </span>
          </div>
        )}

        {/* Wishlist heart — bottom right, always visible; 44px tap target around a 32px visual */}
        <button
          type="button"
          onClick={e => { e.preventDefault(); e.stopPropagation(); toggle(product.id); }}
          className="absolute bottom-0 right-0 z-20 w-11 h-11 flex items-center justify-center"
        >
          <span
            className={`w-8 h-8 flex items-center justify-center rounded-full backdrop-blur-sm transition-colors ${
              wishlisted ? "bg-ink text-paper" : "bg-paper/90 text-ink hover:bg-paper"
            }`}
          >
            <Heart className="w-4 h-4" fill={wishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} />
          </span>
        </button>
      </div>

      {/* Info block */}
      <div className="pt-3 space-y-1">
        <p className="text-eyebrow text-ink-3 tracking-[0.08em] mb-1">
          {product.brand}
        </p>

        <h3 className="text-body-sm font-medium leading-snug text-ink group-hover:underline underline-offset-2 decoration-line-strong decoration-1">
          {product.name}
        </h3>

        <p className="text-body text-ink font-normal">
          ₱{displayPrice.toLocaleString()}
        </p>

        {/* Optional metadata rows — always reserve eyebrow-line height so card bottoms stay aligned */}
        <div className="space-y-1">
          <p className="text-eyebrow tracking-[0.08em] text-state-error">
            {product.srp_price > displayPrice ? (
              <>SRP <span className="line-through">₱{product.srp_price.toLocaleString()}</span></>
            ) : (
              <span aria-hidden="true">&nbsp;</span>
            )}
          </p>

          {isOnSale && (
            <p className="text-micro text-ink-3 line-through">
              ₱{product.full_payment_price.toLocaleString()}
            </p>
          )}

          <p className="text-eyebrow tracking-[0.08em] text-state-preorder">
            {isPreOrder && product.eta_start && product.eta_end ? (
              <>ETA {formatETA(product.eta_start, product.eta_end)}</>
            ) : (
              <span aria-hidden="true">&nbsp;</span>
            )}
          </p>
        </div>
      </div>
    </Link>
  );
}

function formatETA(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  if (s.getMonth() === e.getMonth())
    return `${months[s.getMonth()]} ${s.getDate()}–${e.getDate()}`;
  return `${months[s.getMonth()]} ${s.getDate()} – ${months[e.getMonth()]} ${e.getDate()}`;
}

"use client";

import Link from "next/link";
import Image from "next/image";
import { Product } from "@/lib/types";
import { useCartStore } from "@/store/cartStore";
import { useState, useMemo } from "react";
import { Heart } from "lucide-react";
import { useWishlist } from "@/hooks/useWishlist";

interface ProductCardProps {
  product: Product;
  showQuickAdd?: boolean;
}

export default function ProductCard({ product, showQuickAdd = true }: ProductCardProps) {
  const [added, setAdded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const addItem = useCartStore(s => s.addItem);

  const availableSizes = product.sizes.filter(s => s.stock > 0);
  const [selectedSize, setSelectedSize] = useState(availableSizes[0]?.size ?? product.sizes[0]?.size ?? "");
  const isPreOrder = product.status === "pre-order";
  const isOnSale = useMemo(() => {
    if (product.sale_price == null) return false;
    const now = Date.now();
    return (!product.sale_start || new Date(product.sale_start).getTime() <= now) &&
           (!product.sale_end   || new Date(product.sale_end).getTime()   >= now);
  }, [product.sale_price, product.sale_start, product.sale_end]);
  const displayPrice = isOnSale ? product.sale_price! : product.full_payment_price;
  const { toggle, isWishlisted } = useWishlist();
  const wishlisted = isWishlisted(product.id);

  function handleQuickAdd(e: React.MouseEvent) {
    e.preventDefault();
    if (!selectedSize) return;
    addItem(product, selectedSize, "full_payment");
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  function handleSizeClick(e: React.MouseEvent, size: string) {
    e.preventDefault();
    setSelectedSize(size);
  }

  const soldOut = availableSizes.length === 0;

  return (
    <Link href={`/shop/${product.slug}`} className="group block">
      {/* Image container */}
      <div
        className="relative overflow-hidden aspect-square shadow-sm group-hover:shadow-lg group-hover:-translate-y-1 transition-all duration-300 ease-out"
        style={{ background: product.bg || "#EDE9E3" }}
      >
        {/* Product image */}
        {product.images?.[0] && !imgError ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 50vw, 25vw"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="font-heading font-black select-none text-snd-black opacity-[0.04] tracking-[0.06em] text-[clamp(2.5rem,8vw,5rem)]">
              {product.brand.toUpperCase()}
            </span>
          </div>
        )}

        {/* Status — top left */}
        <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1">
          {soldOut ? (
            <span
              className="text-[9px] font-black uppercase tracking-[0.12em] px-2 py-0.5"
              style={{ background: "rgba(58,56,54,0.85)", color: "#fff", backdropFilter: "blur(4px)" }}
            >
              Sold Out
            </span>
          ) : isPreOrder ? (
            <span className="text-[9px] font-black uppercase tracking-[0.12em] px-2 py-0.5 bg-snd-red text-white">
              Pre-Order
            </span>
          ) : (
            <span className="text-[9px] font-black uppercase tracking-[0.12em] px-2 py-0.5 bg-snd-teal text-white">
              On Hand
            </span>
          )}
          {product.is_new && (
            <span className="text-[9px] font-black uppercase tracking-[0.12em] px-2 py-0.5 bg-snd-teal/15 text-snd-teal">
              New
            </span>
          )}
        </div>

        {/* Discount badge — top right */}
        {(isOnSale || product.full_payment_price < product.srp_price) && (
          <div className="absolute top-2.5 right-2.5 z-10">
            <span className="text-[9px] font-black uppercase tracking-[0.12em] px-2 py-0.5 bg-snd-red text-white">
              {isOnSale ? "Sale" : "Below SRP"}
            </span>
          </div>
        )}

        {/* Wishlist — visible on hover (desktop); always visible on mobile */}
        <button
          type="button"
          onClick={e => { e.preventDefault(); e.stopPropagation(); toggle(product.id); }}
          className={`absolute bottom-14 right-2.5 z-30 w-7 h-7 flex items-center justify-center transition-all duration-200 opacity-100 pointer-events-auto ${
            wishlisted
              ? "bg-snd-teal text-white"
              : "md:opacity-0 md:pointer-events-none md:group-hover:opacity-100 md:group-hover:pointer-events-auto bg-white/85 backdrop-blur-sm text-snd-black"
          }`}
        >
          <Heart className="w-3.5 h-3.5" fill={wishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} />
        </button>

        {/* Quick-add — slides up from bottom (desktop); always visible on mobile */}
        {showQuickAdd && !soldOut && (
          <div className="absolute inset-x-0 bottom-0 z-20 translate-y-0 md:translate-y-full md:group-hover:translate-y-0 transition-transform duration-[250ms] ease-out">
            <div className="bg-snd-black/88 backdrop-blur">
              {/* Size strip */}
              <div className="flex flex-wrap gap-1 px-3 pt-2.5 pb-1.5">
                {availableSizes.slice(0, 8).map(s => (
                  <button
                    key={s.size}
                    type="button"
                    onClick={e => handleSizeClick(e, s.size)}
                    className={`text-[9px] font-black px-1.5 py-0.5 transition-colors text-white ${
                      selectedSize === s.size ? "bg-snd-teal" : "bg-white/10"
                    }`}
                  >
                    {s.size.replace("US ", "")}
                  </button>
                ))}
                {availableSizes.length > 8 && (
                  <span className="text-[9px] self-center text-white/40">
                    +{availableSizes.length - 8}
                  </span>
                )}
              </div>

              {/* Add button */}
              <button
                onClick={handleQuickAdd}
                disabled={!selectedSize}
                className={`w-full py-2.5 text-[11px] font-black uppercase tracking-[0.12em] transition-colors disabled:opacity-40 ${
                  added ? "bg-snd-teal text-white" : "bg-snd-bg text-snd-black"
                }`}
              >
                {added ? "Added" : selectedSize ? `Add US ${selectedSize.replace("US ", "")}` : "Select Size"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Info below image */}
      <div className="pt-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-0.5 text-snd-muted-lt">
          {product.brand}
        </p>

        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold leading-snug flex-1 min-w-0 text-snd-black">
            {product.name}
          </h3>

          <div className="shrink-0 text-right">
            <span className={`text-sm font-black block ${isOnSale ? "text-snd-red" : "text-snd-black"}`}>
              ₱{displayPrice.toLocaleString()}
            </span>
            {isOnSale ? (
              <span className="text-[10px] line-through block text-snd-muted-lt">
                ₱{product.full_payment_price.toLocaleString()}
              </span>
            ) : product.srp_price !== product.full_payment_price ? (
              <span className="text-[10px] line-through block text-snd-muted-lt">
                ₱{product.srp_price.toLocaleString()}
              </span>
            ) : null}
          </div>
        </div>

        {isPreOrder && product.eta_start && product.eta_end && (
          <p className="text-[11px] font-semibold mt-1 text-snd-red">
            ETA {formatETA(product.eta_start, product.eta_end)}
          </p>
        )}
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

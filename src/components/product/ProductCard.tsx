"use client";

import Link from "next/link";
import Image from "next/image";
import { Product } from "@/lib/types";
import { BRAND, FONTS } from "@/lib/constants";
import { useCartStore } from "@/store/cartStore";
import { useState } from "react";
import { Heart } from "lucide-react";
import { useWishlist } from "@/hooks/useWishlist";

interface ProductCardProps {
  product: Product;
  showQuickAdd?: boolean;
}

export default function ProductCard({ product, showQuickAdd = true }: ProductCardProps) {
  const [hovered, setHovered] = useState(false);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore(s => s.addItem);

  const availableSizes = product.sizes.filter(s => s.stock > 0);
  const [selectedSize, setSelectedSize] = useState(availableSizes[0]?.size ?? product.sizes[0]?.size ?? "");
  const isPreOrder = product.status === "pre-order";
  const { toggle, isWishlisted } = useWishlist();

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

  return (
    <Link href={`/shop/${product.slug}`} className="group block"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}>

      {/* Image area */}
      <div className="relative overflow-hidden mb-3"
        style={{
          aspectRatio: "1",
          background: product.bg || "#EDE9E3",
          border: `1px solid ${hovered ? BRAND.teal + "40" : BRAND.cardBorder}`,
          transition: "border-color 0.25s",
        }}>

        {product.images?.[0] ? (
          <Image src={product.images[0]} alt={product.name} fill
            className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 25vw" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="font-black select-none"
              style={{ fontFamily: FONTS.display, fontSize: "clamp(3rem,8vw,6rem)", color: BRAND.black, opacity: 0.05, letterSpacing: "0.04em" }}>
              {product.brand.toUpperCase()}
            </span>
          </div>
        )}

        {/* Status badge */}
        <div className="absolute top-3 left-3 z-10">
          {isPreOrder ? (
            <span className="text-[10px] font-black uppercase px-2.5 py-1 tracking-wider text-white"
              style={{ background: BRAND.red }}>Pre-Order</span>
          ) : (
            <span className="text-[10px] font-black uppercase px-2.5 py-1 tracking-wider text-white"
              style={{ background: BRAND.teal }}>On Hand</span>
          )}
        </div>

        {/* Below SRP badge */}
        {product.full_payment_price < product.srp_price && (
          <div className="absolute top-3 right-3 z-10">
            <span className="text-[10px] font-black uppercase px-2 py-0.5 tracking-wide text-white"
              style={{ background: BRAND.red }}>Below SRP</span>
          </div>
        )}

        {/* Wishlist button */}
        <button
          type="button"
          onClick={e => { e.preventDefault(); e.stopPropagation(); toggle(product.id); }}
          className="absolute bottom-3 right-3 z-30 w-8 h-8 flex items-center justify-center rounded-full transition-all"
          style={{ background: isWishlisted(product.id) ? BRAND.teal : "rgba(255,255,255,0.85)", border: `1px solid ${isWishlisted(product.id) ? BRAND.teal : BRAND.border}` }}>
          <Heart className="w-3.5 h-3.5" fill={isWishlisted(product.id) ? "#fff" : "none"} stroke={isWishlisted(product.id) ? "#fff" : BRAND.muted} />
        </button>

        {/* Hover overlay — sizes + quick add */}
        {showQuickAdd && (
          <div className="absolute inset-0 flex flex-col justify-end z-20 transition-opacity duration-200"
            style={{ opacity: hovered ? 1 : 0, pointerEvents: hovered ? "auto" : "none" }}>
            {/* Gradient scrim */}
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 55%, transparent 100%)" }} />

            <div className="relative p-3 space-y-2">
              {/* Size buttons */}
              {availableSizes.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {availableSizes.slice(0, 8).map(s => (
                    <button key={s.size} type="button" onClick={e => handleSizeClick(e, s.size)}
                      className="text-[9px] font-black px-1.5 py-0.5 transition-all duration-150"
                      style={{
                        background: selectedSize === s.size ? BRAND.teal : "rgba(255,255,255,0.12)",
                        border: `1px solid ${selectedSize === s.size ? BRAND.teal : "rgba(255,255,255,0.35)"}`,
                        color: "#fff",
                      }}>
                      {s.size.replace("US ", "")}
                    </button>
                  ))}
                  {availableSizes.length > 8 && (
                    <span className="text-[9px] text-white opacity-60 self-center">+{availableSizes.length - 8}</span>
                  )}
                </div>
              )}

              {/* Add to cart button */}
              <button onClick={handleQuickAdd} disabled={!selectedSize}
                className="w-full py-2.5 text-xs font-black uppercase tracking-widest transition-colors disabled:opacity-40"
                style={{ background: added ? BRAND.teal : BRAND.black, color: "#fff" }}>
                {added ? "Added ✓" : selectedSize ? `Add US ${selectedSize.replace("US ", "")}` : "Select Size"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest mb-0.5"
          style={{ color: BRAND.muted, fontFamily: FONTS.body }}>
          {product.brand}
        </p>
        <h3 className="text-sm font-semibold leading-snug mb-1 transition-colors"
          style={{ color: hovered ? BRAND.teal : BRAND.black, fontFamily: FONTS.body }}>
          {product.name}
        </h3>

        {isPreOrder && product.eta_start && product.eta_end && (
          <p className="text-xs font-semibold mb-1.5" style={{ color: BRAND.red }}>
            ETA: {formatETA(product.eta_start, product.eta_end)}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="font-black text-sm" style={{ color: BRAND.black, fontFamily: FONTS.body }}>
              ₱{product.full_payment_price.toLocaleString()}
            </span>
            {product.srp_price !== product.full_payment_price && (
              <span className="text-xs line-through" style={{ color: BRAND.mutedLight }}>
                ₱{product.srp_price.toLocaleString()}
              </span>
            )}
          </div>

          <div className="flex gap-1 items-center">
            {product.sizes.slice(0, 4).map(s => (
              <span key={s.size} className="text-[9px] px-1 py-0.5 font-medium"
                style={{
                  border: `1px solid ${s.stock > 0 ? BRAND.border : "rgba(13,13,13,0.04)"}`,
                  color: s.stock > 0 ? BRAND.muted : BRAND.mutedLight,
                  opacity: s.stock > 0 ? 1 : 0.4,
                }}>
                {s.size.replace("US ", "")}
              </span>
            ))}
            {product.sizes.length > 4 && (
              <span className="text-[9px]" style={{ color: BRAND.mutedLight }}>+{product.sizes.length - 4}</span>
            )}
          </div>
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

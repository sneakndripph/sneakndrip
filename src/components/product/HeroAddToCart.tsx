"use client";

import { useState } from "react";
import Link from "next/link";
import { useCartStore } from "@/store/cartStore";
import toast from "react-hot-toast";
import type { Product } from "@/lib/types";

export default function HeroAddToCart({ product }: { product: Product }) {
  const availableSizes = product.sizes.filter(s => s.stock > 0);
  const [selectedSize, setSelectedSize] = useState<string>(availableSizes[0]?.size ?? "");
  const addItem = useCartStore(s => s.addItem);

  function handleAdd() {
    if (!selectedSize) return;
    addItem(product, selectedSize, "full_payment");
    toast.success(`${product.name} (${selectedSize}) added to cart!`);
  }

  return (
    <div className="px-6 pt-4 pb-6 font-body">
      <h3 className="font-bold text-base mb-1 text-snd-black">{product.name}</h3>
      <p className="text-xs mb-4 text-snd-muted">{product.colorway}</p>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {availableSizes.slice(0, 6).map(s => (
          <button
            key={s.size}
            onClick={() => setSelectedSize(s.size)}
            className={`text-xs px-2.5 py-1 font-medium transition-colors border ${
              selectedSize === s.size ? "border-snd-teal text-snd-teal bg-snd-teal/[10%]" : "border-snd-border text-snd-muted bg-transparent"
            }`}
          >
            {s.size}
          </button>
        ))}
        {availableSizes.length === 0 && (
          <span className="text-xs text-snd-muted">Out of stock</span>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <div>
          <span className="font-heading tracking-[0.02em] text-[1.8rem] text-snd-black">
            ₱{product.full_payment_price.toLocaleString()}
          </span>
          {product.srp_price > product.full_payment_price && (
            <span className="text-sm line-through ml-2 text-snd-muted-lt">
              ₱{product.srp_price.toLocaleString()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAdd}
            disabled={!selectedSize}
            className="px-4 py-2.5 text-xs font-black text-white transition-opacity hover:opacity-80 uppercase tracking-wider disabled:opacity-40 bg-snd-black"
          >
            Add to Cart
          </button>
          <Link
            href={`/shop/${product.slug}`}
            className="px-4 py-2.5 text-xs font-black text-white transition-opacity hover:opacity-80 uppercase tracking-wider bg-snd-teal"
          >
            View
          </Link>
        </div>
      </div>
    </div>
  );
}

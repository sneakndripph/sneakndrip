"use client";

import { useState, useEffect, type Dispatch, type SetStateAction } from "react";
import { Bell, BellRing } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Product } from "@/lib/types";
import ProductSizeGuideModal from "./ProductSizeGuideModal";

export default function ProductSizeSelector({
  product,
  selectedSize,
  setSelectedSize,
  setQuantity,
}: {
  product: Product;
  selectedSize: string | null;
  setSelectedSize: Dispatch<SetStateAction<string | null>>;
  setQuantity: Dispatch<SetStateAction<number>>;
}) {
  const [notifySize, setNotifySize] = useState<string | null>(null);
  const [notifyEmail, setNotifyEmail] = useState("");
  const [notifiedSizes, setNotifiedSizes] = useState<Set<string>>(new Set());
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (data.user?.email) setNotifyEmail(data.user.email);
    });
  }, []);

  async function handleNotify(e: React.FormEvent) {
    e.preventDefault();
    if (!notifyEmail.trim() || !notifySize) return;
    await fetch("/api/restock-notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id, size: notifySize, email: notifyEmail }),
    });
    setNotifiedSizes(prev => new Set(prev).add(notifySize!));
    setNotifySize(null);
  }

  return (<>
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-bold uppercase tracking-wide text-snd-black">Select Size</p>
        <div className="flex items-center gap-3">
          {selectedSize && <p className="text-sm font-semibold text-snd-teal">{selectedSize}</p>}
          <button type="button" onClick={() => setShowSizeGuide(true)} className="text-xs underline transition-opacity hover:opacity-60 text-snd-muted">
            Size Guide
          </button>
        </div>
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
        {product.sizes.map(s => {
          const outOfStock = s.stock === 0;
          const isSelected = selectedSize === s.size;
          const isNotify = notifySize === s.size;
          const isNotified = notifiedSizes.has(s.size);
          return (
            <button
              key={s.size}
              onClick={() => {
                if (outOfStock && !isNotified) { setNotifySize(isNotify ? null : s.size); }
                else if (!outOfStock) { setSelectedSize(s.size); setQuantity(1); setNotifySize(null); }
              }}
              className={`py-2.5 text-sm font-semibold transition-all relative flex flex-col items-center justify-center gap-0.5 border-[1.5px] ${
                isSelected ? "bg-snd-black text-snd-bg border-snd-black"
                : isNotify ? "bg-snd-teal/[8%] text-snd-black border-snd-teal"
                : isNotified ? "bg-snd-teal/[6%] text-snd-black border-snd-teal"
                : "bg-transparent border-snd-border"
              } ${outOfStock ? "text-snd-muted-lt" : !isSelected ? "text-snd-black" : ""} ${outOfStock && !isNotified ? "opacity-60" : ""}`}
            >
              <span className={outOfStock && !isNotified ? "line-through" : ""}>
                {s.size.replace("US ", "")}
              </span>
              {outOfStock && (
                isNotified
                  ? <BellRing className="w-2.5 h-2.5 text-snd-teal" />
                  : <Bell className="w-2.5 h-2.5 text-snd-muted-lt" />
              )}
              {s.stock > 0 && s.stock <= 2 && (
                <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full text-[7px] font-black text-white flex items-center justify-center bg-snd-red">{s.stock}</span>
              )}
            </button>
          );
        })}
      </div>
      {/* Notify-me form for OOS size */}
      {notifySize && product.sizes.find(s => s.size === notifySize)?.stock === 0 && (
        <div className="mt-3 p-4 bg-snd-teal/[8%] border border-snd-teal/25">
          <p className="text-xs font-bold mb-2 flex items-center gap-1.5 text-snd-teal">
            <Bell className="w-3.5 h-3.5" />
            Notify me when {notifySize} is back in stock
          </p>
          <form onSubmit={handleNotify} className="flex gap-2">
            <input
              type="email"
              value={notifyEmail}
              onChange={e => setNotifyEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="flex-1 px-3 py-2 text-sm focus:outline-none bg-snd-bg border border-snd-border text-snd-black"
            />
            <button type="submit" className="px-4 py-2 text-xs font-black uppercase tracking-wide whitespace-nowrap bg-snd-teal text-white">
              Notify Me
            </button>
          </form>
        </div>
      )}
      {/* Confirmed subscriptions */}
      {notifiedSizes.size > 0 && (
        <p className="mt-2 text-xs flex items-center gap-1.5 text-snd-teal">
          <BellRing className="w-3 h-3" />
          Watching: {Array.from(notifiedSizes).join(", ")} — we&apos;ll email you when they&apos;re back.
        </p>
      )}

      <div className="flex items-center justify-between mt-2">
        <p className="text-xs text-snd-muted">Numbers in red = limited stock.</p>
        {selectedSize && (() => {
          const s = product.sizes.find(sz => sz.size === selectedSize);
          if (!s || s.stock > 5) return null;
          return (
            <p className="text-xs font-bold text-snd-red">
              Max {s.stock} per order
            </p>
          );
        })()}
      </div>
    </div>

    <ProductSizeGuideModal open={showSizeGuide} onClose={() => setShowSizeGuide(false)} brand={product.brand} />
  </>);
}

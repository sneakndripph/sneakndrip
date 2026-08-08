"use client";

import { useState, useEffect, type Dispatch, type SetStateAction } from "react";
import { Bell, BellRing, ChevronDown } from "lucide-react";
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
  const [sheetOpen, setSheetOpen] = useState(false);
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

  function renderGrid() {
    return (
      <div className="grid grid-cols-4 gap-2">
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
              className={`relative py-3 border rounded-md text-body-sm transition-colors flex flex-col items-center justify-center gap-0.5 ${
                isSelected ? "border-ink bg-ink text-paper"
                : isNotify || isNotified ? "border-ink text-ink"
                : "border-line text-ink hover:border-ink"
              } ${outOfStock && !isNotified ? "opacity-40 line-through cursor-not-allowed" : ""}`}
            >
              <span>{s.size.replace("US ", "")}</span>
              {outOfStock && (
                isNotified
                  ? <BellRing className="w-2.5 h-2.5" />
                  : <Bell className="w-2.5 h-2.5" />
              )}
              {s.stock > 0 && s.stock <= 2 && (
                <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full text-[8px] font-medium text-paper flex items-center justify-center bg-state-error">{s.stock}</span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  function renderNotifyForm() {
    return (
      <>
        {notifySize && product.sizes.find(s => s.size === notifySize)?.stock === 0 && (
          <div className="mt-3 p-4 bg-paper-2 border border-line rounded-md">
            <p className="text-body-sm font-medium mb-2 flex items-center gap-1.5 text-ink">
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
                className="flex-1 px-3 py-2 text-body-sm rounded-md bg-paper border border-line text-ink focus:outline-2 focus:outline-ink focus:outline-offset-1"
              />
              <button type="submit" className="px-4 py-2 text-micro font-medium rounded-md whitespace-nowrap bg-ink text-paper hover:bg-ink-2 transition-colors">
                Notify me
              </button>
            </form>
          </div>
        )}
        {notifiedSizes.size > 0 && (
          <p className="mt-2 text-micro flex items-center gap-1.5 text-ink-3">
            <BellRing className="w-3 h-3" />
            Watching: {Array.from(notifiedSizes).join(", ")} — we&apos;ll email you when they&apos;re back.
          </p>
        )}
        <div className="flex items-center justify-between mt-3">
          <p className="text-micro text-ink-3">Limited stock shown in red.</p>
          {selectedSize && (() => {
            const s = product.sizes.find(sz => sz.size === selectedSize);
            if (!s || s.stock > 5) return null;
            return <p className="text-micro text-state-error">Max {s.stock} per order</p>;
          })()}
        </div>
      </>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <p className="text-eyebrow text-ink-3">Select size</p>
        <button type="button" onClick={() => setShowSizeGuide(true)} className="text-micro text-ink-3 underline hover:text-ink transition-colors">
          Size guide
        </button>
      </div>

      {/* Mobile trigger */}
      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        className="lg:hidden w-full flex items-center justify-between border border-line rounded-md px-4 py-3 text-body-sm text-ink hover:border-ink transition-colors"
      >
        {selectedSize ? `Size ${selectedSize}` : "Select size"}
        <ChevronDown className="w-4 h-4 text-ink-3" />
      </button>

      {/* Desktop inline */}
      <div className="hidden lg:block">
        {renderGrid()}
        {renderNotifyForm()}
      </div>

      {/* Mobile bottom sheet */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setSheetOpen(false)} />
          <div className="fixed inset-x-0 bottom-0 bg-paper rounded-t-xl p-6 pb-8 shadow-xl max-h-[80vh] overflow-y-auto">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line-strong" />
            <p className="text-body font-display font-medium text-ink mb-4">Select size</p>
            {renderGrid()}
            {renderNotifyForm()}
            <button
              type="button"
              onClick={() => setSheetOpen(false)}
              className="mt-6 w-full bg-ink text-paper py-3 rounded-md text-body-sm font-medium hover:bg-ink-2 transition-colors"
            >
              Confirm
            </button>
          </div>
        </div>
      )}

      <ProductSizeGuideModal open={showSizeGuide} onClose={() => setShowSizeGuide(false)} brand={product.brand} />
    </div>
  );
}

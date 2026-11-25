"use client";

import { useState, useEffect, type CSSProperties } from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { Product } from "@/lib/types";

const SWIPER_VARS = {
  "--swiper-pagination-color": "var(--ink)",
  "--swiper-pagination-bullet-inactive-color": "var(--line-strong)",
  "--swiper-pagination-bullet-inactive-opacity": "1",
  "--swiper-pagination-bullet-size": "6px",
  "--swiper-pagination-bottom": "12px",
} as CSSProperties;

function Placeholder({ brand, size = "text-[8rem]" }: { brand: string; size?: string }) {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <span className={`font-display text-ink opacity-5 select-none ${size}`}>{brand.charAt(0)}</span>
    </div>
  );
}

function StatusBadges({ isPreOrder, onSale }: { isPreOrder: boolean; onSale: boolean }) {
  return (
    <>
      <div className="absolute top-3 left-3 z-10">
        {isPreOrder ? (
          <span className="bg-paper border border-line text-state-preorder text-eyebrow px-2 py-0.5 rounded-sm">Pre-order</span>
        ) : (
          <span className="bg-paper border border-line text-state-onhand text-eyebrow px-2 py-0.5 rounded-sm">On hand</span>
        )}
      </div>
      {onSale && (
        <div className="absolute top-3 right-3 z-10">
          <span className="bg-paper border border-line text-state-error text-eyebrow px-2 py-0.5 rounded-sm">Below SRP</span>
        </div>
      )}
    </>
  );
}

export default function ProductGallery({ product, isPreOrder }: { product: Product; isPreOrder: boolean }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const images: (string | null)[] = product.images?.length ? product.images : [null];
  const onSale = product.full_payment_price < product.srp_price;
  const activeImage = images[activeIdx];
  const multiple = images.length > 1;
  // Wraps around: next on the last photo goes back to the first.
  const step = (d: number) => setActiveIdx(i => (i + d + images.length) % images.length);

  useEffect(() => {
    if (!zoomOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoomOpen(false);
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoomOpen, images.length]);

  return (
    <div>
      {/* Mobile — swiper carousel */}
      <div className="relative lg:hidden">
        <Swiper
          modules={[Pagination]}
          pagination={{ clickable: true }}
          onSlideChange={s => setActiveIdx(s.activeIndex)}
          style={SWIPER_VARS}
          className="aspect-square rounded-md overflow-hidden bg-paper-2"
        >
          {images.map((img, i) => (
            <SwiperSlide key={i}>
              <div className="relative w-full h-full" style={{ background: product.bg || undefined }}>
                {img ? (
                  <Image src={img} alt={product.name} fill className="object-cover object-center" sizes="100vw" />
                ) : (
                  <Placeholder brand={product.brand} />
                )}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
        <StatusBadges isPreOrder={isPreOrder} onSale={onSale} />
      </div>

      {/* Desktop — thumbnail strip left of main image */}
      <div className="hidden lg:flex gap-3">
        <div className="flex flex-col gap-2 w-16 shrink-0">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              className={`aspect-square rounded-md overflow-hidden relative bg-paper-2 border transition-colors ${
                activeIdx === i ? "border-ink" : "border-line hover:border-line-strong"
              }`}
              style={{ background: product.bg || undefined }}
              aria-label={`View image ${i + 1}`}
            >
              {img ? (
                <Image src={img} alt="" fill className="object-cover object-center" sizes="64px" />
              ) : (
                <Placeholder brand={product.brand} size="text-lg" />
              )}
            </button>
          ))}
        </div>
        <button
          type="button"
          aria-label="Zoom product image"
          className="relative flex-1 aspect-square rounded-md overflow-hidden bg-paper-2 cursor-zoom-in appearance-none border-0 p-0 block w-full text-left focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-1"
          style={{ background: product.bg || undefined }}
          onClick={() => activeImage && setZoomOpen(true)}
        >
          {activeImage ? (
            <Image src={activeImage} alt={product.name} fill className="object-cover object-center" sizes="50vw" priority />
          ) : (
            <Placeholder brand={product.brand} />
          )}
          <StatusBadges isPreOrder={isPreOrder} onSale={onSale} />
        </button>
      </div>

      {/* Zoom modal */}
      {zoomOpen && activeImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-ink/95"
          onClick={() => setZoomOpen(false)}
        >
          <button
            className="absolute top-5 right-5 w-11 h-11 flex items-center justify-center text-paper hover:opacity-70 transition-opacity"
            onClick={() => setZoomOpen(false)}
            aria-label="Close zoom"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="relative w-full max-w-3xl aspect-square" onClick={e => e.stopPropagation()}>
            <Image src={activeImage} alt={`${product.name}, photo ${activeIdx + 1} of ${images.length}`} fill className="object-contain" sizes="80vw" />
          </div>
          {multiple && (
            <>
              {([[-1, "Previous photo", ChevronLeft, "left-3 md:left-6"], [1, "Next photo", ChevronRight, "right-3 md:right-6"]] as const).map(([d, label, Icon, pos]) => (
                <button key={label} type="button" aria-label={label}
                  onClick={e => { e.stopPropagation(); step(d); }}
                  className={`absolute top-1/2 -translate-y-1/2 ${pos} w-12 h-12 flex items-center justify-center rounded-full bg-paper/10 text-paper hover:bg-paper/20 transition-colors`}>
                  <Icon className="w-7 h-7" />
                </button>
              ))}
              <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-body-sm text-paper/80" aria-live="polite">
                {activeIdx + 1} / {images.length}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

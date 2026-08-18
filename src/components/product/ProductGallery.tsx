"use client";

import { useState, type CSSProperties } from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { X } from "lucide-react";
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
        <div
          className="relative flex-1 aspect-square rounded-md overflow-hidden bg-paper-2 cursor-zoom-in"
          style={{ background: product.bg || undefined }}
          onClick={() => activeImage && setZoomOpen(true)}
        >
          {activeImage ? (
            <Image src={activeImage} alt={product.name} fill className="object-cover object-center" sizes="50vw" priority />
          ) : (
            <Placeholder brand={product.brand} />
          )}
          <StatusBadges isPreOrder={isPreOrder} onSale={onSale} />
        </div>
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
            <Image src={activeImage} alt={product.name} fill className="object-contain" sizes="80vw" />
          </div>
        </div>
      )}
    </div>
  );
}

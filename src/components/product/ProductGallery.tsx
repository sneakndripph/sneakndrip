"use client";

import { useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import type { Product } from "@/lib/types";

export default function ProductGallery({
  product,
  isPreOrder,
}: {
  product: Product;
  isPreOrder: boolean;
}) {
  const [imageIdx, setImageIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const images = product.images?.length ? product.images : Array(4).fill(null);

  return (<>
    <div>
      <div
        className="relative aspect-square mb-3 overflow-hidden flex items-center justify-center cursor-zoom-in bg-snd-bg border border-snd-border"
        style={{ background: product.bg || undefined }}
        onClick={() => images[imageIdx] && setLightboxOpen(true)}
      >
        {images[imageIdx] ? (
          <Image src={images[imageIdx]!} alt={product.name} fill className="object-cover object-center" sizes="(max-width: 768px) 100vw, 50vw" />
        ) : (
          <span className="font-heading text-snd-black opacity-5 text-[8rem]">
            {product.brand.charAt(0)}
          </span>
        )}
        <div className="absolute top-4 left-4">
          {isPreOrder ? (
            <span className="text-xs font-black uppercase px-3 py-1.5 text-white bg-snd-red">Pre-Order</span>
          ) : (
            <span className="text-xs font-black uppercase px-3 py-1.5 text-white bg-snd-teal">On Hand</span>
          )}
        </div>
        {product.full_payment_price < product.srp_price && (
          <div className="absolute top-4 right-4">
            <span className="text-white text-[9px] font-black uppercase px-2 py-1 tracking-wider bg-snd-red">Below SRP</span>
          </div>
        )}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => setImageIdx(i)}
            className={`aspect-square flex items-center justify-center transition-all overflow-hidden relative bg-snd-bg border-2 ${imageIdx === i ? "border-snd-teal" : "border-snd-border"}`}
            style={{ background: product.bg || undefined }}
          >
            {img ? (
              <Image src={img} alt="" fill className="object-cover object-center" sizes="80px" />
            ) : (
              <span className="font-heading text-snd-black opacity-[7%] text-[1.5rem]">
                {product.brand.charAt(0)}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>

    {/* Lightbox */}
    {lightboxOpen && images[imageIdx] && (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85"
        onClick={() => setLightboxOpen(false)}
      >
        <button
          className="absolute top-4 right-4 p-2 transition-opacity hover:opacity-70 bg-white/15 text-white"
          onClick={() => setLightboxOpen(false)}
        >
          <X className="w-6 h-6" />
        </button>
        <div className="relative w-full max-w-2xl aspect-square" onClick={e => e.stopPropagation()}>
          <Image src={images[imageIdx]!} alt={product.name} fill className="object-contain" sizes="100vw" />
        </div>
      </div>
    )}
  </>);
}

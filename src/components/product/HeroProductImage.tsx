"use client";

import Image from "next/image";
import { useState } from "react";
import { Product } from "@/lib/types";

export default function HeroProductImage({ product }: { product: Product }) {
  const [imgError, setImgError] = useState(false);
  const src = product.images?.[0];

  if (src && !imgError) {
    return (
      <Image
        src={src}
        alt={product.name}
        fill
        className="object-contain p-3"
        sizes="(max-width: 1023px) 0px, 420px"
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <span className="font-heading text-snd-black opacity-5 text-[5rem]">
        {product.brand.toUpperCase()}
      </span>
    </div>
  );
}

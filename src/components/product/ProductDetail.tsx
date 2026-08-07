"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRecentlyViewed, useRecentlyViewedStore } from "@/hooks/useRecentlyViewed";
import type { Product, Review } from "@/lib/types";
import ProductGallery from "./ProductGallery";
import ProductInfo from "./ProductInfo";
import ProductSizeSelector from "./ProductSizeSelector";
import ProductCTA from "./ProductCTA";
import ProductTabs from "./ProductTabs";

type Tab = "details" | "shipping" | "auth" | "reviews";

export default function ProductDetail({
  product,
  reviews = [],
  settings = {},
}: {
  product: Product;
  reviews?: Review[];
  settings?: Record<string, string>;
}) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [paymentType, setPaymentType] = useState<"full_payment" | "downpayment">("full_payment");
  const [activeTab, setActiveTab] = useState<Tab>("details");
  const tabsRef = useRef<HTMLDivElement>(null);
  const { trackItem } = useRecentlyViewed();
  const recentItems = useRecentlyViewedStore(s => s.items);

  useEffect(() => {
    trackItem({
      id: product.id,
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      price: product.full_payment_price,
      images: product.images ?? [],
      bg: product.bg ?? "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  const isPreOrder = product.status === "pre-order";
  const effectivePaymentType = isPreOrder ? paymentType : "full_payment";

  function handleViewReviews() {
    setActiveTab("reviews");
    setTimeout(() => tabsRef.current?.scrollIntoView({ block: "start" }), 50);
  }

  return (<>
    <div className="bg-snd-bg font-body">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-10">
        <div className="flex items-center gap-2 mb-10 text-xs overflow-hidden text-snd-muted">
          <Link href="/" className="hover:opacity-70">Home</Link>
          <span>/</span>
          <Link href="/shop" className="hover:opacity-70">Shop</Link>
          <span>/</span>
          <span className="truncate text-snd-black">{product.name}</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          <ProductGallery product={product} isPreOrder={isPreOrder} />

          <div>
            <ProductInfo
              product={product}
              reviews={reviews}
              isPreOrder={isPreOrder}
              paymentType={paymentType}
              setPaymentType={setPaymentType}
              effectivePaymentType={effectivePaymentType}
              onViewReviews={handleViewReviews}
            />

            <ProductSizeSelector
              product={product}
              selectedSize={selectedSize}
              setSelectedSize={setSelectedSize}
              setQuantity={setQuantity}
            />

            <ProductCTA
              product={product}
              selectedSize={selectedSize}
              quantity={quantity}
              setQuantity={setQuantity}
              isPreOrder={isPreOrder}
              effectivePaymentType={effectivePaymentType}
            />

            <ProductTabs
              containerRef={tabsRef}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              product={product}
              reviews={reviews}
              settings={settings}
              isPreOrder={isPreOrder}
            />
          </div>
        </div>

        {/* Recently Viewed */}
        {recentItems.filter(i => i.id !== product.id).length > 0 && (
          <div className="mt-12 pt-10 border-t border-snd-border">
            <p className="text-xs font-bold uppercase tracking-widest mb-5 text-snd-muted">Recently Viewed</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {recentItems.filter(i => i.id !== product.id).slice(0, 4).map(item => (
                <Link key={item.id} href={`/shop/${item.slug}`} className="group block">
                  <div className="relative aspect-square mb-2 overflow-hidden bg-snd-bg border border-snd-border" style={{ background: item.bg || undefined }}>
                    {item.images[0] ? (
                      <Image src={item.images[0]} alt={item.name} fill className="object-cover transition-transform duration-300 group-hover:scale-105" sizes="(max-width: 640px) 50vw, 25vw" />
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center font-heading text-snd-black opacity-5 text-[2rem]">
                        {item.brand.charAt(0)}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5 text-snd-muted">{item.brand}</p>
                  <p className="text-xs font-semibold leading-snug text-snd-black">{item.name}</p>
                  <p className="text-xs font-black mt-0.5 text-snd-black">₱{item.price.toLocaleString()}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  </>);
}

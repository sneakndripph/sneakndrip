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

type Tab = "shipping" | "auth" | "reviews";

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
  const [activeTab, setActiveTab] = useState<Tab>("shipping");
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
  const otherRecentItems = recentItems.filter(i => i.id !== product.id);

  function handleViewReviews() {
    setActiveTab("reviews");
    setTimeout(() => tabsRef.current?.scrollIntoView({ block: "start" }), 50);
  }

  return (
    <div className="bg-paper pb-24 lg:pb-0">
      <div className="lg:max-w-7xl lg:mx-auto lg:px-8 xl:px-12 lg:py-10">
        <div className="lg:grid lg:grid-cols-2 lg:gap-12 lg:items-start">
          <ProductGallery product={product} isPreOrder={isPreOrder} />

          <div className="px-5 py-6 lg:px-0 lg:py-0 lg:sticky lg:top-24">
            <ProductInfo product={product} reviews={reviews} isPreOrder={isPreOrder} onViewReviews={handleViewReviews} />

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
              paymentType={paymentType}
              setPaymentType={setPaymentType}
            />

            <ProductTabs
              containerRef={tabsRef}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              reviews={reviews}
              settings={settings}
              isPreOrder={isPreOrder}
            />
          </div>
        </div>

        {/* Recently Viewed */}
        {otherRecentItems.length > 0 && (
          <div className="px-5 md:px-8 lg:px-0 mt-12 pt-10 border-t border-line">
            <p className="text-eyebrow text-ink-3 mb-5">Recently viewed</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {otherRecentItems.slice(0, 4).map(item => (
                <Link key={item.id} href={`/shop/${item.slug}`} className="group block">
                  <div className="relative aspect-square mb-2 overflow-hidden rounded-md bg-paper-2" style={{ background: item.bg || undefined }}>
                    {item.images[0] ? (
                      <Image src={item.images[0]} alt={item.name} fill className="object-cover transition-transform duration-slow ease-smooth group-hover:scale-[1.02]" sizes="(max-width: 640px) 50vw, 25vw" />
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center font-display text-ink opacity-5 text-[2rem]">
                        {item.brand.charAt(0)}
                      </span>
                    )}
                  </div>
                  <p className="text-eyebrow text-ink-3 mb-0.5">{item.brand}</p>
                  <p className="text-body-sm text-ink leading-snug">{item.name}</p>
                  <p className="text-body-sm font-medium mt-0.5 text-ink">₱{item.price.toLocaleString()}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

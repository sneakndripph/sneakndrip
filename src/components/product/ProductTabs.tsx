"use client";

import type { RefObject, Dispatch, SetStateAction } from "react";
import type { Product, Review } from "@/lib/types";
import ProductReviews from "./ProductReviews";

const TABS = ["details", "shipping", "auth", "reviews"] as const;
type Tab = (typeof TABS)[number];

export default function ProductTabs({
  containerRef,
  activeTab,
  setActiveTab,
  product,
  reviews,
  settings,
  isPreOrder,
}: {
  containerRef: RefObject<HTMLDivElement | null>;
  activeTab: Tab;
  setActiveTab: Dispatch<SetStateAction<Tab>>;
  product: Product;
  reviews: Review[];
  settings: Record<string, string>;
  isPreOrder: boolean;
}) {
  const metroFee = settings.metro_shipping_fee || "150";
  const provFee = settings.provincial_shipping_fee || "250";
  const freeThreshold = settings.free_shipping_threshold || "5000";

  return (
    <div ref={containerRef} className="border-t border-snd-border">
      <div className="flex gap-0 -mb-px overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-bold tracking-wide whitespace-nowrap transition-colors border-b-2 ${
              activeTab === tab ? "border-snd-teal text-snd-teal" : "border-transparent text-snd-muted"
            }`}
          >
            {tab === "auth" ? "Authenticity" : tab === "reviews" ? `Reviews (${reviews.length})` : tab}
          </button>
        ))}
      </div>
      <div className="py-5 text-sm leading-relaxed text-snd-muted">
        {activeTab === "details" && <p>{product.description || "Premium authentic sneakers from verified suppliers."}</p>}
        {activeTab === "shipping" && (
          <ul className="space-y-2">
            <li>• Metro Manila: 1–3 business days (&#8369;{Number(metroFee).toLocaleString()})</li>
            <li>• Provincial: 3–7 business days (&#8369;{Number(provFee).toLocaleString()})</li>
            <li>• Free shipping on orders &#8369;{Number(freeThreshold).toLocaleString()}+</li>
            <li>• All orders come with a tracking number</li>
            {isPreOrder && (
              <li className="font-semibold text-[#D97706]">• Pre-orders are final sale — no returns, size changes, or change of mind once order is placed.</li>
            )}
          </ul>
        )}
        {activeTab === "auth" && (
          <ul className="space-y-2">
            <li>• Every pair sourced from verified authentic suppliers</li>
            <li>• No replicas, fakes, or unauthorized items ever</li>
            <li>• Legit check available upon request</li>
            <li>• Full refund if authenticity is ever in question</li>
          </ul>
        )}
        {activeTab === "reviews" && <ProductReviews reviews={reviews} />}
      </div>
    </div>
  );
}

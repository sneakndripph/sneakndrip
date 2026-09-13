"use client";

import type { RefObject, Dispatch, SetStateAction } from "react";
import type { Product, Review } from "@/lib/types";
import ProductReviews from "./ProductReviews";

const TABS = ["description", "reviews"] as const;
type Tab = (typeof TABS)[number];

export default function ProductTabs({
  containerRef,
  activeTab,
  setActiveTab,
  product,
  reviews,
}: {
  containerRef: RefObject<HTMLDivElement | null>;
  activeTab: Tab;
  setActiveTab: Dispatch<SetStateAction<Tab>>;
  product: Product;
  reviews: Review[];
}) {
  const description = product.description?.trim();

  return (
    <div ref={containerRef} className="border-t border-line">
      <div className="flex gap-0 -mb-px overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-body-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
              activeTab === tab ? "border-ink text-ink" : "border-transparent text-ink-3 hover:text-ink"
            }`}
          >
            {tab === "reviews" ? `Reviews (${reviews.length})` : "Description"}
          </button>
        ))}
      </div>
      <div className="py-5 text-body-sm leading-relaxed text-ink-2">
        {activeTab === "description" && (
          <p className="whitespace-pre-line">{description || "No description available."}</p>
        )}
        {activeTab === "reviews" && <ProductReviews reviews={reviews} />}
      </div>
    </div>
  );
}

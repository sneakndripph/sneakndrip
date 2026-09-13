"use client";

import type { RefObject, Dispatch, SetStateAction } from "react";
import type { Product, Review } from "@/lib/types";
import ProductReviews from "./ProductReviews";

const TABS = ["description", "sizing", "reviews"] as const;
type Tab = (typeof TABS)[number];

type SizeGuide = { label: string; note: string; rows: string[][] };

const NIKE_ROWS: string[][] = [
  ["US 4","36","3.5","22"],["US 4.5","36.5","4","22.5"],["US 5","37.5","4.5","23"],
  ["US 5.5","38","5","23.5"],["US 6","38.5","5.5","24"],["US 6.5","39","6","24.5"],
  ["US 7","40","6","25"],["US 7.5","40.5","6.5","25.5"],["US 8","41","7","26"],
  ["US 8.5","42","7.5","26.5"],["US 9","42.5","8","27"],["US 9.5","43","8.5","27.5"],
  ["US 10","44","9","28"],["US 10.5","44.5","9.5","28.5"],["US 11","45","10","29"],
  ["US 11.5","45.5","10.5","29.5"],["US 12","46","11","30"],["US 13","47.5","12","31"],
  ["US 14","48.5","13","32"],["US 15","49.5","14","33"],
];

const ADIDAS_ROWS: string[][] = [
  ["US 4","36","3.5","22.5"],["US 4.5","36.5","4","23"],["US 5","37","4.5","23.5"],
  ["US 5.5","38","5","23.5"],["US 6","38.5","5.5","24"],["US 6.5","39","6","24.5"],
  ["US 7","40","6.5","25"],["US 7.5","40.5","7","25.5"],["US 8","41","7.5","26"],
  ["US 8.5","42","8","26.5"],["US 9","42.5","8.5","27"],["US 9.5","43","9","27.5"],
  ["US 10","44","9.5","28"],["US 10.5","44.5","10","28.5"],["US 11","45","10.5","29"],
  ["US 11.5","45.5","11","29.5"],["US 12","46","11.5","30"],["US 13","47.5","12.5","31"],
  ["US 14","48","13.5","32"],
];

const VANS_ROWS: string[][] = [
  ["US 3.5","35","3","22"],["US 4","36","3.5","22.5"],["US 4.5","36.5","4","23"],
  ["US 5","37","4.5","23"],["US 5.5","38","5","23.5"],["US 6","38.5","5.5","24"],
  ["US 6.5","39","6","24.5"],["US 7","40","6.5","25"],["US 7.5","40.5","7","25.5"],
  ["US 8","41","7.5","26"],["US 8.5","42","8","26.5"],["US 9","42.5","8.5","27"],
  ["US 9.5","43","9","27.5"],["US 10","44","9.5","28"],["US 10.5","44.5","10","28.5"],
  ["US 11","45","10.5","29"],["US 12","46","11.5","30"],["US 13","47","12.5","31"],
];

function getSizeGuideData(brand: string): SizeGuide {
  const b = brand.toLowerCase();
  if (b.includes("adidas") || b.includes("yeezy")) {
    return { label: "Adidas / Yeezy", note: "Adidas generally fits true to size. If between sizes, go half size up.", rows: ADIDAS_ROWS };
  }
  if (b.includes("vans")) {
    return { label: "Vans", note: "Vans fits true to size. Slip-ons run half a size large — consider sizing down.", rows: VANS_ROWS };
  }
  if (b.includes("converse")) {
    return { label: "Converse", note: "Converse runs 1–1.5 sizes large. We recommend going 1 size down from your usual US size.", rows: NIKE_ROWS };
  }
  if (b.includes("new balance")) {
    return { label: "New Balance", note: "New Balance fits true to size. Wide widths available — check product details.", rows: NIKE_ROWS };
  }
  return { label: `Nike / Jordan / ${brand}`, note: "Nike and Jordan sizes run true to size. If between sizes, go half size up.", rows: NIKE_ROWS };
}

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
  const sizeGuide = getSizeGuideData(product.brand);

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
            {tab === "reviews" ? `Reviews (${reviews.length})` : tab === "sizing" ? "Sizing" : "Description"}
          </button>
        ))}
      </div>
      <div className="py-5 text-body-sm leading-relaxed text-ink-2">
        {activeTab === "description" && (
          <p className="whitespace-pre-line">{description || "No description available."}</p>
        )}
        {activeTab === "sizing" && (
          <div>
            <p className="text-micro mb-3 text-ink-3">{sizeGuide.label} · All sizes in US (men&apos;s)</p>
            <p className="text-micro mb-4 text-ink-3">{sizeGuide.note}</p>
            <div className="overflow-x-auto rounded-md border border-line">
              <table className="w-full text-micro">
                <thead>
                  <tr className="bg-paper-2">
                    {["US", "EU", "UK", "CM"].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left font-medium uppercase tracking-wider text-ink-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sizeGuide.rows.map((row, i) => (
                    <tr key={row[0]} className={`border-t border-line ${i % 2 === 0 ? "bg-paper" : "bg-paper-2"}`}>
                      {row.map((cell, j) => (
                        <td key={j} className={`px-3 py-2.5 ${j === 0 ? "text-ink font-medium" : "text-ink-2"}`}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {activeTab === "reviews" && <ProductReviews reviews={reviews} />}
      </div>
    </div>
  );
}

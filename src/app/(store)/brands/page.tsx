import Link from "next/link";
import { BRAND, FONTS, BRANDS } from "@/lib/constants";
import { getProducts } from "@/lib/supabase/products";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop by Brand — Sneak N' Drip",
  description: "Browse authentic sneakers by brand. Nike, Jordan, Adidas, New Balance and more.",
};

const BRAND_ICONS: Record<string, string> = {
  Nike: "✔",
  Jordan: "✈",
  Adidas: "◈",
  "New Balance": "NB",
  Puma: "🐾",
  ASICS: "AS",
  Converse: "☆",
  Vans: "V",
  Reebok: "R",
  Salomon: "S",
  "On Running": "ON",
  Hoka: "H",
};

export default async function BrandsPage() {
  const products = await getProducts();

  const brandCounts = BRANDS.reduce((acc, b) => {
    acc[b] = products.filter(p => p.brand === b).length;
    return acc;
  }, {} as Record<string, number>);

  const brandsWithProducts = BRANDS.filter(b => brandCounts[b] > 0);
  const brandsEmpty = BRANDS.filter(b => brandCounts[b] === 0);
  const sortedBrands = [...brandsWithProducts, ...brandsEmpty];

  return (
    <div style={{ background: BRAND.bg, fontFamily: FONTS.body, minHeight: "80vh" }}>
      {/* Header */}
      <div className="py-12 px-4 text-center" style={{ background: BRAND.card, borderBottom: `1px solid ${BRAND.border}` }}>
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: BRAND.teal }}>
          Shop by Brand
        </p>
        <h1 style={{ fontFamily: FONTS.display, fontSize: "3.5rem", letterSpacing: "0.04em", color: BRAND.black }}>
          ALL BRANDS
        </h1>
        <p className="text-sm mt-2" style={{ color: BRAND.muted }}>
          {brandsWithProducts.length} brands available
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {sortedBrands.map(b => {
            const count = brandCounts[b];
            const isEmpty = count === 0;
            return (
              <Link
                key={b}
                href={`/shop?brand=${encodeURIComponent(b)}`}
                className={`group flex flex-col items-center justify-center p-8 rounded-xl text-center transition-all ${isEmpty ? "pointer-events-none opacity-40" : "hover:shadow-md"}`}
                style={{
                  background: BRAND.card,
                  border: `1.5px solid ${BRAND.cardBorder}`,
                }}
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-4 text-xl font-black transition-transform group-hover:scale-110"
                  style={{ background: `${BRAND.teal}15`, color: BRAND.teal }}
                >
                  {BRAND_ICONS[b] ?? b.charAt(0)}
                </div>
                <p className="font-black text-sm uppercase tracking-wide mb-1" style={{ color: BRAND.black }}>
                  {b}
                </p>
                <p className="text-xs" style={{ color: BRAND.muted }}>
                  {isEmpty ? "Coming soon" : `${count} pair${count === 1 ? "" : "s"}`}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

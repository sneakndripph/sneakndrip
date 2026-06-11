import Link from "next/link";
import { BRAND, FONTS, BRANDS } from "@/lib/constants";
import { getProducts } from "@/lib/supabase/products";
import BrandLogo from "@/components/brands/BrandLogo";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop by Brand — Sneak N' Drip",
  description: "Browse authentic sneakers by brand. Nike, Jordan, Adidas, New Balance and more.",
};

const BRAND_COLORS: Record<string, string> = {
  Nike: "#111111",
  Jordan: "#C8102E",
  Adidas: "#000000",
  "New Balance": "#CF4520",
  Puma: "#1A1A1A",
  ASICS: "#1A6DB5",
  Converse: "#D93025",
  Vans: "#E03030",
  Reebok: "#CC0000",
  Salomon: "#FF7000",
  "On Running": "#1A1A1A",
  Hoka: "#1C3968",
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
            const brandColor = BRAND_COLORS[b] ?? BRAND.black;
            return (
              <Link
                key={b}
                href={`/shop?brand=${encodeURIComponent(b)}`}
                className={`group flex flex-col items-center justify-center p-8 rounded-xl text-center transition-all ${isEmpty ? "pointer-events-none opacity-40" : "hover:shadow-lg"}`}
                style={{
                  background: BRAND.card,
                  border: `1.5px solid ${BRAND.cardBorder}`,
                }}
              >
                {/* Logo area */}
                <div
                  className="flex items-center justify-center mb-5 transition-transform group-hover:scale-105"
                  style={{
                    width: 80,
                    height: 60,
                    borderRadius: 12,
                    background: isEmpty ? `${BRAND.border}` : `${brandColor}10`,
                    color: isEmpty ? BRAND.muted : brandColor,
                  }}
                >
                  <BrandLogo brand={b} color={brandColor} size={28} />
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

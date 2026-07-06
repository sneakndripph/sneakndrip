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
      <div className="py-14" style={{ borderBottom: `1px solid ${BRAND.border}` }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <p className="snd-label mb-4" style={{ color: BRAND.teal, fontFamily: FONTS.body }}>
            Shop by Brand
          </p>
          <div className="flex items-end justify-between">
            <h1 style={{ fontFamily: FONTS.display, fontSize: "var(--text-display-md)", letterSpacing: "0.04em", color: BRAND.black, lineHeight: 1 }}>
              ALL BRANDS
            </h1>
            <p className="snd-label pb-1" style={{ color: BRAND.mutedLight, fontFamily: FONTS.body }}>
              {brandsWithProducts.length} brands
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-14">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {sortedBrands.map(b => {
            const count = brandCounts[b];
            const isEmpty = count === 0;
            const brandColor = BRAND_COLORS[b] ?? BRAND.black;
            return (
              <Link
                key={b}
                href={`/shop?brand=${encodeURIComponent(b)}`}
                className={`brand-card-hover flex flex-col items-center justify-center p-8 text-center ${isEmpty ? "pointer-events-none opacity-30" : ""}`}
                style={{
                  background: BRAND.card,
                  border: `1px solid ${BRAND.border}`,
                }}
              >
                {/* Logo area */}
                <div
                  className="flex items-center justify-center mb-5"
                  style={{
                    width: 80,
                    height: 56,
                    background: isEmpty ? "rgba(13,13,13,0.04)" : `${brandColor}10`,
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

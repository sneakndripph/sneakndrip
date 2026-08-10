import type { Metadata } from "next";
import Link from "next/link";
import ProductCard from "@/components/product/ProductCard";
import HomeClient from "@/components/home/HomeClient";
import HomeReviews from "@/components/home/HomeReviews";
import HeroProductImage from "@/components/product/HeroProductImage";
import { getProducts, getReviews, getSettings } from "@/lib/supabase/products";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sneak N' Drip — Authentic Sneakers Philippines",
  description: "100% Authentic Sneakers. On Hand & Pre-Order. Shop the latest Nike, Jordan, Adidas, and more at below-SRP prices. Ships nationwide.",
  openGraph: {
    title: "Sneak N' Drip — Authentic Sneakers Philippines",
    description: "100% Authentic Sneakers. On Hand & Pre-Order. Philippines-wide shipping.",
    type: "website",
  },
};

const HERO_DEFAULTS = {
  hero_badge: "This week from Harajuku",
  hero_line1: "Nike P-6000",
  hero_line2: "'Bini'",
  hero_line3: "is on the floor",
  hero_subtitle: "Sourced last Tuesday. Below SRP.\nThree sizes remaining.",
  hero_cta_primary: "Shop the drop",
  hero_cta_secondary: "Journal entry",
};

export default async function HomePage() {
  const [products, reviews, settings] = await Promise.all([getProducts(), getReviews(), getSettings()]);
  const inStock = (p: (typeof products)[number]) => p.sizes.some(s => s.stock > 0);
  const newArrivals = [...products]
    .filter(inStock)
    .sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())
    .slice(0, 8);
  const trending = products.filter(p => p.is_trending && inStock(p)).slice(0, 4);
  const featured = products.find(p => p.is_featured && p.status === "on-hand") ?? products[0];
  const productSlugMap = new Map(products.map(p => [p.id, p.slug]));

  const hero = {
    badge: settings.hero_badge || HERO_DEFAULTS.hero_badge,
    line1: settings.hero_line1 || HERO_DEFAULTS.hero_line1,
    line2: settings.hero_line2 || HERO_DEFAULTS.hero_line2,
    line3: settings.hero_line3 || HERO_DEFAULTS.hero_line3,
    subtitle: (settings.hero_subtitle || HERO_DEFAULTS.hero_subtitle).split("\\n"),
    ctaPrimary: settings.hero_cta_primary || HERO_DEFAULTS.hero_cta_primary,
    ctaSecondary: settings.hero_cta_secondary || HERO_DEFAULTS.hero_cta_secondary,
  };

  return (
    <>
      {/* ── Hero — editorial split ───────────────────────────────────── */}
      <section className="bg-paper">
        <div className="max-w-7xl mx-auto px-5 md:px-8 lg:px-12 py-16 lg:py-24">
          <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16 lg:items-center">
            <div className="flex flex-col justify-center">
              <p className="text-eyebrow text-ink-3 mb-6">{hero.badge}</p>
              <h1 className="text-display lg:text-display-l text-ink font-display font-medium leading-[0.95] tracking-[-0.03em] mb-6">
                {hero.line1}<br />
                {hero.line2 && <>{hero.line2}<br /></>}
                {hero.line3}
              </h1>
              <p className="text-body-sm lg:text-body text-ink-2 max-w-md mb-8">
                {hero.subtitle[0]}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/shop"
                  className="inline-flex items-center justify-center bg-ink text-paper text-body-sm font-medium px-6 py-3 rounded-md hover:bg-ink-2 transition-colors duration-fast active:scale-[0.98]"
                >
                  {hero.ctaPrimary}
                </Link>
                <Link
                  href="/authenticity"
                  className="inline-flex items-center justify-center bg-transparent text-ink border border-ink text-body-sm font-medium px-6 py-3 rounded-md hover:bg-ink hover:text-paper transition-colors duration-fast"
                >
                  {hero.ctaSecondary}
                </Link>
              </div>
            </div>

            {featured && (
              <div className="bg-paper-2 aspect-square rounded-md overflow-hidden flex items-center justify-center relative">
                <HeroProductImage product={featured} />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Editorial context bar ────────────────────────────────────── */}
      <div className="bg-paper border-y border-line">
        <div className="max-w-7xl mx-auto px-5 md:px-8 lg:px-12 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3 text-micro text-ink-3">
            <span>Sourced weekly — Tokyo, Seoul, Hong Kong</span>
            <span className="hidden md:inline">Every pair verified on the floor</span>
            <span>Ships nationwide from Rizal</span>
          </div>
        </div>
      </div>

      {/* ── New This Week ────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-5 md:px-8 lg:px-12 py-16 lg:py-24">
        <div className="flex items-end justify-between mb-8 lg:mb-12">
          <div>
            <p className="text-eyebrow text-ink-3 mb-2">New this week</p>
            <h2 className="text-display-s lg:text-display text-ink font-display font-medium leading-tight tracking-[-0.02em]">
              Just landed
            </h2>
          </div>
          <Link href="/shop?sort=newest" className="text-micro text-ink-3 hover:text-ink transition-colors">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
          {newArrivals.map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* ── From The Buying Floor ────────────────────────────────────── */}
      <section className="bg-paper-2">
        <div className="max-w-7xl mx-auto px-5 md:px-8 lg:px-12 py-16 lg:py-24">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16 lg:items-center">
            <div className="relative aspect-[4/5] bg-paper-3 rounded-md overflow-hidden order-2 lg:order-1">
              <div className="absolute inset-0 flex items-center justify-center text-ink-3 text-eyebrow">
                Founder photo — Harajuku 2026
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <p className="text-eyebrow text-ink-3 mb-4">From the buying floor</p>
              <h2 className="text-display-s lg:text-display text-ink font-display font-medium leading-[1.1] tracking-[-0.02em] mb-6 max-w-lg">
                Every pair picked in person.
              </h2>
              <p className="text-body-sm lg:text-body text-ink-2 leading-relaxed max-w-md mb-3">
                This week&apos;s pickups came from four days walking Harajuku, Shinjuku, and Shibuya.
              </p>
              <p className="text-body-sm text-ink-2 leading-relaxed max-w-md mb-8">
                Every pair verified in person. Boxes checked, receipts kept, photos on file. That&apos;s the only way we source.
              </p>
              <p className="text-micro italic text-ink-3 mb-8">— Juls, founder</p>
              <Link href="/authenticity" className="text-eyebrow text-ink border-b border-ink pb-1 hover:opacity-60 transition-opacity">
                Our verification process →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trending ──────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-5 md:px-8 lg:px-12 py-16 lg:py-24 border-t border-line">
        <div className="flex items-end justify-between mb-8 lg:mb-12">
          <div>
            <p className="text-eyebrow text-ink-3 mb-2">Trending</p>
            <h2 className="text-display-s lg:text-display text-ink font-display font-medium leading-tight tracking-[-0.02em]">
              What&apos;s moving
            </h2>
          </div>
          <Link href="/shop?filter=trending" className="text-micro text-ink-3 hover:text-ink transition-colors">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
          {trending.map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* ── Reviews ───────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-5 md:px-8 lg:px-12 py-16 lg:py-24 border-t border-line">
        <div className="mb-8 lg:mb-12">
          <p className="text-eyebrow text-ink-3 mb-2">Real buyers</p>
          <h2 className="text-display-s lg:text-display text-ink font-display font-medium leading-tight tracking-[-0.02em]">
            What they&apos;re saying
          </h2>
        </div>

        <HomeReviews reviews={reviews} productSlugMap={productSlugMap} />
      </section>

      {/* ── Newsletter ────────────────────────────────────────────────── */}
      <HomeClient />
    </>
  );
}

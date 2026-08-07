import type { Metadata } from "next";
import Link from "next/link";
import { BRANDS } from "@/lib/constants";
import ProductCard from "@/components/product/ProductCard";
import HomeClient from "@/components/home/HomeClient";
import HomeReviews from "@/components/home/HomeReviews";
import HeroAddToCart from "@/components/product/HeroAddToCart";
import HeroProductImage from "@/components/product/HeroProductImage";

export const dynamic = "force-dynamic";
import { getProducts, getReviews, getSettings } from "@/lib/supabase/products";

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
  hero_badge: "New Drops Every Week",
  hero_line1: "STEP INTO",
  hero_line2: "YOUR NEXT",
  hero_line3: "PAIR",
  hero_subtitle: "100% Authentic Sneakers · On Hand & Pre-Order\nShips Philippines-wide. GCash, Maya, Bank Transfer & COD accepted.",
  hero_cta_primary: "Shop Now",
  hero_cta_secondary: "Pre-Orders",
};

export default async function HomePage() {
  const [products, reviews, settings] = await Promise.all([getProducts(), getReviews(), getSettings()]);
  const newArrivals = [...products]
    .sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())
    .slice(0, 5);
  const onHand = products.filter(p => p.status === "on-hand").slice(0, 6);
  const trending = products.filter(p => p.is_trending).slice(0, 4);
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
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden flex items-center bg-snd-bg min-h-[94vh]">
        {/* Tonal grain — very subtle */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              radial-gradient(ellipse 80% 60% at 70% 50%, #5BB8B408 0%, transparent 70%),
              radial-gradient(ellipse 40% 40% at 10% 80%, #0D0D0D04 0%, transparent 60%)
            `,
          }}
        />

        <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 w-full py-24">
          <div className="grid lg:grid-cols-[1fr_420px] gap-20 items-center">

            {/* Left — editorial text */}
            <div>
              <div className="snd-label inline-block mb-10 text-snd-teal">
                {hero.badge}
              </div>

              <h1
                className="font-heading text-snd-black leading-[0.92] tracking-[0.02em]"
                style={{ fontSize: "var(--text-display-xl)" }}
              >
                {hero.line1}
                <span className="block text-snd-teal">{hero.line2}</span>
                <span className="block">{hero.line3}</span>
              </h1>

              <p className="mt-8 text-lg leading-relaxed max-w-lg text-snd-muted">
                {hero.subtitle[0]}
                {hero.subtitle[1] && (
                  <>
                    <br />
                    <span className="text-sm mt-1 block text-snd-muted-lt">
                      {hero.subtitle[1]}
                    </span>
                  </>
                )}
              </p>

              <div className="flex flex-wrap gap-3 mt-10">
                <Link
                  href="/shop"
                  className="font-bold text-sm px-10 py-4 transition-opacity hover:opacity-85 active:scale-[0.98] uppercase tracking-widest bg-snd-black text-snd-bg"
                >
                  {hero.ctaPrimary}
                </Link>
                <Link
                  href="/shop?filter=pre-order"
                  className="font-bold text-sm px-10 py-4 transition-opacity hover:opacity-70 uppercase tracking-widest border-[1.5px] border-snd-black text-snd-black bg-transparent"
                >
                  {hero.ctaSecondary}
                </Link>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-8 sm:gap-12 mt-16 pt-12 border-t border-snd-border">
                {[
                  ["Since 2020", "Trusted Shop"],
                  ["1,900+", "Verified Reviews"],
                  ["4.9 ★", "Shopee Rating"],
                ].map(([v, l]) => (
                  <div key={l}>
                    <p className="font-heading tracking-[0.03em] text-snd-black leading-none text-[2.4rem]">
                      {v}
                    </p>
                    <p className="snd-label mt-1.5 text-snd-muted-lt">
                      {l}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — featured product */}
            {featured && (
              <div className="hidden lg:block">
                <div
                  className="overflow-hidden bg-snd-card border border-snd-border"
                  style={{ boxShadow: "var(--shadow-xl)" }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-snd-border">
                    <span className="snd-label px-2.5 py-1 bg-snd-teal/[8%] text-snd-teal">
                      On Hand
                    </span>
                    <span className="text-xs font-semibold text-snd-muted">
                      {featured.brand}
                    </span>
                  </div>

                  {/* Product image */}
                  <div
                    className="aspect-square mx-5 mt-4 mb-3 overflow-hidden relative"
                    style={{ background: featured.bg || "#F2F0EF" }}
                  >
                    <HeroProductImage product={featured} />
                  </div>

                  {/* Info + Add to Cart */}
                  <HeroAddToCart product={featured} />
                </div>

                {/* Below SRP badge */}
                <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-snd-red">
                  <span className="font-heading text-white tracking-[0.12em] text-[0.8rem]">
                    BELOW SRP
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Editorial context bar ────────────────────────────────────── */}
      <div className="border-y border-snd-border bg-snd-bg">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-snd-muted tracking-[0.08em] uppercase">
            <span>Sourced weekly — Tokyo, Seoul, Hong Kong</span>
            <span>Every pair verified on the floor</span>
            <span className="hidden md:inline">Ships nationwide from Rizal</span>
          </div>
        </div>
      </div>

      {/* ── Brand Strip ────────────────────────────────────────────────── */}
      <div className="border-y border-snd-border bg-snd-bg">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-5 overflow-x-auto">
          <div className="flex items-center gap-8 min-w-max sm:min-w-0 sm:justify-between flex-nowrap sm:flex-wrap">
            {BRANDS.map(b => (
              <Link
                key={b}
                href={`/shop?brand=${b}`}
                className="snd-label whitespace-nowrap text-snd-muted-lt hover:text-snd-black transition-colors"
                style={{ letterSpacing: "0.14em" }}
              >
                {b}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── New Arrivals ───────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 snd-section">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="snd-label mb-3 text-snd-muted-lt">
              Just Landed
            </p>
            <h2 className="font-heading tracking-[0.04em] text-snd-black leading-none text-[length:var(--text-display-md)]">
              NEW ARRIVALS
            </h2>
          </div>
          <Link
            href="/shop?sort=newest"
            className="text-sm font-semibold transition-opacity hover:opacity-60 pb-1 text-snd-muted"
          >
            View All →
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-5">
          {newArrivals.map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* ── Divider ────────────────────────────────────────────────────── */}
      <div className="h-px bg-snd-border" />

      {/* ── On Hand ────────────────────────────────────────────────────── */}
      {onHand.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 snd-section">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="snd-label mb-3 text-snd-teal">
                Ships Immediately
              </p>
              <h2 className="font-heading tracking-[0.04em] text-snd-black leading-none text-[length:var(--text-display-md)]">
                ON HAND
              </h2>
            </div>
            <Link
              href="/shop?filter=on-hand"
              className="text-sm font-semibold transition-opacity hover:opacity-60 pb-1 text-snd-muted"
            >
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
            {onHand.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* ── Pre-Order Banner ───────────────────────────────────────────── */}
      <section className="bg-snd-black">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 snd-section">
          <div className="grid md:grid-cols-2 gap-16 items-center">

            <div>
              <p className="snd-label mb-5 text-snd-teal">
                Flexible Payment
              </p>
              <h2 className="font-heading tracking-[0.03em] leading-[0.95] text-snd-bg text-[length:var(--text-display-md)]">
                PRE-ORDER &<br />PAY LATER
              </h2>
              <p className="text-sm leading-relaxed mt-6 mb-10 max-w-sm text-white/40">
                Reserve your pair before it sells out. Pay a downpayment now — settle the balance when it arrives. ETA dates always provided.
              </p>

              <div className="flex flex-wrap gap-6 sm:gap-8 mb-10">
                {[
                  { label: "SRP",          price: "₱10,295", dim: true },
                  { label: "Downpayment",  price: "₱9,490",  color: "#5BB8B4" },
                  { label: "Full Payment", price: "₱9,000",  color: "#D94F3D" },
                ].map(t => (
                  <div key={t.label}>
                    <p
                      className="font-heading tracking-[0.02em] leading-none text-[1.6rem]"
                      style={{ color: t.color ?? "#444", textDecoration: t.dim ? "line-through" : "none" }}
                    >
                      {t.price}
                    </p>
                    <p className="snd-label mt-1.5 text-[#444]">
                      {t.label}
                    </p>
                  </div>
                ))}
              </div>

              <Link
                href="/shop?filter=pre-order"
                className="inline-block px-8 py-4 text-sm font-bold uppercase tracking-widest transition-opacity hover:opacity-80 bg-snd-teal text-snd-black"
              >
                Browse Pre-Orders
              </Link>
            </div>

            {/* Steps */}
            <div>
              {[
                { n: "01", t: "Browse available pre-orders" },
                { n: "02", t: "Leave a downpayment via GCash or Bank Transfer" },
                { n: "03", t: "Upload your proof of payment" },
                { n: "04", t: "Receive confirmation + ETA notification" },
              ].map(({ n, t }, i, arr) => (
                <div
                  key={n}
                  className={`flex items-center gap-5 py-5 ${i < arr.length - 1 ? "border-b border-white/6" : ""}`}
                >
                  <span className="font-heading tracking-[0.04em] text-snd-teal shrink-0 text-[1.2rem]">
                    {n}
                  </span>
                  <span className="text-sm leading-relaxed text-white/[53%]">
                    {t}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Trending ─────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 snd-section">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="snd-label mb-3 text-snd-muted-lt">
              This Week
            </p>
            <h2 className="font-heading tracking-[0.04em] text-snd-black leading-none text-[length:var(--text-display-md)]">
              TRENDING
            </h2>
          </div>
          <Link
            href="/shop?filter=trending"
            className="text-sm font-semibold transition-opacity hover:opacity-60 pb-1 text-snd-muted"
          >
            View All →
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
          {trending.map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* ── From The Buying Floor ────────────────────────────────────── */}
      <section className="bg-snd-bg">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 snd-section">
          <div className="grid lg:grid-cols-[1fr_1.5fr] gap-16 items-center">
            <div className="relative aspect-[4/5] bg-snd-card">
              {/* Founder photo placeholder — replace src with real photo later */}
              <div className="absolute inset-0 flex items-center justify-center text-snd-muted-lt text-xs tracking-[0.14em] uppercase">
                [ Founder photo — Harajuku, 2026 ]
              </div>
            </div>
            <div>
              <p className="snd-label mb-6 text-snd-teal">From the buying floor</p>
              <h2
                className="font-heading text-snd-black leading-[0.95] tracking-[0.02em]"
                style={{ fontSize: "var(--text-display-lg)" }}
              >
                EVERY PAIR<br />PICKED<br />IN PERSON.
              </h2>
              <p className="mt-8 text-base leading-relaxed text-snd-muted max-w-md">
                This week&apos;s pickups came from four days walking Harajuku, Shinjuku,
                and Shibuya. Every pair verified before it left the shelf — boxes
                checked, receipts kept, photos on file.
              </p>
              <p className="mt-2 text-sm text-snd-muted-lt italic">— Juls, founder</p>
              <Link
                href="/authenticity"
                className="inline-block mt-10 snd-label text-snd-teal border-b border-snd-teal pb-1 hover:opacity-60 transition-opacity"
              >
                Our Process →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Customer Reviews ───────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 snd-section">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="snd-label mb-3 text-snd-muted-lt">
              Real Buyers
            </p>
            <h2 className="font-heading tracking-[0.04em] text-snd-black leading-none text-[length:var(--text-display-md)]">
              WHAT THEY&apos;RE SAYING
            </h2>
          </div>
        </div>

        <HomeReviews reviews={reviews} productSlugMap={productSlugMap} />
      </section>

      {/* ── Newsletter ─────────────────────────────────────────────────── */}
      <HomeClient />
    </>
  );
}

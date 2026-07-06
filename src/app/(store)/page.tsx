import type { Metadata } from "next";
import Link from "next/link";
import { BRAND, FONTS, BRANDS } from "@/lib/constants";
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

const PROMISE_DEFAULTS = [
  { title: "100% Authentic", desc: "Every pair is verified authentic. Sourced directly from trusted local and international suppliers. No reps, no fakes — ever." },
  { title: "Verified Supplier", desc: "We work only with verified and trusted sneaker suppliers. Our reputation is built on authenticity." },
  { title: "Secure Checkout", desc: "GCash, Maya, Bank Transfer, and Cash on Delivery. All payments are safe, fast, and easy." },
  { title: "Fast Shipping", desc: "Metro Manila: 1–3 days. Provincial: 3–7 days. All orders come with tracking." },
  { title: "Pre-Order ETA", desc: "Every pre-order comes with a firm ETA. We update you every step of the way." },
  { title: "24/7 Support", desc: "Message us on Facebook or Instagram anytime. Real, fast, friendly replies — always." },
];

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

  const promises = PROMISE_DEFAULTS.map((def, i) => ({
    title: settings[`promise_${i + 1}_title`] || def.title,
    desc:  settings[`promise_${i + 1}_desc`]  || def.desc,
  }));

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{ minHeight: "94vh", display: "flex", alignItems: "center", background: BRAND.bg }}
      >
        {/* Tonal grain — very subtle */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              radial-gradient(ellipse 80% 60% at 70% 50%, ${BRAND.teal}08 0%, transparent 70%),
              radial-gradient(ellipse 40% 40% at 10% 80%, ${BRAND.black}04 0%, transparent 60%)
            `,
          }}
        />

        <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 w-full py-24">
          <div className="grid lg:grid-cols-[1fr_420px] gap-20 items-center">

            {/* Left — editorial text */}
            <div>
              <div
                className="snd-label inline-block mb-10"
                style={{ color: BRAND.teal, fontFamily: FONTS.body }}
              >
                {hero.badge}
              </div>

              <h1
                style={{
                  fontFamily: FONTS.display,
                  fontSize: "var(--text-display-xl)",
                  lineHeight: 0.92,
                  letterSpacing: "0.02em",
                  color: BRAND.black,
                }}
              >
                {hero.line1}
                <span className="block" style={{ color: BRAND.teal }}>{hero.line2}</span>
                <span className="block">{hero.line3}</span>
              </h1>

              <p
                className="mt-8 text-lg leading-relaxed max-w-lg"
                style={{ color: BRAND.muted, fontFamily: FONTS.body }}
              >
                {hero.subtitle[0]}
                {hero.subtitle[1] && (
                  <>
                    <br />
                    <span className="text-sm mt-1 block" style={{ color: BRAND.mutedLight }}>
                      {hero.subtitle[1]}
                    </span>
                  </>
                )}
              </p>

              <div className="flex flex-wrap gap-3 mt-10">
                <Link
                  href="/shop"
                  className="font-bold text-sm px-10 py-4 transition-opacity hover:opacity-85 active:scale-[0.98] uppercase tracking-widest"
                  style={{ background: BRAND.black, color: BRAND.bg, fontFamily: FONTS.body }}
                >
                  {hero.ctaPrimary}
                </Link>
                <Link
                  href="/shop?filter=pre-order"
                  className="font-bold text-sm px-10 py-4 transition-opacity hover:opacity-70 uppercase tracking-widest"
                  style={{
                    border: `1.5px solid ${BRAND.black}`,
                    color: BRAND.black,
                    background: "transparent",
                    fontFamily: FONTS.body,
                  }}
                >
                  {hero.ctaSecondary}
                </Link>
              </div>

              {/* Stats */}
              <div
                className="flex flex-wrap gap-8 sm:gap-12 mt-16 pt-12"
                style={{ borderTop: `1px solid ${BRAND.border}` }}
              >
                {[["2,400+", "Pairs Sold"], ["100%", "Authentic"], ["1,800+", "Happy Buyers"]].map(([v, l]) => (
                  <div key={l}>
                    <p
                      style={{
                        fontFamily: FONTS.display,
                        fontSize: "2.4rem",
                        letterSpacing: "0.03em",
                        color: BRAND.black,
                        lineHeight: 1,
                      }}
                    >
                      {v}
                    </p>
                    <p
                      className="snd-label mt-1.5"
                      style={{ color: BRAND.mutedLight, fontFamily: FONTS.body }}
                    >
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
                  className="overflow-hidden"
                  style={{
                    background: BRAND.card,
                    border: `1px solid ${BRAND.border}`,
                    boxShadow: "var(--shadow-xl)",
                  }}
                >
                  {/* Header */}
                  <div
                    className="flex items-center justify-between px-5 pt-5 pb-3"
                    style={{ borderBottom: `1px solid ${BRAND.border}` }}
                  >
                    <span
                      className="snd-label px-2.5 py-1"
                      style={{ background: `${BRAND.teal}14`, color: BRAND.teal, fontFamily: FONTS.body }}
                    >
                      On Hand
                    </span>
                    <span
                      className="text-xs font-semibold"
                      style={{ color: BRAND.muted, fontFamily: FONTS.body }}
                    >
                      {featured.brand}
                    </span>
                  </div>

                  {/* Product image */}
                  <div
                    className="aspect-square mx-5 mt-4 mb-3 overflow-hidden relative"
                    style={{ background: featured.bg || BRAND.bg }}
                  >
                    <HeroProductImage product={featured} />
                  </div>

                  {/* Info + Add to Cart */}
                  <HeroAddToCart product={featured} />
                </div>

                {/* Below SRP badge */}
                <div
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2"
                  style={{ background: BRAND.red }}
                >
                  <span
                    style={{
                      fontFamily: FONTS.display,
                      fontSize: "0.8rem",
                      color: "#fff",
                      letterSpacing: "0.12em",
                    }}
                  >
                    BELOW SRP
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Brand Strip ────────────────────────────────────────────────── */}
      <div
        style={{
          borderTop: `1px solid ${BRAND.border}`,
          borderBottom: `1px solid ${BRAND.border}`,
          background: BRAND.bg,
        }}
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-5 overflow-x-auto">
          <div className="flex items-center gap-8 min-w-max sm:min-w-0 sm:justify-between flex-nowrap sm:flex-wrap">
            {BRANDS.map(b => (
              <Link
                key={b}
                href={`/shop?brand=${b}`}
                className="brand-strip-link snd-label whitespace-nowrap"
                style={{ fontFamily: FONTS.body, letterSpacing: "0.14em" }}
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
            <p
              className="snd-label mb-3"
              style={{ color: BRAND.mutedLight, fontFamily: FONTS.body }}
            >
              Just Landed
            </p>
            <h2
              style={{
                fontFamily: FONTS.display,
                fontSize: "var(--text-display-md)",
                letterSpacing: "0.04em",
                color: BRAND.black,
                lineHeight: 1,
              }}
            >
              NEW ARRIVALS
            </h2>
          </div>
          <Link
            href="/shop?sort=newest"
            className="text-sm font-semibold transition-opacity hover:opacity-60 pb-1"
            style={{ color: BRAND.muted, fontFamily: FONTS.body }}
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
      <div style={{ height: "1px", background: BRAND.border }} />

      {/* ── On Hand ────────────────────────────────────────────────────── */}
      {onHand.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 snd-section">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p
                className="snd-label mb-3"
                style={{ color: BRAND.teal, fontFamily: FONTS.body }}
              >
                Ships Immediately
              </p>
              <h2
                style={{
                  fontFamily: FONTS.display,
                  fontSize: "var(--text-display-md)",
                  letterSpacing: "0.04em",
                  color: BRAND.black,
                  lineHeight: 1,
                }}
              >
                ON HAND
              </h2>
            </div>
            <Link
              href="/shop?filter=on-hand"
              className="text-sm font-semibold transition-opacity hover:opacity-60 pb-1"
              style={{ color: BRAND.muted, fontFamily: FONTS.body }}
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
      <section style={{ background: BRAND.black }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 snd-section">
          <div className="grid md:grid-cols-2 gap-16 items-center">

            <div>
              <p
                className="snd-label mb-5"
                style={{ color: BRAND.teal, fontFamily: FONTS.body }}
              >
                Flexible Payment
              </p>
              <h2
                style={{
                  fontFamily: FONTS.display,
                  fontSize: "var(--text-display-md)",
                  letterSpacing: "0.03em",
                  color: "#F2F0EF",
                  lineHeight: 0.95,
                }}
              >
                PRE-ORDER &<br />PAY LATER
              </h2>
              <p
                className="text-sm leading-relaxed mt-6 mb-10 max-w-sm"
                style={{ color: "#666", fontFamily: FONTS.body }}
              >
                Reserve your pair before it sells out. Pay a downpayment now — settle the balance when it arrives. ETA dates always provided.
              </p>

              <div className="flex flex-wrap gap-6 sm:gap-8 mb-10">
                {[
                  { label: "SRP",          price: "₱10,295", dim: true },
                  { label: "Downpayment",  price: "₱9,490",  color: BRAND.teal },
                  { label: "Full Payment", price: "₱9,000",  color: BRAND.red },
                ].map(t => (
                  <div key={t.label}>
                    <p
                      style={{
                        fontFamily: FONTS.display,
                        fontSize: "1.6rem",
                        color: t.color ?? "#444",
                        textDecoration: t.dim ? "line-through" : "none",
                        letterSpacing: "0.02em",
                        lineHeight: 1,
                      }}
                    >
                      {t.price}
                    </p>
                    <p
                      className="snd-label mt-1.5"
                      style={{ color: "#444", fontFamily: FONTS.body }}
                    >
                      {t.label}
                    </p>
                  </div>
                ))}
              </div>

              <Link
                href="/shop?filter=pre-order"
                className="inline-block px-8 py-4 text-sm font-bold uppercase tracking-widest transition-opacity hover:opacity-80"
                style={{ background: BRAND.teal, color: BRAND.black, fontFamily: FONTS.body }}
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
                  className="flex items-center gap-5 py-5"
                  style={{ borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}
                >
                  <span
                    style={{
                      fontFamily: FONTS.display,
                      fontSize: "1.2rem",
                      color: BRAND.teal,
                      flexShrink: 0,
                      letterSpacing: "0.04em",
                    }}
                  >
                    {n}
                  </span>
                  <span
                    className="text-sm leading-relaxed"
                    style={{ color: "#888", fontFamily: FONTS.body }}
                  >
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
            <p
              className="snd-label mb-3"
              style={{ color: BRAND.mutedLight, fontFamily: FONTS.body }}
            >
              This Week
            </p>
            <h2
              style={{
                fontFamily: FONTS.display,
                fontSize: "var(--text-display-md)",
                letterSpacing: "0.04em",
                color: BRAND.black,
                lineHeight: 1,
              }}
            >
              TRENDING
            </h2>
          </div>
          <Link
            href="/shop?filter=trending"
            className="text-sm font-semibold transition-opacity hover:opacity-60 pb-1"
            style={{ color: BRAND.muted, fontFamily: FONTS.body }}
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

      {/* ── Why Shop With Us ─────────────────────────────────────────── */}
      <section style={{ background: BRAND.black }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 snd-section">
          <div className="grid lg:grid-cols-2 gap-20 items-start">

            {/* Left */}
            <div className="lg:sticky lg:top-24">
              <p
                className="snd-label mb-6"
                style={{ color: BRAND.teal, fontFamily: FONTS.body }}
              >
                Our Promise
              </p>
              <h2
                style={{
                  fontFamily: FONTS.display,
                  fontSize: "var(--text-display-lg)",
                  lineHeight: 0.9,
                  letterSpacing: "0.02em",
                  color: "#F2F0EF",
                }}
              >
                ZERO<br />COMPROMISE<br /><span style={{ color: BRAND.teal }}>ON QUALITY.</span>
              </h2>
              <p
                className="mt-8 text-sm leading-relaxed"
                style={{ color: "#666", fontFamily: FONTS.body, maxWidth: "30ch" }}
              >
                Every pair we sell goes through the same process. Our reputation is built on authenticity — not promises.
              </p>
              <Link
                href="/authenticity"
                className="inline-block mt-8 text-sm font-bold uppercase tracking-widest transition-opacity hover:opacity-60"
                style={{ color: BRAND.teal, fontFamily: FONTS.body }}
              >
                Our Process →
              </Link>
            </div>

            {/* Right — numbered list */}
            <div>
              {promises.map((b, i) => (
                <div
                  key={b.title}
                  className="flex items-start gap-6 py-7"
                  style={{
                    borderBottom: i < promises.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
                  }}
                >
                  <span
                    className="snd-label pt-0.5 shrink-0"
                    style={{ color: "#333", fontFamily: FONTS.body, width: "1.5rem" }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1">
                    <p
                      className="text-sm font-bold mb-2"
                      style={{ color: "#E8E4DE", fontFamily: FONTS.body }}
                    >
                      {b.title}
                    </p>
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: "#666", fontFamily: FONTS.body }}
                    >
                      {b.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ── Customer Reviews ───────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 snd-section">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p
              className="snd-label mb-3"
              style={{ color: BRAND.mutedLight, fontFamily: FONTS.body }}
            >
              Real Buyers
            </p>
            <h2
              style={{
                fontFamily: FONTS.display,
                fontSize: "var(--text-display-md)",
                letterSpacing: "0.04em",
                color: BRAND.black,
                lineHeight: 1,
              }}
            >
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

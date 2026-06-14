import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { BRAND, FONTS, BRANDS } from "@/lib/constants";
import ProductCard from "@/components/product/ProductCard";
import HomeClient from "@/components/home/HomeClient";
import HeroAddToCart from "@/components/product/HeroAddToCart";

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
  { icon: "🔐", title: "100% Authentic", desc: "Every pair is verified authentic. Sourced directly from trusted local and international suppliers. No reps, no fakes — ever." },
  { icon: "✅", title: "Verified Supplier", desc: "We work only with verified and trusted sneaker suppliers. Our reputation is built on authenticity." },
  { icon: "🛡️", title: "Secure Checkout", desc: "GCash, Maya, Bank Transfer, and Cash on Delivery. All payments are safe, fast, and easy." },
  { icon: "📦", title: "Fast Shipping", desc: "Metro Manila: 1–3 days. Provincial: 3–7 days. All orders come with tracking." },
  { icon: "📅", title: "Pre-Order ETA", desc: "Every pre-order comes with a firm ETA. We update you every step of the way." },
  { icon: "💬", title: "24/7 Support", desc: "Message us on Facebook or Instagram anytime. Real, fast, friendly replies — always." },
];

export default async function HomePage() {
  const [products, reviews, settings] = await Promise.all([getProducts(), getReviews(), getSettings()]);
  const newArrivals = products.filter(p => p.is_new).slice(0, 6);
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
    icon:  settings[`promise_${i + 1}_icon`]  || def.icon,
    title: settings[`promise_${i + 1}_title`] || def.title,
    desc:  settings[`promise_${i + 1}_desc`]  || def.desc,
  }));

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{ minHeight: "92vh", display: "flex", alignItems: "center", background: BRAND.bg }}
      >
        {/* Teal gradient wash */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: `linear-gradient(135deg, transparent 50%, ${BRAND.teal}0D 100%)` }} />
        {/* Subtle grid */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.015]"
          style={{
            backgroundImage: `linear-gradient(${BRAND.black} 1px, transparent 1px), linear-gradient(90deg, ${BRAND.black} 1px, transparent 1px)`,
            backgroundSize: "80px 80px",
          }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left */}
            <div>
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold tracking-widest uppercase mb-8"
                style={{ background: `${BRAND.teal}18`, color: BRAND.teal, border: `1px solid ${BRAND.teal}30` }}
              >
                <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" style={{ background: BRAND.teal }} />
                {hero.badge}
              </div>

              <h1
                style={{
                  fontFamily: FONTS.display,
                  fontSize: "clamp(4rem, 9vw, 8rem)",
                  lineHeight: 0.95,
                  letterSpacing: "0.02em",
                  color: BRAND.black,
                }}
              >
                {hero.line1}
                <span className="block" style={{ color: BRAND.teal }}>{hero.line2}</span>
                <span className="block">{hero.line3}</span>
              </h1>

              <p className="mt-7 text-lg leading-relaxed max-w-lg" style={{ color: BRAND.muted, fontFamily: FONTS.body }}>
                {hero.subtitle[0]}
                {hero.subtitle[1] && <><br /><span className="text-sm" style={{ color: BRAND.mutedLight }}>{hero.subtitle[1]}</span></>}
              </p>

              <div className="flex flex-wrap gap-3 mt-10">
                <Link
                  href="/shop"
                  className="font-bold text-sm px-9 py-4 transition-all hover:opacity-90 active:scale-95 uppercase tracking-widest"
                  style={{ background: BRAND.black, color: BRAND.bg, fontFamily: FONTS.body }}
                >
                  {hero.ctaPrimary}
                </Link>
                <Link
                  href="/shop?filter=pre-order"
                  className="font-bold text-sm px-9 py-4 transition-all hover:opacity-70 uppercase tracking-widest"
                  style={{ border: `1.5px solid ${BRAND.black}`, color: BRAND.black, background: "transparent", fontFamily: FONTS.body }}
                >
                  {hero.ctaSecondary}
                </Link>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-10 mt-14 pt-10" style={{ borderTop: `1px solid ${BRAND.border}` }}>
                {[["2,400+", "Pairs Sold"], ["100%", "Authentic"], ["1,800+", "Happy Buyers"]].map(([v, l]) => (
                  <div key={l}>
                    <p style={{ fontFamily: FONTS.display, fontSize: "2rem", letterSpacing: "0.03em", color: BRAND.black, lineHeight: 1 }}>{v}</p>
                    <p className="text-xs uppercase tracking-widest mt-1" style={{ color: BRAND.muted, fontFamily: FONTS.body }}>{l}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — featured product card */}
            <div className="hidden lg:block">
              <div className="relative">
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{ background: BRAND.card, border: `1px solid ${BRAND.cardBorder}`, boxShadow: "0 24px 64px rgba(13,13,13,0.07)" }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-6 pt-5 pb-3">
                    <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1"
                      style={{ background: `${BRAND.teal}18`, color: BRAND.teal }}>
                      On Hand
                    </span>
                    <span className="text-xs font-semibold" style={{ color: BRAND.muted, fontFamily: FONTS.body }}>{featured.brand}</span>
                  </div>

                  {/* Product visual */}
                  <div className="aspect-square mx-6 rounded-xl overflow-hidden relative"
                    style={{ background: featured.bg || BRAND.bg }}>
                    {featured.images?.[0] ? (
                      <Image
                        src={featured.images[0]}
                        alt={featured.name}
                        fill
                        className="object-contain p-3"
                        sizes="(max-width: 1023px) 0px, 420px"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span style={{ fontFamily: FONTS.display, fontSize: "5rem", color: BRAND.black, opacity: 0.05 }}>
                          {featured.brand.toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info + Add to Cart */}
                  <HeroAddToCart product={featured} />
                </div>

                {/* Below SRP float badge */}
                <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full flex flex-col items-center justify-center text-center shadow-lg"
                  style={{ background: BRAND.red }}>
                  <span className="text-white text-[10px] font-black uppercase leading-tight tracking-wide">Below<br />SRP</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Brand Strip ────────────────────────────────────────────────── */}
      <div className="py-5 overflow-x-auto" style={{ background: BRAND.card, borderTop: `1px solid ${BRAND.border}`, borderBottom: `1px solid ${BRAND.border}` }}>
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between gap-6 min-w-max sm:min-w-0 flex-nowrap sm:flex-wrap">
          {BRANDS.map(b => (
            <Link key={b} href={`/shop?brand=${b}`}
              className="text-sm font-bold uppercase tracking-widest whitespace-nowrap transition-colors hover:opacity-80"
              style={{ color: "#C5C0BA", letterSpacing: "0.15em", fontFamily: FONTS.body }}>
              {b}
            </Link>
          ))}
        </div>
      </div>

      {/* ── New Arrivals ───────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: BRAND.teal, fontFamily: FONTS.body }}>
              Latest Drops
            </p>
            <h2 style={{ fontFamily: FONTS.display, fontSize: "3rem", letterSpacing: "0.04em", color: BRAND.black }}>
              NEW ARRIVALS
            </h2>
          </div>
          <Link href="/shop?filter=new"
            className="text-sm font-semibold flex items-center gap-1 transition-opacity hover:opacity-60"
            style={{ color: BRAND.black, fontFamily: FONTS.body }}>
            View All →
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
          {newArrivals.map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* ── On Hand ────────────────────────────────────────────────────── */}
      {onHand.length > 0 && (
        <section className="py-20" style={{ background: BRAND.card, borderTop: `1px solid ${BRAND.border}` }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: BRAND.teal, fontFamily: FONTS.body }}>
                  Ready to Ship
                </p>
                <h2 style={{ fontFamily: FONTS.display, fontSize: "3rem", letterSpacing: "0.04em", color: BRAND.black }}>
                  ON HAND
                </h2>
              </div>
              <Link href="/shop?filter=on-hand"
                className="text-sm font-semibold flex items-center gap-1 transition-opacity hover:opacity-60"
                style={{ color: BRAND.black, fontFamily: FONTS.body }}>
                View All →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
              {onHand.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Pre-Order Banner ───────────────────────────────────────────── */}
      <section className="py-20" style={{ background: BRAND.black }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: BRAND.teal, fontFamily: FONTS.body }}>
                Flexible Payment
              </p>
              <h2 style={{ fontFamily: FONTS.display, fontSize: "3.2rem", letterSpacing: "0.03em", color: "#F2F0EF", lineHeight: 1 }}>
                PRE-ORDER &<br />PAY LATER
              </h2>
              <p className="text-sm leading-relaxed mt-5 mb-8 max-w-sm" style={{ color: "#777", fontFamily: FONTS.body }}>
                Reserve your pair before it sells out. Pay a downpayment now — settle the balance when it arrives. ETA dates always provided.
              </p>

              {/* Pricing tiers */}
              <div className="flex gap-6">
                {[
                  { label: "SRP", price: "₱10,295", style: "line-through", color: "#555" },
                  { label: "Downpayment", price: "₱9,490", style: "none", color: BRAND.teal },
                  { label: "Full Payment", price: "₱9,000", style: "none", color: BRAND.red },
                ].map(t => (
                  <div key={t.label}>
                    <p style={{ fontFamily: FONTS.display, fontSize: "1.5rem", color: t.color, textDecoration: t.style, letterSpacing: "0.02em" }}>
                      {t.price}
                    </p>
                    <p className="text-xs uppercase tracking-widest mt-0.5" style={{ color: "#555", fontFamily: FONTS.body }}>{t.label}</p>
                  </div>
                ))}
              </div>

              <Link href="/shop?filter=pre-order"
                className="inline-block mt-8 px-8 py-4 text-sm font-bold uppercase tracking-widest transition-opacity hover:opacity-80"
                style={{ background: BRAND.teal, color: BRAND.black, fontFamily: FONTS.body }}>
                Browse Pre-Orders
              </Link>
            </div>

            {/* Steps */}
            <div className="space-y-3">
              {[
                { n: "01", t: "Browse available pre-orders" },
                { n: "02", t: "Leave a downpayment via GCash or Bank Transfer" },
                { n: "03", t: "Upload your proof of payment" },
                { n: "04", t: "Receive confirmation + ETA notification" },
              ].map(({ n, t }) => (
                <div key={n} className="flex items-center gap-4 px-5 py-4"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <span style={{ fontFamily: FONTS.display, fontSize: "1.3rem", color: BRAND.teal, flexShrink: 0 }}>{n}</span>
                  <span className="text-sm" style={{ color: "#999", fontFamily: FONTS.body }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Trending This Week ─────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: BRAND.red, fontFamily: FONTS.body }}>
              Most Popular
            </p>
            <h2 style={{ fontFamily: FONTS.display, fontSize: "3rem", letterSpacing: "0.04em", color: BRAND.black }}>
              TRENDING THIS WEEK
            </h2>
          </div>
          <Link href="/shop?filter=trending"
            className="text-sm font-semibold flex items-center gap-1 transition-opacity hover:opacity-60"
            style={{ color: BRAND.black, fontFamily: FONTS.body }}>
            View All →
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
          {trending.map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* ── Authenticity Section ───────────────────────────────────────── */}
      <section className="py-16" style={{ background: BRAND.card, borderTop: `1px solid ${BRAND.border}`, borderBottom: `1px solid ${BRAND.border}` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: BRAND.teal, fontFamily: FONTS.body }}>
              Our Promise
            </p>
            <h2 style={{ fontFamily: FONTS.display, fontSize: "2.8rem", letterSpacing: "0.04em", color: BRAND.black }}>
              WHY SHOP WITH US
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {promises.map(b => (
              <div key={b.title}
                className="p-6 rounded-xl transition-shadow hover:shadow-sm"
                style={{ border: `1px solid ${BRAND.cardBorder}` }}>
                <div className="text-3xl mb-4">{b.icon}</div>
                <h3 className="font-bold mb-2" style={{ color: BRAND.black, fontFamily: FONTS.body }}>{b.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: BRAND.muted, fontFamily: FONTS.body }}>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Customer Reviews ───────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: BRAND.teal, fontFamily: FONTS.body }}>
            Real Buyers
          </p>
          <h2 style={{ fontFamily: FONTS.display, fontSize: "2.8rem", letterSpacing: "0.04em", color: BRAND.black }}>
            WHAT THEY&apos;RE SAYING
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
          {reviews.slice(0, 6).map(r => {
            const slug = r.product_id ? productSlugMap.get(r.product_id) : null;
            const href = slug ? `/shop/${slug}#reviews` : "/shop";
            return (
              <Link key={r.id} href={href}
                className="block p-6 rounded-xl transition-shadow hover:shadow-md"
                style={{ background: BRAND.card, border: `1px solid ${BRAND.cardBorder}` }}>
                <div className="flex gap-0.5 mb-4">
                  {Array(r.rating).fill(0).map((_, i) => (
                    <span key={i} className="text-sm" style={{ color: BRAND.teal }}>★</span>
                  ))}
                </div>
                <p className="text-sm leading-relaxed mb-5 italic" style={{ color: BRAND.black, fontFamily: FONTS.body }}>
                  &ldquo;{r.body}&rdquo;
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm" style={{ color: BRAND.black, fontFamily: FONTS.body }}>{r.author_name}</p>
                    {r.title && <p className="text-xs" style={{ color: BRAND.muted, fontFamily: FONTS.body }}>{r.title}</p>}
                  </div>
                  {r.is_verified && (
                    <span className="text-[10px] font-semibold px-2.5 py-1"
                      style={{ background: `${BRAND.teal}15`, color: BRAND.teal, fontFamily: FONTS.body }}>
                      Verified
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── Newsletter ─────────────────────────────────────────────────── */}
      <HomeClient />
    </>
  );
}

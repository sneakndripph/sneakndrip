import type { Metadata } from "next";
import Link from "next/link";
import { BRAND, FONTS, BRANDS } from "@/lib/constants";
import ProductCard from "@/components/product/ProductCard";
import HomeClient from "@/components/home/HomeClient";
import { getProducts, getReviews } from "@/lib/supabase/products";

export const metadata: Metadata = {
  title: "Sneak N' Drip — Authentic Sneakers Philippines",
  description: "100% Authentic Sneakers. On Hand & Pre-Order. Shop the latest Nike, Jordan, Adidas, and more at below-SRP prices. Ships nationwide.",
  openGraph: {
    title: "Sneak N' Drip — Authentic Sneakers Philippines",
    description: "100% Authentic Sneakers. On Hand & Pre-Order. Philippines-wide shipping.",
    type: "website",
  },
};

export default async function HomePage() {
  const [products, reviews] = await Promise.all([getProducts(), getReviews()]);
  const newArrivals = products.filter(p => p.is_new).slice(0, 6);
  const onHand = products.filter(p => p.status === "on-hand").slice(0, 6);
  const trending = products.filter(p => p.is_trending).slice(0, 4);
  const featured = products.find(p => p.is_featured && p.status === "on-hand") ?? products[0];
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
                New Drops Every Week
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
                STEP INTO
                <span className="block" style={{ color: BRAND.teal }}>YOUR NEXT</span>
                <span className="block">PAIR</span>
              </h1>

              <p className="mt-7 text-lg leading-relaxed max-w-lg" style={{ color: BRAND.muted, fontFamily: FONTS.body }}>
                100% Authentic Sneakers &nbsp;·&nbsp; On Hand &amp; Pre-Order
                <br />
                <span className="text-sm" style={{ color: BRAND.mutedLight }}>
                  Ships Philippines-wide. GCash, Maya, Bank Transfer &amp; COD accepted.
                </span>
              </p>

              <div className="flex flex-wrap gap-3 mt-10">
                <Link
                  href="/shop"
                  className="font-bold text-sm px-9 py-4 transition-all hover:opacity-90 active:scale-95 uppercase tracking-widest"
                  style={{ background: BRAND.black, color: BRAND.bg, fontFamily: FONTS.body }}
                >
                  Shop Now
                </Link>
                <Link
                  href="/shop?filter=new"
                  className="font-bold text-sm px-9 py-4 transition-all hover:opacity-70 uppercase tracking-widest"
                  style={{ border: `1.5px solid ${BRAND.black}`, color: BRAND.black, background: "transparent", fontFamily: FONTS.body }}
                >
                  New Arrivals
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
                  <div className="aspect-square mx-6 rounded-xl flex items-center justify-center"
                    style={{ background: featured.bg || BRAND.bg }}>
                    <span style={{ fontFamily: FONTS.display, fontSize: "5rem", color: BRAND.black, opacity: 0.05 }}>
                      {featured.brand.toUpperCase()}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="px-6 pt-4 pb-6">
                    <h3 className="font-bold text-base mb-1" style={{ color: BRAND.black, fontFamily: FONTS.body }}>{featured.name}</h3>
                    <p className="text-xs mb-4" style={{ color: BRAND.muted, fontFamily: FONTS.body }}>{featured.colorway}</p>

                    {/* Sizes */}
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {featured.sizes.filter(s => s.stock > 0).slice(0, 6).map(s => (
                        <span key={s.size}
                          className="text-xs px-2.5 py-1 font-medium"
                          style={{ border: `1px solid ${BRAND.border}`, color: BRAND.muted, fontFamily: FONTS.body }}>
                          {s.size}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <span style={{ fontFamily: FONTS.display, fontSize: "1.8rem", color: BRAND.black, letterSpacing: "0.02em" }}>
                          ₱{featured.full_payment_price.toLocaleString()}
                        </span>
                        <span className="text-sm line-through ml-2" style={{ color: BRAND.mutedLight }}>
                          ₱{featured.srp_price.toLocaleString()}
                        </span>
                      </div>
                      <Link href={`/shop/${featured.slug}`}
                        className="px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-80 uppercase tracking-wider"
                        style={{ background: BRAND.teal, fontFamily: FONTS.body }}>
                        View
                      </Link>
                    </div>
                  </div>
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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {trending.map((p, i) => (
            <div key={p.id} className="group">
              <Link href={`/shop/${p.slug}`} className="block">
                <div className="relative aspect-square overflow-hidden mb-3"
                  style={{ background: p.bg || BRAND.bg, border: `1px solid ${BRAND.cardBorder}` }}>
                  <div className="w-full h-full flex items-center justify-center">
                    <span style={{ fontFamily: FONTS.display, fontSize: "4rem", color: BRAND.black, opacity: 0.05 }}>
                      {p.brand.charAt(0)}
                    </span>
                  </div>
                  {/* Rank badge */}
                  <div className="absolute top-3 left-3 w-8 h-8 rounded-sm flex items-center justify-center"
                    style={{ background: BRAND.black }}>
                    <span style={{ fontFamily: FONTS.display, fontSize: "1rem", color: BRAND.bg, lineHeight: 1 }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  {p.status === "pre-order" && (
                    <div className="absolute top-3 right-3">
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 text-white"
                        style={{ background: BRAND.red }}>Pre-Order</span>
                    </div>
                  )}
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: BRAND.muted }}>{p.brand}</p>
                <p className="text-sm font-semibold leading-snug" style={{ color: BRAND.black }}>{p.name}</p>
                <p className="text-sm font-black mt-1" style={{ color: BRAND.black, fontFamily: FONTS.display, fontSize: "1.1rem" }}>
                  ₱{p.full_payment_price.toLocaleString()}
                </p>
              </Link>
            </div>
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
            {[
              { icon: "🔐", title: "100% Authentic", desc: "Every pair is verified authentic. Sourced directly from trusted local and international suppliers. No reps, no fakes — ever." },
              { icon: "✅", title: "Verified Supplier", desc: "We work only with verified and trusted sneaker suppliers. Our reputation is built on authenticity." },
              { icon: "🛡️", title: "Secure Checkout", desc: "GCash, Maya, Bank Transfer, and Cash on Delivery. All payments are safe, fast, and easy." },
              { icon: "📦", title: "Fast Shipping", desc: "Metro Manila: 1–3 days. Provincial: 3–7 days. All orders come with tracking." },
              { icon: "📅", title: "Pre-Order ETA", desc: "Every pre-order comes with a firm ETA. We update you every step of the way." },
              { icon: "💬", title: "24/7 Support", desc: "Message us on Facebook or Instagram anytime. Real, fast, friendly replies — always." },
            ].map(b => (
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
          {reviews.slice(0, 6).map(r => (
            <div key={r.id}
              className="p-6 rounded-xl"
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
            </div>
          ))}
        </div>
      </section>

      {/* ── Instagram Section ──────────────────────────────────────────── */}
      <section className="py-16" style={{ background: BRAND.card, borderTop: `1px solid ${BRAND.border}` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: BRAND.muted, fontFamily: FONTS.body }}>
              Follow Us
            </p>
            <h2 style={{ fontFamily: FONTS.display, fontSize: "2.5rem", letterSpacing: "0.04em", color: BRAND.black }}>
              @SNEAKNDRIP
            </h2>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {Array(6).fill(0).map((_, i) => (
              <div key={i}
                className="aspect-square flex items-center justify-center cursor-pointer transition-opacity hover:opacity-70 overflow-hidden"
                style={{
                  background: [BRAND.teal + "20", BRAND.red + "15", BRAND.bg, BRAND.teal + "15", BRAND.red + "20", BRAND.bg + "80"][i % 6],
                  border: `1px solid ${BRAND.border}`,
                }}>
                <span style={{ fontFamily: FONTS.display, fontSize: "2rem", color: BRAND.black, opacity: 0.07 }}>
                  SND
                </span>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <a href="https://www.instagram.com/sneakndripph/" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold px-6 py-3 transition-opacity hover:opacity-70"
              style={{ border: `1.5px solid ${BRAND.black}`, color: BRAND.black, fontFamily: FONTS.body }}>
              Follow on Instagram →
            </a>
          </div>
        </div>
      </section>

      {/* ── Newsletter ─────────────────────────────────────────────────── */}
      <HomeClient />
    </>
  );
}

"use client";

import { useState } from "react";
import Image from "next/image";

/* ─── Brand tokens — Red / Cream ─────────────────────────────────────────
   Background : #F2F0EF   Red accent : #D94F3D (hero)
   Teal accent: #5BB8B4   Near-black : #0D0D0D
   Card bg    : #FFFFFF   Card border: rgba(13,13,13,0.08)
   ─────────────────────────────────────────────────────────────────────── */

const C = {
  bg: "#F2F0EF",
  card: "#FFFFFF",
  black: "#0D0D0D",
  teal: "#5BB8B4",
  red: "#D94F3D",
  muted: "#8A8580",
  border: "rgba(13,13,13,0.08)",
  cardBorder: "rgba(13,13,13,0.07)",
};

const products = [
  { id: 1, name: "Nike Air Force 1 '07 White", brand: "Nike", price: 5995, srp: 6995, status: "on-hand", sizes: ["7","8","9","10"], bg: "#F5F2EE" },
  { id: 2, name: "Jordan 4 Retro Black Cat", brand: "Jordan", price: 12495, srp: 14995, status: "pre-order", eta: "July 15–25", sizes: ["8","8.5","9"], bg: "#EEEbE6" },
  { id: 3, name: "Adidas Yeezy Slide Onyx", brand: "Adidas", price: 7490, srp: 8990, status: "on-hand", sizes: ["7","9","10","11"], bg: "#F2EFEA" },
  { id: 4, name: "New Balance 550 White Green", brand: "New Balance", price: 6995, srp: 7995, status: "on-hand", sizes: ["7.5","8","9.5"], bg: "#EFEcE7" },
  { id: 5, name: "Nike Dunk Low Panda", brand: "Nike", price: 8995, srp: 9995, status: "pre-order", eta: "Aug 1–10", sizes: ["8","9","10"], bg: "#F3F0EB" },
  { id: 6, name: "Jordan 1 Retro High OG", brand: "Jordan", price: 15995, srp: 17995, status: "on-hand", sizes: ["8.5","9.5"], bg: "#ECE9E4" },
];

const brands = ["Nike", "Jordan", "Adidas", "New Balance", "Puma", "ASICS", "Converse", "Vans"];

export default function Design3() {
  const [cart, setCart] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  return (
    <div className="min-h-screen" style={{ background: C.bg, fontFamily: "var(--font-space-grotesk), sans-serif", color: C.black }}>

      {/* ── Announcement Bar ─────────────────────────────────────────────── */}
      <div className="text-center py-2.5 px-4 text-xs font-bold tracking-widest uppercase"
        style={{ background: C.black, color: C.bg }}>
        100% Authentic &nbsp;·&nbsp; Free Shipping ₱3,000+ &nbsp;·&nbsp; GCash &amp; COD Accepted
      </div>

      {/* ── Navbar ───────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 backdrop-blur-md"
        style={{ background: "rgba(242,240,239,0.96)", borderBottom: `1px solid ${C.border}` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Image src="/sneakndrip-logo.gif" alt="Sneak N' Drip" width={130} height={52} className="object-contain" priority />

            <div className="hidden md:flex items-center gap-8">
              {["Shop", "New Arrivals", "Pre-Orders", "Brands", "About"].map(l => (
                <a key={l} href="#" className="text-sm font-medium transition-colors"
                  style={{ color: C.muted }}
                  onMouseEnter={e => (e.currentTarget.style.color = C.red)}
                  onMouseLeave={e => (e.currentTarget.style.color = C.muted)}>{l}</a>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <button style={{ color: C.muted }} className="hover:opacity-70 transition-opacity">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <button style={{ color: C.muted }} className="hover:opacity-70 transition-opacity">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
              <button onClick={() => setCart(c => c + 1)} className="relative hover:opacity-70 transition-opacity" style={{ color: C.black }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 11H4L5 9z" />
                </svg>
                {cart > 0 && (
                  <span className="absolute -top-2 -right-2 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-black"
                    style={{ background: C.red }}>{cart}</span>
                )}
              </button>
              <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden" style={{ color: C.black }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        {menuOpen && (
          <div className="md:hidden px-4 py-4 space-y-1" style={{ borderTop: `1px solid ${C.border}` }}>
            {["Shop", "New Arrivals", "Pre-Orders", "Brands", "About"].map(l => (
              <a key={l} href="#" className="block py-2.5 text-sm font-medium" style={{ color: C.muted }}>{l}</a>
            ))}
          </div>
        )}
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ minHeight: "92vh", display: "flex", alignItems: "center" }}>

        {/* Full-bleed red hero stripe right side */}
        <div className="absolute right-0 top-0 bottom-0 w-[45%] hidden lg:block"
          style={{ background: C.red }} />
        {/* Teal subtle top bar */}
        <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: C.teal }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-20">
          <div className="grid lg:grid-cols-2 gap-0 items-center">

            {/* Left */}
            <div className="pr-0 lg:pr-16">
              {/* Eyebrow */}
              <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-0.5" style={{ background: C.red }} />
                <span className="text-xs font-bold uppercase tracking-[0.35em]" style={{ color: C.red }}>
                  Philippines&apos; #1 Sneaker Store
                </span>
              </div>

              <h1 style={{
                fontFamily: "var(--font-bebas), sans-serif",
                fontSize: "clamp(4rem, 9vw, 8rem)",
                lineHeight: 0.95,
                letterSpacing: "0.02em",
                color: C.black,
              }}>
                STEP INTO
                <span className="block" style={{ color: C.red }}>YOUR NEXT</span>
                <span className="block">PAIR</span>
              </h1>

              <p className="mt-6 text-lg max-w-md leading-relaxed" style={{ color: C.muted }}>
                100% Authentic Sneakers &nbsp;·&nbsp; On Hand &amp; Pre-Order
                <br />
                <span className="text-sm" style={{ color: "#B0ABA5" }}>Ships Philippines-wide. GCash, Maya &amp; COD.</span>
              </p>

              <div className="flex flex-wrap gap-3 mt-10">
                <button onClick={() => setCart(c => c + 1)}
                  className="font-bold text-sm px-8 py-4 transition-all hover:opacity-90 active:scale-95"
                  style={{ background: C.red, color: "#fff", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  Shop Now
                </button>
                <button className="font-bold text-sm px-8 py-4 transition-all hover:opacity-70"
                  style={{ border: `1.5px solid ${C.black}`, color: C.black, letterSpacing: "0.1em", textTransform: "uppercase", background: "transparent" }}>
                  New Arrivals
                </button>
              </div>

              <div className="flex gap-10 mt-14 pt-10" style={{ borderTop: `1px solid ${C.border}` }}>
                {[["2,400+","Pairs Sold"],["100%","Authentic"],["1,800+","Happy Buyers"]].map(([v,l]) => (
                  <div key={l}>
                    <p style={{ fontFamily: "var(--font-bebas), sans-serif", fontSize: "2rem", color: C.black }}>{v}</p>
                    <p className="text-xs uppercase tracking-widest mt-0.5" style={{ color: C.muted }}>{l}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — red panel with product card */}
            <div className="hidden lg:flex items-center justify-center py-16 px-10 relative"
              style={{ background: C.red, minHeight: "100%" }}>

              {/* Decorative teal circle */}
              <div className="absolute top-8 right-8 w-16 h-16 rounded-full"
                style={{ border: `2px solid ${C.teal}`, opacity: 0.4 }} />
              <div className="absolute bottom-8 left-8 w-10 h-10 rounded-full"
                style={{ background: C.teal, opacity: 0.3 }} />

              {/* Product card */}
              <div className="rounded-2xl overflow-hidden w-full max-w-xs"
                style={{ background: "#fff", boxShadow: "0 30px 80px rgba(13,13,13,0.25)" }}>
                <div className="aspect-square flex items-center justify-center"
                  style={{ background: "#F5F2EE" }}>
                  <span className="font-black opacity-[0.06] text-8xl"
                    style={{ fontFamily: "var(--font-bebas), sans-serif", color: C.black }}>NIKE</span>
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase px-2.5 py-1"
                      style={{ background: `${C.teal}20`, color: C.teal }}>On Hand</span>
                    <span className="text-xs font-semibold" style={{ color: C.muted }}>Nike</span>
                  </div>
                  <h3 className="font-bold text-sm mb-3" style={{ color: C.black }}>Nike Air Force 1 '07 White</h3>
                  <div className="flex items-center justify-between">
                    <span className="font-black text-lg" style={{ fontFamily: "var(--font-bebas), sans-serif", fontSize: "1.6rem" }}>₱5,995</span>
                    <button onClick={() => setCart(c => c + 1)}
                      className="px-4 py-2 text-xs font-black uppercase tracking-wider"
                      style={{ background: C.red, color: "#fff" }}>Add to Cart</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Brand Strip ──────────────────────────────────────────────────── */}
      <div className="py-5" style={{ borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, background: C.card }}>
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between flex-wrap gap-4">
          {brands.map(b => (
            <span key={b} className="text-sm font-bold uppercase tracking-widest cursor-pointer transition-colors"
              style={{ color: "#C8C3BC" }}
              onMouseEnter={e => (e.currentTarget.style.color = C.red)}
              onMouseLeave={e => (e.currentTarget.style.color = "#C8C3BC")}>{b}</span>
          ))}
        </div>
      </div>

      {/* ── New Arrivals ─────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: C.red }}>Latest Drops</p>
            <h2 style={{ fontFamily: "var(--font-bebas), sans-serif", fontSize: "3rem", letterSpacing: "0.04em", color: C.black }}>
              NEW ARRIVALS
            </h2>
          </div>
          <a href="#" className="text-sm font-semibold flex items-center gap-1 transition-opacity hover:opacity-60" style={{ color: C.black }}>
            View All →
          </a>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-5">
          {products.map(p => (
            <div key={p.id} className="group cursor-pointer"
              onMouseEnter={() => setHoveredId(p.id)}
              onMouseLeave={() => setHoveredId(null)}>
              <div className="relative aspect-square overflow-hidden mb-3 transition-all duration-300"
                style={{
                  background: p.bg,
                  border: `1px solid ${hoveredId === p.id ? C.red + "40" : C.cardBorder}`,
                }}>
                <div className="w-full h-full flex items-center justify-center">
                  <span className="font-black opacity-[0.07] text-6xl"
                    style={{ fontFamily: "var(--font-bebas), sans-serif", color: C.black }}>
                    {p.brand.charAt(0)}
                  </span>
                </div>

                {/* Red bottom-left corner accent on hover */}
                <div className="absolute bottom-0 left-0 w-6 h-6 transition-all duration-300"
                  style={{ borderBottom: `2px solid ${hoveredId === p.id ? C.red : "transparent"}`, borderLeft: `2px solid ${hoveredId === p.id ? C.red : "transparent"}` }} />

                <div className="absolute top-3 left-3">
                  {p.status === "on-hand" ? (
                    <span className="text-[10px] font-black uppercase px-2.5 py-1 tracking-wider"
                      style={{ background: C.teal, color: "#fff" }}>On Hand</span>
                  ) : (
                    <span className="text-[10px] font-black uppercase px-2.5 py-1 tracking-wider"
                      style={{ background: C.red, color: "#fff" }}>Pre-Order</span>
                  )}
                </div>

                <div className="absolute bottom-0 left-0 right-0 py-3 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0"
                  style={{ background: C.red }}>
                  <button onClick={() => setCart(c => c + 1)}
                    className="text-xs font-black uppercase tracking-widest w-full text-center text-white">
                    Quick Add
                  </button>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest mb-0.5" style={{ color: C.muted }}>{p.brand}</p>
                <h3 className="text-sm font-semibold leading-snug mb-1 transition-colors"
                  style={{ color: hoveredId === p.id ? C.red : C.black }}>{p.name}</h3>
                {p.status === "pre-order" && p.eta && (
                  <p className="text-xs font-semibold mb-1.5" style={{ color: C.red }}>ETA: {p.eta}</p>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-black text-base" style={{ color: C.black }}>₱{p.price.toLocaleString()}</span>
                    {p.srp !== p.price && (
                      <span className="text-xs line-through" style={{ color: "#B0ABA5" }}>₱{p.srp.toLocaleString()}</span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {p.sizes.slice(0,3).map(s => (
                      <span key={s} className="text-[10px] px-1.5 py-0.5 font-medium"
                        style={{ border: `1px solid ${C.border}`, color: C.muted }}>{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pre-Order Strip ──────────────────────────────────────────────── */}
      <section className="py-16" style={{ background: C.black }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-0.5" style={{ background: C.red }} />
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: C.red }}>Flexible Payment</span>
              </div>
              <h2 className="mb-5" style={{ fontFamily: "var(--font-bebas), sans-serif", fontSize: "3rem", color: "#F2F0EF", letterSpacing: "0.03em" }}>
                RESERVE YOUR PAIR TODAY
              </h2>
              <p className="text-sm leading-relaxed mb-8" style={{ color: "#666" }}>
                Secure your size before it sells out. Pay a downpayment now, settle the balance when it arrives. ETA dates always provided.
              </p>
              <div className="grid grid-cols-3 gap-4">
                {[["₱10,295","SRP","#444","line-through"],["₱9,490","Downpayment",C.teal,"none"],["₱9,000","Full Pay Disc.",C.red,"none"]].map(([price,label,color,dec]) => (
                  <div key={String(label)} className="text-center py-4 px-2"
                    style={{ border: `1px solid rgba(255,255,255,0.06)` }}>
                    <p style={{ fontFamily: "var(--font-bebas), sans-serif", fontSize: "1.4rem", color: String(color), textDecoration: String(dec) }}>{String(price)}</p>
                    <p className="text-[10px] uppercase tracking-widest mt-1" style={{ color: "#555" }}>{String(label)}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              {[
                { n: "01", t: "Browse pre-order listings" },
                { n: "02", t: "Pay via GCash, Maya or Bank Transfer" },
                { n: "03", t: "Upload your proof of payment" },
                { n: "04", t: "Receive confirmation + ETA update" },
              ].map(({n, t}) => (
                <div key={n} className="flex items-center gap-5 py-4 px-5"
                  style={{ background: "rgba(255,255,255,0.03)", borderLeft: `2px solid ${C.red}` }}>
                  <span style={{ fontFamily: "var(--font-bebas), sans-serif", fontSize: "1.2rem", color: C.red }}>{n}</span>
                  <span className="text-sm" style={{ color: "#999" }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Authenticity ─────────────────────────────────────────────────── */}
      <section className="py-16" style={{ background: C.card, borderBottom: `1px solid ${C.border}` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: C.red }}>Our Promise</p>
            <h2 style={{ fontFamily: "var(--font-bebas), sans-serif", fontSize: "2.5rem", color: C.black }}>
              WHY SHOP WITH US
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: "🔐", title: "100% Authentic", desc: "Every pair sourced from verified suppliers. No reps, no fakes — ever." },
              { icon: "✅", title: "Verified Supplier", desc: "Direct partnerships with trusted local and international sneaker suppliers." },
              { icon: "🛡️", title: "Secure Checkout", desc: "GCash, Maya, Bank Transfer, COD — all safe and verified transactions." },
            ].map(b => (
              <div key={b.title} className="p-6 text-center" style={{ border: `1px solid ${C.cardBorder}` }}>
                <div className="text-4xl mb-4">{b.icon}</div>
                <h3 className="font-bold mb-2" style={{ color: C.black }}>{b.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: C.muted }}>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Newsletter ───────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-xl mx-auto px-4 text-center">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: C.red }}>Drop Alerts</p>
          <h2 className="mb-4" style={{ fontFamily: "var(--font-bebas), sans-serif", fontSize: "3rem", color: C.black }}>
            FIRST TO KNOW
          </h2>
          <p className="text-sm mb-8" style={{ color: C.muted }}>New drops, restocks, and exclusive deals straight to your inbox.</p>
          {subscribed ? (
            <p className="font-bold" style={{ color: C.red }}>You're in! Watch your inbox. 🔥</p>
          ) : (
            <div className="flex">
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="your@email.com"
                className="flex-1 px-5 py-4 text-sm focus:outline-none"
                style={{ background: C.card, border: `1px solid ${C.border}`, borderRight: "none", color: C.black }} />
              <button onClick={() => setSubscribed(true)}
                className="px-7 py-4 text-sm font-black uppercase tracking-widest"
                style={{ background: C.red, color: "#fff" }}>
                Subscribe
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="py-12" style={{ background: C.black }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <Image src="/sneakndrip-logo.gif" alt="Sneak N' Drip" width={110} height={44} className="object-contain brightness-0 invert" />
          <p className="text-xs" style={{ color: "#555" }}>© 2025 Sneak N' Drip · 100% Authentic · Philippines</p>
          <div className="flex gap-5">
            {["Facebook", "Instagram", "TikTok"].map(s => (
              <a key={s} href="#" className="text-xs uppercase tracking-widest font-semibold transition-colors"
                style={{ color: "#555" }}
                onMouseEnter={e => (e.currentTarget.style.color = C.red)}
                onMouseLeave={e => (e.currentTarget.style.color = "#555")}>{s}</a>
            ))}
          </div>
        </div>
      </footer>

      <div className="fixed bottom-4 right-4 z-50 text-white text-xs font-black px-3 py-2 rounded-full shadow-lg uppercase tracking-wider"
        style={{ background: C.red }}>
        Design 3 — Street Coral
      </div>
    </div>
  );
}

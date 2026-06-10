"use client";

import { useState } from "react";
import Image from "next/image";

/* ─── Brand tokens from logo ────────────────────────────────────────────────
   Cream bg  : #F2F0EF   Teal accent : #5BB8B4
   Red accent: #D94F3D   Near-black  : #0D0D0D
   Card bg   : #FFFFFF   Border      : rgba(13,13,13,0.09)
   ─────────────────────────────────────────────────────────────────────────*/

const C = {
  bg: "#F2F0EF",
  black: "#0D0D0D",
  teal: "#5BB8B4",
  red: "#D94F3D",
  card: "#FFFFFF",
  muted: "#8A8580",
  border: "rgba(13,13,13,0.09)",
  cardBorder: "rgba(13,13,13,0.07)",
};

const products = [
  { id: 1, name: "Nike Air Force 1 '07 White", brand: "Nike", price: 5995, srp: 6995, status: "on-hand", sizes: ["7","8","9","10"], bg: "#F0EDE8" },
  { id: 2, name: "Jordan 4 Retro Black Cat", brand: "Jordan", price: 12495, srp: 14995, status: "pre-order", eta: "July 15–25", sizes: ["8","8.5","9"], bg: "#EAE6E0" },
  { id: 3, name: "Adidas Yeezy Slide Onyx", brand: "Adidas", price: 7490, srp: 8990, status: "on-hand", sizes: ["7","9","10","11"], bg: "#EDE9E3" },
  { id: 4, name: "New Balance 550 White Green", brand: "New Balance", price: 6995, srp: 7995, status: "on-hand", sizes: ["7.5","8","9.5"], bg: "#EBE7E1" },
  { id: 5, name: "Nike Dunk Low Panda", brand: "Nike", price: 8995, srp: 9995, status: "pre-order", eta: "Aug 1–10", sizes: ["8","9","10"], bg: "#EEEaE4" },
  { id: 6, name: "Jordan 1 Retro High OG", brand: "Jordan", price: 15995, srp: 17995, status: "on-hand", sizes: ["8.5","9.5"], bg: "#E8E4DE" },
];

const brands = ["Nike", "Jordan", "Adidas", "New Balance", "Puma", "ASICS", "Converse", "Vans"];

const reviews = [
  { name: "Marco R.", location: "Manila", text: "Legit pair, fast delivery. Will definitely order again!", rating: 5, item: "Jordan 4 Black Cat" },
  { name: "Issa T.", location: "Cebu", text: "Pre-order went smoothly. ETA was accurate. 100% recommend.", rating: 5, item: "Nike Dunk Low Panda" },
  { name: "Paulo C.", location: "BGC", text: "GCash payment was so easy. Sneakers arrived boxed perfectly.", rating: 5, item: "Air Force 1 White" },
];

export default function Design1() {
  const [cart, setCart] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  return (
    <div className="min-h-screen" style={{ background: C.bg, fontFamily: "var(--font-space-grotesk), sans-serif", color: C.black }}>

      {/* ── Announcement Bar ─────────────────────────────────────────────── */}
      <div className="text-center py-2.5 px-4 text-xs font-semibold tracking-widest uppercase"
        style={{ background: C.teal, color: "#fff" }}>
        Free Shipping on Orders ₱3,000+ &nbsp;·&nbsp; 100% Authentic Guaranteed &nbsp;·&nbsp; GCash &amp; COD Accepted
      </div>

      {/* ── Navbar ───────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 backdrop-blur-md"
        style={{ background: "rgba(242,240,239,0.95)", borderBottom: `1px solid ${C.border}` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Image src="/sneakndrip-logo.gif" alt="Sneak N' Drip" width={130} height={52} className="object-contain" priority />

            {/* Links */}
            <div className="hidden md:flex items-center gap-8">
              {["Shop", "New Arrivals", "Pre-Orders", "Brands", "About"].map(l => (
                <a key={l} href="#"
                  className="text-sm font-medium transition-colors"
                  style={{ color: C.muted, letterSpacing: "0.04em" }}
                  onMouseEnter={e => (e.currentTarget.style.color = C.teal)}
                  onMouseLeave={e => (e.currentTarget.style.color = C.muted)}>
                  {l}
                </a>
              ))}
            </div>

            {/* Icons */}
            <div className="flex items-center gap-4">
              {/* Search */}
              <button style={{ color: C.muted }} className="hover:opacity-70 transition-opacity">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              {/* Account */}
              <button style={{ color: C.muted }} className="hover:opacity-70 transition-opacity">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
              {/* Cart */}
              <button onClick={() => setCart(c => c + 1)} className="relative transition-opacity hover:opacity-70" style={{ color: C.black }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 11H4L5 9z" />
                </svg>
                {cart > 0 && (
                  <span className="absolute -top-2 -right-2 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-black"
                    style={{ background: C.teal }}>{cart}</span>
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

        {/* Mobile menu */}
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
        {/* Subtle teal blob */}
        <div className="absolute top-0 right-0 w-[50vw] h-full pointer-events-none"
          style={{ background: `linear-gradient(135deg, transparent 40%, ${C.teal}12 100%)` }} />
        {/* Red dot accent */}
        <div className="absolute bottom-20 right-[15%] w-40 h-40 rounded-full pointer-events-none"
          style={{ background: `${C.red}08`, filter: "blur(40px)" }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left — Copy */}
            <div>
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full text-xs font-semibold tracking-widest uppercase"
                style={{ background: `${C.teal}18`, color: C.teal, border: `1px solid ${C.teal}30` }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: C.teal }} />
                New Drops Just Landed
              </div>

              <h1 style={{
                fontFamily: "var(--font-bebas), sans-serif",
                fontSize: "clamp(3.8rem, 8vw, 7rem)",
                lineHeight: 1,
                letterSpacing: "0.02em",
                color: C.black,
              }}>
                STEP INTO
                <span className="block" style={{ color: C.teal }}>YOUR NEXT</span>
                <span className="block">PAIR</span>
              </h1>

              <p className="mt-6 text-lg leading-relaxed max-w-md" style={{ color: C.muted }}>
                100% Authentic Sneakers &nbsp;·&nbsp; On Hand &amp; Pre-Order
                <br />
                <span className="text-sm" style={{ color: "#B0ABA5" }}>
                  Ships Philippines-wide. GCash, Maya &amp; COD accepted.
                </span>
              </p>

              <div className="flex flex-wrap gap-3 mt-10">
                <button
                  onClick={() => setCart(c => c + 1)}
                  className="font-bold text-sm px-8 py-4 transition-all hover:opacity-90 active:scale-95"
                  style={{ background: C.black, color: C.bg, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  Shop Now
                </button>
                <button
                  className="font-bold text-sm px-8 py-4 transition-all hover:opacity-80"
                  style={{ border: `1.5px solid ${C.black}`, color: C.black, letterSpacing: "0.1em", textTransform: "uppercase", background: "transparent" }}>
                  New Arrivals
                </button>
              </div>

              {/* Stats */}
              <div className="flex gap-10 mt-14 pt-10" style={{ borderTop: `1px solid ${C.border}` }}>
                {[["2,400+","Pairs Sold"],["100%","Authentic"],["1,800+","Happy Buyers"]].map(([v,l]) => (
                  <div key={l}>
                    <p className="text-2xl font-black" style={{ fontFamily: "var(--font-bebas), sans-serif", fontSize: "2rem", color: C.black }}>{v}</p>
                    <p className="text-xs uppercase tracking-widest mt-0.5" style={{ color: C.muted }}>{l}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Hero card */}
            <div className="hidden lg:block">
              <div className="relative">
                {/* Main featured card */}
                <div className="rounded-2xl overflow-hidden p-8"
                  style={{ background: C.card, border: `1px solid ${C.cardBorder}`, boxShadow: "0 20px 60px rgba(13,13,13,0.08)" }}>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-sm"
                      style={{ background: `${C.teal}20`, color: C.teal }}>On Hand</span>
                    <span className="text-xs font-semibold" style={{ color: C.muted }}>Nike</span>
                  </div>
                  <div className="aspect-square rounded-xl flex items-center justify-center mb-6"
                    style={{ background: `linear-gradient(135deg, ${C.bg}, #E8E4DE)` }}>
                    <span className="text-8xl font-black opacity-[0.06]"
                      style={{ fontFamily: "var(--font-bebas), sans-serif" }}>NIKE</span>
                  </div>
                  <h3 className="text-lg font-bold mb-1" style={{ color: C.black }}>Nike Air Force 1 '07 White</h3>
                  <div className="flex items-center justify-between mt-4">
                    <div>
                      <span className="text-2xl font-black" style={{ fontFamily: "var(--font-bebas), sans-serif", fontSize: "1.8rem" }}>₱5,995</span>
                      <span className="text-sm line-through ml-2" style={{ color: C.muted }}>₱6,995</span>
                    </div>
                    <button onClick={() => setCart(c => c + 1)}
                      className="px-5 py-2.5 text-sm font-bold transition-opacity hover:opacity-80"
                      style={{ background: C.teal, color: "#fff" }}>
                      Add to Cart
                    </button>
                  </div>
                </div>
                {/* Floating badge */}
                <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full flex flex-col items-center justify-center text-center"
                  style={{ background: C.red, color: "#fff", boxShadow: "0 8px 24px rgba(217,79,61,0.35)" }}>
                  <span className="text-[10px] font-black uppercase tracking-wide leading-tight">Below<br/>SRP</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Brand Strip ──────────────────────────────────────────────────── */}
      <div className="py-5 overflow-hidden" style={{ borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, background: C.card }}>
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between flex-wrap gap-4">
          {brands.map(b => (
            <span key={b} className="text-sm font-bold uppercase tracking-widest cursor-pointer transition-colors"
              style={{ color: "#C5C0BA", letterSpacing: "0.15em" }}
              onMouseEnter={e => (e.currentTarget.style.color = C.black)}
              onMouseLeave={e => (e.currentTarget.style.color = "#C5C0BA")}>
              {b}
            </span>
          ))}
        </div>
      </div>

      {/* ── New Arrivals ─────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: C.teal }}>Latest Drops</p>
            <h2 style={{ fontFamily: "var(--font-bebas), sans-serif", fontSize: "3rem", letterSpacing: "0.04em", color: C.black }}>
              NEW ARRIVALS
            </h2>
          </div>
          <a href="#" className="text-sm font-semibold flex items-center gap-1 transition-opacity hover:opacity-60"
            style={{ color: C.black }}>
            View All <span>→</span>
          </a>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-5">
          {products.map(p => (
            <div key={p.id} className="group cursor-pointer">
              {/* Image box */}
              <div className="relative aspect-square overflow-hidden mb-3"
                style={{ background: p.bg, border: `1px solid ${C.cardBorder}` }}>
                {/* Placeholder product visual */}
                <div className="w-full h-full flex items-center justify-center">
                  <span className="font-black opacity-[0.07] text-6xl"
                    style={{ fontFamily: "var(--font-bebas), sans-serif", color: C.black }}>
                    {p.brand.charAt(0)}
                  </span>
                </div>

                {/* Badge */}
                <div className="absolute top-3 left-3">
                  {p.status === "on-hand" ? (
                    <span className="text-[10px] font-black uppercase px-2.5 py-1 tracking-wider"
                      style={{ background: C.teal, color: "#fff" }}>On Hand</span>
                  ) : (
                    <span className="text-[10px] font-black uppercase px-2.5 py-1 tracking-wider"
                      style={{ background: C.red, color: "#fff" }}>Pre-Order</span>
                  )}
                </div>

                {/* Quick add */}
                <div className="absolute bottom-0 left-0 right-0 py-3 text-center opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0"
                  style={{ background: C.black }}>
                  <button onClick={() => setCart(c => c + 1)}
                    className="text-xs font-black uppercase tracking-widest w-full"
                    style={{ color: C.bg }}>
                    Quick Add
                  </button>
                </div>
              </div>

              {/* Info */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest mb-0.5" style={{ color: C.muted }}>{p.brand}</p>
                <h3 className="text-sm font-semibold leading-snug mb-1 transition-colors group-hover:opacity-70" style={{ color: C.black }}>{p.name}</h3>
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
                    {p.sizes.length > 3 && <span className="text-[10px]" style={{ color: C.muted }}>+{p.sizes.length-3}</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pre-Order Banner ─────────────────────────────────────────────── */}
      <section className="py-16" style={{ background: C.black }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: C.teal }}>Reserve Yours Now</p>
              <h2 className="text-white mb-4" style={{ fontFamily: "var(--font-bebas), sans-serif", fontSize: "3rem", letterSpacing: "0.04em" }}>
                PRE-ORDER & PAY LATER
              </h2>
              <p className="text-sm leading-relaxed mb-8" style={{ color: "#888" }}>
                Secure your pair before it sells out. Leave a downpayment and pay the balance upon arrival. ETA dates guaranteed.
              </p>
              <div className="flex gap-8">
                {[["₱9,490","Downpayment"],["₱9,000","Full Payment"],["₱10,295","SRP"]].map(([p,l]) => (
                  <div key={l}>
                    <p className="font-black text-xl text-white" style={{ fontFamily: "var(--font-bebas), sans-serif", fontSize: "1.5rem" }}>{p}</p>
                    <p className="text-xs uppercase tracking-widest mt-0.5" style={{ color: "#666" }}>{l}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {[
                { step: "01", text: "Browse available pre-orders" },
                { step: "02", text: "Leave a downpayment via GCash or Bank Transfer" },
                { step: "03", text: "Upload your proof of payment" },
                { step: "04", text: "Receive confirmation + ETA" },
              ].map(({ step, text }) => (
                <div key={step} className="flex items-center gap-4 py-3 px-5 rounded-sm"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <span className="font-black shrink-0" style={{ fontFamily: "var(--font-bebas), sans-serif", color: C.teal, fontSize: "1.2rem" }}>{step}</span>
                  <span className="text-sm text-white/70">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Authenticity ─────────────────────────────────────────────────── */}
      <section className="py-16" style={{ background: C.card, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: C.teal }}>Our Promise</p>
            <h2 style={{ fontFamily: "var(--font-bebas), sans-serif", fontSize: "2.5rem", letterSpacing: "0.04em", color: C.black }}>
              WHY SHOP WITH US
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: "🔐", title: "100% Authentic", desc: "Every pair sourced from verified suppliers. No reps, no fakes — ever. We stake our reputation on it." },
              { icon: "✅", title: "Verified Supplier", desc: "Direct partnerships with trusted local and international sneaker suppliers and authorized resellers." },
              { icon: "🛡️", title: "Secure Checkout", desc: "GCash, Maya, Bank Transfer, and Cash on Delivery. All payments are safe and verified." },
            ].map(b => (
              <div key={b.title} className="text-center p-6 rounded-xl" style={{ border: `1px solid ${C.cardBorder}` }}>
                <div className="text-4xl mb-4">{b.icon}</div>
                <h3 className="font-bold mb-2 text-base" style={{ color: C.black }}>{b.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: C.muted }}>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Reviews ──────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-10">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: C.teal }}>Customer Love</p>
          <h2 style={{ fontFamily: "var(--font-bebas), sans-serif", fontSize: "2.5rem", letterSpacing: "0.04em", color: C.black }}>
            WHAT THEY'RE SAYING
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {reviews.map(r => (
            <div key={r.name} className="p-6 rounded-xl" style={{ background: C.card, border: `1px solid ${C.cardBorder}` }}>
              <div className="flex gap-0.5 mb-4">
                {Array(r.rating).fill(0).map((_, i) => (
                  <span key={i} style={{ color: C.teal }}>★</span>
                ))}
              </div>
              <p className="text-sm leading-relaxed mb-5 italic" style={{ color: C.black }}>"{r.text}"</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm" style={{ color: C.black }}>{r.name}</p>
                  <p className="text-xs" style={{ color: C.muted }}>{r.location}</p>
                </div>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-sm"
                  style={{ background: `${C.teal}15`, color: C.teal }}>{r.item}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Newsletter ───────────────────────────────────────────────────── */}
      <section className="py-20" style={{ background: C.teal }}>
        <div className="max-w-xl mx-auto px-4 text-center">
          <h2 className="text-white mb-3" style={{ fontFamily: "var(--font-bebas), sans-serif", fontSize: "3rem", letterSpacing: "0.04em" }}>
            FIRST TO KNOW
          </h2>
          <p className="text-sm mb-8" style={{ color: "rgba(255,255,255,0.75)" }}>
            Get notified on new drops, restocks, and exclusive below-SRP deals.
          </p>
          {subscribed ? (
            <p className="font-bold text-white text-lg">You're in! Welcome to the family 🤙</p>
          ) : (
            <div className="flex">
              <input value={email} onChange={e => setEmail(e.target.value)} type="email"
                placeholder="your@email.com"
                className="flex-1 px-5 py-4 text-sm focus:outline-none"
                style={{ background: "rgba(255,255,255,0.15)", color: "#fff", border: "none" }}
              />
              <button onClick={() => setSubscribed(true)}
                className="px-7 py-4 text-sm font-black uppercase tracking-widest transition-opacity hover:opacity-90"
                style={{ background: C.black, color: C.bg }}>
                Subscribe
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="py-12" style={{ background: C.black }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Image src="/sneakndrip-logo.gif" alt="Sneak N' Drip" width={110} height={44} className="object-contain brightness-0 invert" />
            <p className="text-xs text-center" style={{ color: "#555" }}>
              © 2025 Sneak N' Drip · 100% Authentic Sneakers · Philippines
            </p>
            <div className="flex gap-5">
              {["Facebook", "Instagram", "TikTok"].map(s => (
                <a key={s} href="#" className="text-xs uppercase tracking-widest font-semibold transition-colors"
                  style={{ color: "#555" }}
                  onMouseEnter={e => (e.currentTarget.style.color = C.teal)}
                  onMouseLeave={e => (e.currentTarget.style.color = "#555")}>
                  {s}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* Design label */}
      <div className="fixed bottom-4 right-4 z-50 text-white text-xs font-black px-3 py-2 rounded-full shadow-lg uppercase tracking-wider"
        style={{ background: C.teal }}>
        Design 1 — Cream Culture
      </div>
    </div>
  );
}

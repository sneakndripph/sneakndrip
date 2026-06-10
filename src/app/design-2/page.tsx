"use client";

import { useState } from "react";
import Image from "next/image";

/* ─── Brand tokens — Dark mode ───────────────────────────────────────────
   Background : #0D0D0D   Cream text : #F2F0EF
   Teal accent: #5BB8B4   Red accent : #D94F3D
   Card bg    : #181816   Border     : rgba(242,240,239,0.08)
   ─────────────────────────────────────────────────────────────────────── */

const C = {
  bg: "#0D0D0D",
  card: "#181816",
  cream: "#F2F0EF",
  teal: "#5BB8B4",
  red: "#D94F3D",
  muted: "#7A7672",
  border: "rgba(242,240,239,0.08)",
  cardBorder: "rgba(242,240,239,0.06)",
};

const products = [
  { id: 1, name: "Nike Air Force 1 '07 White", brand: "Nike", price: 5995, srp: 6995, status: "on-hand", sizes: ["7","8","9","10"], cardBg: "#1C1C1A" },
  { id: 2, name: "Jordan 4 Retro Black Cat", brand: "Jordan", price: 12495, srp: 14995, status: "pre-order", eta: "July 15–25", sizes: ["8","8.5","9"], cardBg: "#1A1A18" },
  { id: 3, name: "Adidas Yeezy Slide Onyx", brand: "Adidas", price: 7490, srp: 8990, status: "on-hand", sizes: ["7","9","10","11"], cardBg: "#1E1C1A" },
  { id: 4, name: "New Balance 550 White Green", brand: "New Balance", price: 6995, srp: 7995, status: "on-hand", sizes: ["7.5","8","9.5"], cardBg: "#1C1A18" },
  { id: 5, name: "Nike Dunk Low Panda", brand: "Nike", price: 8995, srp: 9995, status: "pre-order", eta: "Aug 1–10", sizes: ["8","9","10"], cardBg: "#1A1A1C" },
  { id: 6, name: "Jordan 1 Retro High OG", brand: "Jordan", price: 15995, srp: 17995, status: "on-hand", sizes: ["8.5","9.5"], cardBg: "#1C1A1A" },
];

const brands = ["Nike", "Jordan", "Adidas", "New Balance", "Puma", "ASICS", "Converse", "Vans"];

export default function Design2() {
  const [cart, setCart] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  return (
    <div className="min-h-screen" style={{ background: C.bg, fontFamily: "var(--font-space-grotesk), sans-serif", color: C.cream }}>

      {/* ── Announcement Bar ─────────────────────────────────────────────── */}
      <div className="text-center py-2.5 px-4 text-xs font-semibold tracking-widest uppercase"
        style={{ background: C.red, color: "#fff" }}>
        ⚡ New Drops Every Week &nbsp;·&nbsp; 100% Authentic &nbsp;·&nbsp; GCash &amp; COD Accepted
      </div>

      {/* ── Navbar ───────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 backdrop-blur-sm"
        style={{ background: "rgba(13,13,13,0.96)", borderBottom: `1px solid ${C.border}` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo on dark bg — cream container so GIF white doesn't clash */}
            <div className="rounded-md px-2 py-1" style={{ background: "#F2F0EF" }}>
              <Image src="/sneakndrip-logo.gif" alt="Sneak N' Drip" width={110} height={44} className="object-contain" priority />
            </div>

            <div className="hidden md:flex items-center gap-8">
              {["Shop", "New Arrivals", "Pre-Orders", "Brands", "About"].map(l => (
                <a key={l} href="#" className="text-xs font-semibold uppercase tracking-widest transition-colors"
                  style={{ color: C.muted }}
                  onMouseEnter={e => (e.currentTarget.style.color = C.teal)}
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
              <button onClick={() => setCart(c => c + 1)} className="relative hover:opacity-70 transition-opacity" style={{ color: C.cream }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 11H4L5 9z" />
                </svg>
                {cart > 0 && (
                  <span className="absolute -top-2 -right-2 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-black"
                    style={{ background: C.teal }}>{cart}</span>
                )}
              </button>
              <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden" style={{ color: C.cream }}>
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
              <a key={l} href="#" className="block py-2.5 text-sm font-medium uppercase tracking-widest" style={{ color: C.muted }}>{l}</a>
            ))}
          </div>
        )}
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ minHeight: "92vh", display: "flex", alignItems: "center" }}>

        {/* Teal gradient wash right side */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at 85% 40%, ${C.teal}10 0%, transparent 60%)` }} />
        {/* Red glow bottom left */}
        <div className="absolute bottom-0 left-0 w-72 h-72 pointer-events-none"
          style={{ background: `${C.red}08`, filter: "blur(60px)" }} />

        {/* Giant background glyph */}
        <div className="absolute right-[-2%] top-[10%] select-none pointer-events-none opacity-[0.03]"
          style={{
            fontFamily: "var(--font-bebas), sans-serif",
            fontSize: "clamp(10rem, 30vw, 28rem)",
            lineHeight: 1,
            color: C.teal,
            letterSpacing: "-0.02em",
          }}>
          DRIP
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-20">
          <div className="max-w-3xl">
            {/* Eyebrow */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-px" style={{ background: C.teal }} />
              <span className="text-xs font-bold uppercase tracking-[0.4em]" style={{ color: C.teal }}>
                Philippines&apos; Premier Sneaker Store
              </span>
            </div>

            <h1 style={{
              fontFamily: "var(--font-bebas), sans-serif",
              fontSize: "clamp(4rem, 11vw, 9.5rem)",
              lineHeight: 0.95,
              letterSpacing: "0.01em",
              color: C.cream,
            }}>
              STEP INTO
              <span className="block" style={{ color: C.teal }}>YOUR NEXT</span>
              <span className="block">PAIR</span>
            </h1>

            <p className="mt-7 text-lg max-w-lg leading-relaxed" style={{ color: C.muted }}>
              100% Authentic Sneakers &nbsp;·&nbsp; On Hand &amp; Pre-Order
              <br />
              <span className="text-sm" style={{ color: "#504E4A" }}>GCash, Maya &amp; COD. Shipped nationwide.</span>
            </p>

            <div className="flex flex-wrap gap-3 mt-10">
              <button onClick={() => setCart(c => c + 1)}
                className="font-bold text-sm px-8 py-4 transition-all hover:opacity-90 active:scale-95"
                style={{ background: C.teal, color: "#0D0D0D", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Shop Now
              </button>
              <button className="font-bold text-sm px-8 py-4 transition-all hover:opacity-70"
                style={{ border: `1.5px solid ${C.cream}20`, color: C.cream, letterSpacing: "0.1em", textTransform: "uppercase", background: "transparent" }}>
                New Arrivals
              </button>
            </div>

            {/* Stats */}
            <div className="flex gap-10 mt-14 pt-10" style={{ borderTop: `1px solid ${C.border}` }}>
              {[["2,400+","Pairs Sold"],["100%","Authentic"],["1,800+","Happy Buyers"]].map(([v,l]) => (
                <div key={l}>
                  <p style={{ fontFamily: "var(--font-bebas), sans-serif", fontSize: "1.9rem", color: C.cream, letterSpacing: "0.04em" }}>{v}</p>
                  <p className="text-xs uppercase tracking-widest mt-0.5" style={{ color: C.muted }}>{l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Brand Strip ──────────────────────────────────────────────────── */}
      <div className="py-5" style={{ borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, background: "#111110" }}>
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between flex-wrap gap-4">
          {brands.map(b => (
            <span key={b} className="text-sm font-bold uppercase tracking-widest cursor-pointer transition-colors"
              style={{ color: "#2E2C2A" }}
              onMouseEnter={e => (e.currentTarget.style.color = C.teal)}
              onMouseLeave={e => (e.currentTarget.style.color = "#2E2C2A")}>{b}</span>
          ))}
        </div>
      </div>

      {/* ── New Arrivals ─────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: C.teal }}>Just Dropped</p>
            <h2 style={{ fontFamily: "var(--font-bebas), sans-serif", fontSize: "3rem", letterSpacing: "0.04em", color: C.cream }}>
              NEW ARRIVALS
            </h2>
          </div>
          <a href="#" className="text-sm font-semibold flex items-center gap-1 transition-opacity hover:opacity-60" style={{ color: C.teal }}>
            View All →
          </a>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-5">
          {products.map(p => (
            <div key={p.id} className="group cursor-pointer">
              <div className="relative aspect-square overflow-hidden mb-3"
                style={{ background: p.cardBg, border: `1px solid ${C.cardBorder}` }}>
                <div className="w-full h-full flex items-center justify-center">
                  <span className="font-black opacity-[0.06] text-7xl"
                    style={{ fontFamily: "var(--font-bebas), sans-serif", color: C.cream }}>
                    {p.brand.charAt(0)}
                  </span>
                </div>

                {/* Corner teal accent */}
                <div className="absolute top-0 left-0 w-6 h-6" style={{
                  borderTop: `2px solid ${C.teal}40`,
                  borderLeft: `2px solid ${C.teal}40`,
                }} />
                <div className="absolute bottom-0 right-0 w-6 h-6" style={{
                  borderBottom: `2px solid ${C.teal}40`,
                  borderRight: `2px solid ${C.teal}40`,
                }} />

                <div className="absolute top-3 left-3">
                  {p.status === "on-hand" ? (
                    <span className="text-[10px] font-black uppercase px-2.5 py-1 tracking-wider"
                      style={{ background: C.teal, color: "#0D0D0D" }}>On Hand</span>
                  ) : (
                    <span className="text-[10px] font-black uppercase px-2.5 py-1 tracking-wider"
                      style={{ background: C.red, color: "#fff" }}>Pre-Order</span>
                  )}
                </div>

                <div className="absolute bottom-0 left-0 right-0 py-3 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0"
                  style={{ background: C.teal }}>
                  <button onClick={() => setCart(c => c + 1)}
                    className="text-xs font-black uppercase tracking-widest w-full text-center"
                    style={{ color: "#0D0D0D" }}>
                    Quick Add
                  </button>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest mb-0.5" style={{ color: C.muted }}>{p.brand}</p>
                <h3 className="text-sm font-semibold leading-snug mb-1" style={{ color: C.cream }}>{p.name}</h3>
                {p.status === "pre-order" && p.eta && (
                  <p className="text-xs font-semibold mb-1.5" style={{ color: C.red }}>ETA: {p.eta}</p>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-black text-base" style={{ color: C.cream }}>₱{p.price.toLocaleString()}</span>
                    {p.srp !== p.price && (
                      <span className="text-xs line-through" style={{ color: "#3A3836" }}>₱{p.srp.toLocaleString()}</span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {p.sizes.slice(0,3).map(s => (
                      <span key={s} className="text-[10px] px-1.5 py-0.5 font-medium"
                        style={{ border: `1px solid ${C.cardBorder}`, color: C.muted }}>{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Downpayment Banner ───────────────────────────────────────────── */}
      <section className="py-16" style={{ background: `${C.teal}0F`, border: `1px solid ${C.teal}20` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: C.teal }}>Flexible Payment</p>
          <h2 className="mb-6" style={{ fontFamily: "var(--font-bebas), sans-serif", fontSize: "2.8rem", letterSpacing: "0.04em", color: C.cream }}>
            PRE-ORDER WITH DOWNPAYMENT
          </h2>
          <div className="inline-flex flex-wrap justify-center gap-6 mb-8">
            {[["₱10,295","SRP","text"],["₱9,490","Downpayment","teal"],["₱9,000","Full Payment Disc.","red"]].map(([price, label, style]) => (
              <div key={label} className="text-center px-8 py-5 rounded-xl"
                style={{ background: style === "teal" ? `${C.teal}20` : style === "red" ? `${C.red}15` : `rgba(242,240,239,0.05)`, border: `1px solid ${style === "teal" ? C.teal+"40" : style === "red" ? C.red+"30" : C.border}` }}>
                <p style={{ fontFamily: "var(--font-bebas), sans-serif", fontSize: "2rem", color: style === "teal" ? C.teal : style === "red" ? C.red : C.muted, textDecoration: style === "text" ? "line-through" : "none" }}>{price}</p>
                <p className="text-xs uppercase tracking-widest" style={{ color: C.muted }}>{label}</p>
              </div>
            ))}
          </div>
          <button className="font-bold text-sm px-8 py-4 uppercase tracking-widest"
            style={{ background: C.teal, color: "#0D0D0D" }}>
            Browse Pre-Orders
          </button>
        </div>
      </section>

      {/* ── Authenticity ─────────────────────────────────────────────────── */}
      <section className="py-16" style={{ borderTop: `1px solid ${C.border}` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: "🔐", title: "100% Authentic", desc: "Every pair sourced from verified suppliers. No reps, no fakes — ever." },
              { icon: "✅", title: "Verified Supplier", desc: "Direct partnerships with trusted local and international sneaker suppliers." },
              { icon: "🛡️", title: "Secure Checkout", desc: "GCash, Maya, Bank Transfer, COD — all safe and verified." },
            ].map(b => (
              <div key={b.title} className="flex items-start gap-4 p-6" style={{ border: `1px solid ${C.cardBorder}` }}>
                <span className="text-3xl shrink-0">{b.icon}</span>
                <div>
                  <h3 className="font-bold mb-1.5" style={{ color: C.cream }}>{b.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: C.muted }}>{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Newsletter ───────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-xl mx-auto px-4 text-center">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: C.teal }}>Stay In The Loop</p>
          <h2 className="mb-4" style={{ fontFamily: "var(--font-bebas), sans-serif", fontSize: "3rem", letterSpacing: "0.04em", color: C.cream }}>
            FIRST TO KNOW
          </h2>
          <p className="text-sm mb-8" style={{ color: C.muted }}>New drops, restocks, and exclusive below-SRP deals — straight to your inbox.</p>
          {subscribed ? (
            <p className="font-bold" style={{ color: C.teal }}>You're in. Welcome to the family 🤙</p>
          ) : (
            <div className="flex">
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="your@email.com"
                className="flex-1 px-5 py-4 text-sm focus:outline-none"
                style={{ background: "#181816", border: `1px solid ${C.border}`, borderRight: "none", color: C.cream }} />
              <button onClick={() => setSubscribed(true)}
                className="px-7 py-4 text-sm font-black uppercase tracking-widest"
                style={{ background: C.teal, color: "#0D0D0D" }}>
                Join
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="py-10" style={{ borderTop: `1px solid ${C.border}` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="rounded-md px-2 py-1" style={{ background: "#F2F0EF" }}>
            <Image src="/sneakndrip-logo.gif" alt="Sneak N' Drip" width={90} height={36} className="object-contain" />
          </div>
          <p className="text-xs text-center" style={{ color: "#3A3836" }}>© 2025 Sneak N' Drip · 100% Authentic · Philippines</p>
          <div className="flex gap-5">
            {["Facebook", "Instagram", "TikTok"].map(s => (
              <a key={s} href="#" className="text-xs uppercase tracking-widest font-semibold transition-colors"
                style={{ color: "#3A3836" }}
                onMouseEnter={e => (e.currentTarget.style.color = C.teal)}
                onMouseLeave={e => (e.currentTarget.style.color = "#3A3836")}>{s}</a>
            ))}
          </div>
        </div>
      </footer>

      <div className="fixed bottom-4 right-4 z-50 text-black text-xs font-black px-3 py-2 rounded-full shadow-lg uppercase tracking-wider"
        style={{ background: C.teal }}>
        Design 2 — Midnight Drip
      </div>
    </div>
  );
}

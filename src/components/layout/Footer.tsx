"use client";

import Link from "next/link";
import Image from "next/image";
import { BRAND, BRANDS, FONTS } from "@/lib/constants";

const FOOTER_LINKS = {
  Shop: [
    { label: "New Arrivals", href: "/shop?filter=new" },
    { label: "Pre-Orders", href: "/shop?filter=pre-order" },
    { label: "On Hand", href: "/shop?filter=on-hand" },
    { label: "Sale", href: "/shop?filter=sale" },
  ],
  Help: [
    { label: "Track My Order", href: "/account" },
    { label: "Shipping Info", href: "/shipping" },
    { label: "Returns Policy", href: "/returns" },
    { label: "Authenticity", href: "/authenticity" },
  ],
  About: [
    { label: "Our Story", href: "/about" },
    { label: "Contact Us", href: "/contact" },
    { label: "Instagram", href: "https://instagram.com" },
    { label: "TikTok", href: "https://tiktok.com" },
  ],
};

export default function Footer() {
  return (
    <footer style={{ background: BRAND.black, fontFamily: FONTS.body }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">

        {/* Top row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 pb-12" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <div className="rounded-md px-3 py-2 inline-block mb-5" style={{ background: BRAND.bg }}>
              <Image src="/sneakndrip-logo.gif" alt="Sneak N' Drip" width={110} height={44} className="object-contain" />
            </div>
            <p className="text-sm leading-relaxed mb-5" style={{ color: "#666" }}>
              Philippines&apos; trusted source for 100% authentic sneakers. On hand and pre-order. Shipped nationwide.
            </p>
            <div className="flex gap-3">
              {[
                { name: "Facebook", icon: "f", href: "#" },
                { name: "Instagram", icon: "ig", href: "#" },
                { name: "TikTok", icon: "tt", href: "#" },
              ].map(s => (
                <a key={s.name} href={s.href}
                  className="w-9 h-9 rounded-sm flex items-center justify-center text-xs font-black transition-colors hover:opacity-80"
                  style={{ background: "rgba(255,255,255,0.06)", color: "#888" }}>
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="text-sm font-black uppercase tracking-widest mb-4" style={{ color: BRAND.bg }}>
                {heading}
              </h4>
              <ul className="space-y-2.5">
                {links.map(l => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm transition-colors hover:opacity-80"
                      style={{ color: "#666" }}
                      onMouseEnter={e => (e.currentTarget.style.color = BRAND.teal)}
                      onMouseLeave={e => (e.currentTarget.style.color = "#666")}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Payment methods */}
        <div className="py-8" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <p className="text-xs uppercase tracking-widest font-bold mb-4" style={{ color: "#444" }}>
            We Accept
          </p>
          <div className="flex flex-wrap gap-3">
            {["GCash", "Maya", "Bank Transfer", "Cash on Delivery"].map(m => (
              <span key={m} className="text-xs font-semibold px-3 py-1.5 rounded-sm"
                style={{ background: "rgba(255,255,255,0.05)", color: "#666", border: "1px solid rgba(255,255,255,0.06)" }}>
                {m}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-6">
          <p className="text-xs" style={{ color: "#3A3836" }}>
            © 2025 Sneak N&apos; Drip. All Rights Reserved.
          </p>
          <p className="text-xs" style={{ color: "#3A3836" }}>
            100% Authentic Sneakers &nbsp;·&nbsp; Philippines
          </p>
          <div className="flex gap-4">
            {["Privacy Policy", "Terms of Service"].map(l => (
              <Link key={l} href="#" className="text-xs transition-colors" style={{ color: "#3A3836" }}
                onMouseEnter={e => (e.currentTarget.style.color = BRAND.teal)}
                onMouseLeave={e => (e.currentTarget.style.color = "#3A3836")}>
                {l}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Messenger chat button */}
      <a
        href="https://m.me/sneakndrip"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl transition-transform hover:scale-110"
        style={{ background: "linear-gradient(135deg, #0084ff, #00c6ff)", boxShadow: "0 4px 20px rgba(0,132,255,0.4)" }}
        title="Chat with us on Messenger"
      >
        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.477 2 2 6.145 2 11.243c0 2.906 1.42 5.503 3.653 7.214V22l3.33-1.833c.89.247 1.832.38 2.017.38 5.523 0 10-4.145 10-9.244C21 6.145 17.523 2 12 2zm1.013 12.453l-2.55-2.72-4.975 2.72 5.474-5.81 2.61 2.72 4.914-2.72-5.473 5.81z" />
        </svg>
      </a>
    </footer>
  );
}

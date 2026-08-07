"use client";

import Link from "next/link";
import Image from "next/image";
import { BRANDS } from "@/lib/constants";

const FOOTER_LINKS = {
  Shop: [
    { label: "New Arrivals", href: "/shop?filter=new" },
    { label: "Pre-Orders",   href: "/shop?filter=pre-order" },
    { label: "On Hand",      href: "/shop?filter=on-hand" },
    { label: "Sale",         href: "/shop?filter=sale" },
  ],
  Help: [
    { label: "Track My Order", href: "/account" },
    { label: "Shipping Info",  href: "/shipping" },
    { label: "Returns Policy", href: "/returns" },
    { label: "Authenticity",   href: "/authenticity" },
  ],
  About: [
    { label: "Our Story",  href: "/about" },
    { label: "Contact Us", href: "/contact" },
    { label: "Instagram",  href: "https://www.instagram.com/sneakndripph/" },
    { label: "TikTok",     href: "https://www.tiktok.com/@sneakyjuls" },
  ],
};

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="bg-snd-black">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-16 pb-8">

        {/* Brands marquee strip */}
        <div className="overflow-x-auto pb-8 mb-8 border-b border-white/6">
          <div className="flex items-center gap-8 min-w-max">
            {BRANDS.map(b => (
              <Link
                key={b}
                href={`/shop?brand=${b}`}
                className="snd-label whitespace-nowrap transition-opacity hover:opacity-60 text-white/15"
              >
                {b}
              </Link>
            ))}
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 pb-12 border-b border-white/6">

          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <div className="inline-block mb-6">
              <Image
                src="/sneakndrip-logo.gif"
                alt="Sneak N' Drip"
                width={130}
                height={52}
                className="object-contain"
              />
            </div>
            <p className="text-sm leading-relaxed mb-6 text-white/30">
              Philippines&apos; trusted source for 100% authentic sneakers. On hand and pre-order.
            </p>
            <div className="flex gap-3">
              {[
                { name: "Facebook",  href: "https://www.facebook.com/SneakNDrip/",       Icon: FacebookIcon },
                { name: "Instagram", href: "https://www.instagram.com/sneakndripph/",     Icon: InstagramIcon },
                { name: "TikTok",    href: "https://www.tiktok.com/@sneakyjuls",           Icon: TikTokIcon },
              ].map(({ name, href, Icon }) => (
                <a
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 flex items-center justify-center transition-all hover:opacity-80 bg-white/7 hover:bg-white/12 text-white/50"
                  aria-label={name}
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="snd-label mb-5 text-white/50">
                {heading}
              </h4>
              <ul className="space-y-3">
                {links.map(l => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm transition-colors text-white/30 hover:text-snd-teal"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Payment methods */}
        <div className="py-7 border-b border-white/6">
          <p className="snd-label mb-4 text-white/20">
            We Accept
          </p>
          <div className="flex flex-wrap gap-2">
            {["GCash", "Maya", "Bank Transfer", "Cash on Delivery"].map(m => (
              <span
                key={m}
                className="text-xs font-semibold px-3 py-1.5 bg-white/5 text-white/30 border border-white/6"
              >
                {m}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6">
          <p className="text-xs text-white/20">
            © 2025 Sneak N&apos; Drip. All Rights Reserved.
          </p>
          <p className="text-xs text-white/15">
            100% Authentic &nbsp;·&nbsp; Philippines-wide Shipping
          </p>
          <div className="flex gap-5">
            {[
              { label: "Privacy",  href: "/privacy" },
              { label: "Terms",    href: "/terms" },
            ].map(l => (
              <Link
                key={l.label}
                href={l.href}
                className="text-xs transition-colors text-white/20 hover:text-white/50"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Messenger chat button */}
      <a
        href="https://m.me/SneakNDrip"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-40 w-13 h-13 flex items-center justify-center text-white shadow-2xl transition-transform hover:scale-105"
        style={{
          background: "linear-gradient(135deg, #0084ff, #00c6ff)",
          boxShadow: "0 4px 20px rgba(0,132,255,0.4)",
          width: "52px",
          height: "52px",
        }}
        title="Chat with us on Messenger"
        aria-label="Chat with us on Messenger"
      >
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.477 2 2 6.145 2 11.243c0 2.906 1.42 5.503 3.653 7.214V22l3.33-1.833c.89.247 1.832.38 2.017.38 5.523 0 10-4.145 10-9.244C21 6.145 17.523 2 12 2zm1.013 12.453l-2.55-2.72-4.975 2.72 5.474-5.81 2.61 2.72 4.914-2.72-5.473 5.81z" />
        </svg>
      </a>
    </footer>
  );
}

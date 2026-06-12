"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import { BRAND, FONTS } from "@/lib/constants";
import { ShoppingBag, Search, User, Menu, X, Heart } from "lucide-react";

const NAV_LINKS = [
  { label: "Shop", href: "/shop" },
  { label: "New Arrivals", href: "/shop?filter=new" },
  { label: "On Hand", href: "/shop?filter=on-hand" },
  { label: "Pre-Orders", href: "/shop?filter=pre-order" },
  { label: "Brands", href: "/brands" },
  { label: "About", href: "/about" },
];

export default function Navbar() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const itemCount = useCartStore(s => s.itemCount());
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchInputRef.current?.focus(), 50);
  }, [searchOpen]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
    setSearchOpen(false);
    setSearchQuery("");
  }

  return (
    <nav
      className="sticky top-0 z-50 transition-shadow duration-300"
      style={{
        background: "rgba(242,240,239,0.96)",
        backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${BRAND.border}`,
        boxShadow: scrolled ? "0 2px 20px rgba(13,13,13,0.06)" : "none",
        fontFamily: FONTS.body,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" prefetch={false} className="shrink-0">
            <Image
              src="/sneakndrip-logo.gif"
              alt="Sneak N' Drip"
              width={130}
              height={52}
              className="object-contain"
              priority
            />
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map(l => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm font-medium transition-colors hover:opacity-100"
                style={{ color: BRAND.muted }}
                onMouseEnter={e => (e.currentTarget.style.color = BRAND.teal)}
                onMouseLeave={e => (e.currentTarget.style.color = BRAND.muted)}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Icons */}
          <div className="flex items-center gap-3">
            <button onClick={() => setSearchOpen(o => !o)} className="p-2 rounded-sm transition-opacity hover:opacity-60" style={{ color: searchOpen ? BRAND.teal : BRAND.muted }}>
              {searchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
            </button>
            <Link href="/account" className="p-2 rounded-sm transition-opacity hover:opacity-60" style={{ color: BRAND.muted }}>
              <User className="w-4 h-4" />
            </Link>
            <Link href="/wishlist" className="p-2 rounded-sm transition-opacity hover:opacity-60" style={{ color: BRAND.muted }}>
              <Heart className="w-4 h-4" />
            </Link>
            <Link href="/cart" className="relative p-2 rounded-sm transition-opacity hover:opacity-80" style={{ color: BRAND.black }}>
              <ShoppingBag className="w-5 h-5" />
              {mounted && itemCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-black"
                  style={{ background: BRAND.teal }}
                >
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2"
              style={{ color: BRAND.black }}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Search overlay */}
      {searchOpen && (
        <div className="border-t" style={{ background: BRAND.card, borderColor: BRAND.border }}>
          <form onSubmit={handleSearch} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: BRAND.muted }} />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search sneakers, brands…"
                className="w-full pl-11 pr-4 py-3 text-sm focus:outline-none"
                style={{ background: BRAND.bg, border: `1px solid ${BRAND.teal}`, color: BRAND.black }}
              />
            </div>
            <button type="submit"
              className="px-6 py-3 text-sm font-black uppercase tracking-widest"
              style={{ background: BRAND.black, color: BRAND.bg }}>
              Search
            </button>
          </form>
        </div>
      )}

      {/* Mobile Menu */}
      {menuOpen && (
        <div
          className="md:hidden px-4 py-5 space-y-1"
          style={{ borderTop: `1px solid ${BRAND.border}`, background: BRAND.bg }}
        >
          {NAV_LINKS.map(l => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="block py-3 text-sm font-medium border-b"
              style={{ color: BRAND.muted, borderColor: BRAND.border }}
            >
              {l.label}
            </Link>
          ))}
          <div className="flex gap-3 pt-4">
            <Link href="/account" onClick={() => setMenuOpen(false)}
              className="flex-1 py-3 text-center text-sm font-bold uppercase tracking-wider rounded-sm"
              style={{ border: `1.5px solid ${BRAND.border}`, color: BRAND.black }}>
              Account
            </Link>
            <Link href="/cart" onClick={() => setMenuOpen(false)}
              className="flex-1 py-3 text-center text-sm font-bold uppercase tracking-wider rounded-sm text-white"
              style={{ background: BRAND.teal }}>
              Cart {mounted && itemCount > 0 && `(${itemCount})`}
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

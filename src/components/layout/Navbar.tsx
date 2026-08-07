"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import { ShoppingBag, Search, User, Menu, X, Heart, Bell } from "lucide-react";

const NAV_LINKS = [
  { label: "Shop",        href: "/shop" },
  { label: "New Arrivals", href: "/shop?filter=new" },
  { label: "On Hand",     href: "/shop?filter=on-hand" },
  { label: "Pre-Orders",  href: "/shop?filter=pre-order" },
  { label: "Brands",      href: "/brands" },
  { label: "About",       href: "/about" },
];

type SearchProduct = {
  id: string; name: string; brand: string; slug: string;
  images: string[] | null; bg: string | null; full_payment_price: number;
};

export default function Navbar() {
  const router = useRouter();
  const [menuOpen, setMenuOpen]     = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [scrolled, setScrolled]     = useState(false);
  const [mounted, setMounted]       = useState(false);
  const [searchResults, setSearchResults] = useState<SearchProduct[]>([]);
  const [showResults, setShowResults]     = useState(false);
  const [notifications, setNotifications] = useState<{
    id: string; title: string; message: string;
    order_number: string | null; is_read: boolean; created_at: string;
  }[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);

  const itemCount    = useCartStore(s => s.itemCount());
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchBoxRef   = useRef<HTMLDivElement>(null);
  const notifRef       = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    fetch("/api/notifications")
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.notifications) setNotifications(data.notifications); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchInputRef.current?.focus(), 50);
    if (!searchOpen) { setSearchResults([]); setShowResults(false); setSearchQuery(""); }
  }, [searchOpen]);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) setShowResults(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) { setSearchResults([]); setShowResults(false); return; }
    let cancelled = false;
    fetch(`/api/search?q=${encodeURIComponent(q)}`)
      .then(res => res.ok ? res.json() as Promise<{ products: SearchProduct[] }> : null)
      .then(data => {
        if (!cancelled && data?.products) { setSearchResults(data.products); setShowResults(true); }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [searchQuery]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
    setSearchOpen(false);
    setSearchQuery("");
    setShowResults(false);
  }

  function closeSearch() {
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  function openNotifications() {
    setNotifOpen(o => !o);
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: unreadIds }),
      }).catch(() => {});
    }
  }

  return (
    <nav
      className="sticky top-0 z-50 backdrop-blur-lg border-b border-snd-border transition-shadow duration-300"
      style={{
        background: scrolled ? "rgba(242,240,239,0.97)" : "rgba(242,240,239,0.96)",
        boxShadow: scrolled ? "var(--shadow-sm)" : "none",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" prefetch={false} className="shrink-0">
            <Image
              src="/sneakndrip-logo.gif"
              alt="Sneak N' Drip"
              width={120}
              height={48}
              className="object-contain"
              priority
            />
          </Link>

          {/* Desktop Links */}
          <div className="hidden lg:flex items-center gap-7">
            {NAV_LINKS.map(l => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-snd-muted transition-colors hover:text-snd-black"
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Action icons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSearchOpen(o => !o)}
              className={`p-2.5 transition-opacity hover:opacity-60 ${searchOpen ? "text-snd-teal" : "text-snd-muted"}`}
              aria-label="Search"
            >
              {searchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
            </button>

            <Link
              href="/account"
              className="p-2.5 transition-opacity hover:opacity-60 text-snd-muted"
              aria-label="Account"
            >
              <User className="w-4 h-4" />
            </Link>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={openNotifications}
                className={`relative p-2.5 transition-opacity hover:opacity-60 ${notifOpen ? "text-snd-teal" : "text-snd-muted"}`}
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {mounted && unreadCount > 0 && (
                  <span className="absolute top-1 right-1 text-white flex items-center justify-center font-black bg-snd-red text-[9px] w-3.5 h-3.5 leading-none">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-80 z-[60] overflow-hidden animate-slide-down bg-snd-card border border-snd-border"
                  style={{ boxShadow: "var(--shadow-lg)" }}
                >
                  <div className="px-5 py-3.5 border-b border-snd-border">
                    <p className="snd-label text-snd-black">
                      Notifications
                    </p>
                  </div>

                  {notifications.length === 0 ? (
                    <p className="px-5 py-8 text-sm text-center text-snd-muted">
                      No notifications yet
                    </p>
                  ) : (
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.map((n, i) => (
                        <div
                          key={n.id}
                          className={`px-5 py-3.5 ${i < notifications.length - 1 ? "border-b border-snd-border" : ""} ${n.is_read ? "bg-transparent" : "bg-snd-teal/[6%]"}`}
                        >
                          <p className="text-xs font-bold mb-0.5 text-snd-black">
                            {n.title}
                          </p>
                          <p className="text-xs leading-relaxed text-snd-muted">
                            {n.message}
                          </p>
                          {n.order_number && (
                            <p className="snd-label mt-1.5 text-snd-teal">
                              {n.order_number}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="px-5 py-3 border-t border-snd-border">
                    <Link
                      href="/account"
                      onClick={() => setNotifOpen(false)}
                      className="text-xs font-bold block text-center transition-opacity hover:opacity-70 text-snd-teal"
                    >
                      View Orders →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/wishlist"
              className="p-2.5 transition-opacity hover:opacity-60 text-snd-muted"
              aria-label="Wishlist"
            >
              <Heart className="w-4 h-4" />
            </Link>

            <Link
              href="/cart"
              className="relative p-2.5 transition-opacity hover:opacity-70 text-snd-black"
              aria-label="Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {mounted && itemCount > 0 && (
                <span className="absolute top-1 right-0.5 text-white flex items-center justify-center font-black bg-snd-teal text-[9px] w-3.5 h-3.5 leading-none">
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </Link>

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden p-2.5 ml-1 text-snd-black"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Search bar */}
      {searchOpen && (
        <div className="animate-slide-down border-t border-snd-border bg-snd-bg">
          <form
            onSubmit={handleSearch}
            className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-4 flex gap-3"
          >
            <div className="relative flex-1" ref={searchBoxRef}>
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-snd-muted" />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search sneakers, brands…"
                className="w-full pl-11 pr-4 py-3 text-sm focus:outline-none bg-snd-card border border-snd-border text-snd-black"
                onFocus={() => { if (searchResults.length > 0) setShowResults(true); }}
              />

              {/* Live results */}
              {showResults && (
                <div
                  className="absolute top-full left-0 right-0 mt-1 z-[60] overflow-hidden animate-slide-down bg-snd-card border border-snd-border"
                  style={{ boxShadow: "var(--shadow-lg)" }}
                >
                  {searchResults.length === 0 ? (
                    <p className="px-5 py-3.5 text-sm text-snd-muted">
                      No results for &ldquo;{searchQuery}&rdquo;
                    </p>
                  ) : (
                    <>
                      {searchResults.map((p, i) => (
                        <Link
                          key={p.id}
                          href={`/shop/${p.slug}`}
                          onClick={closeSearch}
                          className={`flex items-center gap-3.5 px-5 py-3 transition-opacity hover:opacity-75 ${i < searchResults.length - 1 ? "border-b border-snd-border" : ""}`}
                        >
                          <div
                            className="w-10 h-10 shrink-0 overflow-hidden relative"
                            style={{ background: p.bg || "#EDE9E3" }}
                          >
                            {p.images?.[0] && (
                              <Image
                                src={p.images[0]}
                                alt={p.name}
                                fill
                                className="object-cover"
                                sizes="40px"
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate text-snd-black">
                              {p.name}
                            </p>
                            <p className="text-xs text-snd-muted">
                              {p.brand} &nbsp;·&nbsp; ₱{p.full_payment_price.toLocaleString()}
                            </p>
                          </div>
                        </Link>
                      ))}
                      <button
                        type="submit"
                        className="w-full text-xs font-bold px-5 py-3 text-center transition-opacity hover:opacity-70 text-snd-teal border-t border-snd-border"
                      >
                        See all results for &ldquo;{searchQuery}&rdquo; →
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="px-7 py-3 text-sm font-black uppercase tracking-widest transition-opacity hover:opacity-80 bg-snd-black text-snd-bg"
            >
              Search
            </button>
          </form>
        </div>
      )}

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden animate-slide-down border-t border-snd-border bg-snd-bg">
          <div className="px-6 py-5">
            {NAV_LINKS.map((l, i) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className={`block py-3.5 text-sm font-medium text-snd-muted ${i < NAV_LINKS.length - 1 ? "border-b border-snd-border" : ""}`}
              >
                {l.label}
              </Link>
            ))}
            <div className="flex gap-3 pt-6">
              <Link
                href="/account"
                onClick={() => setMenuOpen(false)}
                className="flex-1 py-3.5 text-center text-sm font-bold uppercase tracking-wider transition-opacity hover:opacity-80 border-[1.5px] border-snd-border text-snd-black"
              >
                Account
              </Link>
              <Link
                href="/cart"
                onClick={() => setMenuOpen(false)}
                className="flex-1 py-3.5 text-center text-sm font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-90 bg-snd-teal"
              >
                Cart {mounted && itemCount > 0 && `(${itemCount})`}
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

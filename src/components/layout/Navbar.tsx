"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useCartStore } from "@/store/cartStore";
import SearchAutocomplete from "@/components/search/SearchAutocomplete";
import { ShoppingBag, Search, User, Menu, X, Bell, Heart } from "lucide-react";

const PRIMARY_LINKS = [
  { label: "Shop", href: "/shop" },
  { label: "New",  href: "/shop?filter=new" },
  { label: "About", href: "/about" },
];

const SECONDARY_LINKS = [
  { label: "On Hand",    href: "/shop?filter=on-hand" },
  { label: "Pre-Orders", href: "/shop?filter=pre-order" },
  { label: "Brands",     href: "/brands" },
  { label: "Wishlist",   href: "/wishlist" },
];

const EASE_SMOOTH = [0.16, 1, 0.3, 1] as const;

type NotifItem = {
  id: string; title: string; message: string;
  order_number: string | null; is_read: boolean; created_at: string;
};

function NotificationList({ notifications }: { notifications: NotifItem[] }) {
  if (notifications.length === 0) {
    return <p className="px-5 py-8 text-body-sm text-center text-ink-3">No notifications yet</p>;
  }
  return (
    <div className="max-h-80 overflow-y-auto">
      {notifications.map((n, i) => (
        <div
          key={n.id}
          className={`px-5 py-3.5 ${i < notifications.length - 1 ? "border-b border-line" : ""} ${n.is_read ? "" : "bg-paper-2"}`}
        >
          <p className="text-body-sm font-medium mb-0.5 text-ink">{n.title}</p>
          <p className="text-micro leading-relaxed text-ink-3">{n.message}</p>
          {n.order_number && <p className="text-eyebrow mt-1.5 text-ink-3">{n.order_number}</p>}
        </div>
      ))}
    </div>
  );
}

export default function Navbar() {
  const [menuOpen, setMenuOpen]     = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled]     = useState(false);
  const [mounted, setMounted]       = useState(false);
  const [notifications, setNotifications] = useState<NotifItem[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);

  const itemCount      = useCartStore(s => s.itemCount());
  const searchWrapRef   = useRef<HTMLDivElement>(null);
  const searchMobileRef = useRef<HTMLDivElement>(null);
  const notifRef       = useRef<HTMLDivElement>(null);
  const drawerRef      = useRef<HTMLDivElement>(null);
  const closeBtnRef    = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
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
    function handle(e: MouseEvent) {
      const t = e.target as Node;
      if (searchWrapRef.current?.contains(t)) return;
      if (searchMobileRef.current?.contains(t)) return;
      setSearchOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  useEffect(() => {
    if (!searchOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSearchOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [searchOpen]);

  // Body scroll lock while the mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  // Focus trap for the mobile drawer
  useEffect(() => {
    if (!menuOpen) return;
    closeBtnRef.current?.focus();
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") { setMenuOpen(false); return; }
      if (e.key !== "Tab" || !drawerRef.current) return;
      const focusable = drawerRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [menuOpen]);

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

  const focusRing = "focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2";
  const wordmark = "font-display font-semibold text-[15px] tracking-[-0.01em] text-ink";

  return (
    <header className={`sticky top-0 z-50 bg-paper border-b transition-colors duration-fast ${scrolled ? "border-line-strong" : "border-line"}`}>
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
        <div className="grid grid-cols-3 items-center h-14 md:flex md:items-center md:justify-between md:h-16">
          {/* Left */}
          <div className="flex items-center">
            <button
              onClick={() => setMenuOpen(true)}
              className={`md:hidden w-11 h-11 -ml-2 flex items-center justify-center text-ink ${focusRing}`}
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link href="/" prefetch={false} className={`hidden md:block ${wordmark} ${focusRing}`}>
              SNEAK N&apos; DRIP
            </Link>
          </div>

          {/* Mobile wordmark — centered */}
          <div className="flex justify-center md:hidden">
            <Link href="/" prefetch={false} className={`${wordmark} ${focusRing}`}>
              SNEAK N&apos; DRIP
            </Link>
          </div>

          {/* Desktop primary nav — centered */}
          <nav className="hidden md:flex items-center justify-center gap-8" aria-label="Primary">
            {PRIMARY_LINKS.map(l => (
              <Link
                key={l.href}
                href={l.href}
                className={`group/link relative text-body-sm text-ink hover:text-ink-3 transition-colors duration-fast ${focusRing}`}
              >
                {l.label}
                <span className="absolute left-0 -bottom-1 h-px w-0 bg-line-strong transition-all duration-150 group-hover/link:w-full" />
              </Link>
            ))}
          </nav>

          {/* Right — icons */}
          <div className="flex items-center justify-end gap-0.5 md:gap-1">
            <div className="relative" ref={searchWrapRef}>
              <button
                onClick={() => setSearchOpen(o => !o)}
                className={`w-11 h-11 flex items-center justify-center transition-colors ${searchOpen ? "text-ink" : "text-ink-3 hover:text-ink"} ${focusRing}`}
                aria-label={searchOpen ? "Close search" : "Search"}
              >
                {searchOpen ? <X className="w-[18px] h-[18px]" /> : <Search className="w-[18px] h-[18px]" />}
              </button>

              <AnimatePresence>
                {searchOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="hidden md:block absolute right-0 top-full mt-2 w-96 z-[60]"
                  >
                    <SearchAutocomplete autoFocus onNavigate={() => setSearchOpen(false)} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Notifications — desktop only */}
            <div className="hidden md:block relative" ref={notifRef}>
              <button
                onClick={openNotifications}
                className={`relative w-11 h-11 flex items-center justify-center transition-colors ${notifOpen ? "text-ink" : "text-ink-3 hover:text-ink"} ${focusRing}`}
                aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
              >
                <Bell className="w-[18px] h-[18px]" />
                {mounted && unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-state-error" />
                )}
              </button>

              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-80 z-[60] overflow-hidden rounded-md bg-paper border border-line shadow-[var(--shadow-lg)]"
                  >
                    <div className="px-5 py-3.5 border-b border-line">
                      <p className="text-eyebrow text-ink-3">Notifications</p>
                    </div>
                    <NotificationList notifications={notifications} />
                    <div className="px-5 py-3 border-t border-line">
                      <Link
                        href="/account"
                        onClick={() => setNotifOpen(false)}
                        className={`text-body-sm font-medium block text-center text-ink hover:text-ink-3 transition-colors ${focusRing}`}
                      >
                        View Orders →
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link
              href="/wishlist"
              className={`hidden md:inline-flex w-11 h-11 items-center justify-center text-ink hover:text-ink-3 transition-colors ${focusRing}`}
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5" />
            </Link>

            <Link
              href="/account"
              className={`hidden md:inline-flex w-11 h-11 items-center justify-center text-ink hover:text-ink-3 transition-colors ${focusRing}`}
              aria-label="Account"
            >
              <User className="w-5 h-5" />
            </Link>

            <Link
              href="/cart"
              className={`relative w-11 h-11 flex items-center justify-center text-ink ${focusRing}`}
              aria-label={mounted && itemCount > 0 ? `Cart, ${itemCount} items` : "Cart"}
            >
              <ShoppingBag className="w-5 h-5" />
              {mounted && itemCount > 0 && (
                <span className="absolute top-1.5 right-1.5 bg-ink text-paper rounded-full text-[10px] w-4 h-4 flex items-center justify-center leading-none">
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile search overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            ref={searchMobileRef}
            role="dialog"
            aria-modal="true"
            aria-label="Search"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[70] bg-paper md:hidden flex flex-col"
          >
            <div className="flex items-center gap-2 h-14 px-4 border-b border-line shrink-0">
              <SearchAutocomplete autoFocus onNavigate={() => setSearchOpen(false)} className="flex-1" />
              <button
                onClick={() => setSearchOpen(false)}
                className={`w-11 h-11 -mr-2 flex items-center justify-center text-ink shrink-0 ${focusRing}`}
                aria-label="Close search"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile drawer */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.28, ease: EASE_SMOOTH }}
            className="fixed inset-0 z-[70] bg-paper md:hidden flex flex-col"
          >
            <div className="flex items-center justify-between h-14 px-4 border-b border-line shrink-0">
              <span className={wordmark}>SNEAK N&apos; DRIP</span>
              <button
                ref={closeBtnRef}
                onClick={() => setMenuOpen(false)}
                className={`w-11 h-11 -mr-2 flex items-center justify-center text-ink ${focusRing}`}
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-8">
              <div className="flex flex-col gap-1">
                {PRIMARY_LINKS.map(l => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setMenuOpen(false)}
                    className={`text-display-s font-display text-ink py-2 ${focusRing}`}
                  >
                    {l.label}
                  </Link>
                ))}
              </div>

              <div className="flex flex-col gap-0.5 mt-8 pt-8 border-t border-line">
                {SECONDARY_LINKS.map(l => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setMenuOpen(false)}
                    className={`text-body-sm text-ink-2 py-2.5 ${focusRing}`}
                  >
                    {l.label}
                  </Link>
                ))}
              </div>

              {notifOpen && (
                <div className="mt-8 pt-8 border-t border-line">
                  <p className="text-eyebrow text-ink-3 mb-2">Notifications</p>
                  <NotificationList notifications={notifications} />
                </div>
              )}
            </div>

            <div className="border-t border-line px-6 py-4 flex items-center justify-between shrink-0">
              <button
                onClick={openNotifications}
                className={`relative flex items-center gap-2 text-body-sm text-ink ${focusRing}`}
                aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
              >
                <Bell className="w-[18px] h-[18px]" />
                Notifications
                {mounted && unreadCount > 0 && (
                  <span className="bg-ink text-paper rounded-full text-[10px] w-4 h-4 flex items-center justify-center leading-none">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              <Link
                href="/account"
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-2 text-body-sm text-ink ${focusRing}`}
              >
                <User className="w-[18px] h-[18px]" />
                Account
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { LayoutDashboard, Package, ShoppingBag, Users, Settings, ChevronRight, Menu, X, LogOut, MessageSquare, MessageCircle, UserCog, FileText, Tag, BarChart2, History, TrendingUp, Bell } from "lucide-react";
import { BRAND, FONTS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

const NAV = [
  { href: "/admin",           icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/products",  icon: Package,         label: "Products" },
  { href: "/admin/orders",    icon: ShoppingBag,     label: "Orders" },
  { href: "/admin/customers", icon: Users,           label: "Customers" },
  { href: "/admin/sales",     icon: TrendingUp,      label: "Sales" },
  { href: "/admin/coupons",   icon: Tag,             label: "Coupons" },
  { href: "/admin/inventory", icon: BarChart2,       label: "Inventory Log" },
  { href: "/admin/reviews",   icon: MessageSquare,   label: "Reviews" },
  { href: "/admin/chat",      icon: MessageCircle,   label: "Chat" },
  { href: "/admin/content",   icon: FileText,        label: "Pages" },
  { href: "/admin/users",     icon: UserCog,         label: "Users" },
  { href: "/admin/activity",  icon: History,         label: "Activity" },
  { href: "/admin/settings",  icon: Settings,        label: "Settings" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    fetch("/api/admin/notifications")
      .then(r => r.json())
      .then(d => setNotifCount(d.total ?? 0))
      .catch(() => {});
    const interval = setInterval(() => {
      fetch("/api/admin/notifications")
        .then(r => r.json())
        .then(d => setNotifCount(d.total ?? 0))
        .catch(() => {});
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const Sidebar = () => (
    <aside className="flex flex-col h-full" style={{ background: BRAND.black }}>
      {/* Logo */}
      <div className="p-5 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="rounded px-2 py-1" style={{ background: BRAND.bg }}>
          <Image src="/sneakndrip-logo.gif" alt="SND" width={90} height={36} className="object-contain" />
        </div>
        <span className="text-xs font-bold uppercase tracking-widest px-2 py-0.5"
          style={{ background: `${BRAND.teal}20`, color: BRAND.teal }}>Admin</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {NAV.map(item => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}
              onClick={() => setSidebarOpen(false)}
              className="flex items-center justify-between px-4 py-3 rounded-lg transition-all text-sm font-semibold"
              style={{
                background: active ? `${BRAND.teal}15` : "transparent",
                color: active ? BRAND.teal : "#666",
                borderLeft: active ? `3px solid ${BRAND.teal}` : "3px solid transparent",
              }}>
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4" />
                {item.label}
              </div>
              {active && <ChevronRight className="w-3 h-3" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-4 space-y-3" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <Link href="/admin/orders?status=pending" className="flex items-center justify-between transition-opacity hover:opacity-80">
          <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: "#666" }}>
            <Bell className="w-3.5 h-3.5" /> Notifications
          </div>
          {notifCount > 0 && (
            <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full"
              style={{ background: BRAND.red, color: "#fff" }}>
              {notifCount}
            </span>
          )}
        </Link>
        <button onClick={handleSignOut} className="flex items-center gap-2 text-xs font-semibold transition-opacity hover:opacity-60" style={{ color: "#555" }}>
          <LogOut className="w-3.5 h-3.5" /> Log Out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen flex" style={{ fontFamily: FONTS.body }}>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-col w-56 shrink-0 h-screen sticky top-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-56">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 sticky top-0 z-40"
          style={{ background: BRAND.card, borderBottom: `1px solid ${BRAND.border}` }}>
          <button onClick={() => setSidebarOpen(true)} style={{ color: BRAND.black }}>
            <Menu className="w-5 h-5" />
          </button>
          <span style={{ fontFamily: FONTS.display, fontSize: "1.2rem", color: BRAND.black }}>ADMIN</span>
          <Link href="/admin/orders?status=pending" className="relative p-1" style={{ color: BRAND.black }}>
            <Bell className="w-5 h-5" />
            {notifCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black"
                style={{ background: BRAND.red, color: "#fff" }}>
                {notifCount > 9 ? "9+" : notifCount}
              </span>
            )}
          </Link>
        </div>

        <div className="flex-1 p-4 sm:p-6 lg:p-8" style={{ background: "#F5F3F2" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

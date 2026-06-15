"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { LayoutDashboard, Package, ShoppingBag, Users, Settings, ChevronRight, Menu, X, LogOut, MessageSquare, MessageCircle, UserCog, FileText, Tag, BarChart2, History, TrendingUp, RotateCcw } from "lucide-react";
import { BRAND, FONTS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

type NotifCounts = { pendingOrders: number; pendingReviews: number; pendingReturns: number };
type BadgeKey = "pendingOrders" | "pendingReviews" | "pendingReturns";

const NAV: { href: string; icon: React.ElementType; label: string; badgeKey: BadgeKey | null }[] = [
  { href: "/admin",           icon: LayoutDashboard, label: "Dashboard",     badgeKey: null },
  { href: "/admin/products",  icon: Package,         label: "Products",      badgeKey: null },
  { href: "/admin/orders",    icon: ShoppingBag,     label: "Orders",        badgeKey: "pendingOrders" },
  { href: "/admin/customers", icon: Users,           label: "Customers",     badgeKey: null },
  { href: "/admin/sales",     icon: TrendingUp,      label: "Sales",         badgeKey: null },
  { href: "/admin/coupons",   icon: Tag,             label: "Coupons",       badgeKey: null },
  { href: "/admin/inventory", icon: BarChart2,       label: "Inventory Log", badgeKey: null },
  { href: "/admin/reviews",   icon: MessageSquare,   label: "Reviews",       badgeKey: "pendingReviews" },
  { href: "/admin/returns",   icon: RotateCcw,       label: "Returns",       badgeKey: "pendingReturns" as BadgeKey },
  { href: "/admin/chat",      icon: MessageCircle,   label: "Chat",          badgeKey: null },
  { href: "/admin/content",   icon: FileText,        label: "Pages",         badgeKey: null },
  { href: "/admin/users",     icon: UserCog,         label: "Users",         badgeKey: null },
  { href: "/admin/activity",  icon: History,         label: "Activity",      badgeKey: null },
  { href: "/admin/settings",  icon: Settings,        label: "Settings",      badgeKey: null },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifs, setNotifs] = useState<NotifCounts>({ pendingOrders: 0, pendingReviews: 0, pendingReturns: 0 });

  useEffect(() => {
    function load() {
      fetch("/api/admin/notifications")
        .then(r => r.json())
        .then(d => setNotifs({ pendingOrders: d.pendingOrders ?? 0, pendingReviews: d.pendingReviews ?? 0, pendingReturns: d.pendingReturns ?? 0 }))
        .catch(() => {});
    }
    load();
    const supabase = createClient();
    const channel = supabase
      .channel("admin-notifs-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "reviews" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "return_requests" }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
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
          const count = item.badgeKey ? notifs[item.badgeKey] : 0;
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
              <div className="flex items-center gap-1.5">
                {count > 0 && (
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center"
                    style={{ background: BRAND.red, color: "#fff" }}>
                    {count > 99 ? "99+" : count}
                  </span>
                )}
                {active && <ChevronRight className="w-3 h-3" />}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-4" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
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
          <div className="flex items-center gap-3">
            {(notifs.pendingOrders > 0 || notifs.pendingReviews > 0) && (
              <Link href="/admin/orders?status=pending" className="relative flex items-center gap-1 text-xs font-bold px-2 py-1 rounded"
                style={{ background: `${BRAND.red}15`, color: BRAND.red }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: BRAND.red }} />
                {notifs.pendingOrders + notifs.pendingReviews}
              </Link>
            )}
            <div className="w-5" />
          </div>
        </div>

        <div className="flex-1 p-4 sm:p-6 lg:p-8" style={{ background: "#F5F3F2" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

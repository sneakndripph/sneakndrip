"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard, Package, ShoppingBag, Users, Settings, Menu, X, LogOut,
  MessageSquare, MessageCircle, UserCog, FileText, Tag, BarChart2, History,
  TrendingUp, RotateCcw,
} from "lucide-react";
import { BRAND, FONTS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

type NotifCounts = { pendingOrders: number; pendingReviews: number; pendingReturns: number; lowStock: number };
type BadgeKey = "pendingOrders" | "pendingReviews" | "pendingReturns" | "lowStock";
type NavItem = { href: string; icon: React.ElementType; label: string; badgeKey: BadgeKey | null };

const NAV_SECTIONS: { label: string | null; items: NavItem[] }[] = [
  {
    label: null,
    items: [
      { href: "/admin",           icon: LayoutDashboard, label: "Dashboard",  badgeKey: null },
      { href: "/admin/products",  icon: Package,         label: "Products",   badgeKey: null },
      { href: "/admin/orders",    icon: ShoppingBag,     label: "Orders",     badgeKey: "pendingOrders" },
      { href: "/admin/customers", icon: Users,           label: "Customers",  badgeKey: null },
    ],
  },
  {
    label: "Growth",
    items: [
      { href: "/admin/sales",     icon: TrendingUp,    label: "Sales",     badgeKey: null },
      { href: "/admin/coupons",   icon: Tag,           label: "Marketing", badgeKey: null },
      { href: "/admin/inventory", icon: BarChart2,     label: "Inventory", badgeKey: "lowStock" as BadgeKey },
      { href: "/admin/reviews",   icon: MessageSquare, label: "Reviews",   badgeKey: "pendingReviews" },
      { href: "/admin/returns",   icon: RotateCcw,     label: "Returns",   badgeKey: "pendingReturns" as BadgeKey },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/chat",     icon: MessageCircle, label: "Chat",     badgeKey: null },
      { href: "/admin/content",  icon: FileText,      label: "Pages",    badgeKey: null },
      { href: "/admin/users",    icon: UserCog,       label: "Users",    badgeKey: null },
      { href: "/admin/activity", icon: History,       label: "Activity", badgeKey: null },
      { href: "/admin/settings", icon: Settings,      label: "Settings", badgeKey: null },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/admin/login") return <>{children}</>;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifs, setNotifs] = useState<NotifCounts>({
    pendingOrders: 0, pendingReviews: 0, pendingReturns: 0, lowStock: 0,
  });

  useEffect(() => {
    function load() {
      fetch("/api/admin/notifications")
        .then(r => r.json())
        .then(d => setNotifs({
          pendingOrders:  d.pendingOrders  ?? 0,
          pendingReviews: d.pendingReviews ?? 0,
          pendingReturns: d.pendingReturns ?? 0,
          lowStock:       d.lowStock       ?? 0,
        }))
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

  const totalAlerts = notifs.pendingOrders + notifs.pendingReviews + notifs.pendingReturns;

  const Sidebar = () => (
    <aside
      className="flex flex-col h-full"
      style={{
        background: "#111111",
        borderRight: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {/* Logo */}
      <div
        className="px-5 h-14 flex items-center gap-3 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div style={{ background: BRAND.bg, padding: "3px 6px" }}>
          <Image
            src="/sneakndrip-logo.gif"
            alt="SND"
            width={68}
            height={26}
            className="object-contain"
          />
        </div>
        <span
          className="snd-label"
          style={{ color: "rgba(255,255,255,0.25)", fontFamily: FONTS.body }}
        >
          Admin
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {NAV_SECTIONS.map((section, si) => (
          <div key={si} className={si > 0 ? "mt-6" : ""}>
            {section.label && (
              <p
                className="snd-label px-2 mb-2"
                style={{ color: "rgba(255,255,255,0.2)", fontFamily: FONTS.body }}
              >
                {section.label}
              </p>
            )}
            <div className="space-y-px">
              {section.items.map(item => {
                const Icon = item.icon;
                const active = pathname === item.href;
                const count = item.badgeKey ? notifs[item.badgeKey] : 0;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center justify-between px-3 py-2 text-sm transition-all"
                    style={{
                      color: active ? "#fff" : "rgba(255,255,255,0.38)",
                      background: active ? "rgba(255,255,255,0.07)" : "transparent",
                      borderLeft: active ? `2px solid ${BRAND.teal}` : "2px solid transparent",
                    }}
                    onMouseEnter={e => {
                      if (!active) e.currentTarget.style.color = "rgba(255,255,255,0.7)";
                    }}
                    onMouseLeave={e => {
                      if (!active) e.currentTarget.style.color = "rgba(255,255,255,0.38)";
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className="w-[14px] h-[14px] shrink-0"
                        style={{ opacity: active ? 1 : 0.6 }}
                      />
                      <span className="font-medium text-[13px]">{item.label}</span>
                    </div>
                    {count > 0 && (
                      <span
                        className="font-black text-white"
                        style={{
                          fontSize: "9px",
                          padding: "2px 5px",
                          background: item.badgeKey === "lowStock" ? "#D97706" : BRAND.red,
                          lineHeight: 1.4,
                        }}
                      >
                        {count > 99 ? "99+" : count}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div
        className="px-3 py-3 shrink-0"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2.5 px-3 py-2 w-full text-[13px] transition-colors"
          style={{ color: "rgba(255,255,255,0.25)" }}
          onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.25)")}
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>
    </aside>
  );

  return (
    <div
      className="min-h-screen flex"
      style={{ fontFamily: FONTS.body, background: "#F5F3F1" }}
    >
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-col w-52 shrink-0 h-screen sticky top-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 animate-fade-in"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-52 animate-slide-up">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <div
          className="lg:hidden flex items-center justify-between px-5 h-14 sticky top-0 z-40"
          style={{
            background: "#111111",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            <Menu className="w-5 h-5" />
          </button>
          <span
            style={{
              fontFamily: FONTS.display,
              fontSize: "1.1rem",
              color: "#fff",
              letterSpacing: "0.1em",
            }}
          >
            ADMIN
          </span>
          <div className="flex items-center gap-2">
            {totalAlerts > 0 && (
              <Link
                href="/admin/orders?status=pending"
                className="snd-label px-2.5 py-1"
                style={{
                  background: `${BRAND.red}18`,
                  color: BRAND.red,
                  fontFamily: FONTS.body,
                }}
              >
                {totalAlerts} pending
              </Link>
            )}
            {sidebarOpen ? (
              <button onClick={() => setSidebarOpen(false)} style={{ color: "rgba(255,255,255,0.5)" }}>
                <X className="w-5 h-5" />
              </button>
            ) : null}
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 p-5 sm:p-6 lg:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}

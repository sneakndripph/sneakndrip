"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Package, ShoppingBag, Users, Settings, Menu, X, LogOut,
  Star, MessageCircle, UserCog, FileText, Tag, Warehouse, Activity,
  TrendingUp, RotateCcw,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type NotifCounts = { pendingOrders: number; pendingReviews: number; pendingReturns: number; lowStock: number };
type BadgeKey = keyof NotifCounts;
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
      { href: "/admin/sales",     icon: TrendingUp, label: "Sales",     badgeKey: null },
      { href: "/admin/coupons",   icon: Tag,         label: "Marketing", badgeKey: null },
      { href: "/admin/inventory", icon: Warehouse,   label: "Inventory", badgeKey: "lowStock" },
      { href: "/admin/reviews",   icon: Star,        label: "Reviews",   badgeKey: "pendingReviews" },
      { href: "/admin/returns",   icon: RotateCcw,   label: "Returns",   badgeKey: "pendingReturns" },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/chat",     icon: MessageCircle, label: "Chat",     badgeKey: null },
      { href: "/admin/content",  icon: FileText,      label: "Pages",    badgeKey: null },
      { href: "/admin/users",    icon: UserCog,       label: "Users",    badgeKey: null },
      { href: "/admin/activity", icon: Activity,      label: "Activity", badgeKey: null },
      { href: "/admin/settings", icon: Settings,      label: "Settings", badgeKey: null },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
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

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (pathname === "/admin/login") return <>{children}</>;

  const totalAlerts = notifs.pendingOrders + notifs.pendingReviews + notifs.pendingReturns;

  function renderNavLink(item: NavItem) {
    const Icon = item.icon;
    const active = pathname === item.href;
    const count = item.badgeKey ? notifs[item.badgeKey] : 0;
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setDrawerOpen(false)}
        className={`flex items-center gap-3 px-4 py-2.5 text-admin-sm transition-colors duration-admin-fast relative ${
          active
            ? "bg-admin-sidebar-active text-admin-sidebar-fg before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[3px] before:bg-admin-sidebar-fg"
            : "text-admin-sidebar-fg-muted hover:bg-admin-sidebar-hover hover:text-admin-sidebar-fg"
        }`}
      >
        <Icon size={16} strokeWidth={1.75} />
        <span className="flex-1">{item.label}</span>
        {count > 0 && (
          <span className="bg-state-error text-paper text-[10px] rounded-full min-w-[16px] h-4 px-1.5 flex items-center justify-center">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </Link>
    );
  }

  function renderNavSections() {
    return (
      <nav className="flex-1 overflow-y-auto pb-4">
        {NAV_SECTIONS.map((section, si) => (
          <div key={si}>
            {section.label && (
              <p className="text-admin-eyebrow text-admin-sidebar-fg-muted px-4 pt-6 pb-2">{section.label}</p>
            )}
            {section.items.map(renderNavLink)}
          </div>
        ))}
      </nav>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-56 bg-admin-sidebar-bg">
        <div className="px-4 pt-6 pb-4">
          <p className="text-admin-eyebrow tracking-[0.14em] text-admin-sidebar-fg">SNEAK N&apos; DRIP · ADMIN</p>
        </div>
        {renderNavSections()}
        <div className="p-4 border-t border-white/5">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-admin-sm text-admin-sidebar-fg-muted hover:text-admin-sidebar-fg transition-colors duration-admin-fast"
          >
            <LogOut size={16} strokeWidth={1.75} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile topbar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 h-12 bg-paper border-b border-line flex items-center justify-between px-4">
        <button onClick={() => setDrawerOpen(true)} aria-label="Open menu" className="text-ink">
          <Menu size={20} strokeWidth={1.75} />
        </button>
        <span className="text-admin-eyebrow text-ink">ADMIN</span>
        {totalAlerts > 0 ? (
          <Link
            href="/admin/orders?status=pending"
            className="text-[10px] font-bold rounded-full bg-state-error text-paper min-w-[18px] h-[18px] px-1.5 flex items-center justify-center"
          >
            {totalAlerts > 99 ? "99+" : totalAlerts}
          </Link>
        ) : (
          <span className="w-5" />
        )}
      </div>

      {/* Mobile drawer backdrop */}
      <div
        className={`lg:hidden fixed inset-0 z-50 bg-ink/60 transition-opacity duration-admin-base ${
          drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setDrawerOpen(false)}
      />

      {/* Mobile drawer */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-admin-sidebar-bg flex flex-col transition-transform duration-admin-base ease-smooth ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-4 pt-6 pb-4 flex items-center justify-between">
          <p className="text-admin-eyebrow tracking-[0.14em] text-admin-sidebar-fg">SNEAK N&apos; DRIP · ADMIN</p>
          <button onClick={() => setDrawerOpen(false)} aria-label="Close menu" className="text-admin-sidebar-fg">
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>
        {renderNavSections()}
        <div className="p-4 border-t border-white/5">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-admin-sm text-admin-sidebar-fg-muted hover:text-admin-sidebar-fg transition-colors duration-admin-fast"
          >
            <LogOut size={16} strokeWidth={1.75} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Content */}
      <div className="lg:ml-56 pt-12 lg:pt-0 min-h-screen bg-paper">
        <div className="p-6 md:p-8">{children}</div>
      </div>
    </div>
  );
}

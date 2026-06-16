/* eslint-disable react-hooks/purity */
import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin-server";
import { BRAND, FONTS } from "@/lib/constants";
import { TrendingUp, ShoppingBag, Package, Eye } from "lucide-react";
import DashboardCharts from "@/components/admin/DashboardCharts";
import DashboardRecentOrdersTable from "@/components/admin/DashboardRecentOrdersTable";
import DashboardRefresh from "@/components/admin/DashboardRefresh";

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams?: Promise<{ period?: string }>;
}) {
  noStore();
  const admin = createAdminClient();
  const period = (await searchParams)?.period ?? "week";

  // Period date range
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayStartISO = todayStart.toISOString();

  const periodStart = (() => {
    if (period === "today") return todayStartISO;
    if (period === "month") return new Date(Date.now() - 30 * 86400000).toISOString();
    if (period === "year") return new Date(Date.now() - 365 * 86400000).toISOString();
    return new Date(Date.now() - 7 * 86400000).toISOString(); // week (default)
  })();

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: allOrders },
    { count: productsCount },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    { count: _customersCount },
    { data: recentOrders },
    { data: lowStockRows },
    { data: weekOrders },
    { data: topItemsRaw },
    { data: todayViews },
    { data: weekViews },
  ] = await Promise.all([
    admin.from("orders").select("total, status"),
    admin.from("products").select("*", { count: "exact", head: true }),
    admin.from("customers").select("*", { count: "exact", head: true }),
    admin.from("orders")
      .select("order_number, customer_name, total, status, created_at, order_items(product_name, size, products(images, bg))")
      .order("created_at", { ascending: false })
      .limit(5),
    admin.from("product_sizes")
      .select("size, stock, product_id, products(name)")
      .lte("stock", 2)
      .gt("stock", 0)
      .limit(6),
    admin.from("orders")
      .select("total, status, created_at")
      .gte("created_at", periodStart)
      .order("created_at", { ascending: true }),
    admin.from("order_items")
      .select("product_name, quantity, unit_price"),
    admin.from("page_views").select("session_id").gte("created_at", todayStartISO),
    admin.from("page_views").select("session_id").gte("created_at", sevenDaysAgo),
  ]);

  const todayVisitors = new Set((todayViews ?? []).map(v => v.session_id)).size;
  const weekVisitors = new Set((weekViews ?? []).map(v => v.session_id)).size;

  // Revenue chart slots — shape depends on selected period
  const slotMap = new Map<string, { revenue: number; orders: number }>();
  if (period === "today") {
    for (let h = 0; h < 24; h++) {
      const label = h === 0 ? "12am" : h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`;
      slotMap.set(label, { revenue: 0, orders: 0 });
    }
  } else if (period === "year") {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i);
      slotMap.set(d.toLocaleDateString("en-PH", { month: "short", year: "2-digit" }), { revenue: 0, orders: 0 });
    }
  } else {
    const days = period === "month" ? 30 : 7;
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      slotMap.set(d.toLocaleDateString("en-PH", { month: "short", day: "numeric" }), { revenue: 0, orders: 0 });
    }
  }
  for (const o of (weekOrders ?? []).filter(o => !["pending", "cancelled"].includes(o.status))) {
    const d = new Date(o.created_at);
    const key = period === "today"
      ? (d.getHours() === 0 ? "12am" : d.getHours() < 12 ? `${d.getHours()}am` : d.getHours() === 12 ? "12pm" : `${d.getHours() - 12}pm`)
      : period === "year"
      ? d.toLocaleDateString("en-PH", { month: "short", year: "2-digit" })
      : d.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
    const slot = slotMap.get(key);
    if (slot) { slot.revenue += Number(o.total); slot.orders++; }
  }
  const revenueByDay = Array.from(slotMap.entries()).map(([date, v]) => ({ date, ...v }));

  // Orders by status
  const statusCount = new Map<string, number>();
  for (const o of allOrders ?? []) {
    statusCount.set(o.status, (statusCount.get(o.status) ?? 0) + 1);
  }
  const STATUS_COLORS: Record<string, string> = {
    pending: "#D97706", paid: BRAND.teal, processing: "#6366F1",
    shipped: "#3B82F6", delivered: "#10B981", cancelled: BRAND.red,
  };
  const ordersByStatus = Array.from(statusCount.entries()).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1), value,
    color: STATUS_COLORS[name] ?? "#999",
  }));

  // Top 5 products by revenue
  const productRevMap = new Map<string, number>();
  for (const item of topItemsRaw ?? []) {
    const rev = Number(item.unit_price) * Number(item.quantity);
    productRevMap.set(item.product_name, (productRevMap.get(item.product_name) ?? 0) + rev);
  }
  const topProducts = Array.from(productRevMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, revenue]) => ({
      name: name.length > 22 ? name.slice(0, 22) + "…" : name,
      revenue,
    }));

  const paidOrders = allOrders?.filter(o => !["pending", "cancelled"].includes(o.status)) ?? [];
  const totalRevenue = paidOrders.reduce((sum, o) => sum + Number(o.total), 0);
  const ordersCount = allOrders?.length ?? 0;
  const pendingCount = allOrders?.filter(o => o.status === "pending").length ?? 0;

  const today = new Date().toLocaleDateString("en-PH", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  const METRICS = [
    { label: "Total Revenue",    value: `₱${totalRevenue.toLocaleString()}`, sub: `${ordersCount} orders total`,    icon: TrendingUp,  color: BRAND.teal,  bg: `rgba(91,184,180,0.12)`,  href: "/admin/sales" },
    { label: "Total Orders",     value: String(ordersCount),                  sub: `${pendingCount} pending`,         icon: ShoppingBag, color: BRAND.black, bg: "rgba(13,13,13,0.08)",   href: "/admin/orders" },
    { label: "Products",         value: String(productsCount ?? 0),           sub: "in catalog",                      icon: Package,     color: BRAND.red,   bg: "rgba(217,79,61,0.1)",   href: "/admin/products" },
    { label: "Visitors Today",   value: String(todayVisitors),                sub: `${weekVisitors} this week`,       icon: Eye,         color: "#6366F1",   bg: "rgba(99,102,241,0.1)",  href: undefined },
  ];

  // Group low stock by product
  type LowStockRow = { size: string; stock: number; product_id: string; products: unknown };
  const lowStockMap = new Map<string, { name: string; sizes: string[] }>();
  for (const row of (lowStockRows ?? []) as LowStockRow[]) {
    const prod = row.products as { name: string } | { name: string }[] | null;
    const name = (Array.isArray(prod) ? prod[0]?.name : prod?.name) ?? "Unknown";
    if (!lowStockMap.has(row.product_id)) lowStockMap.set(row.product_id, { name, sizes: [] });
    lowStockMap.get(row.product_id)!.sizes.push(`${row.size} (${row.stock})`);
  }
  const lowStock = Array.from(lowStockMap.entries()).map(([id, v]) => ({ id, ...v }));

  return (
    <div style={{ fontFamily: FONTS.body }}>
      <DashboardRefresh />
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: BRAND.teal }}>Sneak N&apos; Drip</p>
        <h1 style={{ fontFamily: FONTS.display, fontSize: "2.5rem", letterSpacing: "0.04em", color: BRAND.black }}>DASHBOARD</h1>
        <p className="text-sm mt-1" style={{ color: BRAND.muted }}>{today}</p>
      </div>

      {/* Metrics */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {METRICS.map(m => {
          const Icon = m.icon;
          const inner = (
            <>
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: m.bg }}>
                  <Icon className="w-5 h-5" style={{ color: m.color }} />
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: `${BRAND.teal}12`, color: BRAND.teal }}>{m.sub}</span>
              </div>
              <p style={{ fontFamily: FONTS.display, fontSize: "2rem", color: BRAND.black, letterSpacing: "0.03em", lineHeight: 1 }}>
                {m.value}
              </p>
              <p className="text-xs mt-1 uppercase tracking-widest font-semibold" style={{ color: BRAND.muted }}>{m.label}</p>
            </>
          );
          return m.href ? (
            <Link key={m.label} href={m.href}
              className="block p-5 rounded-xl transition-opacity hover:opacity-80"
              style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              {inner}
            </Link>
          ) : (
            <div key={m.label} className="p-5 rounded-xl" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              {inner}
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 rounded-xl overflow-hidden" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${BRAND.border}` }}>
            <h2 style={{ fontFamily: FONTS.display, fontSize: "1.2rem", letterSpacing: "0.04em", color: BRAND.black }}>RECENT ORDERS</h2>
            <Link href="/admin/orders" className="text-xs font-bold transition-opacity hover:opacity-60" style={{ color: BRAND.teal }}>
              View All →
            </Link>
          </div>
          <DashboardRecentOrdersTable orders={(recentOrders ?? []) as Parameters<typeof DashboardRecentOrdersTable>[0]["orders"]} />
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Low stock alert */}
          <div className="rounded-xl overflow-hidden" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: `1px solid ${BRAND.border}` }}>
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: lowStock.length ? BRAND.red : BRAND.teal }} />
              <h3 className="font-black text-sm" style={{ color: BRAND.black }}>LOW STOCK ALERT</h3>
            </div>
            <div className="p-4">
              {lowStock.length === 0 ? (
                <p className="text-xs" style={{ color: BRAND.muted }}>All sizes well stocked.</p>
              ) : (
                <div className="space-y-3">
                  {lowStock.map((p) => (
                    <Link key={p.id} href={`/admin/products/${p.id}`}
                      className="flex items-center justify-between group transition-opacity hover:opacity-70">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate group-hover:underline" style={{ color: BRAND.black }}>{p.name}</p>
                        <p className="text-[10px]" style={{ color: BRAND.muted }}>{p.sizes.join(" · ")}</p>
                      </div>
                      <span className="ml-2 text-[10px] font-bold px-2 py-0.5"
                        style={{ background: `${BRAND.red}10`, color: BRAND.red }}>Low</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick actions */}
          <div className="rounded-xl overflow-hidden" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            <div className="px-5 py-4" style={{ borderBottom: `1px solid ${BRAND.border}` }}>
              <h3 className="font-black text-sm" style={{ color: BRAND.black }}>QUICK ACTIONS</h3>
            </div>
            <div className="p-3 space-y-2">
              {[
                { label: "Add New Product",      href: "/admin/products/new",          color: BRAND.black },
                { label: "View Pending Orders",  href: "/admin/orders?status=pending", color: BRAND.black },
                { label: "View All Customers",   href: "/admin/customers",             color: BRAND.black },
              ].map(a => (
                <Link key={a.label} href={a.href}
                  className="flex items-center justify-between px-4 py-3 rounded-lg text-sm font-bold transition-colors"
                  style={{ background: `${a.color}08`, color: a.color }}>
                  {a.label} →
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="mt-6">
        <DashboardCharts
          revenueByDay={revenueByDay}
          ordersByStatus={ordersByStatus}
          topProducts={topProducts}
          initialPeriod={period}
        />
      </div>
    </div>
  );
}

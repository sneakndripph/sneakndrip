/* eslint-disable react-hooks/purity */
import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin-server";
import { BRAND, FONTS } from "@/lib/constants";
import { TrendingUp, ShoppingBag, Package, AlertTriangle, Plus, Clock, Users } from "lucide-react";
import DashboardCharts from "@/components/admin/DashboardCharts";
import DashboardRecentOrdersTable from "@/components/admin/DashboardRecentOrdersTable";
import DashboardRefresh from "@/components/admin/DashboardRefresh";
import DashboardVisitorsCard from "@/components/admin/DashboardVisitorsCard";

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams?: Promise<{ period?: string }>;
}) {
  noStore();
  const admin = createAdminClient();
  const period = (await searchParams)?.period ?? "week";

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayStartISO = todayStart.toISOString();

  const periodStart = (() => {
    if (period === "today") return todayStartISO;
    if (period === "month") return new Date(Date.now() - 30 * 86400000).toISOString();
    if (period === "year")  return new Date(Date.now() - 365 * 86400000).toISOString();
    return new Date(Date.now() - 7 * 86400000).toISOString();
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
    admin.from("order_items").select("product_name, quantity, unit_price"),
    admin.from("page_views").select("session_id").gte("created_at", todayStartISO),
    admin.from("page_views").select("session_id").gte("created_at", sevenDaysAgo),
  ]);

  const todayVisitors = new Set((todayViews ?? []).map(v => v.session_id)).size;
  const weekVisitors  = new Set((weekViews  ?? []).map(v => v.session_id)).size;

  // Revenue chart slots
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

  const paidOrders   = allOrders?.filter(o => !["pending", "cancelled"].includes(o.status)) ?? [];
  const totalRevenue = paidOrders.reduce((sum, o) => sum + Number(o.total), 0);
  const ordersCount  = allOrders?.length ?? 0;
  const pendingCount = allOrders?.filter(o => o.status === "pending").length ?? 0;

  const today = new Date().toLocaleDateString("en-PH", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

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

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p
            className="snd-label mb-2"
            style={{ color: BRAND.mutedLight, fontFamily: FONTS.body }}
          >
            {today}
          </p>
          <h1
            style={{
              fontFamily: FONTS.display,
              fontSize: "2.2rem",
              letterSpacing: "0.06em",
              color: BRAND.black,
              lineHeight: 1,
            }}
          >
            DASHBOARD
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <Link
              href="/admin/orders?status=pending"
              className="flex items-center gap-2 text-xs font-bold px-3.5 py-2 uppercase tracking-wider transition-opacity hover:opacity-80"
              style={{ background: `${BRAND.red}10`, color: BRAND.red }}
            >
              <span
                className="w-1.5 h-1.5 animate-pulse"
                style={{ background: BRAND.red, display: "inline-block" }}
              />
              {pendingCount} Pending
            </Link>
          )}
          <Link
            href="/admin/products/new"
            className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 uppercase tracking-wider transition-opacity hover:opacity-80"
            style={{ background: BRAND.black, color: "#fff" }}
          >
            <Plus className="w-3 h-3" />
            Add Product
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">

        {/* Revenue */}
        <Link
          href="/admin/sales"
          className="admin-stat-card px-5 py-5 block"
          style={{ gridColumn: "span 2 / span 2" }}
        >
          <div className="flex items-center gap-1.5 mb-3">
            <TrendingUp className="w-3 h-3" style={{ color: BRAND.mutedLight }} />
            <p
              className="snd-label"
              style={{ color: BRAND.mutedLight, fontFamily: FONTS.body }}
            >
              Total Revenue
            </p>
          </div>
          <p
            style={{
              fontFamily: FONTS.display,
              fontSize: "2.8rem",
              color: BRAND.black,
              letterSpacing: "0.02em",
              lineHeight: 1,
            }}
          >
            ₱{totalRevenue.toLocaleString()}
          </p>
          <p className="text-xs mt-2" style={{ color: BRAND.muted }}>
            {ordersCount} orders total
          </p>
        </Link>

        {/* Orders */}
        <Link href="/admin/orders" className="admin-stat-card px-5 py-5 block">
          <div className="flex items-center gap-1.5 mb-3">
            <ShoppingBag className="w-3 h-3" style={{ color: BRAND.mutedLight }} />
            <p
              className="snd-label"
              style={{ color: BRAND.mutedLight, fontFamily: FONTS.body }}
            >
              Orders
            </p>
          </div>
          <p
            style={{
              fontFamily: FONTS.display,
              fontSize: "2.8rem",
              color: BRAND.black,
              letterSpacing: "0.02em",
              lineHeight: 1,
            }}
          >
            {ordersCount}
          </p>
          <p className="text-xs mt-2" style={{ color: pendingCount > 0 ? BRAND.red : BRAND.muted }}>
            {pendingCount > 0 ? `${pendingCount} pending` : "No pending"}
          </p>
        </Link>

        {/* Products */}
        <Link href="/admin/products" className="admin-stat-card px-5 py-5 block">
          <div className="flex items-center gap-1.5 mb-3">
            <Package className="w-3 h-3" style={{ color: BRAND.mutedLight }} />
            <p
              className="snd-label"
              style={{ color: BRAND.mutedLight, fontFamily: FONTS.body }}
            >
              Products
            </p>
          </div>
          <p
            style={{
              fontFamily: FONTS.display,
              fontSize: "2.8rem",
              color: BRAND.black,
              letterSpacing: "0.02em",
              lineHeight: 1,
            }}
          >
            {productsCount ?? 0}
          </p>
          <p className="text-xs mt-2" style={{ color: BRAND.muted }}>
            in catalog
          </p>
        </Link>

        {/* Visitors */}
        <DashboardVisitorsCard initialToday={todayVisitors} initialWeek={weekVisitors} />
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-4">

        {/* Recent Orders — takes 2/3 */}
        <div
          className="lg:col-span-2 overflow-hidden"
          style={{ background: "#fff", border: `1px solid ${BRAND.border}` }}
        >
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: `1px solid ${BRAND.border}` }}
          >
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3" style={{ color: BRAND.mutedLight }} />
              <p
                className="snd-label"
                style={{ color: BRAND.black, fontFamily: FONTS.body }}
              >
                Recent Orders
              </p>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs font-semibold transition-opacity hover:opacity-60"
              style={{ color: BRAND.teal }}
            >
              View All →
            </Link>
          </div>
          <DashboardRecentOrdersTable
            orders={(recentOrders ?? []) as Parameters<typeof DashboardRecentOrdersTable>[0]["orders"]}
          />
        </div>

        {/* Right column */}
        <div className="space-y-4">

          {/* Low stock */}
          <div
            className="overflow-hidden"
            style={{ background: "#fff", border: `1px solid ${BRAND.border}` }}
          >
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: `1px solid ${BRAND.border}` }}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-3 h-3" style={{ color: BRAND.mutedLight }} />
                <p
                  className="snd-label"
                  style={{ color: BRAND.black, fontFamily: FONTS.body }}
                >
                  Low Stock
                </p>
              </div>
              {lowStock.length > 0 && (
                <span
                  className="font-black"
                  style={{
                    fontSize: "9px",
                    padding: "2px 6px",
                    background: `${BRAND.red}10`,
                    color: BRAND.red,
                  }}
                >
                  {lowStock.length} item{lowStock.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            <div className="px-5 py-4">
              {lowStock.length === 0 ? (
                <p className="text-xs" style={{ color: BRAND.muted }}>All sizes well stocked.</p>
              ) : (
                <div>
                  {lowStock.map((p, i) => (
                    <Link
                      key={p.id}
                      href={`/admin/products/${p.id}`}
                      className="flex items-start justify-between gap-3 py-3 transition-opacity hover:opacity-70"
                      style={{
                        borderBottom: i < lowStock.length - 1 ? `1px solid ${BRAND.border}` : "none",
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-xs font-semibold truncate"
                          style={{ color: BRAND.black }}
                        >
                          {p.name}
                        </p>
                        <p className="text-[10px] mt-0.5" style={{ color: BRAND.muted }}>
                          {p.sizes.join(" · ")}
                        </p>
                      </div>
                      <span
                        className="snd-label shrink-0"
                        style={{ color: BRAND.red, fontFamily: FONTS.body }}
                      >
                        Low
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick actions */}
          <div
            className="overflow-hidden"
            style={{ background: "#fff", border: `1px solid ${BRAND.border}` }}
          >
            <div
              className="flex items-center gap-2 px-5 py-4"
              style={{ borderBottom: `1px solid ${BRAND.border}` }}
            >
              <Users className="w-3 h-3" style={{ color: BRAND.mutedLight }} />
              <p
                className="snd-label"
                style={{ color: BRAND.black, fontFamily: FONTS.body }}
              >
                Quick Actions
              </p>
            </div>
            <div>
              {[
                { label: "Add New Product",  href: "/admin/products/new",        icon: Plus },
                { label: "Pending Orders",    href: "/admin/orders?status=pending", icon: ShoppingBag },
                { label: "All Customers",     href: "/admin/customers",            icon: Users },
              ].map((a, i, arr) => {
                const Icon = a.icon;
                return (
                  <Link
                    key={a.label}
                    href={a.href}
                    className="flex items-center gap-3 px-5 py-3.5 text-sm font-medium transition-all"
                    style={{
                      color: BRAND.black,
                      borderBottom: i < arr.length - 1 ? `1px solid ${BRAND.border}` : "none",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#FAFAF8")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: BRAND.mutedLight }} />
                    <span className="flex-1">{a.label}</span>
                    <span style={{ color: BRAND.mutedLight }}>→</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="mt-4">
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

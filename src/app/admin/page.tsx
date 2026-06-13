import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin-server";
import { BRAND, FONTS } from "@/lib/constants";
import { TrendingUp, ShoppingBag, Package, Users, Clock, CheckCircle, Truck } from "lucide-react";
import DashboardCharts from "@/components/admin/DashboardCharts";

const STATUS_CFG = {
  pending:    { icon: Clock,       color: "#D97706", bg: "rgba(217,119,6,0.1)",   label: "Pending" },
  paid:       { icon: CheckCircle, color: BRAND.teal, bg: `rgba(91,184,180,0.1)`, label: "Paid" },
  processing: { icon: Clock,       color: "#6366F1", bg: "rgba(99,102,241,0.1)",  label: "Processing" },
  shipped:    { icon: Truck,       color: "#3B82F6", bg: "rgba(59,130,246,0.1)",  label: "Shipped" },
  delivered:  { icon: CheckCircle, color: "#10B981", bg: "rgba(16,185,129,0.1)",  label: "Delivered" },
} as const;

export default async function AdminDashboard() {
  noStore();
  const admin = createAdminClient();

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: allOrders },
    { count: productsCount },
    { count: customersCount },
    { data: recentOrders },
    { data: lowStockRows },
    { data: weekOrders },
    { data: topItemsRaw },
  ] = await Promise.all([
    admin.from("orders").select("total, status"),
    admin.from("products").select("*", { count: "exact", head: true }),
    admin.from("customers").select("*", { count: "exact", head: true }),
    admin.from("orders")
      .select("order_number, customer_name, total, status, created_at, order_items(product_name, size)")
      .order("created_at", { ascending: false })
      .limit(5),
    admin.from("product_sizes")
      .select("size, stock, product_id, products(name)")
      .lte("stock", 2)
      .gt("stock", 0)
      .limit(6),
    admin.from("orders")
      .select("total, status, created_at")
      .gte("created_at", sevenDaysAgo)
      .order("created_at", { ascending: true }),
    admin.from("order_items")
      .select("product_name, quantity, unit_price"),
  ]);

  // Revenue by day (last 7 days)
  const dayMap = new Map<string, { revenue: number; orders: number }>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = d.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
    dayMap.set(key, { revenue: 0, orders: 0 });
  }
  for (const o of weekOrders ?? []) {
    const key = new Date(o.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric" });
    const slot = dayMap.get(key);
    if (slot) { slot.revenue += Number(o.total); slot.orders++; }
  }
  const revenueByDay = Array.from(dayMap.entries()).map(([date, v]) => ({ date, ...v }));

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

  const totalRevenue = allOrders?.reduce((sum, o) => sum + Number(o.total), 0) ?? 0;
  const ordersCount = allOrders?.length ?? 0;
  const pendingCount = allOrders?.filter(o => o.status === "pending").length ?? 0;

  const today = new Date().toLocaleDateString("en-PH", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  const METRICS = [
    { label: "Total Revenue",  value: `₱${totalRevenue.toLocaleString()}`, sub: `${ordersCount} orders total`,       icon: TrendingUp, color: BRAND.teal,  bg: `rgba(91,184,180,0.12)` },
    { label: "Total Orders",   value: String(ordersCount),                  sub: `${pendingCount} pending`,            icon: ShoppingBag, color: BRAND.black, bg: "rgba(13,13,13,0.08)" },
    { label: "Products",       value: String(productsCount ?? 0),           sub: "in catalog",                         icon: Package,    color: BRAND.red,   bg: "rgba(217,79,61,0.1)" },
    { label: "Customers",      value: String(customersCount ?? 0),          sub: "registered accounts",                icon: Users,      color: "#6366F1",   bg: "rgba(99,102,241,0.1)" },
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
  const lowStock = Array.from(lowStockMap.values());

  return (
    <div style={{ fontFamily: FONTS.body }}>
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: BRAND.teal }}>Sneak N&apos; Drip</p>
        <h1 style={{ fontFamily: FONTS.display, fontSize: "2.5rem", letterSpacing: "0.04em", color: BRAND.black }}>DASHBOARD</h1>
        <p className="text-sm mt-1" style={{ color: BRAND.muted }}>{today}</p>
      </div>

      {/* Metrics */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {METRICS.map(m => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="p-5 rounded-xl" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
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
          {!recentOrders?.length ? (
            <div className="py-12 text-center">
              <p className="text-sm" style={{ color: BRAND.muted }}>No orders yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${BRAND.border}` }}>
                    {["Order ID", "Customer", "Item", "Total", "Status", "Date"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest"
                        style={{ color: BRAND.muted }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map(order => {
                    const cfg = STATUS_CFG[order.status as keyof typeof STATUS_CFG];
                    const Icon = cfg?.icon ?? Clock;
                    const firstItem = (order.order_items as { product_name: string; size: string }[])?.[0];
                    return (
                      <tr key={order.order_number} className="transition-colors hover:bg-black/[0.02] cursor-pointer"
                        style={{ borderBottom: `1px solid ${BRAND.border}` }}>
                        <td className="px-4 py-3.5 text-xs font-bold">
                          <Link href={`/admin/orders?q=${order.order_number}`} className="hover:underline" style={{ color: BRAND.black }}>
                            {order.order_number}
                          </Link>
                        </td>
                        <td className="px-4 py-3.5 text-xs font-semibold" style={{ color: BRAND.black }}>{order.customer_name}</td>
                        <td className="px-4 py-3.5 text-xs max-w-[160px] truncate" style={{ color: BRAND.muted }}>
                          {firstItem ? `${firstItem.product_name} (${firstItem.size})` : "—"}
                        </td>
                        <td className="px-4 py-3.5 text-xs font-bold" style={{ color: BRAND.black }}>
                          ₱{Number(order.total).toLocaleString()}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full"
                            style={{ background: cfg?.bg ?? "#eee", color: cfg?.color ?? "#666" }}>
                            <Icon className="w-3 h-3" />{cfg?.label ?? order.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-xs" style={{ color: BRAND.muted }}>
                          {new Date(order.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
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
                  {lowStock.map((p, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: BRAND.black }}>{p.name}</p>
                        <p className="text-[10px]" style={{ color: BRAND.muted }}>{p.sizes.join(" · ")}</p>
                      </div>
                      <span className="ml-2 text-[10px] font-bold px-2 py-0.5"
                        style={{ background: `${BRAND.red}10`, color: BRAND.red }}>Low</span>
                    </div>
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
                { label: "Add New Product",      href: "/admin/products/new",          color: BRAND.teal },
                { label: "View Pending Orders",  href: "/admin/orders",                color: BRAND.black },
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
      <DashboardCharts
        revenueByDay={revenueByDay}
        ordersByStatus={ordersByStatus}
        topProducts={topProducts}
      />
    </div>
  );
}

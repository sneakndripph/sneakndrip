/* eslint-disable react-hooks/purity */
import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin-server";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import DashboardCharts from "@/components/admin/DashboardCharts";
import DashboardRecentOrdersTable from "@/components/admin/DashboardRecentOrdersTable";
import DashboardRefresh from "@/components/admin/DashboardRefresh";
import DashboardVisitorsCard from "@/components/admin/DashboardVisitorsCard";
import DashboardPeriodSelector from "@/components/admin/DashboardPeriodSelector";

const STATUS_COLORS: Record<string, string> = {
  pending: "var(--ink-3)",
  paid: "var(--ink-2)",
  processing: "#3A3A35",
  shipped: "#2A2A25",
  delivered: "var(--ink)",
  cancelled: "var(--state-error)",
};

function formatPeriodRange(period: string, start: Date, end: Date): string {
  if (period === "today") {
    return end.toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" });
  }
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  if (sameMonth) {
    const month = start.toLocaleDateString("en-PH", { month: "long" });
    return `${month} ${start.getDate()}–${end.getDate()}, ${end.getFullYear()}`;
  }
  const fmt = (d: Date) => d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
  return `${fmt(start)} – ${fmt(end)}`;
}

function pctDelta(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / previous) * 100;
}

function DeltaLine({ value }: { value: number }) {
  const positive = value > 0;
  const negative = value < 0;
  const Icon = positive ? ArrowUp : negative ? ArrowDown : Minus;
  const color = positive ? "text-state-onhand" : negative ? "text-state-error" : "text-ink-3";
  return (
    <p className={`text-admin-micro mt-2 flex items-center gap-1 ${color}`}>
      <Icon className="w-3 h-3" />
      {Math.abs(value).toFixed(0)}% vs previous period
    </p>
  );
}

function StatCard({ label, value, delta, href }: { label: string; value: string; delta: number; href?: string }) {
  const inner = (
    <>
      <p className="text-admin-eyebrow text-ink-3 mb-2">{label}</p>
      <p className="text-admin-hero text-ink font-display leading-none tracking-[-0.02em]">{value}</p>
      <DeltaLine value={delta} />
    </>
  );
  if (href) {
    return (
      <Link href={href} className="bg-paper border border-line rounded-md p-5 block hover:border-line-strong transition-colors duration-admin-fast">
        {inner}
      </Link>
    );
  }
  return <div className="bg-paper border border-line rounded-md p-5">{inner}</div>;
}

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams?: Promise<{ period?: string }>;
}) {
  noStore();
  const admin = createAdminClient();
  const period = (await searchParams)?.period ?? "week";

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayStartISO = todayStart.toISOString();
  const yesterdayStartISO = new Date(todayStart.getTime() - 86400000).toISOString();

  const periodStartDate = (() => {
    if (period === "today") return todayStart;
    if (period === "month") return new Date(now.getTime() - 30 * 86400000);
    if (period === "year")  return new Date(now.getTime() - 365 * 86400000);
    return new Date(now.getTime() - 7 * 86400000);
  })();
  const periodStartISO = periodStartDate.toISOString();

  const duration = now.getTime() - periodStartDate.getTime();
  const prevStartISO = new Date(periodStartDate.getTime() - duration).toISOString();

  const [
    { data: currentOrders },
    { data: previousOrders },
    { data: recentOrders },
    { data: topProductsRaw },
    { data: todayVisitorCount },
    { data: yesterdayVisitorCount },
  ] = await Promise.all([
    admin.from("orders")
      .select("total, status, created_at")
      .gte("created_at", periodStartISO)
      .order("created_at", { ascending: true }),
    admin.from("orders")
      .select("total, status")
      .gte("created_at", prevStartISO)
      .lt("created_at", periodStartISO),
    admin.from("orders")
      .select("order_number, customer_name, total, status, created_at, order_items(product_name, size, products(images, bg))")
      .order("created_at", { ascending: false })
      .limit(5),
    admin.rpc("top_products_by_period", { period_start: periodStartISO, result_limit: 5 }),
    admin.rpc("count_unique_page_view_sessions", { range_start: todayStartISO, range_end: now.toISOString() }),
    admin.rpc("count_unique_page_view_sessions", { range_start: yesterdayStartISO, range_end: todayStartISO }),
  ]);

  const todayVisitors     = todayVisitorCount ?? 0;
  const yesterdayVisitors = yesterdayVisitorCount ?? 0;

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
  for (const o of (currentOrders ?? []).filter(o => !["pending", "cancelled"].includes(o.status))) {
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
  for (const o of currentOrders ?? []) {
    statusCount.set(o.status, (statusCount.get(o.status) ?? 0) + 1);
  }
  const ordersByStatus = Array.from(statusCount.entries()).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1), value,
    color: STATUS_COLORS[name] ?? "var(--ink-3)",
  }));

  const topProducts = (topProductsRaw ?? []).map((p: { product_name: string; revenue: number }) => ({
    name: p.product_name.length > 22 ? p.product_name.slice(0, 22) + "…" : p.product_name,
    revenue: Number(p.revenue),
  }));

  const paidCurrent  = (currentOrders ?? []).filter(o => !["pending", "cancelled"].includes(o.status));
  const paidPrevious = (previousOrders ?? []).filter(o => !["pending", "cancelled"].includes(o.status));

  const revenueCurrent  = paidCurrent.reduce((sum, o) => sum + Number(o.total), 0);
  const revenuePrevious = paidPrevious.reduce((sum, o) => sum + Number(o.total), 0);

  const ordersCountCurrent  = (currentOrders ?? []).length;
  const ordersCountPrevious = (previousOrders ?? []).length;

  const aovCurrent  = paidCurrent.length  ? revenueCurrent  / paidCurrent.length  : 0;
  const aovPrevious = paidPrevious.length ? revenuePrevious / paidPrevious.length : 0;

  const rangeLabel = formatPeriodRange(period, periodStartDate, now);

  return (
    <div>
      <DashboardRefresh />

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-admin-hero text-ink font-display font-medium tracking-[-0.02em]">Dashboard</h1>
          <p className="text-admin text-ink-3 mt-1.5">{rangeLabel}</p>
        </div>
        <DashboardPeriodSelector active={period} />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Revenue" value={`₱${revenueCurrent.toLocaleString()}`}
          delta={pctDelta(revenueCurrent, revenuePrevious)} href="/admin/sales" />
        <StatCard label="Orders" value={ordersCountCurrent.toLocaleString()}
          delta={pctDelta(ordersCountCurrent, ordersCountPrevious)} href="/admin/orders" />
        <DashboardVisitorsCard initialToday={todayVisitors} initialYesterday={yesterdayVisitors} />
        <StatCard label="Avg. order value" value={`₱${Math.round(aovCurrent).toLocaleString()}`}
          delta={pctDelta(aovCurrent, aovPrevious)} />
      </div>

      {/* Charts */}
      <DashboardCharts
        revenueByDay={revenueByDay}
        ordersByStatus={ordersByStatus}
        topProducts={topProducts}
      />

      {/* Recent orders */}
      <div className="bg-paper border border-line rounded-md p-5 mt-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-admin-title text-ink">Recent orders</p>
          <Link href="/admin/orders" className="text-admin-sm font-medium text-ink-2 hover:text-ink transition-colors duration-admin-fast">
            View all →
          </Link>
        </div>
        <DashboardRecentOrdersTable
          orders={(recentOrders ?? []) as Parameters<typeof DashboardRecentOrdersTable>[0]["orders"]}
        />
      </div>
    </div>
  );
}

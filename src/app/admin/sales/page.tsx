"use client";

import { useState, useEffect, useCallback } from "react";
import { BRAND, FONTS } from "@/lib/constants";
import { TrendingUp, ShoppingBag, DollarSign, XCircle, Download, RefreshCw } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend, CartesianGrid,
} from "recharts";

type Period = "today" | "7d" | "30d" | "90d" | "all";

const PERIODS: { id: Period; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "7d",    label: "7 Days" },
  { id: "30d",   label: "30 Days" },
  { id: "90d",   label: "90 Days" },
  { id: "all",   label: "All Time" },
];

const STATUS_COLORS: Record<string, string> = {
  pending: "#D97706", paid: BRAND.teal, processing: "#6366F1",
  shipped: "#3B82F6", delivered: "#10B981", cancelled: BRAND.red,
};
const PIE_COLORS = [BRAND.teal, "#6366F1", "#3B82F6", "#10B981", "#D97706", BRAND.red, "#8B5CF6", "#EC4899"];

type Metrics = {
  totalRevenue: number; totalOrders: number; paidOrders: number;
  cancelledOrders: number; pendingOrders: number; avgOrder: number; cancelRate: number;
};
type SalesData = {
  metrics: Metrics;
  revenueByDay: { date: string; revenue: number; orders: number }[];
  topProducts: { name: string; revenue: number; units: number }[];
  byPayment: { method: string; revenue: number }[];
  byStatus: { status: string; count: number }[];
  topCustomers: { name: string; email: string; revenue: number; orders: number }[];
};

function periodToRange(p: Period): { from?: string; to?: string } {
  const now = new Date();
  const to = now.toISOString();
  if (p === "all") return {};
  if (p === "today") {
    const from = new Date(now); from.setHours(0, 0, 0, 0);
    return { from: from.toISOString(), to };
  }
  const days = p === "7d" ? 7 : p === "30d" ? 30 : 90;
  const from = new Date(now.getTime() - days * 86400000);
  return { from: from.toISOString(), to };
}

function fmt(n: number) { return `₱${Number(n).toLocaleString("en-PH", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`; }

function MetricCard({ label, value, sub, icon: Icon, color, bg }: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; color: string; bg: string;
}) {
  return (
    <div className="p-5 rounded-xl" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: bg }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        {sub && <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `${color}12`, color }}>{sub}</span>}
      </div>
      <p style={{ fontFamily: FONTS.display, fontSize: "1.8rem", color: BRAND.black, letterSpacing: "0.03em", lineHeight: 1 }}>{value}</p>
      <p className="text-xs mt-1 uppercase tracking-widest font-semibold" style={{ color: BRAND.muted }}>{label}</p>
    </div>
  );
}

export default function AdminSalesPage() {
  const [period, setPeriod] = useState<Period>("30d");
  const [data, setData] = useState<SalesData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (p: Period) => {
    setLoading(true);
    const { from, to } = periodToRange(p);
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const res = await fetch(`/api/admin/sales?${params}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(period); }, [period, load]);

  function exportCSV() {
    if (!data) return;
    const rows = [
      ["Product", "Revenue (₱)", "Units Sold"],
      ...data.topProducts.map(p => [p.name, p.revenue, p.units]),
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "sales-report.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  const m = data?.metrics;

  return (
    <div style={{ fontFamily: FONTS.body }}>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: BRAND.teal }}>Analytics</p>
          <h1 style={{ fontFamily: FONTS.display, fontSize: "2.5rem", letterSpacing: "0.04em", color: BRAND.black }}>SALES</h1>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Period selector */}
          <div className="flex rounded-lg overflow-hidden" style={{ border: `1px solid ${BRAND.border}` }}>
            {PERIODS.map(p => (
              <button key={p.id} onClick={() => setPeriod(p.id)}
                className="px-3 py-2 text-xs font-bold transition-colors"
                style={{
                  background: period === p.id ? BRAND.black : "transparent",
                  color: period === p.id ? "#fff" : BRAND.muted,
                }}>
                {p.label}
              </button>
            ))}
          </div>
          <button onClick={() => load(period)} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold transition-opacity hover:opacity-70 disabled:opacity-40"
            style={{ border: `1px solid ${BRAND.border}`, color: BRAND.muted }}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button onClick={exportCSV} disabled={!data}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold transition-opacity hover:opacity-70 disabled:opacity-40"
            style={{ background: BRAND.teal, color: "#fff" }}>
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {loading && !data ? (
        <div className="py-24 text-center text-sm" style={{ color: BRAND.muted }}>Loading sales data…</div>
      ) : !data ? (
        <div className="py-24 text-center text-sm" style={{ color: BRAND.muted }}>Failed to load data. Refresh to try again.</div>
      ) : (
        <div className="space-y-6">
          {/* Metrics */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard label="Total Revenue" value={fmt(m!.totalRevenue)} sub={`${m!.paidOrders} paid`}
              icon={TrendingUp} color={BRAND.teal} bg={`rgba(91,184,180,0.12)`} />
            <MetricCard label="Total Orders" value={String(m!.totalOrders)} sub={`${m!.pendingOrders} pending`}
              icon={ShoppingBag} color={BRAND.black} bg="rgba(13,13,13,0.08)" />
            <MetricCard label="Avg Order Value" value={fmt(m!.avgOrder)}
              icon={DollarSign} color="#6366F1" bg="rgba(99,102,241,0.1)" />
            <MetricCard label="Cancellation Rate" value={`${m!.cancelRate.toFixed(1)}%`} sub={`${m!.cancelledOrders} orders`}
              icon={XCircle} color={BRAND.red} bg={`rgba(217,79,61,0.1)`} />
          </div>

          {/* Revenue Trend */}
          <div className="rounded-xl p-5" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            <h2 className="font-black text-sm uppercase tracking-widest mb-4" style={{ color: BRAND.black }}>Revenue Trend</h2>
            {data.revenueByDay.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: BRAND.muted }}>No paid orders in this period.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data.revenueByDay} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={BRAND.border} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: BRAND.muted }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: BRAND.muted }} tickLine={false} axisLine={false}
                    tickFormatter={v => `₱${(v / 1000).toFixed(0)}k`} width={48} />
                  <Tooltip
                    formatter={(v) => [fmt(Number(v ?? 0)), "Revenue"]}
                    contentStyle={{ background: BRAND.card, border: `1px solid ${BRAND.border}`, borderRadius: 8, fontSize: 12 }} />
                  <Line type="monotone" dataKey="revenue" stroke={BRAND.teal} strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: BRAND.teal }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Top Products + Status Pie */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Top Products */}
            <div className="rounded-xl p-5" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <h2 className="font-black text-sm uppercase tracking-widest mb-4" style={{ color: BRAND.black }}>Top Products by Revenue</h2>
              {data.topProducts.length === 0 ? (
                <p className="text-sm text-center py-8" style={{ color: BRAND.muted }}>No data.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={data.topProducts} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                    <XAxis type="number" tick={{ fontSize: 10, fill: BRAND.muted }} tickLine={false} axisLine={false}
                      tickFormatter={v => `₱${(v / 1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: BRAND.muted }} tickLine={false} axisLine={false} width={120} />
                    <Tooltip
                      formatter={(v) => [fmt(Number(v ?? 0)), "Revenue"]}
                      contentStyle={{ background: BRAND.card, border: `1px solid ${BRAND.border}`, borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="revenue" fill={BRAND.teal} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Orders by Status */}
            <div className="rounded-xl p-5" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <h2 className="font-black text-sm uppercase tracking-widest mb-4" style={{ color: BRAND.black }}>Orders by Status</h2>
              {data.byStatus.length === 0 ? (
                <p className="text-sm text-center py-8" style={{ color: BRAND.muted }}>No data.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={data.byStatus} dataKey="count" nameKey="status" cx="50%" cy="50%"
                      outerRadius={100} innerRadius={55} paddingAngle={2}
                      label={({ status, percent }) => `${status} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}>
                      {data.byStatus.map((entry, i) => (
                        <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v, name) => [Number(v ?? 0) + " orders", String(name)]}
                      contentStyle={{ background: BRAND.card, border: `1px solid ${BRAND.border}`, borderRadius: 8, fontSize: 12 }} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: BRAND.muted }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Payment Methods + Top Customers */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Payment Methods */}
            <div className="rounded-xl p-5" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <h2 className="font-black text-sm uppercase tracking-widest mb-4" style={{ color: BRAND.black }}>Revenue by Payment Method</h2>
              {data.byPayment.length === 0 ? (
                <p className="text-sm text-center py-8" style={{ color: BRAND.muted }}>No data.</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data.byPayment} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                    <XAxis dataKey="method" tick={{ fontSize: 10, fill: BRAND.muted }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: BRAND.muted }} tickLine={false} axisLine={false}
                      tickFormatter={v => `₱${(v / 1000).toFixed(0)}k`} width={48} />
                    <Tooltip
                      formatter={(v) => [fmt(Number(v ?? 0)), "Revenue"]}
                      contentStyle={{ background: BRAND.card, border: `1px solid ${BRAND.border}`, borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="revenue" fill="#6366F1" radius={[4, 4, 0, 0]}>
                      {data.byPayment.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Top Customers */}
            <div className="rounded-xl overflow-hidden" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <div className="px-5 py-4" style={{ borderBottom: `1px solid ${BRAND.border}` }}>
                <h2 className="font-black text-sm uppercase tracking-widest" style={{ color: BRAND.black }}>Top Customers</h2>
              </div>
              {data.topCustomers.length === 0 ? (
                <p className="text-sm text-center py-8" style={{ color: BRAND.muted }}>No data.</p>
              ) : (
                <div>
                  {data.topCustomers.map((c, i) => (
                    <div key={c.email} className="flex items-center justify-between px-5 py-3"
                      style={{ borderBottom: i < data.topCustomers.length - 1 ? `1px solid ${BRAND.border}` : "none" }}>
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0"
                          style={{ background: `${BRAND.teal}15`, color: BRAND.teal }}>
                          {i + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: BRAND.black }}>{c.name}</p>
                          <p className="text-xs truncate" style={{ color: BRAND.muted }}>{c.email}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <p className="text-sm font-black" style={{ color: BRAND.black }}>{fmt(c.revenue)}</p>
                        <p className="text-xs" style={{ color: BRAND.muted }}>{c.orders} order{c.orders !== 1 ? "s" : ""}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

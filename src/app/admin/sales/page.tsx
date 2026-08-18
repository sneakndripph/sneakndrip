"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { Download, RefreshCw, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

type Period = "today" | "7d" | "30d" | "90d" | "all";

const PERIODS: { id: Period; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "7d", label: "7D" },
  { id: "30d", label: "30D" },
  { id: "90d", label: "90D" },
  { id: "all", label: "All" },
];

const MONO = ["#0A0A0A", "#3A3A35", "#4A4A45", "#5C5C56", "#6B6B65", "#83837B", "#9B9B91", "#B3B3A8"];

const tooltipProps = {
  contentStyle: {
    background: "var(--ink)", border: "none", borderRadius: "6px",
    padding: "8px 12px", color: "var(--paper)", fontSize: "12px",
  },
};

type Metrics = {
  totalRevenue: number; totalCost: number; totalProfit: number;
  totalOrders: number; paidOrders: number;
  cancelledOrders: number; pendingOrders: number; avgOrder: number; cancelRate: number;
};
type PaymentOrder = { order_number: string; customer_name: string; total: number; status: string; created_at: string };
type TopProduct = { name: string; revenue: number; units: number; profit: number | null; image: string | null; slug: string | null };
type SalesData = {
  metrics: Metrics;
  revenueByDay: { date: string; revenue: number; orders: number }[];
  topProducts: TopProduct[];
  byPayment: { method: string; revenue: number; orders: PaymentOrder[] }[];
  byStatus: { status: string; count: number }[];
};

type SaleRow = PaymentOrder & { payment_method: string };
type SortKey = "order_number" | "customer_name" | "payment_method" | "total" | "status" | "created_at";

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

function fmt(n: number) { return `₱${Number(n).toLocaleString("en-PH", { maximumFractionDigits: 0 })}`; }

function StatCard({ label, value, sub, href }: { label: string; value: string; sub?: string; href?: string }) {
  const inner = (
    <>
      <p className="text-admin-eyebrow text-ink-3 mb-2">{label}</p>
      <p className="text-admin-hero text-ink font-display leading-none tracking-[-0.02em] truncate">{value}</p>
      {sub && <p className="text-admin-micro text-ink-3 mt-2">{sub}</p>}
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

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-paper border border-line rounded-md p-5">
      <p className="text-admin-title text-ink mb-4">{title}</p>
      {children}
    </div>
  );
}

function SortHeader({ label, sortField, activeKey, activeDir, onSort }: {
  label: string; sortField: SortKey; activeKey: SortKey; activeDir: "asc" | "desc"; onSort: (key: SortKey) => void;
}) {
  const Icon = activeKey !== sortField ? ChevronsUpDown : activeDir === "asc" ? ChevronUp : ChevronDown;
  return (
    <button onClick={() => onSort(sortField)}
      className={`flex items-center gap-1 text-admin-eyebrow transition-colors duration-admin-fast ${activeKey === sortField ? "text-ink" : "text-ink-3 hover:text-ink-2"}`}>
      {label} <Icon className="w-3 h-3" />
    </button>
  );
}

export default function AdminSalesPage() {
  const [period, setPeriod] = useState<Period>("30d");
  const [data, setData] = useState<SalesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

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

  useEffect(() => { queueMicrotask(() => load(period)); }, [period, load]);

  const rows: SaleRow[] = useMemo(() => {
    if (!data) return [];
    return data.byPayment.flatMap(pm => pm.orders.map(o => ({ ...o, payment_method: pm.method })));
  }, [data]);

  const sortedRows = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [rows, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) { setSortDir(d => d === "asc" ? "desc" : "asc"); return; }
    setSortKey(key); setSortDir("desc");
  }

  function exportCSV() {
    if (!sortedRows.length) return;
    const rowsCsv = [
      ["Order", "Customer", "Payment", "Total", "Status", "Date"],
      ...sortedRows.map(r => [r.order_number, r.customer_name, r.payment_method, r.total, r.status, r.created_at]),
    ];
    const csv = rowsCsv.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "sales-report.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  const m = data?.metrics;
  const best = data?.topProducts[0];
  const xAxisInterval = (data?.revenueByDay.length ?? 0) > 20 ? 4 : (data?.revenueByDay.length ?? 0) > 10 ? 1 : 0;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-admin-hero text-ink font-display font-medium tracking-[-0.02em]">Sales</h1>
          <p className="text-admin text-ink-3 mt-1.5">Revenue and order performance</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex bg-paper-2 rounded-md p-1">
            {PERIODS.map(p => (
              <button key={p.id} type="button" onClick={() => setPeriod(p.id)}
                className={`text-admin-sm px-3 py-1.5 rounded transition-colors duration-admin-fast ${
                  period === p.id ? "bg-paper text-ink font-medium" : "text-ink-3 hover:text-ink"
                }`}>
                {p.label}
              </button>
            ))}
          </div>
          <button onClick={() => load(period)} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-admin-sm font-medium rounded-md border border-line text-ink-2 hover:border-line-strong disabled:opacity-40 transition-colors duration-admin-fast">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button onClick={exportCSV} disabled={!data}
            className="flex items-center gap-1.5 px-3 py-2 text-admin-sm font-medium rounded-md bg-ink text-paper hover:bg-ink-2 disabled:opacity-40 transition-colors duration-admin-fast">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {loading && !data ? (
        <div className="py-24 text-center text-admin text-ink-3">Loading sales data…</div>
      ) : !data || !m ? (
        <div className="py-24 text-center text-admin text-ink-3">Failed to load data. Refresh to try again.</div>
      ) : (
        <div className="space-y-4">
          {/* Stat cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="Total revenue" value={fmt(m.totalRevenue)} sub={`${m.paidOrders} paid orders`} href="/admin/orders?status=delivered" />
            <StatCard label="Total orders" value={String(m.totalOrders)} sub={`${m.pendingOrders} pending`} href="/admin/orders" />
            <StatCard label="Avg. order value" value={fmt(m.avgOrder)} />
            <StatCard label="Best selling product" value={best ? best.name : "—"} sub={best ? `${fmt(best.revenue)} · ${best.units} sold` : undefined} href="/admin/products" />
          </div>

          {/* Revenue trend */}
          <ChartCard title="Revenue over time">
            {data.revenueByDay.length === 0 ? (
              <p className="text-admin text-ink-3 text-center py-8">No paid orders in this period.</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={data.revenueByDay} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--ink-3)" }}
                      axisLine={{ stroke: "var(--line-strong)" }} tickLine={false} interval={xAxisInterval} />
                    <YAxis tick={{ fontSize: 11, fill: "var(--ink-3)" }} axisLine={{ stroke: "var(--line-strong)" }}
                      tickLine={false} tickFormatter={v => `₱${(v / 1000).toFixed(0)}k`} width={48} />
                    <Tooltip {...tooltipProps} formatter={v => [fmt(Number(v)), "Revenue"]} />
                    <Area type="monotone" dataKey="revenue" stroke="var(--ink)" strokeWidth={2}
                      fill="var(--ink)" fillOpacity={0.06} dot={false} activeDot={{ r: 4 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </>
            )}
          </ChartCard>

          <div className="grid lg:grid-cols-2 gap-4">
            {/* Orders by status */}
            <ChartCard title="Orders by status">
              {data.byStatus.length === 0 ? (
                <p className="text-admin text-ink-3 text-center py-8">No data.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.byStatus} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                    <XAxis dataKey="status" tick={{ fontSize: 11, fill: "var(--ink-3)" }}
                      axisLine={{ stroke: "var(--line-strong)" }} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "var(--ink-3)" }} axisLine={{ stroke: "var(--line-strong)" }} tickLine={false} allowDecimals={false} />
                    <Tooltip {...tooltipProps} formatter={v => [`${v} orders`, ""]} cursor={{ fill: "var(--paper-2)" }} />
                    <Bar dataKey="count" radius={[3, 3, 0, 0]} maxBarSize={40}>
                      {data.byStatus.map((s, i) => <Cell key={s.status} fill={MONO[i % MONO.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            {/* Sales by payment method */}
            <ChartCard title="Sales by payment method">
              {data.byPayment.length === 0 ? (
                <p className="text-admin text-ink-3 text-center py-8">No data.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.byPayment} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                    <XAxis dataKey="method" tick={{ fontSize: 11, fill: "var(--ink-3)" }}
                      axisLine={{ stroke: "var(--line-strong)" }} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "var(--ink-3)" }} axisLine={{ stroke: "var(--line-strong)" }}
                      tickLine={false} tickFormatter={v => `₱${(v / 1000).toFixed(0)}k`} width={48} />
                    <Tooltip {...tooltipProps} formatter={v => [fmt(Number(v)), "Revenue"]} cursor={{ fill: "var(--paper-2)" }} />
                    <Bar dataKey="revenue" radius={[3, 3, 0, 0]} maxBarSize={40}>
                      {data.byPayment.map((p, i) => <Cell key={p.method} fill={MONO[i % MONO.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>

          {/* Top products */}
          <ChartCard title="Top products by revenue">
            {data.topProducts.length === 0 ? (
              <p className="text-admin text-ink-3 text-center py-8">No data.</p>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(160, data.topProducts.length * 32)}>
                <BarChart data={data.topProducts} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "var(--ink-3)" }} axisLine={{ stroke: "var(--line-strong)" }}
                    tickLine={false} tickFormatter={v => `₱${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11, fill: "var(--ink-3)" }}
                    axisLine={{ stroke: "var(--line-strong)" }} tickLine={false} />
                  <Tooltip {...tooltipProps} formatter={v => [fmt(Number(v)), "Revenue"]} cursor={{ fill: "var(--paper-2)" }} />
                  <Bar dataKey="revenue" fill="var(--ink)" radius={[0, 3, 3, 0]} maxBarSize={16} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* Data table */}
          <div className="bg-paper border border-line rounded-md overflow-hidden">
            <div className="px-5 py-4 border-b border-line">
              <p className="text-admin-title text-ink">Sales entries</p>
            </div>
            {sortedRows.length === 0 ? (
              <p className="text-admin text-ink-3 text-center py-12">No paid orders in this period.</p>
            ) : (
              <>
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-paper-2 border-b border-line-strong">
                        <th className="px-4 py-3 text-left"><SortHeader label="Order" sortField="order_number" activeKey={sortKey} activeDir={sortDir} onSort={toggleSort} /></th>
                        <th className="px-4 py-3 text-left"><SortHeader label="Customer" sortField="customer_name" activeKey={sortKey} activeDir={sortDir} onSort={toggleSort} /></th>
                        <th className="px-4 py-3 text-left"><SortHeader label="Payment" sortField="payment_method" activeKey={sortKey} activeDir={sortDir} onSort={toggleSort} /></th>
                        <th className="px-4 py-3 text-left"><SortHeader label="Total" sortField="total" activeKey={sortKey} activeDir={sortDir} onSort={toggleSort} /></th>
                        <th className="px-4 py-3 text-left"><SortHeader label="Status" sortField="status" activeKey={sortKey} activeDir={sortDir} onSort={toggleSort} /></th>
                        <th className="px-4 py-3 text-left"><SortHeader label="Date" sortField="created_at" activeKey={sortKey} activeDir={sortDir} onSort={toggleSort} /></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {sortedRows.map(r => (
                        <tr key={r.order_number}
                          className="even:bg-paper-2 hover:bg-admin-row-hover transition-colors duration-admin-fast">
                          <td className="px-4 py-3 text-admin-sm font-semibold text-ink">
                            <Link href={`/admin/orders?q=${encodeURIComponent(r.order_number)}`} className="hover:text-ink-2">
                              {r.order_number}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-admin-sm text-ink-2">{r.customer_name}</td>
                          <td className="px-4 py-3 text-admin-sm text-ink-3 capitalize">{r.payment_method}</td>
                          <td className="px-4 py-3 text-admin-sm font-semibold text-ink">{fmt(r.total)}</td>
                          <td className="px-4 py-3 text-admin-sm text-ink-3 capitalize">{r.status}</td>
                          <td className="px-4 py-3 text-admin-sm text-ink-3">
                            {new Date(r.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="md:hidden divide-y divide-line">
                  {sortedRows.map(r => (
                    <Link key={r.order_number} href={`/admin/orders?q=${encodeURIComponent(r.order_number)}`}
                      className="flex items-center justify-between gap-3 px-4 py-3.5">
                      <div className="min-w-0">
                        <p className="text-admin-sm font-semibold text-ink">{r.order_number}</p>
                        <p className="text-admin-micro text-ink-3 mt-0.5 truncate">{r.customer_name} · {r.payment_method}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-admin-sm font-semibold text-ink">{fmt(r.total)}</p>
                        <p className="text-admin-micro text-ink-3 capitalize">{r.status}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

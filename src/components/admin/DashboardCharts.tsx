"use client";

import { useRouter } from "next/navigation";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { BRAND, FONTS } from "@/lib/constants";

type DayData    = { date: string; revenue: number; orders: number };
type StatusData = { name: string; value: number; color: string };
type ProductData = { name: string; revenue: number };

const STATUS_COLORS: Record<string, string> = {
  pending: "#D97706", paid: BRAND.teal, processing: "#6366F1",
  shipped: "#3B82F6", delivered: "#10B981", cancelled: BRAND.red,
};

function CardWrap({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
      <div className="px-5 py-4" style={{ borderBottom: `1px solid ${BRAND.border}` }}>
        <h3 style={{ fontFamily: FONTS.display, fontSize: "1rem", letterSpacing: "0.04em", color: BRAND.black }}>{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

const tooltipStyle = {
  contentStyle: { background: BRAND.card, border: `1px solid ${BRAND.border}`, borderRadius: 8, fontFamily: FONTS.body, fontSize: 12 },
  labelStyle: { color: BRAND.black, fontWeight: 700 },
  itemStyle: { color: BRAND.muted },
};

export default function DashboardCharts({
  revenueByDay, ordersByStatus, topProducts, period = "week",
}: {
  revenueByDay: DayData[];
  ordersByStatus: StatusData[];
  topProducts: ProductData[];
  period?: string;
}) {
  const router = useRouter();
  const xAxisInterval = period === "month" ? 4 : period === "today" ? 3 : "preserveStartEnd";

  return (
    <div className="grid lg:grid-cols-3 gap-5">
      {/* Revenue + Orders line — spans 2 cols */}
      <div className="lg:col-span-2">
        <CardWrap title="REVENUE CHART">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueByDay} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={BRAND.teal} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={BRAND.teal} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={BRAND.border} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: BRAND.muted }} axisLine={false} tickLine={false} interval={xAxisInterval} />
              <YAxis tick={{ fontSize: 10, fill: BRAND.muted }} axisLine={false} tickLine={false}
                tickFormatter={v => `₱${(v / 1000).toFixed(0)}k`} />
              <Tooltip {...tooltipStyle}
                formatter={(v, name) =>
                  name === "revenue" ? [`₱${Number(v).toLocaleString()}`, "Revenue"] : [v, "Orders"]
                } />
              <Area type="monotone" dataKey="revenue" stroke={BRAND.teal} strokeWidth={2}
                fill="url(#revGrad)" dot={{ r: 3, fill: BRAND.teal }} activeDot={{ r: 5 }} />
              <Area type="monotone" dataKey="orders" stroke={BRAND.black} strokeWidth={1.5}
                fill="none" strokeDasharray="4 2" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 justify-end">
            <span className="flex items-center gap-1.5 text-[10px]" style={{ color: BRAND.muted }}>
              <span className="w-6 h-0.5 inline-block" style={{ background: BRAND.teal }} /> Revenue
            </span>
            <span className="flex items-center gap-1.5 text-[10px]" style={{ color: BRAND.muted }}>
              <span className="w-6 h-0.5 inline-block border-t-2 border-dashed" style={{ borderColor: BRAND.black }} /> Orders
            </span>
          </div>
        </CardWrap>
      </div>

      {/* Orders by status — donut */}
      <CardWrap title="ORDERS BY STATUS">
        <p className="text-[10px] mb-1" style={{ color: BRAND.mutedLight }}>Click to view orders</p>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={ordersByStatus} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
              dataKey="value" paddingAngle={2}
              style={{ cursor: "pointer" }}
              onClick={(entry) => {
                if (entry?.name) router.push(`/admin/orders?status=${encodeURIComponent(entry.name.toLowerCase())}`);
              }}>
              {ordersByStatus.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip {...tooltipStyle}
              formatter={(v, name) => [v, name]} />
            <Legend iconType="circle" iconSize={8}
              formatter={(value) => <span style={{ fontSize: 10, color: BRAND.muted }}>{value}</span>} />
          </PieChart>
        </ResponsiveContainer>
      </CardWrap>

      {/* Top products bar */}
      <div className="lg:col-span-3">
        <CardWrap title="TOP PRODUCTS BY REVENUE">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={topProducts} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={BRAND.border} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: BRAND.muted }} axisLine={false} tickLine={false}
                tickFormatter={v => `₱${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" width={130}
                tick={{ fontSize: 10, fill: BRAND.black }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle}
                formatter={(v) => [`₱${Number(v).toLocaleString()}`, "Revenue"]} />
              <Bar dataKey="revenue" fill={BRAND.teal} radius={[0, 4, 4, 0]} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </CardWrap>
      </div>
    </div>
  );
}

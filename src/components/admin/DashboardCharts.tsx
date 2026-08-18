"use client";

import { useRouter } from "next/navigation";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

type DayData = { date: string; revenue: number; orders: number };
type StatusData = { name: string; value: number; color: string };
type ProductData = { name: string; revenue: number };

const tooltipProps = {
  contentStyle: {
    background: "var(--ink)",
    border: "none",
    borderRadius: "6px",
    padding: "8px 12px",
    color: "var(--paper)",
    fontSize: "12px",
  },
};

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-paper border border-line rounded-md p-5">
      <p className="text-admin-title text-ink mb-4">{title}</p>
      {children}
    </div>
  );
}

export default function DashboardCharts({
  revenueByDay, ordersByStatus, topProducts,
}: {
  revenueByDay: DayData[];
  ordersByStatus: StatusData[];
  topProducts: ProductData[];
}) {
  const router = useRouter();
  const xAxisInterval = revenueByDay.length > 20 ? 4 : revenueByDay.length > 10 ? 1 : 0;

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      {/* Revenue */}
      <ChartCard title="Revenue">
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={revenueByDay} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--ink-3)" }}
              axisLine={{ stroke: "var(--line-strong)" }} tickLine={false} interval={xAxisInterval} />
            <YAxis tick={{ fontSize: 11, fill: "var(--ink-3)" }} axisLine={{ stroke: "var(--line-strong)" }}
              tickLine={false} tickFormatter={v => `₱${(v / 1000).toFixed(0)}k`} />
            <Tooltip {...tooltipProps}
              formatter={(v, name) => name === "revenue" ? [`₱${Number(v).toLocaleString()}`, "Revenue"] : [v, "Orders"]} />
            <Area type="monotone" dataKey="revenue" stroke="var(--ink)" strokeWidth={2}
              fill="var(--ink)" fillOpacity={0.06} dot={false} activeDot={{ r: 4 }} />
            <Area type="monotone" dataKey="orders" stroke="var(--ink-3)" strokeWidth={1.5}
              strokeDasharray="4 3" fill="none" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-3 justify-end">
          <span className="flex items-center gap-1.5 text-admin-micro text-ink-3">
            <span className="w-4 h-0.5 inline-block bg-ink" /> Revenue
          </span>
          <span className="flex items-center gap-1.5 text-admin-micro text-ink-3">
            <span className="w-4 h-0.5 inline-block border-t border-dashed border-ink-3" /> Orders
          </span>
        </div>
      </ChartCard>

      {/* Orders by status */}
      <ChartCard title="Orders by status">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={ordersByStatus} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
              dataKey="value" paddingAngle={2} style={{ cursor: "pointer" }}
              onClick={entry => { if (entry?.name) router.push(`/admin/orders?status=${encodeURIComponent(entry.name.toLowerCase())}`); }}>
              {ordersByStatus.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Pie>
            <Tooltip {...tooltipProps} formatter={(v, name) => [v, name]} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-center mt-1">
          {ordersByStatus.map(s => (
            <span key={s.name} className="flex items-center gap-1.5 text-admin-micro text-ink-3">
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.color }} />
              {s.name} ({s.value})
            </span>
          ))}
        </div>
      </ChartCard>

      {/* Top products */}
      <div className="lg:col-span-2">
        <ChartCard title="Top products by revenue">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={topProducts} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "var(--ink-3)" }} axisLine={{ stroke: "var(--line-strong)" }}
                tickLine={false} tickFormatter={v => `₱${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11, fill: "var(--ink-3)" }}
                axisLine={{ stroke: "var(--line-strong)" }} tickLine={false} />
              <Tooltip {...tooltipProps} formatter={v => [`₱${Number(v).toLocaleString()}`, "Revenue"]} />
              <Bar dataKey="revenue" fill="var(--ink)" radius={[0, 3, 3, 0]} maxBarSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

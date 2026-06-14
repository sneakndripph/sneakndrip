"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BRAND, FONTS } from "@/lib/constants";
import { Clock, CheckCircle, Truck } from "lucide-react";

const STATUS_CFG = {
  pending:    { icon: Clock,       color: "#D97706", bg: "rgba(217,119,6,0.1)",   label: "Pending" },
  paid:       { icon: CheckCircle, color: BRAND.teal, bg: `rgba(91,184,180,0.1)`, label: "Paid" },
  processing: { icon: Clock,       color: "#6366F1", bg: "rgba(99,102,241,0.1)",  label: "Processing" },
  shipped:    { icon: Truck,       color: "#3B82F6", bg: "rgba(59,130,246,0.1)",  label: "Shipped" },
  delivered:  { icon: CheckCircle, color: "#10B981", bg: "rgba(16,185,129,0.1)",  label: "Delivered" },
} as const;

type Order = {
  order_number: string;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
  order_items: { product_name: string; size: string }[];
};

export default function DashboardRecentOrdersTable({ orders }: { orders: Order[] }) {
  const router = useRouter();

  if (!orders.length) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm" style={{ color: BRAND.muted }}>No orders yet.</p>
      </div>
    );
  }

  return (
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
          {orders.map(order => {
            const cfg = STATUS_CFG[order.status as keyof typeof STATUS_CFG];
            const Icon = cfg?.icon ?? Clock;
            const firstItem = (order.order_items as { product_name: string; size: string }[])?.[0];
            const href = `/admin/orders?q=${order.order_number}`;
            return (
              <tr key={order.order_number}
                className="transition-colors hover:bg-black/[0.02] cursor-pointer"
                style={{ borderBottom: `1px solid ${BRAND.border}` }}
                onClick={() => router.push(href)}>
                <td className="px-4 py-3.5 text-xs font-bold">
                  <Link href={href}
                    className="hover:underline"
                    style={{ color: BRAND.black }}
                    onClick={e => e.stopPropagation()}>
                    {order.order_number}
                  </Link>
                </td>
                <td className="px-4 py-3.5 text-xs font-semibold" style={{ color: BRAND.black, fontFamily: FONTS.body }}>{order.customer_name}</td>
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
  );
}

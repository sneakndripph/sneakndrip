"use client";

import { useState } from "react";
import Link from "next/link";
import { BRAND, FONTS } from "@/lib/constants";
import { Clock, CheckCircle, Truck, X } from "lucide-react";

const STATUS_CFG = {
  pending:    { icon: Clock,       color: "#D97706", bg: "rgba(217,119,6,0.1)",   label: "Pending" },
  paid:       { icon: CheckCircle, color: BRAND.teal, bg: `rgba(91,184,180,0.1)`, label: "Paid" },
  processing: { icon: Clock,       color: "#6366F1", bg: "rgba(99,102,241,0.1)",  label: "Processing" },
  shipped:    { icon: Truck,       color: "#3B82F6", bg: "rgba(59,130,246,0.1)",  label: "Shipped" },
  delivered:  { icon: CheckCircle, color: "#10B981", bg: "rgba(16,185,129,0.1)",  label: "Delivered" },
  cancelled:  { icon: X,          color: "#D94F3D", bg: "rgba(217,79,61,0.1)",   label: "Cancelled" },
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
  const [modalOrder, setModalOrder] = useState<Order | null>(null);

  if (!orders.length) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm" style={{ color: BRAND.muted }}>No orders yet.</p>
      </div>
    );
  }

  return (
    <>
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
              const firstItem = order.order_items?.[0];
              return (
                <tr key={order.order_number}
                  className="transition-colors hover:bg-black/[0.02] cursor-pointer"
                  style={{ borderBottom: `1px solid ${BRAND.border}` }}
                  onClick={() => setModalOrder(order)}>
                  <td className="px-4 py-3.5 text-xs font-bold" style={{ color: BRAND.black }}>
                    {order.order_number}
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

      {/* Order detail modal */}
      {modalOrder && (() => {
        const cfg = STATUS_CFG[modalOrder.status as keyof typeof STATUS_CFG];
        const Icon = cfg?.icon ?? Clock;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
            <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${BRAND.border}` }}>
                <div>
                  <p className="font-black text-sm" style={{ color: BRAND.black, fontFamily: FONTS.display, letterSpacing: "0.04em" }}>
                    {modalOrder.order_number}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: BRAND.muted }}>
                    {new Date(modalOrder.created_at).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full"
                    style={{ background: cfg?.bg ?? "#eee", color: cfg?.color ?? "#666" }}>
                    <Icon className="w-3 h-3" />{cfg?.label ?? modalOrder.status}
                  </span>
                  <button onClick={() => setModalOrder(null)} className="transition-opacity hover:opacity-60">
                    <X className="w-4 h-4" style={{ color: BRAND.muted }} />
                  </button>
                </div>
              </div>

              {/* Customer */}
              <div className="px-5 py-3" style={{ borderBottom: `1px solid ${BRAND.border}` }}>
                <p className="text-xs font-bold uppercase tracking-wide mb-0.5" style={{ color: BRAND.muted }}>Customer</p>
                <p className="text-sm font-semibold" style={{ color: BRAND.black }}>{modalOrder.customer_name}</p>
              </div>

              {/* Items */}
              <div style={{ borderBottom: `1px solid ${BRAND.border}` }}>
                <p className="px-5 pt-3 pb-1 text-xs font-bold uppercase tracking-wide" style={{ color: BRAND.muted }}>Items</p>
                {modalOrder.order_items?.map((item, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-2">
                    <p className="text-sm" style={{ color: BRAND.black }}>{item.product_name}</p>
                    <p className="text-xs" style={{ color: BRAND.muted }}>Size {item.size}</p>
                  </div>
                ))}
              </div>

              {/* Total + link */}
              <div className="px-5 py-4 flex items-center justify-between">
                <p className="font-black text-base" style={{ color: BRAND.black }}>
                  Total ₱{Number(modalOrder.total).toLocaleString()}
                </p>
                <Link
                  href={`/admin/orders?q=${modalOrder.order_number}`}
                  onClick={() => setModalOrder(null)}
                  className="text-xs font-bold uppercase tracking-wide transition-opacity hover:opacity-70"
                  style={{ color: BRAND.teal }}>
                  View Full Order →
                </Link>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}

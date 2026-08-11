"use client";

import { useRouter } from "next/navigation";
import OrderStatusBadge from "./OrderStatusBadge";

type OrderItem = { product_name: string; size: string };

type Order = {
  order_number: string;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
  order_items: OrderItem[];
};

function itemSummary(items: OrderItem[]) {
  if (!items?.length) return "—";
  const first = items[0];
  const rest = items.length > 1 ? ` +${items.length - 1} more` : "";
  return `${first.product_name} (${first.size})${rest}`;
}

export default function DashboardRecentOrdersTable({ orders }: { orders: Order[] }) {
  const router = useRouter();

  if (!orders.length) {
    return (
      <div className="py-12 text-center">
        <p className="text-admin-sm text-ink-3">No orders yet.</p>
      </div>
    );
  }

  function goToOrder(o: Order) {
    router.push(`/admin/orders?q=${encodeURIComponent(o.order_number)}`);
  }

  return (
    <div className="rounded-md overflow-hidden border border-line">
      {/* Desktop table */}
      <table className="w-full hidden md:table">
        <thead>
          <tr className="bg-paper-2 border-b border-line-strong">
            {["Order", "Customer", "Item", "Total", "Status", "Date"].map(h => (
              <th key={h} className="px-4 py-3 text-left text-admin-eyebrow text-ink-3">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {orders.map(o => (
            <tr key={o.order_number}
              className="cursor-pointer even:bg-paper-2 hover:bg-admin-row-hover transition-colors duration-admin-fast"
              onClick={() => goToOrder(o)}>
              <td className="px-4 py-3.5 text-admin-sm font-semibold text-ink">{o.order_number}</td>
              <td className="px-4 py-3.5 text-admin-sm font-medium text-ink">{o.customer_name}</td>
              <td className="px-4 py-3.5 text-admin-sm text-ink-2 max-w-[180px] truncate">
                {itemSummary(o.order_items)}
              </td>
              <td className="px-4 py-3.5 text-admin-sm font-semibold text-ink">
                ₱{Number(o.total).toLocaleString()}
              </td>
              <td className="px-4 py-3.5">
                <OrderStatusBadge status={o.status} />
              </td>
              <td className="px-4 py-3.5 text-admin-sm text-ink-3">
                {new Date(o.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-line">
        {orders.map(o => (
          <button key={o.order_number}
            className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left"
            onClick={() => goToOrder(o)}>
            <div className="min-w-0">
              <p className="text-admin-sm font-semibold text-ink">{o.order_number}</p>
              <p className="text-admin-micro text-ink-3 mt-0.5 truncate">
                {o.customer_name} · ₱{Number(o.total).toLocaleString()}
              </p>
            </div>
            <div className="shrink-0 ml-2">
              <OrderStatusBadge status={o.status} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

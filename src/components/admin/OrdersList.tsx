"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Package, MoreVertical, Truck, Copy, User, XCircle, ChevronDown } from "lucide-react";
import OrderStatusBadge, { STATUS_META } from "./OrderStatusBadge";
import type { Order, OrderItem } from "./AdminOrdersClient";

const PAYMENT_LABELS: Record<string, string> = {
  gcash: "GCash", maya: "Maya", bank_transfer: "Bank Transfer", cod: "COD",
};

function itemsSummary(items: OrderItem[]) {
  if (!items.length) return "—";
  const first = items[0];
  const rest = items.length > 1 ? ` +${items.length - 1} more` : "";
  return `${first.product_name} (${first.size})${rest}`;
}

export default function OrdersList({
  orders, totalOrdersCount, selectedIds, onToggleSelect, onSelectAll, onRowClick,
  onBulkStatusChange, onClearSelection, onQuickShip, onQuickCancel,
}: {
  orders: Order[]; totalOrdersCount: number;
  selectedIds: Set<string>; onToggleSelect: (id: string) => void; onSelectAll: (checked: boolean) => void;
  onRowClick: (o: Order) => void;
  onBulkStatusChange: (status: string) => void; onClearSelection: () => void;
  onQuickShip: (o: Order) => void; onQuickCancel: (o: Order) => void;
}) {
  const [bulkOpen, setBulkOpen] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const bulkRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (bulkRef.current && !bulkRef.current.contains(e.target as Node)) setBulkOpen(false);
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpenId(null);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  function copyOrderNumber(o: Order) {
    navigator.clipboard.writeText(o.order_number).then(() => toast.success("Order number copied"));
    setMenuOpenId(null);
  }

  return (
    <div className="rounded-md overflow-hidden bg-paper border border-line">
      {/* Sticky bulk-actions bar */}
      {selectedIds.size > 0 && (
        <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-2.5 bg-ink text-paper">
          <span className="text-admin-sm font-medium">
            {selectedIds.size} order{selectedIds.size !== 1 ? "s" : ""} selected
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <div className="relative" ref={bulkRef}>
              <button type="button" onClick={() => setBulkOpen(o => !o)}
                className="flex items-center gap-1.5 text-admin-sm px-3 py-1.5 rounded-md border border-paper/30 hover:bg-paper/10 transition-colors duration-admin-fast">
                Set status…
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-admin-fast ${bulkOpen ? "rotate-180" : ""}`} />
              </button>
              {bulkOpen && (
                <div className="absolute right-0 top-full mt-1 min-w-[150px] bg-paper border border-line rounded-md shadow-lg overflow-hidden">
                  {(Object.entries(STATUS_META) as [keyof typeof STATUS_META, typeof STATUS_META[keyof typeof STATUS_META]][]).map(([k, v]) => (
                    <button key={k} type="button"
                      onClick={() => { onBulkStatusChange(k); setBulkOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-admin-sm text-left text-ink hover:bg-admin-row-hover transition-colors duration-admin-fast">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${v.dot}`} />
                      {v.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={onClearSelection}
              className="text-admin-sm px-2 py-1.5 opacity-80 hover:opacity-100 transition-opacity duration-admin-fast">
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Desktop table */}
      <table className="w-full hidden md:table">
        <thead>
          <tr className="border-b border-line bg-paper-2">
            <th className="px-3 py-3 w-10">
              <input type="checkbox"
                checked={selectedIds.size === orders.length && orders.length > 0}
                onChange={e => onSelectAll(e.target.checked)}
                className="w-3.5 h-3.5 cursor-pointer accent-ink" />
            </th>
            {["Order", "Customer", "Items", "Payment", "Total", "Status", "Date"].map(h => (
              <th key={h} className="px-4 py-3 text-left text-admin-eyebrow text-ink-3">{h}</th>
            ))}
            <th className="px-3 py-3 w-10" />
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {orders.map(o => (
            <tr key={o.id}
              className="cursor-pointer hover:bg-admin-row-hover transition-colors duration-admin-fast"
              onClick={() => onRowClick(o)}>
              <td className="px-3 py-3.5" onClick={e => e.stopPropagation()}>
                <input type="checkbox"
                  checked={selectedIds.has(o.id)}
                  onChange={() => onToggleSelect(o.id)}
                  className="w-3.5 h-3.5 cursor-pointer accent-ink" />
              </td>
              <td className="px-4 py-3.5 text-admin-sm font-semibold text-ink">{o.order_number}</td>
              <td className="px-4 py-3.5">
                <p className="text-admin-sm font-medium text-ink">{o.customer_name}</p>
                <p className="text-admin-micro text-ink-3">{o.customer_email}</p>
              </td>
              <td className="px-4 py-3.5 text-admin-sm text-ink-2 max-w-[180px] truncate">
                {itemsSummary(o.order_items)}
              </td>
              <td className="px-4 py-3.5 text-admin-sm text-ink-2">
                {PAYMENT_LABELS[o.payment_method] ?? o.payment_method}
                {o.payment_type === "downpayment" && <span className="block text-admin-micro text-ink-3">Downpayment</span>}
              </td>
              <td className="px-4 py-3.5 text-admin-sm font-semibold text-ink">
                ₱{Number(o.total).toLocaleString()}
              </td>
              <td className="px-4 py-3.5">
                <OrderStatusBadge status={o.status} codDelivered={o.payment_method === "cod"} />
              </td>
              <td className="px-4 py-3.5 text-admin-sm text-ink-3">
                {new Date(o.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
              </td>
              <td className="px-3 py-3.5 text-right relative" onClick={e => e.stopPropagation()}>
                <button type="button" onClick={() => setMenuOpenId(id => id === o.id ? null : o.id)}
                  className="p-1.5 rounded-md text-ink-3 hover:bg-admin-row-hover hover:text-ink transition-colors duration-admin-fast">
                  <MoreVertical className="w-4 h-4" />
                </button>
                {menuOpenId === o.id && (
                  <div ref={menuRef} className="absolute right-3 top-full z-30 min-w-[170px] bg-paper border border-line rounded-md shadow-lg overflow-hidden text-left">
                    <button type="button" onClick={() => { onQuickShip(o); setMenuOpenId(null); }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-admin-sm text-ink hover:bg-admin-row-hover transition-colors duration-admin-fast">
                      <Truck className="w-3.5 h-3.5 text-ink-3" /> Mark Shipped
                    </button>
                    <button type="button" onClick={() => copyOrderNumber(o)}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-admin-sm text-ink hover:bg-admin-row-hover transition-colors duration-admin-fast">
                      <Copy className="w-3.5 h-3.5 text-ink-3" /> Copy Order #
                    </button>
                    <Link href={`/admin/customers?q=${encodeURIComponent(o.customer_email)}`}
                      onClick={() => setMenuOpenId(null)}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-admin-sm text-ink hover:bg-admin-row-hover transition-colors duration-admin-fast">
                      <User className="w-3.5 h-3.5 text-ink-3" /> View Customer
                    </Link>
                    <button type="button" onClick={() => { onQuickCancel(o); setMenuOpenId(null); }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-admin-sm text-state-error hover:bg-admin-row-hover transition-colors duration-admin-fast border-t border-line">
                      <XCircle className="w-3.5 h-3.5" /> Cancel
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-line">
        {orders.map(o => (
          <div key={o.id} className="flex items-center gap-3 px-4 py-3.5">
            <div onClick={e => e.stopPropagation()}>
              <input type="checkbox"
                checked={selectedIds.has(o.id)}
                onChange={() => onToggleSelect(o.id)}
                className="w-3.5 h-3.5 cursor-pointer accent-ink" />
            </div>
            <button className="flex-1 flex items-center justify-between text-left min-w-0" onClick={() => onRowClick(o)}>
              <div className="min-w-0">
                <p className="text-admin-sm font-semibold text-ink">{o.order_number}</p>
                <p className="text-admin-micro text-ink-3 mt-0.5 truncate">
                  {o.customer_name} · ₱{Number(o.total).toLocaleString()}
                </p>
              </div>
              <div className="shrink-0 ml-2">
                <OrderStatusBadge status={o.status} codDelivered={o.payment_method === "cod"} />
              </div>
            </button>
          </div>
        ))}
      </div>

      {orders.length === 0 && (
        <div className="py-16 px-6 text-center">
          <Package className="w-8 h-8 mx-auto mb-3 text-ink-3" strokeWidth={1.5} />
          <p className="text-admin-title text-ink">No orders</p>
          <p className="text-admin-sm text-ink-3 mt-1.5">
            {totalOrdersCount === 0 ? "Orders will appear here once customers start buying." : "No orders match your filters."}
          </p>
        </div>
      )}
    </div>
  );
}

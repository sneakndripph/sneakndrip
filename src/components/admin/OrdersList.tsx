"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Package, MoreVertical, Truck, Copy, User, XCircle } from "lucide-react";
import OrderStatusBadge from "./OrderStatusBadge";
import BulkActionsBar, { type BulkAction } from "./BulkActionsBar";
import type { Order, OrderItem } from "./AdminOrdersClient";
import SortableHeader from "./SortableHeader";
import type { SortDirection } from "@/hooks/useSortableTable";

export const PAYMENT_LABELS: Record<string, string> = {
  gcash: "GCash", maya: "Maya", bank_transfer: "Bank Transfer", cod: "COD",
};

function itemsSummary(items: OrderItem[]) {
  if (!items.length) return "—";
  const first = items[0];
  const rest = items.length > 1 ? ` +${items.length - 1} more` : "";
  return `${first.product_name} (${first.size})${rest}`;
}

export default function OrdersList({
  orders, totalOrdersCount, couponFilter, selectedIds, selectedVisibleCount, onToggleSelect, onSelectAll, onRowClick,
  bulkActions, bulkBusy, onClearSelection, onQuickShip, onQuickCancel,
  sortKey, sortDirection, onSort,
}: {
  orders: Order[]; totalOrdersCount: number; couponFilter?: string | null;
  selectedIds: Set<string>; selectedVisibleCount: number;
  onToggleSelect: (id: string) => void; onSelectAll: (checked: boolean) => void;
  onRowClick: (o: Order) => void;
  bulkActions: BulkAction[]; bulkBusy: boolean; onClearSelection: () => void;
  onQuickShip: (o: Order) => void; onQuickCancel: (o: Order) => void;
  sortKey: string | null; sortDirection: SortDirection; onSort: (key: string) => void;
}) {
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpenId(null);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const allVisibleSelected = orders.length > 0 && selectedVisibleCount === orders.length;
  const someVisibleSelected = selectedVisibleCount > 0 && !allVisibleSelected;

  function copyOrderNumber(o: Order) {
    navigator.clipboard.writeText(o.order_number).then(() => toast.success("Order number copied"));
    setMenuOpenId(null);
  }

  return (
    <div className="rounded-md overflow-hidden bg-paper border border-line">
      <BulkActionsBar
        selectedCount={selectedVisibleCount}
        noun="order"
        actions={bulkActions}
        onClear={onClearSelection}
        busy={bulkBusy}
        busyLabel={`Updating ${selectedVisibleCount} order${selectedVisibleCount !== 1 ? "s" : ""}…`}
        menuLabel="Set status…"
      />

      {/* Desktop table */}
      <table className="w-full hidden md:table">
        <thead className="sticky top-0 z-10 bg-paper border-b border-line-strong">
          <tr className="bg-paper-2">
            <th className="px-3 py-3 w-10">
              <input type="checkbox" aria-label="Select all visible orders"
                checked={allVisibleSelected}
                ref={el => { if (el) el.indeterminate = someVisibleSelected; }}
                onChange={e => onSelectAll(e.target.checked)}
                disabled={bulkBusy || orders.length === 0}
                className="w-3.5 h-3.5 cursor-pointer accent-ink" />
            </th>
            {["Order", "Customer", "Items", "Payment"].map(h => (
              <th key={h} className="px-4 py-3 text-left text-admin-eyebrow text-ink-3">{h}</th>
            ))}
            <SortableHeader label="Total" sortKey="total" currentSortKey={sortKey} direction={sortDirection} onSort={onSort} />
            <th className="px-4 py-3 text-left text-admin-eyebrow text-ink-3">Status</th>
            <SortableHeader label="Date" sortKey="created_at" currentSortKey={sortKey} direction={sortDirection} onSort={onSort} />
            <th className="px-3 py-3 w-10" />
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {orders.map(o => (
            <tr key={o.id}
              className="cursor-pointer even:bg-paper-2 hover:bg-admin-row-hover transition-colors duration-admin-fast"
              onClick={() => onRowClick(o)}>
              <td className="px-3 py-3.5" onClick={e => e.stopPropagation()}>
                <input type="checkbox" aria-label={`Select ${o.order_number}`}
                  checked={selectedIds.has(o.id)}
                  onChange={() => onToggleSelect(o.id)}
                  disabled={bulkBusy}
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
        {orders.length > 0 && (
          <label className="flex items-center gap-3 px-4 py-2.5 bg-paper-2 text-admin-eyebrow text-ink-3 cursor-pointer">
            <input type="checkbox"
              checked={allVisibleSelected}
              ref={el => { if (el) el.indeterminate = someVisibleSelected; }}
              onChange={e => onSelectAll(e.target.checked)}
              disabled={bulkBusy}
              className="w-4 h-4 cursor-pointer accent-ink" />
            Select all
          </label>
        )}
        {orders.map(o => (
          <div key={o.id} className="flex items-center gap-3 px-4 py-3.5">
            <div onClick={e => e.stopPropagation()}>
              <input type="checkbox" aria-label={`Select ${o.order_number}`}
                checked={selectedIds.has(o.id)}
                onChange={() => onToggleSelect(o.id)}
                disabled={bulkBusy}
                className="w-4 h-4 cursor-pointer accent-ink" />
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
            {couponFilter
              ? `No orders yet for this voucher: ${couponFilter}`
              : totalOrdersCount === 0 ? "Orders will appear here once customers start buying." : "No orders match your filters."}
          </p>
        </div>
      )}
    </div>
  );
}

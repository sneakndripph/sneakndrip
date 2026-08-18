"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Download } from "lucide-react";
import OrdersFilterBar, { periodStart, type Period } from "./OrdersFilterBar";
import OrdersList from "./OrdersList";
import OrderDetailDrawer from "./OrderDetailDrawer";
import { STATUSES, statusMeta, type Status } from "./OrderStatusBadge";

export type OrderItem = {
  product_name: string; brand: string; size: string; quantity: number; unit_price: number; payment_type: string;
  products: { images: string[] | null; bg: string | null } | null;
};
export type Order = {
  id: string; order_number: string; customer_name: string; customer_email: string; customer_mobile: string;
  shipping_street: string; shipping_barangay: string; shipping_city: string; shipping_province: string;
  total: number; payment_method: string; payment_type: string; status: string; tracking_number: string | null;
  proof_of_payment: string | null; payment_reference: string | null; shipping_fee: number | null;
  balance_reference: string | null; balance_proof_url: string | null; balance_paid_at: string | null;
  balance_payment_method: string | null; admin_notes: string | null; created_at: string; order_items: OrderItem[];
};

function getNextAction(status: string, isCOD: boolean, paymentType?: string): { label: string; next: string } | null {
  const isDP = paymentType === "downpayment";
  if (isCOD) {
    const COD_ACTIONS: Record<string, { label: string; next: string } | null> = {
      pending: { label: "Mark as Processing", next: "processing" },
      processing: { label: "Mark as Shipped", next: "shipped" },
      shipped: { label: "Delivered / Cash Collected", next: "delivered" },
      delivered: null, cancelled: null, paid: null,
    };
    return COD_ACTIONS[status] ?? null;
  }
  const ACTIONS: Record<string, { label: string; next: string } | null> = {
    pending: { label: "Accept / Process Order", next: "paid" },
    paid: isDP ? { label: "Stock on Hand — Notify Customer", next: "stock_on_hand" } : { label: "Mark as Processing", next: "processing" },
    stock_on_hand: { label: "Mark as Processing", next: "processing" },
    processing: { label: "Mark as Shipped", next: "shipped" },
    shipped: { label: "Mark as Delivered", next: "delivered" },
    delivered: null, cancelled: null,
  };
  return ACTIONS[status] ?? null;
}

export default function AdminOrdersClient({ initialOrders, initialSearch = "", initialStatus = "" }: { initialOrders: Order[]; initialSearch?: string; initialStatus?: string }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState<Status>(STATUSES.includes(initialStatus as Status) ? (initialStatus as Status) : "all");
  const [periodFilter, setPeriodFilter] = useState<Period>("all");
  const [selected, setSelected] = useState<Order | null>(null);
  const [notesInput, setNotesInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pendingQuickAction, setPendingQuickAction] = useState<"ship" | "cancel" | null>(null);

  useEffect(() => {
    if (!initialSearch) return;
    const match = initialOrders.find(o => o.order_number.toLowerCase() === initialSearch.toLowerCase());
    if (match) openOrder(match);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pStart = periodStart(periodFilter);
  const filtered = orders.filter(o => {
    const matchSearch = !search
      || o.customer_name.toLowerCase().includes(search.toLowerCase())
      || o.order_number.toLowerCase().includes(search.toLowerCase())
      || o.order_items.some(i => i.product_name.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    const matchPeriod = !pStart || new Date(o.created_at) >= pStart;
    return matchSearch && matchStatus && matchPeriod;
  });

  const counts = STATUSES.reduce((acc, s) => {
    acc[s] = s === "all" ? orders.length : orders.filter(o => o.status === s).length;
    return acc;
  }, {} as Record<Status, number>);

  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);

  function openOrder(o: Order) {
    setSelected(o);
    setNotesInput(o.admin_notes ?? "");
    setPendingQuickAction(null);
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function bulkUpdate(status: string) {
    if (!status || !selectedIds.size) return;
    const ids = Array.from(selectedIds);
    setOrders(prev => prev.map(o => ids.includes(o.id) ? { ...o, status } : o));
    setSelectedIds(new Set());
    const res = await fetch("/api/admin/orders/bulk", {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids, status }),
    });
    res.ok ? toast.success(`${ids.length} order${ids.length !== 1 ? "s" : ""} updated`) : toast.error("Failed to update orders");
  }

  async function updateStatus(id: string, status: string, adminNotes?: string) {
    setSaving(true);
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status, ...(adminNotes ? { admin_notes: adminNotes } : {}) } : o));
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status, ...(adminNotes ? { admin_notes: adminNotes } : {}) } : prev);
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, ...(adminNotes ? { admin_notes: adminNotes } : {}) }),
    });
    setSaving(false);
    res.ok ? toast.success(`Order marked as ${statusMeta(status).label}`) : toast.error("Failed to update order");
  }

  async function shipOrder(id: string, trackingNumber: string) {
    if (!trackingNumber.trim()) return;
    setSaving(true);
    const trk = trackingNumber.trim();
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: "shipped", tracking_number: trk } : o));
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status: "shipped", tracking_number: trk } : prev);
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "shipped", tracking_number: trk }),
    });
    setSaving(false);
    res.ok ? toast.success("Order marked as shipped") : toast.error("Failed to update order");
  }

  async function executeCancelOrder(id: string, reason: string) {
    const notes = reason.trim() ? `Cancelled by admin: ${reason.trim()}` : "Cancelled by admin";
    await updateStatus(id, "cancelled", notes);
    if (notesInput !== notes) setNotesInput(notes);
  }

  async function executeDeleteOrder(id: string, orderNumber: string) {
    setSaving(true);
    const res = await fetch(`/api/admin/orders/${id}`, { method: "DELETE" });
    setSaving(false);
    if (res.ok) {
      setOrders(prev => prev.filter(o => o.id !== id));
      if (selected?.id === id) setSelected(null);
      toast.success(`Order ${orderNumber} deleted`);
    } else {
      toast.error("Couldn't delete order. Try again.");
    }
  }

  async function saveNotes(id: string) {
    setSaving(true);
    setOrders(prev => prev.map(o => o.id === id ? { ...o, admin_notes: notesInput } : o));
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, admin_notes: notesInput } : prev);
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ admin_notes: notesInput }),
    });
    setSaving(false);
    res.ok ? toast.success("Notes saved") : toast.error("Failed to save notes");
  }

  function itemsSummary(items: OrderItem[]) {
    if (!items.length) return "—";
    const first = items[0];
    return `${first.product_name} (${first.size})${items.length > 1 ? ` +${items.length - 1} more` : ""}`;
  }

  function exportCSV() {
    const rows = [
      ["Order #", "Date", "Customer", "Email", "Status", "Payment", "Total", "Items", "Tracking"],
      ...filtered.map(o => [
        o.order_number, new Date(o.created_at).toLocaleDateString("en-PH"), o.customer_name, o.customer_email ?? "",
        o.status, o.payment_method, o.total, itemsSummary(o.order_items), o.tracking_number ?? "",
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `orders-${new Date().toISOString().split("T")[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  const liveSelected = selected ? (orders.find(o => o.id === selected.id) ?? selected) : null;
  const isCODSelected = liveSelected?.payment_method === "cod";
  const nextAction = liveSelected ? getNextAction(liveSelected.status, isCODSelected, liveSelected.payment_type) : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <p className="text-admin-eyebrow text-ink-3 mb-1">Order Management</p>
          <h1 className="text-admin-hero text-ink">Orders</h1>
        </div>
        <div className="flex items-center gap-3">
          {totalRevenue > 0 && (
            <div className="text-right">
              <p className="text-admin-title text-ink">₱{totalRevenue.toLocaleString()}</p>
              <p className="text-admin-micro text-ink-3">Total Revenue</p>
            </div>
          )}
          <button onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-admin-sm font-semibold rounded-md border border-line text-ink-2 hover:border-line-strong transition-colors duration-admin-fast">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </div>

      <OrdersFilterBar
        search={search} onSearchChange={setSearch}
        statusFilter={statusFilter} onStatusChange={setStatusFilter} counts={counts}
        periodFilter={periodFilter} onPeriodChange={setPeriodFilter}
      />

      <OrdersList
        orders={filtered} totalOrdersCount={orders.length}
        selectedIds={selectedIds} onToggleSelect={toggleSelect}
        onSelectAll={checked => setSelectedIds(checked ? new Set(filtered.map(o => o.id)) : new Set())}
        onRowClick={openOrder}
        onBulkStatusChange={bulkUpdate} onClearSelection={() => setSelectedIds(new Set())}
        onQuickShip={o => { openOrder(o); setPendingQuickAction("ship"); }}
        onQuickCancel={o => { openOrder(o); setPendingQuickAction("cancel"); }}
      />

      {liveSelected && (
        <OrderDetailDrawer
          key={liveSelected.id}
          order={liveSelected}
          onClose={() => setSelected(null)}
          isCOD={isCODSelected}
          nextAction={nextAction}
          saving={saving}
          autoOpen={pendingQuickAction}
          notesInput={notesInput}
          onNotesInputChange={setNotesInput}
          onSaveNotes={() => saveNotes(liveSelected.id)}
          onAdvanceStatus={() => nextAction && updateStatus(liveSelected.id, nextAction.next)}
          onShip={trk => shipOrder(liveSelected.id, trk)}
          onStatusSelect={status => updateStatus(liveSelected.id, status)}
          onApprovePayment={() => updateStatus(liveSelected.id, "paid")}
          onCancelOrder={reason => executeCancelOrder(liveSelected.id, reason)}
          onDeleteOrder={() => executeDeleteOrder(liveSelected.id, liveSelected.order_number)}
        />
      )}
    </div>
  );
}

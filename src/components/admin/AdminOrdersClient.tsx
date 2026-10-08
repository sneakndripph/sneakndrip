"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Download, X, CreditCard, Loader, PackageCheck, CheckCircle2, XCircle } from "lucide-react";
import OrdersFilterBar, { periodStart, PERIODS, PAYMENT_FILTERS, type Period, type PaymentFilter } from "./OrdersFilterBar";
import OrdersList, { PAYMENT_LABELS } from "./OrdersList";
import OrderDetailDrawer from "./OrderDetailDrawer";
import { STATUSES, statusMeta, type Status } from "./OrderStatusBadge";
import { useSortableTable } from "@/hooks/useSortableTable";
import { useConfirmDialog } from "./ConfirmDialog";
import type { BulkAction } from "./BulkActionsBar";

/** Statuses offered in the bulk bar — mirrors orderBulkUpdateSchema ("shipped" needs per-order tracking). */
type BulkStatus = "paid" | "processing" | "stock_on_hand" | "delivered" | "cancelled";

// Bulk changes above this size ask for confirmation first (cancel always does).
const BULK_CONFIRM_THRESHOLD = 10;

export type OrderItem = {
  product_name: string; brand: string; size: string; quantity: number; unit_price: number; payment_type: string;
  products: { images: string[] | null; bg: string | null } | null;
};
export type Order = {
  id: string; order_number: string; customer_name: string; customer_email: string; customer_mobile: string;
  shipping_street: string; shipping_barangay: string; shipping_city: string; shipping_province: string;
  shipping_postal: string;
  subtotal: number; discount: number | null; coupon_code: string | null;
  total: number; payment_method: string; payment_type: string; status: string; tracking_number: string | null;
  proof_of_payment: string | null; payment_reference: string | null; shipping_fee: number | null;
  balance_reference: string | null; balance_proof_url: string | null; balance_paid_at: string | null;
  balance_payment_method: string | null; admin_notes: string | null; created_at: string; delivered_at: string | null;
  order_items: OrderItem[];
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

export default function AdminOrdersClient({ initialOrders, initialSearch = "", initialStatus = "", initialCoupon = "", initialPayment = "", initialPeriod = "" }: { initialOrders: Order[]; initialSearch?: string; initialStatus?: string; initialCoupon?: string; initialPayment?: string; initialPeriod?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [search, setSearchRaw] = useState(initialSearch);
  const [statusFilter, setStatusFilterRaw] = useState<Status>(STATUSES.includes(initialStatus as Status) ? (initialStatus as Status) : "all");
  const [periodFilter, setPeriodFilterRaw] = useState<Period>(PERIODS.some(p => p.id === initialPeriod) ? (initialPeriod as Period) : "all");
  const [paymentFilter, setPaymentFilterRaw] = useState<PaymentFilter>(PAYMENT_FILTERS.some(p => p.id === initialPayment) ? (initialPayment as PaymentFilter) : "all");
  const [couponFilter, setCouponFilter] = useState<string | null>(initialCoupon || null);
  const [selected, setSelected] = useState<Order | null>(null);
  const [notesInput, setNotesInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pendingQuickAction, setPendingQuickAction] = useState<"ship" | "cancel" | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const { confirm: confirmDialog, dialog: confirmDialogEl } = useConfirmDialog();

  // Any filter change drops the selection so hidden rows can't be bulk-acted on.
  function clearSelection() { setSelectedIds(new Set()); }
  function setSearch(v: string) { setSearchRaw(v); clearSelection(); }
  function setStatusFilter(v: Status) { setStatusFilterRaw(v); clearSelection(); }
  function setPeriodFilter(v: Period) { setPeriodFilterRaw(v); clearSelection(); }
  function setPaymentFilter(v: PaymentFilter) { setPaymentFilterRaw(v); clearSelection(); }

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
    const matchPayment = paymentFilter === "all" || o.payment_method === paymentFilter;
    const matchCoupon = !couponFilter || o.coupon_code === couponFilter;
    return matchSearch && matchStatus && matchPeriod && matchPayment && matchCoupon;
  });

  const clearCouponFilter = () => {
    setCouponFilter(null);
    clearSelection();
    router.push(pathname, { scroll: false });
  };

  const { sortedRows, sortKey, sortDirection, handleSort } = useSortableTable(filtered, {
    accessors: {
      total: o => Number(o.total),
      created_at: o => new Date(o.created_at),
    },
  });

  // Only act on selected rows that are still visible (a per-order status change in
  // the drawer can move a selected row out of the current status filter).
  const selectedVisible = sortedRows.filter(o => selectedIds.has(o.id));

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

  function plural(n: number) {
    return `${n} order${n !== 1 ? "s" : ""}`;
  }

  async function bulkUpdate(status: BulkStatus) {
    const targets = selectedVisible;
    if (!targets.length || bulkBusy) return;
    const label = statusMeta(status).label;
    if (status === "cancelled") {
      const shown = targets.slice(0, 3).map(o => o.order_number).join(", ");
      const more = targets.length > 3 ? ` and ${targets.length - 3} more` : "";
      const ok = await confirmDialog({
        title: `Cancel ${plural(targets.length)}?`,
        description: `${shown}${more}. Customers will be emailed and stock for pending, paid and processing orders goes back to inventory.`,
        confirmLabel: `Cancel ${plural(targets.length)}`,
        cancelLabel: "Keep orders",
        variant: "destructive",
      });
      if (!ok) return;
    } else if (targets.length > BULK_CONFIRM_THRESHOLD) {
      const ok = await confirmDialog({
        title: `Mark ${plural(targets.length)} as ${label}?`,
        description: "Customers will be emailed about the status change.",
        confirmLabel: "Update",
      });
      if (!ok) return;
    }
    setBulkBusy(true);
    try {
      const res = await fetch("/api/admin/orders/bulk", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: targets.map(o => o.id), status }),
      });
      const result = await res.json().catch(() => ({})) as {
        error?: string; updated?: number; skipped?: { id: string; reason: string }[];
        rows?: ({ id: string } & Partial<Order>)[];
      };
      if (!res.ok) { toast.error(result.error ?? "Failed to update orders"); return; }
      const rows = new Map((result.rows ?? []).map(r => [r.id, r]));
      setOrders(prev => prev.map(o => rows.has(o.id) ? { ...o, ...rows.get(o.id) } : o));
      clearSelection();
      const updated = result.updated ?? rows.size;
      const skipped = result.skipped ?? [];
      const already = skipped.filter(s => s.reason === "already_in_status").length;
      const failed = skipped.length - already;
      const notes = [
        already > 0 ? `${already} already ${label}` : "",
        failed > 0 ? `${failed} failed` : "",
      ].filter(Boolean).join(", ");
      const msg = `${plural(updated)} marked as ${label}${notes ? ` (${notes})` : ""}`;
      if (failed > 0) toast.error(msg); else toast.success(msg);
    } catch {
      toast.error("Failed to update orders");
    } finally {
      setBulkBusy(false);
    }
  }

  const bulkActions: BulkAction[] = [
    { key: "paid", label: "Mark as Paid", icon: CreditCard, onSelect: () => bulkUpdate("paid") },
    { key: "processing", label: "Mark as Processing", icon: Loader, onSelect: () => bulkUpdate("processing") },
    { key: "stock_on_hand", label: `Mark as ${statusMeta("stock_on_hand").label}`, icon: PackageCheck, onSelect: () => bulkUpdate("stock_on_hand") },
    { key: "delivered", label: "Mark as Delivered", icon: CheckCircle2, onSelect: () => bulkUpdate("delivered") },
    { key: "cancelled", label: "Cancel orders", icon: XCircle, destructive: true, dividerBefore: true, onSelect: () => bulkUpdate("cancelled") },
  ];

  // Single-order PATCH; local state changes only after the server confirms.
  async function patchOrder(id: string, body: Record<string, unknown>, patch: Partial<Order>): Promise<boolean> {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({})) as { error?: string };
        toast.error(error ?? "Failed to update order");
        return false;
      }
      setOrders(prev => prev.map(o => o.id === id ? { ...o, ...patch } : o));
      setSelected(prev => prev?.id === id ? { ...prev, ...patch } : prev);
      return true;
    } catch {
      toast.error("Failed to update order");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(id: string, status: string, adminNotes?: string) {
    const extra = adminNotes ? { admin_notes: adminNotes } : {};
    const ok = await patchOrder(id, { status, ...extra }, { status, ...extra });
    if (ok) toast.success(`Order marked as ${statusMeta(status).label}`);
    return ok;
  }

  async function shipOrder(id: string, trackingNumber: string) {
    if (!trackingNumber.trim()) return;
    const trk = trackingNumber.trim();
    const body = { status: "shipped", tracking_number: trk };
    if (await patchOrder(id, body, body)) toast.success("Order marked as shipped");
  }

  async function executeCancelOrder(id: string, reason: string) {
    const notes = reason.trim() ? `Cancelled by admin: ${reason.trim()}` : "Cancelled by admin";
    const ok = await updateStatus(id, "cancelled", notes);
    if (ok && notesInput !== notes) setNotesInput(notes);
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
    const notes = notesInput;
    if (await patchOrder(id, { admin_notes: notes }, { admin_notes: notes })) toast.success("Notes saved");
  }

  function formatDateTime(iso: string | null | undefined) {
    if (!iso) return "";
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function shippingAddress(o: Order) {
    return [o.shipping_street, o.shipping_barangay, o.shipping_city, o.shipping_province, o.shipping_postal]
      .filter(Boolean).join(", ");
  }

  function itemsCSVList(items: OrderItem[]) {
    return items.map(i => `${i.product_name} ${i.size} x${i.quantity}`).join(", ");
  }

  function exportCSV() {
    const headers = [
      "Order Number", "Date Created", "Customer Email", "Customer Name", "Status",
      "Subtotal", "Shipping Fee", "Discount Code", "Discount Amount", "Total",
      "Payment Method", "Payment Type", "Tracking Number", "Shipping Address",
      "Items", "Delivered At", "Notes",
    ];
    const rows = [...filtered]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map(o => [
        o.order_number,
        formatDateTime(o.created_at),
        o.customer_email ?? "",
        o.customer_name ?? "",
        statusMeta(o.status).label,
        Number(o.subtotal ?? 0),
        Number(o.shipping_fee ?? 0),
        o.coupon_code ?? "",
        Number(o.discount ?? 0),
        Number(o.total ?? 0),
        PAYMENT_LABELS[o.payment_method] ?? o.payment_method,
        o.payment_type === "downpayment" ? "Downpayment" : "Full",
        o.tracking_number ?? "",
        shippingAddress(o),
        itemsCSVList(o.order_items),
        formatDateTime(o.delivered_at),
        o.admin_notes ?? "",
      ]);
    const csv = [headers, ...rows]
      .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sneakndrip-orders-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
        paymentFilter={paymentFilter} onPaymentFilterChange={setPaymentFilter}
      />

      {couponFilter && (
        <div className="flex items-center gap-2 mb-5">
          <span className="flex items-center gap-1.5 px-3 py-1.5 text-admin-sm font-medium rounded-md border border-line text-ink-2 hover:border-line-strong transition-colors duration-admin-fast">
            Filtered by coupon: <span className="text-ink font-semibold">{couponFilter}</span>
            <button type="button" onClick={clearCouponFilter} className="cursor-pointer" aria-label="Clear coupon filter">
              <X className="w-3.5 h-3.5" />
            </button>
          </span>
        </div>
      )}

      <OrdersList
        orders={sortedRows} totalOrdersCount={orders.length} couponFilter={couponFilter}
        selectedIds={selectedIds} onToggleSelect={toggleSelect}
        selectedVisibleCount={selectedVisible.length}
        onSelectAll={checked => setSelectedIds(checked ? new Set(sortedRows.map(o => o.id)) : new Set())}
        onRowClick={openOrder}
        bulkActions={bulkActions} bulkBusy={bulkBusy} onClearSelection={clearSelection}
        onQuickShip={o => { openOrder(o); setPendingQuickAction("ship"); }}
        onQuickCancel={o => { openOrder(o); setPendingQuickAction("cancel"); }}
        sortKey={sortKey} sortDirection={sortDirection} onSort={handleSort}
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
      {confirmDialogEl}
    </div>
  );
}

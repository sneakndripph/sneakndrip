"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { BRAND, FONTS, DP_RESERVE_FEE } from "@/lib/constants";
import {
  Search, Clock, CheckCircle, Truck, Package, XCircle,
  X, ExternalLink, MapPin, User, CreditCard, ChevronRight, MessageCircle, FileText,
  ChevronDown, Check, Download, PlaneLanding,
} from "lucide-react";

const STATUSES = ["all", "pending", "paid", "stock_on_hand", "processing", "shipped", "delivered", "cancelled"] as const;
type Status = (typeof STATUSES)[number];

type Period = "all" | "today" | "7d" | "30d" | "90d";
const PERIODS: { id: Period; label: string }[] = [
  { id: "all", label: "All Time" },
  { id: "today", label: "Today" },
  { id: "7d", label: "7 Days" },
  { id: "30d", label: "30 Days" },
  { id: "90d", label: "90 Days" },
];
function periodStart(p: Period): Date | null {
  const now = new Date();
  if (p === "all") return null;
  if (p === "today") { const d = new Date(now); d.setHours(0, 0, 0, 0); return d; }
  const days = p === "7d" ? 7 : p === "30d" ? 30 : 90;
  return new Date(now.getTime() - days * 86400000);
}

const STATUS_CFG = {
  pending:    { icon: Clock,        color: "#D97706", bg: "rgba(217,119,6,0.1)",    label: "Pending" },
  paid:       { icon: CheckCircle,  color: "#5BB8B4", bg: "rgba(91,184,180,0.1)",   label: "Confirmed" },
  stock_on_hand: { icon: PlaneLanding, color: "#8B5CF6", bg: "rgba(139,92,246,0.1)", label: "On Hand" },
  processing: { icon: Package,      color: "#6366F1", bg: "rgba(99,102,241,0.1)",   label: "Packing" },
  shipped:    { icon: Truck,        color: "#3B82F6", bg: "rgba(59,130,246,0.1)",   label: "Shipped" },
  delivered:  { icon: CheckCircle,  color: "#10B981", bg: "rgba(16,185,129,0.1)",   label: "Delivered" },
  cancelled:  { icon: XCircle,      color: "#EF4444", bg: "rgba(239,68,68,0.1)",    label: "Cancelled" },
};

const PAYMENT_LABELS: Record<string, string> = {
  gcash: "GCash", maya: "Maya", bank_transfer: "Bank Transfer", cod: "COD",
};

type OrderItem = {
  product_name: string;
  brand: string;
  size: string;
  quantity: number;
  unit_price: number;
  payment_type: string;
  products: { images: string[] | null; bg: string | null } | null;
};
type Order = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_mobile: string;
  shipping_street: string;
  shipping_barangay: string;
  shipping_city: string;
  shipping_province: string;
  total: number;
  payment_method: string;
  payment_type: string;
  status: string;
  tracking_number: string | null;
  proof_of_payment: string | null;
  payment_reference: string | null;
  shipping_fee: number | null;
  balance_reference: string | null;
  balance_proof_url: string | null;
  balance_paid_at: string | null;
  balance_payment_method: string | null;
  admin_notes: string | null;
  created_at: string;
  order_items: OrderItem[];
};

function getNextAction(status: string, isCOD: boolean, paymentType?: string): { label: string; next: string; color: string } | null {
  const isDP = paymentType === "downpayment";
  if (isCOD) {
    const COD_ACTIONS: Record<string, { label: string; next: string; color: string } | null> = {
      pending:    { label: "Mark as Processing",           next: "processing", color: "#6366F1" },
      processing: { label: "Mark as Shipped",              next: "shipped",    color: "#3B82F6" },
      shipped:    { label: "Delivered / Cash Collected",   next: "delivered",  color: "#10B981" },
      delivered:  null, cancelled: null, paid: null,
    };
    return COD_ACTIONS[status] ?? null;
  }
  const ACTIONS: Record<string, { label: string; next: string; color: string } | null> = {
    pending:     { label: "Accept / Process Order",         next: "paid",        color: BRAND.teal },
    paid:         isDP
      ? { label: "Stock on Hand — Notify Customer 🇵🇭",  next: "stock_on_hand", color: "#8B5CF6" }
      : { label: "Mark as Processing",                      next: "processing",   color: "#6366F1" },
    stock_on_hand: { label: "Mark as Processing",           next: "processing",   color: "#6366F1" },
    processing:  { label: "Mark as Shipped",                next: "shipped",     color: "#3B82F6" },
    shipped:     { label: "Mark as Delivered",              next: "delivered",   color: "#10B981" },
    delivered:   null, cancelled: null,
  };
  return ACTIONS[status] ?? null;
}

export default function AdminOrdersClient({ initialOrders, initialSearch = "", initialStatus = "" }: { initialOrders: Order[]; initialSearch?: string; initialStatus?: string }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState<Status>(
    STATUSES.includes(initialStatus as Status) ? (initialStatus as Status) : "all"
  );
  const [periodFilter, setPeriodFilter] = useState<Period>("all");
  const [selected, setSelected] = useState<Order | null>(null);
  const [trackingInput, setTrackingInput] = useState("");
  const [notesInput, setNotesInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [shippingTrackingInput, setShippingTrackingInput] = useState("");
  const [dpSectionOpen, setDpSectionOpen] = useState(false);
  const [balanceSectionOpen, setBalanceSectionOpen] = useState(false);
  const bulkRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (bulkRef.current && !bulkRef.current.contains(e.target as Node)) setBulkOpen(false);
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target as Node)) setStatusDropdownOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // Auto-open first matching order when navigated from dashboard
  useEffect(() => {
    if (!initialSearch) return;
    const match = initialOrders.find(o => o.order_number.toLowerCase() === initialSearch.toLowerCase());
    if (match) openOrder(match);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pStart = periodStart(periodFilter);
  const filtered = orders.filter(o => {
    const matchSearch = !search ||
      o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      o.order_items.some(i => i.product_name.toLowerCase().includes(search.toLowerCase()));
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
    setTrackingInput(o.tracking_number ?? "");
    setNotesInput(o.admin_notes ?? "");
    setDpSectionOpen(false);
    setBalanceSectionOpen(false);
  }

  function closeModal() { setSelected(null); }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }

  async function bulkUpdate(status: string) {
    if (!status || !selectedIds.size) return;
    const ids = Array.from(selectedIds);
    setOrders(prev => prev.map(o => ids.includes(o.id) ? { ...o, status } : o));
    setSelectedIds(new Set());
    await fetch("/api/admin/orders/bulk", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, status }),
    });
  }

  async function updateStatus(id: string, status: string, adminNotes?: string) {
    setSaving(true);
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status, ...(adminNotes ? { admin_notes: adminNotes } : {}) } : o));
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status, ...(adminNotes ? { admin_notes: adminNotes } : {}) } : prev);
    await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, ...(adminNotes ? { admin_notes: adminNotes } : {}) }),
    });
    setSaving(false);
  }

  function confirmCancel() {
    if (!liveSelected) return;
    setShowCancelModal(true);
  }

  async function executeCancelOrder() {
    if (!liveSelected) return;
    const notes = cancelReason.trim()
      ? `Cancelled by admin: ${cancelReason.trim()}`
      : "Cancelled by admin";
    setShowCancelModal(false);
    setCancelReason("");
    await updateStatus(liveSelected.id, "cancelled", notes);
    if (notesInput !== notes) setNotesInput(notes);
  }

  async function saveTracking(id: string) {
    setSaving(true);
    setOrders(prev => prev.map(o => o.id === id ? { ...o, tracking_number: trackingInput } : o));
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, tracking_number: trackingInput } : prev);
    await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tracking_number: trackingInput }),
    });
    setSaving(false);
  }

  async function saveNotes(id: string) {
    setSaving(true);
    setOrders(prev => prev.map(o => o.id === id ? { ...o, admin_notes: notesInput } : o));
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, admin_notes: notesInput } : prev);
    await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admin_notes: notesInput }),
    });
    setSaving(false);
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  function itemsSummary(items: OrderItem[]) {
    if (!items.length) return "—";
    const first = items[0];
    const rest = items.length > 1 ? ` +${items.length - 1} more` : "";
    return `${first.product_name} (${first.size})${rest}`;
  }

  function exportCSV() {
    const rows = [
      ["Order #", "Date", "Customer", "Email", "Status", "Payment", "Total", "Items", "Tracking"],
      ...filtered.map(o => [
        o.order_number,
        new Date(o.created_at).toLocaleDateString("en-PH"),
        o.customer_name,
        o.customer_email ?? "",
        o.status,
        o.payment_method,
        o.total,
        itemsSummary(o.order_items),
        o.tracking_number ?? "",
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `orders-${new Date().toISOString().split("T")[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  const liveSelected = selected ? (orders.find(o => o.id === selected.id) ?? selected) : null;
  const isCODSelected = liveSelected?.payment_method === "cod";
  const nextAction = liveSelected ? getNextAction(liveSelected.status, isCODSelected, liveSelected.payment_type) : null;
  const selCfg = liveSelected ? (STATUS_CFG[liveSelected.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.pending) : null;
  const statusOptions = Object.entries(STATUS_CFG).filter(([k]) => !(isCODSelected && k === "paid"));

  return (
    <div style={{ fontFamily: FONTS.body }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: BRAND.teal }}>Order Management</p>
          <h1 style={{ fontFamily: FONTS.display, fontSize: "2.5rem", letterSpacing: "0.04em", color: BRAND.black }}>ORDERS</h1>
        </div>
        <div className="flex items-center gap-3">
          {totalRevenue > 0 && (
            <div className="text-right">
              <p style={{ fontFamily: FONTS.display, fontSize: "1.5rem", color: BRAND.black }}>
                ₱{totalRevenue.toLocaleString()}
              </p>
              <p className="text-xs" style={{ color: BRAND.muted }}>Total Revenue</p>
            </div>
          )}
          <button onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold transition-opacity hover:opacity-70"
            style={{ border: `1px solid ${BRAND.border}`, color: BRAND.muted }}>
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {/* Period filter */}
      <div className="flex gap-1.5 mb-4">
        {PERIODS.map(p => (
          <button key={p.id} onClick={() => setPeriodFilter(p.id)}
            className="px-3 py-1.5 text-xs font-bold transition-colors"
            style={{
              background: periodFilter === p.id ? BRAND.teal : "transparent",
              color: periodFilter === p.id ? "#fff" : BRAND.muted,
              border: `1px solid ${periodFilter === p.id ? BRAND.teal : BRAND.border}`,
            }}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 flex-wrap mb-4">
        {STATUSES.map(s => {
          const cfg = s !== "all" ? STATUS_CFG[s as keyof typeof STATUS_CFG] : null;
          return (
            <button key={s} onClick={() => setStatusFilter(s)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-wide transition-all"
              style={{
                background: statusFilter === s ? (cfg?.color || BRAND.black) : BRAND.card,
                color: statusFilter === s ? "#fff" : BRAND.muted,
                border: `1px solid ${statusFilter === s ? (cfg?.color || BRAND.black) : BRAND.border}`,
              }}>
              {s} {counts[s] > 0 && <span className="opacity-70">({counts[s]})</span>}
            </button>
          );
        })}
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 mb-4 px-4 py-3 rounded-lg"
          style={{ background: `${BRAND.teal}15`, border: `1px solid ${BRAND.teal}40` }}>
          <span className="text-sm font-bold" style={{ color: BRAND.teal }}>
            {selectedIds.size} order{selectedIds.size !== 1 ? "s" : ""} selected
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <div className="relative" ref={bulkRef}>
              <button type="button" onClick={() => setBulkOpen(o => !o)}
                className="flex items-center gap-2 text-xs px-3 py-2 font-semibold focus:outline-none"
                style={{ background: BRAND.card, border: `1px solid ${bulkOpen ? BRAND.teal : BRAND.border}`, color: BRAND.black }}>
                <span>Set status…</span>
                <ChevronDown className="w-3.5 h-3.5 shrink-0 transition-transform" style={{ color: BRAND.muted, transform: bulkOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
              </button>
              {bulkOpen && (
                <div className="absolute right-0 top-full mt-1 z-50 overflow-hidden shadow-lg min-w-[140px]"
                  style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                  {Object.entries(STATUS_CFG).map(([k, v]) => (
                    <button key={k} type="button"
                      onClick={() => { bulkUpdate(k); setBulkOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-left transition-colors hover:opacity-80"
                      style={{ borderBottom: `1px solid ${BRAND.border}`, color: BRAND.black }}>
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: v.color }} />
                      {v.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => setSelectedIds(new Set())}
              className="text-xs font-bold px-3 py-2 transition-opacity hover:opacity-70"
              style={{ color: BRAND.muted }}>
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: BRAND.muted }} />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by order ID, customer, or product…"
          className="w-full pl-11 pr-4 py-3 text-sm focus:outline-none"
          style={{ background: BRAND.card, border: `1px solid ${BRAND.border}`, color: BRAND.black }} />
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
        {/* Desktop */}
        <table className="w-full hidden md:table">
          <thead>
            <tr style={{ background: "rgba(13,13,13,0.02)", borderBottom: `1px solid ${BRAND.border}` }}>
              <th className="px-3 py-3.5">
                <input type="checkbox"
                  checked={selectedIds.size === filtered.length && filtered.length > 0}
                  onChange={e => setSelectedIds(e.target.checked ? new Set(filtered.map(o => o.id)) : new Set())}
                  className="w-3.5 h-3.5 cursor-pointer"
                  style={{ accentColor: BRAND.teal }} />
              </th>
              {["Order", "Customer", "Items", "Payment", "Total", "Status", "Date"].map(h => (
                <th key={h} className="px-4 py-3.5 text-left text-[10px] font-black uppercase tracking-widest"
                  style={{ color: BRAND.muted }}>{h}</th>
              ))}
              <th className="px-4 py-3.5" />
            </tr>
          </thead>
          <tbody>
            {filtered.map(o => {
              const cfg = STATUS_CFG[o.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.pending;
              const Icon = cfg.icon;
              return (
                <tr key={o.id}
                  className="transition-colors hover:bg-black/[0.025] cursor-pointer"
                  style={{ borderBottom: `1px solid ${BRAND.border}` }}
                  onClick={() => openOrder(o)}>
                  <td className="px-3 py-4" onClick={e => e.stopPropagation()}>
                    <input type="checkbox"
                      checked={selectedIds.has(o.id)}
                      onChange={() => toggleSelect(o.id)}
                      className="w-3.5 h-3.5 cursor-pointer"
                      style={{ accentColor: BRAND.teal }} />
                  </td>
                  <td className="px-4 py-4 text-xs font-bold" style={{ color: BRAND.black }}>{o.order_number}</td>
                  <td className="px-4 py-4">
                    <p className="text-xs font-semibold" style={{ color: BRAND.black }}>{o.customer_name}</p>
                    <p className="text-[10px]" style={{ color: BRAND.muted }}>{o.customer_email}</p>
                  </td>
                  <td className="px-4 py-4 text-xs max-w-[160px] truncate" style={{ color: BRAND.muted }}>
                    {itemsSummary(o.order_items)}
                  </td>
                  <td className="px-4 py-4 text-xs font-medium" style={{ color: BRAND.muted }}>
                    {PAYMENT_LABELS[o.payment_method] ?? o.payment_method}
                    {o.payment_type === "downpayment" && (
                      <span className="block text-[10px]" style={{ color: BRAND.teal }}>Downpayment</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-xs font-bold" style={{ color: BRAND.black }}>
                    ₱{Number(o.total).toLocaleString()}
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full"
                      style={{ background: cfg.bg, color: cfg.color }}>
                      <Icon className="w-3 h-3" />{cfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-xs" style={{ color: BRAND.muted }}>
                    {new Date(o.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <ChevronRight className="w-4 h-4 ml-auto" style={{ color: BRAND.muted }} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Mobile cards */}
        <div className="md:hidden divide-y" style={{ borderColor: BRAND.border }}>
          {filtered.map(o => {
            const cfg = STATUS_CFG[o.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.pending;
            const Icon = cfg.icon;
            return (
              <div key={o.id} className="flex items-center px-4 py-4 gap-3">
                <div onClick={e => e.stopPropagation()}>
                  <input type="checkbox"
                    checked={selectedIds.has(o.id)}
                    onChange={() => toggleSelect(o.id)}
                    className="w-3.5 h-3.5 cursor-pointer"
                    style={{ accentColor: BRAND.teal }} />
                </div>
                <button className="flex-1 flex items-center justify-between text-left"
                  onClick={() => openOrder(o)}>
                  <div>
                    <p className="text-xs font-bold" style={{ color: BRAND.black }}>{o.order_number}</p>
                    <p className="text-xs mt-0.5" style={{ color: BRAND.muted }}>
                      {o.customer_name} · ₱{Number(o.total).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full"
                      style={{ background: cfg.bg, color: cfg.color }}>
                      <Icon className="w-3 h-3" />{cfg.label}
                    </span>
                    <ChevronRight className="w-4 h-4" style={{ color: BRAND.muted }} />
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <p style={{ fontFamily: FONTS.display, fontSize: "1.5rem", color: BRAND.muted }}>NO ORDERS</p>
            <p className="text-sm mt-2" style={{ color: BRAND.mutedLight }}>
              {orders.length === 0 ? "Orders will appear here once customers start buying." : "No orders match your filters."}
            </p>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {liveSelected && selCfg && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: "rgba(0,0,0,0.55)" }}
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="w-full sm:max-w-lg max-h-[92dvh] flex flex-col rounded-t-2xl sm:rounded-2xl overflow-hidden"
            style={{ background: BRAND.bg, border: `1px solid ${BRAND.border}` }}>

            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 shrink-0"
              style={{ borderBottom: `1px solid ${BRAND.border}`, background: BRAND.card }}>
              <div>
                <p className="font-black text-sm" style={{ color: BRAND.black }}>{liveSelected.order_number}</p>
                <p className="text-[10px] mt-0.5" style={{ color: BRAND.muted }}>{formatDate(liveSelected.created_at)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full"
                  style={{ background: selCfg.bg, color: selCfg.color }}>
                  <selCfg.icon className="w-3 h-3" />{selCfg.label}
                </span>
                <button onClick={closeModal} className="p-1.5 rounded-lg transition-colors hover:bg-black/10">
                  <X className="w-4 h-4" style={{ color: BRAND.muted }} />
                </button>
              </div>
            </div>

            {/* Modal body — scrollable */}
            <div className="overflow-y-auto flex-1 divide-y" style={{ borderColor: BRAND.border }}>

              {/* Customer */}
              <div className="px-5 py-4">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-3.5 h-3.5" style={{ color: BRAND.teal }} />
                  <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: BRAND.muted }}>Customer</p>
                </div>
                <p className="text-sm font-bold" style={{ color: BRAND.black }}>{liveSelected.customer_name}</p>
                <p className="text-xs mt-0.5" style={{ color: BRAND.muted }}>{liveSelected.customer_email}</p>
                {liveSelected.customer_mobile && (
                  <p className="text-xs mt-0.5" style={{ color: BRAND.muted }}>{liveSelected.customer_mobile}</p>
                )}
                <a href={`/admin/chat?email=${encodeURIComponent(liveSelected.customer_email)}`}
                  className="inline-flex items-center gap-1.5 mt-2 text-xs font-bold transition-opacity hover:opacity-70"
                  style={{ color: BRAND.teal }}>
                  <MessageCircle className="w-3.5 h-3.5" /> Chat with Customer
                </a>
              </div>

              {/* Shipping */}
              <div className="px-5 py-4">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-3.5 h-3.5" style={{ color: BRAND.teal }} />
                  <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: BRAND.muted }}>Shipping Address</p>
                </div>
                <p className="text-sm" style={{ color: BRAND.black }}>
                  {[liveSelected.shipping_street, liveSelected.shipping_barangay, liveSelected.shipping_city, liveSelected.shipping_province]
                    .filter(Boolean).join(", ")}
                </p>
              </div>

              {/* Items */}
              <div className="px-5 py-4">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="w-3.5 h-3.5" style={{ color: BRAND.teal }} />
                  <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: BRAND.muted }}>Items</p>
                </div>
                <div className="space-y-3">
                  {liveSelected.order_items.map((item, i) => {
                    const img = item.products?.images?.[0] ?? null;
                    const bg = item.products?.bg ?? "#EDE9E3";
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-12 h-12 shrink-0 rounded-lg overflow-hidden relative"
                          style={{ background: bg, border: `1px solid ${BRAND.border}` }}>
                          {img ? (
                            <Image src={img} alt={item.product_name} fill className="object-cover" sizes="48px" />
                          ) : (
                            <span className="absolute inset-0 flex items-center justify-center text-xs font-black"
                              style={{ color: BRAND.black, opacity: 0.15, fontFamily: FONTS.display }}>
                              {item.brand.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold" style={{ color: BRAND.black }}>{item.product_name}</p>
                          <p className="text-[11px]" style={{ color: BRAND.muted }}>
                            {item.brand} · {item.size} · x{item.quantity}
                            {item.payment_type === "downpayment" && (
                              <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold"
                                style={{ background: `${BRAND.teal}18`, color: BRAND.teal }}>DP</span>
                            )}
                          </p>
                        </div>
                        <span className="text-xs font-bold shrink-0" style={{ color: BRAND.black }}>
                          ₱{(Number(item.unit_price) * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {(() => {
                  const isDP = liveSelected.payment_type === "downpayment";
                  const dpItems = liveSelected.order_items.filter(i => i.payment_type === "downpayment");
                  const dpTotal = dpItems.reduce((s, i) => s + Number(i.unit_price) * i.quantity, 0);
                  const balance = isDP ? dpTotal - DP_RESERVE_FEE * dpItems.reduce((s, i) => s + i.quantity, 0) : 0;
                  const orderDate = new Date(liveSelected.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
                  const balanceDate = liveSelected.balance_paid_at
                    ? new Date(liveSelected.balance_paid_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })
                    : null;
                  if (!isDP) {
                    const fee = Number(liveSelected.shipping_fee ?? 0);
                    return (
                      <div className="mt-3 pt-3 space-y-1 text-xs"
                        style={{ borderTop: `1px solid ${BRAND.border}` }}>
                        {fee > 0 && (
                          <div className="flex justify-between">
                            <span style={{ color: BRAND.muted }}>Delivery Fee</span>
                            <span style={{ color: BRAND.black }}>₱{fee.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-black text-sm pt-1">
                          <span style={{ color: BRAND.black }}>Total</span>
                          <span style={{ fontFamily: FONTS.display, color: BRAND.black }}>₱{Number(liveSelected.total).toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div className="mt-3 pt-3 space-y-1.5 text-xs"
                      style={{ borderTop: `1px solid ${BRAND.border}` }}>
                      <div className="flex justify-between">
                        <span style={{ color: BRAND.muted }}>Downpayment Paid</span>
                        <div className="text-right">
                          <span className="font-bold" style={{ color: BRAND.teal }}>₱{DP_RESERVE_FEE.toLocaleString()}</span>
                          <span className="block text-[10px]" style={{ color: BRAND.muted }}>{orderDate}</span>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: BRAND.muted }}>Balance Due</span>
                        <div className="text-right">
                          <span className="font-bold" style={{ color: balanceDate ? BRAND.teal : BRAND.red }}>₱{balance.toLocaleString()}</span>
                          <span className="block text-[10px]" style={{ color: BRAND.muted }}>
                            {balanceDate ? `Paid · ${balanceDate}` : "Pending"}
                          </span>
                        </div>
                      </div>
                      {Number(liveSelected.shipping_fee ?? 0) > 0 && (
                        <div className="flex justify-between">
                          <span style={{ color: BRAND.muted }}>Delivery Fee</span>
                          <span style={{ color: BRAND.black }}>₱{Number(liveSelected.shipping_fee).toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-1.5 font-black text-sm"
                        style={{ borderTop: `1px solid ${BRAND.border}` }}>
                        <span style={{ color: BRAND.black }}>Total</span>
                        <span style={{ fontFamily: FONTS.display, color: BRAND.black }}>₱{Number(liveSelected.total).toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Payment/s — two separate collapsibles for DP orders */}
              <div style={{ borderTop: `1px solid ${BRAND.border}` }}>
                {/* Downpayment section */}
                <div className="px-5 py-3">
                  <button type="button" onClick={() => setDpSectionOpen(o => !o)}
                    className="w-full flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-3.5 h-3.5" style={{ color: BRAND.teal }} />
                      <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: BRAND.muted }}>
                        {liveSelected.payment_type === "downpayment" ? "Downpayment" : "Payment"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!dpSectionOpen && (
                        <span className="text-xs" style={{ color: BRAND.muted }}>
                          {PAYMENT_LABELS[liveSelected.payment_method] ?? liveSelected.payment_method}
                        </span>
                      )}
                      <ChevronDown className="w-3.5 h-3.5 transition-transform" style={{ color: BRAND.muted, transform: dpSectionOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
                    </div>
                  </button>
                  {dpSectionOpen && (
                    <div className="mt-3 space-y-3">
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span style={{ color: BRAND.muted }}>Mode of payment</span>
                          <span className="font-semibold" style={{ color: BRAND.black }}>{PAYMENT_LABELS[liveSelected.payment_method] ?? liveSelected.payment_method}</span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: BRAND.muted }}>Ref num</span>
                          <span className="font-semibold" style={{ color: BRAND.black }}>{liveSelected.payment_reference ?? "—"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: BRAND.muted }}>Submitted</span>
                          <span style={{ color: BRAND.black }}>
                            {new Date(liveSelected.created_at).toLocaleString("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>
                      {liveSelected.payment_method !== "cod" && (
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: BRAND.muted }}>Proof image</p>
                            <a
                              href={
                                liveSelected.proof_of_payment
                                  ? `/api/admin/proof?path=${encodeURIComponent(liveSelected.proof_of_payment)}`
                                  : `/api/admin/proof?orderNumber=${encodeURIComponent(liveSelected.order_number)}`
                              }
                              target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] font-bold transition-opacity hover:opacity-70"
                              style={{ color: BRAND.teal }}
                              onClick={e => e.stopPropagation()}>
                              <ExternalLink className="w-3 h-3" /> Open Full
                            </a>
                          </div>
                          <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${BRAND.border}`, background: "#F8F7F6" }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={
                                liveSelected.proof_of_payment
                                  ? `/api/admin/proof?path=${encodeURIComponent(liveSelected.proof_of_payment)}`
                                  : `/api/admin/proof?orderNumber=${encodeURIComponent(liveSelected.order_number)}`
                              }
                              alt="Proof of payment"
                              className="w-full object-contain max-h-64"
                              onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                            />
                          </div>
                        </div>
                      )}
                      {liveSelected.payment_method === "cod" && (
                        <p className="text-xs px-3 py-2 rounded" style={{ background: `${BRAND.teal}10`, color: BRAND.muted }}>
                          Cash on Delivery — no proof required
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Balance payment section — DP orders only */}
                {liveSelected.payment_type === "downpayment" && (
                  <div className="px-5 py-3" style={{ borderTop: `1px solid ${BRAND.border}` }}>
                    <button type="button" onClick={() => setBalanceSectionOpen(o => !o)}
                      className="w-full flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-3.5 h-3.5" style={{ color: liveSelected.balance_paid_at ? BRAND.teal : BRAND.red }} />
                        <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: BRAND.muted }}>Balance Payment</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!balanceSectionOpen && (
                          <span className="text-xs font-semibold" style={{ color: liveSelected.balance_paid_at ? BRAND.teal : BRAND.red }}>
                            {liveSelected.balance_paid_at ? "Paid" : "Pending"}
                          </span>
                        )}
                        <ChevronDown className="w-3.5 h-3.5 transition-transform" style={{ color: BRAND.muted, transform: balanceSectionOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
                      </div>
                    </button>
                    {balanceSectionOpen && (
                      <div className="mt-3">
                        {liveSelected.balance_reference ? (
                          <div className="space-y-3">
                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between">
                                <span style={{ color: BRAND.muted }}>Mode of payment</span>
                                <span className="font-semibold" style={{ color: BRAND.black }}>
                                  {liveSelected.balance_payment_method
                                    ? (PAYMENT_LABELS[liveSelected.balance_payment_method] ?? liveSelected.balance_payment_method)
                                    : "—"}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span style={{ color: BRAND.muted }}>Ref num</span>
                                <span className="font-semibold" style={{ color: BRAND.black }}>{liveSelected.balance_reference}</span>
                              </div>
                              {liveSelected.balance_paid_at && (
                                <div className="flex justify-between">
                                  <span style={{ color: BRAND.muted }}>Submitted</span>
                                  <span style={{ color: BRAND.black }}>
                                    {new Date(liveSelected.balance_paid_at).toLocaleString("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                  </span>
                                </div>
                              )}
                            </div>
                            {liveSelected.balance_proof_url && (
                              <div>
                                <div className="flex items-center justify-between mb-1.5">
                                  <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: BRAND.muted }}>Proof image</p>
                                  <a
                                    href={`/api/admin/proof?path=${encodeURIComponent(liveSelected.balance_proof_url)}`}
                                    target="_blank" rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[10px] font-bold transition-opacity hover:opacity-70"
                                    style={{ color: BRAND.teal }}>
                                    <ExternalLink className="w-3 h-3" /> Open Full
                                  </a>
                                </div>
                                <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${BRAND.border}`, background: "#F8F7F6" }}>
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={`/api/admin/proof?path=${encodeURIComponent(liveSelected.balance_proof_url)}`}
                                    alt="Balance proof"
                                    className="w-full object-contain max-h-64"
                                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs px-3 py-2 rounded" style={{ background: `${BRAND.red}10`, color: BRAND.red }}>
                            No balance payment submitted yet
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Tracking number — display only; edit via shipping modal */}
              {(liveSelected.status === "processing" || liveSelected.status === "shipped") && (
                <div className="px-5 py-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Truck className="w-3.5 h-3.5" style={{ color: BRAND.teal }} />
                    <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: BRAND.muted }}>Tracking Number</p>
                  </div>
                  {liveSelected.tracking_number ? (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold" style={{ color: BRAND.black }}>{liveSelected.tracking_number}</span>
                      <button
                        type="button"
                        onClick={() => { setShippingTrackingInput(liveSelected.tracking_number ?? ""); setShowShippingModal(true); }}
                        className="text-xs font-bold transition-opacity hover:opacity-70"
                        style={{ color: BRAND.teal }}>
                        Edit
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setShippingTrackingInput(""); setShowShippingModal(true); }}
                      className="text-xs font-bold px-3 py-1.5 transition-opacity hover:opacity-70"
                      style={{ background: `${BRAND.teal}15`, color: BRAND.teal, border: `1px solid ${BRAND.teal}40` }}>
                      + Add Tracking Number
                    </button>
                  )}
                </div>
              )}

              {/* Admin Notes */}
              <div className="px-5 py-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-3.5 h-3.5" style={{ color: BRAND.teal }} />
                  <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: BRAND.muted }}>Admin Notes</p>
                </div>
                <textarea
                  value={notesInput}
                  onChange={e => setNotesInput(e.target.value)}
                  rows={2}
                  placeholder="Internal notes (not visible to customers)…"
                  className="w-full px-3 py-2 text-xs focus:outline-none resize-none"
                  style={{ background: BRAND.card, border: `1px solid ${BRAND.border}`, color: BRAND.black }} />
                <button
                  onClick={() => saveNotes(liveSelected.id)}
                  disabled={saving || notesInput === (liveSelected.admin_notes ?? "")}
                  className="mt-2 px-3 py-1.5 text-xs font-bold transition-opacity hover:opacity-80 disabled:opacity-40"
                  style={{ background: BRAND.teal, color: "#fff" }}>
                  Save Note
                </button>
              </div>
            </div>

            {/* Modal footer — actions */}
            <div className="px-5 py-4 shrink-0 space-y-2.5"
              style={{ borderTop: `1px solid ${BRAND.border}`, background: BRAND.card }}>

              {nextAction && (() => {
                const balanceLocked = liveSelected.payment_type === "downpayment"
                  && !liveSelected.balance_paid_at
                  && (nextAction.next === "shipped" || nextAction.next === "delivered");
                return (
                  <button
                    onClick={() => {
                      if (nextAction.next === "shipped") {
                        setShippingTrackingInput(liveSelected.tracking_number ?? "");
                        setShowShippingModal(true);
                      } else {
                        updateStatus(liveSelected.id, nextAction.next);
                      }
                    }}
                    disabled={saving || balanceLocked}
                    className="w-full py-3.5 font-black text-sm uppercase tracking-widest transition-opacity disabled:opacity-50"
                    style={{ background: balanceLocked ? BRAND.muted : nextAction.color, color: "#fff" }}>
                    {balanceLocked ? "Balance Not Yet Paid — Cannot Ship" : saving ? "Saving…" : nextAction.label}
                  </button>
                );
              })()}

              <div className="flex gap-2">
                <div className="relative flex-1" ref={statusDropdownRef}>
                  <button type="button" onClick={() => setStatusDropdownOpen(o => !o)}
                    className="w-full flex items-center justify-between text-xs px-3 py-2.5 focus:outline-none font-semibold"
                    style={{ background: BRAND.bg, border: `1px solid ${statusDropdownOpen ? BRAND.teal : BRAND.border}`, color: BRAND.black }}>
                    <span>{liveSelected.status === "delivered" && isCODSelected ? "Delivered / Cash Collected" : STATUS_CFG[liveSelected.status as keyof typeof STATUS_CFG]?.label ?? liveSelected.status}</span>
                    <ChevronDown className="w-3.5 h-3.5 shrink-0 transition-transform" style={{ color: BRAND.muted, transform: statusDropdownOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
                  </button>
                  {statusDropdownOpen && (
                    <div className="absolute left-0 right-0 bottom-full mb-1 z-50 overflow-hidden shadow-lg"
                      style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                      {statusOptions.map(([k, v]) => {
                        const needsTracking = (k === "shipped" || k === "delivered") && !liveSelected.tracking_number && !isCODSelected;
                        const balanceLocked = (k === "shipped" || k === "delivered") && liveSelected.payment_type === "downpayment" && !liveSelected.balance_paid_at;
                        return (
                          <button key={k} type="button"
                            disabled={needsTracking || balanceLocked}
                            onClick={() => {
                              if (k === "shipped" && !liveSelected.tracking_number) {
                                setShippingTrackingInput("");
                                setShowShippingModal(true);
                              } else {
                                updateStatus(liveSelected.id, k);
                              }
                              setStatusDropdownOpen(false);
                            }}
                            className="w-full flex items-center justify-between px-3 py-2.5 text-xs text-left transition-colors hover:opacity-80 disabled:opacity-40"
                            style={{ background: liveSelected.status === k ? `${BRAND.teal}10` : "transparent", color: liveSelected.status === k ? BRAND.teal : BRAND.black, borderBottom: `1px solid ${BRAND.border}`, fontWeight: liveSelected.status === k ? 700 : 500 }}>
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: (v as { color: string }).color }} />
                              {k === "delivered" && isCODSelected ? "Delivered / Cash Collected" : (v as { label: string }).label}
                              {needsTracking && <span style={{ color: BRAND.red }}>(add tracking first)</span>}
                              {balanceLocked && <span style={{ color: BRAND.red }}>(balance unpaid)</span>}
                            </div>
                            {liveSelected.status === k && <Check className="w-3 h-3 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                {liveSelected.status !== "cancelled" && liveSelected.status !== "delivered" && (
                  <button
                    onClick={confirmCancel}
                    disabled={saving}
                    className="px-4 py-2.5 text-xs font-bold transition-opacity disabled:opacity-50"
                    style={{ border: `1px solid #EF4444`, color: "#EF4444", background: "transparent" }}>
                    Cancel Order
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Shipping modal — tracking number required before marking as shipped */}
      {showShippingModal && liveSelected && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={e => { if (e.target === e.currentTarget) setShowShippingModal(false); }}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden"
            style={{ background: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
            <div className="px-5 py-4" style={{ borderBottom: `1px solid ${BRAND.border}`, background: BRAND.card }}>
              <p className="font-black text-sm uppercase tracking-widest" style={{ color: "#3B82F6" }}>Mark as Shipped</p>
              <p className="text-xs mt-0.5" style={{ color: BRAND.muted }}>{liveSelected.order_number}</p>
            </div>
            <div className="p-5">
              <label className="block text-xs font-bold uppercase tracking-wide mb-2" style={{ color: BRAND.black }}>
                Tracking Number <span style={{ color: BRAND.red }}>*</span>
              </label>
              <input
                value={shippingTrackingInput}
                onChange={e => setShippingTrackingInput(e.target.value)}
                placeholder="e.g. JRS-123456789"
                autoFocus
                className="w-full px-3 py-2.5 text-sm focus:outline-none"
                style={{ background: BRAND.card, border: `1px solid ${BRAND.border}`, color: BRAND.black }}
              />
              <p className="text-xs mt-1" style={{ color: BRAND.muted }}>Required to ship — customer will see this to track delivery.</p>
            </div>
            <div className="flex gap-3 px-5 pb-5">
              <button
                onClick={async () => {
                  if (!shippingTrackingInput.trim()) return;
                  setShowShippingModal(false);
                  setSaving(true);
                  const trk = shippingTrackingInput.trim();
                  setOrders(prev => prev.map(o => o.id === liveSelected.id ? { ...o, status: "shipped", tracking_number: trk } : o));
                  if (selected?.id === liveSelected.id) setSelected(prev => prev ? { ...prev, status: "shipped", tracking_number: trk } : prev);
                  setTrackingInput(trk);
                  await fetch(`/api/admin/orders/${liveSelected.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: "shipped", tracking_number: trk }),
                  });
                  setSaving(false);
                }}
                disabled={!shippingTrackingInput.trim()}
                className="flex-1 py-2.5 text-xs font-black uppercase tracking-wide disabled:opacity-40"
                style={{ background: "#3B82F6", color: "#fff" }}>
                Confirm & Ship
              </button>
              <button onClick={() => setShowShippingModal(false)}
                className="px-4 py-2.5 text-xs font-bold"
                style={{ border: `1px solid ${BRAND.border}`, color: BRAND.muted }}>
                Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel reason modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={e => { if (e.target === e.currentTarget) { setShowCancelModal(false); setCancelReason(""); } }}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden"
            style={{ background: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
            <div className="px-5 py-4" style={{ borderBottom: `1px solid ${BRAND.border}`, background: BRAND.card }}>
              <p className="font-black text-sm uppercase tracking-widest" style={{ color: "#EF4444" }}>Cancel Order</p>
              <p className="text-xs mt-0.5" style={{ color: BRAND.muted }}>{liveSelected?.order_number}</p>
            </div>
            <div className="p-5">
              <label className="block text-xs font-bold uppercase tracking-wide mb-2" style={{ color: BRAND.black }}>
                Reason for cancellation
              </label>
              <textarea
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="e.g. Customer requested, out of stock, duplicate order…"
                rows={3}
                autoFocus
                className="w-full px-3 py-2.5 text-sm focus:outline-none resize-none"
                style={{ background: BRAND.card, border: `1px solid ${BRAND.border}`, color: BRAND.black }}
              />
              <p className="text-xs mt-1" style={{ color: BRAND.muted }}>Optional — stored in admin notes</p>
            </div>
            <div className="flex gap-3 px-5 pb-5">
              <button onClick={executeCancelOrder}
                className="flex-1 py-2.5 text-xs font-black uppercase tracking-wide"
                style={{ background: "#EF4444", color: "#fff" }}>
                Confirm Cancel
              </button>
              <button onClick={() => { setShowCancelModal(false); setCancelReason(""); }}
                className="px-4 py-2.5 text-xs font-bold"
                style={{ border: `1px solid ${BRAND.border}`, color: BRAND.muted }}>
                Back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { BRAND, FONTS } from "@/lib/constants";
import {
  Search, Clock, CheckCircle, Truck, Package, XCircle,
  X, ExternalLink, MapPin, User, CreditCard, ChevronRight,
} from "lucide-react";

const STATUSES = ["all", "pending", "paid", "processing", "shipped", "delivered", "cancelled"] as const;
type Status = (typeof STATUSES)[number];

const STATUS_CFG = {
  pending:    { icon: Clock,        color: "#D97706", bg: "rgba(217,119,6,0.1)",    label: "Pending" },
  paid:       { icon: CheckCircle,  color: "#5BB8B4", bg: "rgba(91,184,180,0.1)",   label: "Paid" },
  processing: { icon: Package,      color: "#6366F1", bg: "rgba(99,102,241,0.1)",   label: "Processing" },
  shipped:    { icon: Truck,        color: "#3B82F6", bg: "rgba(59,130,246,0.1)",   label: "Shipped" },
  delivered:  { icon: CheckCircle,  color: "#10B981", bg: "rgba(16,185,129,0.1)",   label: "Delivered" },
  cancelled:  { icon: XCircle,      color: "#EF4444", bg: "rgba(239,68,68,0.1)",    label: "Cancelled" },
};

const PAYMENT_LABELS: Record<string, string> = {
  gcash: "GCash", maya: "Maya", bank_transfer: "Bank Transfer", cod: "COD",
};

type OrderItem = { product_name: string; brand: string; size: string; quantity: number; unit_price: number; payment_type: string };
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
  created_at: string;
  order_items: OrderItem[];
};

// Next action to suggest based on current status
const NEXT_ACTION: Record<string, { label: string; next: string; color: string } | null> = {
  pending:    { label: "Accept / Process Order", next: "paid",       color: BRAND.teal },
  paid:       { label: "Mark as Processing",     next: "processing", color: "#6366F1" },
  processing: { label: "Mark as Shipped",        next: "shipped",    color: "#3B82F6" },
  shipped:    { label: "Mark as Delivered",      next: "delivered",  color: "#10B981" },
  delivered:  null,
  cancelled:  null,
};

export default function AdminOrdersClient({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status>("all");
  const [selected, setSelected] = useState<Order | null>(null);
  const [trackingInput, setTrackingInput] = useState("");
  const [saving, setSaving] = useState(false);

  const filtered = orders.filter(o => {
    const matchSearch = !search ||
      o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      o.order_items.some(i => i.product_name.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = STATUSES.reduce((acc, s) => {
    acc[s] = s === "all" ? orders.length : orders.filter(o => o.status === s).length;
    return acc;
  }, {} as Record<Status, number>);

  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);

  function openOrder(o: Order) {
    setSelected(o);
    setTrackingInput(o.tracking_number ?? "");
  }

  function closeModal() {
    setSelected(null);
  }

  async function updateStatus(id: string, status: string) {
    setSaving(true);
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : prev);
    await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setSaving(false);
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

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  function itemsSummary(items: OrderItem[]) {
    if (!items.length) return "—";
    const first = items[0];
    const rest = items.length > 1 ? ` +${items.length - 1} more` : "";
    return `${first.product_name} (${first.size})${rest}`;
  }

  const liveSelected = selected ? (orders.find(o => o.id === selected.id) ?? selected) : null;
  const nextAction = liveSelected ? NEXT_ACTION[liveSelected.status] ?? null : null;
  const selCfg = liveSelected ? (STATUS_CFG[liveSelected.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.pending) : null;

  return (
    <div style={{ fontFamily: FONTS.body }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: BRAND.teal }}>Order Management</p>
          <h1 style={{ fontFamily: FONTS.display, fontSize: "2.5rem", letterSpacing: "0.04em", color: BRAND.black }}>ORDERS</h1>
        </div>
        {totalRevenue > 0 && (
          <div className="text-right">
            <p style={{ fontFamily: FONTS.display, fontSize: "1.5rem", color: BRAND.black }}>
              ₱{totalRevenue.toLocaleString()}
            </p>
            <p className="text-xs" style={{ color: BRAND.muted }}>Total Revenue</p>
          </div>
        )}
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
              {["Order", "Customer", "Items", "Payment", "Total", "Status", "Date"].map(h => (
                <th key={h} className="px-4 py-3.5 text-left text-[10px] font-black uppercase tracking-widest"
                  style={{ color: BRAND.muted }}>{h}</th>
              ))}
              <th className="px-4 py-3.5 text-[10px] font-black uppercase tracking-widest" style={{ color: BRAND.muted }} />
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
              <button key={o.id} className="w-full px-4 py-4 flex items-center justify-between text-left"
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
                <div className="space-y-2.5">
                  {liveSelected.order_items.map((item, i) => (
                    <div key={i} className="flex items-start justify-between gap-3">
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
                  ))}
                </div>
                <div className="flex justify-between mt-3 pt-3 font-black text-sm"
                  style={{ borderTop: `1px solid ${BRAND.border}` }}>
                  <span style={{ color: BRAND.black }}>Total</span>
                  <span style={{ fontFamily: FONTS.display, color: BRAND.black }}>₱{Number(liveSelected.total).toLocaleString()}</span>
                </div>
              </div>

              {/* Payment */}
              <div className="px-5 py-4">
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard className="w-3.5 h-3.5" style={{ color: BRAND.teal }} />
                  <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: BRAND.muted }}>Payment</p>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: BRAND.black }}>
                      {PAYMENT_LABELS[liveSelected.payment_method] ?? liveSelected.payment_method}
                    </p>
                    <p className="text-xs capitalize" style={{ color: BRAND.muted }}>
                      {liveSelected.payment_type === "downpayment" ? "Downpayment" : "Full Payment"}
                    </p>
                  </div>
                  {liveSelected.proof_of_payment && liveSelected.payment_method !== "cod" && (
                    <a href={`/api/admin/proof?path=${encodeURIComponent(liveSelected.proof_of_payment)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold"
                      style={{ background: `${BRAND.teal}15`, color: BRAND.teal, border: `1px solid ${BRAND.teal}40` }}
                      onClick={e => e.stopPropagation()}>
                      <ExternalLink className="w-3 h-3" /> View Proof
                    </a>
                  )}
                </div>
              </div>

              {/* Tracking number (show when processing or shipped) */}
              {(liveSelected.status === "processing" || liveSelected.status === "shipped") && (
                <div className="px-5 py-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Truck className="w-3.5 h-3.5" style={{ color: BRAND.teal }} />
                    <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: BRAND.muted }}>Tracking Number</p>
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={trackingInput}
                      onChange={e => setTrackingInput(e.target.value)}
                      placeholder="Enter courier tracking number"
                      className="flex-1 px-3 py-2.5 text-sm focus:outline-none"
                      style={{ background: BRAND.card, border: `1px solid ${BRAND.border}`, color: BRAND.black }} />
                    <button onClick={() => saveTracking(liveSelected.id)} disabled={saving}
                      className="px-4 py-2.5 text-xs font-bold transition-opacity disabled:opacity-50"
                      style={{ background: BRAND.teal, color: "#fff" }}>
                      Save
                    </button>
                  </div>
                  {liveSelected.tracking_number && (
                    <p className="text-xs mt-1.5" style={{ color: BRAND.muted }}>
                      Current: <span style={{ color: BRAND.black, fontWeight: 600 }}>{liveSelected.tracking_number}</span>
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Modal footer — actions */}
            <div className="px-5 py-4 shrink-0 space-y-2.5"
              style={{ borderTop: `1px solid ${BRAND.border}`, background: BRAND.card }}>

              {/* Primary action button */}
              {nextAction && (
                <button
                  onClick={() => updateStatus(liveSelected.id, nextAction.next)}
                  disabled={saving}
                  className="w-full py-3.5 font-black text-sm uppercase tracking-widest transition-opacity disabled:opacity-50"
                  style={{ background: nextAction.color, color: "#fff" }}>
                  {saving ? "Saving…" : nextAction.label}
                </button>
              )}

              {/* Status override + cancel row */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <select value={liveSelected.status}
                    onChange={e => updateStatus(liveSelected.id, e.target.value)}
                    className="w-full text-xs px-3 py-2.5 focus:outline-none appearance-none cursor-pointer"
                    style={{ background: BRAND.bg, border: `1px solid ${BRAND.border}`, color: BRAND.black }}>
                    {Object.entries(STATUS_CFG).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
                {liveSelected.status !== "cancelled" && liveSelected.status !== "delivered" && (
                  <button
                    onClick={() => updateStatus(liveSelected.id, "cancelled")}
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
    </div>
  );
}

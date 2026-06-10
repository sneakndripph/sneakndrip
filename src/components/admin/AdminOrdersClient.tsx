"use client";

import { useState } from "react";
import { BRAND, FONTS } from "@/lib/constants";
import { Search, Clock, CheckCircle, Truck, Package, XCircle, ChevronDown } from "lucide-react";

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
  created_at: string;
  order_items: OrderItem[];
};

export default function AdminOrdersClient({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [trackingEdits, setTrackingEdits] = useState<Record<string, string>>({});

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

  async function updateStatus(id: string, status: string) {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  async function saveTracking(id: string) {
    const tracking_number = trackingEdits[id] ?? "";
    setOrders(prev => prev.map(o => o.id === id ? { ...o, tracking_number } : o));
    await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tracking_number }),
    });
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
  }

  function itemsSummary(items: OrderItem[]) {
    if (!items.length) return "—";
    const first = items[0];
    const rest = items.length > 1 ? ` +${items.length - 1} more` : "";
    return `${first.product_name} (${first.size})${rest}`;
  }

  return (
    <div style={{ fontFamily: FONTS.body }}>
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

      <div className="rounded-xl overflow-hidden" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
        {/* Desktop table */}
        <table className="w-full hidden md:table">
          <thead>
            <tr style={{ background: "rgba(13,13,13,0.02)", borderBottom: `1px solid ${BRAND.border}` }}>
              {["Order", "Customer", "Items", "Payment", "Total", "Status", "Date", "Update"].map(h => (
                <th key={h} className="px-4 py-3.5 text-left text-[10px] font-black uppercase tracking-widest"
                  style={{ color: BRAND.muted }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(o => {
              const cfg = STATUS_CFG[o.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.pending;
              const Icon = cfg.icon;
              return (
                <tr key={o.id} className="transition-colors hover:bg-black/[0.01]"
                  style={{ borderBottom: `1px solid ${BRAND.border}` }}>
                  <td className="px-4 py-4 text-xs font-bold" style={{ color: BRAND.black }}>
                    {o.order_number}
                  </td>
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
                    {formatDate(o.created_at)}
                  </td>
                  <td className="px-4 py-4">
                    <select value={o.status} onChange={e => updateStatus(o.id, e.target.value)}
                      className="text-xs px-2 py-1.5 focus:outline-none appearance-none cursor-pointer"
                      style={{ background: BRAND.bg, border: `1px solid ${BRAND.border}`, color: BRAND.black }}>
                      {Object.entries(STATUS_CFG).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Mobile accordion */}
        <div className="md:hidden divide-y" style={{ borderColor: BRAND.border }}>
          {filtered.map(o => {
            const cfg = STATUS_CFG[o.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.pending;
            const Icon = cfg.icon;
            const open = expanded === o.id;
            return (
              <div key={o.id}>
                <button className="w-full px-4 py-4 flex items-center justify-between text-left"
                  onClick={() => setExpanded(open ? null : o.id)}>
                  <div>
                    <p className="text-xs font-bold" style={{ color: BRAND.black }}>{o.order_number}</p>
                    <p className="text-xs" style={{ color: BRAND.muted }}>
                      {o.customer_name} · ₱{Number(o.total).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full"
                      style={{ background: cfg.bg, color: cfg.color }}>
                      <Icon className="w-3 h-3" />{cfg.label}
                    </span>
                    <ChevronDown className="w-4 h-4 transition-transform" style={{ color: BRAND.muted, transform: open ? "rotate(180deg)" : "" }} />
                  </div>
                </button>
                {open && (
                  <div className="px-4 pb-4 space-y-3 text-xs" style={{ color: BRAND.muted }}>
                    <div>
                      <p className="font-bold mb-1" style={{ color: BRAND.black }}>Items</p>
                      {o.order_items.map((item, i) => (
                        <p key={i}>{item.product_name} — {item.size} x{item.quantity} · ₱{Number(item.unit_price).toLocaleString()}</p>
                      ))}
                    </div>
                    <div>
                      <p className="font-bold mb-0.5" style={{ color: BRAND.black }}>Shipping</p>
                      <p>{o.shipping_street}, {o.shipping_barangay}, {o.shipping_city}, {o.shipping_province}</p>
                    </div>
                    <div>
                      <p className="font-bold mb-0.5" style={{ color: BRAND.black }}>Payment</p>
                      <p>{PAYMENT_LABELS[o.payment_method] ?? o.payment_method} · {o.payment_type}</p>
                    </div>
                    <div>
                      <p className="font-bold mb-1" style={{ color: BRAND.black }}>Tracking Number</p>
                      <div className="flex gap-2">
                        <input
                          defaultValue={o.tracking_number ?? ""}
                          onChange={e => setTrackingEdits(t => ({ ...t, [o.id]: e.target.value }))}
                          placeholder="Enter tracking number"
                          className="flex-1 px-3 py-2 text-xs focus:outline-none"
                          style={{ background: BRAND.bg, border: `1px solid ${BRAND.border}`, color: BRAND.black }} />
                        <button onClick={() => saveTracking(o.id)}
                          className="px-3 py-2 text-xs font-bold"
                          style={{ background: BRAND.teal, color: "#fff" }}>
                          Save
                        </button>
                      </div>
                    </div>
                    <select value={o.status} onChange={e => updateStatus(o.id, e.target.value)}
                      className="w-full text-xs px-3 py-2 focus:outline-none appearance-none"
                      style={{ background: BRAND.bg, border: `1px solid ${BRAND.border}`, color: BRAND.black }}>
                      {Object.entries(STATUS_CFG).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                  </div>
                )}
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
    </div>
  );
}

"use client";

import { useState } from "react";
import { BRAND, FONTS } from "@/lib/constants";
import { Search, Clock, CheckCircle, Truck, Package, XCircle, ChevronDown } from "lucide-react";

const STATUSES = ["all", "pending", "paid", "processing", "shipped", "delivered", "cancelled"] as const;
type Status = (typeof STATUSES)[number];

const STATUS_CFG = {
  pending:    { icon: Clock, color: "#D97706", bg: "rgba(217,119,6,0.1)", label: "Pending" },
  paid:       { icon: CheckCircle, color: "#5BB8B4", bg: "rgba(91,184,180,0.1)", label: "Paid" },
  processing: { icon: Package, color: "#6366F1", bg: "rgba(99,102,241,0.1)", label: "Processing" },
  shipped:    { icon: Truck, color: "#3B82F6", bg: "rgba(59,130,246,0.1)", label: "Shipped" },
  delivered:  { icon: CheckCircle, color: "#10B981", bg: "rgba(16,185,129,0.1)", label: "Delivered" },
  cancelled:  { icon: XCircle, color: "#EF4444", bg: "rgba(239,68,68,0.1)", label: "Cancelled" },
};

const ORDERS = [
  { id: "SND-20250609-001", customer: "Marco Reyes", email: "marco@email.com", item: "Jordan 4 Retro Black Cat (US 9)", total: 12645, status: "paid", date: "Jun 9, 2025", payment: "GCash" },
  { id: "SND-20250609-002", customer: "Issa Torres", email: "issa@email.com", item: "Nike Dunk Low Panda (US 8)", total: 9145, status: "pending", date: "Jun 9, 2025", payment: "Bank Transfer" },
  { id: "SND-20250608-001", customer: "Paulo Cruz", email: "paulo@email.com", item: "Air Force 1 White (US 9.5)", total: 6145, status: "shipped", date: "Jun 8, 2025", payment: "Maya" },
  { id: "SND-20250608-002", customer: "Karla Mendoza", email: "karla@email.com", item: "NB 550 White Green (US 7.5)", total: 7145, status: "delivered", date: "Jun 8, 2025", payment: "GCash" },
  { id: "SND-20250607-001", customer: "Dio Villanueva", email: "dio@email.com", item: "Yeezy Slide Onyx (US 10)", total: 7640, status: "processing", date: "Jun 7, 2025", payment: "GCash" },
  { id: "SND-20250607-002", customer: "Rica Santos", email: "rica@email.com", item: "Jordan 1 Low OG (US 7)", total: 8995, status: "paid", date: "Jun 7, 2025", payment: "Maya" },
  { id: "SND-20250606-001", customer: "Ben Ocampo", email: "ben@email.com", item: "Adidas Samba OG (US 10.5)", total: 7500, status: "delivered", date: "Jun 6, 2025", payment: "COD" },
  { id: "SND-20250605-001", customer: "Ana Lim", email: "ana@email.com", item: "Nike Air Max 90 (US 8.5)", total: 8995, status: "cancelled", date: "Jun 5, 2025", payment: "Bank Transfer" },
];

export default function AdminOrdersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const orders = ORDERS.filter(o => {
    const matchSearch = !search ||
      o.customer.toLowerCase().includes(search.toLowerCase()) ||
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.item.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = STATUSES.reduce((acc, s) => {
    acc[s] = s === "all" ? ORDERS.length : ORDERS.filter(o => o.status === s).length;
    return acc;
  }, {} as Record<Status, number>);

  return (
    <div style={{ fontFamily: FONTS.body }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: BRAND.teal }}>Order Management</p>
          <h1 style={{ fontFamily: FONTS.display, fontSize: "2.5rem", letterSpacing: "0.04em", color: BRAND.black }}>ORDERS</h1>
        </div>
        <div className="text-right">
          <p style={{ fontFamily: FONTS.display, fontSize: "1.5rem", color: BRAND.black }}>
            ₱{ORDERS.reduce((s, o) => s + o.total, 0).toLocaleString()}
          </p>
          <p className="text-xs" style={{ color: BRAND.muted }}>Total Revenue</p>
        </div>
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
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by order ID, customer, or item…"
          className="w-full pl-11 pr-4 py-3 text-sm focus:outline-none"
          style={{ background: BRAND.card, border: `1px solid ${BRAND.border}`, color: BRAND.black }} />
      </div>

      {/* Orders */}
      <div className="rounded-xl overflow-hidden" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
        <table className="w-full hidden md:table">
          <thead>
            <tr style={{ background: "rgba(13,13,13,0.02)", borderBottom: `1px solid ${BRAND.border}` }}>
              {["Order ID", "Customer", "Item", "Payment", "Total", "Status", "Date", ""].map(h => (
                <th key={h} className="px-4 py-3.5 text-left text-[10px] font-black uppercase tracking-widest"
                  style={{ color: BRAND.muted }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map(o => {
              const cfg = STATUS_CFG[o.status as keyof typeof STATUS_CFG];
              const Icon = cfg.icon;
              return (
                <tr key={o.id} className="transition-colors hover:bg-black/[0.01]"
                  style={{ borderBottom: `1px solid ${BRAND.border}` }}>
                  <td className="px-4 py-4 text-xs font-bold" style={{ color: BRAND.black }}>{o.id}</td>
                  <td className="px-4 py-4">
                    <p className="text-xs font-semibold" style={{ color: BRAND.black }}>{o.customer}</p>
                    <p className="text-[10px]" style={{ color: BRAND.muted }}>{o.email}</p>
                  </td>
                  <td className="px-4 py-4 text-xs max-w-[160px] truncate" style={{ color: BRAND.muted }}>{o.item}</td>
                  <td className="px-4 py-4 text-xs font-medium" style={{ color: BRAND.muted }}>{o.payment}</td>
                  <td className="px-4 py-4 text-xs font-bold" style={{ color: BRAND.black }}>₱{o.total.toLocaleString()}</td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full"
                      style={{ background: cfg.bg, color: cfg.color }}>
                      <Icon className="w-3 h-3" />{cfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-xs" style={{ color: BRAND.muted }}>{o.date}</td>
                  <td className="px-4 py-4">
                    <select defaultValue={o.status}
                      className="text-xs px-2 py-1.5 focus:outline-none appearance-none cursor-pointer"
                      style={{ background: BRAND.bg, border: `1px solid ${BRAND.border}`, color: BRAND.black }}>
                      {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Mobile list */}
        <div className="md:hidden divide-y" style={{ borderColor: BRAND.border }}>
          {orders.map(o => {
            const cfg = STATUS_CFG[o.status as keyof typeof STATUS_CFG];
            const Icon = cfg.icon;
            const open = expanded === o.id;
            return (
              <div key={o.id}>
                <button className="w-full px-4 py-4 flex items-center justify-between text-left"
                  onClick={() => setExpanded(open ? null : o.id)}>
                  <div>
                    <p className="text-xs font-bold" style={{ color: BRAND.black }}>{o.id}</p>
                    <p className="text-xs" style={{ color: BRAND.muted }}>{o.customer} · ₱{o.total.toLocaleString()}</p>
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
                  <div className="px-4 pb-4 space-y-2 text-xs" style={{ color: BRAND.muted }}>
                    <p><span className="font-semibold" style={{ color: BRAND.black }}>Item:</span> {o.item}</p>
                    <p><span className="font-semibold" style={{ color: BRAND.black }}>Payment:</span> {o.payment}</p>
                    <p><span className="font-semibold" style={{ color: BRAND.black }}>Date:</span> {o.date}</p>
                    <select defaultValue={o.status}
                      className="mt-2 text-xs px-3 py-2 focus:outline-none w-full"
                      style={{ background: BRAND.bg, border: `1px solid ${BRAND.border}`, color: BRAND.black }}>
                      {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {orders.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-sm font-semibold" style={{ color: BRAND.muted }}>No orders found</p>
          </div>
        )}
      </div>
    </div>
  );
}

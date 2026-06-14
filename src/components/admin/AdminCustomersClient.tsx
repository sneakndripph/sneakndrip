"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { BRAND, FONTS } from "@/lib/constants";
import { Search, Users, X, Phone, MapPin, ShoppingBag, Calendar, Ban, ShieldCheck } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  pending: "#D97706", paid: BRAND.teal, processing: "#6366F1",
  shipped: "#3B82F6", delivered: "#10B981", cancelled: BRAND.red,
};

type CustomerOrder = {
  order_number: string;
  total: number;
  status: string;
  created_at: string;
};

type Customer = {
  id: string;
  banned: boolean;
  name: string;
  email: string;
  mobile: string;
  city: string;
  orders: number;
  total: number;
  joined: string;
  lastOrder: string;
  recentOrders: CustomerOrder[];
};

export default function AdminCustomersClient({ customers }: { customers: Customer[] }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);
  const [banning, setBanning] = useState(false);

  async function toggleBan(c: Customer) {
    if (!confirm(`${c.banned ? "Unban" : "Ban"} ${c.name}?`)) return;
    setBanning(true);
    const res = await fetch("/api/admin/customers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: c.id, ban: !c.banned }),
    });
    if (res.ok) {
      setSelected(prev => prev ? { ...prev, banned: !prev.banned } : null);
    }
    setBanning(false);
  }

  const filtered = useMemo(() => {
    if (!search) return customers;
    const q = search.toLowerCase();
    return customers.filter(c =>
      c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q) || c.mobile.includes(q)
    );
  }, [customers, search]);

  return (
    <div style={{ fontFamily: FONTS.body }}>
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: BRAND.teal }}>Management</p>
        <h1 style={{ fontFamily: FONTS.display, fontSize: "2.5rem", letterSpacing: "0.04em", color: BRAND.black }}>CUSTOMERS</h1>
        <p className="text-sm mt-1" style={{ color: BRAND.muted }}>{customers.length} registered accounts</p>
      </div>

      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: BRAND.muted }} />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email or mobile…"
          className="w-full pl-10 pr-4 py-3 text-sm focus:outline-none"
          style={{ background: BRAND.card, border: `1px solid ${BRAND.border}`, color: BRAND.black }}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl py-20 text-center" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
          <Users className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: BRAND.black }} />
          <p style={{ fontFamily: FONTS.display, fontSize: "1.5rem", color: BRAND.muted, letterSpacing: "0.04em" }}>
            {search ? "NO RESULTS" : "NO CUSTOMERS YET"}
          </p>
          <p className="text-sm mt-2" style={{ color: BRAND.mutedLight }}>
            {search ? "Try a different name or email." : "Customers will appear here once they register."}
          </p>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr style={{ borderBottom: `1px solid ${BRAND.border}` }}>
                  {["Customer", "Contact", "Location", "Orders", "Total Spent", "Joined", "Last Order"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest"
                      style={{ color: BRAND.muted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id}
                    className="transition-colors hover:bg-black/[0.02] cursor-pointer"
                    style={{ borderBottom: `1px solid ${BRAND.border}` }}
                    onClick={() => setSelected(c)}>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold" style={{ color: BRAND.black }}>{c.name}</p>
                        {c.banned && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${BRAND.red}12`, color: BRAND.red }}>Banned</span>}
                      </div>
                      <p className="text-xs" style={{ color: BRAND.muted }}>{c.email}</p>
                    </td>
                    <td className="px-4 py-3.5 text-xs" style={{ color: c.mobile ? BRAND.black : BRAND.muted }}>
                      {c.mobile || "—"}
                    </td>
                    <td className="px-4 py-3.5 text-xs" style={{ color: c.city ? BRAND.black : BRAND.muted }}>
                      {c.city || "—"}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-bold" style={{ color: c.orders > 0 ? BRAND.teal : BRAND.muted }}>
                        {c.orders}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-bold" style={{ color: BRAND.black }}>
                        {c.total > 0 ? `₱${c.total.toLocaleString()}` : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs" style={{ color: BRAND.muted }}>{c.joined}</td>
                    <td className="px-4 py-3.5 text-xs" style={{ color: BRAND.muted }}>{c.lastOrder || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Customer detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="w-full max-w-lg rounded-2xl overflow-hidden flex flex-col" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}`, maxHeight: "90vh" }}>
            {/* Header */}
            <div className="flex items-start justify-between px-6 py-5 shrink-0" style={{ borderBottom: `1px solid ${BRAND.border}` }}>
              <div>
                <p className="font-black text-lg" style={{ color: BRAND.black, fontFamily: FONTS.display, letterSpacing: "0.04em" }}>
                  {selected.name}
                </p>
                <p className="text-sm mt-0.5" style={{ color: BRAND.muted }}>{selected.email}</p>
              </div>
              <button onClick={() => setSelected(null)} className="transition-opacity hover:opacity-60 mt-1">
                <X className="w-5 h-5" style={{ color: BRAND.muted }} />
              </button>
            </div>

            {/* Details row */}
            <div className="px-6 py-4 grid grid-cols-2 gap-4 shrink-0" style={{ borderBottom: `1px solid ${BRAND.border}` }}>
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 mt-0.5 shrink-0" style={{ color: BRAND.teal }} />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide mb-0.5" style={{ color: BRAND.muted }}>Contact</p>
                  <p className="text-sm font-semibold" style={{ color: selected.mobile ? BRAND.black : BRAND.muted }}>
                    {selected.mobile || "Not provided"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" style={{ color: BRAND.teal }} />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide mb-0.5" style={{ color: BRAND.muted }}>Location</p>
                  <p className="text-sm font-semibold" style={{ color: selected.city ? BRAND.black : BRAND.muted }}>
                    {selected.city || "Not provided"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShoppingBag className="w-4 h-4 mt-0.5 shrink-0" style={{ color: BRAND.teal }} />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide mb-0.5" style={{ color: BRAND.muted }}>Orders</p>
                  <p className="text-sm font-semibold" style={{ color: BRAND.black }}>
                    {selected.orders} order{selected.orders !== 1 ? "s" : ""} · {selected.total > 0 ? `₱${selected.total.toLocaleString()}` : "₱0"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 mt-0.5 shrink-0" style={{ color: BRAND.teal }} />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide mb-0.5" style={{ color: BRAND.muted }}>Joined</p>
                  <p className="text-sm font-semibold" style={{ color: BRAND.black }}>{selected.joined}</p>
                </div>
              </div>
            </div>

            {/* Orders list */}
            <div className="flex-1 overflow-y-auto">
              {selected.recentOrders.length === 0 ? (
                <p className="text-sm text-center py-8" style={{ color: BRAND.muted }}>No orders yet.</p>
              ) : (
                <>
                  <div className="px-6 pt-3 pb-1">
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: BRAND.muted }}>Order History</p>
                  </div>
                  {selected.recentOrders.map((o, i) => (
                    <Link key={o.order_number}
                      href={`/admin/orders?q=${o.order_number}`}
                      onClick={() => setSelected(null)}
                      className="flex items-center justify-between px-6 py-3 transition-colors hover:bg-black/[0.03]"
                      style={{ borderBottom: i < selected.recentOrders.length - 1 ? `1px solid ${BRAND.border}` : "none" }}>
                      <div>
                        <p className="text-sm font-bold" style={{ color: BRAND.black }}>{o.order_number}</p>
                        <p className="text-xs" style={{ color: BRAND.muted }}>
                          {new Date(o.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 capitalize rounded-full"
                          style={{
                            background: `${STATUS_COLORS[o.status] ?? "#999"}18`,
                            color: STATUS_COLORS[o.status] ?? "#999",
                          }}>
                          {o.status}
                        </span>
                        <p className="text-sm font-black" style={{ color: BRAND.black }}>₱{Number(o.total).toLocaleString()}</p>
                      </div>
                    </Link>
                  ))}
                </>
              )}
            </div>

            <div className="px-6 py-4 shrink-0 flex gap-3" style={{ borderTop: `1px solid ${BRAND.border}` }}>
              <button onClick={() => toggleBan(selected)} disabled={banning}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold uppercase tracking-wide transition-opacity hover:opacity-80 disabled:opacity-40"
                style={{ background: selected.banned ? `${BRAND.teal}15` : `${BRAND.red}12`, color: selected.banned ? BRAND.teal : BRAND.red }}>
                {selected.banned ? <ShieldCheck className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                {banning ? "…" : selected.banned ? "Unban" : "Ban"}
              </button>
              <button onClick={() => setSelected(null)}
                className="flex-1 py-2.5 text-sm font-bold uppercase tracking-wide transition-opacity hover:opacity-70"
                style={{ border: `1px solid ${BRAND.border}`, color: BRAND.muted }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

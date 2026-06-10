"use client";

import { useState } from "react";
import { BRAND, FONTS } from "@/lib/constants";
import { Search, User, Mail, Phone, MapPin } from "lucide-react";

const CUSTOMERS = [
  { id: "C001", name: "Marco Reyes", email: "marco@email.com", mobile: "09171234567", city: "Makati, Metro Manila", orders: 4, total: 38500, joined: "Jan 12, 2025", lastOrder: "Jun 9, 2025" },
  { id: "C002", name: "Issa Torres", email: "issa@email.com", mobile: "09281234567", city: "Quezon City, Metro Manila", orders: 2, total: 17290, joined: "Feb 3, 2025", lastOrder: "Jun 9, 2025" },
  { id: "C003", name: "Paulo Cruz", email: "paulo@email.com", mobile: "09391234567", city: "Mandaluyong, Metro Manila", orders: 6, total: 52400, joined: "Nov 20, 2024", lastOrder: "Jun 8, 2025" },
  { id: "C004", name: "Karla Mendoza", email: "karla@email.com", mobile: "09501234567", city: "Cebu City, Cebu", orders: 3, total: 24100, joined: "Mar 5, 2025", lastOrder: "Jun 8, 2025" },
  { id: "C005", name: "Dio Villanueva", email: "dio@email.com", mobile: "09611234567", city: "Davao City, Davao del Sur", orders: 1, total: 7640, joined: "May 28, 2025", lastOrder: "Jun 7, 2025" },
  { id: "C006", name: "Rica Santos", email: "rica@email.com", mobile: "09721234567", city: "Taguig, Metro Manila", orders: 5, total: 44750, joined: "Dec 10, 2024", lastOrder: "Jun 7, 2025" },
  { id: "C007", name: "Ben Ocampo", email: "ben@email.com", mobile: "09831234567", city: "Antipolo, Rizal", orders: 2, total: 15000, joined: "Apr 14, 2025", lastOrder: "Jun 6, 2025" },
  { id: "C008", name: "Ana Lim", email: "ana@email.com", mobile: "09941234567", city: "Pasig, Metro Manila", orders: 7, total: 61900, joined: "Sep 1, 2024", lastOrder: "Jun 5, 2025" },
];

export default function AdminCustomersPage() {
  const [search, setSearch] = useState("");

  const customers = CUSTOMERS.filter(c =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.city.toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue = CUSTOMERS.reduce((s, c) => s + c.total, 0);
  const totalOrders = CUSTOMERS.reduce((s, c) => s + c.orders, 0);
  const avgOrderValue = Math.round(totalRevenue / totalOrders);

  return (
    <div style={{ fontFamily: FONTS.body }}>
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: BRAND.teal }}>CRM</p>
        <h1 style={{ fontFamily: FONTS.display, fontSize: "2.5rem", letterSpacing: "0.04em", color: BRAND.black }}>CUSTOMERS</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Customers", value: CUSTOMERS.length },
          { label: "Total Orders", value: totalOrders },
          { label: "Avg. Order Value", value: `₱${avgOrderValue.toLocaleString()}` },
        ].map(s => (
          <div key={s.label} className="p-4 rounded-xl" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            <p style={{ fontFamily: FONTS.display, fontSize: "1.8rem", color: BRAND.black, letterSpacing: "0.03em" }}>{s.value}</p>
            <p className="text-xs uppercase tracking-widest font-semibold mt-0.5" style={{ color: BRAND.muted }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: BRAND.muted }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, or city…"
          className="w-full pl-11 pr-4 py-3 text-sm focus:outline-none"
          style={{ background: BRAND.card, border: `1px solid ${BRAND.border}`, color: BRAND.black }} />
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: "rgba(13,13,13,0.02)", borderBottom: `1px solid ${BRAND.border}` }}>
                {["Customer", "Contact", "Location", "Orders", "Total Spent", "Joined", "Last Order"].map(h => (
                  <th key={h} className="px-4 py-3.5 text-left text-[10px] font-black uppercase tracking-widest"
                    style={{ color: BRAND.muted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {customers.map(c => (
                <tr key={c.id} className="transition-colors hover:bg-black/[0.01]"
                  style={{ borderBottom: `1px solid ${BRAND.border}` }}>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: `${BRAND.teal}15`, color: BRAND.teal }}>
                        <span className="text-xs font-black">{c.name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="text-xs font-semibold" style={{ color: BRAND.black }}>{c.name}</p>
                        <p className="text-[10px]" style={{ color: BRAND.muted }}>{c.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-[10px]" style={{ color: BRAND.muted }}>
                        <Mail className="w-3 h-3" />{c.email}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px]" style={{ color: BRAND.muted }}>
                        <Phone className="w-3 h-3" />{c.mobile}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: BRAND.muted }}>
                      <MapPin className="w-3 h-3 shrink-0" />{c.city}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-black"
                      style={{ background: `${BRAND.teal}12`, color: BRAND.teal }}>
                      {c.orders}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm font-bold" style={{ color: BRAND.black }}>
                    ₱{c.total.toLocaleString()}
                  </td>
                  <td className="px-4 py-4 text-xs" style={{ color: BRAND.muted }}>{c.joined}</td>
                  <td className="px-4 py-4 text-xs" style={{ color: BRAND.muted }}>{c.lastOrder}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {customers.length === 0 && (
          <div className="py-16 text-center">
            <User className="w-8 h-8 mx-auto mb-2" style={{ color: BRAND.mutedLight }} />
            <p className="text-sm font-semibold" style={{ color: BRAND.muted }}>No customers found</p>
          </div>
        )}
      </div>
    </div>
  );
}

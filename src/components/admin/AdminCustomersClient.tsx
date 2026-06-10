"use client";

import { useState, useMemo } from "react";
import { BRAND, FONTS } from "@/lib/constants";
import { Search, Users } from "lucide-react";

type Customer = {
  id: string;
  name: string;
  email: string;
  mobile: string;
  city: string;
  orders: number;
  total: number;
  joined: string;
  lastOrder: string;
};

export default function AdminCustomersClient({ customers }: { customers: Customer[] }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return customers;
    const q = search.toLowerCase();
    return customers.filter(c =>
      c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.city.toLowerCase().includes(q)
    );
  }, [customers, search]);

  return (
    <div style={{ fontFamily: FONTS.body }}>
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: BRAND.teal }}>Management</p>
        <h1 style={{ fontFamily: FONTS.display, fontSize: "2.5rem", letterSpacing: "0.04em", color: BRAND.black }}>CUSTOMERS</h1>
        <p className="text-sm mt-1" style={{ color: BRAND.muted }}>{customers.length} registered accounts</p>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: BRAND.muted }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full pl-10 pr-4 py-3 text-sm focus:outline-none"
          style={{ background: BRAND.card, border: `1px solid ${BRAND.border}`, color: BRAND.black }}
        />
      </div>

      {/* Table */}
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
                  <tr key={c.id} className="transition-colors hover:bg-black/[0.02]"
                    style={{ borderBottom: `1px solid ${BRAND.border}` }}>
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-bold" style={{ color: BRAND.black }}>{c.name}</p>
                      <p className="text-xs" style={{ color: BRAND.muted }}>{c.email}</p>
                    </td>
                    <td className="px-4 py-3.5 text-xs" style={{ color: BRAND.muted }}>{c.mobile || "—"}</td>
                    <td className="px-4 py-3.5 text-xs" style={{ color: BRAND.muted }}>{c.city}</td>
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
                    <td className="px-4 py-3.5 text-xs" style={{ color: BRAND.muted }}>{c.lastOrder}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

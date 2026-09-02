"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Users, X, Phone, MapPin, ShoppingBag, Calendar, Ban, ShieldCheck, Download, MessageCircle } from "lucide-react";
import toast from "react-hot-toast";
import OrderStatusBadge from "./OrderStatusBadge";
import ConfirmDialog from "./ConfirmDialog";

type CustomerOrder = {
  order_number: string;
  total: number;
  status: string;
  created_at: string;
  images: string[];
};

type Customer = {
  id: string;
  authUserId: string | null;
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

type StatusFilter = "all" | "active" | "banned";

const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "banned", label: "Banned" },
];

export default function AdminCustomersClient({ customers: initialCustomers, initialSearch = "" }: { customers: Customer[]; initialSearch?: string }) {
  const [customers, setCustomers] = useState(initialCustomers);
  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selected, setSelected] = useState<Customer | null>(null);
  const [mounted, setMounted] = useState(false);
  const [banTarget, setBanTarget] = useState<Customer | null>(null);

  function openDrawer(c: Customer) {
    setSelected(c);
    setTimeout(() => setMounted(true), 10);
  }
  function closeDrawer() {
    setMounted(false);
    setTimeout(() => setSelected(null), 200);
  }

  async function executeBan() {
    if (!banTarget) return;
    const nextBanned = !banTarget.banned;
    const userId = banTarget.authUserId ?? banTarget.id;
    const res = await fetch("/api/admin/customers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ban: nextBanned }),
    });
    if (!res.ok) {
      toast.error(nextBanned ? "Couldn't ban customer. Try again." : "Couldn't unban customer. Try again.");
      throw new Error("ban failed");
    }
    setCustomers(prev => prev.map(c => c.id === banTarget.id ? { ...c, banned: nextBanned } : c));
    setSelected(prev => prev?.id === banTarget.id ? { ...prev, banned: nextBanned } : prev);
    toast.success(nextBanned ? `${banTarget.name} banned` : `${banTarget.name} unbanned`);
  }

  const filtered = useMemo(() => {
    let list = customers;
    if (statusFilter === "active") list = list.filter(c => !c.banned);
    if (statusFilter === "banned") list = list.filter(c => c.banned);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) || c.mobile.includes(q)
      );
    }
    return list;
  }, [customers, search, statusFilter]);

  function exportCSV() {
    const rows = [
      ["Name", "Email", "Mobile", "City", "Orders", "Total Spent", "Joined", "Status"],
      ...filtered.map(c => [
        c.name, c.email, c.mobile, c.city,
        c.orders, `₱${Number(c.total).toLocaleString()}`,
        new Date(c.joined).toLocaleDateString("en-PH"),
        c.banned ? "Banned" : "Active",
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `customers-${new Date().toISOString().split("T")[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <p className="text-admin-eyebrow text-ink-3 mb-1">Management</p>
          <h1 className="text-admin-hero text-ink font-display font-medium tracking-[-0.02em]">Customers</h1>
          <p className="text-admin text-ink-3 mt-1">{customers.length} registered accounts</p>
        </div>
        <button onClick={exportCSV}
          className="flex items-center gap-1.5 px-3 py-2 text-admin-sm font-medium rounded-md border border-line text-ink-2 hover:border-line-strong transition-colors duration-admin-fast">
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-3" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email or mobile…"
            className="w-full pl-10 pr-4 py-2.5 text-admin bg-paper border border-line rounded-md text-ink placeholder:text-ink-3 focus:outline-none focus:border-line-strong transition-colors duration-admin-fast"
          />
        </div>
        <div className="inline-flex bg-paper-2 rounded-md p-1">
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => setStatusFilter(f.id)}
              className={`text-admin-sm px-3.5 py-1.5 rounded transition-colors duration-admin-fast ${
                statusFilter === f.id ? "bg-paper text-ink font-medium" : "text-ink-3 hover:text-ink"
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-paper border border-line rounded-md py-20 text-center">
          <Users className="w-9 h-9 mx-auto mb-3 text-ink-3" />
          <p className="text-admin-title text-ink">
            {search || statusFilter !== "all" ? "No results" : "No customers yet"}
          </p>
          <p className="text-admin-sm text-ink-3 mt-1">
            {search || statusFilter !== "all" ? "Try a different search or filter." : "Customers will appear here once they register."}
          </p>
        </div>
      ) : (
        <div className="bg-paper border border-line rounded-md overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-paper-2 border-b border-line-strong">
                  {["Name", "Email", "Orders", "Total spent", "Status", ""].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-admin-eyebrow text-ink-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map(c => (
                  <tr key={c.id} onClick={() => openDrawer(c)}
                    className="cursor-pointer even:bg-paper-2 hover:bg-admin-row-hover transition-colors duration-admin-fast">
                    <td className="px-4 py-3.5 text-admin-sm font-semibold text-ink">{c.name}</td>
                    <td className="px-4 py-3.5 text-admin-sm text-ink-3">{c.email}</td>
                    <td className="px-4 py-3.5 text-admin-sm text-ink">{c.orders}</td>
                    <td className="px-4 py-3.5 text-admin-sm font-semibold text-ink">
                      {c.total > 0 ? `₱${c.total.toLocaleString()}` : "—"}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-admin-micro font-medium px-2 py-0.5 rounded-full ${
                        c.banned ? "text-state-error bg-state-error/10" : "text-state-onhand bg-state-onhand/10"
                      }`}>
                        {c.banned ? "Banned" : "Active"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                      <button onClick={() => { setBanTarget(c);}}
                        className="p-1.5 rounded hover:bg-paper-3 transition-colors duration-admin-fast" title={c.banned ? "Unban" : "Ban"}>
                        {c.banned
                          ? <ShieldCheck className="w-4 h-4 text-state-onhand" />
                          : <Ban className="w-4 h-4 text-state-error" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="md:hidden divide-y divide-line">
            {filtered.map(c => (
              <div key={c.id} onClick={() => openDrawer(c)} className="px-4 py-3.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-admin-sm font-semibold text-ink">{c.name}</p>
                  <span className={`text-admin-micro font-medium px-2 py-0.5 rounded-full ${
                    c.banned ? "text-state-error bg-state-error/10" : "text-state-onhand bg-state-onhand/10"
                  }`}>
                    {c.banned ? "Banned" : "Active"}
                  </span>
                </div>
                <p className="text-admin-micro text-ink-3 mt-0.5">{c.email}</p>
                <p className="text-admin-micro text-ink-3 mt-1">
                  {c.orders} order{c.orders !== 1 ? "s" : ""} · {c.total > 0 ? `₱${c.total.toLocaleString()}` : "₱0"} spent
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Customer detail drawer */}
      {selected && (
        <>
          <div className={`fixed inset-0 z-40 bg-ink/40 transition-opacity duration-admin-base ${mounted ? "opacity-100" : "opacity-0"}`}
            onClick={closeDrawer} />
          <div className={`fixed z-50 bg-paper flex flex-col
              inset-0 sm:inset-auto sm:right-0 sm:top-0 sm:bottom-0 sm:w-[480px] sm:border-l sm:border-line sm:shadow-xl
              transition-transform duration-200 ease-smooth ${mounted ? "translate-x-0" : "translate-x-full"}`}>
            <div className="flex items-start justify-between px-5 py-4 shrink-0 border-b border-line bg-paper-2">
              <div>
                <p className="text-admin-sm font-bold text-ink">{selected.name}</p>
                <p className="text-admin-micro text-ink-3 mt-0.5">{selected.email}</p>
              </div>
              <button onClick={closeDrawer} className="p-1.5 rounded-md hover:bg-admin-row-hover transition-colors duration-admin-fast">
                <X className="w-4 h-4 text-ink-3" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 divide-y divide-line">
              {/* Profile */}
              <div className="px-5 py-4 grid grid-cols-2 gap-4">
                <div className="flex items-start gap-2.5">
                  <Phone className="w-3.5 h-3.5 mt-0.5 shrink-0 text-ink-3" />
                  <div>
                    <p className="text-admin-eyebrow text-ink-3 mb-0.5">Contact</p>
                    <p className="text-admin-sm font-medium text-ink">{selected.mobile || "Not provided"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-ink-3" />
                  <div>
                    <p className="text-admin-eyebrow text-ink-3 mb-0.5">Location</p>
                    <p className="text-admin-sm font-medium text-ink">{selected.city || "Not provided"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <ShoppingBag className="w-3.5 h-3.5 mt-0.5 shrink-0 text-ink-3" />
                  <div>
                    <p className="text-admin-eyebrow text-ink-3 mb-0.5">Orders</p>
                    <p className="text-admin-sm font-medium text-ink">
                      {selected.orders} · {selected.total > 0 ? `₱${selected.total.toLocaleString()}` : "₱0"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Calendar className="w-3.5 h-3.5 mt-0.5 shrink-0 text-ink-3" />
                  <div>
                    <p className="text-admin-eyebrow text-ink-3 mb-0.5">Joined</p>
                    <p className="text-admin-sm font-medium text-ink">{selected.joined}</p>
                  </div>
                </div>
              </div>

              {/* Order history */}
              <div>
                {selected.recentOrders.length === 0 ? (
                  <p className="text-admin-sm text-ink-3 text-center py-8">No orders yet.</p>
                ) : (
                  <>
                    <p className="text-admin-eyebrow text-ink-3 px-5 pt-3 pb-1">Order history</p>
                    <div className="divide-y divide-line">
                      {selected.recentOrders.map(o => (
                        <Link key={o.order_number} href={`/admin/orders?q=${o.order_number}`} onClick={closeDrawer}
                          className="flex items-center gap-3 px-5 py-3 hover:bg-admin-row-hover transition-colors duration-admin-fast">
                          {o.images.length > 0 && (
                            <div className="flex shrink-0 -space-x-2">
                              {o.images.slice(0, 3).map((img, j) => (
                                <div key={j} className="w-9 h-9 rounded-md overflow-hidden relative border-2 border-paper bg-paper-2">
                                  <Image src={img} alt="" fill className="object-cover" sizes="36px" />
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-admin-sm font-semibold text-ink">{o.order_number}</p>
                            <p className="text-admin-micro text-ink-3">
                              {new Date(o.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <OrderStatusBadge status={o.status} />
                            <p className="text-admin-sm font-bold text-ink">₱{Number(o.total).toLocaleString()}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="px-5 py-4 shrink-0 flex gap-2.5 border-t border-line bg-paper-2">
              <button onClick={() => setBanTarget(selected)}
                className={`flex items-center gap-2 px-4 py-2.5 text-admin-sm font-medium rounded-md transition-colors duration-admin-fast ${
                  selected.banned ? "bg-state-onhand/10 text-state-onhand hover:bg-state-onhand/15" : "bg-state-error/10 text-state-error hover:bg-state-error/15"
                }`}>
                {selected.banned ? <ShieldCheck className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                {selected.banned ? "Unban" : "Ban"}
              </button>
              <a href={`/admin/chat?email=${encodeURIComponent(selected.email)}`}
                className="flex items-center gap-2 px-4 py-2.5 text-admin-sm font-medium rounded-md border border-line text-ink-2 hover:border-line-strong transition-colors duration-admin-fast">
                <MessageCircle className="w-3.5 h-3.5" /> Message
              </a>
              <button onClick={closeDrawer}
                className="flex-1 py-2.5 text-admin-sm font-medium rounded-md border border-line text-ink-2 hover:border-line-strong transition-colors duration-admin-fast">
                Close
              </button>
            </div>
          </div>
        </>
      )}

      <ConfirmDialog
        open={!!banTarget}
        onClose={() => setBanTarget(null)}
        onConfirm={executeBan}
        title={banTarget?.banned ? "Unban this customer?" : "Ban this customer?"}
        description={
          banTarget?.banned
            ? "They'll be able to place orders again."
            : "They won't be able to place orders. You can unban them anytime."
        }
        confirmLabel={banTarget?.banned ? "Unban customer" : "Ban customer"}
        variant={banTarget?.banned ? "default" : "destructive"}
      />
    </div>
  );
}

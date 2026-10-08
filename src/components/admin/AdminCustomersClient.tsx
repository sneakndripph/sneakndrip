"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Users, X, Phone, MapPin, ShoppingBag, Calendar, Ban, ShieldCheck, Download, MessageCircle } from "lucide-react";
import toast from "react-hot-toast";
import OrderStatusBadge from "./OrderStatusBadge";
import ConfirmDialog, { useConfirmDialog } from "./ConfirmDialog";
import BulkActionsBar, { type BulkAction } from "./BulkActionsBar";
import { useSortableTable } from "@/hooks/useSortableTable";
import SortableHeader from "./SortableHeader";

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
  joinedAt: string | null;
  lastOrder: string;
  recentOrders: CustomerOrder[];
};

type StatusFilter = "all" | "active" | "banned";

// Bulk unban above this size asks for confirmation first (ban always does).
const BULK_CONFIRM_THRESHOLD = 10;

const SKIP_LABELS: Record<string, string> = {
  guest: "guest checkout", own_account: "your own account", admin_account: "admin",
  not_found: "not found", update_failed: "failed",
};

const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "banned", label: "Banned" },
];

export default function AdminCustomersClient({ customers: initialCustomers, initialSearch = "" }: { customers: Customer[]; initialSearch?: string }) {
  const [customers, setCustomers] = useState(initialCustomers);
  const [search, setSearchRaw] = useState(initialSearch);
  const [statusFilter, setStatusFilterRaw] = useState<StatusFilter>("all");
  const [selected, setSelected] = useState<Customer | null>(null);
  const [mounted, setMounted] = useState(false);
  const [banTarget, setBanTarget] = useState<Customer | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const { confirm: confirmDialog, dialog: confirmDialogEl } = useConfirmDialog();

  // Any filter change drops the selection so hidden rows can't be bulk-acted on.
  function clearSelection() { setSelectedIds(new Set()); }
  function setSearch(v: string) { setSearchRaw(v); clearSelection(); }
  function setStatusFilter(v: StatusFilter) { setStatusFilterRaw(v); clearSelection(); }

  // Guest-checkout customers have no login account, so there is nothing to ban.
  function requestBan(c: Customer) {
    if (!c.authUserId) {
      toast.error(`${c.name} checked out as a guest and has no account to ban.`);
      return;
    }
    setBanTarget(c);
  }

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
    if (!banTarget.authUserId) throw new Error("guest customer");
    const res = await fetch("/api/admin/customers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: banTarget.authUserId, ban: nextBanned }),
    });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({})) as { error?: string };
      toast.error(error ?? (nextBanned ? "Couldn't ban customer. Try again." : "Couldn't unban customer. Try again."));
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

  const { sortedRows, sortKey, sortDirection, handleSort } = useSortableTable(filtered, {
    accessors: {
      joinedAt: c => new Date(c.joinedAt ?? 0),
      orders: c => c.orders,
      total: c => c.total,
    },
  });

  // Only act on selected rows that are still visible (a single ban/unban can move a
  // selected row out of the Active/Banned filter without a filter change).
  const selectedVisible = sortedRows.filter(c => selectedIds.has(c.id));
  const allVisibleSelected = sortedRows.length > 0 && selectedVisible.length === sortedRows.length;
  const someVisibleSelected = selectedVisible.length > 0 && !allVisibleSelected;

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll(checked: boolean) {
    setSelectedIds(checked ? new Set(sortedRows.map(c => c.id)) : new Set());
  }

  function plural(n: number) {
    return `${n} customer${n !== 1 ? "s" : ""}`;
  }

  async function runBulkBan(ban: boolean) {
    const targets = selectedVisible;
    if (!targets.length || bulkBusy) return;
    const verb = ban ? "Ban" : "Unban";
    const shown = targets.slice(0, 3).map(c => c.name).join(", ");
    const more = targets.length > 3 ? ` and ${targets.length - 3} more` : "";
    if (ban || targets.length > BULK_CONFIRM_THRESHOLD) {
      const ok = await confirmDialog({
        title: `${verb} ${plural(targets.length)}?`,
        description: ban
          ? `${shown}${more}. They won't be able to place orders. Guest-checkout customers and admin accounts are skipped. You can unban them anytime.`
          : `${shown}${more}. They'll be able to place orders again.`,
        confirmLabel: `${verb} ${plural(targets.length)}`,
        variant: ban ? "destructive" : "default",
      });
      if (!ok) return;
    }
    setBulkBusy(true);
    try {
      const res = await fetch("/api/admin/customers/bulk", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: ban ? "ban" : "unban", ids: targets.map(c => c.id) }),
      });
      const result = await res.json().catch(() => ({})) as {
        error?: string; updated?: number; ids?: string[]; skipped?: { id: string; reason: string }[];
      };
      if (!res.ok) { toast.error(result.error ?? `Failed to ${verb.toLowerCase()} customers`); return; }
      const doneIds = new Set(result.ids ?? []);
      setCustomers(prev => prev.map(c => doneIds.has(c.id) ? { ...c, banned: ban } : c));
      setSelected(prev => prev && doneIds.has(prev.id) ? { ...prev, banned: ban } : prev);
      clearSelection();
      const counts = new Map<string, number>();
      for (const s of result.skipped ?? []) counts.set(s.reason, (counts.get(s.reason) ?? 0) + 1);
      const notes = [...counts].map(([r, n]) => `${n} skipped: ${SKIP_LABELS[r] ?? r}`).join(", ");
      const msg = `${plural(result.updated ?? doneIds.size)} ${ban ? "banned" : "unbanned"}${notes ? ` (${notes})` : ""}`;
      if (counts.get("update_failed")) toast.error(msg); else toast.success(msg);
    } catch {
      toast.error(`Failed to ${verb.toLowerCase()} customers`);
    } finally {
      setBulkBusy(false);
    }
  }

  const bulkActions: BulkAction[] = [
    { key: "ban", label: "Ban", icon: Ban, destructive: true, onSelect: () => runBulkBan(true) },
    { key: "unban", label: "Unban", icon: ShieldCheck, onSelect: () => runBulkBan(false) },
    { key: "export", label: "Export selected (CSV)", icon: Download, dividerBefore: true, onSelect: () => exportCSV(selectedVisible) },
  ];

  function exportCSV(list: Customer[] = filtered) {
    const rows = [
      ["Name", "Email", "Mobile", "City", "Orders", "Total Spent", "Joined", "Status"],
      ...list.map(c => [
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
        <button onClick={() => exportCSV()}
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
          <BulkActionsBar
            selectedCount={selectedVisible.length}
            noun="customer"
            actions={bulkActions}
            onClear={clearSelection}
            busy={bulkBusy}
            busyLabel={`Updating ${plural(selectedVisible.length)}…`}
          />
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-paper-2 border-b border-line-strong">
                  <th className="pl-4 pr-1 py-3 w-8">
                    <input type="checkbox" aria-label="Select all visible customers"
                      checked={allVisibleSelected}
                      ref={el => { if (el) el.indeterminate = someVisibleSelected; }}
                      onChange={e => toggleSelectAll(e.target.checked)}
                      disabled={bulkBusy}
                      className="w-3.5 h-3.5 cursor-pointer accent-ink" />
                  </th>
                  {["Name", "Email"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-admin-eyebrow text-ink-3">{h}</th>
                  ))}
                  <SortableHeader label="Orders" sortKey="orders" currentSortKey={sortKey} direction={sortDirection} onSort={handleSort} />
                  <SortableHeader label="Total spent" sortKey="total" currentSortKey={sortKey} direction={sortDirection} onSort={handleSort} />
                  <SortableHeader label="Joined" sortKey="joinedAt" currentSortKey={sortKey} direction={sortDirection} onSort={handleSort} />
                  {["Status", ""].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-admin-eyebrow text-ink-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {sortedRows.map(c => (
                  <tr key={c.id} onClick={() => openDrawer(c)}
                    className="cursor-pointer even:bg-paper-2 hover:bg-admin-row-hover transition-colors duration-admin-fast">
                    <td className="pl-4 pr-1 py-3.5" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" aria-label={`Select ${c.name}`}
                        checked={selectedIds.has(c.id)}
                        onChange={() => toggleSelect(c.id)}
                        disabled={bulkBusy}
                        className="w-3.5 h-3.5 cursor-pointer accent-ink" />
                    </td>
                    <td className="px-4 py-3.5 text-admin-sm font-semibold text-ink">{c.name}</td>
                    <td className="px-4 py-3.5 text-admin-sm text-ink-3">{c.email}</td>
                    <td className="px-4 py-3.5 text-admin-sm text-ink">{c.orders}</td>
                    <td className="px-4 py-3.5 text-admin-sm font-semibold text-ink">
                      {c.total > 0 ? `₱${c.total.toLocaleString()}` : "—"}
                    </td>
                    <td className="px-4 py-3.5 text-admin-sm text-ink-3">{c.joined}</td>
                    <td className="px-4 py-3.5">
                      <span className={`text-admin-micro font-medium px-2 py-0.5 rounded-full ${
                        c.banned ? "text-state-error bg-state-error/10" : "text-state-onhand bg-state-onhand/10"
                      }`}>
                        {c.banned ? "Banned" : "Active"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                      <button onClick={() => requestBan(c)}
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
            <label className="flex items-center gap-3 px-4 py-2.5 bg-paper-2 text-admin-eyebrow text-ink-3 cursor-pointer">
              <input type="checkbox"
                checked={allVisibleSelected}
                ref={el => { if (el) el.indeterminate = someVisibleSelected; }}
                onChange={e => toggleSelectAll(e.target.checked)}
                disabled={bulkBusy}
                className="w-4 h-4 cursor-pointer accent-ink" />
              Select all
            </label>
            {sortedRows.map(c => (
              <div key={c.id} onClick={() => openDrawer(c)} className="px-4 py-3.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <input type="checkbox" aria-label={`Select ${c.name}`}
                      checked={selectedIds.has(c.id)}
                      onClick={e => e.stopPropagation()}
                      onChange={() => toggleSelect(c.id)}
                      disabled={bulkBusy}
                      className="w-4 h-4 shrink-0 cursor-pointer accent-ink" />
                    <p className="text-admin-sm font-semibold text-ink truncate">{c.name}</p>
                  </div>
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
              <button onClick={() => requestBan(selected)}
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
      {confirmDialogEl}
    </div>
  );
}

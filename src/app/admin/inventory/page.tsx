"use client";
import { useState, useEffect, useMemo } from "react";
import { BRAND, FONTS } from "@/lib/constants";
import { Search, BarChart2, X } from "lucide-react";

type LogEntry = {
  id: string;
  product_id: string | null;
  product_name: string;
  size: string;
  old_stock: number;
  new_stock: number;
  reason: string;
  changed_by: string;
  order_number: string | null;
  created_at: string;
};

const REASON_LABELS: Record<string, string> = {
  order_placed: "Order Placed",
  manual_adjustment: "Manual Adjustment",
  restock: "Restock",
  cancellation: "Order Cancelled",
};

function DetailModal({ entry, onClose }: { entry: LogEntry; onClose: () => void }) {
  const delta = entry.new_stock - entry.old_stock;
  const deltaColor = delta > 0 ? "#10B981" : delta < 0 ? BRAND.red : BRAND.muted;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}>
      <div className="rounded-xl overflow-hidden w-full max-w-md shadow-2xl"
        style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: `1px solid ${BRAND.border}`, background: BRAND.black }}>
          <h2 style={{ fontFamily: FONTS.display, fontSize: "1.2rem", letterSpacing: "0.04em", color: "#fff" }}>
            LOG DETAIL
          </h2>
          <button onClick={onClose} className="text-white opacity-60 hover:opacity-100 transition-opacity">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Stock change hero */}
          <div className="flex items-center justify-center gap-6 p-4 rounded-xl"
            style={{ background: BRAND.bg }}>
            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: BRAND.muted }}>Before</p>
              <p style={{ fontFamily: FONTS.display, fontSize: "2.5rem", color: BRAND.black }}>{entry.old_stock}</p>
            </div>
            <div className="text-center">
              <p style={{ fontFamily: FONTS.display, fontSize: "1.5rem", color: BRAND.mutedLight }}>→</p>
              <p className="text-sm font-black" style={{ color: deltaColor }}>
                {delta > 0 ? `+${delta}` : delta}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: BRAND.muted }}>After</p>
              <p style={{ fontFamily: FONTS.display, fontSize: "2.5rem", color: BRAND.black }}>{entry.new_stock}</p>
            </div>
          </div>

          {/* Details grid */}
          <div className="space-y-3">
            {[
              { label: "Product", value: entry.product_name },
              { label: "Size", value: entry.size },
              { label: "Reason", value: REASON_LABELS[entry.reason] ?? entry.reason },
              { label: "Order", value: entry.order_number ?? "—" },
              { label: "Changed By", value: entry.changed_by || "—" },
              {
                label: "Timestamp",
                value: new Date(entry.created_at).toLocaleString("en-PH", {
                  year: "numeric", month: "short", day: "numeric",
                  hour: "2-digit", minute: "2-digit",
                }),
              },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-start justify-between gap-4">
                <span className="text-[10px] font-black uppercase tracking-widest shrink-0"
                  style={{ color: BRAND.muted, paddingTop: 2 }}>{label}</span>
                <span className="text-sm font-semibold text-right" style={{ color: BRAND.black }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminInventoryPage() {
  const [log, setLog] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<LogEntry | null>(null);

  useEffect(() => {
    fetch("/api/admin/inventory-log").then(r => r.json()).then(setLog).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search) return log;
    const q = search.toLowerCase();
    return log.filter(e =>
      e.product_name.toLowerCase().includes(q) ||
      e.size.toLowerCase().includes(q) ||
      (e.order_number ?? "").toLowerCase().includes(q) ||
      (e.changed_by ?? "").toLowerCase().includes(q)
    );
  }, [log, search]);

  function delta(e: LogEntry) {
    const d = e.new_stock - e.old_stock;
    return { d, color: d > 0 ? "#10B981" : d < 0 ? BRAND.red : BRAND.muted };
  }

  return (
    <div style={{ fontFamily: FONTS.body }}>
      {selected && <DetailModal entry={selected} onClose={() => setSelected(null)} />}

      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: BRAND.teal }}>Stock Management</p>
          <h1 style={{ fontFamily: FONTS.display, fontSize: "2.5rem", letterSpacing: "0.04em", color: BRAND.black }}>INVENTORY LOG</h1>
        </div>
        <div className="text-right">
          <p style={{ fontFamily: FONTS.display, fontSize: "1.5rem", color: BRAND.black }}>{log.length}</p>
          <p className="text-xs" style={{ color: BRAND.muted }}>Total entries</p>
        </div>
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: BRAND.muted }} />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by product, size, order, or email…"
          className="w-full pl-11 pr-4 py-3 text-sm focus:outline-none"
          style={{ background: BRAND.card, border: `1px solid ${BRAND.border}`, color: BRAND.black }} />
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
        {loading ? (
          <div className="py-12 text-center text-sm" style={{ color: BRAND.muted }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <BarChart2 className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: BRAND.black }} />
            <p style={{ fontFamily: FONTS.display, fontSize: "1.3rem", color: BRAND.muted }}>
              {log.length === 0 ? "NO LOG ENTRIES YET" : "NO RESULTS"}
            </p>
            <p className="text-sm mt-1" style={{ color: BRAND.mutedLight }}>
              {log.length === 0 ? "Stock changes from orders will appear here." : "Try a different search."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: "rgba(13,13,13,0.02)", borderBottom: `1px solid ${BRAND.border}` }}>
                  {["Time", "Product", "Size", "Stock Change", "Reason", "Order", "Changed By"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest whitespace-nowrap"
                      style={{ color: BRAND.muted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(e => {
                  const { d, color } = delta(e);
                  return (
                    <tr key={e.id}
                      onClick={() => setSelected(e)}
                      className="cursor-pointer transition-colors hover:bg-black/[0.02]"
                      style={{ borderBottom: `1px solid ${BRAND.border}` }}>
                      <td className="px-4 py-3.5 text-xs whitespace-nowrap" style={{ color: BRAND.muted }}>
                        {new Date(e.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                        {" "}
                        <span className="opacity-60">{new Date(e.created_at).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}</span>
                      </td>
                      <td className="px-4 py-3.5 text-xs font-semibold max-w-[160px] truncate" style={{ color: BRAND.black }}>
                        {e.product_name}
                      </td>
                      <td className="px-4 py-3.5 text-xs" style={{ color: BRAND.muted }}>{e.size}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs" style={{ color: BRAND.muted }}>{e.old_stock}</span>
                          <span className="text-xs" style={{ color: BRAND.mutedLight }}>→</span>
                          <span className="text-xs font-bold" style={{ color: BRAND.black }}>{e.new_stock}</span>
                          <span className="text-xs font-bold" style={{ color }}>
                            ({d > 0 ? "+" : ""}{d})
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded"
                          style={{ background: `${BRAND.teal}15`, color: BRAND.teal }}>
                          {REASON_LABELS[e.reason] ?? e.reason}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs font-mono" style={{ color: e.order_number ? BRAND.teal : BRAND.mutedLight }}>
                        {e.order_number ?? "—"}
                      </td>
                      <td className="px-4 py-3.5 text-xs max-w-[140px] truncate" style={{ color: BRAND.muted }}>
                        {e.changed_by || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

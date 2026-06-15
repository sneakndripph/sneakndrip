"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { BRAND, FONTS } from "@/lib/constants";
import { Search, BarChart2, X, Package, Edit2, Download, Filter, RefreshCw } from "lucide-react";

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

type SizeRow = {
  size: string;
  stock: number;
};

type ProductStock = {
  id: string;
  name: string;
  brand: string;
  status: string;
  sizes: SizeRow[];
};

const REASON_LABELS: Record<string, string> = {
  order_placed: "Order Placed",
  manual_adjustment: "Manual Adjust",
  restock: "Restock",
  cancellation: "Cancelled",
};
const REASON_COLORS: Record<string, string> = {
  order_placed: BRAND.red,
  manual_adjustment: "#6366F1",
  restock: "#10B981",
  cancellation: BRAND.teal,
};

function DetailModal({ entry, onClose }: { entry: LogEntry; onClose: () => void }) {
  const delta = entry.new_stock - entry.old_stock;
  const deltaColor = delta > 0 ? "#10B981" : delta < 0 ? BRAND.red : BRAND.muted;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <div className="rounded-xl overflow-hidden w-full max-w-md"
        style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: `1px solid ${BRAND.border}`, background: BRAND.black }}>
          <h2 style={{ fontFamily: FONTS.display, fontSize: "1.2rem", letterSpacing: "0.04em", color: "#fff" }}>LOG DETAIL</h2>
          <button onClick={onClose} className="text-white opacity-60 hover:opacity-100"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-center gap-6 p-4 rounded-xl" style={{ background: BRAND.bg }}>
            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: BRAND.muted }}>Before</p>
              <p style={{ fontFamily: FONTS.display, fontSize: "2.5rem", color: BRAND.black }}>{entry.old_stock}</p>
            </div>
            <div className="text-center">
              <p style={{ fontFamily: FONTS.display, fontSize: "1.5rem", color: BRAND.mutedLight }}>→</p>
              <p className="text-sm font-black" style={{ color: deltaColor }}>{delta > 0 ? `+${delta}` : delta}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: BRAND.muted }}>After</p>
              <p style={{ fontFamily: FONTS.display, fontSize: "2.5rem", color: BRAND.black }}>{entry.new_stock}</p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { label: "Product", value: entry.product_name },
              { label: "Size", value: entry.size },
              { label: "Reason", value: REASON_LABELS[entry.reason] ?? entry.reason },
              { label: "Order", value: entry.order_number ?? "—" },
              { label: "Changed By", value: entry.changed_by || "—" },
              { label: "Timestamp", value: new Date(entry.created_at).toLocaleString("en-PH", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-start justify-between gap-4">
                <span className="text-[10px] font-black uppercase tracking-widest shrink-0" style={{ color: BRAND.muted, paddingTop: 2 }}>{label}</span>
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
  const [tab, setTab] = useState<"stock" | "log">("stock");
  const [log, setLog] = useState<LogEntry[]>([]);
  const [products, setProducts] = useState<ProductStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [reasonFilter, setReasonFilter] = useState("all");
  const [selected, setSelected] = useState<LogEntry | null>(null);
  const [adjustModal, setAdjustModal] = useState<{ product: ProductStock } | null>(null);
  const [adjustValues, setAdjustValues] = useState<Record<string, string>>({});
  const [adjustReason, setAdjustReason] = useState("manual_adjustment");
  const [adjustError, setAdjustError] = useState("");
  const [saving, setSaving] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [logRes, prodRes] = await Promise.all([
      fetch("/api/admin/inventory-log").then(r => r.json()),
      fetch("/api/admin/products").then(r => r.json()),
    ]);
    setLog(Array.isArray(logRes) ? logRes : []);
    const prods = Array.isArray(prodRes) ? prodRes : (prodRes.products ?? []);
    setProducts(prods);
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const filteredLog = useMemo(() => {
    let list = log;
    if (reasonFilter !== "all") list = list.filter(e => e.reason === reasonFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        e.product_name.toLowerCase().includes(q) ||
        e.size.toLowerCase().includes(q) ||
        (e.order_number ?? "").toLowerCase().includes(q) ||
        (e.changed_by ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [log, search, reasonFilter]);

  const filteredProducts = useMemo(() => {
    if (!search) return products;
    const q = search.toLowerCase();
    return products.filter(p => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q));
  }, [products, search]);

  function openAdjustModal(product: ProductStock) {
    const vals: Record<string, string> = {};
    product.sizes.forEach(s => { vals[s.size] = String(s.stock); });
    setAdjustValues(vals);
    setAdjustReason("manual_adjustment");
    setAdjustError("");
    setAdjustModal({ product });
  }

  async function handleAdjustSave() {
    if (!adjustModal) return;
    const { product } = adjustModal;
    setAdjustError("");
    const changed = product.sizes.filter(s => {
      const newVal = parseInt(adjustValues[s.size] ?? "", 10);
      return !isNaN(newVal) && newVal !== s.stock;
    });
    if (changed.length === 0) {
      setAdjustError("No changes detected. Update at least one size quantity.");
      return;
    }
    setSaving(true);
    for (const s of changed) {
      const newStock = parseInt(adjustValues[s.size], 10);
      const res = await fetch("/api/admin/inventory-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: product.id, product_name: product.name, size: s.size, new_stock: newStock, reason: adjustReason }),
      }).catch(() => null);
      if (!res || !res.ok) {
        const err = await res?.json().catch(() => ({})) as { error?: string };
        setSaving(false);
        setAdjustError(err?.error ?? "Failed to save. Make sure you are logged in as admin.");
        return;
      }
      setProducts(prev => prev.map(p =>
        p.id === product.id
          ? { ...p, sizes: p.sizes.map(sz => sz.size === s.size ? { ...sz, stock: newStock } : sz) }
          : p
      ));
    }
    fetch("/api/admin/inventory-log").then(r => r.json()).then(data => setLog(Array.isArray(data) ? data : []));
    setSaving(false);
    setAdjustModal(null);
  }

  function exportLog() {
    const rows = [
      ["Time", "Product", "Size", "Before", "After", "Delta", "Reason", "Order", "Changed By"],
      ...filteredLog.map(e => [
        new Date(e.created_at).toLocaleString("en-PH"),
        e.product_name, e.size, e.old_stock, e.new_stock,
        e.new_stock - e.old_stock,
        REASON_LABELS[e.reason] ?? e.reason,
        e.order_number ?? "", e.changed_by ?? "",
      ]),
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "inventory-log.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  const totalStock = products.reduce((s, p) => s + p.sizes.reduce((ss, sz) => ss + sz.stock, 0), 0);
  const soldOutProducts = products.filter(p => p.sizes.every(s => s.stock === 0)).length;
  const lowStockCount = products.filter(p => p.sizes.some(s => s.stock > 0 && s.stock <= 2)).length;

  return (
    <div style={{ fontFamily: FONTS.body }}>
      {selected && <DetailModal entry={selected} onClose={() => setSelected(null)} />}

      {/* Stock Adjust Modal */}
      {adjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={e => { if (e.target === e.currentTarget) setAdjustModal(null); }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden flex flex-col" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}`, maxHeight: "90vh" }}>
            <div className="flex items-center justify-between px-6 py-4 shrink-0"
              style={{ background: BRAND.black, borderBottom: `1px solid rgba(255,255,255,0.07)` }}>
              <div>
                <h2 style={{ fontFamily: FONTS.display, fontSize: "1.1rem", letterSpacing: "0.04em", color: "#fff" }}>ADJUST STOCK</h2>
                <p className="text-xs mt-0.5" style={{ color: "#999" }}>{adjustModal.product.name}</p>
              </div>
              <button onClick={() => setAdjustModal(null)} className="opacity-60 hover:opacity-100 transition-opacity">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {adjustModal.product.sizes.map(s => (
                <div key={s.size} className="flex items-center justify-between gap-4 px-4 py-3 rounded-lg"
                  style={{ background: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                  <div>
                    <p className="text-sm font-bold" style={{ color: BRAND.black }}>{s.size}</p>
                    <p className="text-xs" style={{ color: BRAND.muted }}>Current: {s.stock}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: BRAND.muted }}>New qty:</span>
                    <input
                      type="number"
                      min="0"
                      value={adjustValues[s.size] ?? ""}
                      onChange={e => setAdjustValues(v => ({ ...v, [s.size]: e.target.value }))}
                      className="w-20 px-3 py-2 text-sm text-center font-bold focus:outline-none"
                      style={{ background: BRAND.card, border: `1px solid ${BRAND.teal}`, color: BRAND.black }}
                    />
                  </div>
                </div>
              ))}
              <div className="pt-2">
                <label className="block text-xs font-bold uppercase tracking-wide mb-2" style={{ color: BRAND.black }}>Reason</label>
                <select value={adjustReason} onChange={e => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm focus:outline-none"
                  style={{ background: BRAND.bg, border: `1px solid ${BRAND.border}`, color: BRAND.black }}>
                  <option value="manual_adjustment">Manual Adjustment</option>
                  <option value="restock">Restock</option>
                  <option value="correction">Stock Correction</option>
                </select>
              </div>
            </div>
            {adjustError && (
              <div className="px-5 py-2 text-xs font-semibold" style={{ color: BRAND.red, background: `${BRAND.red}10`, borderTop: `1px solid ${BRAND.red}20` }}>
                {adjustError}
              </div>
            )}
            <div className="px-5 py-4 shrink-0 flex gap-3" style={{ borderTop: `1px solid ${BRAND.border}` }}>
              <button onClick={handleAdjustSave} disabled={saving}
                className="flex-1 py-3 text-sm font-black uppercase tracking-widest transition-opacity disabled:opacity-50"
                style={{ background: BRAND.teal, color: "#fff" }}>
                {saving ? "Saving…" : "Save Changes"}
              </button>
              <button onClick={() => setAdjustModal(null)}
                className="px-5 py-3 text-sm font-bold transition-opacity hover:opacity-70"
                style={{ border: `1px solid ${BRAND.border}`, color: BRAND.muted }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: BRAND.teal }}>Stock Management</p>
          <h1 style={{ fontFamily: FONTS.display, fontSize: "2.5rem", letterSpacing: "0.04em", color: BRAND.black }}>INVENTORY</h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadAll} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold transition-opacity hover:opacity-70 disabled:opacity-40"
            style={{ border: `1px solid ${BRAND.border}`, color: BRAND.muted }}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          {tab === "log" && (
            <button onClick={exportLog}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold"
              style={{ background: BRAND.teal, color: "#fff" }}>
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Units", value: totalStock.toLocaleString(), color: BRAND.teal },
          { label: "Low Stock Items", value: String(lowStockCount), color: "#D97706" },
          { label: "Sold Out Products", value: String(soldOutProducts), color: BRAND.red },
        ].map(s => (
          <div key={s.label} className="p-4 rounded-xl text-center" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            <p style={{ fontFamily: FONTS.display, fontSize: "2rem", color: s.color }}>{s.value}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest mt-1" style={{ color: BRAND.muted }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5" style={{ borderBottom: `1px solid ${BRAND.border}` }}>
        {([["stock", "Stock Levels", Package], ["log", "Activity Log", BarChart2]] as const).map(([id, label, Icon]) => (
          <button key={id} onClick={() => setTab(id)}
            className="flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wide transition-colors"
            style={{
              color: tab === id ? BRAND.teal : BRAND.muted,
              borderBottom: tab === id ? `2px solid ${BRAND.teal}` : "2px solid transparent",
              marginBottom: -1,
            }}>
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      {/* Search + filter */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: BRAND.muted }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={tab === "stock" ? "Search products…" : "Search by product, order, email…"}
            className="w-full pl-11 pr-4 py-3 text-sm focus:outline-none"
            style={{ background: BRAND.card, border: `1px solid ${BRAND.border}`, color: BRAND.black }} />
        </div>
        {tab === "log" && (
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" style={{ color: BRAND.muted }} />
            <select value={reasonFilter} onChange={e => setReasonFilter(e.target.value)}
              className="px-3 py-3 text-sm focus:outline-none"
              style={{ background: BRAND.card, border: `1px solid ${BRAND.border}`, color: BRAND.black }}>
              <option value="all">All Reasons</option>
              {Object.entries(REASON_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Stock Levels tab */}
      {tab === "stock" && (
        <div className="rounded-xl overflow-hidden" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
          {loading ? (
            <div className="py-12 text-center text-sm" style={{ color: BRAND.muted }}>Loading…</div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-16 text-center">
              <Package className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: BRAND.black }} />
              <p style={{ fontFamily: FONTS.display, fontSize: "1.3rem", color: BRAND.muted }}>NO PRODUCTS FOUND</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: "rgba(13,13,13,0.02)", borderBottom: `1px solid ${BRAND.border}` }}>
                    {["Product", "Brand", "Status", "Sizes & Stock", "Total Units", ""].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest" style={{ color: BRAND.muted }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(p => {
                    const totalUnits = p.sizes.reduce((s, sz) => s + sz.stock, 0);
                    const allSoldOut = totalUnits === 0;
                    return (
                      <tr key={p.id}
                        className="cursor-pointer transition-colors hover:bg-black/[0.02]"
                        onClick={() => openAdjustModal(p)}
                        style={{ borderBottom: `1px solid ${BRAND.border}` }}>
                        <td className="px-4 py-3.5">
                          <p className="text-sm font-semibold max-w-[180px] truncate" style={{ color: BRAND.black }}>{p.name}</p>
                        </td>
                        <td className="px-4 py-3.5 text-xs" style={{ color: BRAND.muted }}>{p.brand}</td>
                        <td className="px-4 py-3.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 capitalize rounded"
                            style={{ background: p.status === "pre-order" ? `${BRAND.red}12` : `${BRAND.teal}12`, color: p.status === "pre-order" ? BRAND.red : BRAND.teal }}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex flex-wrap gap-1.5">
                            {p.sizes.map(sz => (
                              <div key={sz.size} className="px-2 py-1 rounded text-[11px]"
                                style={{ background: sz.stock === 0 ? `${BRAND.red}08` : sz.stock <= 2 ? "#D9770610" : `${BRAND.teal}10`, border: `1px solid ${sz.stock === 0 ? BRAND.red + "30" : sz.stock <= 2 ? "#D9770630" : BRAND.teal + "30"}` }}>
                                <span className="font-semibold" style={{ color: BRAND.muted }}>{sz.size}</span>
                                <span className="font-bold" style={{ color: BRAND.mutedLight }}>-</span>
                                <span className="font-black" style={{ color: sz.stock === 0 ? BRAND.red : sz.stock <= 2 ? "#D97706" : BRAND.black }}>{sz.stock}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-sm font-black" style={{ color: allSoldOut ? BRAND.red : BRAND.black }}>{totalUnits}</span>
                          {allSoldOut && <span className="ml-2 text-[10px] font-bold" style={{ color: BRAND.red }}>SOLD OUT</span>}
                        </td>
                        <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                          <button onClick={() => openAdjustModal(p)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-opacity hover:opacity-80 whitespace-nowrap"
                            style={{ border: `1px solid ${BRAND.teal}`, color: BRAND.teal, background: `${BRAND.teal}08` }}>
                            <Edit2 className="w-3 h-3" /> Adjust Stock
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Activity Log tab */}
      {tab === "log" && (
        <div className="rounded-xl overflow-hidden" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
          {loading ? (
            <div className="py-12 text-center text-sm" style={{ color: BRAND.muted }}>Loading…</div>
          ) : filteredLog.length === 0 ? (
            <div className="py-16 text-center">
              <BarChart2 className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: BRAND.black }} />
              <p style={{ fontFamily: FONTS.display, fontSize: "1.3rem", color: BRAND.muted }}>
                {log.length === 0 ? "NO LOG ENTRIES YET" : "NO RESULTS"}
              </p>
              <p className="text-sm mt-1" style={{ color: BRAND.mutedLight }}>
                {log.length === 0 ? "Stock changes from orders and manual adjustments appear here." : "Try a different search or filter."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: "rgba(13,13,13,0.02)", borderBottom: `1px solid ${BRAND.border}` }}>
                    {["Time", "Product", "Size", "Stock Change", "Reason", "Order", "Changed By"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest whitespace-nowrap" style={{ color: BRAND.muted }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredLog.map(e => {
                    const d = e.new_stock - e.old_stock;
                    const dColor = d > 0 ? "#10B981" : d < 0 ? BRAND.red : BRAND.muted;
                    const rColor = REASON_COLORS[e.reason] ?? BRAND.teal;
                    return (
                      <tr key={e.id} onClick={() => setSelected(e)}
                        className="cursor-pointer transition-colors hover:bg-black/[0.02]"
                        style={{ borderBottom: `1px solid ${BRAND.border}` }}>
                        <td className="px-4 py-3.5 text-xs whitespace-nowrap" style={{ color: BRAND.muted }}>
                          {new Date(e.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                          {" "}<span className="opacity-60">{new Date(e.created_at).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}</span>
                        </td>
                        <td className="px-4 py-3.5 text-xs font-semibold max-w-[160px] truncate" style={{ color: BRAND.black }}>{e.product_name}</td>
                        <td className="px-4 py-3.5 text-xs" style={{ color: BRAND.muted }}>{e.size}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs" style={{ color: BRAND.muted }}>{e.old_stock}</span>
                            <span className="text-xs" style={{ color: BRAND.mutedLight }}>→</span>
                            <span className="text-xs font-bold" style={{ color: BRAND.black }}>{e.new_stock}</span>
                            <span className="text-xs font-bold" style={{ color: dColor }}>({d > 0 ? "+" : ""}{d})</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: `${rColor}15`, color: rColor }}>
                            {REASON_LABELS[e.reason] ?? e.reason}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-xs font-mono" style={{ color: e.order_number ? BRAND.teal : BRAND.mutedLight }}>
                          {e.order_number ?? "—"}
                        </td>
                        <td className="px-4 py-3.5 text-xs max-w-[140px] truncate" style={{ color: BRAND.muted }}>{e.changed_by || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useMemo, useCallback } from "react";
import { Search, Filter, Package, BarChart2, RefreshCw, Download, X, Edit2 } from "lucide-react";

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

type SizeRow = { size: string; stock: number };

type ProductStock = {
  id: string;
  name: string;
  brand: string;
  status: string;
  image: string | null;
  sizes: SizeRow[];
};

type RawProduct = {
  id: string;
  name: string;
  brand: string;
  status: string;
  images?: string[] | null;
  sizes?: SizeRow[];
  product_sizes?: SizeRow[];
};

const REASON_LABELS: Record<string, string> = {
  order_placed: "Order Placed",
  manual_adjustment: "Manual Adjust",
  restock: "Restock",
  cancellation: "Cancelled",
};

const REASON_BADGE_CLS: Record<string, string> = {
  order_placed: "bg-paper-2 text-ink-2",
  manual_adjustment: "bg-state-preorder/10 text-state-preorder",
  restock: "bg-state-onhand/10 text-state-onhand",
  cancellation: "bg-state-error/10 text-state-error",
};

function normalizeProduct(p: RawProduct): ProductStock {
  const rawSizes = p.sizes ?? p.product_sizes ?? [];
  const sizes = [...rawSizes].sort(
    (a, b) => parseFloat(a.size.replace("US ", "")) - parseFloat(b.size.replace("US ", ""))
  );
  return { id: p.id, name: p.name, brand: p.brand, status: p.status, image: p.images?.[0] ?? null, sizes };
}

function formatDateTime(iso: string) {
  return (
    new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric" }) +
    " " +
    new Date(iso).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })
  );
}

function DetailModal({ entry, onClose }: { entry: LogEntry; onClose: () => void }) {
  const delta = entry.new_stock - entry.old_stock;
  const deltaCls = delta > 0 ? "text-state-onhand" : delta < 0 ? "text-state-error" : "text-ink-3";
  const rows = [
    { label: "Product", value: entry.product_name },
    { label: "Size", value: entry.size },
    { label: "Reason", value: REASON_LABELS[entry.reason] ?? entry.reason },
    { label: "Order", value: entry.order_number ?? "—" },
    { label: "Changed By", value: entry.changed_by || "—" },
    { label: "Timestamp", value: formatDateTime(entry.created_at) },
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-md overflow-hidden bg-paper border border-line">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line bg-paper-2">
          <div>
            <p className="text-admin-sm font-bold text-ink">Log detail</p>
            <p className="text-admin-micro text-ink-3 mt-0.5">{entry.product_name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-admin-row-hover transition-colors duration-admin-fast">
            <X className="w-4 h-4 text-ink-3" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-center gap-6 py-4 rounded-md bg-paper-2">
            <div className="text-center">
              <p className="text-admin-eyebrow text-ink-3 mb-1">Before</p>
              <p className="text-admin-title text-ink">{entry.old_stock}</p>
            </div>
            <span className="text-ink-3 text-admin-lg">→</span>
            <div className="text-center">
              <p className="text-admin-eyebrow text-ink-3 mb-1">After</p>
              <p className={`text-admin-title ${deltaCls}`}>{entry.new_stock}</p>
            </div>
          </div>
          <div className="space-y-2.5">
            {rows.map(({ label, value }) => (
              <div key={label} className="flex items-start justify-between gap-4">
                <span className="text-admin-eyebrow text-ink-3 shrink-0 pt-0.5">{label}</span>
                <span className="text-admin-sm font-semibold text-ink text-right">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AdjustModal({
  product, values, reason, error, saving, onValueChange, onReasonChange, onSave, onClose,
}: {
  product: ProductStock;
  values: Record<string, string>;
  reason: string;
  error: string;
  saving: boolean;
  onValueChange: (size: string, value: string) => void;
  onReasonChange: (reason: string) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-md overflow-hidden bg-paper border border-line flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 shrink-0 border-b border-line bg-paper-2">
          <div>
            <p className="text-admin-sm font-bold text-ink">Adjust stock</p>
            <p className="text-admin-micro text-ink-3 mt-0.5">{product.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-admin-row-hover transition-colors duration-admin-fast">
            <X className="w-4 h-4 text-ink-3" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {product.sizes.map(s => (
            <div key={s.size} className="flex items-center justify-between gap-4 px-4 py-3 rounded-md bg-paper-2">
              <div>
                <p className="text-admin-sm font-semibold text-ink">{s.size}</p>
                <p className="text-admin-micro text-ink-3">Current: {s.stock}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-admin-micro text-ink-3">qty:</span>
                <input
                  type="number"
                  min="0"
                  value={values[s.size] ?? ""}
                  onChange={e => onValueChange(s.size, e.target.value)}
                  className="w-20 bg-paper-2 border-0 rounded-md px-3 py-2 text-admin-sm text-center font-semibold text-ink focus:outline-none focus:ring-1 focus:ring-line-strong"
                />
              </div>
            </div>
          ))}
          <div className="pt-2">
            <label className="text-admin-eyebrow text-ink-3 mb-1.5 block">Reason</label>
            <select value={reason} onChange={e => onReasonChange(e.target.value)}
              className="w-full bg-paper-2 border-0 rounded-md px-3 py-2 text-admin-sm text-ink focus:outline-none focus:ring-1 focus:ring-line-strong">
              <option value="manual_adjustment">Manual Adjustment</option>
              <option value="restock">Restock</option>
            </select>
          </div>
        </div>
        {error && (
          <div className="px-5 py-2.5 shrink-0 text-admin-micro text-state-error bg-state-error/5 border-t border-line">
            {error}
          </div>
        )}
        <div className="px-5 py-4 shrink-0 flex gap-3 border-t border-line">
          <button onClick={onSave} disabled={saving}
            className="flex-1 py-2.5 text-admin-sm font-semibold rounded-md bg-ink text-paper hover:opacity-90 disabled:opacity-50 transition-opacity duration-admin-fast">
            {saving ? "Saving…" : "Save Changes"}
          </button>
          <button onClick={onClose}
            className="px-4 py-2.5 text-admin-sm font-medium rounded-md border border-line text-ink-2 hover:border-line-strong transition-colors duration-admin-fast">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminInventoryClient({
  initialProducts, initialLog,
}: {
  initialProducts: RawProduct[];
  initialLog: LogEntry[];
}) {
  const [tab, setTab] = useState<"stock" | "activity">("stock");
  const [log, setLog] = useState<LogEntry[]>(initialLog);
  const [products, setProducts] = useState<ProductStock[]>(() => initialProducts.map(normalizeProduct));
  const [loading, setLoading] = useState(false);
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
      fetch("/api/admin/inventory-log").then(r => r.json()).catch(() => []),
      fetch("/api/admin/products").then(r => r.json()).catch(() => []),
    ]);
    setLog(Array.isArray(logRes) ? logRes : []);
    setProducts(Array.isArray(prodRes) ? prodRes.map(normalizeProduct) : []);
    setLoading(false);
  }, []);

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
    setSaving(false);
    setAdjustModal(null);
    fetch("/api/admin/inventory-log").then(r => r.json()).then(data => setLog(Array.isArray(data) ? data : [])).catch(() => {});
  }

  function exportLog() {
    const rows = [
      ["Time", "Product", "Size", "Before", "After", "Delta", "Reason", "Order", "Changed By"],
      ...filteredLog.map(e => [
        new Date(e.created_at).toLocaleString("en-PH"),
        e.product_name, e.size, String(e.old_stock), String(e.new_stock),
        String(e.new_stock - e.old_stock),
        REASON_LABELS[e.reason] ?? e.reason,
        e.order_number ?? "", e.changed_by ?? "",
      ]),
    ];
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "inventory-log.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  const totalStock = products.reduce((s, p) => s + p.sizes.reduce((ss, sz) => ss + sz.stock, 0), 0);
  const soldOutProducts = products.filter(p => p.sizes.length > 0 && p.sizes.every(s => s.stock === 0)).length;
  const lowStockCount = products.filter(p => p.sizes.some(s => s.stock > 0 && s.stock <= 2)).length;

  return (
    <div>
      {selected && <DetailModal entry={selected} onClose={() => setSelected(null)} />}
      {adjustModal && (
        <AdjustModal
          product={adjustModal.product}
          values={adjustValues}
          reason={adjustReason}
          error={adjustError}
          saving={saving}
          onValueChange={(size, value) => setAdjustValues(prev => ({ ...prev, [size]: value }))}
          onReasonChange={setAdjustReason}
          onSave={handleAdjustSave}
          onClose={() => setAdjustModal(null)}
        />
      )}

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-admin-eyebrow text-ink-3 mb-1">Admin</p>
          <h1 className="text-admin-hero text-ink font-display font-medium tracking-[-0.02em]">Inventory</h1>
          <p className="text-admin text-ink-3 mt-1">Stock levels and change history across all products.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadAll} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-admin-sm font-medium rounded-md border border-line text-ink-2 hover:border-line-strong disabled:opacity-40 transition-colors duration-admin-fast">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          {tab === "activity" && (
            <button onClick={exportLog}
              className="flex items-center gap-1.5 px-3 py-2 text-admin-sm font-medium rounded-md border border-line text-ink-2 hover:border-line-strong transition-colors duration-admin-fast">
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Units", value: totalStock.toLocaleString() },
          { label: "Low Stock Items", value: String(lowStockCount) },
          { label: "Sold Out Products", value: String(soldOutProducts) },
        ].map(s => (
          <div key={s.label} className="bg-paper border border-line rounded-md p-5">
            <p className="text-admin-eyebrow text-ink-3 mb-2">{s.label}</p>
            <p className="text-admin-hero text-ink font-display leading-none tracking-[-0.02em]">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="inline-flex bg-paper-2 rounded-md p-1 mb-6">
        {([["stock", "Stock", Package], ["activity", "Activity", BarChart2]] as const).map(([id, label, Icon]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 text-admin-sm px-3.5 py-1.5 rounded transition-colors duration-admin-fast ${
              tab === id ? "bg-paper text-ink font-medium" : "text-ink-3 hover:text-ink"
            }`}>
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-3" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={tab === "stock" ? "Search products…" : "Search by product, order, email…"}
            className="w-full pl-9 pr-3.5 py-2.5 text-admin bg-paper border border-line rounded-md text-ink placeholder:text-ink-3 focus:outline-none focus:border-line-strong transition-colors duration-admin-fast" />
        </div>
        {tab === "activity" && (
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-ink-3" />
            <select value={reasonFilter} onChange={e => setReasonFilter(e.target.value)}
              className="px-3.5 py-2.5 text-admin-sm bg-paper border border-line rounded-md text-ink focus:outline-none focus:border-line-strong transition-colors duration-admin-fast">
              <option value="all">All Reasons</option>
              {Object.entries(REASON_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
        )}
      </div>

      {tab === "stock" && (
        <div className="bg-paper border border-line rounded-md overflow-hidden">
          {loading ? (
            <div className="py-12 text-center text-admin-sm text-ink-3">Loading…</div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-16 text-center">
              <Package className="w-9 h-9 mx-auto mb-3 text-ink-3" strokeWidth={1.5} />
              <p className="text-admin-title text-ink">No products found</p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <table className="w-full hidden md:table">
                <thead className="sticky top-0 z-10 bg-paper border-b border-line-strong">
                  <tr className="bg-paper-2">
                    {["Product", "Brand", "Sizes & Stock", "Total", ""].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-admin-eyebrow text-ink-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filteredProducts.map(p => {
                    const totalUnits = p.sizes.reduce((s, sz) => s + sz.stock, 0);
                    const allSoldOut = p.sizes.length > 0 && totalUnits === 0;
                    const anyLow = !allSoldOut && p.sizes.some(sz => sz.stock > 0 && sz.stock <= 2);
                    return (
                      <tr key={p.id}
                        className="cursor-pointer even:bg-paper-2 hover:bg-admin-row-hover transition-colors duration-admin-fast"
                        onClick={() => openAdjustModal(p)}>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-md overflow-hidden bg-paper-2 border border-line shrink-0">
                              {p.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={p.image} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-ink-3">
                                  <Package className="w-4 h-4" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-admin-sm font-semibold text-ink truncate max-w-[200px]">{p.name}</p>
                              {(allSoldOut || anyLow) && (
                                <span className="text-admin-eyebrow text-state-error">{allSoldOut ? "Sold out" : "Low stock"}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-admin-sm text-ink-3">{p.brand}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex flex-wrap gap-1.5">
                            {p.sizes.map(sz => (
                              <span key={sz.size}
                                className={`px-2 py-1 rounded text-admin-micro font-medium ${
                                  sz.stock === 0 ? "bg-state-error/10 text-state-error" :
                                  sz.stock <= 2 ? "bg-state-preorder/10 text-state-preorder" :
                                  "bg-paper-2 text-ink-2"
                                }`}>
                                {sz.size}: {sz.stock}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-admin-sm font-semibold text-ink">{totalUnits}</td>
                        <td className="px-4 py-3.5 text-right" onClick={e => e.stopPropagation()}>
                          <button onClick={() => openAdjustModal(p)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-admin-sm font-medium rounded-md border border-line text-ink-2 hover:border-line-strong transition-colors duration-admin-fast">
                            <Edit2 className="w-3 h-3" /> Adjust
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-line">
                {filteredProducts.map(p => {
                  const totalUnits = p.sizes.reduce((s, sz) => s + sz.stock, 0);
                  const allSoldOut = p.sizes.length > 0 && totalUnits === 0;
                  const anyLow = !allSoldOut && p.sizes.some(sz => sz.stock > 0 && sz.stock <= 2);
                  return (
                    <button key={p.id} onClick={() => openAdjustModal(p)}
                      className="w-full flex items-center gap-3 px-4 py-3.5 text-left">
                      <div className="w-10 h-10 rounded-md overflow-hidden bg-paper-2 border border-line shrink-0">
                        {p.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-ink-3">
                            <Package className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-admin-sm font-semibold text-ink truncate">{p.name}</p>
                        <p className="text-admin-micro text-ink-3 mt-0.5">
                          {p.brand} · {totalUnits} in stock
                          {(allSoldOut || anyLow) && (
                            <span className="ml-1.5 text-state-error">· {allSoldOut ? "Sold out" : "Low stock"}</span>
                          )}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {tab === "activity" && (
        <div className="bg-paper border border-line rounded-md overflow-hidden">
          {loading ? (
            <div className="py-12 text-center text-admin-sm text-ink-3">Loading…</div>
          ) : filteredLog.length === 0 ? (
            <div className="py-16 text-center">
              <BarChart2 className="w-9 h-9 mx-auto mb-3 text-ink-3" strokeWidth={1.5} />
              <p className="text-admin-title text-ink">{log.length === 0 ? "No activity yet" : "No results"}</p>
              <p className="text-admin-sm text-ink-3 mt-1">
                {log.length === 0 ? "Stock changes will be logged here." : "Try a different search or filter."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-line">
              {filteredLog.map(e => {
                const delta = e.new_stock - e.old_stock;
                const deltaCls = delta > 0 ? "text-state-onhand" : delta < 0 ? "text-state-error" : "text-ink-3";
                return (
                  <button key={e.id} onClick={() => setSelected(e)}
                    className="w-full flex items-center gap-4 px-4 py-3.5 text-left hover:bg-admin-row-hover transition-colors duration-admin-fast">
                    <div className="flex-1 min-w-0">
                      <p className="text-admin-sm font-semibold text-ink truncate">
                        {e.product_name} <span className="text-ink-3 font-normal">· {e.size}</span>
                      </p>
                      <p className="text-admin-micro text-ink-3 mt-0.5 truncate">
                        {e.changed_by || "—"}{e.order_number ? ` · ${e.order_number}` : ""} · {formatDateTime(e.created_at)}
                      </p>
                    </div>
                    <span className={`shrink-0 text-admin-micro font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${REASON_BADGE_CLS[e.reason] ?? "bg-paper-2 text-ink-2"}`}>
                      {REASON_LABELS[e.reason] ?? e.reason}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-admin-sm text-ink-3">{e.old_stock}</span>
                      <span className="text-ink-3">→</span>
                      <span className={`text-admin-sm font-semibold ${deltaCls}`}>{e.new_stock}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

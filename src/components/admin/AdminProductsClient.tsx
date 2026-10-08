"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Plus, Search, MoreVertical, Pencil, Copy, Trash2, Package,
  ChevronDown, Check, Eye, EyeOff, Star, Flame, PackageCheck, PackageX,
} from "lucide-react";
import { BRANDS } from "@/lib/constants";
import { now } from "@/lib/utils";
import { useConfirmDialog } from "./ConfirmDialog";
import { useSortableTable } from "@/hooks/useSortableTable";
import SortableHeader from "./SortableHeader";
import BulkActionsBar, { type BulkAction } from "./BulkActionsBar";

type Row = Record<string, unknown> & {
  id: string; name: string; slug: string; brand: string; status: string;
  full_payment_price: number; srp_price: number; is_published: boolean;
  is_featured?: boolean | null; is_trending?: boolean | null;
  created_at: string;
  images?: string[]; product_sizes?: { size: string; stock: number }[];
};

type PublishFilter = "all" | "published" | "draft";
type AvailFilter = "all" | "on-hand" | "pre-order";

/** Fields the bulk endpoint accepts — mirrors productBulkUpdateSchema.patch. */
type BulkPatch = {
  is_published?: boolean; is_featured?: boolean; is_trending?: boolean;
  status?: "on-hand" | "sold-out";
};

// Bulk visibility/status changes above this size ask for confirmation first.
const BULK_CONFIRM_THRESHOLD = 10;

function FlagBadges({ p }: { p: Row }) {
  if (!p.is_featured && !p.is_trending) return null;
  return (
    <span className="inline-flex items-center gap-1 shrink-0">
      {p.is_featured && (
        <span title="Featured" aria-label="Featured" className="inline-flex items-center text-ink">
          <Star className="w-3 h-3 fill-current" />
        </span>
      )}
      {p.is_trending && (
        <span title="Trending" aria-label="Trending" className="inline-flex items-center text-state-preorder">
          <Flame className="w-3 h-3 fill-current" />
        </span>
      )}
    </span>
  );
}

export default function AdminProductsClient({ initialProducts }: { initialProducts: Row[] }) {
  const router = useRouter();
  const [products, setProducts] = useState<Row[]>(initialProducts);
  const [search, setSearchRaw] = useState("");
  const [publishFilter, setPublishFilterRaw] = useState<PublishFilter>("all");
  const [brandFilter, setBrandFilterRaw] = useState("all");
  const [availFilter, setAvailFilterRaw] = useState<AvailFilter>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  // Any filter change drops the selection so hidden rows can't be bulk-acted on.
  function clearSelection() { setSelectedIds(new Set()); }
  function setSearch(v: string) { setSearchRaw(v); clearSelection(); }
  function setPublishFilter(v: PublishFilter) { setPublishFilterRaw(v); clearSelection(); }
  function setBrandFilter(v: string) { setBrandFilterRaw(v); clearSelection(); }
  function setAvailFilter(v: AvailFilter) { setAvailFilterRaw(v); clearSelection(); }

  const [brandOpen, setBrandOpen] = useState(false);
  const [availOpen, setAvailOpen] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const brandRef = useRef<HTMLDivElement>(null);
  const availRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { confirm: confirmDialog, dialog } = useConfirmDialog();

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (brandRef.current && !brandRef.current.contains(e.target as Node)) setBrandOpen(false);
      if (availRef.current && !availRef.current.contains(e.target as Node)) setAvailOpen(false);
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpenId(null);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const usedBrands = BRANDS.filter(b => products.some(p => p.brand === b));

  const filtered = products.filter(p => {
    const matchSearch = !search
      || p.name.toLowerCase().includes(search.toLowerCase())
      || p.brand.toLowerCase().includes(search.toLowerCase());
    const matchPublish = publishFilter === "all"
      || (publishFilter === "published" ? p.is_published : !p.is_published);
    const matchBrand = brandFilter === "all" || p.brand === brandFilter;
    const matchAvail = availFilter === "all" || p.status === availFilter;
    return matchSearch && matchPublish && matchBrand && matchAvail;
  });

  function sizesSummary(p: Row) {
    const sizes = (p.product_sizes ?? []) as { size: string; stock: number }[];
    const inStock = sizes.filter(s => s.stock > 0).length;
    return `${inStock}/${sizes.length}`;
  }

  function totalStock(p: Row) {
    const sizes = (p.product_sizes ?? []) as { size: string; stock: number }[];
    return sizes.reduce((sum, s) => sum + s.stock, 0);
  }

  const { sortedRows, sortKey, sortDirection, handleSort } = useSortableTable(filtered, {
    accessors: {
      stock: totalStock,
      created_at: p => new Date(p.created_at),
    },
  });

  // Only act on selected rows that are still visible (e.g. a per-row unpublish can
  // drop a selected row out of the "Published" filter without a filter change).
  const selectedVisible = sortedRows.filter(p => selectedIds.has(p.id));
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
    setSelectedIds(checked ? new Set(sortedRows.map(p => p.id)) : new Set());
  }

  function plural(n: number) {
    return `${n} product${n !== 1 ? "s" : ""}`;
  }

  async function runBulkUpdate(patch: BulkPatch, doneLabel: string) {
    const ids = selectedVisible.map(p => p.id);
    if (!ids.length || bulkBusy) return;
    if (ids.length > BULK_CONFIRM_THRESHOLD) {
      const ok = await confirmDialog({
        title: `Update ${plural(ids.length)}?`,
        description: `${plural(ids.length)} will be ${doneLabel}.`,
        confirmLabel: "Update",
      });
      if (!ok) return;
    }
    setBulkBusy(true);
    try {
      const res = await fetch("/api/admin/products/bulk", {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids, patch }),
      });
      const result = await res.json().catch(() => ({})) as { error?: string; updated?: number; ids?: string[] };
      if (!res.ok) { toast.error(result.error ?? "Failed to update products"); return; }
      const updatedIds = new Set(result.ids ?? []);
      setProducts(prev => prev.map(row => updatedIds.has(row.id) ? { ...row, ...patch } : row));
      clearSelection();
      const updated = result.updated ?? updatedIds.size;
      const missing = ids.length - updated;
      toast.success(`${plural(updated)} ${doneLabel}${missing > 0 ? ` (${missing} not found)` : ""}`);
    } catch {
      toast.error("Failed to update products");
    } finally {
      setBulkBusy(false);
    }
  }

  async function runBulkDelete() {
    const targets = selectedVisible;
    if (!targets.length || bulkBusy) return;
    const shown = targets.slice(0, 3).map(p => `"${p.name}"`).join(", ");
    const more = targets.length > 3 ? ` and ${targets.length - 3} more` : "";
    const ok = await confirmDialog({
      title: `Delete ${plural(targets.length)}?`,
      description: `${shown}${more}. Their reviews, wishlist entries and restock sign-ups will also be deleted; order history is kept. This cannot be undone.`,
      confirmLabel: `Delete ${plural(targets.length)}`,
      variant: "destructive",
    });
    if (!ok) return;
    setBulkBusy(true);
    try {
      const res = await fetch("/api/admin/products/bulk", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: targets.map(p => p.id) }),
      });
      const result = await res.json().catch(() => ({})) as { error?: string; deleted?: number; ids?: string[] };
      if (!res.ok) { toast.error(result.error ?? "Failed to delete products"); return; }
      const deletedIds = new Set(result.ids ?? []);
      setProducts(prev => prev.filter(row => !deletedIds.has(row.id)));
      clearSelection();
      toast.success(`${plural(result.deleted ?? deletedIds.size)} deleted`);
    } catch {
      toast.error("Failed to delete products");
    } finally {
      setBulkBusy(false);
    }
  }

  const bulkActions: BulkAction[] = [
    { key: "publish", label: "Publish", icon: Eye, onSelect: () => runBulkUpdate({ is_published: true }, "published") },
    { key: "unpublish", label: "Unpublish", icon: EyeOff, onSelect: () => runBulkUpdate({ is_published: false }, "unpublished") },
    { key: "feature", label: "Mark as featured", icon: Star, dividerBefore: true, onSelect: () => runBulkUpdate({ is_featured: true }, "marked as featured") },
    { key: "unfeature", label: "Remove from featured", icon: Star, onSelect: () => runBulkUpdate({ is_featured: false }, "removed from featured") },
    { key: "trend", label: "Mark as trending", icon: Flame, onSelect: () => runBulkUpdate({ is_trending: true }, "marked as trending") },
    { key: "untrend", label: "Remove from trending", icon: Flame, onSelect: () => runBulkUpdate({ is_trending: false }, "removed from trending") },
    { key: "on-hand", label: "Set to On Hand", icon: PackageCheck, dividerBefore: true, onSelect: () => runBulkUpdate({ status: "on-hand" }, "set to On Hand") },
    { key: "sold-out", label: "Set to Sold Out", icon: PackageX, onSelect: () => runBulkUpdate({ status: "sold-out" }, "set to Sold Out") },
    { key: "delete", label: "Delete", icon: Trash2, destructive: true, dividerBefore: true, onSelect: runBulkDelete },
  ];

  async function handleDelete(p: Row) {
    const ok = await confirmDialog({
      title: `Delete "${p.name}"?`,
      description: "This cannot be undone.",
      confirmLabel: "Delete product",
      variant: "destructive",
    });
    if (!ok) return;
    setMenuOpenId(null);
    const res = await fetch(`/api/admin/products/${p.id}`, { method: "DELETE" });
    if (res.ok) {
      setProducts(prev => prev.filter(row => row.id !== p.id));
      setSelectedIds(prev => { const next = new Set(prev); next.delete(p.id); return next; });
      toast.success("Product deleted");
    } else {
      toast.error("Failed to delete product");
    }
  }

  async function handleTogglePublish(p: Row) {
    setMenuOpenId(null);
    const next = !p.is_published;
    const fd = new FormData();
    fd.append("product", JSON.stringify({ is_published: next }));
    fd.append("sizes", JSON.stringify([]));
    const res = await fetch(`/api/admin/products/${p.id}`, { method: "PATCH", body: fd });
    if (res.ok) {
      setProducts(prev => prev.map(row => row.id === p.id ? { ...row, is_published: next } : row));
      toast.success(next ? "Product published" : "Product unpublished");
    } else {
      toast.error("Failed to update product");
    }
  }

  async function handleDuplicate(p: Row) {
    setMenuOpenId(null);
    const { id: _id, created_at: _ca, updated_at: _ua, product_sizes: _ps, slug, name, ...rest } = p as Record<string, unknown>;
    const sizes = (p.product_sizes ?? []) as { size: string; stock: number }[];
    const fd = new FormData();
    fd.append("product", JSON.stringify({
      ...rest,
      name: `${p.name} (Copy)`,
      slug: `${String(slug)}-copy-${now().toString(36)}`,
      is_published: false,
    }));
    fd.append("sizes", JSON.stringify(sizes));
    const res = await fetch("/api/admin/products", { method: "POST", body: fd });
    const result = await res.json().catch(() => ({})) as { error?: string; id?: string };
    if (!res.ok || !result.id) { toast.error(result.error ?? "Failed to duplicate product"); return; }
    toast.success("Product duplicated");
    router.push(`/admin/products/${result.id}`);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <h1 className="text-admin-hero text-ink font-display font-medium tracking-[-0.02em]">Products</h1>
        <Link href="/admin/products/new"
          className="flex items-center gap-2 bg-ink text-paper text-admin px-4 py-2 rounded-md hover:bg-ink-2 transition-colors duration-admin-fast">
          <Plus className="w-4 h-4" /> Add product
        </Link>
      </div>

      {/* Filter bar */}
      <div className="mb-5 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-3" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or brand…"
              className="w-full pl-10 pr-4 py-2.5 text-admin bg-paper border border-line rounded-md text-ink placeholder:text-ink-3 focus:outline-none focus:border-line-strong transition-colors duration-admin-fast"
            />
          </div>

          {/* Brand dropdown */}
          <div className="relative shrink-0" ref={brandRef}>
            <button type="button" onClick={() => setBrandOpen(o => !o)}
              className="w-full sm:w-auto flex items-center gap-2 px-3.5 py-2.5 text-admin-sm font-medium bg-paper border border-line rounded-md text-ink hover:border-line-strong transition-colors duration-admin-fast">
              {brandFilter === "all" ? "All brands" : brandFilter}
              <ChevronDown className={`w-3.5 h-3.5 text-ink-3 transition-transform duration-admin-fast ${brandOpen ? "rotate-180" : ""}`} />
            </button>
            {brandOpen && (
              <div className="absolute right-0 top-full mt-1 z-30 min-w-[160px] max-h-64 overflow-y-auto bg-paper border border-line rounded-md shadow-lg overflow-hidden">
                <button type="button" onClick={() => { setBrandFilter("all"); setBrandOpen(false); }}
                  className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-admin-sm text-left hover:bg-admin-row-hover transition-colors duration-admin-fast ${brandFilter === "all" ? "text-ink font-semibold" : "text-ink-2"}`}>
                  All brands
                  {brandFilter === "all" && <Check className="w-3.5 h-3.5 shrink-0" />}
                </button>
                {usedBrands.map(b => (
                  <button key={b} type="button" onClick={() => { setBrandFilter(b); setBrandOpen(false); }}
                    className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-admin-sm text-left hover:bg-admin-row-hover transition-colors duration-admin-fast ${brandFilter === b ? "text-ink font-semibold" : "text-ink-2"}`}>
                    {b}
                    {brandFilter === b && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Availability dropdown */}
          <div className="relative shrink-0" ref={availRef}>
            <button type="button" onClick={() => setAvailOpen(o => !o)}
              className="w-full sm:w-auto flex items-center gap-2 px-3.5 py-2.5 text-admin-sm font-medium bg-paper border border-line rounded-md text-ink hover:border-line-strong transition-colors duration-admin-fast">
              {availFilter === "all" ? "All availability" : availFilter === "on-hand" ? "On Hand" : "Pre-Order"}
              <ChevronDown className={`w-3.5 h-3.5 text-ink-3 transition-transform duration-admin-fast ${availOpen ? "rotate-180" : ""}`} />
            </button>
            {availOpen && (
              <div className="absolute right-0 top-full mt-1 z-30 min-w-[150px] bg-paper border border-line rounded-md shadow-lg overflow-hidden">
                {([["all", "All availability"], ["on-hand", "On Hand"], ["pre-order", "Pre-Order"]] as const).map(([v, l]) => (
                  <button key={v} type="button" onClick={() => { setAvailFilter(v); setAvailOpen(false); }}
                    className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-admin-sm text-left hover:bg-admin-row-hover transition-colors duration-admin-fast ${availFilter === v ? "text-ink font-semibold" : "text-ink-2"}`}>
                    {l}
                    {availFilter === v && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Status pills */}
        <div className="flex gap-1.5 flex-wrap">
          {([["all", "All"], ["published", "Published"], ["draft", "Draft"]] as const).map(([v, l]) => {
            const active = publishFilter === v;
            return (
              <button key={v} type="button" onClick={() => setPublishFilter(v)}
                className={`px-3 py-1.5 text-admin-sm font-medium rounded-md border transition-colors duration-admin-fast ${
                  active ? "bg-ink text-paper border-ink" : "bg-paper text-ink-2 border-line hover:border-line-strong"
                }`}>
                {l}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table / list */}
      <div className="rounded-md overflow-hidden bg-paper border border-line">
        <BulkActionsBar
          selectedCount={selectedVisible.length}
          noun="product"
          actions={bulkActions}
          onClear={clearSelection}
          busy={bulkBusy}
          busyLabel={`Processing ${plural(selectedVisible.length)}…`}
        />

        {/* Desktop table */}
        <table className="w-full hidden md:table">
          <thead>
            <tr className="bg-paper-2 border-b border-line-strong">
              <th className="pl-4 pr-1 py-3 w-8">
                <input type="checkbox" aria-label="Select all visible products"
                  checked={allVisibleSelected}
                  ref={el => { if (el) el.indeterminate = someVisibleSelected; }}
                  onChange={e => toggleSelectAll(e.target.checked)}
                  disabled={bulkBusy || sortedRows.length === 0}
                  className="w-3.5 h-3.5 cursor-pointer accent-ink" />
              </th>
              {["Image", "Name", "Brand"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-admin-eyebrow text-ink-3">{h}</th>
              ))}
              <SortableHeader label="Price" sortKey="full_payment_price" currentSortKey={sortKey} direction={sortDirection} onSort={handleSort} />
              <SortableHeader label="Stock" sortKey="stock" currentSortKey={sortKey} direction={sortDirection} onSort={handleSort} />
              <SortableHeader label="Listed" sortKey="created_at" currentSortKey={sortKey} direction={sortDirection} onSort={handleSort} />
              <th className="px-4 py-3 text-left text-admin-eyebrow text-ink-3">Status</th>
              <th className="px-3 py-3 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {sortedRows.map(p => (
              <tr key={p.id}
                className="cursor-pointer even:bg-paper-2 hover:bg-admin-row-hover transition-colors duration-admin-fast"
                onClick={() => router.push(`/admin/products/${p.id}`)}>
                <td className="pl-4 pr-1 py-3" onClick={e => e.stopPropagation()}>
                  <input type="checkbox" aria-label={`Select ${p.name}`}
                    checked={selectedIds.has(p.id)}
                    onChange={() => toggleSelect(p.id)}
                    disabled={bulkBusy}
                    className="w-3.5 h-3.5 cursor-pointer accent-ink" />
                </td>
                <td className="px-4 py-3">
                  <div className="w-10 h-10 rounded-md overflow-hidden bg-paper-2 border border-line shrink-0">
                    {Array.isArray(p.images) && p.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-ink-3">
                        <Package className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <p className="flex items-center gap-1.5 text-admin-sm font-semibold text-ink">
                    {p.name}
                    <FlagBadges p={p} />
                  </p>
                  {p.colorway ? <p className="text-admin-micro text-ink-3">{String(p.colorway)}</p> : null}
                </td>
                <td className="px-4 py-3.5 text-admin-sm text-ink-2">{p.brand}</td>
                <td className="px-4 py-3.5 text-admin-sm font-semibold text-ink">
                  ₱{Number(p.full_payment_price).toLocaleString()}
                </td>
                <td className="px-4 py-3.5 text-admin-sm text-ink-2">{totalStock(p)}</td>
                <td className="px-4 py-3.5 text-admin-sm text-ink-3">
                  {new Date(p.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                </td>
                <td className="px-4 py-3.5">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full bg-paper border border-line text-admin-eyebrow ${
                    p.is_published ? "text-state-onhand" : "text-ink-3"
                  }`}>
                    {p.is_published ? "Published" : "Draft"}
                  </span>
                </td>
                <td className="px-3 py-3.5 text-right relative" onClick={e => e.stopPropagation()}>
                  <button type="button" onClick={() => setMenuOpenId(id => id === p.id ? null : p.id)}
                    className="p-1.5 rounded-md text-ink-3 hover:bg-admin-row-hover hover:text-ink transition-colors duration-admin-fast">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {menuOpenId === p.id && (
                    <div ref={menuRef} className="absolute right-3 top-full z-30 min-w-[180px] bg-paper border border-line rounded-md shadow-lg overflow-hidden text-left">
                      <Link href={`/admin/products/${p.id}`} onClick={() => setMenuOpenId(null)}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-admin-sm text-ink hover:bg-admin-row-hover transition-colors duration-admin-fast">
                        <Pencil className="w-3.5 h-3.5 text-ink-3" /> Edit
                      </Link>
                      <button type="button" onClick={() => handleDuplicate(p)}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-admin-sm text-ink hover:bg-admin-row-hover transition-colors duration-admin-fast">
                        <Copy className="w-3.5 h-3.5 text-ink-3" /> Duplicate
                      </button>
                      <button type="button" onClick={() => handleTogglePublish(p)}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-admin-sm text-ink hover:bg-admin-row-hover transition-colors duration-admin-fast">
                        {p.is_published
                          ? <><EyeOff className="w-3.5 h-3.5 text-ink-3" /> Unpublish</>
                          : <><Eye className="w-3.5 h-3.5 text-ink-3" /> Publish</>}
                      </button>
                      <button type="button" onClick={() => handleDelete(p)}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-admin-sm text-state-error hover:bg-admin-row-hover transition-colors duration-admin-fast border-t border-line">
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-line">
          {sortedRows.length > 0 && (
            <label className="flex items-center gap-3 px-4 py-2.5 bg-paper-2 text-admin-eyebrow text-ink-3 cursor-pointer">
              <input type="checkbox"
                checked={allVisibleSelected}
                ref={el => { if (el) el.indeterminate = someVisibleSelected; }}
                onChange={e => toggleSelectAll(e.target.checked)}
                disabled={bulkBusy}
                className="w-4 h-4 cursor-pointer accent-ink" />
              Select all
            </label>
          )}
          {sortedRows.map(p => (
            <div key={p.id} className="flex items-center pl-4">
              <input type="checkbox" aria-label={`Select ${p.name}`}
                checked={selectedIds.has(p.id)}
                onChange={() => toggleSelect(p.id)}
                disabled={bulkBusy}
                className="w-4 h-4 shrink-0 cursor-pointer accent-ink" />
              <button type="button"
                className="min-w-0 flex-1 flex items-center gap-3 pl-3 pr-4 py-3.5 text-left"
                onClick={() => router.push(`/admin/products/${p.id}`)}>
                <div className="w-12 h-12 rounded-md overflow-hidden bg-paper-2 border border-line shrink-0">
                  {Array.isArray(p.images) && p.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-ink-3">
                      <Package className="w-4 h-4" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-admin-sm font-semibold text-ink">
                    <span className="truncate">{p.name}</span>
                    <FlagBadges p={p} />
                  </p>
                  <p className="text-admin-micro text-ink-3 mt-0.5 truncate">
                    {p.brand} · ₱{Number(p.full_payment_price).toLocaleString()} · {sizesSummary(p)} in stock
                  </p>
                </div>
                <span className={`shrink-0 inline-flex items-center px-2.5 py-1 rounded-full bg-paper border border-line text-admin-eyebrow ${
                  p.is_published ? "text-state-onhand" : "text-ink-3"
                }`}>
                  {p.is_published ? "Published" : "Draft"}
                </span>
              </button>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="py-16 px-6 text-center">
            <Package className="w-8 h-8 mx-auto mb-3 text-ink-3" strokeWidth={1.5} />
            <p className="text-admin-title text-ink">No products</p>
            <p className="text-admin-sm text-ink-3 mt-1.5 mb-5">
              {products.length === 0 ? "Add your first product to get started." : "No products match your filters."}
            </p>
            {products.length === 0 && (
              <Link href="/admin/products/new"
                className="inline-flex items-center gap-2 bg-ink text-paper text-admin px-4 py-2 rounded-md hover:bg-ink-2 transition-colors duration-admin-fast">
                <Plus className="w-4 h-4" /> Add product
              </Link>
            )}
          </div>
        )}
      </div>
      {dialog}
    </div>
  );
}

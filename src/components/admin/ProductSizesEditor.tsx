"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { SIZE_GRIDS, ONE_SIZE } from "@/lib/constants";
import type { ProductCategory } from "@/lib/types";

export type SizeRow = { size: string; stock: number; enabled: boolean };

export function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
      className={`relative w-9 h-5 rounded-full shrink-0 transition-colors duration-admin-fast ${checked ? "bg-ink" : "bg-line-strong"}`}>
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-paper transition-transform duration-admin-fast ${checked ? "translate-x-4" : "translate-x-0"}`} />
    </button>
  );
}

/**
 * Sneakers (US sizes) and apparel (XS–XXL) get a fixed size grid; bags/accessories start
 * as a single "One Size" row and can add custom sizes. Saved sizes outside the grid are kept.
 */
export function defaultSizeRows(category: ProductCategory, saved: { size: string; stock: number }[] = []): SizeRow[] {
  const sizes = SIZE_GRIDS[category];
  if (sizes) {
    const grid = sizes.map(s => {
      const hit = saved.find(x => x.size === s);
      return { size: s, stock: hit?.stock ?? 0, enabled: !!hit };
    });
    const extra = saved.filter(x => !sizes.includes(x.size)).map(x => ({ ...x, enabled: true }));
    return [...grid, ...extra];
  }
  return saved.length
    ? saved.map(x => ({ ...x, enabled: true }))
    : [{ size: ONE_SIZE, stock: 1, enabled: true }];
}

export default function ProductSizesEditor({
  category, rows, onChange,
}: {
  category: ProductCategory;
  rows: SizeRow[];
  onChange: (rows: SizeRow[]) => void;
}) {
  const [newSize, setNewSize] = useState("");
  const custom = !SIZE_GRIDS[category];

  const update = (size: string, patch: Partial<SizeRow>) =>
    onChange(rows.map(r => r.size === size ? { ...r, ...patch } : r));

  function addSize() {
    const s = newSize.trim();
    if (!s || rows.some(r => r.size.toLowerCase() === s.toLowerCase())) return;
    // The first real size replaces the placeholder "One Size" row.
    const base = rows.length === 1 && rows[0].size === ONE_SIZE ? [] : rows;
    onChange([...base, { size: s, stock: 1, enabled: true }]);
    setNewSize("");
  }

  const btn = "px-2.5 py-1.5 text-admin-sm font-medium rounded-md border border-line text-ink-2 hover:border-line-strong transition-colors duration-admin-fast";

  return (
    <div className="bg-paper border border-line rounded-md p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <p className="text-admin-title text-ink">{custom ? "Stock" : "Sizes & stock"}</p>
          {custom && (
            <p className="text-admin-micro text-ink-3 mt-0.5">One Size by default. Add sizes only if this item comes in sizes (e.g. S, M, L).</p>
          )}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => onChange(rows.map(r => ({ ...r, stock: 0 })))} className={btn}>Set all to 0</button>
          {!custom && (
            <button type="button" onClick={() => onChange(rows.map(r => ({ ...r, enabled: true })))} className={btn}>Enable all</button>
          )}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {rows.map(r => (
          <div key={r.size}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-md border transition-colors duration-admin-fast ${
              r.enabled ? "border-line-strong" : "border-line"
            }`}>
            <span className={`text-admin-sm font-medium min-w-14 shrink-0 ${r.enabled ? "text-ink" : "text-ink-3"}`}>{r.size}</span>
            <input type="number" min="0" value={r.stock} disabled={!r.enabled} aria-label={`Stock for ${r.size}`}
              onChange={e => update(r.size, { stock: Number(e.target.value) })}
              className="w-16 px-2 py-1.5 text-admin-sm text-center bg-paper border border-line rounded text-ink focus:outline-none focus:border-line-strong disabled:opacity-40 transition-colors duration-admin-fast" />
            <div className="ml-auto">
              {custom ? (
                rows.length > 1 && (
                  <button type="button" onClick={() => onChange(rows.filter(x => x.size !== r.size))}
                    aria-label={`Remove size ${r.size}`}
                    className="p-1 rounded text-ink-3 hover:text-state-error transition-colors duration-admin-fast">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )
              ) : (
                <Toggle checked={r.enabled}
                  onChange={() => update(r.size, { enabled: !r.enabled, stock: !r.enabled && r.stock === 0 ? 1 : r.stock })} />
              )}
            </div>
          </div>
        ))}
      </div>

      {custom && (
        <div className="flex gap-2 mt-3">
          <input value={newSize} onChange={e => setNewSize(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSize(); } }}
            placeholder="Add a size, e.g. M" maxLength={20} aria-label="New size"
            className="w-48 px-3 py-2 text-admin-sm bg-paper border border-line rounded-md text-ink placeholder:text-ink-3 focus:outline-none focus:border-line-strong" />
          <button type="button" onClick={addSize} className={btn}>Add size</button>
        </div>
      )}
    </div>
  );
}

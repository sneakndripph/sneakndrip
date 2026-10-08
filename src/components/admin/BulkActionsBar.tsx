"use client";

import { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { ChevronDown, Loader2 } from "lucide-react";

export type BulkAction = {
  key: string;
  label: string;
  icon?: LucideIcon;
  onSelect: () => void;
  destructive?: boolean;
  /** Renders a divider above this item. */
  dividerBefore?: boolean;
};

/** Sticky dark bar shown above an admin table while rows are selected. */
export default function BulkActionsBar({
  selectedCount, noun, actions, onClear, busy = false, busyLabel, menuLabel = "Actions…",
}: {
  selectedCount: number;
  /** Singular noun, e.g. "product" — pluralised with a trailing "s". */
  noun: string;
  actions: BulkAction[];
  onClear: () => void;
  busy?: boolean;
  busyLabel?: string;
  menuLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  if (selectedCount === 0) return null;

  return (
    <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-2.5 bg-ink text-paper">
      <span className="text-admin-sm font-medium flex items-center gap-2">
        {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        {busy && busyLabel ? busyLabel : `${selectedCount} ${noun}${selectedCount !== 1 ? "s" : ""} selected`}
      </span>
      <div className="flex items-center gap-2 ml-auto">
        <div className="relative" ref={ref}>
          <button type="button" disabled={busy} onClick={() => setOpen(o => !o)}
            className="flex items-center gap-1.5 text-admin-sm px-3 py-1.5 rounded-md border border-paper/30 hover:bg-paper/10 transition-colors duration-admin-fast disabled:opacity-50 disabled:cursor-not-allowed">
            {menuLabel}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-admin-fast ${open ? "rotate-180" : ""}`} />
          </button>
          {open && (
            <div className="absolute right-0 top-full mt-1 z-30 min-w-[200px] bg-paper border border-line rounded-md shadow-lg overflow-hidden">
              {actions.map(a => {
                const Icon = a.icon;
                return (
                  <button key={a.key} type="button"
                    onClick={() => { setOpen(false); a.onSelect(); }}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 text-admin-sm text-left hover:bg-admin-row-hover transition-colors duration-admin-fast ${
                      a.destructive ? "text-state-error" : "text-ink"
                    } ${a.dividerBefore ? "border-t border-line" : ""}`}>
                    {Icon && <Icon className={`w-3.5 h-3.5 ${a.destructive ? "" : "text-ink-3"}`} />}
                    {a.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <button type="button" disabled={busy} onClick={onClear}
          className="text-admin-sm px-2 py-1.5 opacity-80 hover:opacity-100 transition-opacity duration-admin-fast disabled:opacity-40 disabled:cursor-not-allowed">
          Clear
        </button>
      </div>
    </div>
  );
}

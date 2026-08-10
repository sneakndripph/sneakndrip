"use client";

import { useEffect, useRef, useState } from "react";
import { Search, ChevronDown, Calendar } from "lucide-react";
import { STATUSES, STATUS_META, type Status } from "./OrderStatusBadge";

export type Period = "all" | "today" | "7d" | "30d" | "90d";
export const PERIODS: { id: Period; label: string }[] = [
  { id: "all", label: "All Time" },
  { id: "today", label: "Today" },
  { id: "7d", label: "7 Days" },
  { id: "30d", label: "30 Days" },
  { id: "90d", label: "90 Days" },
];
export function periodStart(p: Period): Date | null {
  const now = new Date();
  if (p === "all") return null;
  if (p === "today") { const d = new Date(now); d.setHours(0, 0, 0, 0); return d; }
  const days = p === "7d" ? 7 : p === "30d" ? 30 : 90;
  return new Date(now.getTime() - days * 86400000);
}

export default function OrdersFilterBar({
  search, onSearchChange,
  statusFilter, onStatusChange, counts,
  periodFilter, onPeriodChange,
}: {
  search: string; onSearchChange: (v: string) => void;
  statusFilter: Status; onStatusChange: (s: Status) => void; counts: Record<Status, number>;
  periodFilter: Period; onPeriodChange: (p: Period) => void;
}) {
  const [periodOpen, setPeriodOpen] = useState(false);
  const periodRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (periodRef.current && !periodRef.current.contains(e.target as Node)) setPeriodOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const periodLabel = PERIODS.find(p => p.id === periodFilter)?.label ?? "All Time";

  return (
    <div className="mb-5 space-y-3">
      {/* Search + date range */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-3" />
          <input
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search by order #, customer, or product…"
            className="w-full pl-10 pr-4 py-2.5 text-admin bg-paper border border-line rounded-md text-ink placeholder:text-ink-3 focus:outline-none focus:border-line-strong transition-colors duration-admin-fast"
          />
        </div>
        <div className="relative shrink-0" ref={periodRef}>
          <button type="button" onClick={() => setPeriodOpen(o => !o)}
            className="w-full sm:w-auto flex items-center gap-2 px-3.5 py-2.5 text-admin-sm font-medium bg-paper border border-line rounded-md text-ink hover:border-line-strong transition-colors duration-admin-fast">
            <Calendar className="w-3.5 h-3.5 text-ink-3" />
            {periodLabel}
            <ChevronDown className={`w-3.5 h-3.5 text-ink-3 transition-transform duration-admin-fast ${periodOpen ? "rotate-180" : ""}`} />
          </button>
          {periodOpen && (
            <div className="absolute right-0 top-full mt-1 z-30 min-w-[160px] bg-paper border border-line rounded-md shadow-lg overflow-hidden">
              {PERIODS.map(p => (
                <button key={p.id} type="button"
                  onClick={() => { onPeriodChange(p.id); setPeriodOpen(false); }}
                  className={`w-full text-left px-3.5 py-2.5 text-admin-sm transition-colors duration-admin-fast hover:bg-admin-row-hover ${
                    periodFilter === p.id ? "text-ink font-semibold" : "text-ink-2"
                  }`}>
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {STATUSES.map(s => {
          const active = statusFilter === s;
          const meta = s !== "all" ? STATUS_META[s] : null;
          return (
            <button key={s} type="button" onClick={() => onStatusChange(s)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-admin-sm font-medium capitalize rounded-md border transition-colors duration-admin-fast ${
                active ? "bg-ink text-paper border-ink" : "bg-paper text-ink-2 border-line hover:border-line-strong"
              }`}>
              {meta && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${active ? "bg-paper" : meta.dot}`} />}
              {s.replace(/_/g, " ")}
              {counts[s] > 0 && <span className="opacity-60">({counts[s]})</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { Search, ChevronDown, Calendar, SlidersHorizontal, Check } from "lucide-react";
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

  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMounted, setSheetMounted] = useState(false);
  const [draftStatus, setDraftStatus] = useState<Status>(statusFilter);
  const [draftPeriod, setDraftPeriod] = useState<Period>(periodFilter);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (periodRef.current && !periodRef.current.contains(e.target as Node)) setPeriodOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  useEffect(() => {
    if (!sheetOpen) return;
    const t = setTimeout(() => setSheetMounted(true), 10);
    return () => clearTimeout(t);
  }, [sheetOpen]);

  useEffect(() => {
    if (!sheetOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [sheetOpen]);

  const periodLabel = PERIODS.find(p => p.id === periodFilter)?.label ?? "All Time";
  const filtersActive = statusFilter !== "all" || periodFilter !== "all";

  function openSheet() {
    setDraftStatus(statusFilter);
    setDraftPeriod(periodFilter);
    setSheetOpen(true);
  }
  function closeSheet() {
    setSheetOpen(false);
    setSheetMounted(false);
  }
  function applySheet() {
    onStatusChange(draftStatus);
    onPeriodChange(draftPeriod);
    closeSheet();
  }
  function clearSheet() {
    onStatusChange("all");
    onPeriodChange("all");
    setDraftStatus("all");
    setDraftPeriod("all");
    closeSheet();
  }

  return (
    <div className="mb-5 space-y-3">
      {/* Desktop filter bar */}
      <div className="hidden md:block space-y-3">
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

      {/* Mobile filter bar */}
      <div className="flex md:hidden gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-3" />
          <input
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search by order #, customer, or product…"
            className="w-full pl-10 pr-4 py-2.5 text-admin bg-paper border border-line rounded-md text-ink placeholder:text-ink-3 focus:outline-none focus:border-line-strong transition-colors duration-admin-fast"
          />
        </div>
        <button type="button" onClick={openSheet}
          className="relative shrink-0 bg-paper border border-line text-ink text-admin px-3 py-2 rounded-md flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {filtersActive && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-ink" />}
        </button>
      </div>

      {/* Mobile filters bottom sheet */}
      {sheetOpen && (
        <>
          <div
            className={`fixed inset-0 z-40 bg-ink/60 transition-opacity duration-admin-base ${sheetMounted ? "opacity-100" : "opacity-0"}`}
            onClick={closeSheet}
          />
          <div
            className={`fixed inset-x-0 bottom-0 z-50 bg-paper rounded-t-xl p-6 pb-8 transition-transform duration-admin-base ease-smooth ${sheetMounted ? "translate-y-0" : "translate-y-full"}`}
          >
            <div className="w-8 h-1 bg-line-strong rounded-full mx-auto mb-4" />
            <p className="text-admin-title mb-6">Filters</p>

            <p className="text-admin-eyebrow text-ink-3 mb-3">Status</p>
            <div className="space-y-1.5 mb-6">
              {STATUSES.map(s => {
                const active = draftStatus === s;
                const meta = s !== "all" ? STATUS_META[s] : null;
                return (
                  <button key={s} type="button" onClick={() => setDraftStatus(s)}
                    className={`w-full h-11 flex items-center gap-2.5 px-3.5 rounded-md border text-admin-sm font-medium capitalize transition-colors duration-admin-fast ${
                      active ? "border-ink bg-admin-row-hover text-ink" : "border-line text-ink-2"
                    }`}>
                    {meta && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${meta.dot}`} />}
                    <span className="flex-1 text-left">
                      {s.replace(/_/g, " ")}
                      {counts[s] > 0 && <span className="opacity-60"> ({counts[s]})</span>}
                    </span>
                    {active && <Check className="w-4 h-4 shrink-0" />}
                  </button>
                );
              })}
            </div>

            <p className="text-admin-eyebrow text-ink-3 mb-3">Date range</p>
            <div className="space-y-1.5 mb-6">
              {PERIODS.map(p => {
                const active = draftPeriod === p.id;
                return (
                  <button key={p.id} type="button" onClick={() => setDraftPeriod(p.id)}
                    className={`w-full h-11 flex items-center gap-2.5 px-3.5 rounded-md border text-admin-sm font-medium transition-colors duration-admin-fast ${
                      active ? "border-ink bg-admin-row-hover text-ink" : "border-line text-ink-2"
                    }`}>
                    <span className="flex-1 text-left">{p.label}</span>
                    {active && <Check className="w-4 h-4 shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2.5">
              <button type="button" onClick={clearSheet}
                className="flex-1 h-11 rounded-md border border-line text-admin-sm font-semibold text-ink-2 hover:border-line-strong transition-colors duration-admin-fast">
                Clear filters
              </button>
              <button type="button" onClick={applySheet}
                className="flex-1 h-11 rounded-md bg-ink text-paper text-admin-sm font-semibold hover:opacity-90 transition-opacity duration-admin-fast">
                Apply
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

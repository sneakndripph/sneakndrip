"use client";

import { ChevronUp, ChevronDown } from "lucide-react";
import type { SortDirection } from "@/hooks/useSortableTable";

export default function SortableHeader({
  label, sortKey, currentSortKey, direction, onSort, className = "",
}: {
  label: string;
  sortKey: string;
  currentSortKey: string | null;
  direction: SortDirection;
  onSort: (key: string) => void;
  className?: string;
}) {
  const active = currentSortKey === sortKey;
  const ariaSort = active ? (direction === "asc" ? "ascending" : "descending") : "none";
  const ascActive = active && direction === "asc";
  const descActive = active && direction === "desc";

  return (
    <th className={`px-4 py-3 text-left text-admin-eyebrow ${className}`} aria-sort={ariaSort}>
      <button
        type="button"
        role="button"
        onClick={() => onSort(sortKey)}
        className={`inline-flex items-center gap-1 cursor-pointer transition-colors duration-admin-fast hover:text-ink ${
          active ? "text-ink font-semibold" : "text-ink-3"
        }`}
      >
        {label}
        <span className="inline-flex flex-col justify-center">
          <ChevronUp className={`w-3 h-3 -mb-1 ${ascActive ? "text-ink" : "text-ink-3"}`} />
          <ChevronDown className={`w-3 h-3 ${descActive ? "text-ink" : "text-ink-3"}`} />
        </span>
      </button>
    </th>
  );
}

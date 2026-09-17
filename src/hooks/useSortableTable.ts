"use client";

import { useCallback, useMemo, useState } from "react";

export type SortDirection = "asc" | "desc";

type SortValue = string | number | Date;

export type SortAccessor<T> = (row: T) => SortValue;

export type UseSortableTableConfig<T> = {
  defaultKey?: string;
  defaultDirection?: SortDirection;
  /** Sort-key -> value getter, for aggregate/computed/nested fields that aren't a plain property of T. */
  accessors?: Record<string, SortAccessor<T>>;
};

export type UseSortableTableResult<T> = {
  sortedRows: T[];
  sortKey: string | null;
  sortDirection: SortDirection;
  handleSort: (key: string) => void;
};

/**
 * Single-column, two-state (asc/desc) sort — clicking the active column flips
 * direction, clicking a different column switches to it at ASC. There is no
 * third "unsorted" state once a column has been clicked, matching the
 * confirmed one-column-at-a-time admin table spec.
 */
export function useSortableTable<T>(
  rows: T[],
  config: UseSortableTableConfig<T> = {}
): UseSortableTableResult<T> {
  const { defaultKey = null, defaultDirection = "asc", accessors } = config;
  const [sortKey, setSortKey] = useState<string | null>(defaultKey);
  const [sortDirection, setSortDirection] = useState<SortDirection>(defaultDirection);

  const handleSort = useCallback((key: string) => {
    setSortKey(prevKey => {
      if (prevKey === key) {
        setSortDirection(prevDir => (prevDir === "asc" ? "desc" : "asc"));
        return prevKey;
      }
      setSortDirection("asc");
      return key;
    });
  }, []);

  const getValue = useCallback((row: T, key: string): SortValue => {
    const accessor = accessors?.[key];
    if (accessor) return accessor(row);
    const value = (row as Record<string, unknown>)[key];
    if (value instanceof Date) return value;
    if (typeof value === "number") return value;
    return String(value ?? "");
  }, [accessors]);

  const sortedRows = useMemo(() => {
    if (!sortKey) return rows;
    const dir = sortDirection === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const va = getValue(a, sortKey);
      const vb = getValue(b, sortKey);
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });
  }, [rows, sortKey, sortDirection, getValue]);

  return { sortedRows, sortKey, sortDirection, handleSort };
}

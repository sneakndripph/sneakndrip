"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import Fuse, { type IFuseOptions } from "fuse.js";
import { create } from "zustand";
import type { Product } from "@/lib/types";

// Shared across every useProductSearch() instance (Navbar + /shop both use
// it) so the catalog is fetched once, not once per mounted search box.
type ProductStore = {
  products: Product[];
  loadedAt: number | null;
  isLoading: boolean;
  fetchProducts: () => Promise<void>;
  invalidate: () => void;
};

const useProductStore = create<ProductStore>((set, get) => ({
  products: [],
  loadedAt: null,
  isLoading: false,
  fetchProducts: async () => {
    if (get().isLoading || get().loadedAt) return;
    set({ isLoading: true });
    try {
      const res = await fetch("/api/products");
      const data = res.ok ? (await res.json()) as { products: Product[] } : { products: [] };
      set({ products: data.products, isLoading: false, loadedAt: Date.now() });
    } catch {
      set({ isLoading: false });
    }
  },
  invalidate: () => set({ loadedAt: null }),
}));

const FUSE_OPTIONS: IFuseOptions<Product> = {
  keys: [
    { name: "name", weight: 0.4 },
    { name: "brand", weight: 0.3 },
    { name: "colorway", weight: 0.15 },
    { name: "description", weight: 0.1 },
    { name: "sku", weight: 0.05 },
  ],
  threshold: 0.4,
  ignoreLocation: true,
};

const RECOMMENDATION_COUNT = 4;

export type UseProductSearchResult = {
  query: string;
  results: Product[];
  isLoading: boolean;
  hasNoResults: boolean;
  popular: Product[];
  recent: Product[];
  search: (query: string) => void;
  clear: () => void;
};

/**
 * Client-side fuzzy product search shared by the navbar and /shop.
 * Catalog is fetched once (cached across all instances) and re-fetched when
 * the route changes, so a search opened on a later page reflects any
 * products published since the cache was first populated.
 */
export function useProductSearch(): UseProductSearchResult {
  const pathname = usePathname();
  const prevPathname = useRef(pathname);
  const { products, isLoading, fetchProducts, invalidate } = useProductStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      invalidate();
      fetchProducts();
    }
  }, [pathname, invalidate, fetchProducts]);

  const fuse = useMemo(() => new Fuse(products, FUSE_OPTIONS), [products]);

  const search = useCallback((q: string) => {
    setQuery(q);
    setResults(q.trim() ? fuse.search(q).map(r => r.item) : []);
  }, [fuse]);

  const clear = useCallback(() => {
    setQuery("");
    setResults([]);
  }, []);

  // No view_count/rating column exists on products (verified against the
  // schema) — is_featured/is_trending is the closest existing "popular" signal.
  const popular = useMemo(
    () => products.filter(p => p.is_featured || p.is_trending).slice(0, RECOMMENDATION_COUNT),
    [products],
  );

  const recent = useMemo(
    () => [...products]
      .sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())
      .slice(0, RECOMMENDATION_COUNT),
    [products],
  );

  const hasNoResults = query.trim().length > 0 && results.length === 0 && !isLoading;

  return { query, results, isLoading, hasNoResults, popular, recent, search, clear };
}

"use client";
import { useEffect, useCallback } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface RecentItem {
  id: string;
  slug: string;
  name: string;
  brand: string;
  price: number;
  images: string[];
  bg: string;
}

interface RecentStore {
  items: RecentItem[];
  track: (item: RecentItem) => void;
  clear: () => void;
}

export const useRecentlyViewedStore = create<RecentStore>()(
  persist(
    (set) => ({
      items: [],
      track: (item) =>
        set((state) => {
          const filtered = state.items.filter(i => i.id !== item.id);
          return { items: [item, ...filtered].slice(0, 10) };
        }),
      clear: () => set({ items: [] }),
    }),
    { name: "recently-viewed" }
  )
);

export function useRecentlyViewed(item?: RecentItem) {
  const track = useRecentlyViewedStore(s => s.track);

  const trackItem = useCallback((i: RecentItem) => track(i), [track]);

  useEffect(() => {
    if (item) track(item);
  }, [item?.id]);

  return { trackItem };
}

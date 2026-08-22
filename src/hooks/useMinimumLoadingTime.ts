"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Keeps `true` for at least `minMs` after `isLoading` first becomes true, so a
 * loading state that resolves almost instantly doesn't flash an empty/loaded
 * UI before the "real" content is ready to show.
 */
export function useMinimumLoadingTime(isLoading: boolean, minMs = 800): boolean {
  const [showLoading, setShowLoading] = useState(isLoading);
  const startedAt = useRef<number | null>(null);

  useEffect(() => {
    if (isLoading) {
      startedAt.current = Date.now();
      queueMicrotask(() => setShowLoading(true));
      return;
    }
    const elapsed = startedAt.current ? Date.now() - startedAt.current : minMs;
    const remaining = Math.max(0, minMs - elapsed);
    const timer = setTimeout(() => queueMicrotask(() => setShowLoading(false)), remaining);
    return () => clearTimeout(timer);
  }, [isLoading, minMs]);

  return showLoading;
}

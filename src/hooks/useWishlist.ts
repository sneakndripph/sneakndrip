"use client";
import { useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useWishlistStore } from "@/store/wishlistStore";

export function useWishlist() {
  const { items: wishlist, loaded, setItems, addItem, removeItem, reset } = useWishlistStore();
  const prevUserIdRef = useRef<string | undefined>(undefined);

  // Load once — re-runs when `loaded` flips back to false (e.g. on auth change)
  useEffect(() => {
    if (loaded) return;
    fetch("/api/wishlist")
      .then(res => res.ok ? res.json() : null)
      .then(json => setItems(json?.wishlist ?? []))
      .catch(() => setItems([]));
  }, [loaded, setItems]);

  // Auth state change → reset only on a real identity change: signing out, or
  // signing in as a different user. Supabase re-emits SIGNED_IN with the same
  // user on every tab focus (session recovery), which must NOT clear the
  // wishlist — otherwise switching tabs and back re-triggers a fetch/loading flash.
  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const userId = session?.user?.id;
      const prevUserId = prevUserIdRef.current;
      prevUserIdRef.current = userId;

      if (event === "SIGNED_OUT") {
        reset();
      } else if (event === "SIGNED_IN" && userId !== prevUserId) {
        reset();
      }
    });
    return () => subscription.unsubscribe();
  }, [reset]);

  const toggle = useCallback(async (productId: string) => {
    const isIn = wishlist.includes(productId);
    if (isIn) {
      removeItem(productId);
      await fetch("/api/wishlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
    } else {
      addItem(productId);
      await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
    }
  }, [wishlist, addItem, removeItem]);

  return { wishlist, loading: !loaded, toggle, isWishlisted: (id: string) => wishlist.includes(id) };
}

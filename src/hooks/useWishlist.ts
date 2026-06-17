"use client";
import { useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useWishlistStore } from "@/store/wishlistStore";

export function useWishlist() {
  const { items: wishlist, loaded, setItems, addItem, removeItem, reset } = useWishlistStore();

  // Load once — re-runs when `loaded` flips back to false (e.g. on auth change)
  useEffect(() => {
    if (loaded) return;
    fetch("/api/wishlist")
      .then(res => res.ok ? res.json() : null)
      .then(json => setItems(json?.wishlist ?? []))
      .catch(() => setItems([]));
  }, [loaded, setItems]);

  // Auth state change → reset only on real sign-in/sign-out (not INITIAL_SESSION or token refresh)
  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") reset();
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

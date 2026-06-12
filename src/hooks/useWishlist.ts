"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export function useWishlist() {
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch("/api/wishlist");
    if (res.ok) {
      const json = await res.json();
      setWishlist(json.wishlist ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    load();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => load());
    return () => subscription.unsubscribe();
  }, [load]);

  const toggle = useCallback(async (productId: string) => {
    const isIn = wishlist.includes(productId);
    setWishlist(prev => isIn ? prev.filter(id => id !== productId) : [...prev, productId]);

    if (isIn) {
      await fetch("/api/wishlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
    } else {
      await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
    }
  }, [wishlist]);

  return { wishlist, loading, toggle, isWishlisted: (id: string) => wishlist.includes(id) };
}

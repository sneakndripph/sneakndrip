"use client";

import { useEffect, useRef } from "react";
import { useCartStore } from "@/store/cartStore";
import { createClient } from "@/lib/supabase/client";

export default function CartSyncer() {
  const items = useCartStore(s => s.items);
  const getSubtotal = useCartStore(s => s.subtotal);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    clearTimeout(timer.current);

    if (!items.length) return;

    // Debounce: only sync 3s after the user stops changing their cart
    timer.current = setTimeout(async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) return;

      fetch("/api/cart/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart_items: items, subtotal: getSubtotal() }),
      }).catch(() => {});
    }, 3000);

    return () => clearTimeout(timer.current);
  }, [items, getSubtotal]);

  return null;
}

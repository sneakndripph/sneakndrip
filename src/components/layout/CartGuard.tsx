"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/store/cartStore";

export default function CartGuard() {
  const initForUser = useCartStore(s => s.initForUser);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      initForUser(user?.id ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      initForUser(session?.user?.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, [initForUser]);

  return null;
}

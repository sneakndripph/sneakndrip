"use client";

import { useState, useEffect } from "react";
import { BRAND } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

function buildText(data: Record<string, string>): string {
  const threshold = data.free_shipping_threshold || "5000";
  const custom = data.announcement_text?.trim();
  return (
    custom ||
    `Free Shipping on Orders ₱${Number(threshold).toLocaleString()}+  ·  100% Authentic Guaranteed  ·  GCash, Maya, Bank Transfer & COD Accepted`
  );
}

const DEFAULT_TEXT =
  "Free Shipping on Orders ₱5,000+  ·  100% Authentic Guaranteed  ·  GCash, Maya, Bank Transfer & COD Accepted";

export default function AnnouncementBar() {
  const [text, setText] = useState(DEFAULT_TEXT);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then(r => r.json())
      .then((data: Record<string, string>) => setText(buildText(data)))
      .catch(() => {});

    const supabase = createClient();
    const channel = supabase
      .channel("announcement-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "store_settings" },
        () => {
          fetch("/api/admin/settings")
            .then(r => r.json())
            .then((data: Record<string, string>) => setText(buildText(data)))
            .catch(() => {});
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div
      className="text-center py-2.5 px-4 text-xs font-semibold tracking-widest uppercase"
      style={{ background: BRAND.teal, color: "#fff" }}
    >
      {text}
    </div>
  );
}

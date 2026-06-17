"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { BRAND } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

const STORAGE_KEY = "snd-announcement-dismissed";

export default function AnnouncementBar() {
  const [text, setText] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return;

    const load = (data: Record<string, string>) => {
      const custom = data.announcement_text?.trim();
      if (custom) { setText(custom); setVisible(true); }
    };

    fetch("/api/admin/settings")
      .then(r => r.json())
      .then((data: Record<string, string>) => load(data))
      .catch(() => {});

    const supabase = createClient();
    const channel = supabase
      .channel("announcement-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "store_settings" }, () => {
        fetch("/api/admin/settings")
          .then(r => r.json())
          .then((data: Record<string, string>) => load(data))
          .catch(() => {});
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  if (!visible || !text) return null;

  return (
    <div
      className="relative flex items-center justify-center py-2.5 px-10 text-xs font-semibold tracking-widest uppercase"
      style={{ background: BRAND.teal, color: "#fff" }}
    >
      <span>{text}</span>
      <button
        onClick={() => { localStorage.setItem(STORAGE_KEY, "1"); setVisible(false); }}
        className="absolute right-3 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Dismiss announcement"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

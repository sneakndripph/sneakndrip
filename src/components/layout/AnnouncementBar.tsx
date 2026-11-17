"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
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

    fetch("/api/settings")
      .then(r => r.json())
      .then((data: Record<string, string>) => load(data))
      .catch(() => {});

    const supabase = createClient();
    const channel = supabase
      .channel("announcement-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "store_settings" }, () => {
        fetch("/api/settings")
          .then(r => r.json())
          .then((data: Record<string, string>) => load(data))
          .catch(() => {});
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  if (!visible || !text) return null;

  return (
    <div className="marquee relative overflow-hidden py-2.5 pr-10 text-eyebrow bg-ink text-paper">
      <p className="sr-only">{text}</p>
      {/* Two identical halves of 4 repeats each; the CSS loop slides one half's width. */}
      <div className="marquee-track" aria-hidden="true">
        {[0, 1].map(half => (
          <div key={half} className="flex shrink-0">
            {[0, 1, 2, 3].map(i => (
              <span key={i} className="px-12 whitespace-nowrap">{text}</span>
            ))}
          </div>
        ))}
      </div>
      <button
        onClick={() => { localStorage.setItem(STORAGE_KEY, "1"); setVisible(false); }}
        className="absolute right-0 inset-y-0 px-3 flex items-center bg-ink text-paper/70 hover:text-paper transition-colors"
        aria-label="Dismiss announcement"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

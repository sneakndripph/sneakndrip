"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

function getSessionId(): string {
  try {
    let sid = sessionStorage.getItem("snd_sid");
    if (!sid) {
      sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem("snd_sid", sid);
    }
    return sid;
  } catch { return "unknown"; }
}

export default function VisitorTracker() {
  const pathname = usePathname();
  useEffect(() => {
    try {
      const sid = getSessionId();
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: pathname, session_id: sid }),
      });
    } catch { /* ignore */ }
  }, [pathname]);
  return null;
}

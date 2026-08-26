"use client";

import { useEffect, useState } from "react";
import LoadingMonogram from "@/components/ui/LoadingMonogram";

const SESSION_KEY = "site_splash_shown";
const MIN_DISPLAY_MS = 800;
const FADE_OUT_MS = 300;

export default function SiteSplash() {
  const [visible, setVisible] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return;
    sessionStorage.setItem(SESSION_KEY, "1");
    queueMicrotask(() => {
      setVisible(true);
      setMounted(true);
    });

    const shownAt = Date.now();

    function finish() {
      const elapsed = Date.now() - shownAt;
      const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);
      setTimeout(() => {
        queueMicrotask(() => setFadingOut(true));
        setTimeout(() => queueMicrotask(() => setVisible(false)), FADE_OUT_MS);
      }, remaining);
    }

    if (document.readyState === "complete") {
      finish();
    } else {
      window.addEventListener("load", finish, { once: true });
      return () => window.removeEventListener("load", finish);
    }
  }, []);

  if (!mounted || !visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] transition-opacity"
      style={{
        opacity: fadingOut ? 0 : 1,
        transitionDuration: `${FADE_OUT_MS}ms`,
      }}
    >
      <LoadingMonogram fullScreen />
    </div>
  );
}

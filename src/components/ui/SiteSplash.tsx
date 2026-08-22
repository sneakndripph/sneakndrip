"use client";

import { useEffect, useState } from "react";

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
      role="status"
      aria-live="polite"
      aria-label="Loading site"
      className="fixed inset-0 z-[9999] bg-paper flex items-center justify-center transition-opacity"
      style={{
        opacity: fadingOut ? 0 : 1,
        transitionDuration: `${FADE_OUT_MS}ms`,
      }}
    >
      <span
        className="text-display-s text-ink font-display font-medium tracking-[-0.03em] motion-safe:animate-[splash-pulse_1.5s_ease-in-out_infinite]"
      >
        SNEAKNDRIP
      </span>
    </div>
  );
}

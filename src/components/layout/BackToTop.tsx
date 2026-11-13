"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowUp } from "lucide-react";

export default function BackToTop() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 800);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Product pages have a sticky buy bar at the bottom on mobile; checkout is a focused flow.
  if (!show || /^\/shop\/[^/]+/.test(pathname) || pathname.startsWith("/checkout")) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      className="fixed bottom-6 left-5 z-30 w-11 h-11 flex items-center justify-center rounded-full bg-ink text-paper shadow-lg hover:opacity-80 transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  );
}

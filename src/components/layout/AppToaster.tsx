"use client";

import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";

// react-hot-toast has no responsive position prop, so top-right (desktop)
// vs top-center (mobile, matches Tailwind's `sm` breakpoint) is switched by hand.
export default function AppToaster() {
  const [position, setPosition] = useState<"top-right" | "top-center">("top-right");

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const update = () => setPosition(mq.matches ? "top-center" : "top-right");
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return (
    <Toaster
      position={position}
      gutter={8}
      containerStyle={position === "top-right" ? { top: 72, right: 16 } : { top: 72 }}
      toastOptions={{
        duration: 3200,
        style: {
          background: "var(--ink)",
          color: "var(--paper)",
          fontFamily: "var(--font-body)",
          fontSize: "13px",
          lineHeight: "1.4",
          padding: "12px 16px",
          borderRadius: "6px",
          boxShadow: "0 8px 24px rgba(10, 10, 10, 0.14)",
          minWidth: "280px",
          maxWidth: "320px",
        },
        success: {
          iconTheme: { primary: "var(--state-onhand)", secondary: "var(--paper)" },
        },
        error: {
          iconTheme: { primary: "var(--state-error)", secondary: "var(--paper)" },
        },
      }}
    />
  );
}

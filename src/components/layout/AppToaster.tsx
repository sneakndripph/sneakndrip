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
        // All toasts render via toast.custom(<CustomToast />), which owns its
        // own background/shadow/radius/icon — this default is a fallback only.
        duration: 3200,
      }}
    />
  );
}

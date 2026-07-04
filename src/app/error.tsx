"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      style={{ background: "#F2F0EF", minHeight: "100vh" }}
      className="flex flex-col items-center justify-center px-6 text-center"
    >
      <p
        className="font-black tracking-tight mb-2"
        style={{
          fontFamily: "var(--font-barlow), sans-serif",
          fontSize: "clamp(6rem, 20vw, 12rem)",
          lineHeight: 1,
          color: "#0D0D0D",
          opacity: 0.08,
        }}
      >
        500
      </p>
      <h1
        className="font-black uppercase tracking-tight mb-3"
        style={{
          fontFamily: "var(--font-barlow), sans-serif",
          fontSize: "clamp(1.5rem, 5vw, 2.5rem)",
          color: "#0D0D0D",
          marginTop: "-2rem",
        }}
      >
        Something Went Wrong
      </h1>
      <p style={{ color: "#8A8580", maxWidth: 360, marginBottom: "2rem", fontSize: "0.95rem" }}>
        An unexpected error occurred. Our team has been notified.
      </p>
      <div className="flex gap-3 flex-wrap justify-center">
        <button
          onClick={reset}
          className="px-6 py-3 font-bold uppercase tracking-wide text-sm rounded-lg transition-opacity hover:opacity-80"
          style={{
            background: "#0D0D0D",
            color: "#F2F0EF",
            fontFamily: "var(--font-barlow), sans-serif",
          }}
        >
          Try Again
        </button>
        <Link
          href="/"
          className="px-6 py-3 font-bold uppercase tracking-wide text-sm rounded-lg transition-opacity hover:opacity-80"
          style={{
            background: "transparent",
            color: "#0D0D0D",
            border: "1.5px solid rgba(13,13,13,0.2)",
            fontFamily: "var(--font-barlow), sans-serif",
          }}
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}

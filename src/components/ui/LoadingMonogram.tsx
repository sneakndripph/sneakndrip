"use client";

export default function LoadingMonogram({ fullScreen = false }: { fullScreen?: boolean }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading"
      className={
        fullScreen
          ? "fixed inset-0 z-[9999] bg-paper flex flex-col items-center justify-center gap-6"
          : "flex flex-col items-center justify-center gap-6 bg-paper"
      }
    >
      <div className="w-16 h-16 border-2 border-ink flex items-center justify-center motion-safe:animate-[monogram-rotate_2s_linear_infinite]">
        <span className="text-2xl font-semibold text-ink">SD</span>
      </div>
      <span className="text-sm font-normal tracking-[0.15em] uppercase text-ink-3">
        Sneak N&apos; Drip
      </span>
    </div>
  );
}

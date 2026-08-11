"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Check, ChevronDown, Minus } from "lucide-react";

type Preset = "today" | "7d" | "30d" | "custom";

const PRESET_LABELS: Record<Preset, string> = {
  today: "Today", "7d": "7 Days", "30d": "30 Days", custom: "Custom",
};

function rangeFor(preset: Preset): { from: Date; to: Date } | null {
  const now = new Date();
  if (preset === "today") { const d = new Date(now); d.setHours(0, 0, 0, 0); return { from: d, to: now }; }
  if (preset === "7d")  return { from: new Date(now.getTime() - 7 * 86400000), to: now };
  if (preset === "30d") return { from: new Date(now.getTime() - 30 * 86400000), to: now };
  return null;
}

async function fetchCount(from: Date, to: Date): Promise<number> {
  const res = await fetch(`/api/admin/dashboard/visitors?from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`);
  if (!res.ok) return 0;
  const json = await res.json() as { count?: number };
  return json.count ?? 0;
}

export default function DashboardVisitorsCard({ initialToday, initialYesterday }: { initialToday: number; initialYesterday: number }) {
  const [preset, setPreset] = useState<Preset>("today");
  const [open, setOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [count, setCount] = useState(initialToday);
  const [prevCount, setPrevCount] = useState(initialYesterday);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  async function applyRange(from: Date, to: Date) {
    setLoading(true);
    try {
      const duration = to.getTime() - from.getTime();
      const prevFrom = new Date(from.getTime() - duration);
      const [c, pc] = await Promise.all([fetchCount(from, to), fetchCount(prevFrom, from)]);
      setCount(c);
      setPrevCount(pc);
    } finally {
      setLoading(false);
    }
  }

  function selectPreset(p: Preset) {
    setPreset(p);
    if (p === "custom") return;
    setOpen(false);
    const range = rangeFor(p);
    if (range) void applyRange(range.from, range.to);
  }

  function applyCustom() {
    if (!customFrom || !customTo) return;
    setOpen(false);
    void applyRange(new Date(customFrom), new Date(customTo + "T23:59:59"));
  }

  const deltaPct = prevCount > 0 ? ((count - prevCount) / prevCount) * 100 : (count > 0 ? 100 : 0);
  const positive = deltaPct > 0;
  const negative = deltaPct < 0;
  const DeltaIcon = positive ? ArrowUp : negative ? ArrowDown : Minus;
  const deltaColor = positive ? "text-state-onhand" : negative ? "text-state-error" : "text-ink-3";

  return (
    <div className="bg-paper border border-line rounded-md p-5">
      <div className="flex items-start justify-between mb-2 gap-2">
        <p className="text-admin-eyebrow text-ink-3">Visitors</p>
        <div className="relative shrink-0" ref={ref}>
          <button
            type="button"
            onClick={() => setOpen(o => !o)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-admin-micro font-medium bg-paper border border-line rounded text-ink-2 hover:border-line-strong transition-colors duration-admin-fast"
          >
            {PRESET_LABELS[preset]}
            <ChevronDown className={`w-3 h-3 transition-transform duration-admin-fast ${open ? "rotate-180" : ""}`} />
          </button>
          {open && (
            <div className="absolute right-0 top-full mt-1 z-30 min-w-[140px] bg-paper border border-line rounded-md shadow-lg overflow-hidden">
              {(Object.keys(PRESET_LABELS) as Preset[]).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => selectPreset(p)}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-admin-sm text-left hover:bg-admin-row-hover transition-colors duration-admin-fast ${
                    preset === p ? "text-ink font-medium" : "text-ink-2"
                  }`}
                >
                  {PRESET_LABELS[p]}
                  {preset === p && <Check className="w-3.5 h-3.5 shrink-0" />}
                </button>
              ))}
              {preset === "custom" && (
                <div className="p-2 border-t border-line space-y-1.5">
                  <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                    className="w-full px-2 py-1.5 text-admin-sm bg-paper border border-line rounded text-ink focus:outline-none focus:border-line-strong" />
                  <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                    className="w-full px-2 py-1.5 text-admin-sm bg-paper border border-line rounded text-ink focus:outline-none focus:border-line-strong" />
                  <button type="button" onClick={applyCustom} disabled={!customFrom || !customTo || loading}
                    className="w-full py-1.5 text-admin-sm font-medium rounded bg-ink text-paper disabled:opacity-40 hover:opacity-90 transition-opacity duration-admin-fast">
                    Apply
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <p className="text-admin-hero text-ink font-display leading-none tracking-[-0.02em]">
        {loading ? "…" : count.toLocaleString()}
      </p>
      <p className={`text-admin-micro mt-2 flex items-center gap-1 ${deltaColor}`}>
        <DeltaIcon className="w-3 h-3" />
        {Math.abs(deltaPct).toFixed(0)}% vs previous period
      </p>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { BRAND, FONTS } from "@/lib/constants";
import { Eye } from "lucide-react";

const PRESETS = [
  { label: "Today",   getValue: () => { const d = new Date(); d.setHours(0,0,0,0); return { from: d.toISOString(), to: new Date().toISOString() }; } },
  { label: "7 Days",  getValue: () => ({ from: new Date(Date.now() - 7*86400000).toISOString(), to: new Date().toISOString() }) },
  { label: "30 Days", getValue: () => ({ from: new Date(Date.now() - 30*86400000).toISOString(), to: new Date().toISOString() }) },
  { label: "Custom",  getValue: () => null },
] as const;

type Preset = typeof PRESETS[number]["label"];

export default function DashboardVisitorsCard({ initialToday, initialWeek }: { initialToday: number; initialWeek: number }) {
  const [preset, setPreset] = useState<Preset>("Today");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [count, setCount] = useState(initialToday);
  const [loading, setLoading] = useState(false);

  async function fetchCount(from: string, to: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/dashboard/visitors?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
      if (res.ok) {
        const { count: c } = await res.json();
        setCount(c);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (preset === "Custom") return;
    const p = PRESETS.find(p => p.label === preset);
    const range = p?.getValue();
    if (range) fetchCount(range.from, range.to);
    else if (preset === "Today") setCount(initialToday);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset]);

  function handleCustomFetch() {
    if (!customFrom || !customTo) return;
    fetchCount(new Date(customFrom).toISOString(), new Date(customTo + "T23:59:59").toISOString());
  }

  const subLabel = preset === "Today" ? `${initialWeek} this week`
    : preset === "7 Days" ? "unique last 7 days"
    : preset === "30 Days" ? "unique last 30 days"
    : "custom range";

  return (
    <div className="p-5 rounded-xl" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(99,102,241,0.1)" }}>
          <Eye className="w-5 h-5" style={{ color: "#6366F1" }} />
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ background: `${BRAND.teal}12`, color: BRAND.teal }}>{subLabel}</span>
      </div>
      <p style={{ fontFamily: FONTS.display, fontSize: "2rem", color: BRAND.black, letterSpacing: "0.03em", lineHeight: 1 }}>
        {loading ? "…" : count.toLocaleString()}
      </p>
      <p className="text-xs mt-1 mb-3 uppercase tracking-widest font-semibold" style={{ color: BRAND.muted }}>Visitors</p>

      {/* Preset tabs */}
      <div className="flex gap-1 flex-wrap">
        {PRESETS.map(p => (
          <button key={p.label} onClick={() => setPreset(p.label)}
            className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide transition-all"
            style={{
              background: preset === p.label ? "#6366F1" : "transparent",
              color: preset === p.label ? "#fff" : BRAND.muted,
              border: `1px solid ${preset === p.label ? "#6366F1" : BRAND.border}`,
            }}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Custom date range */}
      {preset === "Custom" && (
        <div className="mt-3 space-y-2">
          <div className="flex gap-1.5">
            <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
              className="flex-1 px-2 py-1.5 text-xs focus:outline-none"
              style={{ background: BRAND.bg, border: `1px solid ${BRAND.border}`, color: BRAND.black }} />
            <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
              className="flex-1 px-2 py-1.5 text-xs focus:outline-none"
              style={{ background: BRAND.bg, border: `1px solid ${BRAND.border}`, color: BRAND.black }} />
          </div>
          <button onClick={handleCustomFetch} disabled={!customFrom || !customTo || loading}
            className="w-full py-1.5 text-[10px] font-black uppercase tracking-wide disabled:opacity-40 transition-opacity hover:opacity-80"
            style={{ background: "#6366F1", color: "#fff" }}>
            {loading ? "Loading…" : "Search"}
          </button>
        </div>
      )}
    </div>
  );
}

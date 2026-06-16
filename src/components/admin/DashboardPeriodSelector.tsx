"use client";

import { BRAND, FONTS } from "@/lib/constants";

const PERIODS = [
  { value: "today", label: "Today" },
  { value: "week",  label: "7 Days" },
  { value: "month", label: "30 Days" },
  { value: "year",  label: "Year" },
];

export default function DashboardPeriodSelector({ current, onChange }: { current: string; onChange: (period: string) => void }) {
  return (
    <div className="flex gap-1 p-1 rounded-lg" style={{ background: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
      {PERIODS.map(p => (
        <button key={p.value} onClick={() => onChange(p.value)}
          className="px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide transition-all"
          style={{
            background: current === p.value ? BRAND.black : "transparent",
            color: current === p.value ? BRAND.bg : BRAND.muted,
            fontFamily: FONTS.body,
          }}>
          {p.label}
        </button>
      ))}
    </div>
  );
}

"use client";

import { usePathname, useRouter } from "next/navigation";

const PERIODS = [
  { key: "today", label: "Today" },
  { key: "week",  label: "7D" },
  { key: "month", label: "30D" },
  { key: "year",  label: "Year" },
];

export default function DashboardPeriodSelector({ active }: { active: string }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="inline-flex bg-paper-2 rounded-md p-1">
      {PERIODS.map(p => (
        <button
          key={p.key}
          type="button"
          onClick={() => router.push(`${pathname}?period=${p.key}`)}
          className={`text-admin-sm px-3 py-1.5 rounded transition-colors duration-admin-fast ${
            active === p.key ? "bg-paper text-ink font-medium" : "text-ink-3 hover:text-ink"
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

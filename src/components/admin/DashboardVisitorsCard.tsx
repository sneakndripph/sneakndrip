import { ArrowDown, ArrowUp, Minus } from "lucide-react";

export default function DashboardVisitorsCard({ current, previous }: { current: number; previous: number }) {
  const deltaPct = previous > 0 ? ((current - previous) / previous) * 100 : (current > 0 ? 100 : 0);
  const positive = deltaPct > 0;
  const negative = deltaPct < 0;
  const DeltaIcon = positive ? ArrowUp : negative ? ArrowDown : Minus;
  const deltaColor = positive ? "text-state-onhand" : negative ? "text-state-error" : "text-ink-3";

  return (
    <div className="bg-paper border border-line rounded-md p-5">
      <p className="text-admin-eyebrow text-ink-3 mb-2">Visitors</p>
      <p className="text-admin-hero text-ink font-display leading-none tracking-[-0.02em]">
        {current.toLocaleString()}
      </p>
      <p className={`text-admin-micro mt-2 flex items-center gap-1 ${deltaColor}`}>
        <DeltaIcon className="w-3 h-3" />
        {Math.abs(deltaPct).toFixed(0)}% vs previous period
      </p>
    </div>
  );
}

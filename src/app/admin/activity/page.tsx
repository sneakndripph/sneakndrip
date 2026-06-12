"use client";

import { useState, useEffect, useMemo } from "react";
import { BRAND, FONTS } from "@/lib/constants";
import { Activity, Search } from "lucide-react";

type LogEntry = {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_name: string | null;
  actor_email: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
};

const ACTION_COLORS: Record<string, string> = {
  status_updated:  "#5BB8B4",
  order_cancelled: "#D94F3D",
  product_created: "#10B981",
  product_updated: "#F59E0B",
  product_deleted: "#D94F3D",
  role_updated:    "#8B5CF6",
  coupon_created:  "#10B981",
  coupon_deleted:  "#D94F3D",
  settings_saved:  "#5BB8B4",
};

function ActionBadge({ action }: { action: string }) {
  const color = ACTION_COLORS[action] ?? "#8A8580";
  const label = action.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap"
      style={{ background: `${color}18`, color }}>
      {label}
    </span>
  );
}

function DetailsPanel({ details }: { details: Record<string, unknown> | null }) {
  if (!details || Object.keys(details).length === 0) return <span style={{ color: BRAND.mutedLight }}>—</span>;
  return (
    <span className="text-xs" style={{ color: BRAND.muted }}>
      {Object.entries(details).map(([k, v]) => `${k}: ${String(v)}`).join(" · ")}
    </span>
  );
}

export default function AdminActivityPage() {
  const [log, setLog] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/activity")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setLog(data);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search) return log;
    const q = search.toLowerCase();
    return log.filter(e =>
      e.action.toLowerCase().includes(q) ||
      (e.entity_name ?? "").toLowerCase().includes(q) ||
      (e.entity_type ?? "").toLowerCase().includes(q) ||
      (e.actor_email ?? "").toLowerCase().includes(q)
    );
  }, [log, search]);

  return (
    <div style={{ fontFamily: FONTS.body }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: BRAND.teal }}>Admin</p>
          <h1 style={{ fontFamily: FONTS.display, fontSize: "2.5rem", letterSpacing: "0.04em", color: BRAND.black }}>ACTIVITY LOG</h1>
        </div>
        <div className="text-right">
          <p style={{ fontFamily: FONTS.display, fontSize: "1.5rem", color: BRAND.black }}>{log.length}</p>
          <p className="text-xs" style={{ color: BRAND.muted }}>Total entries</p>
        </div>
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: BRAND.muted }} />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by action, entity, or admin email…"
          className="w-full pl-11 pr-4 py-3 text-sm focus:outline-none"
          style={{ background: BRAND.card, border: `1px solid ${BRAND.border}`, color: BRAND.black }} />
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
        {loading ? (
          <div className="py-12 text-center text-sm" style={{ color: BRAND.muted }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Activity className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: BRAND.black }} />
            <p style={{ fontFamily: FONTS.display, fontSize: "1.3rem", color: BRAND.muted }}>
              {log.length === 0 ? "NO ACTIVITY YET" : "NO RESULTS"}
            </p>
            <p className="text-sm mt-1" style={{ color: BRAND.mutedLight }}>
              {log.length === 0
                ? "Admin actions (order updates, product edits, etc.) will be logged here."
                : "Try a different search."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: "rgba(13,13,13,0.02)", borderBottom: `1px solid ${BRAND.border}` }}>
                  {["Time", "Action", "Entity", "Details", "Admin"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest whitespace-nowrap"
                      style={{ color: BRAND.muted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(e => (
                  <tr key={e.id} style={{ borderBottom: `1px solid ${BRAND.border}` }}>
                    <td className="px-4 py-3.5 text-xs whitespace-nowrap" style={{ color: BRAND.muted }}>
                      {new Date(e.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                      {" "}
                      <span className="opacity-60">
                        {new Date(e.created_at).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <ActionBadge action={e.action} />
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-xs font-semibold" style={{ color: BRAND.black }}>{e.entity_name ?? e.entity_id ?? "—"}</p>
                      <p className="text-[10px]" style={{ color: BRAND.muted }}>{e.entity_type}</p>
                    </td>
                    <td className="px-4 py-3.5 max-w-[240px]">
                      <DetailsPanel details={e.details} />
                    </td>
                    <td className="px-4 py-3.5 text-xs max-w-[160px] truncate" style={{ color: BRAND.muted }}>
                      {e.actor_email ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

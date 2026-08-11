"use client";

import { useState, useEffect, useMemo } from "react";
import { Activity, Search, ChevronLeft, ChevronRight } from "lucide-react";

type LogEntry = {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_name: string | null;
  actor_email: string | null;
  details: Record<string, unknown> | null;
  ip_address?: string | null;
  created_at: string;
};

type ActionCategory = "Create" | "Update" | "Delete" | "Login" | "Other";

function categorize(action: string): ActionCategory {
  const a = action.toLowerCase();
  if (a.includes("delet") || a.includes("reject") || a.includes("cancel")) return "Delete";
  if (a.includes("creat")) return "Create";
  if (a.includes("login") || a.includes("sign_in")) return "Login";
  if (a.includes("updat") || a.includes("approv") || a.includes("ban") || a.includes("saved") || a.includes("status")) return "Update";
  return "Other";
}

const CATEGORY_CLS: Record<ActionCategory, string> = {
  Create: "text-state-onhand bg-state-onhand/10",
  Update: "text-ink-2 bg-paper-2",
  Delete: "text-state-error bg-state-error/10",
  Login:  "text-state-preorder bg-state-preorder/10",
  Other:  "text-ink-3 bg-paper-2",
};

function ActionBadge({ action }: { action: string }) {
  const category = categorize(action);
  return (
    <span className={`inline-block text-admin-micro font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${CATEGORY_CLS[category]}`}>
      {category}
    </span>
  );
}

function humanize(action: string) {
  return action.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function Description({ entry }: { entry: LogEntry }) {
  const detailsStr = entry.details && Object.keys(entry.details).length > 0
    ? Object.entries(entry.details).map(([k, v]) => `${k}: ${String(v)}`).join(" · ")
    : null;
  return (
    <div>
      <p className="text-admin-sm text-ink">
        {humanize(entry.action)}
        {(entry.entity_name || entry.entity_id) && (
          <span className="text-ink-3"> — {entry.entity_name ?? entry.entity_id} ({entry.entity_type})</span>
        )}
      </p>
      {detailsStr && <p className="text-admin-micro text-ink-3 mt-0.5">{detailsStr}</p>}
    </div>
  );
}

const PAGE_SIZE = 25;

export default function AdminActivityPage() {
  const [log, setLog] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetch("/api/admin/activity")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setLog(data);
        } else if (data && typeof data === "object" && "error" in data) {
          setFetchError(String((data as { error: string }).error));
        }
      })
      .catch(() => setFetchError("Failed to load activity log."))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    log.forEach(e => set.add(categorize(e.action)));
    return Array.from(set).sort();
  }, [log]);

  const filtered = useMemo(() => {
    let rows = log;
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(e =>
        e.action.toLowerCase().includes(q) ||
        (e.entity_name ?? "").toLowerCase().includes(q) ||
        (e.entity_type ?? "").toLowerCase().includes(q) ||
        (e.actor_email ?? "").toLowerCase().includes(q)
      );
    }
    if (actionFilter !== "all") {
      rows = rows.filter(e => categorize(e.action) === actionFilter);
    }
    if (dateFrom) {
      const from = new Date(dateFrom).getTime();
      rows = rows.filter(e => new Date(e.created_at).getTime() >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo).getTime() + 86400000;
      rows = rows.filter(e => new Date(e.created_at).getTime() < to);
    }
    return rows;
  }, [log, search, actionFilter, dateFrom, dateTo]);

  useEffect(() => { setPage(1); }, [search, actionFilter, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <p className="text-admin-eyebrow text-ink-3 mb-1">Admin</p>
          <h1 className="text-admin-hero text-ink font-display font-medium tracking-[-0.02em]">Activity log</h1>
        </div>
        <div className="text-right">
          <p className="text-admin-title text-ink">{log.length}</p>
          <p className="text-admin-micro text-ink-3">Total entries</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2.5 mb-5">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-3" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by action, entity, or admin email…"
            className="w-full pl-9 pr-3.5 py-2.5 text-admin bg-paper border border-line rounded-md text-ink placeholder:text-ink-3 focus:outline-none focus:border-line-strong transition-colors duration-admin-fast" />
        </div>
        <select value={actionFilter} onChange={e => setActionFilter(e.target.value)}
          className="px-3.5 py-2.5 text-admin-sm bg-paper border border-line rounded-md text-ink focus:outline-none focus:border-line-strong transition-colors duration-admin-fast">
          <option value="all">All actions</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          className="px-3.5 py-2.5 text-admin-sm bg-paper border border-line rounded-md text-ink focus:outline-none focus:border-line-strong transition-colors duration-admin-fast" />
        <span className="text-admin-sm text-ink-3">to</span>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          className="px-3.5 py-2.5 text-admin-sm bg-paper border border-line rounded-md text-ink focus:outline-none focus:border-line-strong transition-colors duration-admin-fast" />
      </div>

      <div className="bg-paper border border-line rounded-md overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-admin-sm text-ink-3">Loading…</div>
        ) : fetchError ? (
          <div className="py-12 text-center">
            <p className="text-admin-title text-state-error">Error</p>
            <p className="text-admin-sm text-ink-3 mt-1">{fetchError}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Activity className="w-9 h-9 mx-auto mb-3 text-ink-3" />
            <p className="text-admin-title text-ink">
              {log.length === 0 ? "No activity yet" : "No results"}
            </p>
            <p className="text-admin-sm text-ink-3 mt-1">
              {log.length === 0
                ? "Admin actions (order updates, product edits, etc.) will be logged here."
                : "Try a different search or filter."}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-admin-sm">
                <thead>
                  <tr className="border-b border-line bg-paper-2">
                    {["Time", "User", "Action", "Description", "IP Address"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-admin-eyebrow text-ink-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map(e => (
                    <tr key={e.id} className="border-b border-line last:border-b-0 hover:bg-admin-row-hover transition-colors duration-admin-fast">
                      <td className="px-4 py-3.5 text-admin-micro text-ink-3 whitespace-nowrap">
                        {new Date(e.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                        {" "}
                        <span className="opacity-70">
                          {new Date(e.created_at).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-admin-sm text-ink-2 max-w-[160px] truncate">
                        {e.actor_email ?? "—"}
                      </td>
                      <td className="px-4 py-3.5">
                        <ActionBadge action={e.action} />
                      </td>
                      <td className="px-4 py-3.5 max-w-[320px]">
                        <Description entry={e} />
                      </td>
                      <td className="px-4 py-3.5 text-admin-micro text-ink-3 whitespace-nowrap">
                        {e.ip_address ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-line">
              <p className="text-admin-micro text-ink-3">
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-1.5 rounded border border-line text-ink-2 disabled:opacity-30 disabled:cursor-not-allowed hover:border-line-strong transition-colors duration-admin-fast">
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-admin-sm text-ink-2 px-2">{page} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="p-1.5 rounded border border-line text-ink-2 disabled:opacity-30 disabled:cursor-not-allowed hover:border-line-strong transition-colors duration-admin-fast">
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

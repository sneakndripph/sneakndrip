"use client";

import { useEffect, useState } from "react";
import { History } from "lucide-react";
import { statusMeta } from "./OrderStatusBadge";

type ActivityEntry = {
  id: string;
  action: string;
  actor_email: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
};

type TimelineEvent = {
  id: string;
  title: string;
  description: string | null;
  actor: string | null;
  created_at: string;
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  gcash: "GCash", maya: "Maya", bank_transfer: "Bank Transfer", cod: "COD",
};

function relativeTime(iso: string) {
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} minute${min !== 1 ? "s" : ""} ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hour${hr !== 1 ? "s" : ""} ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day} day${day !== 1 ? "s" : ""} ago`;
  const month = Math.floor(day / 30);
  if (month < 12) return `${month} month${month !== 1 ? "s" : ""} ago`;
  const year = Math.floor(month / 12);
  return `${year} year${year !== 1 ? "s" : ""} ago`;
}

function exactTime(iso: string) {
  return new Date(iso).toLocaleString("en-PH", {
    month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
  });
}

function eventFromEntry(entry: ActivityEntry): TimelineEvent {
  const details = entry.details ?? {};

  if (entry.action === "status_updated") {
    const from = typeof details.from === "string" ? statusMeta(details.from).label : null;
    const to = typeof details.to === "string" ? statusMeta(details.to).label : null;
    return {
      id: entry.id,
      title: to ? `Status changed to ${to}` : "Status updated",
      description: from && to ? `Changed from ${from} to ${to}` : null,
      actor: entry.actor_email,
      created_at: entry.created_at,
    };
  }

  if (entry.action === "balance_payment_submitted") {
    const amount = typeof details.balance === "number" ? `₱${Number(details.balance).toLocaleString()}` : null;
    const rawMethod = typeof details.payment_method === "string" ? details.payment_method : null;
    const method = rawMethod ? (PAYMENT_METHOD_LABELS[rawMethod] ?? rawMethod) : null;
    return {
      id: entry.id,
      title: "Balance payment submitted",
      description: [amount, method ? `via ${method}` : null].filter(Boolean).join(" ") || null,
      actor: entry.actor_email,
      created_at: entry.created_at,
    };
  }

  return {
    id: entry.id,
    title: entry.action.replace(/_/g, " "),
    description: null,
    actor: entry.actor_email,
    created_at: entry.created_at,
  };
}

export default function OrderStatusTimeline({
  orderId, orderNumber, createdAt, customerEmail,
}: {
  orderId: string; orderNumber: string; createdAt: string; customerEmail: string;
}) {
  const [entries, setEntries] = useState<ActivityEntry[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setEntries(null);
    setError(false);
    fetch(`/api/admin/orders/${orderId}/history`)
      .then(res => { if (!res.ok) throw new Error("Failed to load"); return res.json(); })
      .then((data: ActivityEntry[]) => { if (!cancelled) setEntries(data); })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [orderId]);

  const events: TimelineEvent[] = [
    { id: "created", title: "Order placed", description: `Order ${orderNumber} was created`, actor: customerEmail, created_at: createdAt },
    ...(entries ?? []).map(eventFromEntry),
  ];

  return (
    <div className="px-5 py-4">
      <div className="flex items-center gap-2 mb-3">
        <History className="w-3.5 h-3.5 text-ink-3" />
        <p className="text-admin-eyebrow text-ink-3">Order Timeline</p>
      </div>

      {entries === null && !error && (
        <p className="text-admin-sm text-ink-3">Loading timeline…</p>
      )}
      {error && (
        <p className="text-admin-sm text-state-error">Couldn&apos;t load timeline.</p>
      )}
      {entries !== null && !error && events.length === 0 && (
        <p className="text-admin-sm text-ink-3">No timeline events recorded.</p>
      )}

      {entries !== null && !error && events.length > 0 && (
        <div>
          {events.map((e, i) => (
            <div key={e.id} className="flex gap-3">
              <div className="flex flex-col items-center shrink-0">
                <span className="w-2 h-2 rounded-full bg-ink mt-1.5 shrink-0" />
                {i < events.length - 1 && <span className="w-px flex-1 bg-line-strong my-1" />}
              </div>
              <div className={`min-w-0 ${i < events.length - 1 ? "pb-4" : ""}`}>
                <p className="text-admin-sm font-semibold text-ink">{e.title}</p>
                {e.description && <p className="text-admin-sm text-ink-2 mt-0.5">{e.description}</p>}
                <p className="text-admin-micro text-ink-3 mt-1">
                  {relativeTime(e.created_at)} · {exactTime(e.created_at)}
                  {e.actor && ` · ${e.actor}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

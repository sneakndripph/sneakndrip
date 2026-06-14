"use client";

import { useState, useEffect } from "react";
import { BRAND, FONTS } from "@/lib/constants";
import { RefreshCw, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp } from "lucide-react";

type ReturnRequest = {
  id: string;
  order_number: string;
  customer_email: string;
  customer_name: string;
  reason: string;
  status: "pending" | "approved" | "denied";
  admin_note: string | null;
  created_at: string;
};

const STATUS_COLORS: Record<string, string> = {
  pending: "#D97706",
  approved: "#10B981",
  denied: BRAND.red,
};

export default function AdminReturnsPage() {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/returns");
    if (res.ok) {
      const { returns: r } = await res.json();
      setReturns(r);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleAction(id: string, status: "approved" | "denied") {
    setProcessing(id);
    const res = await fetch("/api/admin/returns", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, admin_note: noteInputs[id]?.trim() || null }),
    });
    if (res.ok) {
      setReturns(prev => prev.map(r => r.id === id ? { ...r, status, admin_note: noteInputs[id]?.trim() || null } : r));
      setExpanded(null);
    }
    setProcessing(null);
  }

  const pending = returns.filter(r => r.status === "pending");
  const resolved = returns.filter(r => r.status !== "pending");

  return (
    <div style={{ fontFamily: FONTS.body }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: BRAND.teal }}>Management</p>
          <h1 style={{ fontFamily: FONTS.display, fontSize: "2.5rem", letterSpacing: "0.04em", color: BRAND.black }}>RETURNS</h1>
          <p className="text-sm mt-1" style={{ color: BRAND.muted }}>{pending.length} pending · {resolved.length} resolved</p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold transition-opacity hover:opacity-70 disabled:opacity-40"
          style={{ border: `1px solid ${BRAND.border}`, color: BRAND.muted }}>
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {loading && returns.length === 0 ? (
        <div className="py-24 text-center text-sm" style={{ color: BRAND.muted }}>Loading…</div>
      ) : returns.length === 0 ? (
        <div className="rounded-xl py-24 text-center" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
          <p style={{ fontFamily: FONTS.display, fontSize: "1.5rem", color: BRAND.muted, letterSpacing: "0.04em" }}>NO RETURN REQUESTS</p>
          <p className="text-sm mt-2" style={{ color: BRAND.mutedLight }}>Return requests from customers will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {returns.map(r => {
            const isExpanded = expanded === r.id;
            const isPending = r.status === "pending";
            return (
              <div key={r.id} className="rounded-xl overflow-hidden"
                style={{ background: BRAND.card, border: `1px solid ${isPending ? BRAND.border : `${STATUS_COLORS[r.status]}30`}` }}>
                <button
                  className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors hover:bg-black/[0.02]"
                  onClick={() => setExpanded(isExpanded ? null : r.id)}>
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full shrink-0"
                      style={{ background: `${STATUS_COLORS[r.status]}15`, color: STATUS_COLORS[r.status] }}>
                      {r.status}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate" style={{ color: BRAND.black }}>{r.order_number}</p>
                      <p className="text-xs truncate" style={{ color: BRAND.muted }}>{r.customer_name} · {r.customer_email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <span className="text-xs hidden sm:block" style={{ color: BRAND.muted }}>
                      {new Date(r.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" style={{ color: BRAND.muted }} /> : <ChevronDown className="w-4 h-4" style={{ color: BRAND.muted }} />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 space-y-4" style={{ borderTop: `1px solid ${BRAND.border}` }}>
                    <div className="pt-4">
                      <p className="text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.muted }}>Customer&apos;s Reason</p>
                      <p className="text-sm" style={{ color: BRAND.black }}>{r.reason}</p>
                    </div>

                    {r.admin_note && (
                      <div className="p-3 rounded-lg" style={{ background: `${BRAND.teal}10`, border: `1px solid ${BRAND.teal}25` }}>
                        <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: BRAND.teal }}>Admin Note</p>
                        <p className="text-sm" style={{ color: BRAND.black }}>{r.admin_note}</p>
                      </div>
                    )}

                    {isPending && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.muted }}>
                            Note to Customer (optional)
                          </label>
                          <textarea
                            rows={2}
                            placeholder="Reason for approval or denial…"
                            value={noteInputs[r.id] ?? ""}
                            onChange={e => setNoteInputs(prev => ({ ...prev, [r.id]: e.target.value }))}
                            className="w-full px-4 py-3 text-sm focus:outline-none resize-none"
                            style={{ background: BRAND.bg, border: `1px solid ${BRAND.border}`, color: BRAND.black }}
                          />
                        </div>
                        <div className="flex gap-3">
                          <button
                            disabled={processing === r.id}
                            onClick={() => handleAction(r.id, "approved")}
                            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold uppercase tracking-wide transition-opacity hover:opacity-80 disabled:opacity-40"
                            style={{ background: "#10B98115", color: "#10B981", border: "1px solid #10B98130" }}>
                            <CheckCircle className="w-4 h-4" />
                            {processing === r.id ? "Processing…" : "Approve"}
                          </button>
                          <button
                            disabled={processing === r.id}
                            onClick={() => handleAction(r.id, "denied")}
                            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold uppercase tracking-wide transition-opacity hover:opacity-80 disabled:opacity-40"
                            style={{ background: `${BRAND.red}12`, color: BRAND.red, border: `1px solid ${BRAND.red}30` }}>
                            <XCircle className="w-4 h-4" />
                            {processing === r.id ? "Processing…" : "Deny"}
                          </button>
                        </div>
                      </div>
                    )}

                    {!isPending && (
                      <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: STATUS_COLORS[r.status] }}>
                        {r.status === "approved" ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        {r.status === "approved" ? "Return approved" : "Return denied"}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

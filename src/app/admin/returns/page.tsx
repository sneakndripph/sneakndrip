"use client";

import { useState, useEffect } from "react";
import { RefreshCw, CheckCircle, XCircle, X, Image as ImageIcon, MessageCircle, ChevronDown } from "lucide-react";
import Image from "next/image";

type OrderItem = {
  product_name: string;
  size: string;
  quantity: number;
  unit_price: number;
  products: { images: string[] | null; bg: string | null } | null;
};

type ReturnOrder = {
  order_number: string;
  total: number;
  payment_method: string;
  created_at: string;
  order_items: OrderItem[];
} | null;

type ReturnRequest = {
  id: string;
  order_number: string;
  customer_email: string;
  customer_name: string;
  reason: string;
  status: "pending" | "approved" | "denied";
  admin_note: string | null;
  photo_url: string | null;
  photo_urls?: string[] | null;
  created_at: string;
  order: ReturnOrder;
};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  pending: { label: "Pending", cls: "text-state-preorder bg-state-preorder/10" },
  approved: { label: "Approved", cls: "text-state-onhand bg-state-onhand/10" },
  denied: { label: "Denied", cls: "text-state-error bg-state-error/10" },
};

const FILTERS: { id: "all" | "pending" | "approved" | "denied"; label: string }[] = [
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "denied", label: "Denied" },
  { id: "all", label: "All" },
];

export default function AdminReturnsPage() {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "denied">("pending");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const [approveTarget, setApproveTarget] = useState<ReturnRequest | null>(null);
  const [approveRefund, setApproveRefund] = useState("");
  const [approveNote, setApproveNote] = useState("");

  const [denyTarget, setDenyTarget] = useState<ReturnRequest | null>(null);
  const [denyReason, setDenyReason] = useState("");
  const [denyError, setDenyError] = useState("");

  const [processing, setProcessing] = useState(false);

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

  function toggleExpanded(id: string) {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function openApprove(r: ReturnRequest) { setApproveTarget(r); setApproveRefund(""); setApproveNote(""); }
  function closeApprove() { setApproveTarget(null); setApproveRefund(""); setApproveNote(""); }

  function openDeny(r: ReturnRequest) { setDenyTarget(r); setDenyReason(""); setDenyError(""); }
  function closeDeny() { setDenyTarget(null); setDenyReason(""); setDenyError(""); }

  async function confirmApprove() {
    if (!approveTarget) return;
    const amt = approveRefund.trim();
    const note = approveNote.trim();
    const admin_note = amt && note
      ? `Refund: ₱${Number(amt).toLocaleString()} — ${note}`
      : amt
      ? `Refund: ₱${Number(amt).toLocaleString()}`
      : note || null;
    setProcessing(true);
    const res = await fetch("/api/admin/returns", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: approveTarget.id, status: "approved", admin_note }),
    });
    if (res.ok) {
      setReturns(prev => prev.map(r => r.id === approveTarget.id ? { ...r, status: "approved", admin_note } : r));
      closeApprove();
    }
    setProcessing(false);
  }

  async function confirmDeny() {
    if (!denyTarget) return;
    if (!denyReason.trim()) { setDenyError("Reason is required."); return; }
    setDenyError("");
    setProcessing(true);
    const admin_note = denyReason.trim();
    const res = await fetch("/api/admin/returns", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: denyTarget.id, status: "denied", admin_note }),
    });
    if (res.ok) {
      setReturns(prev => prev.map(r => r.id === denyTarget.id ? { ...r, status: "denied", admin_note } : r));
      closeDeny();
    }
    setProcessing(false);
  }

  const pendingCount = returns.filter(r => r.status === "pending").length;
  const resolvedCount = returns.length - pendingCount;
  const filtered = filter === "all" ? returns : returns.filter(r => r.status === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <p className="text-admin-eyebrow text-ink-3 mb-1">Management</p>
          <h1 className="text-admin-hero text-ink font-display font-medium tracking-[-0.02em]">Returns</h1>
          <p className="text-admin text-ink-3 mt-1">{pendingCount} pending · {resolvedCount} resolved</p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 text-admin-sm font-medium rounded-md border border-line text-ink-2 hover:border-line-strong disabled:opacity-40 transition-colors duration-admin-fast">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Filter */}
      <div className="inline-flex bg-paper-2 rounded-md p-1 mb-5">
        {FILTERS.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`text-admin-sm px-3.5 py-1.5 rounded transition-colors duration-admin-fast ${
              filter === f.id ? "bg-paper text-ink font-medium" : "text-ink-3 hover:text-ink"
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {loading && returns.length === 0 ? (
        <div className="py-24 text-center text-admin text-ink-3">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="bg-paper border border-line rounded-md py-24 text-center">
          <p className="text-admin-title text-ink">
            {filter === "all" ? "No return requests" : `No ${filter} returns`}
          </p>
          <p className="text-admin-sm text-ink-3 mt-2">Return requests from customers will appear here.</p>
        </div>
      ) : (
        <div>
          {filtered.map(r => {
            const meta = STATUS_META[r.status];
            const expanded = expandedIds.has(r.id);
            const photos = r.photo_urls?.length ? r.photo_urls : r.photo_url ? [r.photo_url] : [];
            return (
              <div key={r.id} className="bg-paper border border-line rounded-md p-4 mb-3">
                <div onClick={() => toggleExpanded(r.id)} className="flex items-start justify-between gap-3 cursor-pointer">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-admin-sm font-semibold text-ink">{r.order_number}</p>
                      <span className={`text-admin-micro font-medium px-2 py-0.5 rounded-full ${meta.cls}`}>{meta.label}</span>
                    </div>
                    <p className="text-admin-micro text-ink-3 mt-0.5">
                      {new Date(r.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                    <p className="text-admin-sm text-ink-2 mt-1.5">{r.customer_name} <span className="text-ink-3">· {r.customer_email}</span></p>
                    <p className={`text-admin-sm text-ink-3 mt-1 ${expanded ? "" : "line-clamp-2"}`}>{r.reason}</p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-ink-3 shrink-0 mt-1 transition-transform duration-admin-fast ${expanded ? "rotate-180" : ""}`} />
                </div>

                {expanded && (
                  <div className="mt-3 pt-3 border-t border-line" onClick={e => e.stopPropagation()}>
                    {r.order && (
                      <p className="text-admin-sm text-ink-3 mb-3">
                        Order total: <span className="font-semibold text-ink">₱{Number(r.order.total).toLocaleString()}</span>
                        {" · "}{r.order.payment_method?.replace(/_/g, " ")}
                      </p>
                    )}

                    {r.order?.order_items && r.order.order_items.length > 0 && (
                      <div className="mb-3">
                        <p className="text-admin-eyebrow text-ink-3 mb-2">Items being returned</p>
                        <div className="space-y-2">
                          {r.order.order_items.map((item, i) => {
                            const img = item.products?.images?.[0] ?? null;
                            const bg = item.products?.bg ?? "#EDE9E3";
                            return (
                              <div key={i} className="flex items-center gap-3">
                                <div className="w-11 h-11 shrink-0 rounded-md overflow-hidden relative border border-line" style={{ background: bg }}>
                                  {img ? (
                                    <Image src={img} alt={item.product_name} fill className="object-cover" sizes="44px" />
                                  ) : (
                                    <span className="absolute inset-0 flex items-center justify-center">
                                      <ImageIcon className="w-4 h-4 text-ink-3" />
                                    </span>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-admin-sm font-medium text-ink truncate">{item.product_name}</p>
                                  <p className="text-admin-micro text-ink-3">Size {item.size} · Qty {item.quantity}</p>
                                </div>
                                <p className="text-admin-sm font-semibold text-ink shrink-0">
                                  ₱{(item.unit_price * item.quantity).toLocaleString()}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {photos.length > 0 && (
                      <div className="mb-3">
                        <p className="text-admin-eyebrow text-ink-3 mb-2">Photo evidence ({photos.length})</p>
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                          {photos.map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                              className="relative aspect-square rounded-md overflow-hidden border border-line hover:opacity-80 transition-opacity duration-admin-fast">
                              <Image src={url} alt={`Return photo ${i + 1}`} fill className="object-cover" sizes="100px" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {r.admin_note && r.status !== "pending" && (
                      <div className="mb-3 p-3 rounded-md bg-paper-2 border border-line">
                        <p className="text-admin-eyebrow text-ink-3 mb-1">Admin note</p>
                        <p className="text-admin-sm text-ink">{r.admin_note}</p>
                      </div>
                    )}

                    {r.status === "approved" && (
                      <div className="mb-3 p-3 rounded-md bg-state-onhand/10 border border-state-onhand/25">
                        <p className="text-admin-eyebrow text-state-onhand mb-1">Customer directed to chat</p>
                        <p className="text-admin-micro text-ink-3 mb-2">
                          The customer has been instructed to reach you via chat support to arrange the return.
                        </p>
                        <a href={`/admin/chat?email=${encodeURIComponent(r.customer_email)}`}
                          className="inline-flex items-center gap-1.5 text-admin-sm font-medium text-state-onhand hover:opacity-70 transition-opacity duration-admin-fast">
                          Open chat with {r.customer_name} →
                        </a>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2">
                      {r.status === "pending" && (
                        <>
                          <button onClick={() => openApprove(r)}
                            className="flex items-center gap-1.5 px-4 py-2 text-admin-sm font-medium rounded-md bg-state-onhand/10 text-state-onhand border border-state-onhand/30 hover:bg-state-onhand/15 transition-colors duration-admin-fast">
                            <CheckCircle className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button onClick={() => openDeny(r)}
                            className="flex items-center gap-1.5 px-4 py-2 text-admin-sm font-medium rounded-md bg-state-error/10 text-state-error border border-state-error/30 hover:bg-state-error/15 transition-colors duration-admin-fast">
                            <XCircle className="w-3.5 h-3.5" /> Deny
                          </button>
                        </>
                      )}
                      <a href={`/admin/chat?email=${encodeURIComponent(r.customer_email)}`}
                        className="flex items-center gap-1.5 px-4 py-2 text-admin-sm font-medium rounded-md border border-line text-ink-2 hover:border-line-strong transition-colors duration-admin-fast">
                        <MessageCircle className="w-3.5 h-3.5" /> Contact customer
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Approve confirmation */}
      {approveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60"
          onClick={e => { if (e.target === e.currentTarget) closeApprove(); }}>
          <div className="w-full max-w-md rounded-md overflow-hidden bg-paper border border-line">
            <div className="flex items-center justify-between px-6 py-4 border-b border-line">
              <p className="text-admin-title text-ink">Approve return — {approveTarget.order_number}</p>
              <button onClick={closeApprove} className="p-1 text-ink-3 hover:text-ink transition-colors duration-admin-fast">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-admin-eyebrow text-ink-3 mb-1.5">Refund amount (optional)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-admin-sm font-medium text-ink-3">₱</span>
                  <input type="number" min="0" value={approveRefund} onChange={e => setApproveRefund(e.target.value)}
                    placeholder="0"
                    className="w-full pl-8 pr-3.5 py-2.5 text-admin bg-paper border border-line rounded-md text-ink placeholder:text-ink-3 focus:outline-none focus:border-line-strong transition-colors duration-admin-fast" />
                </div>
              </div>
              <div>
                <label className="block text-admin-eyebrow text-ink-3 mb-1.5">Note (optional)</label>
                <textarea rows={2} value={approveNote} onChange={e => setApproveNote(e.target.value)}
                  placeholder="Any additional context for this approval…"
                  className="w-full px-3.5 py-2.5 text-admin bg-paper border border-line rounded-md text-ink placeholder:text-ink-3 focus:outline-none focus:border-line-strong transition-colors duration-admin-fast resize-none" />
              </div>
            </div>
            <div className="flex gap-2.5 px-6 pb-6">
              <button onClick={confirmApprove} disabled={processing}
                className="flex-1 py-2.5 text-admin-sm font-medium rounded-md bg-state-onhand text-paper hover:opacity-90 disabled:opacity-50 transition-opacity duration-admin-fast">
                {processing ? "Processing…" : "Confirm approval"}
              </button>
              <button onClick={closeApprove}
                className="px-5 py-2.5 text-admin-sm font-medium rounded-md border border-line text-ink-2 hover:border-line-strong transition-colors duration-admin-fast">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deny confirmation */}
      {denyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60"
          onClick={e => { if (e.target === e.currentTarget) closeDeny(); }}>
          <div className="w-full max-w-md rounded-md overflow-hidden bg-paper border border-line">
            <div className="flex items-center justify-between px-6 py-4 border-b border-line">
              <p className="text-admin-title text-ink">Deny return — {denyTarget.order_number}</p>
              <button onClick={closeDeny} className="p-1 text-ink-3 hover:text-ink transition-colors duration-admin-fast">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6">
              <label className="block text-admin-eyebrow text-ink-3 mb-1.5">Reason *</label>
              <textarea rows={2} value={denyReason} onChange={e => { setDenyReason(e.target.value); setDenyError(""); }}
                placeholder="Reason for denial…"
                className={`w-full px-3.5 py-2.5 text-admin bg-paper border rounded-md text-ink placeholder:text-ink-3 focus:outline-none focus:border-line-strong transition-colors duration-admin-fast resize-none ${
                  denyError ? "border-state-error" : "border-line"
                }`} />
              {denyError && <p className="text-admin-sm text-state-error mt-1.5">{denyError}</p>}
            </div>
            <div className="flex gap-2.5 px-6 pb-6">
              <button onClick={confirmDeny} disabled={processing}
                className="flex-1 py-2.5 text-admin-sm font-medium rounded-md bg-state-error text-paper hover:opacity-90 disabled:opacity-50 transition-opacity duration-admin-fast">
                {processing ? "Processing…" : "Confirm denial"}
              </button>
              <button onClick={closeDeny}
                className="px-5 py-2.5 text-admin-sm font-medium rounded-md border border-line text-ink-2 hover:border-line-strong transition-colors duration-admin-fast">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

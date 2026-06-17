"use client";

import { useState, useEffect } from "react";
import { BRAND, FONTS } from "@/lib/constants";
import { RefreshCw, CheckCircle, XCircle, X, Image as ImageIcon } from "lucide-react";
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

const STATUS_COLORS: Record<string, string> = {
  pending: "#D97706",
  approved: "#10B981",
  denied: BRAND.red,
};

export default function AdminReturnsPage() {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ReturnRequest | null>(null);
  const [noteInput, setNoteInput] = useState("");
  const [noteError, setNoteError] = useState("");
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

  function openModal(r: ReturnRequest) {
    setSelected(r);
    setNoteInput(r.admin_note ?? "");
    setNoteError("");
  }

  function closeModal() {
    setSelected(null);
    setNoteInput("");
    setNoteError("");
  }

  async function handleAction(status: "approved" | "denied") {
    if (!selected) return;
    if (!noteInput.trim()) {
      setNoteError("Note to customer is required.");
      return;
    }
    setNoteError("");
    setProcessing(true);
    const res = await fetch("/api/admin/returns", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selected.id, status, admin_note: noteInput.trim() || null }),
    });
    if (res.ok) {
      const updated = { ...selected, status, admin_note: noteInput.trim() || null };
      setReturns(prev => prev.map(r => r.id === selected.id ? updated : r));
      setSelected(updated);
    }
    setProcessing(false);
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
        <div className="rounded-xl overflow-hidden" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#F8F7F6", borderBottom: `1px solid ${BRAND.border}` }}>
                {["Status", "Order", "Customer", "Submitted", ""].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide" style={{ color: BRAND.muted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {returns.map((r, i) => (
                <tr key={r.id}
                  className="cursor-pointer transition-colors hover:bg-black/[0.02]"
                  style={{ borderBottom: i < returns.length - 1 ? `1px solid ${BRAND.border}` : "none" }}
                  onClick={() => openModal(r)}>
                  <td className="px-5 py-4">
                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                      style={{ background: `${STATUS_COLORS[r.status]}15`, color: STATUS_COLORS[r.status] }}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-xs" style={{ color: BRAND.black }}>{r.order_number}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-xs" style={{ color: BRAND.black }}>{r.customer_name}</p>
                    <p className="text-xs" style={{ color: BRAND.muted }}>{r.customer_email}</p>
                  </td>
                  <td className="px-5 py-4 text-xs" style={{ color: BRAND.muted }}>
                    {new Date(r.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td className="px-5 py-4 text-xs font-bold" style={{ color: BRAND.teal }}>
                    View →
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="w-full max-w-lg rounded-2xl overflow-hidden flex flex-col"
            style={{ background: BRAND.card, border: `1px solid ${BRAND.border}`, maxHeight: "90vh" }}>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 shrink-0"
              style={{ background: BRAND.black, borderBottom: `1px solid rgba(255,255,255,0.07)` }}>
              <div>
                <h2 style={{ fontFamily: FONTS.display, fontSize: "1.1rem", letterSpacing: "0.04em", color: "#fff" }}>RETURN REQUEST</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs" style={{ color: "#999" }}>{selected.order_number}</p>
                  <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                    style={{ background: `${STATUS_COLORS[selected.status]}30`, color: STATUS_COLORS[selected.status] }}>
                    {selected.status}
                  </span>
                </div>
              </div>
              <button onClick={closeModal} className="opacity-60 hover:opacity-100 transition-opacity">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Customer + Order Info */}
              <div className="px-6 py-4 space-y-1" style={{ borderBottom: `1px solid ${BRAND.border}` }}>
                <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: BRAND.muted }}>Customer</p>
                <p className="text-sm font-semibold" style={{ color: BRAND.black }}>{selected.customer_name}</p>
                <p className="text-xs" style={{ color: BRAND.muted }}>{selected.customer_email}</p>
                {selected.order && (
                  <p className="text-xs mt-1" style={{ color: BRAND.muted }}>
                    Order total: <span className="font-semibold" style={{ color: BRAND.black }}>₱{Number(selected.order.total).toLocaleString()}</span>
                    {" · "}{selected.order.payment_method?.replace(/_/g, " ")}
                  </p>
                )}
              </div>

              {/* Order Items */}
              {selected.order?.order_items && selected.order.order_items.length > 0 && (
                <div style={{ borderBottom: `1px solid ${BRAND.border}` }}>
                  <p className="px-6 pt-4 pb-2 text-xs font-bold uppercase tracking-wide" style={{ color: BRAND.muted }}>Order Items</p>
                  {selected.order.order_items.map((item, i) => {
                    const img = item.products?.images?.[0] ?? null;
                    const bg = item.products?.bg ?? "#EDE9E3";
                    return (
                      <div key={i} className="flex items-center gap-3 px-6 py-3"
                        style={{ borderBottom: i < selected.order!.order_items.length - 1 ? `1px solid ${BRAND.border}` : "none" }}>
                        <div className="w-11 h-11 shrink-0 rounded-lg overflow-hidden relative"
                          style={{ background: bg, border: `1px solid ${BRAND.border}` }}>
                          {img ? (
                            <Image src={img} alt={item.product_name} fill className="object-cover" sizes="44px" />
                          ) : (
                            <span className="absolute inset-0 flex items-center justify-center opacity-20">
                              <ImageIcon className="w-5 h-5" style={{ color: BRAND.black }} />
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: BRAND.black }}>{item.product_name}</p>
                          <p className="text-xs" style={{ color: BRAND.muted }}>Size {item.size} · Qty {item.quantity}</p>
                        </div>
                        <p className="text-sm font-bold shrink-0" style={{ color: BRAND.black }}>
                          ₱{(item.unit_price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Return Reason */}
              <div className="px-6 py-4" style={{ borderBottom: `1px solid ${BRAND.border}` }}>
                <p className="text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.muted }}>Customer&apos;s Reason</p>
                <p className="text-sm" style={{ color: BRAND.black }}>{selected.reason}</p>
              </div>

              {/* Customer Photos */}
              {(() => {
                const photos = selected.photo_urls?.length
                  ? selected.photo_urls
                  : selected.photo_url ? [selected.photo_url] : [];
                if (!photos.length) return null;
                return (
                  <div className="px-6 py-4" style={{ borderBottom: `1px solid ${BRAND.border}` }}>
                    <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: BRAND.muted }}>
                      Photo Evidence ({photos.length})
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {photos.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                          className="relative aspect-square rounded-xl overflow-hidden transition-opacity hover:opacity-80"
                          style={{ background: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                          <Image src={url} alt={`Return photo ${i + 1}`} fill className="object-cover" sizes="150px" />
                        </a>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Admin note + actions */}
              <div className="px-6 py-4 space-y-3">
                {selected.status !== "pending" && selected.admin_note && (
                  <div className="p-3 rounded-lg" style={{ background: `${BRAND.teal}10`, border: `1px solid ${BRAND.teal}25` }}>
                    <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: BRAND.teal }}>Admin Note</p>
                    <p className="text-sm" style={{ color: BRAND.black }}>{selected.admin_note}</p>
                  </div>
                )}

                {selected.status === "pending" && (
                  <>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.muted }}>
                        Note to Customer <span style={{ color: BRAND.red }}>*</span>
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Reason for approval or denial…"
                        value={noteInput}
                        onChange={e => { setNoteInput(e.target.value); setNoteError(""); }}
                        className="w-full px-4 py-3 text-sm focus:outline-none resize-none"
                        style={{ background: BRAND.bg, border: `1px solid ${noteError ? BRAND.red : BRAND.border}`, color: BRAND.black }}
                      />
                      {noteError && (
                        <p className="text-xs mt-1 font-semibold" style={{ color: BRAND.red }}>{noteError}</p>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <button
                        disabled={processing}
                        onClick={() => handleAction("approved")}
                        className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold uppercase tracking-wide transition-opacity hover:opacity-80 disabled:opacity-40"
                        style={{ background: "#10B98115", color: "#10B981", border: "1px solid #10B98130" }}>
                        <CheckCircle className="w-4 h-4" />
                        {processing ? "Processing…" : "Approve"}
                      </button>
                      <button
                        disabled={processing}
                        onClick={() => handleAction("denied")}
                        className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold uppercase tracking-wide transition-opacity hover:opacity-80 disabled:opacity-40"
                        style={{ background: `${BRAND.red}12`, color: BRAND.red, border: `1px solid ${BRAND.red}30` }}>
                        <XCircle className="w-4 h-4" />
                        {processing ? "Processing…" : "Deny"}
                      </button>
                    </div>
                  </>
                )}

                {selected.status !== "pending" && (
                  <>
                    <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: STATUS_COLORS[selected.status] }}>
                      {selected.status === "approved" ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      {selected.status === "approved" ? "Return approved" : "Return denied"}
                    </div>
                    {selected.status === "approved" && (
                      <div className="p-3 rounded-lg" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)" }}>
                        <p className="text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: "#10B981" }}>Customer directed to chat</p>
                        <p className="text-xs mb-2" style={{ color: BRAND.muted }}>
                          The customer has been instructed to reach you via chat support to arrange the return.
                        </p>
                        <a href={`/admin/chat?email=${encodeURIComponent(selected.customer_email)}`}
                          className="inline-flex items-center gap-1.5 text-xs font-bold transition-opacity hover:opacity-70"
                          style={{ color: "#10B981" }}>
                          Open Chat with {selected.customer_name} →
                        </a>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="px-6 py-4 shrink-0" style={{ borderTop: `1px solid ${BRAND.border}` }}>
              <button onClick={closeModal}
                className="w-full py-2.5 text-sm font-bold uppercase tracking-wide transition-opacity hover:opacity-70"
                style={{ border: `1px solid ${BRAND.border}`, color: BRAND.muted }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

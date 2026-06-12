"use client";
import { useState } from "react";
import { BRAND, FONTS } from "@/lib/constants";
import { Search, Truck } from "lucide-react";

const STEPS_DEFAULT = ["pending", "paid", "processing", "shipped", "delivered"];
const STEPS_COD = ["pending", "processing", "shipped", "delivered"];
const STEP_LABELS: Record<string, string> = {
  pending: "Placed", paid: "Confirmed", processing: "Processing", shipped: "Shipped", delivered: "Delivered"
};
const STATUS_CFG: Record<string, { color: string; label: string }> = {
  pending:    { color: "#D97706", label: "Pending" },
  paid:       { color: "#5BB8B4", label: "Confirmed" },
  processing: { color: "#6366F1", label: "Processing" },
  shipped:    { color: "#3B82F6", label: "Shipped" },
  delivered:  { color: "#10B981", label: "Delivered" },
  cancelled:  { color: "#EF4444", label: "Cancelled" },
};

type TrackItem = { product_name: string; size: string; quantity: number; unit_price: number; products?: { images?: string[]; bg?: string } };

export default function TrackOrderPage() {
  const [form, setForm] = useState({ orderNumber: "", email: "" });
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [order, setOrder] = useState<Record<string, any> | null>(null);
  const [error, setError] = useState("");

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!form.orderNumber.trim() || !form.email.trim()) return;
    setLoading(true);
    setError("");
    setOrder(null);
    const res = await fetch(
      `/api/track-order?orderNumber=${encodeURIComponent(form.orderNumber.trim())}&email=${encodeURIComponent(form.email.trim())}`
    );
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Order not found");
    } else {
      setOrder(await res.json());
    }
    setLoading(false);
  }

  const isCOD = order?.payment_method === "cod";
  const steps = isCOD ? STEPS_COD : STEPS_DEFAULT;
  const status = (order?.status as string) || "pending";
  const activeIdx = steps.indexOf(status);
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.pending;

  return (
    <div style={{ background: BRAND.bg, minHeight: "100vh", fontFamily: FONTS.body }}>
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: BRAND.teal }}>Sneak N&apos; Drip</p>
          <h1 style={{ fontFamily: FONTS.display, fontSize: "3rem", letterSpacing: "0.04em", color: BRAND.black }}>TRACK ORDER</h1>
          <p className="mt-3 text-sm" style={{ color: BRAND.muted }}>Enter your order number and email to track your delivery.</p>
        </div>

        <form onSubmit={handleSearch} className="p-6 rounded-xl mb-8" style={{ background: BRAND.card, border: `1px solid ${BRAND.cardBorder}` }}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>Order Number</label>
              <input value={form.orderNumber} onChange={e => setForm(f => ({ ...f, orderNumber: e.target.value.toUpperCase() }))}
                placeholder="SND-12345678"
                className="w-full px-4 py-3 text-sm focus:outline-none"
                style={{ background: BRAND.bg, border: `1px solid ${BRAND.border}`, color: BRAND.black }}
                onFocus={e => (e.currentTarget.style.borderColor = BRAND.teal)}
                onBlur={e => (e.currentTarget.style.borderColor = BRAND.border)} />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>Email Address</label>
              <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} type="email"
                placeholder="Email used during checkout"
                className="w-full px-4 py-3 text-sm focus:outline-none"
                style={{ background: BRAND.bg, border: `1px solid ${BRAND.border}`, color: BRAND.black }}
                onFocus={e => (e.currentTarget.style.borderColor = BRAND.teal)}
                onBlur={e => (e.currentTarget.style.borderColor = BRAND.border)} />
            </div>
            {error && (
              <p className="text-sm font-semibold px-4 py-3 rounded"
                style={{ background: `${BRAND.red}12`, color: BRAND.red, border: `1px solid ${BRAND.red}25` }}>
                {error}
              </p>
            )}
            <button type="submit" disabled={loading || !form.orderNumber.trim() || !form.email.trim()}
              className="w-full py-4 font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: BRAND.black, color: BRAND.bg }}>
              <Search className="w-4 h-4" />
              {loading ? "Searching…" : "Track Order"}
            </button>
          </div>
        </form>

        {order && (
          <div className="rounded-xl overflow-hidden" style={{ background: BRAND.card, border: `1px solid ${BRAND.cardBorder}` }}>
            <div className="px-6 py-5" style={{ borderBottom: `1px solid ${BRAND.border}` }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-black text-lg" style={{ color: BRAND.black }}>{order.order_number}</p>
                  <p className="text-xs mt-0.5" style={{ color: BRAND.muted }}>
                    {new Date(order.created_at).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })}
                  </p>
                </div>
                <span className="text-sm font-black px-4 py-2 rounded-full"
                  style={{ background: `${cfg.color}15`, color: cfg.color }}>
                  {cfg.label}
                </span>
              </div>
            </div>

            {status !== "cancelled" && (
              <div className="px-6 py-6" style={{ borderBottom: `1px solid ${BRAND.border}` }}>
                <div className="flex items-center">
                  {steps.map((step, i) => (
                    <div key={step} className="flex items-center flex-1 min-w-0">
                      <div className="flex flex-col items-center flex-1">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black mb-2 transition-all"
                          style={{
                            background: i === activeIdx ? BRAND.teal : i < activeIdx ? `${BRAND.teal}55` : BRAND.border,
                            color: i <= activeIdx ? "#fff" : BRAND.mutedLight,
                            boxShadow: i === activeIdx ? `0 0 0 3px ${BRAND.teal}25` : "none",
                          }}>
                          {i < activeIdx ? "✓" : i + 1}
                        </div>
                        <p className="text-[9px] font-bold text-center whitespace-nowrap"
                          style={{ color: i === activeIdx ? BRAND.teal : i < activeIdx ? `${BRAND.teal}90` : BRAND.mutedLight }}>
                          {STEP_LABELS[step]}
                        </p>
                      </div>
                      {i < steps.length - 1 && (
                        <div className="h-0.5 flex-1 mx-0.5 mb-5" style={{ background: i < activeIdx ? BRAND.teal : BRAND.border }} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {order.tracking_number && (
              <div className="px-6 py-4 flex items-center gap-3"
                style={{ borderBottom: `1px solid ${BRAND.border}`, background: `${BRAND.teal}08` }}>
                <Truck className="w-5 h-5 shrink-0" style={{ color: BRAND.teal }} />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide" style={{ color: BRAND.teal }}>Tracking Number</p>
                  <p className="font-black mt-0.5" style={{ color: BRAND.black }}>{order.tracking_number}</p>
                </div>
              </div>
            )}

            {(order.order_items as TrackItem[])?.length > 0 && (
              <div className="px-6 py-5">
                <p className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: BRAND.muted }}>Items</p>
                <div className="space-y-3">
                  {(order.order_items as TrackItem[]).map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-12 h-12 shrink-0 rounded-lg overflow-hidden relative"
                        style={{ background: item.products?.bg || "#EDE9E3", border: `1px solid ${BRAND.border}` }}>
                        {item.products?.images?.[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.products.images[0]} alt={item.product_name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="absolute inset-0 flex items-center justify-center text-xs font-black"
                            style={{ color: BRAND.black, opacity: 0.12, fontFamily: FONTS.display }}>S</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold" style={{ color: BRAND.black }}>{item.product_name}</p>
                        <p className="text-xs" style={{ color: BRAND.muted }}>Size {item.size} · x{item.quantity}</p>
                      </div>
                      <p className="text-sm font-bold" style={{ color: BRAND.black }}>
                        ₱{(Number(item.unit_price) * Number(item.quantity)).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-4 pt-4 font-black"
                  style={{ borderTop: `1px solid ${BRAND.border}` }}>
                  <span style={{ color: BRAND.black }}>Total</span>
                  <span style={{ fontFamily: FONTS.display, color: BRAND.black }}>₱{Number(order.total).toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

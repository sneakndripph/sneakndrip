"use client";
import { useState } from "react";
import { Search, Truck, ShoppingBag, CreditCard, Settings, PackageCheck, CheckCircle2 } from "lucide-react";

const STEPS_DEFAULT = ["pending", "paid", "processing", "shipped", "delivered"];
const STEPS_COD     = ["pending", "processing", "shipped", "delivered"];

const STEP_META: Record<string, { label: string; desc: string; icon: React.ElementType }> = {
  pending:    { label: "Order Placed",   desc: "We've received your order.",              icon: ShoppingBag   },
  paid:       { label: "Confirmed",      desc: "Payment verified. We're on it!",          icon: CreditCard    },
  processing: { label: "Processing",     desc: "Your pair is being prepared for pickup.", icon: Settings      },
  shipped:    { label: "Shipped",        desc: "On its way — check your tracking number.",icon: Truck         },
  delivered:  { label: "Delivered",      desc: "Your order has been delivered.",          icon: CheckCircle2  },
};

const NEXT_MSG: Record<string, string> = {
  pending:    "We'll confirm your order shortly.",
  paid:       "We're packing your order now.",
  processing: "Your order will ship soon.",
  shipped:    "Your package is on its way to you.",
  delivered:  "Your order is complete. Thank you!",
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
    <div className="bg-snd-bg min-h-screen font-body">
      <div className="max-w-2xl mx-auto px-6 py-20">
        <div className="mb-12">
          <p className="snd-label mb-4 text-snd-muted-lt">Order Status</p>
          <h1 className="font-heading tracking-[0.04em] leading-none text-snd-black text-[length:var(--text-display-sm)]">TRACK ORDER</h1>
          <p className="mt-4 text-sm text-snd-muted">Enter your order number and email to track your delivery.</p>
        </div>

        <form onSubmit={handleSearch} className="p-6 mb-6 bg-snd-card border border-snd-border">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-1.5 text-snd-black">Order Number</label>
              <input value={form.orderNumber} onChange={e => setForm(f => ({ ...f, orderNumber: e.target.value.toUpperCase() }))}
                placeholder="SND-12345678"
                className="w-full px-4 py-3 text-sm focus:outline-none bg-snd-bg border border-snd-border text-snd-black focus:border-snd-teal" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-1.5 text-snd-black">Email Address</label>
              <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} type="email"
                placeholder="Email used during checkout"
                className="w-full px-4 py-3 text-sm focus:outline-none bg-snd-bg border border-snd-border text-snd-black focus:border-snd-teal" />
            </div>
            {error && (
              <p className="text-sm font-semibold px-4 py-3 bg-snd-red/[6%] text-snd-red border border-snd-red/[13%]">
                {error}
              </p>
            )}
            <button type="submit" disabled={loading || !form.orderNumber.trim() || !form.email.trim()}
              className="w-full py-4 font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-50 bg-snd-black text-snd-bg">
              <Search className="w-4 h-4" />
              {loading ? "Searching…" : "Track Order"}
            </button>
          </div>
        </form>

        {order && (
          <div className="bg-snd-card border border-snd-border">
            <div className="px-6 py-5 border-b border-snd-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-black text-lg text-snd-black">{order.order_number}</p>
                  <p className="text-xs mt-0.5 text-snd-muted">
                    {new Date(order.created_at).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })}
                  </p>
                </div>
                <span className="text-[11px] font-black px-3 py-1.5 uppercase tracking-wider"
                  style={{ background: `${cfg.color}15`, color: cfg.color }}>
                  {cfg.label}
                </span>
              </div>
            </div>

            {status !== "cancelled" && (
              <div className="px-6 pt-6 pb-2 border-b border-snd-border">
                {/* Progress bar */}
                <div className="relative mb-6">
                  <div className="absolute top-5 left-0 right-0 h-0.5 bg-snd-border" />
                  <div
                    className="absolute top-5 left-0 h-0.5 transition-all duration-700 bg-snd-teal"
                    style={{ width: activeIdx < 0 ? "0%" : `${(activeIdx / (steps.length - 1)) * 100}%` }}
                  />
                  <div className="relative flex justify-between">
                    {steps.map((step, i) => {
                      const Icon = STEP_META[step]?.icon ?? PackageCheck;
                      const done = i < activeIdx;
                      const active = i === activeIdx;
                      return (
                        <div key={step} className="flex flex-col items-center gap-2" style={{ width: `${100 / steps.length}%` }}>
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all border-2 ${
                              active || done ? "bg-snd-teal border-snd-teal" : "bg-snd-card border-snd-border"
                            } ${active ? "shadow-[0_0_0_4px_rgba(91,184,180,0.13)]" : ""}`}>
                            <Icon className={`w-4 h-4 ${active || done ? "text-white" : "text-snd-muted-lt"}`} />
                          </div>
                          <p className={`text-[10px] font-bold text-center leading-tight ${active ? "text-snd-teal" : done ? "text-snd-black" : "text-snd-muted-lt"}`}>
                            {STEP_META[step]?.label}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* What's next */}
                <div className="flex items-center gap-3 px-4 py-3 mb-4 bg-snd-teal/[6%] border border-snd-teal/[15%]">
                  <div className="w-1.5 h-1.5 shrink-0 animate-pulse rounded-full bg-snd-teal" />
                  <p className="text-xs font-semibold text-snd-teal">
                    {NEXT_MSG[status] ?? "Your order is being processed."}
                  </p>
                </div>
              </div>
            )}

            {order.tracking_number && (
              <div className="px-6 py-4 flex items-center gap-3 border-b border-snd-border bg-snd-teal/[3%]">
                <Truck className="w-5 h-5 shrink-0 text-snd-teal" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-snd-teal">Tracking Number</p>
                  <p className="font-black mt-0.5 text-snd-black">{order.tracking_number}</p>
                </div>
              </div>
            )}

            {(order.order_items as TrackItem[])?.length > 0 && (
              <div className="px-6 py-5">
                <p className="text-xs font-black uppercase tracking-widest mb-4 text-snd-muted">Items</p>
                <div className="space-y-3">
                  {(order.order_items as TrackItem[]).map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-12 h-12 shrink-0 overflow-hidden relative border border-snd-border"
                        style={{ background: item.products?.bg || "#EDE9E3" }}>
                        {item.products?.images?.[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.products.images[0]} alt={item.product_name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-snd-black opacity-[0.12] font-heading">S</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-snd-black">{item.product_name}</p>
                        <p className="text-xs text-snd-muted">Size {item.size} · x{item.quantity}</p>
                      </div>
                      <p className="text-sm font-bold text-snd-black">
                        ₱{(Number(item.unit_price) * Number(item.quantity)).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-4 pt-4 font-black border-t border-snd-border">
                  <span className="text-snd-black">Total</span>
                  <span className="font-heading text-snd-black">₱{Number(order.total).toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

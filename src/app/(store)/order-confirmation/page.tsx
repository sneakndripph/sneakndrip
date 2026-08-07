"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle, Package, MessageCircle, Clock, Truck, MapPin, User } from "lucide-react";
import { DP_RESERVE_FEE } from "@/lib/constants";

type OrderItem = {
  name: string;
  size: string;
  quantity: number;
  price: number;
  payment_type?: string;
  image?: string | null;
  bg?: string | null;
  brand?: string;
};
type OrderData = {
  orderNumber: string;
  total: number;
  isCOD: boolean;
  paymentMethod: string;
  name: string;
  items: OrderItem[];
  shipping?: number;
  discount?: number;
  couponCode?: string | null;
  referenceNumber?: string | null;
  isDP?: boolean;
  dpBalance?: number;
  totalDueNow?: number;
  eta?: string | null;
  etaEnd?: string | null;
  mobile?: string | null;
  address?: string | null;
  proofSubmitted?: boolean;
  proofUrl?: string | null;
};

const PAYMENT_LABELS: Record<string, string> = {
  gcash: "GCash", maya: "Maya", bank_transfer: "Bank Transfer", cod: "Cash on Delivery",
};

type OrderStatus = "pending" | "paid" | "stock_on_hand" | "processing" | "shipped" | "delivered" | "cancelled";

const STATUS_CONFIG: Record<OrderStatus, { icon: React.ElementType; color: string; label: string; desc: string }> = {
  pending:       { icon: Clock,        color: "#8A8580", label: "Pending",        desc: "Order received, awaiting payment verification." },
  paid:          { icon: CheckCircle,  color: "#5BB8B4", label: "Confirmed",     desc: "Payment verified! Your order is being prepared." },
  stock_on_hand: { icon: CheckCircle,  color: "#8B5CF6", label: "Stock on Hand", desc: "Your pre-order has arrived in the Philippines! Please settle your balance." },
  processing:    { icon: Clock,        color: "#D97706", label: "Processing",     desc: "We're packing your order for shipment." },
  shipped:       { icon: Truck,        color: "#3B82F6", label: "Shipped",        desc: "Your order is on the way!" },
  delivered:     { icon: CheckCircle,  color: "#10B981", label: "Delivered",      desc: "Delivered. Enjoy your kicks!" },
  cancelled:     { icon: Clock,        color: "#D94F3D",  label: "Cancelled",     desc: "This order has been cancelled." },
};

const STEPS_PREORDER: OrderStatus[] = ["pending", "paid", "stock_on_hand", "processing", "shipped", "delivered"];
const STEPS_ONHAND:  OrderStatus[] = ["pending", "paid", "processing", "shipped", "delivered"];
const STEPS_COD:     OrderStatus[] = ["pending", "processing", "shipped", "delivered"];

const STEP_LABELS: Record<OrderStatus, string> = {
  pending:       "Placed",
  paid:          "Confirmed",
  stock_on_hand: "On Hand",
  processing:    "Packing",
  shipped:       "Shipped",
  delivered:     "Delivered",
  cancelled:     "Cancelled",
};

function StatusTracker({ status, isCOD, isDP }: { status: OrderStatus; isCOD: boolean; isDP?: boolean }) {
  const steps = isCOD ? STEPS_COD : isDP ? STEPS_PREORDER : STEPS_ONHAND;
  const currentIdx = steps.indexOf(status);
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;

  return (
    <div className="p-5 rounded-xl mb-5 bg-snd-card border border-snd-border">
      <p className="text-xs font-black uppercase tracking-widest mb-4 text-snd-muted">Order Status</p>

      {/* Current status badge */}
      <div className="flex items-center gap-3 mb-5 p-3 rounded-lg" style={{ background: `${cfg.color}12`, border: `1px solid ${cfg.color}25` }}>
        <Icon className="w-5 h-5 shrink-0" style={{ color: cfg.color }} />
        <div>
          <p className="text-sm font-bold" style={{ color: cfg.color }}>{cfg.label}</p>
          <p className="text-xs mt-0.5 text-snd-muted">{cfg.desc}</p>
        </div>
      </div>

      {/* Step tracker */}
      <div className="flex items-end">
        {steps.map((s, i) => {
          const done = currentIdx >= i;
          const active = i === currentIdx;
          return (
            <div key={s} className="flex items-center flex-1 min-w-0">
              <div className="flex flex-col items-center flex-1 min-w-0">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black mb-1"
                  style={{
                    background: done ? (active ? STATUS_CONFIG[s].color : "#5BB8B4") : "rgba(13,13,13,0.09)",
                    color: done ? "#fff" : "#B0ABA5",
                  }}>
                  {done && !active ? "✓" : i + 1}
                </div>
                <span className="text-[9px] font-semibold text-center leading-tight w-full break-words"
                  style={{ color: done ? "#0D0D0D" : "#B0ABA5" }}>
                  {STEP_LABELS[s]}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className="flex-1 h-0.5 mb-5 shrink-0"
                  style={{ background: currentIdx > i ? "#5BB8B4" : "rgba(13,13,13,0.09)", minWidth: "4px" }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  const [order, setOrder] = useState<OrderData | null>(null);
  const [liveStatus, setLiveStatus] = useState<OrderStatus | null>(null);
  const [proofImageUrl, setProofImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("lastOrder");
    if (stored) {
      const parsed: OrderData = JSON.parse(stored);
      setOrder(parsed);
      sessionStorage.removeItem("lastOrder");

      // Fetch live status from DB
      fetch(`/api/orders/status?orderNumber=${encodeURIComponent(parsed.orderNumber)}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data?.status) setLiveStatus(data.status as OrderStatus); })
        .catch(() => {});

      // Fetch signed URL for proof image
      if (parsed.proofUrl) {
        fetch(`/api/orders/proof?path=${encodeURIComponent(parsed.proofUrl)}`)
          .then(r => r.ok ? r.json() : null)
          .then(data => { if (data?.url) setProofImageUrl(data.url); })
          .catch(() => {});
      }
    }
  }, []);

  const displayStatus: OrderStatus = liveStatus ?? "pending";

  const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-20 bg-snd-bg font-body">
      <div className="max-w-md w-full">
        {/* Success icon */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 bg-snd-teal/[9%]">
            <CheckCircle className="w-10 h-10 text-snd-teal" />
          </div>
          <h1 className="font-heading text-snd-black" style={{ fontSize: "clamp(2rem, 8vw, 3rem)", letterSpacing: "0.04em" }}>
            ORDER PLACED!
          </h1>
          {order && (
            <>
              <p className="text-sm mt-2 mb-1 text-snd-muted">Order Number</p>
              <p className="font-heading text-snd-teal" style={{ fontSize: "1.4rem" }}>{order.orderNumber}</p>
            </>
          )}
        </div>

        {/* Live status tracker */}
        {order && <StatusTracker status={displayStatus} isCOD={order.isCOD} isDP={order.isDP} />}

        {/* Order details */}
        {order && (
          <>
            {/* Items + summary */}
            <div className="rounded-xl overflow-hidden mb-4 bg-snd-card border border-snd-border">
              <div className="p-5">
                <p className="text-xs font-black uppercase tracking-widest mb-3 text-snd-muted">Your Order</p>
                <div className="space-y-3">
                  {order.items.map((item, i) => {
                    const isItemDP = item.payment_type === "downpayment";
                    const displayPrice = isItemDP ? DP_RESERVE_FEE * item.quantity : item.price;
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-12 h-12 shrink-0 rounded-lg overflow-hidden relative border border-snd-border"
                          style={{ background: item.bg || "#EDE9E3" }}>
                          {item.image ? (
                            <Image src={item.image} alt={item.name} fill className="object-cover" sizes="48px" />
                          ) : (
                            <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-snd-black font-heading opacity-10">
                              {item.brand?.charAt(0) ?? "S"}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate text-snd-black">{item.name}</p>
                          <p className="text-xs text-snd-muted">{item.size} · x{item.quantity}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-semibold text-sm text-snd-black">₱{displayPrice.toLocaleString()}</span>
                          <p className="text-[10px] text-snd-muted">{isItemDP ? "(down payment)" : "(full price)"}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Totals */}
                <div className="space-y-1.5 mt-3 pt-3 border-t border-snd-border">
                  {order.isDP && (order.dpBalance ?? 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-snd-muted">Balance</span>
                      <span className="text-snd-black">₱{(order.dpBalance ?? 0).toLocaleString()}</span>
                    </div>
                  )}
                  {(order.shipping !== undefined) && (
                    <div className="flex justify-between text-sm">
                      <span className="text-snd-muted">Shipping</span>
                      <span className={order.shipping === 0 ? "text-snd-teal" : "text-snd-black"}>
                        {order.shipping === 0 ? "FREE" : `₱${order.shipping.toLocaleString()}`}
                      </span>
                    </div>
                  )}
                  {(order.discount ?? 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-snd-teal">Coupon {order.couponCode ? `(${order.couponCode})` : ""}</span>
                      <span className="text-snd-teal">−₱{order.discount!.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-black pt-2 border-t border-snd-border">
                    <span className="text-snd-black">Paid today</span>
                    <span className="font-heading text-snd-teal" style={{ fontSize: "1.1rem" }}>
                      ₱{(order.isDP ? (order.totalDueNow ?? order.total) : order.total).toLocaleString()}
                    </span>
                  </div>
                  {order.isDP && (order.dpBalance ?? 0) > 0 && (
                    <p className="text-xs italic pt-0.5 text-snd-muted">
                      *balance will be settled before shipping*
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ETA */}
            {order.eta && (
              <div className="rounded-xl overflow-hidden mb-4 bg-snd-card border border-snd-border">
                <div className="p-5">
                  <p className="text-xs font-black uppercase tracking-widest mb-2 text-snd-muted">ETA</p>
                  <p className="text-sm font-semibold text-snd-black">
                    {fmtDate(order.eta)}{order.etaEnd ? ` – ${fmtDate(order.etaEnd)}` : ""}
                  </p>
                  <p className="text-xs mt-0.5 text-snd-muted">Estimated Arrival</p>
                </div>
              </div>
            )}

            {/* Delivery Info */}
            {(order.name || order.mobile || order.address) && (
              <div className="rounded-xl overflow-hidden mb-4 bg-snd-card border border-snd-border">
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-3.5 h-3.5 shrink-0 text-snd-teal" />
                    <p className="text-xs font-black uppercase tracking-widest text-snd-muted">Delivery Info</p>
                  </div>
                  <p className="text-sm font-semibold text-snd-black">{order.name}</p>
                  {order.mobile && <p className="text-xs mt-0.5 text-snd-muted">{order.mobile}</p>}
                  {order.address && (
                    <div className="flex items-start gap-1.5 mt-1">
                      <MapPin className="w-3 h-3 shrink-0 mt-0.5 text-snd-muted" />
                      <p className="text-xs text-snd-muted">{order.address}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Payment info */}
            <div className="rounded-xl overflow-hidden mb-5 bg-snd-card border border-snd-border">
              <div className="p-5">
                <p className="text-xs font-black uppercase tracking-widest mb-3 text-snd-muted">Payment</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-snd-muted">Mode of payment</span>
                    <span className="font-semibold text-snd-black">
                      {PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}
                    </span>
                  </div>
                  {order.referenceNumber && (
                    <div className="flex justify-between">
                      <span className="text-snd-muted">Reference No.</span>
                      <span className="font-semibold text-snd-black">{order.referenceNumber}</span>
                    </div>
                  )}
                </div>

                {/* Proof of payment image */}
                {proofImageUrl && (
                  <div className="mt-3">
                    <p className="text-xs font-black uppercase tracking-widest mb-2 text-snd-muted">Proof of Payment</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={proofImageUrl}
                      alt="Proof of payment"
                      className="w-full rounded-lg object-contain max-h-64 border border-snd-border"
                    />
                  </div>
                )}
                {!proofImageUrl && order.proofSubmitted && !order.isCOD && (
                  <div className="flex items-center gap-1.5 text-xs font-semibold mt-3 text-snd-teal">
                    <CheckCircle className="w-3.5 h-3.5" /> Proof of payment submitted
                  </div>
                )}

                {order.isCOD ? (
                  <div className="mt-3 p-3 rounded-lg text-sm leading-relaxed bg-snd-teal/[6%] text-snd-black">
                    Your order is confirmed! Our team will contact you before delivery to confirm details. Prepare the exact amount upon arrival.
                  </div>
                ) : (
                  <div className="mt-3 p-3 rounded-lg text-sm leading-relaxed bg-snd-teal/[6%] text-snd-black">
                    We&apos;ve received your proof of payment. We&apos;ll verify and confirm your order via email within 1–2 hours.
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* No session data fallback */}
        {!order && (
          <div className="text-center mb-6">
            <p className="text-sm leading-relaxed text-snd-muted">
              Your order has been placed. Check your email for confirmation details.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <Link href="/account"
            className="flex items-center justify-center gap-2 w-full py-4 font-bold text-sm uppercase tracking-widest bg-snd-black text-snd-bg">
            <Package className="w-4 h-4" /> Track My Order
          </Link>
          <Link href="/shop"
            className="flex items-center justify-center gap-2 w-full py-4 font-bold text-sm uppercase tracking-widest border-[1.5px] border-snd-border text-snd-black">
            Continue Shopping
          </Link>
          <a href="https://m.me/sneakndrip"
            className="flex items-center justify-center gap-2 w-full py-3 text-sm font-semibold transition-opacity hover:opacity-70 text-snd-muted">
            <MessageCircle className="w-4 h-4" /> Message us on Facebook
          </a>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Clock, CheckCircle, Truck, Eye, MessageCircle, MapPin, RotateCcw, Star, ChevronDown, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { DP_RESERVE_FEE } from "@/lib/constants";
import { useCartStore } from "@/store/cartStore";
import type { Product } from "@/lib/types";

const EASE_SMOOTH = [0.16, 1, 0.3, 1] as const;

export type OrderItem = {
  product_name: string;
  size: string;
  quantity: number;
  unit_price: number;
  payment_type?: string | null;
  product_id?: string | null;
  products: {
    id: string | null;
    name: string | null;
    slug: string | null;
    brand: string | null;
    sku: string | null;
    gender: string | null;
    status: string | null;
    srp_price: number | null;
    downpayment_price: number | null;
    full_payment_price: number | null;
    images: string[] | null;
    bg: string | null;
    is_featured: boolean | null;
    is_trending: boolean | null;
    is_new: boolean | null;
    is_published: boolean | null;
    product_sizes: { size: string; stock: number }[] | null;
  } | null;
};

export type Order = {
  id: string;
  order_number: string;
  created_at: string;
  status: string;
  delivered_at?: string | null;
  total: number;
  subtotal?: number;
  shipping_fee?: number;
  discount?: number;
  coupon_code?: string | null;
  payment_method: string;
  payment_type?: string | null;
  payment_reference?: string | null;
  proof_of_payment?: string | null;
  tracking_number?: string;
  shipping_street?: string;
  shipping_barangay?: string;
  shipping_city?: string;
  shipping_province?: string;
  customer_name?: string;
  customer_mobile?: string;
  order_items: OrderItem[];
};

export type ReturnInfo = {
  id?: string;
  status: string;
  admin_note: string | null;
  reason: string;
  photo_url: string | null;
  photo_urls?: string[] | null;
};

const STATUS_CONFIG = {
  pending:       { icon: Clock,       color: "#8A8580", label: "Pending",    bg: "rgba(138,133,128,0.12)" },
  paid:          { icon: CheckCircle, color: "#5BB8B4", label: "Confirmed",  bg: "rgba(91,184,180,0.12)" },
  stock_on_hand: { icon: CheckCircle, color: "#8B5CF6", label: "On Hand",    bg: "rgba(139,92,246,0.12)" },
  processing:    { icon: Clock,       color: "#D97706", label: "Packing",    bg: "rgba(217,119,6,0.12)" },
  shipped:       { icon: Truck,       color: "#3B82F6", label: "Shipped",    bg: "rgba(59,130,246,0.12)" },
  delivered:     { icon: CheckCircle, color: "#10B981", label: "Delivered",  bg: "rgba(16,185,129,0.12)" },
  cancelled:     { icon: Clock,       color: "#D94F3D", label: "Cancelled",  bg: "rgba(217,79,61,0.12)" },
} as const;

// COD skips the "Confirmed/Paid" step
const STEPS_DEFAULT = [
  { key: "pending",       label: "Placed" },
  { key: "paid",          label: "Confirmed" },
  { key: "stock_on_hand", label: "On Hand" },
  { key: "processing",    label: "Packing" },
  { key: "shipped",       label: "Shipped" },
  { key: "delivered",     label: "Delivered" },
];
const STEPS_COD = [
  { key: "pending",    label: "Placed" },
  { key: "processing", label: "Packing" },
  { key: "shipped",    label: "Shipped" },
  { key: "delivered",  label: "Collected" },
];

const RETURN_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
// Orders delivered before delivered_at existed have no recorded delivery
// date -- fall back to created_at so the window is still strictly 7 days,
// rather than leaving it open indefinitely.
function isReturnWindowOpen(deliveredAt: string | null | undefined, createdAt: string | null | undefined) {
  const from = deliveredAt ?? createdAt;
  if (!from) return false;
  return Date.now() - new Date(from).getTime() < RETURN_WINDOW_MS;
}

interface OrderCardProps {
  order: Order;
  expanded: boolean;
  onToggleExpand: () => void;
  returnInfo?: ReturnInfo;
  isReviewed: boolean;
  isCancelling: boolean;
  onCancel: () => void;
  onRequestReturn: () => void;
  onViewReturn: () => void;
  onWriteReview: () => void;
  onPayBalance: () => void;
  onViewProof: () => void;
}

export default function OrderCard({
  order,
  expanded,
  onToggleExpand,
  returnInfo,
  isReviewed,
  isCancelling,
  onCancel,
  onRequestReturn,
  onViewReturn,
  onWriteReview,
  onPayBalance,
  onViewProof,
}: OrderCardProps) {
  const router = useRouter();
  const addItem = useCartStore(s => s.addItem);
  const isCOD = order.payment_method === "cod";
  const STEPS = isCOD ? STEPS_COD : STEPS_DEFAULT;
  const cfg = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  const date = new Date(order.created_at).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
  // For COD, "paid" status never happens — map it to processing index for progress
  const activeIdx = STEPS.findIndex(s => s.key === order.status);
  const address = [order.shipping_street, order.shipping_barangay, order.shipping_city, order.shipping_province].filter(Boolean).join(", ");

  function handleReorder() {
    let added = 0;
    let skipped = 0;
    for (const item of order.order_items) {
      const product = item.products;
      const stock = product?.product_sizes?.find(s => s.size === item.size)?.stock ?? 0;
      if (!product?.id || !product.is_published || stock <= 0) {
        skipped++;
        continue;
      }
      const cartProduct: Product = {
        id: product.id,
        name: product.name ?? item.product_name,
        slug: product.slug ?? "",
        brand: product.brand ?? "",
        sku: product.sku,
        gender: product.gender ?? "unisex",
        status: (product.status as Product["status"]) ?? "on-hand",
        srp_price: product.srp_price ?? 0,
        downpayment_price: product.downpayment_price ?? 0,
        full_payment_price: product.full_payment_price ?? 0,
        images: product.images ?? undefined,
        bg: product.bg ?? undefined,
        sizes: product.product_sizes ?? [],
        is_featured: product.is_featured ?? false,
        is_trending: product.is_trending ?? false,
        is_new: product.is_new ?? false,
      };
      const paymentType = item.payment_type === "downpayment" ? "downpayment" : "full_payment";
      addItem(cartProduct, item.size, paymentType, item.quantity);
      added++;
    }
    if (added === 0) {
      toast.error("None of these items are available anymore");
      return;
    }
    toast.success(
      skipped > 0
        ? `Added ${added} item${added === 1 ? "" : "s"} to cart. Skipped ${skipped} unavailable item${skipped === 1 ? "" : "s"}.`
        : `Added ${added} item${added === 1 ? "" : "s"} to cart`
    );
    router.push("/cart");
  }

  return (
    <div className="rounded-xl overflow-hidden bg-paper-2 border border-line">

      {/* Order header — always visible, click to expand/collapse */}
      <button type="button" onClick={onToggleExpand} aria-expanded={expanded}
        className="w-full text-left px-5 pt-5 pb-4 border-b border-line transition-colors hover:bg-ink/[3%]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-black text-sm text-ink">{order.order_number}</p>
            <p className="text-xs mt-0.5 text-ink-2">{date}</p>
            {(order.customer_name || order.customer_mobile) && (
              <p className="text-xs mt-1 text-ink-2">
                {[order.customer_name, order.customer_mobile].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
          <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full shrink-0"
            style={{ background: cfg.bg, color: cfg.color }}>
            <Icon className="w-3 h-3" />
            {order.status === "delivered" && isCOD ? "Delivered / Collected" : cfg.label}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 mt-3">
          <p className="font-black text-sm text-ink">Total ₱{Number(order.total).toLocaleString()}</p>
          <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="w-4 h-4 text-ink-3" />
          </motion.span>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE_SMOOTH }}
            className="overflow-hidden">

            {/* Progress tracker */}
            {order.status !== "cancelled" && (
              <div className="px-5 py-5 border-b border-line">
                <div className="flex items-center">
                  {STEPS.map((step, i) => {
                    const done = activeIdx >= i;
                    const active = activeIdx === i;
                    return (
                      <div key={step.key} className="flex items-center flex-1 min-w-0">
                        <div className="flex flex-col items-center flex-1">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black mb-1.5 shrink-0 transition-all ${
                            active ? "bg-ink text-white shadow-[0_0_0_3px_rgba(91,184,180,0.15)]" : done ? "bg-ink/[33%] text-white" : "bg-line text-ink-3"
                          }`}>
                            {done && !active ? "✓" : i + 1}
                          </div>
                          <p className={`text-[9px] font-bold text-center whitespace-nowrap px-0.5 ${
                            active ? "text-ink" : done ? "text-ink/90" : "text-ink-3"
                          }`}>
                            {step.label}
                          </p>
                        </div>
                        {i < STEPS.length - 1 && (
                          <div className={`h-0.5 flex-1 mx-0.5 mb-5 shrink-0 transition-all ${activeIdx > i ? "bg-ink" : "bg-line"}`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tracking card — shown when shipped or delivered */}
            {order.tracking_number && (order.status === "shipped" || order.status === "delivered") && (
              <div className="mx-5 my-4 p-4 rounded-lg bg-ink/[6%] border border-ink/[19%]">
                <div className="flex items-center gap-3 mb-2">
                  <Truck className="w-5 h-5 shrink-0 text-ink" />
                  <p className="text-xs font-bold uppercase tracking-wide text-ink">Your order is on its way</p>
                </div>
                <p className="text-xs text-ink-2">Here&apos;s your tracking number:</p>
                <p className="text-base font-black mt-1 text-ink">{order.tracking_number}</p>
                <p className="text-[11px] mt-2 text-ink-2">
                  Copy and paste to{" "}
                  <a href="https://www.jtexpress.ph/track-and-trace" target="_blank" rel="noopener noreferrer"
                    className="underline font-semibold text-ink">
                    https://www.jtexpress.ph/track-and-trace
                  </a>
                </p>
              </div>
            )}

            {/* Shipping address */}
            {address && (
              <div className="px-5 pb-4 flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-ink-3" />
                <p className="text-xs text-ink-2">{address}</p>
              </div>
            )}

            {/* Items */}
            <div className="border-t border-line">
              {order.order_items?.map((item, i) => {
                const img = item.products?.images?.[0] ?? null;
                const bg = item.products?.bg ?? "#EDE9E3";
                return (
                  <div key={i} className="flex items-center gap-3 px-5 py-3 border-b border-line">
                    {item.products?.slug ? (
                      <Link href={`/shop/${item.products.slug}`} className="w-11 h-11 shrink-0 rounded-lg overflow-hidden relative transition-opacity hover:opacity-70 border border-line"
                        style={{ background: bg }}>
                        {img ? (
                          <Image src={img} alt={item.product_name} fill className="object-cover" sizes="44px" />
                        ) : (
                          <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-ink opacity-[0.12] font-display">
                            S
                          </span>
                        )}
                      </Link>
                    ) : (
                      <div className="w-11 h-11 shrink-0 rounded-lg overflow-hidden relative border border-line"
                        style={{ background: bg }}>
                        {img ? (
                          <Image src={img} alt={item.product_name} fill className="object-cover" sizes="44px" />
                        ) : (
                          <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-ink opacity-[0.12] font-display">
                            S
                          </span>
                        )}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      {item.products?.slug ? (
                        <Link href={`/shop/${item.products.slug}`} className="text-sm font-semibold truncate block transition-opacity hover:opacity-70 text-ink">{item.product_name}</Link>
                      ) : (
                        <p className="text-sm font-semibold truncate text-ink">{item.product_name}</p>
                      )}
                      <p className="text-xs text-ink-2">Size {item.size} · Qty {item.quantity}</p>
                    </div>
                    <p className="font-bold text-sm shrink-0 text-ink">
                      ₱{(item.unit_price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Order breakdown + actions */}
            <div className="px-5 py-4 border-t border-line">
              {/* Price breakdown */}
              {(order.subtotal !== undefined) && (() => {
                const dpItems = order.order_items.filter(i => i.payment_type === "downpayment");
                const isOrderDP = dpItems.length > 0;
                const dpItemsBalance = dpItems.reduce((s, i) => s + (i.unit_price - DP_RESERVE_FEE) * i.quantity, 0);
                const dpItemsNow = dpItems.reduce((s, i) => s + DP_RESERVE_FEE * i.quantity, 0);
                const totalNow = dpItemsNow + (order.shipping_fee ?? 0) - (order.discount ?? 0);
                return (
                  <div className="space-y-1 mb-3 text-xs text-ink-2">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>₱{Number(order.subtotal).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span className={order.shipping_fee === 0 ? "text-ink" : undefined}>
                        {order.shipping_fee === 0 ? "FREE" : `₱${Number(order.shipping_fee).toLocaleString()}`}
                      </span>
                    </div>
                    {(order.discount ?? 0) > 0 && (
                      <div className="flex justify-between text-ink">
                        <span>Coupon {order.coupon_code ? `(${order.coupon_code})` : ""}</span>
                        <span>−₱{Number(order.discount).toLocaleString()}</span>
                      </div>
                    )}
                    {isOrderDP ? (
                      <>
                        <div className="flex justify-between pt-1 font-bold text-ink">
                          <span>Downpayment Paid</span>
                          <span className="text-ink">₱{totalNow.toLocaleString()}</span>
                        </div>
                        <div className={`flex justify-between ${order.status === "stock_on_hand" ? "text-state-error" : "text-ink-2"}`}>
                          <span>Balance Due</span>
                          <span>₱{dpItemsBalance.toLocaleString()}</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between pt-1 font-bold text-ink">
                        <span>Total</span>
                        <span>₱{Number(order.total).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="space-y-3">
                {/* Payment info row */}
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="text-xs text-ink-2">
                    {isCOD ? "Cash on Delivery" : order.payment_method?.replace("_", " ")}
                  </p>
                  {order.payment_reference && (
                    <p className="text-xs font-medium text-ink-2">
                      Ref: <span className="text-ink">{order.payment_reference}</span>
                    </p>
                  )}
                  {!isCOD && order.proof_of_payment && (
                    <button onClick={onViewProof}
                      className="flex items-center gap-1 text-xs font-semibold transition-opacity hover:opacity-70 text-ink">
                      <Eye className="w-3.5 h-3.5" /> View Proof
                    </button>
                  )}
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent("open-chat"))}
                    className="flex items-center gap-1 text-xs font-semibold transition-opacity hover:opacity-70 text-ink">
                    <MessageCircle className="w-3.5 h-3.5" /> Need help?
                  </button>
                </div>
                {/* Total + action buttons row */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Pay Balance button for stock_on_hand DP orders */}
                    {order.status === "stock_on_hand" && order.order_items.some(i => i.payment_type === "downpayment") && (
                      <button onClick={onPayBalance}
                        className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wide px-4 py-2 transition-opacity hover:opacity-80 rounded bg-ink text-white">
                        Pay Balance
                      </button>
                    )}
                    {order.status === "pending" && isCOD && (
                      <button
                        onClick={onCancel}
                        disabled={isCancelling}
                        className="text-xs font-bold uppercase tracking-wide px-3 py-1.5 transition-opacity disabled:opacity-50 border border-state-error text-state-error">
                        {isCancelling ? "Cancelling…" : "Cancel Order"}
                      </button>
                    )}
                    {order.status === "delivered" && !returnInfo && order.payment_type !== "downpayment" && (
                      isReturnWindowOpen(order.delivered_at, order.created_at) ? (
                        <button
                          onClick={onRequestReturn}
                          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide px-3 py-1.5 transition-opacity hover:opacity-70 border border-line text-ink-2">
                          <RotateCcw className="w-3 h-3" />
                          Request Return
                        </button>
                      ) : (
                        <span className="text-xs text-ink-3">Return window has expired</span>
                      )
                    )}
                    {order.status === "delivered" && returnInfo && (
                      <button
                        onClick={onViewReturn}
                        className={`text-xs font-bold uppercase tracking-wide px-3 py-1.5 transition-opacity hover:opacity-70 border ${
                          returnInfo.status === "approved" ? "border-[#10B981] text-[#10B981] bg-[rgba(16,185,129,0.08)]"
                            : returnInfo.status === "denied" ? "border-state-error text-state-error bg-state-error/[3%]"
                            : "border-line text-ink-2 bg-transparent"
                        }`}>
                        View Request
                      </button>
                    )}
                    {order.status === "delivered" && (
                      <button
                        onClick={onWriteReview}
                        className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide px-3 py-1.5 transition-opacity hover:opacity-70 border border-ink text-ink">
                        <Star className="w-3 h-3" />
                        {isReviewed ? "Edit Review" : "Write a Review"}
                      </button>
                    )}
                    {order.status === "delivered" && (
                      <button
                        onClick={handleReorder}
                        className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide px-3 py-1.5 transition-opacity hover:opacity-70 border border-line text-ink-2">
                        <RefreshCw className="w-3 h-3" />
                        Reorder
                      </button>
                    )}
                  </div>
                  <p className="font-black text-sm shrink-0 text-ink">
                    Total ₱{Number(order.total).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

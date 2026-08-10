"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { X, User, MapPin, Package, FileText, MessageCircle, ChevronDown, Check, Truck } from "lucide-react";
import { DP_RESERVE_FEE } from "@/lib/constants";
import OrderStatusBadge, { STATUS_META, statusMeta, type RealStatus } from "./OrderStatusBadge";
import OrderPaymentProof from "./OrderPaymentProof";
import OrderShippingForm from "./OrderShippingForm";

type OrderItem = {
  product_name: string; brand: string; size: string; quantity: number; unit_price: number; payment_type: string;
  products: { images: string[] | null; bg: string | null } | null;
};
type Order = {
  id: string; order_number: string; customer_name: string; customer_email: string; customer_mobile: string;
  shipping_street: string; shipping_barangay: string; shipping_city: string; shipping_province: string;
  total: number; payment_method: string; payment_type: string; status: string; tracking_number: string | null;
  proof_of_payment: string | null; payment_reference: string | null; shipping_fee: number | null;
  balance_reference: string | null; balance_proof_url: string | null; balance_paid_at: string | null;
  balance_payment_method: string | null; admin_notes: string | null; created_at: string; order_items: OrderItem[];
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function getStatusPath(order: Order, isCOD: boolean): RealStatus[] {
  if (isCOD) return ["pending", "processing", "shipped", "delivered"];
  if (order.payment_type === "downpayment") return ["pending", "paid", "stock_on_hand", "processing", "shipped", "delivered"];
  return ["pending", "paid", "processing", "shipped", "delivered"];
}

export default function OrderDetailDrawer({
  order, onClose, isCOD, nextAction, saving, autoOpen,
  notesInput, onNotesInputChange, onSaveNotes,
  onAdvanceStatus, onShip, onStatusSelect, onApprovePayment, onCancelOrder,
}: {
  order: Order; onClose: () => void; isCOD: boolean;
  nextAction: { label: string; next: string } | null; saving: boolean; autoOpen?: "ship" | "cancel" | null;
  notesInput: string; onNotesInputChange: (v: string) => void; onSaveNotes: () => void;
  onAdvanceStatus: () => void; onShip: (trackingNumber: string) => void;
  onStatusSelect: (status: string) => void; onApprovePayment: () => void; onCancelOrder: (reason: string) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [dpOpen, setDpOpen] = useState(false);
  const [balanceOpen, setBalanceOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [shipModalOpen, setShipModalOpen] = useState(autoOpen === "ship");
  const [shipDraft, setShipDraft] = useState(order.tracking_number ?? "");
  const [cancelModalOpen, setCancelModalOpen] = useState(autoOpen === "cancel");
  const [cancelReason, setCancelReason] = useState("");
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target as Node)) setStatusDropdownOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const balanceLocked = !!nextAction && order.payment_type === "downpayment" && !order.balance_paid_at
    && (nextAction.next === "shipped" || nextAction.next === "delivered");
  const statusOptions = (Object.entries(STATUS_META) as [RealStatus, typeof STATUS_META[RealStatus]][]).filter(([k]) => !(isCOD && k === "paid"));
  const statusPath = getStatusPath(order, isCOD);
  const currentStepIdx = statusPath.indexOf(order.status as RealStatus);

  const isDP = order.payment_type === "downpayment";
  const dpItems = order.order_items.filter(i => i.payment_type === "downpayment");
  const dpTotal = dpItems.reduce((s, i) => s + Number(i.unit_price) * i.quantity, 0);
  const balance = isDP ? dpTotal - DP_RESERVE_FEE * dpItems.reduce((s, i) => s + i.quantity, 0) : 0;
  const orderDate = new Date(order.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
  const balanceDate = order.balance_paid_at ? new Date(order.balance_paid_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-ink/40 transition-opacity duration-admin-base ${mounted ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed z-50 bg-paper flex flex-col
          inset-0 sm:inset-auto sm:right-0 sm:top-0 sm:bottom-0 sm:w-[520px] sm:border-l sm:border-line sm:shadow-xl
          transition-transform duration-200 ease-smooth ${mounted ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 shrink-0 border-b border-line bg-paper-2">
          <div>
            <p className="text-admin-sm font-bold text-ink">{order.order_number}</p>
            <p className="text-admin-micro text-ink-3 mt-0.5">{formatDate(order.created_at)}</p>
          </div>
          <div className="flex items-center gap-3">
            <OrderStatusBadge status={order.status} codDelivered={isCOD} />
            <button onClick={onClose} className="p-1.5 rounded-md hover:bg-admin-row-hover transition-colors duration-admin-fast">
              <X className="w-4 h-4 text-ink-3" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 divide-y divide-line">

          {/* Status timeline */}
          {order.status !== "cancelled" && (
            <div className="px-5 py-4">
              <div className="flex items-center">
                {statusPath.map((s, i) => {
                  const meta = STATUS_META[s];
                  const done = i <= currentStepIdx;
                  return (
                    <div key={s} className="flex items-center flex-1 last:flex-none">
                      <div className="flex flex-col items-center gap-1.5 shrink-0">
                        <span className={`w-2 h-2 rounded-full ${done ? meta.dot : "bg-line-strong"}`} />
                        <span className={`text-admin-micro whitespace-nowrap ${done ? "text-ink-2" : "text-ink-3"}`}>{meta.label}</span>
                      </div>
                      {i < statusPath.length - 1 && (
                        <div className={`h-px flex-1 mx-1.5 -mt-4 ${i < currentStepIdx ? "bg-ink-3" : "bg-line-strong"}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Customer */}
          <div className="px-5 py-4">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-3.5 h-3.5 text-ink-3" />
              <p className="text-admin-eyebrow text-ink-3">Customer</p>
            </div>
            <p className="text-admin-sm font-semibold text-ink">{order.customer_name}</p>
            <p className="text-admin-sm text-ink-3 mt-0.5">{order.customer_email}</p>
            {order.customer_mobile && <p className="text-admin-sm text-ink-3 mt-0.5">{order.customer_mobile}</p>}
            <a href={`/admin/chat?email=${encodeURIComponent(order.customer_email)}`}
              className="inline-flex items-center gap-1.5 mt-2 text-admin-sm font-semibold text-ink-2 hover:text-ink transition-colors duration-admin-fast">
              <MessageCircle className="w-3.5 h-3.5" /> Chat with Customer
            </a>
          </div>

          {/* Shipping */}
          <div className="px-5 py-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-3.5 h-3.5 text-ink-3" />
              <p className="text-admin-eyebrow text-ink-3">Shipping Address</p>
            </div>
            <p className="text-admin-sm text-ink">
              {[order.shipping_street, order.shipping_barangay, order.shipping_city, order.shipping_province].filter(Boolean).join(", ")}
            </p>

            {(order.status === "processing" || order.status === "shipped") && (
              <div className="mt-3 pt-3 border-t border-line">
                <div className="flex items-center gap-2 mb-2">
                  <Truck className="w-3.5 h-3.5 text-ink-3" />
                  <p className="text-admin-eyebrow text-ink-3">Tracking Number</p>
                </div>
                {order.tracking_number ? (
                  <div className="flex items-center justify-between">
                    <span className="text-admin-sm font-semibold text-ink">{order.tracking_number}</span>
                    <button type="button" onClick={() => { setShipDraft(order.tracking_number ?? ""); setShipModalOpen(true); }}
                      className="text-admin-sm font-semibold text-ink-2 hover:text-ink transition-colors duration-admin-fast">
                      Edit
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => { setShipDraft(""); setShipModalOpen(true); }}
                    className="text-admin-sm font-semibold px-3 py-1.5 rounded-md border border-line text-ink-2 hover:border-line-strong transition-colors duration-admin-fast">
                    + Add Tracking Number
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Items */}
          <div className="px-5 py-4">
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-3.5 h-3.5 text-ink-3" />
              <p className="text-admin-eyebrow text-ink-3">Items</p>
            </div>
            <div className="space-y-3">
              {order.order_items.map((item, i) => {
                const img = item.products?.images?.[0] ?? null;
                const bg = item.products?.bg ?? "#EDE9E3";
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-12 h-12 shrink-0 rounded-md overflow-hidden relative border border-line" style={{ background: bg }}>
                      {img ? (
                        <Image src={img} alt={item.product_name} fill className="object-cover" sizes="48px" />
                      ) : (
                        <span className="absolute inset-0 flex items-center justify-center text-admin-sm font-semibold text-ink/15">
                          {item.brand.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-admin-sm font-medium text-ink truncate">{item.product_name}</p>
                      <p className="text-admin-micro text-ink-3">
                        {item.brand} · {item.size} · x{item.quantity}
                        {item.payment_type === "downpayment" && (
                          <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-ink/8 text-ink-2">DP</span>
                        )}
                      </p>
                    </div>
                    <span className="text-admin-sm font-semibold shrink-0 text-ink">
                      ₱{(Number(item.unit_price) * item.quantity).toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>

            {!isDP ? (
              <div className="mt-3 pt-3 border-t border-line space-y-1 text-admin-sm">
                {Number(order.shipping_fee ?? 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-ink-3">Delivery Fee</span>
                    <span className="text-ink">₱{Number(order.shipping_fee).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-admin-lg pt-1">
                  <span className="text-ink">Total</span>
                  <span className="text-ink">₱{Number(order.total).toLocaleString()}</span>
                </div>
              </div>
            ) : (
              <div className="mt-3 pt-3 border-t border-line space-y-1.5 text-admin-sm">
                <div className="flex justify-between">
                  <span className="text-ink-3">Downpayment Paid</span>
                  <div className="text-right">
                    <span className="font-semibold text-ink">₱{DP_RESERVE_FEE.toLocaleString()}</span>
                    <span className="block text-admin-micro text-ink-3">{orderDate}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-3">Balance Due</span>
                  <div className="text-right">
                    <span className={`font-semibold ${balanceDate ? "text-state-onhand" : "text-state-error"}`}>₱{balance.toLocaleString()}</span>
                    <span className="block text-admin-micro text-ink-3">{balanceDate ? `Paid · ${balanceDate}` : "Pending"}</span>
                  </div>
                </div>
                {Number(order.shipping_fee ?? 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-ink-3">Delivery Fee</span>
                    <span className="text-ink">₱{Number(order.shipping_fee).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1.5 border-t border-line font-bold text-admin-lg">
                  <span className="text-ink">Total</span>
                  <span className="text-ink">₱{Number(order.total).toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>

          {/* Payment proof */}
          <OrderPaymentProof
            order={order}
            dpOpen={dpOpen} onToggleDp={() => setDpOpen(o => !o)}
            balanceOpen={balanceOpen} onToggleBalance={() => setBalanceOpen(o => !o)}
            onApprove={onApprovePayment} saving={saving}
          />

          {/* Admin notes */}
          <div className="px-5 py-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-3.5 h-3.5 text-ink-3" />
              <p className="text-admin-eyebrow text-ink-3">Admin Notes</p>
            </div>
            <textarea
              value={notesInput}
              onChange={e => onNotesInputChange(e.target.value)}
              rows={2}
              placeholder="Internal notes (not visible to customers)…"
              className="w-full px-3 py-2 text-admin-sm bg-paper border border-line rounded-md text-ink focus:outline-none focus:border-line-strong resize-none transition-colors duration-admin-fast"
            />
            <button onClick={onSaveNotes} disabled={saving || notesInput === (order.admin_notes ?? "")}
              className="mt-2 px-3 py-1.5 text-admin-sm font-semibold rounded-md bg-ink text-paper hover:opacity-90 disabled:opacity-40 transition-opacity duration-admin-fast">
              Save Note
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 shrink-0 space-y-2.5 border-t border-line bg-paper-2">
          {nextAction && (
            <button
              onClick={() => {
                if (nextAction.next === "shipped") { setShipDraft(order.tracking_number ?? ""); setShipModalOpen(true); }
                else onAdvanceStatus();
              }}
              disabled={saving || balanceLocked}
              className="w-full py-3 text-admin-sm font-semibold uppercase tracking-wide rounded-md bg-ink text-paper hover:opacity-90 disabled:opacity-50 transition-opacity duration-admin-fast">
              {balanceLocked ? "Balance Not Yet Paid — Cannot Ship" : saving ? "Saving…" : nextAction.label}
            </button>
          )}

          <div className="flex gap-2">
            <div className="relative flex-1" ref={statusDropdownRef}>
              <button type="button" onClick={() => setStatusDropdownOpen(o => !o)}
                className="w-full flex items-center justify-between px-3 py-2.5 text-admin-sm font-medium bg-paper border border-line rounded-md text-ink focus:outline-none">
                <span>{isCOD && order.status === "delivered" ? "Delivered / Cash Collected" : statusMeta(order.status).label}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-ink-3 transition-transform duration-admin-fast ${statusDropdownOpen ? "rotate-180" : ""}`} />
              </button>
              {statusDropdownOpen && (
                <div className="absolute left-0 right-0 bottom-full mb-1 z-30 bg-paper border border-line rounded-md shadow-lg overflow-hidden">
                  {statusOptions.map(([k, v]) => {
                    const needsTracking = (k === "shipped" || k === "delivered") && !order.tracking_number && !isCOD;
                    const balanceLockedOpt = (k === "shipped" || k === "delivered") && order.payment_type === "downpayment" && !order.balance_paid_at;
                    const disabled = needsTracking || balanceLockedOpt;
                    return (
                      <button key={k} type="button" disabled={disabled}
                        onClick={() => {
                          if (k === "shipped" && !order.tracking_number) { setShipDraft(""); setShipModalOpen(true); }
                          else onStatusSelect(k);
                          setStatusDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 text-admin-sm text-left transition-colors duration-admin-fast disabled:opacity-40 ${
                          order.status === k ? "bg-admin-row-hover text-ink font-semibold" : "text-ink-2 hover:bg-admin-row-hover"
                        }`}>
                        <div className="flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${v.dot}`} />
                          {k === "delivered" && isCOD ? "Delivered / Cash Collected" : v.label}
                          {needsTracking && <span className="text-state-error">(add tracking first)</span>}
                          {balanceLockedOpt && <span className="text-state-error">(balance unpaid)</span>}
                        </div>
                        {order.status === k && <Check className="w-3 h-3 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            {order.status !== "cancelled" && order.status !== "delivered" && (
              <button onClick={() => setCancelModalOpen(true)} disabled={saving}
                className="px-4 py-2.5 text-admin-sm font-semibold rounded-md border border-state-error text-state-error hover:bg-state-error/5 disabled:opacity-50 transition-colors duration-admin-fast">
                Cancel Order
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Ship confirmation modal */}
      {shipModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-ink/50"
          onClick={e => { if (e.target === e.currentTarget) setShipModalOpen(false); }}>
          <div className="w-full max-w-sm rounded-md overflow-hidden bg-paper border border-line">
            <div className="px-5 py-4 border-b border-line bg-paper-2">
              <p className="text-admin-sm font-bold uppercase tracking-wide text-ink">Mark as Shipped</p>
              <p className="text-admin-micro text-ink-3 mt-0.5">{order.order_number}</p>
            </div>
            <div className="p-5">
              <OrderShippingForm
                value={shipDraft}
                onChange={setShipDraft}
                onSubmit={() => { onShip(shipDraft.trim()); setShipModalOpen(false); }}
                onCancel={() => setShipModalOpen(false)}
                submitLabel="Confirm & Ship"
                saving={saving}
                autoFocus
                helperText="Required to ship — customer will see this to track delivery."
              />
            </div>
          </div>
        </div>
      )}

      {/* Cancel reason modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-ink/50"
          onClick={e => { if (e.target === e.currentTarget) { setCancelModalOpen(false); setCancelReason(""); } }}>
          <div className="w-full max-w-sm rounded-md overflow-hidden bg-paper border border-line">
            <div className="px-5 py-4 border-b border-line bg-paper-2">
              <p className="text-admin-sm font-bold uppercase tracking-wide text-state-error">Cancel Order</p>
              <p className="text-admin-micro text-ink-3 mt-0.5">{order.order_number}</p>
            </div>
            <div className="p-5">
              <label className="block text-admin-eyebrow text-ink-3 mb-1.5">Reason for cancellation</label>
              <textarea
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="e.g. Customer requested, out of stock, duplicate order…"
                rows={3}
                autoFocus
                className="w-full px-3 py-2.5 text-admin-sm bg-paper border border-line rounded-md text-ink focus:outline-none resize-none"
              />
              <p className="text-admin-micro text-ink-3 mt-1.5">Optional — stored in admin notes</p>
            </div>
            <div className="flex gap-3 px-5 pb-5">
              <button onClick={() => { onCancelOrder(cancelReason); setCancelModalOpen(false); setCancelReason(""); }}
                className="flex-1 py-2.5 text-admin-sm font-semibold uppercase tracking-wide rounded-md bg-state-error text-paper hover:opacity-90 transition-opacity duration-admin-fast">
                Confirm Cancel
              </button>
              <button onClick={() => { setCancelModalOpen(false); setCancelReason(""); }}
                className="px-4 py-2.5 text-admin-sm font-medium rounded-md border border-line text-ink-2">
                Back
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

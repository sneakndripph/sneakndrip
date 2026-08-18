"use client";

import { ChevronDown, ExternalLink, CreditCard, Check } from "lucide-react";

const PAYMENT_LABELS: Record<string, string> = {
  gcash: "GCash", maya: "Maya", bank_transfer: "Bank Transfer", cod: "COD",
};

type Order = {
  order_number: string; status: string; created_at: string;
  payment_method: string; payment_type: string; payment_reference: string | null; proof_of_payment: string | null;
  balance_reference: string | null; balance_proof_url: string | null; balance_paid_at: string | null; balance_payment_method: string | null;
};

function proofUrl(order: Order) {
  return order.proof_of_payment
    ? `/api/admin/proof?path=${encodeURIComponent(order.proof_of_payment)}`
    : `/api/admin/proof?orderNumber=${encodeURIComponent(order.order_number)}`;
}

export default function OrderPaymentProof({
  order, dpOpen, onToggleDp, balanceOpen, onToggleBalance, onApprove, saving,
}: {
  order: Order; dpOpen: boolean; onToggleDp: () => void; balanceOpen: boolean; onToggleBalance: () => void;
  onApprove?: () => void; saving: boolean;
}) {
  const isDP = order.payment_type === "downpayment";
  const canApprove = !!onApprove && order.status === "pending" && order.payment_method !== "cod";

  return (
    <div>
      {/* Downpayment / payment section */}
      <div className="px-5 py-3.5">
        <button type="button" onClick={onToggleDp} className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-3.5 h-3.5 text-ink-3" />
            <p className="text-admin-eyebrow text-ink-3">{isDP ? "Downpayment" : "Payment"}</p>
          </div>
          <div className="flex items-center gap-2">
            {!dpOpen && <span className="text-admin-sm text-ink-3">{PAYMENT_LABELS[order.payment_method] ?? order.payment_method}</span>}
            <ChevronDown className={`w-3.5 h-3.5 text-ink-3 transition-transform duration-admin-fast ${dpOpen ? "rotate-180" : ""}`} />
          </div>
        </button>
        {dpOpen && (
          <div className="mt-3 space-y-3">
            <div className="space-y-1 text-admin-sm">
              <div className="flex justify-between">
                <span className="text-ink-3">Mode of payment</span>
                <span className="font-medium text-ink">{PAYMENT_LABELS[order.payment_method] ?? order.payment_method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-3">Ref num</span>
                <span className="font-medium text-ink">{order.payment_reference ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-3">Submitted</span>
                <span className="text-ink">
                  {new Date(order.created_at).toLocaleString("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>

            {order.payment_method !== "cod" ? (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-admin-eyebrow text-ink-3">Proof image</p>
                  <a href={proofUrl(order)} target="_blank" rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-admin-micro font-semibold text-ink-2 hover:text-ink transition-colors duration-admin-fast">
                    <ExternalLink className="w-3 h-3" /> Open Full
                  </a>
                </div>
                <div className="rounded-md overflow-hidden border border-line bg-paper-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={proofUrl(order)} alt="Proof of payment" className="w-full object-contain max-h-64"
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                </div>
              </div>
            ) : (
              <p className="text-admin-sm px-3 py-2 rounded-md bg-paper-2 text-ink-3">
                Cash on Delivery — no proof required
              </p>
            )}

            {canApprove && (
              <button type="button" onClick={onApprove} disabled={saving}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 text-admin-sm font-semibold rounded-md bg-state-onhand text-paper hover:opacity-90 transition-opacity duration-admin-fast disabled:opacity-50">
                <Check className="w-3.5 h-3.5" /> Approve Payment
              </button>
            )}
          </div>
        )}
      </div>

      {/* Balance payment section — DP orders only */}
      {isDP && (
        <div className="px-5 py-3.5 border-t border-line">
          <button type="button" onClick={onToggleBalance} className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className={`w-3.5 h-3.5 ${order.balance_paid_at ? "text-state-onhand" : "text-state-error"}`} />
              <p className="text-admin-eyebrow text-ink-3">Balance Payment</p>
            </div>
            <div className="flex items-center gap-2">
              {!balanceOpen && (
                <span className={`text-admin-sm font-medium ${order.balance_paid_at ? "text-state-onhand" : "text-state-error"}`}>
                  {order.balance_paid_at ? "Paid" : "Pending"}
                </span>
              )}
              <ChevronDown className={`w-3.5 h-3.5 text-ink-3 transition-transform duration-admin-fast ${balanceOpen ? "rotate-180" : ""}`} />
            </div>
          </button>
          {balanceOpen && (
            <div className="mt-3">
              {order.balance_reference ? (
                <div className="space-y-3">
                  <div className="space-y-1 text-admin-sm">
                    <div className="flex justify-between">
                      <span className="text-ink-3">Mode of payment</span>
                      <span className="font-medium text-ink">
                        {order.balance_payment_method ? (PAYMENT_LABELS[order.balance_payment_method] ?? order.balance_payment_method) : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-3">Ref num</span>
                      <span className="font-medium text-ink">{order.balance_reference}</span>
                    </div>
                    {order.balance_paid_at && (
                      <div className="flex justify-between">
                        <span className="text-ink-3">Submitted</span>
                        <span className="text-ink">
                          {new Date(order.balance_paid_at).toLocaleString("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    )}
                  </div>
                  {order.balance_proof_url && (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-admin-eyebrow text-ink-3">Proof image</p>
                        <a href={`/api/admin/proof?path=${encodeURIComponent(order.balance_proof_url)}`}
                          target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-admin-micro font-semibold text-ink-2 hover:text-ink transition-colors duration-admin-fast">
                          <ExternalLink className="w-3 h-3" /> Open Full
                        </a>
                      </div>
                      <div className="rounded-md overflow-hidden border border-line bg-paper-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`/api/admin/proof?path=${encodeURIComponent(order.balance_proof_url)}`} alt="Balance proof"
                          className="w-full object-contain max-h-64"
                          onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-admin-sm px-3 py-2 rounded-md bg-paper-2 text-state-error">
                  No balance payment submitted yet
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

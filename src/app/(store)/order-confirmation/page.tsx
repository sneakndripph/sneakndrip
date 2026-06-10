"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle, Package, MessageCircle } from "lucide-react";
import { BRAND, FONTS } from "@/lib/constants";

type OrderData = {
  orderNumber: string;
  total: number;
  isCOD: boolean;
  paymentMethod: string;
  name: string;
  items: { name: string; size: string; quantity: number; price: number }[];
};

const PAYMENT_LABELS: Record<string, string> = {
  gcash: "GCash", maya: "Maya", bank_transfer: "Bank Transfer", cod: "Cash on Delivery",
};

export default function OrderConfirmationPage() {
  const [order, setOrder] = useState<OrderData | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("lastOrder");
    if (stored) {
      setOrder(JSON.parse(stored));
      sessionStorage.removeItem("lastOrder");
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-20"
      style={{ background: BRAND.bg, fontFamily: FONTS.body }}>
      <div className="max-w-md w-full">
        {/* Success icon */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: `${BRAND.teal}18` }}>
            <CheckCircle className="w-10 h-10" style={{ color: BRAND.teal }} />
          </div>
          <h1 style={{ fontFamily: FONTS.display, fontSize: "3rem", color: BRAND.black, letterSpacing: "0.04em" }}>
            ORDER PLACED!
          </h1>
          {order && (
            <>
              <p className="text-sm mt-2 mb-1" style={{ color: BRAND.muted }}>Order Number</p>
              <p style={{ fontFamily: FONTS.display, fontSize: "1.4rem", color: BRAND.teal }}>{order.orderNumber}</p>
            </>
          )}
        </div>

        {/* Order details */}
        {order && (
          <div className="rounded-xl overflow-hidden mb-5"
            style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            {/* Items */}
            <div className="p-5" style={{ borderBottom: `1px solid ${BRAND.border}` }}>
              <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: BRAND.muted }}>Your Order</p>
              <div className="space-y-2">
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span style={{ color: BRAND.black }}>{item.name} <span style={{ color: BRAND.muted }}>· {item.size} x{item.quantity}</span></span>
                    <span className="font-semibold" style={{ color: BRAND.black }}>₱{item.price.toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-black mt-3 pt-3" style={{ borderTop: `1px solid ${BRAND.border}` }}>
                <span style={{ color: BRAND.black }}>Total</span>
                <span style={{ fontFamily: FONTS.display, fontSize: "1.1rem", color: BRAND.black }}>
                  ₱{order.total.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Payment info */}
            <div className="p-5">
              <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: BRAND.muted }}>Payment</p>
              <p className="text-sm font-semibold mb-3" style={{ color: BRAND.black }}>
                {PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}
              </p>

              {order.isCOD ? (
                <div className="p-3 rounded-lg text-sm leading-relaxed" style={{ background: `${BRAND.teal}10`, color: BRAND.black }}>
                  Your order is confirmed! Our team will contact you before delivery to confirm details. Prepare the exact amount upon arrival.
                </div>
              ) : (
                <div className="p-3 rounded-lg text-sm leading-relaxed" style={{ background: `${BRAND.teal}10`, color: BRAND.black }}>
                  We&apos;ve received your proof of payment. We&apos;ll verify and confirm your order via email within 1–2 hours.
                </div>
              )}
            </div>
          </div>
        )}

        {/* No session data fallback */}
        {!order && (
          <div className="text-center mb-6">
            <p className="text-sm leading-relaxed" style={{ color: BRAND.muted }}>
              Your order has been placed. Check your email for confirmation details.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <Link href="/account"
            className="flex items-center justify-center gap-2 w-full py-4 font-bold text-sm uppercase tracking-widest"
            style={{ background: BRAND.black, color: BRAND.bg }}>
            <Package className="w-4 h-4" /> Track My Order
          </Link>
          <Link href="/shop"
            className="flex items-center justify-center gap-2 w-full py-4 font-bold text-sm uppercase tracking-widest"
            style={{ border: `1.5px solid ${BRAND.border}`, color: BRAND.black }}>
            Continue Shopping
          </Link>
          <a href="https://m.me/sneakndrip"
            className="flex items-center justify-center gap-2 w-full py-3 text-sm font-semibold transition-opacity hover:opacity-70"
            style={{ color: BRAND.muted }}>
            <MessageCircle className="w-4 h-4" /> Message us on Facebook
          </a>
        </div>
      </div>
    </div>
  );
}

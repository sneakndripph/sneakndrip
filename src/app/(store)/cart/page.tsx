"use client";

import Link from "next/link";
import { useCartStore } from "@/store/cartStore";
import { BRAND, FONTS, SHIPPING_FEE } from "@/lib/constants";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal } = useCartStore();
  const sub = subtotal();
  const shipping = sub >= SHIPPING_FEE.free_threshold ? 0 : SHIPPING_FEE.metro_manila;
  const total = sub + shipping;

  if (items.length === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4"
        style={{ background: BRAND.bg, fontFamily: FONTS.body }}>
        <ShoppingBag className="w-16 h-16 mb-5" style={{ color: BRAND.mutedLight }} />
        <h2 style={{ fontFamily: FONTS.display, fontSize: "2.5rem", color: BRAND.black, letterSpacing: "0.04em" }}>
          YOUR CART IS EMPTY
        </h2>
        <p className="text-sm mt-2 mb-8" style={{ color: BRAND.muted }}>Looks like you haven't added anything yet.</p>
        <Link href="/shop"
          className="px-8 py-4 font-bold text-sm uppercase tracking-widest transition-opacity hover:opacity-80"
          style={{ background: BRAND.black, color: BRAND.bg }}>
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div style={{ background: BRAND.bg, fontFamily: FONTS.body, minHeight: "80vh" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="mb-8" style={{ fontFamily: FONTS.display, fontSize: "3rem", letterSpacing: "0.04em", color: BRAND.black }}>
          YOUR CART
        </h1>

        <div className="grid lg:grid-cols-3 gap-8 items-start">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map(item => (
              <div key={`${item.product.id}-${item.size}`}
                className="p-5 rounded-xl flex gap-5"
                style={{ background: BRAND.card, border: `1px solid ${BRAND.cardBorder}` }}>
                {/* Image */}
                <div className="w-20 h-20 shrink-0 rounded-lg flex items-center justify-center"
                  style={{ background: item.product.bg || BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                  <span style={{ fontFamily: FONTS.display, color: BRAND.black, opacity: 0.06, fontSize: "1.5rem" }}>
                    {item.product.brand.charAt(0)}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: BRAND.muted }}>{item.product.brand}</p>
                      <h3 className="font-semibold text-sm leading-snug" style={{ color: BRAND.black }}>{item.product.name}</h3>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs px-2 py-0.5 font-medium"
                          style={{ border: `1px solid ${BRAND.border}`, color: BRAND.muted }}>
                          {item.size}
                        </span>
                        <span className="text-xs px-2 py-0.5 font-semibold"
                          style={{ background: item.payment_type === "full_payment" ? `${BRAND.teal}15` : `${BRAND.red}12`, color: item.payment_type === "full_payment" ? BRAND.teal : BRAND.red }}>
                          {item.payment_type === "full_payment" ? "Full Payment" : "Downpayment"}
                        </span>
                      </div>
                    </div>
                    <p className="font-black shrink-0" style={{ fontFamily: FONTS.display, fontSize: "1.3rem", color: BRAND.black }}>
                      ₱{(item.unit_price * item.quantity).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    {/* Qty control */}
                    <div className="flex items-center gap-0" style={{ border: `1px solid ${BRAND.border}` }}>
                      <button onClick={() => updateQuantity(item.product.id, item.size, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center transition-colors hover:opacity-60"
                        style={{ color: BRAND.black }}>
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-10 text-center text-sm font-bold" style={{ color: BRAND.black }}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product.id, item.size, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center transition-colors hover:opacity-60"
                        style={{ color: BRAND.black }}>
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button onClick={() => removeItem(item.product.id, item.size)}
                      className="flex items-center gap-1 text-xs font-semibold transition-opacity hover:opacity-60"
                      style={{ color: BRAND.red }}>
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="rounded-xl overflow-hidden sticky top-24"
            style={{ background: BRAND.card, border: `1px solid ${BRAND.cardBorder}` }}>
            <div className="p-6">
              <h2 className="mb-5" style={{ fontFamily: FONTS.display, fontSize: "1.5rem", letterSpacing: "0.04em", color: BRAND.black }}>
                ORDER SUMMARY
              </h2>
              <div className="space-y-3 mb-5">
                <div className="flex justify-between text-sm">
                  <span style={{ color: BRAND.muted }}>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                  <span style={{ color: BRAND.black }}>₱{sub.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: BRAND.muted }}>Shipping</span>
                  <span style={{ color: shipping === 0 ? BRAND.teal : BRAND.black }}>
                    {shipping === 0 ? "FREE" : `₱${shipping}`}
                  </span>
                </div>
                {sub < SHIPPING_FEE.free_threshold && (
                  <p className="text-xs" style={{ color: BRAND.muted }}>
                    Add ₱{(SHIPPING_FEE.free_threshold - sub).toLocaleString()} more for free shipping
                  </p>
                )}
              </div>
              <div className="flex justify-between font-black py-4 mb-5"
                style={{ borderTop: `1px solid ${BRAND.border}`, borderBottom: `1px solid ${BRAND.border}` }}>
                <span style={{ color: BRAND.black }}>Total</span>
                <span style={{ fontFamily: FONTS.display, fontSize: "1.5rem", color: BRAND.black }}>₱{total.toLocaleString()}</span>
              </div>
              <Link href="/checkout"
                className="flex items-center justify-center gap-2 w-full py-4 font-black text-sm uppercase tracking-widest transition-opacity hover:opacity-90"
                style={{ background: BRAND.black, color: BRAND.bg }}>
                Proceed to Checkout <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/shop"
                className="flex items-center justify-center mt-3 py-3 text-sm font-semibold transition-opacity hover:opacity-60"
                style={{ color: BRAND.muted }}>
                ← Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

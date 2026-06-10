"use client";

import { useState } from "react";
import { useCartStore } from "@/store/cartStore";
import { BRAND, FONTS, PAYMENT_METHODS, SHIPPING_FEE } from "@/lib/constants";
import { Upload, CheckCircle, AlertCircle, ChevronRight } from "lucide-react";

type Step = "details" | "payment" | "confirm";

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCartStore();
  const sub = subtotal();
  const shipping = sub >= SHIPPING_FEE.free_threshold ? 0 : SHIPPING_FEE.metro_manila;
  const total = sub + shipping;

  const [step, setStep] = useState<Step>("details");
  const [paymentMethod, setPaymentMethod] = useState<string>("gcash");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [form, setForm] = useState({ name: "", email: "", mobile: "", street: "", barangay: "", city: "", province: "", postal: "" });
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber] = useState(`SND-${Date.now().toString().slice(-8)}`);

  const isCOD = paymentMethod === "cod";

  function handlePlaceOrder() {
    clearCart();
    setOrderPlaced(true);
  }

  if (orderPlaced) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-20"
        style={{ background: BRAND.bg, fontFamily: FONTS.body }}>
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: `${BRAND.teal}18` }}>
            <CheckCircle className="w-10 h-10" style={{ color: BRAND.teal }} />
          </div>
          <h1 className="mb-3" style={{ fontFamily: FONTS.display, fontSize: "3rem", color: BRAND.black, letterSpacing: "0.04em" }}>
            ORDER PLACED!
          </h1>
          <p className="text-sm mb-2" style={{ color: BRAND.muted }}>Order Number:</p>
          <p className="font-black text-xl mb-5" style={{ color: BRAND.teal, fontFamily: FONTS.display, fontSize: "1.5rem" }}>
            {orderNumber}
          </p>
          <p className="text-sm mb-8 leading-relaxed" style={{ color: BRAND.muted }}>
            {isCOD
              ? "Your order is confirmed! We'll contact you on your mobile number before delivery."
              : "We've received your proof of payment. We'll verify and confirm your order via email shortly."}
          </p>
          <div className="space-y-3">
            <a href="/" className="block w-full py-4 font-bold text-sm uppercase tracking-widest text-center"
              style={{ background: BRAND.black, color: BRAND.bg }}>
              Back to Home
            </a>
            <a href="/account" className="block w-full py-4 font-bold text-sm uppercase tracking-widest text-center"
              style={{ border: `1.5px solid ${BRAND.border}`, color: BRAND.black }}>
              Track My Order
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: BRAND.bg, fontFamily: FONTS.body, minHeight: "100vh" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="mb-8" style={{ fontFamily: FONTS.display, fontSize: "3rem", letterSpacing: "0.04em", color: BRAND.black }}>
          CHECKOUT
        </h1>

        {/* Steps */}
        <div className="flex items-center gap-2 mb-10">
          {(["details", "payment", "confirm"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => step !== "confirm" && i < ["details","payment","confirm"].indexOf(step) + 1 && setStep(s)}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"
                  style={{ background: step === s ? BRAND.black : i < ["details","payment","confirm"].indexOf(step) ? BRAND.teal : BRAND.border, color: step === s || i < ["details","payment","confirm"].indexOf(step) ? "#fff" : BRAND.muted }}>
                  {i < ["details","payment","confirm"].indexOf(step) ? "✓" : i + 1}
                </div>
                <span className="text-sm font-semibold capitalize hidden sm:block"
                  style={{ color: step === s ? BRAND.black : BRAND.muted }}>
                  {s === "details" ? "Your Details" : s === "payment" ? "Payment" : "Confirm"}
                </span>
              </div>
              {i < 2 && <ChevronRight className="w-4 h-4" style={{ color: BRAND.mutedLight }} />}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8 items-start">
          {/* Main form */}
          <div className="lg:col-span-2">
            {/* Step 1: Details */}
            {step === "details" && (
              <div className="p-6 rounded-xl" style={{ background: BRAND.card, border: `1px solid ${BRAND.cardBorder}` }}>
                <h2 className="mb-6 font-black text-lg" style={{ color: BRAND.black }}>Delivery Information</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { key: "name", label: "Full Name", placeholder: "Juan Dela Cruz", col: "sm:col-span-2" },
                    { key: "email", label: "Email Address", placeholder: "juan@email.com" },
                    { key: "mobile", label: "Mobile Number", placeholder: "09XX XXX XXXX" },
                    { key: "street", label: "Street Address", placeholder: "123 Rizal St.", col: "sm:col-span-2" },
                    { key: "barangay", label: "Barangay", placeholder: "Brgy. San Antonio" },
                    { key: "city", label: "City / Municipality", placeholder: "Taguig" },
                    { key: "province", label: "Province", placeholder: "Metro Manila" },
                    { key: "postal", label: "Postal Code", placeholder: "1630" },
                  ].map(field => (
                    <div key={field.key} className={field.col || ""}>
                      <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>
                        {field.label}
                      </label>
                      <input
                        value={form[field.key as keyof typeof form]}
                        onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                        placeholder={field.placeholder}
                        className="w-full px-4 py-3 text-sm focus:outline-none transition-colors"
                        style={{
                          background: BRAND.inputBg || "#F8F7F6",
                          border: `1px solid ${BRAND.border}`,
                          color: BRAND.black,
                        }}
                        onFocus={e => (e.currentTarget.style.borderColor = BRAND.teal)}
                        onBlur={e => (e.currentTarget.style.borderColor = BRAND.border)}
                      />
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setStep("payment")}
                  disabled={!form.name || !form.email || !form.mobile || !form.street || !form.city}
                  className="mt-6 w-full py-4 font-black text-sm uppercase tracking-widest transition-opacity hover:opacity-90 disabled:opacity-40"
                  style={{ background: BRAND.black, color: BRAND.bg }}>
                  Continue to Payment →
                </button>
              </div>
            )}

            {/* Step 2: Payment */}
            {step === "payment" && (
              <div className="space-y-4">
                <div className="p-6 rounded-xl" style={{ background: BRAND.card, border: `1px solid ${BRAND.cardBorder}` }}>
                  <h2 className="mb-5 font-black text-lg" style={{ color: BRAND.black }}>Payment Method</h2>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {PAYMENT_METHODS.map(pm => (
                      <button key={pm.id} onClick={() => setPaymentMethod(pm.id)}
                        className="flex items-center gap-3 p-4 rounded-xl text-left transition-all"
                        style={{
                          border: `2px solid ${paymentMethod === pm.id ? BRAND.teal : BRAND.border}`,
                          background: paymentMethod === pm.id ? `${BRAND.teal}08` : "transparent",
                        }}>
                        <span className="text-2xl">{pm.icon}</span>
                        <span className="font-bold text-sm" style={{ color: BRAND.black }}>{pm.label}</span>
                        {paymentMethod === pm.id && (
                          <div className="ml-auto w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ background: BRAND.teal }}>
                            <span className="text-white text-xs">✓</span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payment instructions */}
                {!isCOD && (
                  <div className="p-6 rounded-xl" style={{ background: BRAND.card, border: `1px solid ${BRAND.cardBorder}` }}>
                    <h3 className="font-black mb-4" style={{ color: BRAND.black }}>Payment Instructions</h3>
                    <div className="p-4 rounded-lg mb-4" style={{ background: `${BRAND.teal}10`, border: `1px solid ${BRAND.teal}25` }}>
                      {paymentMethod === "gcash" && (
                        <div className="text-sm space-y-1" style={{ color: BRAND.black }}>
                          <p className="font-bold">GCash Number: 0961 177 4119</p>
                          <p>Account Name: Lorenzo Agalo P. Julio</p>
                          <p>Amount: ₱{total.toLocaleString()}</p>
                        </div>
                      )}
                      {paymentMethod === "maya" && (
                        <div className="text-sm space-y-1" style={{ color: BRAND.black }}>
                          <p className="font-bold">GCash Number: 0961 177 4119</p>
                          <p>Account Name: Lorenzo Agalo P. Julio</p>
                          <p>Amount: ₱{total.toLocaleString()}</p>
                        </div>
                      )}
                      {paymentMethod === "bank_transfer" && (
                        <div className="text-sm space-y-4" style={{ color: BRAND.black }}>
                          <div className="space-y-1">
                            <p className="font-bold">Maribank</p>
                            <p>Account Number: 14156569205</p>
                            <p>Account Name: Lorenzo Agalo P. Julio</p>
                          </div>
                          <div className="space-y-1" style={{ borderTop: `1px solid ${BRAND.border}`, paddingTop: "0.75rem" }}>
                            <p className="font-bold">BPI</p>
                            <p>Account Number: 0596199188</p>
                            <p>Account Name: Lorenzo Agalo P. Julio</p>
                          </div>
                          <p className="font-bold" style={{ borderTop: `1px solid ${BRAND.border}`, paddingTop: "0.75rem" }}>Amount: ₱{total.toLocaleString()}</p>
                        </div>
                      )}
                    </div>

                    {/* Proof upload */}
                    <label className="block">
                      <p className="text-sm font-bold mb-2" style={{ color: BRAND.black }}>Upload Proof of Payment</p>
                      <div className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors`}
                        style={{ borderColor: proofFile ? BRAND.teal : BRAND.border, background: proofFile ? `${BRAND.teal}05` : "transparent" }}>
                        <input type="file" accept="image/*,.pdf" className="hidden" id="proof"
                          onChange={e => setProofFile(e.target.files?.[0] || null)} />
                        <label htmlFor="proof" className="cursor-pointer">
                          {proofFile ? (
                            <div>
                              <CheckCircle className="w-8 h-8 mx-auto mb-2" style={{ color: BRAND.teal }} />
                              <p className="text-sm font-semibold" style={{ color: BRAND.teal }}>{proofFile.name}</p>
                              <p className="text-xs mt-1" style={{ color: BRAND.muted }}>Click to change</p>
                            </div>
                          ) : (
                            <div>
                              <Upload className="w-8 h-8 mx-auto mb-2" style={{ color: BRAND.mutedLight }} />
                              <p className="text-sm font-semibold" style={{ color: BRAND.black }}>Upload screenshot or receipt</p>
                              <p className="text-xs mt-1" style={{ color: BRAND.muted }}>JPG, PNG, or PDF</p>
                            </div>
                          )}
                        </label>
                      </div>
                    </label>
                  </div>
                )}

                {isCOD && (
                  <div className="flex items-start gap-3 p-4 rounded-xl"
                    style={{ background: `${BRAND.red}08`, border: `1px solid ${BRAND.red}20` }}>
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: BRAND.red }} />
                    <p className="text-sm leading-relaxed" style={{ color: BRAND.black }}>
                      Cash on Delivery is available for Metro Manila only. Our team will contact you before dispatch to confirm delivery details.
                    </p>
                  </div>
                )}

                <button
                  onClick={() => setStep("confirm")}
                  disabled={!isCOD && !proofFile}
                  className="w-full py-4 font-black text-sm uppercase tracking-widest transition-opacity hover:opacity-90 disabled:opacity-40"
                  style={{ background: BRAND.black, color: BRAND.bg }}>
                  Review Order →
                </button>
              </div>
            )}

            {/* Step 3: Confirm */}
            {step === "confirm" && (
              <div className="space-y-4">
                <div className="p-6 rounded-xl" style={{ background: BRAND.card, border: `1px solid ${BRAND.cardBorder}` }}>
                  <h2 className="mb-4 font-black" style={{ color: BRAND.black }}>Delivery To</h2>
                  <p className="font-semibold text-sm" style={{ color: BRAND.black }}>{form.name}</p>
                  <p className="text-sm" style={{ color: BRAND.muted }}>{form.mobile} · {form.email}</p>
                  <p className="text-sm mt-1" style={{ color: BRAND.muted }}>
                    {form.street}, {form.barangay}, {form.city}, {form.province} {form.postal}
                  </p>
                </div>
                <div className="p-6 rounded-xl" style={{ background: BRAND.card, border: `1px solid ${BRAND.cardBorder}` }}>
                  <h2 className="mb-4 font-black" style={{ color: BRAND.black }}>
                    Payment: {PAYMENT_METHODS.find(p => p.id === paymentMethod)?.label}
                  </h2>
                  {proofFile && (
                    <p className="text-sm" style={{ color: BRAND.teal }}>✓ Proof uploaded: {proofFile.name}</p>
                  )}
                  {isCOD && <p className="text-sm" style={{ color: BRAND.muted }}>Pay upon delivery</p>}
                </div>
                <button onClick={handlePlaceOrder}
                  className="w-full py-5 font-black text-sm uppercase tracking-widest transition-opacity hover:opacity-90"
                  style={{ background: BRAND.teal, color: "#fff" }}>
                  Place Order — ₱{total.toLocaleString()}
                </button>
              </div>
            )}
          </div>

          {/* Order summary */}
          <div className="rounded-xl overflow-hidden sticky top-24"
            style={{ background: BRAND.card, border: `1px solid ${BRAND.cardBorder}` }}>
            <div className="p-5">
              <h3 className="font-black mb-4" style={{ color: BRAND.black, fontFamily: FONTS.display, fontSize: "1.2rem", letterSpacing: "0.03em" }}>
                ORDER ({items.length})
              </h3>
              <div className="space-y-3 mb-4">
                {items.map(item => (
                  <div key={`${item.product.id}-${item.size}`} className="flex gap-3">
                    <div className="w-12 h-12 shrink-0 rounded-lg flex items-center justify-center"
                      style={{ background: item.product.bg || BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                      <span style={{ fontFamily: FONTS.display, color: BRAND.black, opacity: 0.08, fontSize: "0.8rem" }}>
                        {item.product.brand.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold leading-snug truncate" style={{ color: BRAND.black }}>{item.product.name}</p>
                      <p className="text-xs" style={{ color: BRAND.muted }}>{item.size} · {item.payment_type === "full_payment" ? "Full" : "DP"} · x{item.quantity}</p>
                    </div>
                    <p className="text-xs font-bold shrink-0" style={{ color: BRAND.black }}>₱{(item.unit_price * item.quantity).toLocaleString()}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2 pt-4" style={{ borderTop: `1px solid ${BRAND.border}` }}>
                <div className="flex justify-between text-sm">
                  <span style={{ color: BRAND.muted }}>Subtotal</span>
                  <span style={{ color: BRAND.black }}>₱{sub.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: BRAND.muted }}>Shipping</span>
                  <span style={{ color: shipping === 0 ? BRAND.teal : BRAND.black }}>{shipping === 0 ? "FREE" : `₱${shipping}`}</span>
                </div>
                <div className="flex justify-between font-black pt-3" style={{ borderTop: `1px solid ${BRAND.border}` }}>
                  <span style={{ color: BRAND.black }}>Total</span>
                  <span style={{ fontFamily: FONTS.display, fontSize: "1.3rem", color: BRAND.black }}>₱{total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

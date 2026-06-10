"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import { BRAND, FONTS, PAYMENT_METHODS, SHIPPING_FEE } from "@/lib/constants";
import { Upload, CheckCircle, AlertCircle, ChevronRight } from "lucide-react";

type Step = "details" | "payment" | "confirm";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCartStore();
  const sub = subtotal();
  const shipping = sub >= SHIPPING_FEE.free_threshold ? 0 : SHIPPING_FEE.metro_manila;
  const total = sub + shipping;

  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<Step>("details");
  const [paymentMethod, setPaymentMethod] = useState<string>("gcash");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [form, setForm] = useState({ name: "", email: "", mobile: "", street: "", barangay: "", city: "", province: "", postal: "" });
  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState("");

  useEffect(() => setMounted(true), []);

  if (!mounted) return <div style={{ minHeight: "100vh", background: BRAND.bg }} />;

  const isCOD = paymentMethod === "cod";

  async function handlePlaceOrder() {
    setPlacing(true);
    setOrderError("");
    try {
      const num = `SND-${Date.now().toString().slice(-8)}`;

      // Upload proof via service role API (bypasses storage RLS)
      let proofUrl: string | null = null;
      if (proofFile && !isCOD) {
        const uploadFd = new FormData();
        uploadFd.append("file", proofFile);
        uploadFd.append("orderNumber", num);
        const uploadRes = await fetch("/api/orders/upload-proof", { method: "POST", body: uploadFd });
        if (uploadRes.ok) {
          const { path } = await uploadRes.json();
          proofUrl = path;
        }
      }

      // Insert order via service role API (bypasses RLS)
      const createRes = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order: {
            order_number: num,
            customer_name: form.name,
            customer_email: form.email,
            customer_mobile: form.mobile,
            shipping_street: form.street,
            shipping_barangay: form.barangay || "N/A",
            shipping_city: form.city,
            shipping_province: form.province || "N/A",
            shipping_postal: form.postal || "0000",
            subtotal: sub,
            shipping_fee: shipping,
            total,
            payment_method: paymentMethod,
            payment_type: items[0]?.payment_type === "downpayment" ? "downpayment" : "full",
            payment_status: "pending",
            proof_of_payment: proofUrl,
            status: "pending",
          },
          items: items.map(item => ({
            product_id: item.product.id,
            product_name: item.product.name,
            brand: item.product.brand,
            size: item.size,
            quantity: item.quantity,
            unit_price: item.unit_price,
            payment_type: item.payment_type === "downpayment" ? "downpayment" : "full",
          })),
        }),
      });

      if (!createRes.ok) {
        const err = await createRes.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create order");
      }

      // Send confirmation emails (fire and forget)
      fetch("/api/orders/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: num,
          customer: { name: form.name, email: form.email, mobile: form.mobile },
          items: items.map(i => ({
            name: i.product.name, size: i.size, quantity: i.quantity,
            price: i.unit_price * i.quantity, payment_type: i.payment_type,
          })),
          subtotal: sub, shipping, total, paymentMethod,
          paymentType: items[0]?.payment_type ?? "full_payment",
          shippingAddress: { street: form.street, barangay: form.barangay, city: form.city, province: form.province, postal: form.postal },
          isCOD,
        }),
      }).catch(() => {});

      // Save order data for confirmation page
      sessionStorage.setItem("lastOrder", JSON.stringify({
        orderNumber: num, total, isCOD, paymentMethod, name: form.name,
        items: items.map(i => ({ name: i.product.name, size: i.size, quantity: i.quantity, price: i.unit_price * i.quantity })),
      }));

      clearCart();
      router.push("/order-confirmation");
    } catch {
      setOrderError("Something went wrong placing your order. Please try again.");
      setPlacing(false);
    }
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
                  disabled={!form.name || !form.email || !form.mobile || !form.street || !form.barangay || !form.city}
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
                          <p className="font-bold">Maya Number: 0961 177 4119</p>
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
                      Cash on Delivery is available nationwide. Our team will contact you before dispatch to confirm delivery details.
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
                {orderError && (
                  <div className="px-4 py-3 text-sm font-medium rounded"
                    style={{ background: `${BRAND.red}12`, color: BRAND.red, border: `1px solid ${BRAND.red}30` }}>
                    {orderError}
                  </div>
                )}
                <button onClick={handlePlaceOrder} disabled={placing}
                  className="w-full py-5 font-black text-sm uppercase tracking-widest transition-opacity hover:opacity-90 disabled:opacity-60"
                  style={{ background: BRAND.teal, color: "#fff" }}>
                  {placing ? "Placing Order…" : `Place Order — ₱${total.toLocaleString()}`}
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

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import { PAYMENT_METHODS, SHIPPING_FEE, DP_RESERVE_FEE } from "@/lib/constants";
import Image from "next/image";
import { Upload, CheckCircle, AlertCircle, ChevronRight } from "lucide-react";
import PhAddressSelect from "@/components/ui/PhAddressSelect";

type Step = "details" | "payment" | "confirm";

function calcShipping(
  isCOD: boolean,
  regionGroup: string,
  sub: number,
  itemCount: number,
  freeThreshold: number = SHIPPING_FEE.free_threshold,
  metroFee: number = SHIPPING_FEE.metro_sm,
  provFee: number = SHIPPING_FEE.provincial_sm,
): number {
  const lg = itemCount > 2;
  if (isCOD) {
    if (regionGroup === "Visayas" || regionGroup === "Mindanao")
      return lg ? SHIPPING_FEE.cod_vm_lg  : SHIPPING_FEE.cod_vm_sm;
    return lg ? SHIPPING_FEE.cod_luzon_lg : SHIPPING_FEE.cod_luzon_sm;
  }
  if (sub >= freeThreshold) return 0;
  if (regionGroup === "Metro Manila")
    return lg ? metroFee * 2 : metroFee;
  return lg ? provFee * 2 : provFee;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items: allItems, removeItems } = useCartStore();
  const [checkoutKeys, setCheckoutKeys] = useState<Set<string> | null>(null);
  const items = checkoutKeys ? allItems.filter(i => checkoutKeys.has(`${i.product.id}-${i.size}`)) : allItems;
  const sub = items.reduce((s, i) => s + i.unit_price * i.quantity, 0);

  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<Step>("details");
  const [paymentMethod, setPaymentMethod] = useState<string>("gcash");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [regionGroup, setRegionGroup] = useState("");
  const [form, setForm] = useState({ name: "", email: "", mobile: "", street: "", barangay: "", city: "", province: "", postal: "" });
  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [showErrors, setShowErrors] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponData, setCouponData] = useState<{ id: string; code: string; type: string; value: number; discount: number } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [activeCoupons, setActiveCoupons] = useState<{ code: string; type: string; value: number; min_order: number; expires_at: string | null }[]>([]);

  const [shipCfg, setShipCfg] = useState<{ freeThreshold: number; metro: number; prov: number }>({ freeThreshold: SHIPPING_FEE.free_threshold, metro: SHIPPING_FEE.metro_sm, prov: SHIPPING_FEE.provincial_sm });
  const [codEnabled, setCodEnabled] = useState(true);
  const [payCfg, setPayCfg] = useState({
    gcashNumber: "0961 177 4119", gcashName: "Lorenzo Agalo P. Julio", gcashQr: "",
    mayaNumber: "0961 177 4119", mayaName: "Lorenzo Agalo P. Julio", mayaQr: "",
    bank1Name: "Maribank", bank1Account: "14156569205", bank1AccountName: "Lorenzo Agalo P. Julio",
    bank2Name: "BPI", bank2Account: "0596199188", bank2AccountName: "Lorenzo Agalo P. Julio", bank1Qr: "", bank2Qr: "",
  });

  const isCOD = paymentMethod === "cod";
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);
  const shipping = calcShipping(isCOD, regionGroup, sub, itemCount, shipCfg.freeThreshold, shipCfg.metro, shipCfg.prov);
  const discount = couponData?.discount ?? 0;
  const total = sub + shipping - discount;

  const isDP = items.some(i => i.payment_type === "downpayment");
  const hasOnHand = items.some(i => i.payment_type !== "downpayment");
  const isMixed = isDP && hasOnHand;
  const dpBalance = items
    .filter(i => i.payment_type === "downpayment")
    .reduce((s, i) => s + (i.unit_price - DP_RESERVE_FEE) * i.quantity, 0);
  const onHandSubtotal = items
    .filter(i => i.payment_type !== "downpayment")
    .reduce((s, i) => s + i.unit_price * i.quantity, 0);
  const dpFeeSubtotal = items
    .filter(i => i.payment_type === "downpayment")
    .reduce((s, i) => s + DP_RESERVE_FEE * i.quantity, 0);
  const subNow = items.reduce(
    (s, i) => s + (i.payment_type === "downpayment" ? DP_RESERVE_FEE : i.unit_price) * i.quantity, 0
  );
  const totalDueNow = subNow + shipping - discount;

  useEffect(() => {
    setMounted(true);
    const keys = sessionStorage.getItem("snd_checkout_keys");
    if (keys) {
      try { setCheckoutKeys(new Set(JSON.parse(keys))); } catch { /* ignore */ }
      sessionStorage.removeItem("snd_checkout_keys");
    }
    // Fetch active promo codes for display
    fetch("/api/coupons/active").then(r => r.json()).then(data => { if (Array.isArray(data)) setActiveCoupons(data); }).catch(() => {});
    // Fetch dynamic shipping config + COD toggle from admin settings
    fetch("/api/settings")
      .then(r => r.json())
      .then((data: Record<string, string>) => {
        setShipCfg({
          freeThreshold: Number(data.free_shipping_threshold) || SHIPPING_FEE.free_threshold,
          metro: Number(data.metro_shipping_fee) || SHIPPING_FEE.metro_sm,
          prov: Number(data.provincial_shipping_fee) || SHIPPING_FEE.provincial_sm,
        });
        setCodEnabled(data.cod_enabled !== "false");
        setPayCfg(prev => ({
          gcashNumber: data.gcash_number || prev.gcashNumber,
          gcashName: data.gcash_name || prev.gcashName,
          gcashQr: data.gcash_qr_url || prev.gcashQr,
          mayaNumber: data.maya_number || prev.mayaNumber,
          mayaName: data.maya_name || prev.mayaName,
          mayaQr: data.maya_qr_url || prev.mayaQr,
          bank1Name: data.bank1_name || prev.bank1Name,
          bank1Account: data.bank1_account_number || prev.bank1Account,
          bank1AccountName: data.bank1_account_name || prev.bank1AccountName,
          bank2Name: data.bank2_name || prev.bank2Name,
          bank2Account: data.bank2_account_number || prev.bank2Account,
          bank2AccountName: data.bank2_account_name || prev.bank2AccountName,
          bank1Qr: data.bank1_qr_url || prev.bank1Qr,
          bank2Qr: data.bank2_qr_url || prev.bank2Qr,
        }));
      })
      .catch(() => {});
    import("@/lib/supabase/client").then(({ createClient }) => {
      createClient().auth.getUser().then(({ data: { user } }) => {
        if (!user) { router.replace("/login?redirect=/checkout"); return; }
        // Pre-fill known fields from auth profile
        const meta = user.user_metadata ?? {};
        setForm(f => ({
          ...f,
          name: f.name || meta.full_name || "",
          email: f.email || user.email || "",
          mobile: f.mobile || meta.mobile || "",
          street: f.street || meta.addr_street || "",
          barangay: f.barangay || meta.addr_barangay || "",
          city: f.city || meta.addr_city || "",
          province: f.province || meta.addr_province || "",
          postal: f.postal || meta.addr_postal || "",
        }));
        if (!regionGroup && meta.addr_region_group) setRegionGroup(meta.addr_region_group);
      });
    });
  }, [router]);

  useEffect(() => {
    if (!proofFile || !proofFile.type.startsWith("image/")) { setProofPreview(null); return; }
    const url = URL.createObjectURL(proofFile);
    setProofPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [proofFile]);

  function handleContinueToPayment() {
    if (!form.name || !form.email || !form.mobile || !form.street || !form.province || !form.city || !form.barangay) {
      setShowErrors(true);
      return;
    }
    if (!/^09\d{9}$/.test(form.mobile)) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    setStep("payment");
  }

  async function handleApplyCoupon() {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    setCouponError("");
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode.trim(), orderTotal: sub }),
      });
      const data = await res.json();
      if (!res.ok) { setCouponError(data.error || "Invalid coupon"); }
      else { setCouponData(data); setCouponCode(""); }
    } finally {
      setApplyingCoupon(false);
    }
  }

  if (!mounted) return <div className="min-h-screen bg-snd-bg" />;

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
            discount,
            coupon_code: couponData?.code ?? null,
            total,
            payment_method: paymentMethod,
            payment_type: items[0]?.payment_type === "downpayment" ? "downpayment" : "full",
            payment_status: "pending",
            proof_of_payment: proofUrl,
            payment_reference: referenceNumber.trim() || null,
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
        if (createRes.status === 409 && err.outOfStock) {
          setOrderError(err.error);
          setPlacing(false);
          return;
        }
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
      const preOrderItem = items.find(i => i.product.status === "pre-order");
      sessionStorage.setItem("lastOrder", JSON.stringify({
        orderNumber: num, total, isCOD, paymentMethod, name: form.name,
        mobile: form.mobile,
        address: [form.street, form.barangay, form.city, form.province, form.postal].filter(Boolean).join(", "),
        proofSubmitted: !isCOD,
        shipping, discount, couponCode: couponData?.code ?? null, referenceNumber: referenceNumber.trim() || null,
        isDP,
        dpBalance: isDP ? dpBalance : 0,
        totalDueNow: isDP ? totalDueNow : total,
        eta: preOrderItem?.product.eta_start ?? null,
        etaEnd: preOrderItem?.product.eta_end ?? null,
        items: items.map(i => ({
          name: i.product.name,
          size: i.size,
          quantity: i.quantity,
          price: i.unit_price * i.quantity,
          payment_type: i.payment_type,
          image: i.product.images?.[0] ?? null,
          bg: i.product.bg ?? null,
          brand: i.product.brand,
        })),
        proofUrl,
      }));

      removeItems(items.map(i => ({ productId: i.product.id, size: i.size })));
      fetch("/api/cart/sync", { method: "DELETE" }).catch(() => {});
      router.push("/order-confirmation");
    } catch {
      setOrderError("Something went wrong placing your order. Please try again.");
      setPlacing(false);
    }
  }

  return (
    <div className="bg-snd-bg font-body min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="mb-8 font-heading tracking-[0.04em] text-[length:clamp(2rem,6vw,3rem)] text-snd-black">
          CHECKOUT
        </h1>

        {/* Steps */}
        <div className="flex items-center gap-2 mb-10">
          {(["details", "payment", "confirm"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => step !== "confirm" && i < ["details","payment","confirm"].indexOf(step) + 1 && setStep(s)}>
                <div className={`w-6 h-6 flex items-center justify-center text-xs font-black ${
                  step === s ? "bg-snd-black text-white" : i < ["details","payment","confirm"].indexOf(step) ? "bg-snd-teal text-white" : "bg-snd-border text-snd-muted"
                }`}>
                  {i < ["details","payment","confirm"].indexOf(step) ? "✓" : i + 1}
                </div>
                <span className={`text-sm font-semibold capitalize hidden sm:block ${step === s ? "text-snd-black" : "text-snd-muted"}`}>
                  {s === "details" ? "Your Details" : s === "payment" ? "Payment" : "Confirm"}
                </span>
              </div>
              {i < 2 && <ChevronRight className="w-4 h-4 text-snd-muted-lt" />}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 items-start">
          {/* Main form */}
          <div className="lg:col-span-2">
            {/* Step 1: Details */}
            {step === "details" && (
              <div className="p-6 bg-snd-card border border-snd-border">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-black text-lg text-snd-black">Delivery Information</h2>
                  <span className="text-xs text-snd-muted">
                    <span className="text-snd-red">*</span> Required
                  </span>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { key: "name", label: "Full Name", placeholder: "Juan Dela Cruz", col: "sm:col-span-2", req: true },
                    { key: "email", label: "Email Address", placeholder: "juan@email.com", req: true },
                    { key: "mobile", label: "Mobile Number", placeholder: "09XX XXX XXXX", req: true },
                    { key: "street", label: "Street Address", placeholder: "123 Rizal St.", col: "sm:col-span-2", req: true },
                  ].map(field => {
                    const isMobile = field.key === "mobile";
                    const val = form[field.key as keyof typeof form];
                    const mobileInvalid = isMobile && showErrors && !!val && !/^09\d{9}$/.test(val);
                    const isEmpty = showErrors && !val;
                    const hasError = isEmpty || mobileInvalid;
                    return (
                      <div key={field.key} className={field.col || ""}>
                        <label className="block text-xs font-bold uppercase tracking-wide mb-1.5 text-snd-black">
                          {field.label}{field.req && <span className="text-snd-red"> *</span>}
                        </label>
                        <input
                          value={val}
                          onChange={e => setForm(f => ({
                            ...f,
                            [field.key]: isMobile ? e.target.value.replace(/\D/g, "").slice(0, 11) : e.target.value,
                          }))}
                          placeholder={field.placeholder}
                          inputMode={isMobile ? "numeric" : undefined}
                          className={`w-full px-4 py-3 text-sm focus:outline-none transition-colors bg-snd-input text-snd-black border ${hasError ? "border-snd-red" : "border-snd-border"} focus:border-snd-teal`}
                        />
                        {isEmpty && <p className="mt-1 text-[11px] font-semibold text-snd-red">This field is required</p>}
                        {mobileInvalid && <p className="mt-1 text-[11px] font-semibold text-snd-red">Enter a valid PH number (09XXXXXXXXX)</p>}
                      </div>
                    );
                  })}

                  {/* PH Address Dropdowns */}
                  <PhAddressSelect
                    province={form.province}
                    city={form.city}
                    barangay={form.barangay}
                    onProvinceChange={v => setForm(f => ({ ...f, province: v }))}
                    onCityChange={v => setForm(f => ({ ...f, city: v }))}
                    onBarangayChange={v => setForm(f => ({ ...f, barangay: v }))}
                    onRegionGroupChange={setRegionGroup}
                    showErrors={showErrors}
                  />

                  {/* Postal Code */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide mb-1.5 text-snd-black">
                      Postal Code
                    </label>
                    <input
                      value={form.postal}
                      onChange={e => setForm(f => ({ ...f, postal: e.target.value }))}
                      placeholder="1630"
                      className="w-full px-4 py-3 text-sm focus:outline-none transition-colors bg-snd-input text-snd-black border border-snd-border focus:border-snd-teal"
                    />
                  </div>
                </div>

                <button
                  onClick={handleContinueToPayment}
                  className="mt-6 w-full py-4 font-black text-sm uppercase tracking-widest transition-opacity hover:opacity-90 bg-snd-black text-snd-bg">
                  Continue to Payment →
                </button>
              </div>
            )}

            {/* Step 2: Payment */}
            {step === "payment" && (
              <div className="space-y-4">
                <div className="p-6 bg-snd-card border border-snd-border">
                  <h2 className="mb-5 font-black text-lg text-snd-black">Payment Method</h2>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {PAYMENT_METHODS.filter(pm => pm.id !== "cod" || codEnabled).map(pm => (
                      <button key={pm.id} onClick={() => setPaymentMethod(pm.id)}
                        className={`flex items-center gap-3 p-4 text-left transition-all border-2 ${
                          paymentMethod === pm.id ? "border-snd-teal bg-snd-teal/[3%]" : "border-snd-border bg-transparent"
                        }`}>
                        <span className="font-bold text-sm text-snd-black">{pm.label}</span>
                        {paymentMethod === pm.id && (
                          <div className="ml-auto w-5 h-5 flex items-center justify-center bg-snd-teal">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payment instructions */}
                {!isCOD && (
                  <div className="p-6 bg-snd-card border border-snd-border">
                    <h3 className="font-black mb-4 text-snd-black">Payment Instructions</h3>
                    <div className="p-4 rounded-lg mb-4 bg-snd-teal/[6%] border border-snd-teal/[15%]">
                      {/* Amount breakdown helper */}
                      {(() => {
                        const amt = isDP ? totalDueNow : total;
                        const amountEl = isMixed ? (
                          <div>
                            <p>Amount: <span className="font-bold">₱{amt.toLocaleString()}</span></p>
                            <p className="text-xs mt-0.5 text-snd-muted">
                              {items.filter(i => i.payment_type !== "downpayment").map(i => `${i.product.name} ₱${(i.unit_price * i.quantity).toLocaleString()}`).join(" + ")}
                              {" "}+ ₱{dpFeeSubtotal.toLocaleString()} Downpayment
                              {shipping > 0 ? ` + ₱${shipping.toLocaleString()} Shipping` : ""}
                              {discount > 0 ? ` − ₱${discount.toLocaleString()} Discount` : ""}
                              {" "}= ₱{amt.toLocaleString()}
                            </p>
                          </div>
                        ) : (
                          <p>Amount: ₱{amt.toLocaleString()}{isDP && <span className="text-xs ml-1 font-normal text-snd-muted">(downpayment only)</span>}</p>
                        );
                        if (paymentMethod === "gcash") return (
                          <div className="text-sm space-y-2 text-snd-black">
                            {payCfg.gcashQr && (
                              <div className="flex justify-center pb-1">
                                <img src={payCfg.gcashQr} alt="GCash QR Code" style={{ width: 180, height: 180, objectFit: "contain" }} />
                              </div>
                            )}
                            <p className="font-bold">GCash Number: {payCfg.gcashNumber}</p>
                            <p>Account Name: {payCfg.gcashName}</p>
                            {amountEl}
                          </div>
                        );
                        if (paymentMethod === "maya") return (
                          <div className="text-sm space-y-2 text-snd-black">
                            {payCfg.mayaQr && (
                              <div className="flex justify-center pb-1">
                                <img src={payCfg.mayaQr} alt="Maya QR Code" style={{ width: 180, height: 180, objectFit: "contain" }} />
                              </div>
                            )}
                            <p className="font-bold">Maya Number: {payCfg.mayaNumber}</p>
                            <p>Account Name: {payCfg.mayaName}</p>
                            {amountEl}
                          </div>
                        );
                        if (paymentMethod === "bank_transfer") return (
                          <div className="text-sm space-y-4 text-snd-black">
                            <div className="space-y-2">
                              {payCfg.bank1Qr && (
                                <div className="flex justify-center pb-1">
                                  <img src={payCfg.bank1Qr} alt={`${payCfg.bank1Name} QR Code`} style={{ width: 180, height: 180, objectFit: "contain" }} />
                                </div>
                              )}
                              <p className="font-bold">{payCfg.bank1Name}</p>
                              <p>Account Number: {payCfg.bank1Account}</p>
                              <p>Account Name: {payCfg.bank1AccountName}</p>
                            </div>
                            <div className="space-y-2 border-t border-snd-border pt-3">
                              {payCfg.bank2Qr && (
                                <div className="flex justify-center pb-1">
                                  <img src={payCfg.bank2Qr} alt={`${payCfg.bank2Name} QR Code`} style={{ width: 180, height: 180, objectFit: "contain" }} />
                                </div>
                              )}
                              <p className="font-bold">{payCfg.bank2Name}</p>
                              <p>Account Number: {payCfg.bank2Account}</p>
                              <p>Account Name: {payCfg.bank2AccountName}</p>
                            </div>
                            <div className="border-t border-snd-border pt-3">{amountEl}</div>
                          </div>
                        );
                        return null;
                      })()}
                    </div>

                    {/* Balance reminder for mixed orders */}
                    {isMixed && (
                      <p className="text-xs italic mb-4 text-snd-muted">
                        *Balance: ₱{dpBalance.toLocaleString()} — to be settled before shipping*
                      </p>
                    )}

                    {/* Reference number */}
                    <div className="mb-4">
                      <p className="text-sm font-bold mb-2 text-snd-black">Reference / Transaction Number <span className="text-snd-red">*</span></p>
                      <input
                        type="text"
                        value={referenceNumber}
                        onChange={e => setReferenceNumber(e.target.value)}
                        placeholder="e.g. 123456789012"
                        className="w-full px-4 py-3 text-sm focus:outline-none bg-snd-bg border border-snd-border text-snd-black focus:border-snd-teal"
                      />
                    </div>

                    {/* Proof upload */}
                    <div>
                      <p className="text-sm font-bold mb-2 text-snd-black">Upload Proof of Payment</p>
                      <div className={`border-2 border-dashed p-4 sm:p-8 text-center cursor-pointer transition-colors ${
                        proofFile ? "border-snd-teal bg-snd-teal/[2%]" : "border-snd-border bg-transparent"
                      }`}>
                        <input type="file" accept="image/*,.pdf" className="hidden" id="proof"
                          onChange={e => setProofFile(e.target.files?.[0] || null)} />
                        <label htmlFor="proof" className="cursor-pointer">
                          {proofFile ? (
                            <div className="flex flex-col items-center">
                              {proofPreview ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={proofPreview} alt="Proof preview" className="w-full max-h-40 rounded-lg mb-3 object-contain border border-snd-border" />
                              ) : (
                                <CheckCircle className="w-8 h-8 mb-2 text-snd-teal" />
                              )}
                              <p className="text-sm font-semibold max-w-full truncate px-2 text-snd-teal">{proofFile.name}</p>
                              <p className="text-xs mt-1 text-snd-muted">Click to change</p>
                            </div>
                          ) : (
                            <div>
                              <Upload className="w-8 h-8 mx-auto mb-2 text-snd-muted-lt" />
                              <p className="text-sm font-semibold text-snd-black">Upload screenshot or receipt</p>
                              <p className="text-xs mt-1 text-snd-muted">JPG, PNG, or PDF</p>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {isCOD && (
                  <div className="flex items-start gap-3 p-4 bg-snd-red/[3%] border border-snd-red/[13%]">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-snd-red" />
                    <div className="text-sm leading-relaxed text-snd-black">
                      <p>Cash on Delivery available nationwide. Our team will contact you before dispatch.</p>
                      <p className="mt-1.5 font-semibold text-snd-muted">
                        COD shipping: Luzon ₱250 · Visayas &amp; Mindanao ₱350 (no free shipping for COD)
                      </p>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setStep("confirm")}
                  disabled={!isCOD && (!proofFile || !referenceNumber.trim())}
                  className="w-full py-4 font-black text-sm uppercase tracking-widest transition-opacity hover:opacity-90 disabled:opacity-40 bg-snd-black text-snd-bg">
                  Review Order →
                </button>
              </div>
            )}

            {/* Step 3: Confirm */}
            {step === "confirm" && (
              <div className="space-y-4">
                <div className="p-6 bg-snd-card border border-snd-border">
                  <h2 className="mb-4 font-black text-snd-black">Delivery To</h2>
                  <p className="font-semibold text-sm text-snd-black">{form.name}</p>
                  <p className="text-sm text-snd-muted">{form.mobile} · {form.email}</p>
                  <p className="text-sm mt-1 text-snd-muted">
                    {form.street}, {form.barangay}, {form.city}, {form.province} {form.postal}
                  </p>
                </div>
                <div className="p-6 bg-snd-card border border-snd-border">
                  <h2 className="mb-4 font-black text-snd-black">
                    Payment: {PAYMENT_METHODS.find(p => p.id === paymentMethod)?.label}
                  </h2>
                  {isDP && (
                    <div className="mb-4 rounded-lg overflow-hidden border border-snd-border">
                      <div className="px-4 py-3 text-sm flex justify-between items-start">
                        <span className="text-snd-muted">Due Now</span>
                        <div className="text-right">
                          <span className="font-black text-snd-teal">₱{totalDueNow.toLocaleString()}</span>
                          {isMixed && (
                            <p className="text-xs mt-0.5 text-snd-muted">
                              On hand ₱{onHandSubtotal.toLocaleString()} + ₱{dpFeeSubtotal.toLocaleString()} Downpayment
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="px-4 py-3 flex justify-between text-sm border-t border-snd-border bg-snd-bg">
                        <span className="text-snd-muted">Balance (paid before shipping)</span>
                        <span className="font-semibold text-snd-black">₱{dpBalance.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                  {referenceNumber && (
                    <div className="mt-3 px-4 py-3 rounded-lg bg-snd-teal/[6%] border border-snd-teal/[15%]">
                      <p className="text-[11px] font-black uppercase tracking-widest mb-0.5 text-snd-muted">Reference Number</p>
                      <p className="text-sm font-bold text-snd-black">{referenceNumber}</p>
                    </div>
                  )}
                  {proofFile && (
                    <div className="mt-3">
                      {proofPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={proofPreview} alt="Proof of payment" className="rounded-lg max-h-48 object-contain border border-snd-border" />
                      ) : (
                        <p className="text-sm text-snd-teal">✓ {proofFile.name}</p>
                      )}
                    </div>
                  )}
                  {isCOD && <p className="text-sm text-snd-muted">Pay upon delivery</p>}
                </div>
                {orderError && (
                  <div className="px-4 py-3 text-sm font-medium rounded bg-snd-red/[7%] text-snd-red border border-snd-red/[19%]">
                    {orderError}
                  </div>
                )}
                <button onClick={handlePlaceOrder} disabled={placing}
                  className="w-full py-5 font-black text-sm uppercase tracking-widest transition-opacity hover:opacity-90 disabled:opacity-60 bg-snd-teal text-white">
                  {placing ? "Placing Order…" : `Place Order — ₱${(isDP ? totalDueNow : total).toLocaleString()}`}
                </button>
              </div>
            )}
          </div>

          {/* Order summary */}
          <div className="lg:order-2 overflow-hidden lg:sticky lg:top-24 w-full min-w-0 bg-snd-card border border-snd-border">
            <div className="p-4 sm:p-5">
              <h3 className="font-black mb-4 text-snd-black font-heading text-[1.2rem] tracking-[0.03em]">
                ORDER ({items.length})
              </h3>
              <div className="space-y-3 mb-4">
                {items.map(item => {
                  const isItemDP = item.payment_type === "downpayment";
                  const displayPrice = isItemDP ? DP_RESERVE_FEE * item.quantity : item.unit_price * item.quantity;
                  return (
                    <div key={`${item.product.id}-${item.size}`} className="flex gap-2.5 min-w-0">
                      <div className={`w-11 h-11 shrink-0 rounded-lg overflow-hidden relative border border-snd-border ${!item.product.bg ? "bg-snd-bg" : ""}`}
                        style={item.product.bg ? { background: item.product.bg } : undefined}>
                        {item.product.images?.[0] ? (
                          <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" sizes="44px" />
                        ) : (
                          <span className="absolute inset-0 flex items-center justify-center font-heading text-snd-black opacity-[0.08] text-[0.8rem]">
                            {item.product.brand.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <p className="text-xs font-semibold leading-snug truncate text-snd-black">{item.product.name}</p>
                        <p className="text-xs truncate text-snd-muted">{item.size} · x{item.quantity}</p>
                      </div>
                      <div className="shrink-0 pl-1 text-right">
                        <p className="text-xs font-bold text-snd-black">₱{displayPrice.toLocaleString()}</p>
                        <p className="text-[10px] text-snd-muted">{isItemDP ? "(down payment)" : "(full price)"}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="space-y-2 pt-3 border-t border-snd-border">
                <div className="flex justify-between text-sm">
                  <span className="text-snd-muted">Shipping</span>
                  <span className={shipping === 0 ? "text-snd-teal" : "text-snd-black"}>{shipping === 0 ? "FREE" : `₱${shipping.toLocaleString()}`}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-snd-teal">Coupon ({couponData?.code})</span>
                    <span className="text-snd-teal">−₱{discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-black pt-3 border-t border-snd-border">
                  <span className="text-snd-black">Subtotal</span>
                  <span className={`font-heading text-[1.3rem] ${isDP ? "text-snd-teal" : "text-snd-black"}`}>
                    ₱{(isDP ? totalDueNow : total).toLocaleString()}
                  </span>
                </div>
                {isDP && (
                  <>
                    <p className="text-[11px] italic text-snd-muted">will pay upon place order</p>
                    <div className="mt-2 px-3 py-2 rounded-lg text-xs italic text-snd-muted bg-snd-red/[2%] border border-snd-red/[8%]">
                      *Balance: ₱{dpBalance.toLocaleString()} — will settle before shipping*
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Coupon code input */}
            <div className="p-4 sm:p-5 border-t border-snd-border">
              {couponData ? (
                <div className="flex items-center justify-between px-3 py-2.5 rounded bg-snd-teal/[6%] border border-snd-teal/[19%]">
                  <span className="text-sm font-bold text-snd-teal">
                    {couponData.code} — −₱{discount.toLocaleString()} off
                  </span>
                  <button onClick={() => setCouponData(null)} className="text-xs underline text-snd-muted">
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponError(""); }}
                    placeholder="Promo code"
                    className={`flex-1 min-w-0 px-3 py-2.5 text-sm focus:outline-none bg-snd-bg text-snd-black border ${couponError ? "border-snd-red" : "border-snd-border"}`}
                    onKeyDown={e => e.key === "Enter" && handleApplyCoupon()}
                  />
                  <button onClick={handleApplyCoupon} disabled={applyingCoupon || !couponCode.trim()}
                    className="shrink-0 px-4 py-2.5 text-xs font-black uppercase tracking-wide disabled:opacity-50 bg-snd-black text-snd-bg">
                    {applyingCoupon ? "…" : "Apply"}
                  </button>
                </div>
              )}
              {couponError && <p className="text-xs mt-1.5 font-semibold text-snd-red">{couponError}</p>}
              {/* ETA display for pre-order items */}
              {(() => {
                const pre = items.find(i => i.product.status === "pre-order");
                if (!pre?.product.eta_start) return null;
                const fmt = (d: string) => new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
                return (
                  <div className="mt-3 p-3 rounded-lg bg-snd-teal/[6%] border border-snd-teal/[15%]">
                    <p className="text-[10px] font-black uppercase tracking-widest mb-0.5 text-snd-teal">Pre-Order ETA</p>
                    <p className="text-xs font-semibold text-snd-black">
                      {fmt(pre.product.eta_start)}{pre.product.eta_end ? ` – ${fmt(pre.product.eta_end)}` : ""}
                    </p>
                    <p className="text-[10px] mt-1 text-snd-muted">Estimated Arrival</p>
                  </div>
                );
              })()}
              {!couponData && activeCoupons.length > 0 && (
                <div className="mt-3">
                  <p className="text-[10px] font-black uppercase tracking-widest mb-2 text-snd-muted">Available Promos</p>
                  <div className="flex flex-wrap gap-1.5">
                    {activeCoupons.map(c => (
                      <button key={c.code}
                        onClick={() => { setCouponCode(c.code); setCouponError(""); }}
                        className="text-xs font-bold px-2.5 py-1 transition-opacity hover:opacity-70 border border-dashed border-snd-teal text-snd-teal bg-snd-teal/[3%]">
                        {c.code} · {c.type === "percent" ? `${c.value}% off` : `₱${Number(c.value).toLocaleString()} off`}
                        {c.min_order > 0 && <span className="text-snd-muted font-normal"> (min ₱{Number(c.min_order).toLocaleString()})</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

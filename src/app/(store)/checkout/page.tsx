"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useCartStore } from "@/store/cartStore";
import { PAYMENT_METHODS, SHIPPING_FEE, DP_RESERVE_FEE } from "@/lib/constants";
import { now } from "@/lib/utils";
import Image from "next/image";
import { Upload, CheckCircle, AlertCircle, ChevronRight, ChevronDown, Wallet, Landmark, Truck, CreditCard } from "lucide-react";
import PhAddressSelect from "@/components/ui/PhAddressSelect";

type Step = "details" | "payment" | "confirm";

const CONTACT_FIELDS = [
  { key: "name", label: "Full name", placeholder: "Juan Dela Cruz", col: "sm:col-span-2", req: true },
  { key: "email", label: "Email address", placeholder: "juan@email.com", req: true },
  { key: "mobile", label: "Mobile number", placeholder: "09XX XXX XXXX", req: true },
] as const;

const ADDRESS_FIELDS = [
  { key: "street", label: "Street address", placeholder: "123 Rizal St.", col: "sm:col-span-2", req: true },
] as const;

function paymentIcon(id: string) {
  if (id === "gcash" || id === "maya") return Wallet;
  if (id === "bank_transfer") return Landmark;
  if (id === "cod") return Truck;
  return CreditCard;
}

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
  const items = checkoutKeys ? allItems.filter(i => checkoutKeys.has(i.id)) : allItems;
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
  const [stockIssues, setStockIssues] = useState<Record<string, number>>({}); // `${product_id}-${size}` -> available
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
    queueMicrotask(() => {
      setMounted(true);
      const keys = sessionStorage.getItem("snd_checkout_keys");
      if (keys) {
        try { setCheckoutKeys(new Set(JSON.parse(keys))); } catch { /* ignore */ }
        sessionStorage.removeItem("snd_checkout_keys");
      }
    });
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
    if (!proofFile || !proofFile.type.startsWith("image/")) {
      queueMicrotask(() => setProofPreview(null));
      return;
    }
    const url = URL.createObjectURL(proofFile);
    queueMicrotask(() => setProofPreview(url));
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

  if (!mounted) return <div className="min-h-screen bg-paper" />;

  async function handlePlaceOrder() {
    setPlacing(true);
    setOrderError("");
    setStockIssues({});
    try {
      // Final stock check right before submitting -- catches items that sold
      // out while the customer was on the checkout page. This is best-effort;
      // the RPC's atomic stock check (create_order_with_stock_check) is the
      // real guard against overselling, this just gives a nicer error earlier.
      try {
        const stockCheckRes = await fetch("/api/cart/refresh-stock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: items.map(i => ({ product_id: i.product.id, size: i.size, quantity: i.quantity })),
          }),
        });
        if (stockCheckRes.ok) {
          const { items: checks } = await stockCheckRes.json() as {
            items: Array<{ product_id: string; size: string; current_stock: number; status: "available" | "reduced" | "sold_out" }>;
          };
          const problems = (checks ?? []).filter(c => c.status !== "available");
          if (problems.length > 0) {
            for (const p of problems) {
              const item = items.find(i => i.product.id === p.product_id && i.size === p.size);
              const name = item?.product.name ?? "An item";
              toast.error(
                p.status === "sold_out"
                  ? `${name} (${p.size}) is no longer available.`
                  : `${name} (${p.size}) only has ${p.current_stock} left.`
              );
            }
            setPlacing(false);
            router.push("/cart");
            return;
          }
        }
      } catch { /* stock precheck is best-effort -- fall through to the atomic RPC check */ }

      const num = `SND-${now().toString().slice(-8)}`;

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
          const failures: Array<{ product_id: string; product_name: string; size: string; requested: number; available: number }> = err.items ?? [];
          if (failures.length) {
            const issues: Record<string, number> = {};
            for (const f of failures) {
              toast.error(`${f.product_name} size ${f.size} is sold out — please remove it or choose another size.`);
              issues[`${f.product_id}-${f.size}`] = f.available;
            }
            setStockIssues(issues);
          } else {
            toast.error(err.error || "One or more items just sold out.");
          }
          setOrderError(err.error);
          setPlacing(false);
          return; // stay on checkout — no redirect
        }
        if (createRes.status === 400) {
          setOrderError(err.error || "Please check your order details and try again.");
          setPlacing(false);
          return; // stay on checkout — no redirect
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
            productId: i.product.id, name: i.product.name, size: i.size, quantity: i.quantity,
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

      removeItems(items.map(i => ({ productId: i.product.id, size: i.size, paymentType: i.payment_type })));
      fetch("/api/cart/sync", { method: "DELETE" }).catch(() => {});
      router.push("/order-confirmation");
    } catch {
      toast.error("Something went wrong. Try again.");
      setOrderError("Something went wrong placing your order. Please try again.");
      setPlacing(false);
    }
  }

  function renderField(field: { key: string; label: string; placeholder: string; col?: string; req?: boolean }) {
    const isMobile = field.key === "mobile";
    const val = form[field.key as keyof typeof form];
    const mobileInvalid = isMobile && showErrors && !!val && !/^09\d{9}$/.test(val);
    const isEmpty = showErrors && !val;
    const hasError = isEmpty || mobileInvalid;
    return (
      <div key={field.key} className={field.col || ""}>
        <label className="block text-micro text-ink-3 mb-1.5">
          {field.label}{field.req && <span className="text-state-error"> *</span>}
        </label>
        <input
          value={val}
          onChange={e => setForm(f => ({
            ...f,
            [field.key]: isMobile ? e.target.value.replace(/\D/g, "").slice(0, 11) : e.target.value,
          }))}
          placeholder={field.placeholder}
          inputMode={isMobile ? "numeric" : undefined}
          className={`w-full bg-paper-2 border-0 rounded-md px-4 py-3 text-body-sm text-ink focus:outline-2 focus:outline-ink focus:outline-offset-1 ${hasError ? "outline outline-2 outline-state-error" : ""}`}
        />
        {isEmpty && <p className="mt-1 text-micro text-state-error">This field is required</p>}
        {mobileInvalid && <p className="mt-1 text-micro text-state-error">Enter a valid PH number (09XXXXXXXXX)</p>}
      </div>
    );
  }

  const idx = ["details", "payment", "confirm"].indexOf(step);

  const summaryBody = (
    <>
      <div className="space-y-3 mb-4">
        {items.map(item => {
          const isItemDP = item.payment_type === "downpayment";
          const displayPrice = isItemDP ? DP_RESERVE_FEE * item.quantity : item.unit_price * item.quantity;
          const stockKey = `${item.product.id}-${item.size}`;
          const soldOutAvailable = stockIssues[stockKey];
          return (
            <div key={stockKey} className="flex gap-2.5 min-w-0">
              <div className={`w-11 h-11 shrink-0 rounded-md overflow-hidden relative border ${soldOutAvailable !== undefined ? "border-state-error" : "border-line"} ${!item.product.bg ? "bg-paper-2" : ""}`}
                style={item.product.bg ? { background: item.product.bg } : undefined}>
                {item.product.images?.[0] ? (
                  <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" sizes="44px" />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center font-display text-ink opacity-10 text-[0.8rem]">
                    {item.product.brand.charAt(0)}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0 overflow-hidden">
                <p className="text-body-sm font-medium leading-snug truncate text-ink">{item.product.name}</p>
                <p className="text-micro truncate text-ink-3">
                  {item.size} · x{item.quantity}
                  {soldOutAvailable !== undefined && (
                    <span className="text-state-error font-medium ml-1">— sold out (only {soldOutAvailable} left)</span>
                  )}
                </p>
              </div>
              <div className="shrink-0 pl-1 text-right">
                <p className="text-body-sm font-medium text-ink">₱{displayPrice.toLocaleString()}</p>
                <p className="text-micro text-ink-3">{isItemDP ? "(down payment)" : "(full price)"}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="space-y-2 pt-3 border-t border-line">
        <div className="flex justify-between text-body-sm">
          <span className="text-ink-3">Shipping</span>
          <span className="text-ink">{shipping === 0 ? "Free" : `₱${shipping.toLocaleString()}`}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-body-sm">
            <span className="text-ink-3">Coupon ({couponData?.code})</span>
            <span className="text-ink">−₱{discount.toLocaleString()}</span>
          </div>
        )}
        <div className="flex justify-between items-baseline pt-3 border-t border-line">
          <span className="text-body-sm font-medium text-ink">Total</span>
          <span className="text-display-s font-display font-medium text-ink">
            ₱{(isDP ? totalDueNow : total).toLocaleString()}
          </span>
        </div>
        {isDP && (
          <>
            <p className="text-micro text-ink-3">will pay upon place order</p>
            <div className="mt-2 px-3 py-2 rounded-md text-micro text-ink-3 bg-paper-2 border border-line">
              Balance: ₱{dpBalance.toLocaleString()} — will settle before shipping
            </div>
          </>
        )}
      </div>
    </>
  );

  const couponBody = (
    <div className="p-4 sm:p-5 border-t border-line">
      {couponData ? (
        <div className="flex items-center justify-between px-3 py-2.5 rounded-md bg-paper-2 border border-line">
          <span className="text-body-sm font-medium text-ink">
            {couponData.code} — −₱{discount.toLocaleString()} off
          </span>
          <button onClick={() => setCouponData(null)} className="text-micro underline text-ink-3 hover:text-ink">
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
            className={`flex-1 min-w-0 bg-paper-2 border-0 rounded-md px-4 py-2.5 text-body-sm text-ink focus:outline-2 focus:outline-ink focus:outline-offset-1 ${couponError ? "outline outline-2 outline-state-error" : ""}`}
            onKeyDown={e => e.key === "Enter" && handleApplyCoupon()}
          />
          <button onClick={handleApplyCoupon} disabled={applyingCoupon || !couponCode.trim()}
            className="shrink-0 px-4 py-2.5 rounded-md text-micro font-medium disabled:opacity-40 bg-ink text-paper hover:bg-ink-2 transition-colors">
            {applyingCoupon ? "…" : "Apply"}
          </button>
        </div>
      )}
      {couponError && <p className="text-micro mt-1.5 text-state-error">{couponError}</p>}
      {/* ETA display for pre-order items */}
      {(() => {
        const pre = items.find(i => i.product.status === "pre-order");
        if (!pre?.product.eta_start) return null;
        const fmt = (d: string) => new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
        return (
          <div className="mt-3 p-3 rounded-md bg-paper-2 border border-line">
            <p className="text-eyebrow text-ink-3 mb-0.5">Pre-order ETA</p>
            <p className="text-body-sm font-medium text-ink">
              {fmt(pre.product.eta_start)}{pre.product.eta_end ? ` – ${fmt(pre.product.eta_end)}` : ""}
            </p>
            <p className="text-micro mt-1 text-ink-3">Estimated arrival</p>
          </div>
        );
      })()}
      {!couponData && activeCoupons.length > 0 && (
        <div className="mt-3">
          <p className="text-eyebrow text-ink-3 mb-2">Available promos</p>
          <div className="flex flex-wrap gap-1.5">
            {activeCoupons.map(c => (
              <button key={c.code}
                onClick={() => { setCouponCode(c.code); setCouponError(""); }}
                className="text-micro font-medium px-2.5 py-1 rounded-sm transition-colors border border-dashed border-line text-ink-3 hover:border-ink hover:text-ink">
                {c.code} · {c.type === "percent" ? `${c.value}% off` : `₱${Number(c.value).toLocaleString()} off`}
                {c.min_order > 0 && <span className="text-ink-3"> (min ₱{Number(c.min_order).toLocaleString()})</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-paper min-h-screen">
      <div className="max-w-6xl mx-auto px-5 md:px-8 lg:px-12 py-10 md:py-16">
        <h1 className="text-display-s text-ink font-display font-medium mb-8">Checkout</h1>

        {/* Steps */}
        <div className="flex items-center gap-2 mb-8">
          {(["details", "payment", "confirm"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => step !== "confirm" && i < idx + 1 && setStep(s)}>
                <div className={`w-6 h-6 flex items-center justify-center rounded-full text-micro font-medium ${
                  step === s ? "bg-ink text-paper" : i < idx ? "border border-ink text-ink" : "border border-line text-ink-3"
                }`}>
                  {i < idx ? "✓" : i + 1}
                </div>
                <span className={`text-body-sm font-medium capitalize hidden sm:block ${step === s ? "text-ink" : "text-ink-3"}`}>
                  {s === "details" ? "Your details" : s === "payment" ? "Payment" : "Confirm"}
                </span>
              </div>
              {i < 2 && <ChevronRight className="w-4 h-4 text-ink-3" />}
            </div>
          ))}
        </div>

        {/* Mobile collapsed summary */}
        <details className="lg:hidden mb-6 border border-line rounded-md bg-paper group">
          <summary className="flex items-center justify-between px-4 py-3.5 cursor-pointer list-none">
            <span className="text-body-sm text-ink-2">
              {items.length} item{items.length === 1 ? "" : "s"} · <span className="text-ink font-medium">₱{(isDP ? totalDueNow : total).toLocaleString()}</span>
            </span>
            <ChevronDown className="w-4 h-4 text-ink-3 transition-transform duration-fast group-open:rotate-180" />
          </summary>
          <div className="px-4 pb-4 pt-1 border-t border-line">
            {summaryBody}
          </div>
          {couponBody}
        </details>

        <div className="grid lg:grid-cols-3 gap-8 items-start">
          {/* Main form */}
          <div className="lg:col-span-2">
            {/* Step 1: Details */}
            {step === "details" && (
              <div className="p-6 bg-paper border border-line rounded-md">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-eyebrow text-ink-3">Contact</p>
                  <span className="text-micro text-ink-3">
                    <span className="text-state-error">*</span> Required
                  </span>
                </div>
                <div className="grid sm:grid-cols-2 gap-4 mb-8">
                  {CONTACT_FIELDS.map(renderField)}
                </div>

                <p className="text-eyebrow text-ink-3 mb-4">Shipping address</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {ADDRESS_FIELDS.map(renderField)}

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
                    <label className="block text-micro text-ink-3 mb-1.5">Postal code</label>
                    <input
                      value={form.postal}
                      onChange={e => setForm(f => ({ ...f, postal: e.target.value }))}
                      placeholder="1630"
                      className="w-full bg-paper-2 border-0 rounded-md px-4 py-3 text-body-sm text-ink focus:outline-2 focus:outline-ink focus:outline-offset-1"
                    />
                  </div>
                </div>

                <button
                  onClick={handleContinueToPayment}
                  className="mt-6 w-full py-3.5 rounded-md text-body-sm font-medium bg-ink text-paper hover:bg-ink-2 transition-colors">
                  Continue to payment
                </button>
              </div>
            )}

            {/* Step 2: Payment */}
            {step === "payment" && (
              <div className="space-y-4">
                <div className="p-6 bg-paper border border-line rounded-md">
                  <p className="text-eyebrow text-ink-3 mb-4">Payment method</p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {PAYMENT_METHODS.filter(pm => pm.id !== "cod" || codEnabled).map(pm => {
                      const Icon = paymentIcon(pm.id);
                      const selected = paymentMethod === pm.id;
                      return (
                        <button key={pm.id} onClick={() => setPaymentMethod(pm.id)}
                          className={`flex items-center gap-3 p-4 rounded-md border text-left transition-colors ${
                            selected ? "border-ink bg-paper-2" : "border-line hover:border-ink"
                          }`}>
                          <Icon className="w-5 h-5 text-ink-3 shrink-0" />
                          <span className="text-body-sm font-medium text-ink">{pm.label}</span>
                          {selected && <CheckCircle className="ml-auto w-4 h-4 text-ink shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Payment instructions */}
                {!isCOD && (
                  <div className="p-6 bg-paper border border-line rounded-md">
                    <p className="text-eyebrow text-ink-3 mb-4">Payment instructions</p>
                    <div className="p-4 rounded-md mb-4 bg-paper-2 border border-line">
                      {/* Amount breakdown helper */}
                      {(() => {
                        const amt = isDP ? totalDueNow : total;
                        const amountEl = isMixed ? (
                          <div>
                            <p className="text-ink">Amount: <span className="font-medium">₱{amt.toLocaleString()}</span></p>
                            <p className="text-micro mt-0.5 text-ink-3">
                              {items.filter(i => i.payment_type !== "downpayment").map(i => `${i.product.name} ₱${(i.unit_price * i.quantity).toLocaleString()}`).join(" + ")}
                              {" "}+ ₱{dpFeeSubtotal.toLocaleString()} Downpayment
                              {shipping > 0 ? ` + ₱${shipping.toLocaleString()} Shipping` : ""}
                              {discount > 0 ? ` − ₱${discount.toLocaleString()} Discount` : ""}
                              {" "}= ₱{amt.toLocaleString()}
                            </p>
                          </div>
                        ) : (
                          <p className="text-ink">Amount: ₱{amt.toLocaleString()}{isDP && <span className="text-micro ml-1 text-ink-3">(downpayment only)</span>}</p>
                        );
                        if (paymentMethod === "gcash") return (
                          <div className="text-body-sm space-y-2 text-ink">
                            {payCfg.gcashQr && (
                              <div className="flex justify-center pb-1">
                                <img src={payCfg.gcashQr} alt="GCash QR Code" style={{ width: 180, height: 180, objectFit: "contain" }} />
                              </div>
                            )}
                            <p className="font-medium">GCash Number: {payCfg.gcashNumber}</p>
                            <p className="text-ink-2">Account Name: {payCfg.gcashName}</p>
                            {amountEl}
                          </div>
                        );
                        if (paymentMethod === "maya") return (
                          <div className="text-body-sm space-y-2 text-ink">
                            {payCfg.mayaQr && (
                              <div className="flex justify-center pb-1">
                                <img src={payCfg.mayaQr} alt="Maya QR Code" style={{ width: 180, height: 180, objectFit: "contain" }} />
                              </div>
                            )}
                            <p className="font-medium">Maya Number: {payCfg.mayaNumber}</p>
                            <p className="text-ink-2">Account Name: {payCfg.mayaName}</p>
                            {amountEl}
                          </div>
                        );
                        if (paymentMethod === "bank_transfer") return (
                          <div className="text-body-sm space-y-4 text-ink">
                            <div className="space-y-2">
                              {payCfg.bank1Qr && (
                                <div className="flex justify-center pb-1">
                                  <img src={payCfg.bank1Qr} alt={`${payCfg.bank1Name} QR Code`} style={{ width: 180, height: 180, objectFit: "contain" }} />
                                </div>
                              )}
                              <p className="font-medium">{payCfg.bank1Name}</p>
                              <p className="text-ink-2">Account Number: {payCfg.bank1Account}</p>
                              <p className="text-ink-2">Account Name: {payCfg.bank1AccountName}</p>
                            </div>
                            <div className="space-y-2 border-t border-line pt-3">
                              {payCfg.bank2Qr && (
                                <div className="flex justify-center pb-1">
                                  <img src={payCfg.bank2Qr} alt={`${payCfg.bank2Name} QR Code`} style={{ width: 180, height: 180, objectFit: "contain" }} />
                                </div>
                              )}
                              <p className="font-medium">{payCfg.bank2Name}</p>
                              <p className="text-ink-2">Account Number: {payCfg.bank2Account}</p>
                              <p className="text-ink-2">Account Name: {payCfg.bank2AccountName}</p>
                            </div>
                            <div className="border-t border-line pt-3">{amountEl}</div>
                          </div>
                        );
                        return null;
                      })()}
                    </div>

                    {/* Balance reminder for mixed orders */}
                    {isMixed && (
                      <p className="text-micro mb-4 text-ink-3">
                        Balance: ₱{dpBalance.toLocaleString()} — to be settled before shipping
                      </p>
                    )}

                    {/* Reference number */}
                    <div className="mb-4">
                      <label className="block text-micro text-ink-3 mb-1.5">
                        Reference / transaction number <span className="text-state-error">*</span>
                      </label>
                      <input
                        type="text"
                        value={referenceNumber}
                        onChange={e => setReferenceNumber(e.target.value)}
                        placeholder="e.g. 123456789012"
                        className="w-full bg-paper-2 border-0 rounded-md px-4 py-3 text-body-sm text-ink focus:outline-2 focus:outline-ink focus:outline-offset-1"
                      />
                    </div>

                    {/* Proof upload */}
                    <div>
                      <p className="text-micro text-ink-3 mb-1.5">Upload proof of payment</p>
                      <div className={`border-2 border-dashed rounded-md p-4 sm:p-8 text-center cursor-pointer transition-colors bg-paper-2 ${
                        proofFile ? "border-ink" : "border-line"
                      }`}>
                        <input type="file" accept="image/*,.pdf" className="hidden" id="proof"
                          onChange={e => setProofFile(e.target.files?.[0] || null)} />
                        <label htmlFor="proof" className="cursor-pointer">
                          {proofFile ? (
                            <div className="flex flex-col items-center">
                              {proofPreview ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={proofPreview} alt="Proof preview" className="w-full max-h-40 rounded-md mb-3 object-contain border border-line" />
                              ) : (
                                <CheckCircle className="w-8 h-8 mb-2 text-ink" />
                              )}
                              <p className="text-body-sm font-medium max-w-full truncate px-2 text-ink">{proofFile.name}</p>
                              <p className="text-micro mt-1 text-ink-3">Click to change</p>
                            </div>
                          ) : (
                            <div>
                              <Upload className="w-8 h-8 mx-auto mb-2 text-ink-3" />
                              <p className="text-body-sm font-medium text-ink">Upload screenshot or receipt</p>
                              <p className="text-micro mt-1 text-ink-3">JPG, PNG, or PDF</p>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {isCOD && (
                  <div className="flex items-start gap-3 p-4 bg-paper-2 border border-line rounded-md">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-ink-3" />
                    <div className="text-body-sm leading-relaxed text-ink-2">
                      <p>Cash on Delivery available nationwide. Our team will contact you before dispatch.</p>
                      <p className="mt-1.5 text-ink-3">
                        COD shipping: Luzon ₱250 · Visayas &amp; Mindanao ₱350 (no free shipping for COD)
                      </p>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setStep("confirm")}
                  disabled={!isCOD && (!proofFile || !referenceNumber.trim())}
                  className="w-full py-3.5 rounded-md text-body-sm font-medium transition-colors disabled:opacity-40 bg-ink text-paper hover:bg-ink-2">
                  Review order
                </button>
              </div>
            )}

            {/* Step 3: Confirm */}
            {step === "confirm" && (
              <div className="space-y-4">
                <div className="p-6 bg-paper border border-line rounded-md">
                  <p className="text-eyebrow text-ink-3 mb-4">Delivery to</p>
                  <p className="font-medium text-body-sm text-ink">{form.name}</p>
                  <p className="text-body-sm text-ink-3">{form.mobile} · {form.email}</p>
                  <p className="text-body-sm mt-1 text-ink-3">
                    {form.street}, {form.barangay}, {form.city}, {form.province} {form.postal}
                  </p>
                </div>
                <div className="p-6 bg-paper border border-line rounded-md">
                  <p className="text-eyebrow text-ink-3 mb-4">
                    Payment: {PAYMENT_METHODS.find(p => p.id === paymentMethod)?.label}
                  </p>
                  {isDP && (
                    <div className="mb-4 rounded-md overflow-hidden border border-line">
                      <div className="px-4 py-3 text-body-sm flex justify-between items-start">
                        <span className="text-ink-3">Due now</span>
                        <div className="text-right">
                          <span className="font-medium text-ink">₱{totalDueNow.toLocaleString()}</span>
                          {isMixed && (
                            <p className="text-micro mt-0.5 text-ink-3">
                              On hand ₱{onHandSubtotal.toLocaleString()} + ₱{dpFeeSubtotal.toLocaleString()} Downpayment
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="px-4 py-3 flex justify-between text-body-sm border-t border-line bg-paper-2">
                        <span className="text-ink-3">Balance (paid before shipping)</span>
                        <span className="font-medium text-ink">₱{dpBalance.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                  {referenceNumber && (
                    <div className="mt-3 px-4 py-3 rounded-md bg-paper-2 border border-line">
                      <p className="text-eyebrow text-ink-3 mb-0.5">Reference number</p>
                      <p className="text-body-sm font-medium text-ink">{referenceNumber}</p>
                    </div>
                  )}
                  {proofFile && (
                    <div className="mt-3">
                      {proofPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={proofPreview} alt="Proof of payment" className="rounded-md max-h-48 object-contain border border-line" />
                      ) : (
                        <p className="text-body-sm text-ink">✓ {proofFile.name}</p>
                      )}
                    </div>
                  )}
                  {isCOD && <p className="text-body-sm text-ink-3">Pay upon delivery</p>}
                </div>
                {orderError && (
                  <div className="px-4 py-3 text-body-sm rounded-md bg-paper-2 text-state-error border border-state-error">
                    {orderError}
                  </div>
                )}
                <button onClick={handlePlaceOrder} disabled={placing}
                  className="w-full py-4 rounded-md text-body-sm font-medium transition-colors disabled:opacity-60 bg-ink text-paper hover:bg-ink-2">
                  {placing ? "Placing order…" : `Place order — ₱${(isDP ? totalDueNow : total).toLocaleString()}`}
                </button>
              </div>
            )}
          </div>

          {/* Order summary (desktop) */}
          <div className="hidden lg:block lg:sticky lg:top-24 overflow-hidden w-full min-w-0 bg-paper border border-line rounded-md">
            <div className="p-4 sm:p-5">
              <p className="text-eyebrow text-ink-3 mb-4">Order ({items.length})</p>
              {summaryBody}
            </div>
            {couponBody}
          </div>
        </div>
      </div>
    </div>
  );
}

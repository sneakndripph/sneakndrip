"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BRAND, FONTS } from "@/lib/constants";
import Image from "next/image";
import { Package, User, LogOut, ChevronRight, Clock, CheckCircle, Truck, Lock, Eye, EyeOff, Save, MapPin, MessageCircle, X, Home, Star } from "lucide-react";
import PhAddressSelect from "@/components/ui/PhAddressSelect";
import { createClient } from "@/lib/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

const STATUS_CONFIG = {
  pending:    { icon: Clock,       color: "#8A8580", label: "Pending",    bg: "rgba(138,133,128,0.12)" },
  paid:       { icon: CheckCircle, color: "#5BB8B4", label: "Paid",       bg: "rgba(91,184,180,0.12)" },
  processing: { icon: Clock,       color: "#D97706", label: "Processing", bg: "rgba(217,119,6,0.12)" },
  shipped:    { icon: Truck,       color: "#3B82F6", label: "Shipped",    bg: "rgba(59,130,246,0.12)" },
  delivered:  { icon: CheckCircle, color: "#10B981", label: "Delivered",  bg: "rgba(16,185,129,0.12)" },
  cancelled:  { icon: Clock,       color: "#D94F3D", label: "Cancelled",  bg: "rgba(217,79,61,0.12)" },
} as const;

type OrderItem = {
  product_name: string;
  size: string;
  quantity: number;
  unit_price: number;
  product_id?: string | null;
  products: { images: string[] | null; bg: string | null; slug: string | null } | null;
};
type Order = {
  id: string;
  order_number: string;
  created_at: string;
  status: string;
  total: number;
  subtotal?: number;
  shipping_fee?: number;
  discount?: number;
  coupon_code?: string | null;
  payment_method: string;
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
type Tab = "orders" | "account" | "address" | "password";

// COD skips the "Confirmed/Paid" step
const STEPS_DEFAULT = [
  { key: "pending",    label: "Placed" },
  { key: "paid",       label: "Confirmed" },
  { key: "processing", label: "Processing" },
  { key: "shipped",    label: "Shipped" },
  { key: "delivered",  label: "Delivered" },
];
const STEPS_COD = [
  { key: "pending",    label: "Placed" },
  { key: "processing", label: "Processing" },
  { key: "shipped",    label: "Shipped" },
  { key: "delivered",  label: "Collected" },
];

export default function AccountPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("orders");
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Account details state
  const [profileForm, setProfileForm] = useState({ name: "", mobile: "" });
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileTouched, setProfileTouched] = useState(false);

  // Change password state
  const [pwForm, setPwForm] = useState({ newPw: "", confirmPw: "" });
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState<string | null>(null);
  const [cancelModalOrder, setCancelModalOrder] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [reviewModalOrder, setReviewModalOrder] = useState<Order | null>(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: "", body: "" });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Address state
  const [addressForm, setAddressForm] = useState({ street: "", barangay: "", city: "", province: "", postal: "", regionGroup: "" });
  const [addressSuccess, setAddressSuccess] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressShowErrors, setAddressShowErrors] = useState(false);
  const [pwTouched, setPwTouched] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/login"); return; }
      setUser(user);
      const meta = user.user_metadata ?? {};
      setProfileForm({
        name: meta.full_name || "",
        mobile: meta.mobile || "",
      });
      setAddressForm({
        street: meta.addr_street || "",
        barangay: meta.addr_barangay || "",
        city: meta.addr_city || "",
        province: meta.addr_province || "",
        postal: meta.addr_postal || "",
        regionGroup: meta.addr_region_group || "",
      });
      fetch("/api/orders")
        .then(r => r.json())
        .then(({ orders }) => {
          setOrders((orders as Order[]) ?? []);
          setLoadingOrders(false);
        });
    });
  }, [router]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileTouched(true);
    if (!profileForm.name.trim()) { setProfileError("Full name is required"); return; }
    setProfileError("");
    setSavingProfile(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      data: { full_name: profileForm.name.trim(), mobile: profileForm.mobile.trim() },
    });
    if (error) {
      setProfileError(error.message);
    } else {
      setProfileSuccess(true);
      setUser(prev => prev ? {
        ...prev,
        user_metadata: { ...prev.user_metadata, full_name: profileForm.name.trim(), mobile: profileForm.mobile.trim() },
      } : null);
      setTimeout(() => setProfileSuccess(false), 3000);
    }
    setSavingProfile(false);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwTouched(true);
    if (!pwForm.newPw) { setPwError("New password is required"); return; }
    if (pwForm.newPw.length < 6) { setPwError("Password must be at least 6 characters"); return; }
    if (pwForm.newPw !== pwForm.confirmPw) { setPwError("Passwords do not match"); return; }
    setPwError("");
    setSavingPw(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: pwForm.newPw });
    if (error) {
      setPwError(error.message);
    } else {
      setPwSuccess(true);
      setPwForm({ newPw: "", confirmPw: "" });
      setPwTouched(false);
      setTimeout(() => setPwSuccess(false), 4000);
    }
    setSavingPw(false);
  }

  async function handleSaveAddress(e: React.FormEvent) {
    e.preventDefault();
    setAddressShowErrors(true);
    if (!addressForm.street || !addressForm.province || !addressForm.city || !addressForm.barangay) return;
    setSavingAddress(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      data: {
        addr_street: addressForm.street.trim(),
        addr_barangay: addressForm.barangay,
        addr_city: addressForm.city,
        addr_province: addressForm.province,
        addr_postal: addressForm.postal.trim(),
        addr_region_group: addressForm.regionGroup,
      },
    });
    if (!error) {
      setAddressSuccess(true);
      setTimeout(() => setAddressSuccess(false), 3000);
    }
    setSavingAddress(false);
  }

  async function executeCancelOrder() {
    if (!cancelModalOrder) return;
    const orderNumber = cancelModalOrder;
    setCancelModalOrder(null);
    setCancellingOrder(orderNumber);
    const res = await fetch("/api/orders/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderNumber, reason: cancelReason.trim() || undefined }),
    });
    if (res.ok) {
      setOrders(prev => prev.map(o => o.order_number === orderNumber ? { ...o, status: "cancelled" } : o));
    }
    setCancellingOrder(null);
    setCancelReason("");
  }

  async function handleSubmitReview() {
    if (!reviewModalOrder || !reviewForm.body.trim()) return;
    setSubmittingReview(true);
    const firstItem = reviewModalOrder.order_items[0];
    await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_id: firstItem?.product_id ?? null,
        author_name: user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Customer",
        rating: reviewForm.rating,
        title: reviewForm.title.trim() || null,
        body: reviewForm.body.trim(),
      }),
    });
    setSubmittingReview(false);
    setReviewSuccess(true);
    setReviewForm({ rating: 5, title: "", body: "" });
    setTimeout(() => {
      setReviewModalOrder(null);
      setReviewSuccess(false);
    }, 2000);
  }

  if (!user) return null;

  const displayName = user.user_metadata?.full_name || user.email?.split("@")[0] || "User";

  const NAV_TABS = [
    { id: "orders" as Tab, icon: Package, label: "My Orders" },
    { id: "account" as Tab, icon: User, label: "Account Details" },
    { id: "address" as Tab, icon: Home, label: "My Address" },
    { id: "password" as Tab, icon: Lock, label: "Change Password" },
  ];

  const inputCls = "w-full px-4 py-3 text-sm focus:outline-none transition-colors";

  return (
    <div style={{ background: BRAND.bg, fontFamily: FONTS.body, minHeight: "100vh" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: BRAND.teal }}>Welcome back</p>
            <h1 style={{ fontFamily: FONTS.display, fontSize: "2.5rem", letterSpacing: "0.04em", color: BRAND.black }}>
              MY ACCOUNT
            </h1>
          </div>
          <button onClick={handleSignOut}
            className="flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-60"
            style={{ color: BRAND.muted }}>
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="rounded-xl overflow-hidden" style={{ background: BRAND.card, border: `1px solid ${BRAND.cardBorder}` }}>
              {NAV_TABS.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button key={item.id} onClick={() => setTab(item.id)}
                    className="w-full flex items-center justify-between px-4 py-4 text-sm font-semibold transition-colors"
                    style={{
                      borderBottom: idx < NAV_TABS.length - 1 ? `1px solid ${BRAND.border}` : "none",
                      background: tab === item.id ? `${BRAND.teal}10` : "transparent",
                      color: tab === item.id ? BRAND.teal : BRAND.black,
                      borderLeft: tab === item.id ? `3px solid ${BRAND.teal}` : "3px solid transparent",
                    }}>
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </div>
                    <ChevronRight className="w-4 h-4" style={{ color: BRAND.mutedLight }} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">

            {/* Orders tab */}
            {tab === "orders" && (
              <div className="space-y-4">
                <h2 className="font-black text-lg mb-4" style={{ color: BRAND.black }}>Order History</h2>
                {loadingOrders ? (
                  <div className="py-12 text-center text-sm" style={{ color: BRAND.muted }}>Loading orders…</div>
                ) : orders.length === 0 ? (
                  <div className="py-12 text-center">
                    <p style={{ fontFamily: FONTS.display, fontSize: "1.5rem", color: BRAND.muted, letterSpacing: "0.04em" }}>NO ORDERS YET</p>
                    <p className="text-sm mt-2 mb-6" style={{ color: BRAND.mutedLight }}>Your orders will show up here after you place one.</p>
                    <a href="/shop" className="inline-block px-8 py-3 font-bold text-sm uppercase tracking-widest"
                      style={{ background: BRAND.black, color: BRAND.bg }}>Shop Now</a>
                  </div>
                ) : orders.map(order => {
                  const isCOD = order.payment_method === "cod";
                  const STEPS = isCOD ? STEPS_COD : STEPS_DEFAULT;
                  const cfg = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending;
                  const Icon = cfg.icon;
                  const date = new Date(order.created_at).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
                  // For COD, "paid" status never happens — map it to processing index for progress
                  const activeIdx = STEPS.findIndex(s => s.key === order.status);
                  const address = [order.shipping_street, order.shipping_barangay, order.shipping_city, order.shipping_province].filter(Boolean).join(", ");
                  return (
                    <div key={order.id} className="rounded-xl overflow-hidden"
                      style={{ background: BRAND.card, border: `1px solid ${BRAND.cardBorder}` }}>

                      {/* Order header */}
                      <div className="px-5 pt-5 pb-4" style={{ borderBottom: `1px solid ${BRAND.border}` }}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-black text-sm" style={{ color: BRAND.black }}>{order.order_number}</p>
                            <p className="text-xs mt-0.5" style={{ color: BRAND.muted }}>{date}</p>
                            {(order.customer_name || order.customer_mobile) && (
                              <p className="text-xs mt-1" style={{ color: BRAND.muted }}>
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
                      </div>

                      {/* Progress tracker */}
                      {order.status !== "cancelled" && (
                        <div className="px-5 py-5" style={{ borderBottom: `1px solid ${BRAND.border}` }}>
                          <div className="flex items-center">
                            {STEPS.map((step, i) => {
                              const done = activeIdx >= i;
                              const active = activeIdx === i;
                              return (
                                <div key={step.key} className="flex items-center flex-1 min-w-0">
                                  <div className="flex flex-col items-center flex-1">
                                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black mb-1.5 shrink-0 transition-all"
                                      style={{
                                        background: active ? BRAND.teal : done ? `${BRAND.teal}55` : BRAND.border,
                                        color: done ? "#fff" : BRAND.mutedLight,
                                        boxShadow: active ? `0 0 0 3px ${BRAND.teal}25` : "none",
                                      }}>
                                      {done && !active ? "✓" : i + 1}
                                    </div>
                                    <p className="text-[9px] font-bold text-center whitespace-nowrap px-0.5"
                                      style={{ color: active ? BRAND.teal : done ? `${BRAND.teal}90` : BRAND.mutedLight }}>
                                      {step.label}
                                    </p>
                                  </div>
                                  {i < STEPS.length - 1 && (
                                    <div className="h-0.5 flex-1 mx-0.5 mb-5 shrink-0 transition-all"
                                      style={{ background: activeIdx > i ? BRAND.teal : BRAND.border }} />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Tracking card — shown when shipped */}
                      {order.tracking_number && order.status === "shipped" && (
                        <div className="mx-5 my-4 p-4 rounded-lg flex items-center gap-3"
                          style={{ background: `${BRAND.teal}10`, border: `1px solid ${BRAND.teal}30` }}>
                          <Truck className="w-5 h-5 shrink-0" style={{ color: BRAND.teal }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold uppercase tracking-wide mb-0.5" style={{ color: BRAND.teal }}>Your order is on its way</p>
                            <p className="text-sm font-black" style={{ color: BRAND.black }}>{order.tracking_number}</p>
                            <p className="text-[11px] mt-0.5" style={{ color: BRAND.muted }}>Use this number on your courier&apos;s website to track delivery.</p>
                          </div>
                        </div>
                      )}

                      {/* Shipping address */}
                      {address && (
                        <div className="px-5 pb-4 flex items-start gap-2">
                          <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: BRAND.mutedLight }} />
                          <p className="text-xs" style={{ color: BRAND.muted }}>{address}</p>
                        </div>
                      )}

                      {/* Items */}
                      <div style={{ borderTop: `1px solid ${BRAND.border}` }}>
                        {order.order_items?.map((item, i) => {
                          const img = item.products?.images?.[0] ?? null;
                          const bg = item.products?.bg ?? "#EDE9E3";
                          return (
                            <div key={i} className="flex items-center gap-3 px-5 py-3"
                              style={{ borderBottom: `1px solid ${BRAND.border}` }}>
                              {item.products?.slug ? (
                                <Link href={`/shop/${item.products.slug}`} className="w-11 h-11 shrink-0 rounded-lg overflow-hidden relative transition-opacity hover:opacity-70"
                                  style={{ background: bg, border: `1px solid ${BRAND.border}` }}>
                                  {img ? (
                                    <Image src={img} alt={item.product_name} fill className="object-cover" sizes="44px" />
                                  ) : (
                                    <span className="absolute inset-0 flex items-center justify-center text-xs font-black"
                                      style={{ color: BRAND.black, opacity: 0.12, fontFamily: FONTS.display }}>
                                      S
                                    </span>
                                  )}
                                </Link>
                              ) : (
                                <div className="w-11 h-11 shrink-0 rounded-lg overflow-hidden relative"
                                  style={{ background: bg, border: `1px solid ${BRAND.border}` }}>
                                  {img ? (
                                    <Image src={img} alt={item.product_name} fill className="object-cover" sizes="44px" />
                                  ) : (
                                    <span className="absolute inset-0 flex items-center justify-center text-xs font-black"
                                      style={{ color: BRAND.black, opacity: 0.12, fontFamily: FONTS.display }}>
                                      S
                                    </span>
                                  )}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate" style={{ color: BRAND.black }}>{item.product_name}</p>
                                <p className="text-xs" style={{ color: BRAND.muted }}>Size {item.size} · Qty {item.quantity}</p>
                              </div>
                              <p className="font-bold text-sm shrink-0" style={{ color: BRAND.black }}>
                                ₱{(item.unit_price * item.quantity).toLocaleString()}
                              </p>
                            </div>
                          );
                        })}
                      </div>

                      {/* Order breakdown + actions */}
                      <div className="px-5 py-4" style={{ borderTop: `1px solid ${BRAND.border}` }}>
                        {/* Price breakdown */}
                        {(order.subtotal !== undefined) && (
                          <div className="space-y-1 mb-3 text-xs" style={{ color: BRAND.muted }}>
                            <div className="flex justify-between">
                              <span>Subtotal</span>
                              <span>₱{Number(order.subtotal).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Shipping</span>
                              <span style={{ color: order.shipping_fee === 0 ? BRAND.teal : undefined }}>
                                {order.shipping_fee === 0 ? "FREE" : `₱${Number(order.shipping_fee).toLocaleString()}`}
                              </span>
                            </div>
                            {(order.discount ?? 0) > 0 && (
                              <div className="flex justify-between" style={{ color: BRAND.teal }}>
                                <span>Coupon {order.coupon_code ? `(${order.coupon_code})` : ""}</span>
                                <span>−₱{Number(order.discount).toLocaleString()}</span>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 flex-wrap">
                            <p className="text-xs" style={{ color: BRAND.muted }}>
                              {isCOD ? "Cash on Delivery" : order.payment_method?.replace("_", " ")}
                            </p>
                            {order.payment_reference && (
                              <p className="text-xs font-medium" style={{ color: BRAND.muted }}>
                                Ref: <span style={{ color: BRAND.black }}>{order.payment_reference}</span>
                              </p>
                            )}
                            {!isCOD && order.proof_of_payment && (
                              <a
                                href={`/api/proof?orderNumber=${encodeURIComponent(order.order_number)}`}
                                target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs font-semibold transition-opacity hover:opacity-70"
                                style={{ color: BRAND.teal }}>
                                View Proof
                              </a>
                            )}
                            <button
                              onClick={() => window.dispatchEvent(new CustomEvent("open-chat"))}
                              className="flex items-center gap-1 text-xs font-semibold transition-opacity hover:opacity-70"
                              style={{ color: BRAND.teal }}>
                              <MessageCircle className="w-3.5 h-3.5" /> Need help?
                            </button>
                          </div>
                          <div className="flex items-center gap-3 flex-wrap">
                            {order.status === "pending" && isCOD && (
                              <button
                                onClick={() => setCancelModalOrder(order.order_number)}
                                disabled={cancellingOrder === order.order_number}
                                className="text-xs font-bold uppercase tracking-wide px-3 py-1.5 transition-opacity disabled:opacity-50"
                                style={{ border: `1px solid ${BRAND.red}`, color: BRAND.red }}>
                                {cancellingOrder === order.order_number ? "Cancelling…" : "Cancel Order"}
                              </button>
                            )}
                            {order.status === "delivered" && (
                              <button
                                onClick={() => { setReviewModalOrder(order); setReviewForm({ rating: 5, title: "", body: "" }); setReviewSuccess(false); }}
                                className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide px-3 py-1.5 transition-opacity hover:opacity-70"
                                style={{ border: `1px solid ${BRAND.teal}`, color: BRAND.teal }}>
                                <Star className="w-3 h-3" /> Write a Review
                              </button>
                            )}
                            <p className="font-black text-sm shrink-0" style={{ color: BRAND.black }}>
                              Total ₱{Number(order.total).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Account Details tab */}
            {tab === "account" && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-black text-lg" style={{ color: BRAND.black }}>Account Details</h2>
                  <span className="text-xs" style={{ color: BRAND.muted }}>
                    <span style={{ color: BRAND.red }}>*</span> Required
                  </span>
                </div>
                <p className="text-sm mb-6" style={{ color: BRAND.muted }}>Signed in as <strong>{user.email}</strong></p>

                <form onSubmit={handleSaveProfile}>
                  <div className="p-6 rounded-xl space-y-4" style={{ background: BRAND.card, border: `1px solid ${BRAND.cardBorder}` }}>

                    {profileSuccess && (
                      <div className="flex items-center gap-2 px-4 py-3 rounded text-sm font-semibold"
                        style={{ background: `${BRAND.teal}15`, color: BRAND.teal, border: `1px solid ${BRAND.teal}30` }}>
                        <CheckCircle className="w-4 h-4" /> Profile updated successfully!
                      </div>
                    )}
                    {profileError && (
                      <div className="px-4 py-3 rounded text-sm font-medium"
                        style={{ background: `${BRAND.red}12`, color: BRAND.red, border: `1px solid ${BRAND.red}30` }}>
                        {profileError}
                      </div>
                    )}

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>
                          Full Name <span style={{ color: BRAND.red }}>*</span>
                        </label>
                        <input
                          value={profileForm.name}
                          onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))}
                          placeholder="Juan Dela Cruz"
                          className={inputCls}
                          style={{
                            background: BRAND.bg,
                            border: `1px solid ${profileTouched && !profileForm.name ? BRAND.red : BRAND.border}`,
                            color: BRAND.black,
                          }}
                          onFocus={e => (e.currentTarget.style.borderColor = BRAND.teal)}
                          onBlur={e => (e.currentTarget.style.borderColor = profileTouched && !profileForm.name ? BRAND.red : BRAND.border)}
                        />
                        {profileTouched && !profileForm.name && (
                          <p className="mt-1 text-[11px] font-semibold" style={{ color: BRAND.red }}>Full name is required</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>
                          Email Address
                        </label>
                        <input
                          value={user.email || ""}
                          disabled
                          className={inputCls}
                          style={{ background: BRAND.border, border: `1px solid ${BRAND.border}`, color: BRAND.muted, cursor: "not-allowed" }}
                        />
                        <p className="mt-1 text-[11px]" style={{ color: BRAND.mutedLight }}>Email cannot be changed</p>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>
                          Mobile Number
                        </label>
                        <input
                          value={profileForm.mobile}
                          onChange={e => setProfileForm(f => ({ ...f, mobile: e.target.value.replace(/\D/g, "").slice(0, 11) }))}
                          placeholder="09XX XXX XXXX"
                          inputMode="numeric"
                          maxLength={11}
                          className={inputCls}
                          style={{ background: BRAND.bg, border: `1px solid ${BRAND.border}`, color: BRAND.black }}
                          onFocus={e => (e.currentTarget.style.borderColor = BRAND.teal)}
                          onBlur={e => (e.currentTarget.style.borderColor = BRAND.border)}
                        />
                      </div>
                    </div>

                    <button type="submit" disabled={savingProfile}
                      className="flex items-center gap-2 mt-2 px-6 py-3 font-black text-sm uppercase tracking-widest transition-opacity hover:opacity-90 disabled:opacity-50"
                      style={{ background: BRAND.black, color: BRAND.bg }}>
                      <Save className="w-4 h-4" />
                      {savingProfile ? "Saving…" : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Address tab */}
            {tab === "address" && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-black text-lg" style={{ color: BRAND.black }}>My Default Address</h2>
                  <span className="text-xs" style={{ color: BRAND.muted }}>
                    <span style={{ color: BRAND.red }}>*</span> Required
                  </span>
                </div>
                <p className="text-sm mb-6" style={{ color: BRAND.muted }}>
                  Saved address will auto-fill at checkout.
                </p>

                <form onSubmit={handleSaveAddress}>
                  <div className="p-6 rounded-xl space-y-4" style={{ background: BRAND.card, border: `1px solid ${BRAND.cardBorder}` }}>
                    {addressSuccess && (
                      <div className="flex items-center gap-2 px-4 py-3 rounded text-sm font-semibold"
                        style={{ background: `${BRAND.teal}15`, color: BRAND.teal, border: `1px solid ${BRAND.teal}30` }}>
                        <CheckCircle className="w-4 h-4" /> Address saved successfully!
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>
                        Street Address <span style={{ color: BRAND.red }}>*</span>
                      </label>
                      <input
                        value={addressForm.street}
                        onChange={e => setAddressForm(f => ({ ...f, street: e.target.value }))}
                        placeholder="123 Rizal St."
                        className={inputCls}
                        style={{
                          background: BRAND.bg,
                          border: `1px solid ${addressShowErrors && !addressForm.street ? BRAND.red : BRAND.border}`,
                          color: BRAND.black,
                        }}
                        onFocus={e => (e.currentTarget.style.borderColor = BRAND.teal)}
                        onBlur={e => (e.currentTarget.style.borderColor = addressShowErrors && !addressForm.street ? BRAND.red : BRAND.border)}
                      />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <PhAddressSelect
                        province={addressForm.province}
                        city={addressForm.city}
                        barangay={addressForm.barangay}
                        onProvinceChange={v => setAddressForm(f => ({ ...f, province: v }))}
                        onCityChange={v => setAddressForm(f => ({ ...f, city: v }))}
                        onBarangayChange={v => setAddressForm(f => ({ ...f, barangay: v }))}
                        onRegionGroupChange={v => setAddressForm(f => ({ ...f, regionGroup: v }))}
                        showErrors={addressShowErrors}
                      />
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>
                          Postal Code
                        </label>
                        <input
                          value={addressForm.postal}
                          onChange={e => setAddressForm(f => ({ ...f, postal: e.target.value }))}
                          placeholder="1630"
                          className={inputCls}
                          style={{ background: BRAND.bg, border: `1px solid ${BRAND.border}`, color: BRAND.black }}
                          onFocus={e => (e.currentTarget.style.borderColor = BRAND.teal)}
                          onBlur={e => (e.currentTarget.style.borderColor = BRAND.border)}
                        />
                      </div>
                    </div>

                    <button type="submit" disabled={savingAddress}
                      className="flex items-center gap-2 mt-2 px-6 py-3 font-black text-sm uppercase tracking-widest transition-opacity hover:opacity-90 disabled:opacity-50"
                      style={{ background: BRAND.black, color: BRAND.bg }}>
                      <Save className="w-4 h-4" />
                      {savingAddress ? "Saving…" : "Save Address"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Change Password tab */}
            {tab === "password" && (
              <div>
                <h2 className="font-black text-lg mb-2" style={{ color: BRAND.black }}>Change Password</h2>
                <p className="text-sm mb-6" style={{ color: BRAND.muted }}>
                  Choose a strong password with at least 6 characters.{" "}
                  <span style={{ color: BRAND.red }}>*</span> Required
                </p>

                <form onSubmit={handleChangePassword}>
                  <div className="p-6 rounded-xl space-y-4" style={{ background: BRAND.card, border: `1px solid ${BRAND.cardBorder}` }}>

                    {pwSuccess && (
                      <div className="flex items-center gap-2 px-4 py-3 rounded text-sm font-semibold"
                        style={{ background: `${BRAND.teal}15`, color: BRAND.teal, border: `1px solid ${BRAND.teal}30` }}>
                        <CheckCircle className="w-4 h-4" /> Password updated successfully!
                      </div>
                    )}
                    {pwError && (
                      <div className="px-4 py-3 rounded text-sm font-medium"
                        style={{ background: `${BRAND.red}12`, color: BRAND.red, border: `1px solid ${BRAND.red}30` }}>
                        {pwError}
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>
                        New Password <span style={{ color: BRAND.red }}>*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPw ? "text" : "password"}
                          value={pwForm.newPw}
                          onChange={e => setPwForm(f => ({ ...f, newPw: e.target.value }))}
                          placeholder="Min. 6 characters"
                          className={`${inputCls} pr-12`}
                          style={{
                            background: BRAND.bg,
                            border: `1px solid ${pwTouched && !pwForm.newPw ? BRAND.red : BRAND.border}`,
                            color: BRAND.black,
                          }}
                          onFocus={e => (e.currentTarget.style.borderColor = BRAND.teal)}
                          onBlur={e => (e.currentTarget.style.borderColor = pwTouched && !pwForm.newPw ? BRAND.red : BRAND.border)}
                        />
                        <button type="button" onClick={() => setShowNewPw(!showNewPw)}
                          className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: BRAND.muted }}>
                          {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {pwTouched && !pwForm.newPw && (
                        <p className="mt-1 text-[11px] font-semibold" style={{ color: BRAND.red }}>New password is required</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>
                        Confirm New Password <span style={{ color: BRAND.red }}>*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPw ? "text" : "password"}
                          value={pwForm.confirmPw}
                          onChange={e => setPwForm(f => ({ ...f, confirmPw: e.target.value }))}
                          placeholder="Re-enter new password"
                          className={`${inputCls} pr-12`}
                          style={{
                            background: BRAND.bg,
                            border: `1px solid ${pwTouched && pwForm.newPw !== pwForm.confirmPw ? BRAND.red : BRAND.border}`,
                            color: BRAND.black,
                          }}
                          onFocus={e => (e.currentTarget.style.borderColor = BRAND.teal)}
                          onBlur={e => (e.currentTarget.style.borderColor = pwTouched && pwForm.newPw !== pwForm.confirmPw ? BRAND.red : BRAND.border)}
                        />
                        <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)}
                          className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: BRAND.muted }}>
                          {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {pwTouched && pwForm.newPw && pwForm.confirmPw && pwForm.newPw !== pwForm.confirmPw && (
                        <p className="mt-1 text-[11px] font-semibold" style={{ color: BRAND.red }}>Passwords do not match</p>
                      )}
                    </div>

                    <button type="submit" disabled={savingPw}
                      className="flex items-center gap-2 mt-2 px-6 py-3 font-black text-sm uppercase tracking-widest transition-opacity hover:opacity-90 disabled:opacity-50"
                      style={{ background: BRAND.teal, color: "#fff" }}>
                      <Lock className="w-4 h-4" />
                      {savingPw ? "Updating…" : "Update Password"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Write a Review modal */}
      {reviewModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={e => { if (e.target === e.currentTarget) { setReviewModalOrder(null); setReviewSuccess(false); } }}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden"
            style={{ background: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
            <div className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: `1px solid ${BRAND.border}`, background: BRAND.card }}>
              <p className="font-black text-sm uppercase tracking-widest" style={{ color: BRAND.black }}>Write a Review</p>
              <button onClick={() => { setReviewModalOrder(null); setReviewSuccess(false); }} className="p-1 transition-opacity hover:opacity-70">
                <X className="w-4 h-4" style={{ color: BRAND.muted }} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {reviewSuccess ? (
                <div className="py-6 text-center">
                  <CheckCircle className="w-10 h-10 mx-auto mb-2" style={{ color: BRAND.teal }} />
                  <p className="font-bold text-sm" style={{ color: BRAND.black }}>Thank you for your review!</p>
                </div>
              ) : (
                <>
                  {reviewModalOrder.order_items[0] && (
                    <p className="text-xs font-semibold" style={{ color: BRAND.muted }}>
                      Order: <span style={{ color: BRAND.black }}>{reviewModalOrder.order_number}</span>
                      {" · "}{reviewModalOrder.order_items[0].product_name}
                    </p>
                  )}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide mb-2" style={{ color: BRAND.black }}>Rating</label>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(n => (
                        <button key={n} type="button"
                          onClick={() => setReviewForm(f => ({ ...f, rating: n }))}
                          className="transition-opacity hover:opacity-80">
                          <Star className="w-7 h-7" fill={n <= reviewForm.rating ? BRAND.teal : "none"}
                            style={{ color: n <= reviewForm.rating ? BRAND.teal : BRAND.border }} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>Title (optional)</label>
                    <input
                      value={reviewForm.title}
                      onChange={e => setReviewForm(f => ({ ...f, title: e.target.value }))}
                      placeholder="e.g. Great quality!"
                      className="w-full px-3 py-2.5 text-sm focus:outline-none"
                      style={{ background: BRAND.card, border: `1px solid ${BRAND.border}`, color: BRAND.black }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>Review <span style={{ color: BRAND.red }}>*</span></label>
                    <textarea
                      value={reviewForm.body}
                      onChange={e => setReviewForm(f => ({ ...f, body: e.target.value }))}
                      placeholder="Share your experience…"
                      rows={3}
                      className="w-full px-3 py-2.5 text-sm focus:outline-none resize-none"
                      style={{ background: BRAND.card, border: `1px solid ${BRAND.border}`, color: BRAND.black }}
                    />
                  </div>
                  <button
                    onClick={handleSubmitReview}
                    disabled={submittingReview || !reviewForm.body.trim()}
                    className="w-full py-3 text-sm font-black uppercase tracking-widest transition-opacity hover:opacity-90 disabled:opacity-50"
                    style={{ background: BRAND.teal, color: "#fff" }}>
                    {submittingReview ? "Submitting…" : "Submit Review"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cancel order reason modal */}
      {cancelModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={e => { if (e.target === e.currentTarget) { setCancelModalOrder(null); setCancelReason(""); } }}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden"
            style={{ background: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
            <div className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: `1px solid ${BRAND.border}`, background: BRAND.card }}>
              <p className="font-black text-sm uppercase tracking-widest" style={{ color: BRAND.red }}>Cancel Order</p>
              <button onClick={() => { setCancelModalOrder(null); setCancelReason(""); }} className="p-1 transition-opacity hover:opacity-70">
                <X className="w-4 h-4" style={{ color: BRAND.muted }} />
              </button>
            </div>
            <div className="p-5">
              <p className="text-sm mb-3" style={{ color: BRAND.muted }}>
                Please let us know why you&apos;re cancelling order <span className="font-bold" style={{ color: BRAND.black }}>{cancelModalOrder}</span>.
              </p>
              <label className="block text-xs font-bold uppercase tracking-wide mb-2" style={{ color: BRAND.black }}>Reason (optional)</label>
              <textarea
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="e.g. Changed my mind, ordered wrong size…"
                rows={3}
                className="w-full px-3 py-2.5 text-sm focus:outline-none resize-none"
                style={{ background: BRAND.card, border: `1px solid ${BRAND.border}`, color: BRAND.black }}
              />
            </div>
            <div className="flex gap-3 px-5 pb-5">
              <button onClick={executeCancelOrder}
                className="flex-1 py-2.5 text-xs font-black uppercase tracking-wide"
                style={{ background: BRAND.red, color: "#fff" }}>
                Confirm Cancel
              </button>
              <button onClick={() => { setCancelModalOrder(null); setCancelReason(""); }}
                className="px-4 py-2.5 text-xs font-bold"
                style={{ border: `1px solid ${BRAND.border}`, color: BRAND.muted }}>
                Keep Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

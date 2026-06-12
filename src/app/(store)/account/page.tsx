"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BRAND, FONTS } from "@/lib/constants";
import Image from "next/image";
import { Package, User, LogOut, ChevronRight, Clock, CheckCircle, Truck, Lock, Eye, EyeOff, Save, MapPin, MessageCircle } from "lucide-react";
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
  products: { images: string[] | null; bg: string | null } | null;
};
type Order = {
  id: string;
  order_number: string;
  created_at: string;
  status: string;
  total: number;
  payment_method: string;
  proof_of_payment?: string | null;
  tracking_number?: string;
  shipping_street?: string;
  shipping_barangay?: string;
  shipping_city?: string;
  shipping_province?: string;
  order_items: OrderItem[];
};
type Tab = "orders" | "account" | "password";

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
  const [pwTouched, setPwTouched] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/login"); return; }
      setUser(user);
      setProfileForm({
        name: user.user_metadata?.full_name || "",
        mobile: user.user_metadata?.mobile || "",
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

  async function handleCancelOrder(orderNumber: string) {
    setCancellingOrder(orderNumber);
    const res = await fetch("/api/orders/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderNumber }),
    });
    if (res.ok) {
      setOrders(prev => prev.map(o => o.order_number === orderNumber ? { ...o, status: "cancelled" } : o));
    }
    setCancellingOrder(null);
  }

  if (!user) return null;

  const displayName = user.user_metadata?.full_name || user.email?.split("@")[0] || "User";

  const NAV_TABS = [
    { id: "orders" as Tab, icon: Package, label: "My Orders" },
    { id: "account" as Tab, icon: User, label: "Account Details" },
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

                      {/* Total + Help */}
                      <div className="px-5 py-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          <p className="text-xs" style={{ color: BRAND.muted }}>
                            {isCOD ? "Cash on Delivery" : order.payment_method?.replace("_", " ")}
                          </p>
                          {!isCOD && (order.proof_of_payment || order.status !== "pending") && (
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
                        <div className="flex items-center gap-3">
                          {order.status === "pending" && (
                            <button
                              onClick={() => handleCancelOrder(order.order_number)}
                              disabled={cancellingOrder === order.order_number}
                              className="text-xs font-bold uppercase tracking-wide px-3 py-1.5 transition-opacity disabled:opacity-50"
                              style={{ border: `1px solid ${BRAND.red}`, color: BRAND.red }}>
                              {cancellingOrder === order.order_number ? "Cancelling…" : "Cancel Order"}
                            </button>
                          )}
                          <p className="font-black text-sm shrink-0" style={{ color: BRAND.black }}>
                            Total ₱{Number(order.total).toLocaleString()}
                          </p>
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
    </div>
  );
}

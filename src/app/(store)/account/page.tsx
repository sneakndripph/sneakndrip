"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BRAND, FONTS } from "@/lib/constants";
import Image from "next/image";
import { Package, User, LogOut, ChevronRight, Clock, CheckCircle, Truck, Lock, Eye, EyeOff, Save, MapPin, MessageCircle, X, Home, Star, RotateCcw } from "lucide-react";
import PhAddressSelect from "@/components/ui/PhAddressSelect";
import { createClient } from "@/lib/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

const STATUS_CONFIG = {
  pending:    { icon: Clock,       color: "#8A8580", label: "Pending",        bg: "rgba(138,133,128,0.12)" },
  paid:       { icon: CheckCircle, color: "#5BB8B4", label: "Paid",           bg: "rgba(91,184,180,0.12)" },
  arrived_ph: { icon: CheckCircle, color: "#8B5CF6", label: "Arrived in PH",  bg: "rgba(139,92,246,0.12)" },
  processing: { icon: Clock,       color: "#D97706", label: "Processing",     bg: "rgba(217,119,6,0.12)" },
  shipped:    { icon: Truck,       color: "#3B82F6", label: "Shipped",        bg: "rgba(59,130,246,0.12)" },
  delivered:  { icon: CheckCircle, color: "#10B981", label: "Delivered",      bg: "rgba(16,185,129,0.12)" },
  cancelled:  { icon: Clock,       color: "#D94F3D", label: "Cancelled",      bg: "rgba(217,79,61,0.12)" },
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
  { key: "arrived_ph", label: "Arrived in PH" },
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
  const [pwForm, setPwForm] = useState({ currentPw: "", newPw: "", confirmPw: "" });
  const [showCurrentPw, setShowCurrentPw] = useState(false);
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
  const [existingReviewId, setExistingReviewId] = useState<string | null>(null);
  const [loadingReview, setLoadingReview] = useState(false);
  const [reviewedOrderIds, setReviewedOrderIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem("snd_reviewed_orders");
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
  });

  // Return request state
  const [returnModalOrder, setReturnModalOrder] = useState<Order | null>(null);
  const [returnReason, setReturnReason] = useState("");
  const [returnPhotoFiles, setReturnPhotoFiles] = useState<File[]>([]);
  const [returnPhotoPreviews, setReturnPhotoPreviews] = useState<string[]>([]);
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [returnError, setReturnError] = useState("");
  const [returnSuccess, setReturnSuccess] = useState(false);
  type ReturnInfo = { id?: string; status: string; admin_note: string | null; reason: string; photo_url: string | null; photo_urls?: string[] | null };
  const [returnedOrders, setReturnedOrders] = useState<Map<string, ReturnInfo>>(new Map());
  const [viewReturnModal, setViewReturnModal] = useState<{ orderNumber: string } & ReturnInfo | null>(null);
  const [editingReturn, setEditingReturn] = useState(false);
  const [editReturnReason, setEditReturnReason] = useState("");
  const [editReturnPhotoFiles, setEditReturnPhotoFiles] = useState<File[]>([]);
  const [editReturnPhotoPreviews, setEditReturnPhotoPreviews] = useState<string[]>([]);
  const [savingEditReturn, setSavingEditReturn] = useState(false);
  const [editReturnError, setEditReturnError] = useState("");
  const [proofModal, setProofModal] = useState<{ url: string; orderNumber: string } | null>(null);
  const [orderFilter, setOrderFilter] = useState("all");
  const [seenTabs, setSeenTabs] = useState<Set<string>>(new Set<string>());
  const [reviewImageFile, setReviewImageFile] = useState<File | null>(null);
  const [reviewImagePreview, setReviewImagePreview] = useState<string | null>(null);
  const [proofImgLoaded, setProofImgLoaded] = useState(false);

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
      Promise.all([
        fetch("/api/orders").then(r => r.json()),
        fetch("/api/returns").then(r => r.json()).catch(() => ({ returns: [] })),
      ]).then(([ordersData, returnsData]) => {
        setOrders((ordersData.orders as Order[]) ?? []);
        const returnMap = new Map<string, ReturnInfo>(
          ((returnsData.returns ?? []) as { id: string; order_number: string; status: string; admin_note: string | null; reason: string; photo_url: string | null; photo_urls?: string[] | null }[])
            .map(r => [r.order_number, { id: r.id, status: r.status, admin_note: r.admin_note, reason: r.reason, photo_url: r.photo_url ?? null, photo_urls: r.photo_urls ?? null }])
        );
        setReturnedOrders(returnMap);
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
    if (!profileForm.mobile.trim()) { setProfileError("Mobile number is required"); return; }
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
    if (!pwForm.currentPw) { setPwError("Current password is required"); return; }
    if (!pwForm.newPw) { setPwError("New password is required"); return; }
    if (pwForm.newPw.length < 6) { setPwError("Password must be at least 6 characters"); return; }
    if (pwForm.newPw !== pwForm.confirmPw) { setPwError("Passwords do not match"); return; }
    setPwError("");
    setSavingPw(true);
    const supabase = createClient();
    // Verify current password first
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user?.email ?? "",
      password: pwForm.currentPw,
    });
    if (signInError) {
      setPwError("Current password is incorrect");
      setSavingPw(false);
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: pwForm.newPw });
    if (error) {
      setPwError(error.message);
    } else {
      setPwSuccess(true);
      setPwForm({ currentPw: "", newPw: "", confirmPw: "" });
      setPwTouched(false);
      setTimeout(() => setPwSuccess(false), 4000);
    }
    setSavingPw(false);
  }

  async function handleSaveAddress(e: React.FormEvent) {
    e.preventDefault();
    setAddressShowErrors(true);
    if (!addressForm.street || !addressForm.province || !addressForm.city || !addressForm.barangay || !addressForm.postal) return;
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

    let image_url: string | null = null;
    if (reviewImageFile) {
      const supabase = createClient();
      const ext = reviewImageFile.name.split(".").pop() ?? "jpg";
      const filePath = `${user?.id ?? "anon"}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { data: uploadData, error: upErr } = await supabase.storage
        .from("review-photos")
        .upload(filePath, reviewImageFile, { upsert: false });
      if (!upErr && uploadData) {
        image_url = supabase.storage.from("review-photos").getPublicUrl(uploadData.path).data.publicUrl;
      }
    }

    if (existingReviewId) {
      await fetch("/api/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: existingReviewId,
          rating: reviewForm.rating,
          title: reviewForm.title.trim() || null,
          body: reviewForm.body.trim(),
          ...(image_url ? { image_url } : {}),
        }),
      });
    } else {
      await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: firstItem?.product_id ?? null,
          author_name: user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Customer",
          rating: reviewForm.rating,
          title: reviewForm.title.trim() || null,
          body: reviewForm.body.trim(),
          image_url,
        }),
      });
    }
    setSubmittingReview(false);
    setReviewSuccess(true);
    if (reviewModalOrder) {
      setReviewedOrderIds(prev => {
        const next = new Set([...prev, reviewModalOrder.id]);
        try { localStorage.setItem("snd_reviewed_orders", JSON.stringify([...next])); } catch {}
        return next;
      });
    }
    setReviewForm({ rating: 5, title: "", body: "" });
    setReviewImageFile(null);
    setReviewImagePreview(null);
    setTimeout(() => {
      setReviewModalOrder(null);
      setReviewSuccess(false);
    }, 2000);
  }

  async function handleSubmitReturn() {
    if (!returnModalOrder || !returnReason.trim() || returnPhotoFiles.length === 0) return;
    setSubmittingReturn(true);
    setReturnError("");

    const supabase = createClient();
    const photoUrls: string[] = [];
    for (const file of returnPhotoFiles) {
      const ext = file.name.split(".").pop() ?? "jpg";
      const filePath = `${user?.id ?? "anon"}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from("return-photos")
        .upload(filePath, file, { cacheControl: "3600", upsert: false });
      if (uploadErr) {
        setReturnError("Failed to upload photo. Please try again.");
        setSubmittingReturn(false);
        return;
      }
      photoUrls.push(supabase.storage.from("return-photos").getPublicUrl(uploadData.path).data.publicUrl);
    }

    const res = await fetch("/api/returns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order_id: returnModalOrder.id,
        order_number: returnModalOrder.order_number,
        reason: returnReason.trim(),
        photo_url: photoUrls[0] ?? null,
        photo_urls: photoUrls,
      }),
    });
    if (res.ok) {
      setReturnSuccess(true);
      setReturnedOrders(prev => new Map([...prev, [returnModalOrder.order_number, {
        status: "pending", admin_note: null, reason: returnReason.trim(), photo_url: photoUrls[0] ?? null, photo_urls: photoUrls,
      }]]));
      setTimeout(() => {
        setReturnModalOrder(null);
        setReturnSuccess(false);
        setReturnReason("");
        setReturnPhotoFiles([]);
        setReturnPhotoPreviews([]);
      }, 2000);
    } else {
      const err = await res.json().catch(() => ({})) as { error?: string };
      setReturnError(err.error ?? "Failed to submit return request.");
    }
    setSubmittingReturn(false);
  }

  async function handleSaveEditReturn() {
    if (!viewReturnModal?.id || !editReturnReason.trim()) return;
    setSavingEditReturn(true);
    setEditReturnError("");

    let photoUrls: string[] = viewReturnModal.photo_urls?.length
      ? viewReturnModal.photo_urls
      : viewReturnModal.photo_url ? [viewReturnModal.photo_url] : [];

    if (editReturnPhotoFiles.length > 0) {
      const supabase = createClient();
      const uploadedUrls: string[] = [];
      for (const file of editReturnPhotoFiles) {
        const ext = file.name.split(".").pop() ?? "jpg";
        const filePath = `${user?.id ?? "anon"}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from("return-photos")
          .upload(filePath, file, { cacheControl: "3600", upsert: false });
        if (uploadErr) {
          setEditReturnError("Failed to upload photo.");
          setSavingEditReturn(false);
          return;
        }
        uploadedUrls.push(supabase.storage.from("return-photos").getPublicUrl(uploadData.path).data.publicUrl);
      }
      photoUrls = uploadedUrls;
    }

    const res = await fetch("/api/returns", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: viewReturnModal.id, reason: editReturnReason.trim(), photo_url: photoUrls[0] ?? null, photo_urls: photoUrls }),
    });
    if (res.ok) {
      const updated = { ...viewReturnModal, reason: editReturnReason.trim(), photo_url: photoUrls[0] ?? null, photo_urls: photoUrls };
      setReturnedOrders(prev => new Map([...prev, [viewReturnModal.orderNumber, {
        id: viewReturnModal.id, status: viewReturnModal.status,
        admin_note: viewReturnModal.admin_note, reason: editReturnReason.trim(),
        photo_url: photoUrls[0] ?? null, photo_urls: photoUrls,
      }]]));
      setViewReturnModal(updated);
      setEditingReturn(false);
      setEditReturnPhotoFiles([]);
      setEditReturnPhotoPreviews([]);
    } else {
      const err = await res.json().catch(() => ({})) as { error?: string };
      setEditReturnError(err.error ?? "Failed to save.");
    }
    setSavingEditReturn(false);
  }

  if (!user) return null;

  const tabCounts: Record<string, number> = {
    pending: orders.filter(o => o.status === "pending").length,
    to_ship: orders.filter(o => ["paid", "processing"].includes(o.status)).length,
    shipped: orders.filter(o => o.status === "shipped").length,
    delivered: orders.filter(o => o.status === "delivered").length,
    returned: orders.filter(o => returnedOrders.get(o.order_number)?.status === "approved").length,
    cancelled: orders.filter(o => o.status === "cancelled").length,
  };

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
                <h2 className="font-black text-lg mb-3" style={{ color: BRAND.black }}>Order History</h2>

                {/* Order filter tabs */}
                {!loadingOrders && orders.length > 0 && (
                  <div className="flex gap-1 flex-wrap mb-2">
                    {[
                      { key: "all", label: "All" },
                      { key: "pending", label: "To Pay" },
                      { key: "to_ship", label: "To Ship" },
                      { key: "shipped", label: "To Receive" },
                      { key: "delivered", label: "Completed" },
                      { key: "returned", label: "Returns" },
                      { key: "cancelled", label: "Cancelled" },
                    ].map(f => {
                      const cnt = tabCounts[f.key] ?? 0;
                      return (
                      <button key={f.key} onClick={() => {
                          setOrderFilter(f.key);
                          setSeenTabs(prev => new Set([...prev, f.key]));
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-full transition-all"
                        style={{
                          background: orderFilter === f.key ? BRAND.black : BRAND.card,
                          color: orderFilter === f.key ? BRAND.bg : BRAND.muted,
                          border: `1px solid ${orderFilter === f.key ? BRAND.black : BRAND.border}`,
                        }}>
                        {f.label}
                        {cnt > 0 && f.key !== "all" && !seenTabs.has(f.key) && (
                          <span className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 text-[9px] font-black rounded-full"
                            style={{
                              background: orderFilter === f.key ? BRAND.bg : BRAND.teal,
                              color: orderFilter === f.key ? BRAND.black : "#fff",
                            }}>
                            {cnt}
                          </span>
                        )}
                      </button>
                      );
                    })}
                  </div>
                )}

                {loadingOrders ? (
                  <div className="py-12 text-center text-sm" style={{ color: BRAND.muted }}>Loading orders…</div>
                ) : orders.length === 0 ? (
                  <div className="py-12 text-center">
                    <p style={{ fontFamily: FONTS.display, fontSize: "1.5rem", color: BRAND.muted, letterSpacing: "0.04em" }}>NO ORDERS YET</p>
                    <p className="text-sm mt-2 mb-6" style={{ color: BRAND.mutedLight }}>Your orders will show up here after you place one.</p>
                    <Link href="/shop" className="inline-block px-8 py-3 font-bold text-sm uppercase tracking-widest"
                      style={{ background: BRAND.black, color: BRAND.bg }}>Shop Now</Link>
                  </div>
                ) : orders.filter(order => {
                    if (orderFilter === "all") return true;
                    if (orderFilter === "pending") return order.status === "pending";
                    if (orderFilter === "to_ship") return ["paid", "processing"].includes(order.status);
                    if (orderFilter === "shipped") return order.status === "shipped";
                    if (orderFilter === "delivered") return order.status === "delivered";
                    if (orderFilter === "returned") return returnedOrders.get(order.order_number)?.status === "approved";
                    if (orderFilter === "cancelled") return order.status === "cancelled";
                    return true;
                  }).length === 0 ? (
                  <div className="py-12 text-center">
                    <p style={{ fontFamily: FONTS.display, fontSize: "1.5rem", color: BRAND.muted, letterSpacing: "0.04em" }}>NO ORDERS</p>
                    <p className="text-sm mt-2" style={{ color: BRAND.mutedLight }}>No orders in this category.</p>
                  </div>
                ) : orders.filter(order => {
                    if (orderFilter === "all") return true;
                    if (orderFilter === "pending") return order.status === "pending";
                    if (orderFilter === "to_ship") return ["paid", "processing"].includes(order.status);
                    if (orderFilter === "shipped") return order.status === "shipped";
                    if (orderFilter === "delivered") return order.status === "delivered";
                    if (orderFilter === "returned") return returnedOrders.get(order.order_number)?.status === "approved";
                    if (orderFilter === "cancelled") return order.status === "cancelled";
                    return true;
                  }).map(order => {
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

                      {/* Tracking card — shown when shipped or delivered */}
                      {order.tracking_number && (order.status === "shipped" || order.status === "delivered") && (
                        <div className="mx-5 my-4 p-4 rounded-lg"
                          style={{ background: `${BRAND.teal}10`, border: `1px solid ${BRAND.teal}30` }}>
                          <div className="flex items-center gap-3 mb-2">
                            <Truck className="w-5 h-5 shrink-0" style={{ color: BRAND.teal }} />
                            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: BRAND.teal }}>Your order is on its way</p>
                          </div>
                          <p className="text-xs" style={{ color: BRAND.muted }}>Here&apos;s your tracking number:</p>
                          <p className="text-base font-black mt-1" style={{ color: BRAND.black }}>{order.tracking_number}</p>
                          <p className="text-[11px] mt-2" style={{ color: BRAND.muted }}>
                            Copy and paste to{" "}
                            <a href="https://www.jtexpress.ph/track-and-trace" target="_blank" rel="noopener noreferrer"
                              className="underline font-semibold" style={{ color: BRAND.teal }}>
                              https://www.jtexpress.ph/track-and-trace
                            </a>
                          </p>
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
                                {item.products?.slug ? (
                                  <Link href={`/shop/${item.products.slug}`} className="text-sm font-semibold truncate block transition-opacity hover:opacity-70" style={{ color: BRAND.black }}>{item.product_name}</Link>
                                ) : (
                                  <p className="text-sm font-semibold truncate" style={{ color: BRAND.black }}>{item.product_name}</p>
                                )}
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

                        <div className="space-y-3">
                          {/* Payment info row */}
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
                              <button
                                onClick={() => { setProofImgLoaded(false); setProofModal({ url: `/api/proof?orderNumber=${encodeURIComponent(order.order_number)}`, orderNumber: order.order_number }); }}
                                className="flex items-center gap-1 text-xs font-semibold transition-opacity hover:opacity-70"
                                style={{ color: BRAND.teal }}>
                                <Eye className="w-3.5 h-3.5" /> View Proof
                              </button>
                            )}
                            <button
                              onClick={() => window.dispatchEvent(new CustomEvent("open-chat"))}
                              className="flex items-center gap-1 text-xs font-semibold transition-opacity hover:opacity-70"
                              style={{ color: BRAND.teal }}>
                              <MessageCircle className="w-3.5 h-3.5" /> Need help?
                            </button>
                          </div>
                          {/* Total + action buttons row */}
                          <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-2 flex-wrap">
                              {order.status === "pending" && isCOD && (
                                <button
                                  onClick={() => setCancelModalOrder(order.order_number)}
                                  disabled={cancellingOrder === order.order_number}
                                  className="text-xs font-bold uppercase tracking-wide px-3 py-1.5 transition-opacity disabled:opacity-50"
                                  style={{ border: `1px solid ${BRAND.red}`, color: BRAND.red }}>
                                  {cancellingOrder === order.order_number ? "Cancelling…" : "Cancel Order"}
                                </button>
                              )}
                              {order.status === "delivered" && !returnedOrders.has(order.order_number) && (
                                <button
                                  onClick={() => {
                                    setReturnModalOrder(order);
                                    setReturnReason("");
                                    setReturnError("");
                                    setReturnSuccess(false);
                                    setReturnPhotoFiles([]);
                                    setReturnPhotoPreviews([]);
                                  }}
                                  className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide px-3 py-1.5 transition-opacity hover:opacity-70"
                                  style={{ border: `1px solid ${BRAND.border}`, color: BRAND.muted }}>
                                  <RotateCcw className="w-3 h-3" />
                                  Request Return
                                </button>
                              )}
                              {order.status === "delivered" && returnedOrders.has(order.order_number) && (() => {
                                const ret = returnedOrders.get(order.order_number)!;
                                return (
                                  <button
                                    onClick={() => setViewReturnModal({ orderNumber: order.order_number, ...ret })}
                                    className="text-xs font-bold uppercase tracking-wide px-3 py-1.5 transition-opacity hover:opacity-70"
                                    style={{
                                      border: `1px solid ${ret.status === "approved" ? "#10B981" : ret.status === "denied" ? BRAND.red : BRAND.border}`,
                                      color: ret.status === "approved" ? "#10B981" : ret.status === "denied" ? BRAND.red : BRAND.muted,
                                      background: ret.status === "approved" ? "rgba(16,185,129,0.08)" : ret.status === "denied" ? `${BRAND.red}08` : "transparent",
                                    }}>
                                    View Request
                                  </button>
                                );
                              })()}
                              {order.status === "delivered" && (
                                <button
                                  onClick={async () => {
                                    const isEditing = reviewedOrderIds.has(order.id);
                                    setReviewForm({ rating: 5, title: "", body: "" });
                                    setReviewImageFile(null);
                                    setReviewImagePreview(null);
                                    setExistingReviewId(null);
                                    setReviewSuccess(false);
                                    setReviewModalOrder(order);
                                    if (isEditing) {
                                      const firstItem = order.order_items[0];
                                      const productId = firstItem?.product_id;
                                      const authorName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Customer";
                                      if (productId) {
                                        setLoadingReview(true);
                                        try {
                                          const r = await fetch(`/api/reviews?product_id=${encodeURIComponent(productId)}&author_name=${encodeURIComponent(authorName)}`);
                                          const { review } = await r.json();
                                          if (review) {
                                            setReviewForm({ rating: review.rating, title: review.title ?? "", body: review.body });
                                            setExistingReviewId(review.id);
                                          }
                                        } catch {}
                                        setLoadingReview(false);
                                      }
                                    }
                                  }}
                                  className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide px-3 py-1.5 transition-opacity hover:opacity-70"
                                  style={{ border: `1px solid ${BRAND.teal}`, color: BRAND.teal }}>
                                  <Star className="w-3 h-3" />
                                  {reviewedOrderIds.has(order.id) ? "Edit Review" : "Write a Review"}
                                </button>
                              )}
                            </div>
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
                          Mobile Number <span style={{ color: BRAND.red }}>*</span>
                        </label>
                        <input
                          value={profileForm.mobile}
                          onChange={e => setProfileForm(f => ({ ...f, mobile: e.target.value.replace(/\D/g, "").slice(0, 11) }))}
                          placeholder="09XX XXX XXXX"
                          inputMode="numeric"
                          maxLength={11}
                          className={inputCls}
                          style={{
                            background: BRAND.bg,
                            border: `1px solid ${profileTouched && !profileForm.mobile ? BRAND.red : BRAND.border}`,
                            color: BRAND.black,
                          }}
                          onFocus={e => (e.currentTarget.style.borderColor = BRAND.teal)}
                          onBlur={e => (e.currentTarget.style.borderColor = profileTouched && !profileForm.mobile ? BRAND.red : BRAND.border)}
                        />
                        {profileTouched && !profileForm.mobile && (
                          <p className="mt-1 text-[11px] font-semibold" style={{ color: BRAND.red }}>Mobile number is required</p>
                        )}
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
                          Postal Code <span style={{ color: BRAND.red }}>*</span>
                        </label>
                        <input
                          value={addressForm.postal}
                          onChange={e => setAddressForm(f => ({ ...f, postal: e.target.value }))}
                          placeholder="1630"
                          className={inputCls}
                          style={{
                            background: BRAND.bg,
                            border: `1px solid ${addressShowErrors && !addressForm.postal ? BRAND.red : BRAND.border}`,
                            color: BRAND.black,
                          }}
                          onFocus={e => (e.currentTarget.style.borderColor = BRAND.teal)}
                          onBlur={e => (e.currentTarget.style.borderColor = addressShowErrors && !addressForm.postal ? BRAND.red : BRAND.border)}
                        />
                        {addressShowErrors && !addressForm.postal && (
                          <p className="mt-1 text-[11px] font-semibold" style={{ color: BRAND.red }}>Postal code is required</p>
                        )}
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
                        Current Password <span style={{ color: BRAND.red }}>*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPw ? "text" : "password"}
                          value={pwForm.currentPw}
                          onChange={e => setPwForm(f => ({ ...f, currentPw: e.target.value }))}
                          placeholder="Your current password"
                          className={`${inputCls} pr-12`}
                          style={{
                            background: BRAND.bg,
                            border: `1px solid ${pwTouched && !pwForm.currentPw ? BRAND.red : BRAND.border}`,
                            color: BRAND.black,
                          }}
                          onFocus={e => (e.currentTarget.style.borderColor = BRAND.teal)}
                          onBlur={e => (e.currentTarget.style.borderColor = pwTouched && !pwForm.currentPw ? BRAND.red : BRAND.border)}
                        />
                        <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)}
                          className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: BRAND.muted }}>
                          {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

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
          onClick={e => { if (e.target === e.currentTarget) { setReviewModalOrder(null); setReviewSuccess(false); setReviewImageFile(null); setReviewImagePreview(null); } }}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden"
            style={{ background: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
            <div className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: `1px solid ${BRAND.border}`, background: BRAND.card }}>
              <p className="font-black text-sm uppercase tracking-widest" style={{ color: BRAND.black }}>
                {existingReviewId ? "Edit Review" : "Write a Review"}
              </p>
              <button onClick={() => { setReviewModalOrder(null); setReviewSuccess(false); setReviewImageFile(null); setReviewImagePreview(null); }} className="p-1 transition-opacity hover:opacity-70">
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
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>
                      Photo (optional)
                    </label>
                    {reviewImagePreview ? (
                      <div className="relative w-20 h-20">
                        <Image src={reviewImagePreview} alt="Review" fill className="object-cover rounded-lg" sizes="80px" />
                        <button type="button"
                          onClick={() => { setReviewImageFile(null); setReviewImagePreview(null); }}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ background: BRAND.black, color: BRAND.bg }}>
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center gap-1 w-20 h-20 rounded-lg cursor-pointer"
                        style={{ border: `2px dashed ${BRAND.border}`, background: BRAND.card }}>
                        <span className="text-lg">📷</span>
                        <span className="text-[10px] font-semibold" style={{ color: BRAND.muted }}>Add Photo</span>
                        <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                          onChange={e => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            setReviewImageFile(f);
                            setReviewImagePreview(URL.createObjectURL(f));
                          }} />
                      </label>
                    )}
                  </div>
                  {loadingReview && (
                    <p className="text-xs text-center" style={{ color: BRAND.muted }}>Loading your previous review…</p>
                  )}
                  <button
                    onClick={handleSubmitReview}
                    disabled={submittingReview || !reviewForm.body.trim() || loadingReview}
                    className="w-full py-3 text-sm font-black uppercase tracking-widest transition-opacity hover:opacity-90 disabled:opacity-50"
                    style={{ background: BRAND.teal, color: "#fff" }}>
                    {submittingReview ? "Submitting…" : existingReviewId ? "Update Review" : "Submit Review"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Return request modal */}
      {returnModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={e => { if (e.target === e.currentTarget) { setReturnModalOrder(null); setReturnReason(""); setReturnError(""); setReturnSuccess(false); setReturnPhotoFiles([]); setReturnPhotoPreviews([]); } }}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden"
            style={{ background: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
            <div className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: `1px solid ${BRAND.border}`, background: BRAND.card }}>
              <p className="font-black text-sm uppercase tracking-widest" style={{ color: BRAND.black }}>Request Return</p>
              <button onClick={() => { setReturnModalOrder(null); setReturnReason(""); setReturnError(""); setReturnSuccess(false); setReturnPhotoFiles([]); setReturnPhotoPreviews([]); }}
                className="p-1 transition-opacity hover:opacity-70">
                <X className="w-4 h-4" style={{ color: BRAND.muted }} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {returnSuccess ? (
                <div className="py-6 text-center">
                  <CheckCircle className="w-10 h-10 mx-auto mb-2" style={{ color: BRAND.teal }} />
                  <p className="font-bold text-sm" style={{ color: BRAND.black }}>Return request submitted!</p>
                  <p className="text-xs mt-1" style={{ color: BRAND.muted }}>We&apos;ll review it and get back to you soon.</p>
                </div>
              ) : (
                <>
                  <p className="text-xs" style={{ color: BRAND.muted }}>
                    Order: <span className="font-bold" style={{ color: BRAND.black }}>{returnModalOrder.order_number}</span>
                  </p>
                  {returnError && (
                    <div className="px-3 py-2.5 rounded text-xs font-medium"
                      style={{ background: `${BRAND.red}12`, color: BRAND.red, border: `1px solid ${BRAND.red}30` }}>
                      {returnError}
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>
                      Reason for Return <span style={{ color: BRAND.red }}>*</span>
                    </label>
                    <textarea
                      value={returnReason}
                      onChange={e => setReturnReason(e.target.value)}
                      placeholder="e.g. Wrong size, defective item, changed mind…"
                      rows={3}
                      className="w-full px-3 py-2.5 text-sm focus:outline-none resize-none"
                      style={{ background: BRAND.card, border: `1px solid ${BRAND.border}`, color: BRAND.black }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>
                      Photos of Item <span style={{ color: BRAND.red }}>*</span>
                      {returnPhotoFiles.length > 0 && (
                        <span className="ml-2 font-normal normal-case" style={{ color: BRAND.muted }}>
                          {returnPhotoFiles.length}/5
                        </span>
                      )}
                    </label>
                    {returnPhotoPreviews.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        {returnPhotoPreviews.map((preview, i) => (
                          <div key={i} className="relative aspect-square rounded-lg overflow-hidden group"
                            style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                            <Image src={preview} alt={`Photo ${i + 1}`} fill className="object-cover" sizes="100px" />
                            <button type="button"
                              onClick={() => {
                                setReturnPhotoFiles(prev => prev.filter((_, j) => j !== i));
                                setReturnPhotoPreviews(prev => prev.filter((_, j) => j !== i));
                              }}
                              className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              style={{ background: "rgba(0,0,0,0.55)" }}>
                              <X className="w-3 h-3 text-white" />
                            </button>
                          </div>
                        ))}
                        {returnPhotoFiles.length < 5 && (
                          <label className="relative aspect-square rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                            style={{ background: BRAND.card, border: `2px dashed ${BRAND.border}` }}>
                            <span className="text-xl font-bold" style={{ color: BRAND.muted }}>+</span>
                            <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden"
                              onChange={e => {
                                const files = Array.from(e.target.files ?? []).slice(0, 5 - returnPhotoFiles.length);
                                setReturnPhotoFiles(prev => [...prev, ...files]);
                                setReturnPhotoPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
                              }} />
                          </label>
                        )}
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center gap-2 px-4 py-5 rounded-lg cursor-pointer transition-colors"
                        style={{ border: `2px dashed ${BRAND.border}`, background: BRAND.card }}>
                        <span className="text-2xl">📷</span>
                        <span className="text-xs font-semibold text-center" style={{ color: BRAND.muted }}>
                          Click to upload up to 5 photos<br />
                          <span style={{ color: BRAND.mutedLight }}>JPG, PNG, WEBP · max 10MB each</span>
                        </span>
                        <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden"
                          onChange={e => {
                            const files = Array.from(e.target.files ?? []).slice(0, 5);
                            setReturnPhotoFiles(files);
                            setReturnPhotoPreviews(files.map(f => URL.createObjectURL(f)));
                          }} />
                      </label>
                    )}
                  </div>
                  <button
                    onClick={handleSubmitReturn}
                    disabled={submittingReturn || !returnReason.trim() || returnPhotoFiles.length === 0}
                    className="w-full py-3 text-sm font-black uppercase tracking-widest transition-opacity hover:opacity-90 disabled:opacity-50"
                    style={{ background: BRAND.black, color: BRAND.bg }}>
                    {submittingReturn ? "Submitting…" : "Submit Return Request"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* View Return Request modal */}
      {viewReturnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={e => { if (e.target === e.currentTarget) { setViewReturnModal(null); setEditingReturn(false); } }}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden"
            style={{ background: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
            <div className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: `1px solid ${BRAND.border}`, background: BRAND.card }}>
              <p className="font-black text-sm uppercase tracking-widest" style={{ color: BRAND.black }}>
                {editingReturn ? "Edit Request" : "Return Request"}
              </p>
              <button onClick={() => { setViewReturnModal(null); setEditingReturn(false); }} className="p-1 transition-opacity hover:opacity-70">
                <X className="w-4 h-4" style={{ color: BRAND.muted }} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs" style={{ color: BRAND.muted }}>
                  Order: <span className="font-bold" style={{ color: BRAND.black }}>{viewReturnModal.orderNumber}</span>
                </p>
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full"
                  style={{
                    background: viewReturnModal.status === "approved" ? "rgba(16,185,129,0.12)" : viewReturnModal.status === "denied" ? `${BRAND.red}12` : "rgba(138,133,128,0.12)",
                    color: viewReturnModal.status === "approved" ? "#10B981" : viewReturnModal.status === "denied" ? BRAND.red : BRAND.muted,
                  }}>
                  {viewReturnModal.status === "approved" ? "Approved" : viewReturnModal.status === "denied" ? "Denied" : "Pending Review"}
                </span>
              </div>

              {editingReturn ? (
                <>
                  {editReturnError && (
                    <div className="px-3 py-2 rounded text-xs font-medium"
                      style={{ background: `${BRAND.red}12`, color: BRAND.red }}>
                      {editReturnError}
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>
                      Reason <span style={{ color: BRAND.red }}>*</span>
                    </label>
                    <textarea
                      value={editReturnReason}
                      onChange={e => setEditReturnReason(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2.5 text-sm focus:outline-none resize-none"
                      style={{ background: BRAND.card, border: `1px solid ${BRAND.border}`, color: BRAND.black }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>
                      Replace Photos (optional)
                      {editReturnPhotoFiles.length > 0 && (
                        <span className="ml-2 font-normal normal-case" style={{ color: BRAND.muted }}>
                          {editReturnPhotoFiles.length}/5 new
                        </span>
                      )}
                    </label>
                    {editReturnPhotoPreviews.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2 mb-1">
                        {editReturnPhotoPreviews.map((preview, i) => (
                          <div key={i} className="relative aspect-square rounded-lg overflow-hidden group"
                            style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                            <Image src={preview} alt={`Photo ${i + 1}`} fill className="object-cover" sizes="90px" />
                            <button type="button"
                              onClick={() => {
                                setEditReturnPhotoFiles(prev => prev.filter((_, j) => j !== i));
                                setEditReturnPhotoPreviews(prev => prev.filter((_, j) => j !== i));
                              }}
                              className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              style={{ background: "rgba(0,0,0,0.55)" }}>
                              <X className="w-3 h-3 text-white" />
                            </button>
                          </div>
                        ))}
                        {editReturnPhotoFiles.length < 5 && (
                          <label className="relative aspect-square rounded-lg flex items-center justify-center cursor-pointer"
                            style={{ background: BRAND.card, border: `2px dashed ${BRAND.border}` }}>
                            <span className="text-xl font-bold" style={{ color: BRAND.muted }}>+</span>
                            <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden"
                              onChange={e => {
                                const files = Array.from(e.target.files ?? []).slice(0, 5 - editReturnPhotoFiles.length);
                                setEditReturnPhotoFiles(prev => [...prev, ...files]);
                                setEditReturnPhotoPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
                              }} />
                          </label>
                        )}
                      </div>
                    ) : (
                      <label className="flex items-center justify-center gap-2 px-3 py-3 rounded-lg cursor-pointer"
                        style={{ border: `2px dashed ${BRAND.border}`, background: BRAND.card }}>
                        <span className="text-xs font-semibold" style={{ color: BRAND.muted }}>
                          Click to replace all photos (up to 5)
                        </span>
                        <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden"
                          onChange={e => {
                            const files = Array.from(e.target.files ?? []).slice(0, 5);
                            setEditReturnPhotoFiles(files);
                            setEditReturnPhotoPreviews(files.map(f => URL.createObjectURL(f)));
                          }} />
                      </label>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={handleSaveEditReturn} disabled={savingEditReturn || !editReturnReason.trim()}
                      className="flex-1 py-2.5 text-xs font-black uppercase tracking-wide disabled:opacity-50"
                      style={{ background: BRAND.teal, color: "#fff" }}>
                      {savingEditReturn ? "Saving…" : "Save Changes"}
                    </button>
                    <button onClick={() => { setEditingReturn(false); setEditReturnPhotoFiles([]); setEditReturnPhotoPreviews([]); setEditReturnError(""); }}
                      className="px-4 py-2.5 text-xs font-bold"
                      style={{ border: `1px solid ${BRAND.border}`, color: BRAND.muted }}>
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: BRAND.muted }}>Your Reason</p>
                    <p className="text-sm" style={{ color: BRAND.black }}>{viewReturnModal.reason}</p>
                  </div>
                  {(() => {
                    const photos = viewReturnModal.photo_urls?.length
                      ? viewReturnModal.photo_urls
                      : viewReturnModal.photo_url ? [viewReturnModal.photo_url] : [];
                    if (!photos.length) return null;
                    return (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.muted }}>
                          Your Photos ({photos.length})
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {photos.map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                              className="relative aspect-square rounded-lg overflow-hidden transition-opacity hover:opacity-80"
                              style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                              <Image src={url} alt={`Return photo ${i + 1}`} fill className="object-cover" sizes="90px" />
                            </a>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                  {viewReturnModal.admin_note && (
                    <div className="px-4 py-3 rounded-lg" style={{ background: `${BRAND.teal}10`, border: `1px solid ${BRAND.teal}25` }}>
                      <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: BRAND.teal }}>Message from Store</p>
                      <p className="text-sm" style={{ color: BRAND.black }}>{viewReturnModal.admin_note}</p>
                    </div>
                  )}
                  {viewReturnModal.status === "pending" && (
                    <p className="text-xs text-center" style={{ color: BRAND.mutedLight }}>
                      We&apos;ll review your request and get back to you soon.
                    </p>
                  )}
                </>
              )}
            </div>
            <div className="px-5 pb-5 flex gap-3">
              {!editingReturn && viewReturnModal.status === "pending" && viewReturnModal.id && (
                <button
                  onClick={() => { setEditingReturn(true); setEditReturnReason(viewReturnModal.reason); setEditReturnPhotoFiles([]); setEditReturnPhotoPreviews([]); setEditReturnError(""); }}
                  className="flex-1 py-2.5 text-sm font-bold transition-opacity hover:opacity-80"
                  style={{ border: `1px solid ${BRAND.teal}`, color: BRAND.teal }}>
                  Edit Request
                </button>
              )}
              {!editingReturn && (
                <button onClick={() => setViewReturnModal(null)}
                  className="flex-1 py-2.5 text-sm font-bold transition-opacity hover:opacity-70"
                  style={{ border: `1px solid ${BRAND.border}`, color: BRAND.muted }}>
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Proof of Payment Modal */}
      {proofModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={e => { if (e.target === e.currentTarget) setProofModal(null); }}>
          <div className="w-full max-w-lg rounded-2xl overflow-hidden"
            style={{ background: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
            <div className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: `1px solid ${BRAND.border}`, background: BRAND.card }}>
              <p className="font-black text-sm uppercase tracking-widest" style={{ color: BRAND.black }}>
                Payment Proof — {proofModal.orderNumber}
              </p>
              <button onClick={() => setProofModal(null)} className="p-1 transition-opacity hover:opacity-70">
                <X className="w-4 h-4" style={{ color: BRAND.muted }} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto" style={{ maxHeight: "75vh" }}>
              {!proofImgLoaded && (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
                    style={{ borderColor: BRAND.teal, borderTopColor: "transparent" }} />
                  <p className="text-xs" style={{ color: BRAND.muted }}>Loading proof…</p>
                </div>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={proofModal.url}
                alt="Proof of payment"
                style={{ width: "100%", height: "auto", display: proofImgLoaded ? "block" : "none" }}
                className="rounded-lg"
                onLoad={() => setProofImgLoaded(true)}
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; setProofImgLoaded(true); }}
              />
              <div className="flex gap-3 mt-3">
                <a href={proofModal.url} target="_blank" rel="noopener noreferrer"
                  className="flex-1 text-center text-xs font-bold py-2.5 transition-opacity hover:opacity-80"
                  style={{ background: BRAND.teal, color: "#fff" }}>
                  Open in New Tab
                </a>
                <button onClick={() => setProofModal(null)}
                  className="px-5 text-xs font-bold py-2.5"
                  style={{ border: `1px solid ${BRAND.border}`, color: BRAND.muted }}>
                  Close
                </button>
              </div>
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

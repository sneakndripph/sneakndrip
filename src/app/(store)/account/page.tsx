"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DP_RESERVE_FEE } from "@/lib/constants";
import Image from "next/image";
import { Package, User, LogOut, ChevronRight, CheckCircle, Lock, Eye, EyeOff, Save, X, Home, Star, Upload, Plus, Pencil, Trash2 } from "lucide-react";
import OrderCard, { type Order, type ReturnInfo } from "@/components/account/OrderCard";
import AddressForm, { type AddressFormValues } from "@/components/account/AddressForm";
import { createClient } from "@/lib/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import toast from "react-hot-toast";

type Tab = "orders" | "account" | "address" | "password";

interface ShippingAddress {
  id: string;
  label: string;
  full_name: string;
  mobile: string;
  street: string;
  barangay: string;
  city: string;
  province: string;
  postal_code: string;
  is_default: boolean;
  created_at: string;
}

const MAX_ADDRESSES = 5;

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

  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(() => {
    try {
      const stored = sessionStorage.getItem("snd_expanded_orders");
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
  });
  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrders(prev => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId); else next.add(orderId);
      try { sessionStorage.setItem("snd_expanded_orders", JSON.stringify([...next])); } catch {}
      return next;
    });
  };

  // Return request state
  const [returnModalOrder, setReturnModalOrder] = useState<Order | null>(null);
  const [returnReason, setReturnReason] = useState("");
  const [returnPhotoFiles, setReturnPhotoFiles] = useState<File[]>([]);
  const [returnPhotoPreviews, setReturnPhotoPreviews] = useState<string[]>([]);
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [returnError, setReturnError] = useState("");
  const [returnSuccess, setReturnSuccess] = useState(false);
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
  const [seenCounts, setSeenCounts] = useState<Record<string, number>>(() => {
    try { return JSON.parse(localStorage.getItem("snd_seen_tab_counts") ?? "{}"); } catch { return {}; }
  });
  const [payBalanceModal, setPayBalanceModal] = useState<{ orderNumber: string; balance: number } | null>(null);
  const [payBalanceMethod, setPayBalanceMethod] = useState<"gcash" | "maya" | "bank_transfer" | null>(null);
  const [payBalanceRef, setPayBalanceRef] = useState("");
  const [payBalanceProof, setPayBalanceProof] = useState<File | null>(null);
  const [payBalanceProofPreview, setPayBalanceProofPreview] = useState<string | null>(null);
  const [submittingBalance, setSubmittingBalance] = useState(false);
  const [payBalanceError, setPayBalanceError] = useState("");
  const [payBalanceSuccess, setPayBalanceSuccess] = useState(false);
  const [payCfg, setPayCfg] = useState({
    gcashNumber: "", gcashName: "",
    mayaNumber: "", mayaName: "",
    bank1Name: "", bank1Account: "", bank1AccountName: "",
    bank2Name: "", bank2Account: "", bank2AccountName: "",
  });
  const [reviewImageFile, setReviewImageFile] = useState<File | null>(null);
  const [reviewImagePreview, setReviewImagePreview] = useState<string | null>(null);
  const [proofImgLoaded, setProofImgLoaded] = useState(false);

  // Saved addresses state
  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<ShippingAddress | null>(null);
  const [savingAddress, setSavingAddress] = useState(false);
  const [deleteAddressId, setDeleteAddressId] = useState<string | null>(null);
  const [deletingAddress, setDeletingAddress] = useState(false);
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
      fetch("/api/account/addresses")
        .then(r => r.json())
        .then(data => setAddresses((data.addresses as ShippingAddress[]) ?? []))
        .catch(() => setAddresses([]))
        .finally(() => setLoadingAddresses(false));
      Promise.all([
        fetch("/api/orders").then(r => r.json()),
        fetch("/api/returns").then(r => r.json()).catch(() => ({ returns: [] })),
        fetch("/api/admin/settings").then(r => r.json()).catch(() => ({})),
      ]).then(([ordersData, returnsData, settingsData]) => {
        setOrders((ordersData.orders as Order[]) ?? []);
        const returnMap = new Map<string, ReturnInfo>(
          ((returnsData.returns ?? []) as { id: string; order_number: string; status: string; admin_note: string | null; reason: string; photo_url: string | null; photo_urls?: string[] | null }[])
            .map(r => [r.order_number, { id: r.id, status: r.status, admin_note: r.admin_note, reason: r.reason, photo_url: r.photo_url ?? null, photo_urls: r.photo_urls ?? null }])
        );
        setReturnedOrders(returnMap);
        if (settingsData) {
          setPayCfg(prev => ({
            gcashNumber: settingsData.gcash_number || prev.gcashNumber,
            gcashName: settingsData.gcash_name || prev.gcashName,
            mayaNumber: settingsData.maya_number || prev.mayaNumber,
            mayaName: settingsData.maya_name || prev.mayaName,
            bank1Name: settingsData.bank1_name || prev.bank1Name,
            bank1Account: settingsData.bank1_account_number || prev.bank1Account,
            bank1AccountName: settingsData.bank1_account_name || prev.bank1AccountName,
            bank2Name: settingsData.bank2_name || prev.bank2Name,
            bank2Account: settingsData.bank2_account_number || prev.bank2Account,
            bank2AccountName: settingsData.bank2_account_name || prev.bank2AccountName,
          }));
        }
        setLoadingOrders(false);
      });
    });
  }, [router]);

  // Auto-open pay balance modal when arriving via email link (?order=SND-XXXX)
  useEffect(() => {
    if (orders.length === 0) return;
    const orderParam = new URLSearchParams(window.location.search).get("order");
    if (!orderParam) return;
    const match = orders.find(o => o.order_number === orderParam && o.status === "stock_on_hand" && o.payment_type === "downpayment");
    if (!match) return;
    const dpItems = match.order_items.filter(i => i.payment_type === "downpayment");
    const dpBalance = dpItems.reduce((s, i) => s + (i.unit_price - DP_RESERVE_FEE) * i.quantity, 0);
    queueMicrotask(() => setPayBalanceModal({ orderNumber: match.order_number, balance: dpBalance }));
  }, [orders]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Signed out");
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

  async function handleAddAddress(values: AddressFormValues) {
    setSavingAddress(true);
    const meta = user?.user_metadata ?? {};
    const res = await fetch("/api/account/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...values,
        full_name: meta.full_name || "",
        mobile: meta.mobile || "",
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setAddresses(prev => {
        const next = values.is_default ? prev.map(a => ({ ...a, is_default: false })) : prev;
        return [...next, data.address as ShippingAddress];
      });
      setAddressModalOpen(false);
      toast.success("Address added");
    } else {
      toast.error(data.error ?? "Failed to add address");
    }
    setSavingAddress(false);
  }

  async function handleUpdateAddress(values: AddressFormValues) {
    if (!editingAddress) return;
    setSavingAddress(true);
    const res = await fetch(`/api/account/addresses/${editingAddress.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setAddresses(prev => prev.map(a => {
        if (a.id === editingAddress.id) return data.address as ShippingAddress;
        return values.is_default ? { ...a, is_default: false } : a;
      }));
      setAddressModalOpen(false);
      setEditingAddress(null);
      toast.success("Address updated");
    } else {
      toast.error(data.error ?? "Failed to update address");
    }
    setSavingAddress(false);
  }

  async function handleDeleteAddress() {
    if (!deleteAddressId) return;
    setDeletingAddress(true);
    const id = deleteAddressId;
    const wasDefault = addresses.find(a => a.id === id)?.is_default ?? false;
    const res = await fetch(`/api/account/addresses/${id}`, { method: "DELETE" });
    if (res.ok) {
      setAddresses(prev => {
        const remaining = prev.filter(a => a.id !== id);
        if (wasDefault && remaining.length > 0) {
          const promoted = remaining.reduce((latest, a) => new Date(a.created_at) > new Date(latest.created_at) ? a : latest, remaining[0]);
          return remaining.map(a => a.id === promoted.id ? { ...a, is_default: true } : a);
        }
        return remaining;
      });
      toast.success("Address deleted");
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Failed to delete address");
    }
    setDeleteAddressId(null);
    setDeletingAddress(false);
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
      } else {
        toast.error("Failed to upload photo. Try again.");
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
      const res = await fetch("/api/reviews", {
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
      if (!res.ok) {
        setSubmittingReview(false);
        if (res.status === 401) toast.error("Sign in to leave a review");
        else if (res.status === 403) toast.error("You can only review products you've purchased");
        else if (res.status === 409) toast.error("You've already reviewed this product");
        else toast.error("Failed to submit review. Try again.");
        return;
      }
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

  async function handlePayBalance() {
    if (!payBalanceModal || !payBalanceMethod || !payBalanceRef.trim() || !payBalanceProof) return;
    setSubmittingBalance(true);
    setPayBalanceError("");
    try {
      let proofPath = "";
      if (payBalanceProof) {
        const form = new FormData();
        form.append("file", payBalanceProof);
        form.append("orderNumber", payBalanceModal.orderNumber);
        form.append("type", "balance_proof");
        const upRes = await fetch("/api/orders/upload-proof", { method: "POST", body: form });
        if (upRes.ok) { const d = await upRes.json(); proofPath = d.path ?? ""; }
      }
      const res = await fetch("/api/orders/pay-balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: payBalanceModal.orderNumber,
          balance: payBalanceModal.balance,
          paymentMethod: payBalanceMethod,
          reference: payBalanceRef.trim(),
          proofPath,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Failed"); }
      setPayBalanceSuccess(true);
    } catch (e) {
      setPayBalanceError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSubmittingBalance(false);
    }
  }

  const tabCounts: Record<string, number> = {
    pending: orders.filter(o => ["pending", "stock_on_hand"].includes(o.status)).length,
    to_ship: orders.filter(o => ["paid", "processing"].includes(o.status)).length,
    shipped: orders.filter(o => o.status === "shipped").length,
    delivered: orders.filter(o => o.status === "delivered").length,
    returned: orders.filter(o => returnedOrders.get(o.order_number)?.status === "approved").length,
    cancelled: orders.filter(o => o.status === "cancelled").length,
  };

  const filteredOrders = orders.filter(order => {
    if (orderFilter === "all") return true;
    if (orderFilter === "pending") return ["pending", "stock_on_hand"].includes(order.status);
    if (orderFilter === "to_ship") return ["paid", "processing"].includes(order.status);
    if (orderFilter === "shipped") return order.status === "shipped";
    if (orderFilter === "delivered") return order.status === "delivered";
    if (orderFilter === "returned") return returnedOrders.get(order.order_number)?.status === "approved";
    if (orderFilter === "cancelled") return order.status === "cancelled";
    return true;
  });

  const NAV_TABS = [
    { id: "orders" as Tab, icon: Package, label: "My Orders" },
    { id: "account" as Tab, icon: User, label: "Account Details" },
    { id: "address" as Tab, icon: Home, label: "My Address" },
    { id: "password" as Tab, icon: Lock, label: "Change Password" },
  ];

  const inputCls = "w-full px-4 py-3 text-sm focus:outline-none transition-colors";

  return (
    <div className="bg-paper font-body min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-eyebrow text-ink-3 mb-1">Welcome back</p>
            <h1 className="text-display text-ink font-display leading-tight tracking-[-0.03em]">
              My Account
            </h1>
          </div>
          <button onClick={handleSignOut}
            className="flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-60 text-ink-2">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>

        {/* Mobile tabs — horizontal scroll */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 lg:hidden [scrollbar-width:none]">
          {NAV_TABS.map(item => {
            const Icon = item.icon;
            return (
              <button key={item.id} onClick={() => setTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold whitespace-nowrap rounded-full shrink-0 transition-all border ${
                  tab === item.id ? "bg-ink text-paper border-ink" : "bg-paper-2 text-ink-2 border-line"
                }`}>
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar — desktop only */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="rounded-xl overflow-hidden bg-paper-2 border border-line">
              {NAV_TABS.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button key={item.id} onClick={() => setTab(item.id)}
                    className={`w-full flex items-center justify-between px-4 py-4 text-sm font-semibold transition-colors border-l-[3px] ${
                      idx < NAV_TABS.length - 1 ? "border-b border-b-line" : ""
                    } ${tab === item.id ? "bg-ink/[6%] text-ink border-l-ink" : "text-ink border-l-transparent"}`}>
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </div>
                    <ChevronRight className="w-4 h-4 text-ink-3" />
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
                <h2 className="font-black text-lg mb-3 text-ink">Order History</h2>

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
                          setSeenCounts(prev => {
                            const next = { ...prev, [f.key]: cnt };
                            try { localStorage.setItem("snd_seen_tab_counts", JSON.stringify(next)); } catch {}
                            return next;
                          });
                        }}
                        className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-full transition-all border ${
                          orderFilter === f.key ? "bg-ink text-paper border-ink" : "bg-paper-2 text-ink-2 border-line"
                        }`}>
                        {f.label}
                        {cnt > 0 && f.key !== "all" && cnt > (seenCounts[f.key] ?? 0) && (
                          <span className={`inline-flex items-center justify-center min-w-[16px] h-4 px-1 text-[9px] font-black rounded-full ${
                            orderFilter === f.key ? "bg-paper text-ink" : "bg-ink text-white"
                          }`}>
                            {cnt}
                          </span>
                        )}
                      </button>
                      );
                    })}
                  </div>
                )}

                {loadingOrders ? (
                  <div className="py-12 text-center text-sm text-ink-2">Loading orders…</div>
                ) : orders.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="font-display text-[1.5rem] tracking-[0.04em] text-ink-2">NO ORDERS YET</p>
                    <p className="text-sm mt-2 mb-6 text-ink-3">Your orders will show up here after you place one.</p>
                    <Link href="/shop" className="inline-block px-8 py-3 font-bold text-sm uppercase tracking-widest bg-ink text-paper">Shop Now</Link>
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="font-display text-[1.5rem] tracking-[0.04em] text-ink-2">NO ORDERS</p>
                    <p className="text-sm mt-2 text-ink-3">No orders in this category.</p>
                  </div>
                ) : filteredOrders.map(order => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    expanded={expandedOrders.has(order.id)}
                    onToggleExpand={() => toggleOrderExpand(order.id)}
                    returnInfo={returnedOrders.get(order.order_number)}
                    isReviewed={reviewedOrderIds.has(order.id)}
                    isCancelling={cancellingOrder === order.order_number}
                    onCancel={() => setCancelModalOrder(order.order_number)}
                    onRequestReturn={() => {
                      setReturnModalOrder(order);
                      setReturnReason("");
                      setReturnError("");
                      setReturnSuccess(false);
                      setReturnPhotoFiles([]);
                      setReturnPhotoPreviews([]);
                    }}
                    onViewReturn={() => {
                      const ret = returnedOrders.get(order.order_number)!;
                      setViewReturnModal({ orderNumber: order.order_number, ...ret });
                    }}
                    onWriteReview={async () => {
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
                    onPayBalance={() => {
                      const dpItemsBalance = order.order_items
                        .filter(i => i.payment_type === "downpayment")
                        .reduce((s, i) => s + (i.unit_price - DP_RESERVE_FEE) * i.quantity, 0);
                      setPayBalanceModal({ orderNumber: order.order_number, balance: dpItemsBalance });
                    }}
                    onViewProof={() => {
                      setProofImgLoaded(false);
                      setProofModal({ url: `/api/proof?orderNumber=${encodeURIComponent(order.order_number)}`, orderNumber: order.order_number });
                    }}
                  />
                ))}
              </div>
            )}

            {/* Account Details tab */}
            {tab === "account" && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-black text-lg text-ink">Account Details</h2>
                  <span className="text-xs text-ink-2">
                    <span className="text-state-error">*</span> Required
                  </span>
                </div>
                <p className="text-sm mb-6 text-ink-2">Signed in as <strong>{user.email}</strong></p>

                <form onSubmit={handleSaveProfile}>
                  <div className="p-6 rounded-xl space-y-4 bg-paper-2 border border-line">

                    {profileSuccess && (
                      <div className="flex items-center gap-2 px-4 py-3 rounded text-sm font-semibold bg-ink/[8%] text-ink border border-ink/[19%]">
                        <CheckCircle className="w-4 h-4" /> Profile updated successfully!
                      </div>
                    )}
                    {profileError && (
                      <div className="px-4 py-3 rounded text-sm font-medium bg-state-error/[7%] text-state-error border border-state-error/[19%]">
                        {profileError}
                      </div>
                    )}

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold uppercase tracking-wide mb-1.5 text-ink">
                          Full Name <span className="text-state-error">*</span>
                        </label>
                        <input
                          value={profileForm.name}
                          onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))}
                          placeholder="Juan Dela Cruz"
                          className={`${inputCls} bg-paper text-ink border focus:border-ink ${profileTouched && !profileForm.name ? "border-state-error" : "border-line"}`}
                        />
                        {profileTouched && !profileForm.name && (
                          <p className="mt-1 text-[11px] font-semibold text-state-error">Full name is required</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wide mb-1.5 text-ink">
                          Email Address
                        </label>
                        <input
                          value={user.email || ""}
                          disabled
                          className={`${inputCls} bg-line border border-line text-ink-2 cursor-not-allowed`}
                        />
                        <p className="mt-1 text-[11px] text-ink-3">Email cannot be changed</p>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wide mb-1.5 text-ink">
                          Mobile Number <span className="text-state-error">*</span>
                        </label>
                        <input
                          value={profileForm.mobile}
                          onChange={e => setProfileForm(f => ({ ...f, mobile: e.target.value.replace(/\D/g, "").slice(0, 11) }))}
                          placeholder="09XX XXX XXXX"
                          inputMode="numeric"
                          maxLength={11}
                          className={`${inputCls} bg-paper text-ink border focus:border-ink ${profileTouched && !profileForm.mobile ? "border-state-error" : "border-line"}`}
                        />
                        {profileTouched && !profileForm.mobile && (
                          <p className="mt-1 text-[11px] font-semibold text-state-error">Mobile number is required</p>
                        )}
                      </div>
                    </div>

                    <button type="submit" disabled={savingProfile}
                      className="flex items-center gap-2 mt-2 px-6 py-3 font-black text-sm uppercase tracking-widest transition-opacity hover:opacity-90 disabled:opacity-50 bg-ink text-paper">
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
                  <h2 className="font-black text-lg text-ink">My Addresses</h2>
                </div>
                <p className="text-sm mb-6 text-ink-2">
                  Saved addresses will auto-fill at checkout.
                </p>

                {loadingAddresses ? (
                  <div className="py-12 text-center text-sm text-ink-2">Loading addresses…</div>
                ) : (
                  <div className="space-y-3">
                    {addresses.map(addr => (
                      <div key={addr.id} className="p-5 rounded-xl bg-paper-2 border border-line">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-black text-sm text-ink">{addr.label}</p>
                              {addr.is_default && (
                                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-ink text-paper">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-ink-2">
                              {[addr.street, addr.barangay, addr.city, addr.province, addr.postal_code].filter(Boolean).join(", ")}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => { setEditingAddress(addr); setAddressModalOpen(true); }}
                              className="p-2 transition-opacity hover:opacity-70 text-ink-2" aria-label="Edit address">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteAddressId(addr.id)}
                              className="p-2 transition-opacity hover:opacity-70 text-ink-2" aria-label="Delete address">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {addresses.length === 0 && (
                      <div className="py-8 text-center text-sm text-ink-2">No saved addresses yet.</div>
                    )}

                    <button
                      onClick={() => { setEditingAddress(null); setAddressModalOpen(true); }}
                      disabled={addresses.length >= MAX_ADDRESSES}
                      className="w-full flex items-center justify-center gap-2 py-3 text-xs font-bold uppercase tracking-widest border border-dashed border-line text-ink-2 transition-opacity hover:opacity-70 disabled:opacity-40 disabled:cursor-not-allowed">
                      <Plus className="w-3.5 h-3.5" />
                      Add new address
                    </button>
                    {addresses.length >= MAX_ADDRESSES && (
                      <p className="text-center text-[11px] text-ink-3">You&apos;ve reached the {MAX_ADDRESSES}-address limit. Delete one to add another.</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Change Password tab */}
            {tab === "password" && (
              <div>
                <h2 className="font-black text-lg mb-2 text-ink">Change Password</h2>
                <p className="text-sm mb-6 text-ink-2">
                  Choose a strong password with at least 6 characters.{" "}
                  <span className="text-state-error">*</span> Required
                </p>

                <form onSubmit={handleChangePassword}>
                  <div className="p-6 rounded-xl space-y-4 bg-paper-2 border border-line">

                    {pwSuccess && (
                      <div className="flex items-center gap-2 px-4 py-3 rounded text-sm font-semibold bg-ink/[8%] text-ink border border-ink/[19%]">
                        <CheckCircle className="w-4 h-4" /> Password updated successfully!
                      </div>
                    )}
                    {pwError && (
                      <div className="px-4 py-3 rounded text-sm font-medium bg-state-error/[7%] text-state-error border border-state-error/[19%]">
                        {pwError}
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wide mb-1.5 text-ink">
                        Current Password <span className="text-state-error">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPw ? "text" : "password"}
                          value={pwForm.currentPw}
                          onChange={e => setPwForm(f => ({ ...f, currentPw: e.target.value }))}
                          placeholder="Your current password"
                          className={`${inputCls} pr-12 bg-paper text-ink border focus:border-ink ${pwTouched && !pwForm.currentPw ? "border-state-error" : "border-line"}`}
                        />
                        <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-2">
                          {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wide mb-1.5 text-ink">
                        New Password <span className="text-state-error">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPw ? "text" : "password"}
                          value={pwForm.newPw}
                          onChange={e => setPwForm(f => ({ ...f, newPw: e.target.value }))}
                          placeholder="Min. 6 characters"
                          className={`${inputCls} pr-12 bg-paper text-ink border focus:border-ink ${pwTouched && !pwForm.newPw ? "border-state-error" : "border-line"}`}
                        />
                        <button type="button" onClick={() => setShowNewPw(!showNewPw)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-2">
                          {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {pwTouched && !pwForm.newPw && (
                        <p className="mt-1 text-[11px] font-semibold text-state-error">New password is required</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wide mb-1.5 text-ink">
                        Confirm New Password <span className="text-state-error">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPw ? "text" : "password"}
                          value={pwForm.confirmPw}
                          onChange={e => setPwForm(f => ({ ...f, confirmPw: e.target.value }))}
                          placeholder="Re-enter new password"
                          className={`${inputCls} pr-12 bg-paper text-ink border focus:border-ink ${pwTouched && pwForm.newPw !== pwForm.confirmPw ? "border-state-error" : "border-line"}`}
                        />
                        <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-2">
                          {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {pwTouched && pwForm.newPw && pwForm.confirmPw && pwForm.newPw !== pwForm.confirmPw && (
                        <p className="mt-1 text-[11px] font-semibold text-state-error">Passwords do not match</p>
                      )}
                    </div>

                    <button type="submit" disabled={savingPw}
                      className="flex items-center gap-2 mt-2 px-6 py-3 font-black text-sm uppercase tracking-widest transition-opacity hover:opacity-90 disabled:opacity-50 bg-ink text-white">
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
          <div className="w-full max-w-sm rounded-2xl overflow-hidden bg-paper border border-line">
            <div className="flex items-center justify-between px-5 py-4 border-b border-line bg-paper-2">
              <p className="font-black text-sm uppercase tracking-widest text-ink">
                {existingReviewId ? "Edit Review" : "Write a Review"}
              </p>
              <button onClick={() => { setReviewModalOrder(null); setReviewSuccess(false); setReviewImageFile(null); setReviewImagePreview(null); }} className="p-1 transition-opacity hover:opacity-70">
                <X className="w-4 h-4 text-ink-2" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {reviewSuccess ? (
                <div className="py-6 text-center">
                  <CheckCircle className="w-10 h-10 mx-auto mb-2 text-ink" />
                  <p className="font-bold text-sm text-ink">Thank you for your review!</p>
                </div>
              ) : (
                <>
                  {reviewModalOrder.order_items[0] && (
                    <p className="text-xs font-semibold text-ink-2">
                      Order: <span className="text-ink">{reviewModalOrder.order_number}</span>
                      {" · "}{reviewModalOrder.order_items[0].product_name}
                    </p>
                  )}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide mb-2 text-ink">Rating</label>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(n => (
                        <button key={n} type="button"
                          onClick={() => setReviewForm(f => ({ ...f, rating: n }))}
                          className="transition-opacity hover:opacity-80">
                          <Star className={`w-7 h-7 ${n <= reviewForm.rating ? "fill-ink text-ink" : "fill-none text-line"}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide mb-1.5 text-ink">Title (optional)</label>
                    <input
                      value={reviewForm.title}
                      onChange={e => setReviewForm(f => ({ ...f, title: e.target.value }))}
                      placeholder="e.g. Great quality!"
                      className="w-full px-3 py-2.5 text-sm focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-1 bg-paper-2 border border-line text-ink"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide mb-1.5 text-ink">Review <span className="text-state-error">*</span></label>
                    <textarea
                      value={reviewForm.body}
                      onChange={e => setReviewForm(f => ({ ...f, body: e.target.value }))}
                      placeholder="Share your experience…"
                      rows={3}
                      className="w-full px-3 py-2.5 text-sm focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-1 resize-none bg-paper-2 border border-line text-ink"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide mb-1.5 text-ink">
                      Photo (optional)
                    </label>
                    {reviewImagePreview ? (
                      <div className="relative w-20 h-20">
                        <Image src={reviewImagePreview} alt="Review" fill className="object-cover rounded-lg" sizes="80px" />
                        <button type="button"
                          onClick={() => { setReviewImageFile(null); setReviewImagePreview(null); }}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center bg-ink text-paper">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center gap-1 w-20 h-20 rounded-lg cursor-pointer border-2 border-dashed border-line bg-paper-2">
                        <span className="text-[10px] font-semibold text-ink-2">Add Photo</span>
                        <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                          onChange={e => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            if (f.size > 5 * 1024 * 1024 || !["image/jpeg", "image/png"].includes(f.type)) {
                              toast.error("Photo must be under 5MB and JPG/PNG");
                              e.target.value = "";
                              return;
                            }
                            setReviewImageFile(f);
                            setReviewImagePreview(URL.createObjectURL(f));
                          }} />
                      </label>
                    )}
                  </div>
                  {loadingReview && (
                    <p className="text-xs text-center text-ink-2">Loading your previous review…</p>
                  )}
                  <button
                    onClick={handleSubmitReview}
                    disabled={submittingReview || !reviewForm.body.trim() || loadingReview}
                    className="w-full py-3 text-sm font-black uppercase tracking-widest transition-opacity hover:opacity-90 disabled:opacity-50 bg-ink text-white">
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
          <div className="w-full max-w-sm rounded-2xl overflow-hidden bg-paper border border-line">
            <div className="flex items-center justify-between px-5 py-4 border-b border-line bg-paper-2">
              <p className="font-black text-sm uppercase tracking-widest text-ink">Request Return</p>
              <button onClick={() => { setReturnModalOrder(null); setReturnReason(""); setReturnError(""); setReturnSuccess(false); setReturnPhotoFiles([]); setReturnPhotoPreviews([]); }}
                className="p-1 transition-opacity hover:opacity-70">
                <X className="w-4 h-4 text-ink-2" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {returnSuccess ? (
                <div className="py-6 text-center">
                  <CheckCircle className="w-10 h-10 mx-auto mb-2 text-ink" />
                  <p className="font-bold text-sm text-ink">Return request submitted!</p>
                  <p className="text-xs mt-1 text-ink-2">We&apos;ll review it and get back to you soon.</p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-ink-2">
                    Order: <span className="font-bold text-ink">{returnModalOrder.order_number}</span>
                  </p>
                  {returnError && (
                    <div className="px-3 py-2.5 rounded text-xs font-medium bg-state-error/[7%] text-state-error border border-state-error/[19%]">
                      {returnError}
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide mb-1.5 text-ink">
                      Reason for Return <span className="text-state-error">*</span>
                    </label>
                    <textarea
                      value={returnReason}
                      onChange={e => setReturnReason(e.target.value)}
                      placeholder="e.g. Wrong size, defective item, changed mind…"
                      rows={3}
                      className="w-full px-3 py-2.5 text-sm focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-1 resize-none bg-paper-2 border border-line text-ink"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide mb-1.5 text-ink">
                      Photos of Item <span className="text-state-error">*</span>
                      {returnPhotoFiles.length > 0 && (
                        <span className="ml-2 font-normal normal-case text-ink-2">
                          {returnPhotoFiles.length}/5
                        </span>
                      )}
                    </label>
                    {returnPhotoPreviews.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        {returnPhotoPreviews.map((preview, i) => (
                          <div key={i} className="relative aspect-square rounded-lg overflow-hidden group bg-paper-2 border border-line">
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
                          <label className="relative aspect-square rounded-lg flex items-center justify-center cursor-pointer transition-colors bg-paper-2 border-2 border-dashed border-line">
                            <span className="text-xl font-bold text-ink-2">+</span>
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
                      <label className="flex flex-col items-center justify-center gap-2 px-4 py-5 rounded-lg cursor-pointer transition-colors border-2 border-dashed border-line bg-paper-2">
                        <span className="text-xs font-semibold text-center text-ink-2">
                          Click to upload up to 5 photos<br />
                          <span className="text-ink-3">JPG, PNG, WEBP · max 10MB each</span>
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
                    className="w-full py-3 text-sm font-black uppercase tracking-widest transition-opacity hover:opacity-90 disabled:opacity-50 bg-ink text-paper">
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
          <div className="w-full max-w-sm rounded-2xl overflow-hidden bg-paper border border-line">
            <div className="flex items-center justify-between px-5 py-4 border-b border-line bg-paper-2">
              <p className="font-black text-sm uppercase tracking-widest text-ink">
                {editingReturn ? "Edit Request" : "Return Request"}
              </p>
              <button onClick={() => { setViewReturnModal(null); setEditingReturn(false); }} className="p-1 transition-opacity hover:opacity-70">
                <X className="w-4 h-4 text-ink-2" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-ink-2">
                  Order: <span className="font-bold text-ink">{viewReturnModal.orderNumber}</span>
                </p>
                <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                  viewReturnModal.status === "approved" ? "bg-[rgba(16,185,129,0.12)] text-[#10B981]"
                    : viewReturnModal.status === "denied" ? "bg-state-error/[7%] text-state-error"
                    : "bg-[rgba(138,133,128,0.12)] text-ink-2"
                }`}>
                  {viewReturnModal.status === "approved" ? "Approved" : viewReturnModal.status === "denied" ? "Denied" : "Pending Review"}
                </span>
              </div>

              {editingReturn ? (
                <>
                  {editReturnError && (
                    <div className="px-3 py-2 rounded text-xs font-medium bg-state-error/[7%] text-state-error">
                      {editReturnError}
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide mb-1.5 text-ink">
                      Reason <span className="text-state-error">*</span>
                    </label>
                    <textarea
                      value={editReturnReason}
                      onChange={e => setEditReturnReason(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2.5 text-sm focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-1 resize-none bg-paper-2 border border-line text-ink"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide mb-1.5 text-ink">
                      Replace Photos (optional)
                      {editReturnPhotoFiles.length > 0 && (
                        <span className="ml-2 font-normal normal-case text-ink-2">
                          {editReturnPhotoFiles.length}/5 new
                        </span>
                      )}
                    </label>
                    {editReturnPhotoPreviews.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2 mb-1">
                        {editReturnPhotoPreviews.map((preview, i) => (
                          <div key={i} className="relative aspect-square rounded-lg overflow-hidden group bg-paper-2 border border-line">
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
                          <label className="relative aspect-square rounded-lg flex items-center justify-center cursor-pointer bg-paper-2 border-2 border-dashed border-line">
                            <span className="text-xl font-bold text-ink-2">+</span>
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
                      <label className="flex items-center justify-center gap-2 px-3 py-3 rounded-lg cursor-pointer border-2 border-dashed border-line bg-paper-2">
                        <span className="text-xs font-semibold text-ink-2">
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
                      className="flex-1 py-2.5 text-xs font-black uppercase tracking-wide disabled:opacity-50 bg-ink text-white">
                      {savingEditReturn ? "Saving…" : "Save Changes"}
                    </button>
                    <button onClick={() => { setEditingReturn(false); setEditReturnPhotoFiles([]); setEditReturnPhotoPreviews([]); setEditReturnError(""); }}
                      className="px-4 py-2.5 text-xs font-bold border border-line text-ink-2">
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide mb-1 text-ink-2">Your Reason</p>
                    <p className="text-sm text-ink">{viewReturnModal.reason}</p>
                  </div>
                  {(() => {
                    const photos = viewReturnModal.photo_urls?.length
                      ? viewReturnModal.photo_urls
                      : viewReturnModal.photo_url ? [viewReturnModal.photo_url] : [];
                    if (!photos.length) return null;
                    return (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide mb-1.5 text-ink-2">
                          Your Photos ({photos.length})
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {photos.map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                              className="relative aspect-square rounded-lg overflow-hidden transition-opacity hover:opacity-80 bg-paper-2 border border-line">
                              <Image src={url} alt={`Return photo ${i + 1}`} fill className="object-cover" sizes="90px" />
                            </a>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                  {viewReturnModal.admin_note && (
                    <div className="px-4 py-3 rounded-lg bg-ink/[6%] border border-ink/[15%]">
                      <p className="text-xs font-bold uppercase tracking-wide mb-1 text-ink">Message from Store</p>
                      <p className="text-sm text-ink">{viewReturnModal.admin_note}</p>
                    </div>
                  )}
                  {viewReturnModal.status === "pending" && (
                    <p className="text-xs text-center text-ink-3">
                      We&apos;ll review your request and get back to you soon.
                    </p>
                  )}
                  {viewReturnModal.status === "approved" && (
                    <div className="p-4 rounded-xl" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)" }}>
                      <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: "#10B981" }}>Next Step</p>
                      <p className="text-xs mb-3 text-ink-2">
                        Your return has been approved. Please reach out to us via chat or Facebook to arrange the return process.
                      </p>
                      <div className="flex flex-col gap-2">
                        <a href="/chat"
                          className="flex items-center justify-center gap-2 py-2.5 text-xs font-black uppercase tracking-wide"
                          style={{ background: "#10B981", color: "#fff" }}>
                          Chat with Us
                        </a>
                        <a href="https://m.me/sneakndrip" target="_blank" rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 py-2.5 text-xs font-bold transition-opacity hover:opacity-70 border border-line text-ink-2">
                          Message on Facebook
                        </a>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="px-5 pb-5 flex gap-3">
              {!editingReturn && viewReturnModal.status === "pending" && viewReturnModal.id && (
                <button
                  onClick={() => { setEditingReturn(true); setEditReturnReason(viewReturnModal.reason); setEditReturnPhotoFiles([]); setEditReturnPhotoPreviews([]); setEditReturnError(""); }}
                  className="flex-1 py-2.5 text-sm font-bold transition-opacity hover:opacity-80 border border-ink text-ink">
                  Edit Request
                </button>
              )}
              {!editingReturn && (
                <button onClick={() => setViewReturnModal(null)}
                  className="flex-1 py-2.5 text-sm font-bold transition-opacity hover:opacity-70 border border-line text-ink-2">
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
          <div className="w-full max-w-lg rounded-2xl overflow-hidden bg-paper border border-line">
            <div className="flex items-center justify-between px-5 py-4 border-b border-line bg-paper-2">
              <p className="font-black text-sm uppercase tracking-widest text-ink">
                Payment Proof — {proofModal.orderNumber}
              </p>
              <button onClick={() => setProofModal(null)} className="p-1 transition-opacity hover:opacity-70">
                <X className="w-4 h-4 text-ink-2" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto" style={{ maxHeight: "75vh" }}>
              {!proofImgLoaded && (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin border-ink" />
                  <p className="text-xs text-ink-2">Loading proof…</p>
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
                  className="flex-1 text-center text-xs font-bold py-2.5 transition-opacity hover:opacity-80 bg-ink text-white">
                  Open in New Tab
                </a>
                <button onClick={() => setProofModal(null)}
                  className="px-5 text-xs font-bold py-2.5 border border-line text-ink-2">
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
          <div className="w-full max-w-sm rounded-2xl overflow-hidden bg-paper border border-line">
            <div className="flex items-center justify-between px-5 py-4 border-b border-line bg-paper-2">
              <p className="font-black text-sm uppercase tracking-widest text-state-error">Cancel Order</p>
              <button onClick={() => { setCancelModalOrder(null); setCancelReason(""); }} className="p-1 transition-opacity hover:opacity-70">
                <X className="w-4 h-4 text-ink-2" />
              </button>
            </div>
            <div className="p-5">
              <p className="text-sm mb-3 text-ink-2">
                Please let us know why you&apos;re cancelling order <span className="font-bold text-ink">{cancelModalOrder}</span>.
              </p>
              <label className="block text-xs font-bold uppercase tracking-wide mb-2 text-ink">Reason (optional)</label>
              <textarea
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="e.g. Changed my mind, ordered wrong size…"
                rows={3}
                className="w-full px-3 py-2.5 text-sm focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-1 resize-none bg-paper-2 border border-line text-ink"
              />
            </div>
            <div className="flex gap-3 px-5 pb-5">
              <button onClick={executeCancelOrder}
                className="flex-1 py-2.5 text-xs font-black uppercase tracking-wide bg-state-error text-white">
                Confirm Cancel
              </button>
              <button onClick={() => { setCancelModalOrder(null); setCancelReason(""); }}
                className="px-4 py-2.5 text-xs font-bold border border-line text-ink-2">
                Keep Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit address modal */}
      {addressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={e => { if (e.target === e.currentTarget) { setAddressModalOpen(false); setEditingAddress(null); } }}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden bg-paper border border-line max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-line bg-paper-2">
              <p className="font-black text-sm uppercase tracking-widest text-ink">
                {editingAddress ? "Edit Address" : "Add Address"}
              </p>
              <button onClick={() => { setAddressModalOpen(false); setEditingAddress(null); }} className="p-1 transition-opacity hover:opacity-70">
                <X className="w-4 h-4 text-ink-2" />
              </button>
            </div>
            <div className="p-5">
              <AddressForm
                initialData={editingAddress ?? undefined}
                onSubmit={editingAddress ? handleUpdateAddress : handleAddAddress}
                onCancel={() => { setAddressModalOpen(false); setEditingAddress(null); }}
                submitting={savingAddress}
                submitLabel={editingAddress ? "Save Changes" : "Add Address"}
                lockDefault={!!editingAddress?.is_default}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete address confirmation */}
      {deleteAddressId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={e => { if (e.target === e.currentTarget) setDeleteAddressId(null); }}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden bg-paper border border-line">
            <div className="flex items-center justify-between px-5 py-4 border-b border-line bg-paper-2">
              <p className="font-black text-sm uppercase tracking-widest text-state-error">Delete Address</p>
              <button onClick={() => setDeleteAddressId(null)} className="p-1 transition-opacity hover:opacity-70">
                <X className="w-4 h-4 text-ink-2" />
              </button>
            </div>
            <div className="p-5">
              <p className="text-sm text-ink-2">Are you sure you want to delete this address? This can&apos;t be undone.</p>
            </div>
            <div className="flex gap-3 px-5 pb-5">
              <button onClick={handleDeleteAddress} disabled={deletingAddress}
                className="flex-1 py-2.5 text-xs font-black uppercase tracking-wide disabled:opacity-50 bg-state-error text-white">
                {deletingAddress ? "Deleting…" : "Delete"}
              </button>
              <button onClick={() => setDeleteAddressId(null)}
                className="px-4 py-2.5 text-xs font-bold border border-line text-ink-2">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pay Balance modal */}
      {payBalanceModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={e => { if (e.target === e.currentTarget && !submittingBalance) { setPayBalanceModal(null); setPayBalanceMethod(null); setPayBalanceRef(""); setPayBalanceProof(null); setPayBalanceProofPreview(null); setPayBalanceError(""); setPayBalanceSuccess(false); } }}>
          <div className="w-full sm:max-w-sm max-h-[92dvh] flex flex-col rounded-t-2xl sm:rounded-2xl overflow-hidden bg-paper-2">

            {/* Header */}
            <div className="flex items-start justify-between px-5 pt-5 pb-4 shrink-0 border-b border-line">
              <div>
                <p className="font-black text-base font-display text-ink">PAY BALANCE</p>
                <p className="text-xs mt-0.5 text-ink-2">{payBalanceModal.orderNumber}</p>
              </div>
              <button onClick={() => { if (!submittingBalance) { setPayBalanceModal(null); setPayBalanceMethod(null); setPayBalanceRef(""); setPayBalanceProof(null); setPayBalanceProofPreview(null); setPayBalanceError(""); setPayBalanceSuccess(false); } }}
                className="p-1 rounded-lg transition-colors hover:bg-black/10 mt-0.5">
                <X className="w-4 h-4 text-ink-2" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-5 py-5 space-y-5">
              {payBalanceSuccess ? (
                <div className="text-center py-6">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-ink" />
                  <p className="font-black text-base mb-1 font-display text-ink">PAYMENT SUBMITTED!</p>
                  <p className="text-sm leading-relaxed text-ink-2">
                    We&apos;ve received your balance payment details. We&apos;ll verify and process your order for shipping right away.
                  </p>
                </div>
              ) : (
                <>
                  {/* Balance amount */}
                  <div className="p-4 rounded-lg bg-ink/[6%] border border-ink/[15%]">
                    <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-ink-2">Balance Due</p>
                    <p className="font-display text-[1.75rem] text-ink">₱{payBalanceModal.balance.toLocaleString()}</p>
                  </div>

                  {/* Message */}
                  <p className="text-sm leading-relaxed text-ink-2">
                    Your pre-order has arrived! Please settle your remaining balance so we can ship your order right away.
                  </p>

                  {/* Payment method */}
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest mb-2.5 text-ink-2">Payment Method</p>
                    <div className="grid grid-cols-3 gap-2">
                      {(["gcash", "maya", "bank_transfer"] as const).map(m => (
                        <button key={m} type="button"
                          onClick={() => setPayBalanceMethod(m)}
                          className={`py-2.5 text-xs font-bold rounded-lg transition-all border-[1.5px] ${
                            payBalanceMethod === m ? "bg-ink text-white border-ink" : "bg-paper text-ink border-line"
                          }`}>
                          {m === "gcash" ? "GCash" : m === "maya" ? "Maya" : "Bank\nTransfer"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Payment instructions */}
                  {payBalanceMethod && (
                    <div className="p-4 rounded-lg text-sm space-y-1 bg-paper border border-line">
                      {payBalanceMethod === "gcash" && (
                        <>
                          <p className="font-bold text-xs mb-1.5 text-ink">GCash</p>
                          <p className="text-xs text-ink-2">Number: <span className="font-semibold text-ink">{payCfg.gcashNumber}</span></p>
                          <p className="text-xs text-ink-2">Name: <span className="font-semibold text-ink">{payCfg.gcashName}</span></p>
                        </>
                      )}
                      {payBalanceMethod === "maya" && (
                        <>
                          <p className="font-bold text-xs mb-1.5 text-ink">Maya</p>
                          <p className="text-xs text-ink-2">Number: <span className="font-semibold text-ink">{payCfg.mayaNumber}</span></p>
                          <p className="text-xs text-ink-2">Name: <span className="font-semibold text-ink">{payCfg.mayaName}</span></p>
                        </>
                      )}
                      {payBalanceMethod === "bank_transfer" && (
                        <>
                          <p className="font-bold text-xs mb-1.5 text-ink">Bank Transfer</p>
                          {payCfg.bank1Name && (
                            <div className="space-y-0.5 mb-2">
                              <p className="text-xs font-semibold text-ink">{payCfg.bank1Name}</p>
                              <p className="text-xs text-ink-2">Account: <span className="font-semibold text-ink">{payCfg.bank1Account}</span></p>
                              <p className="text-xs text-ink-2">Name: <span className="font-semibold text-ink">{payCfg.bank1AccountName}</span></p>
                            </div>
                          )}
                          {payCfg.bank2Name && (
                            <div className="space-y-0.5 pt-2 border-t border-line">
                              <p className="text-xs font-semibold text-ink">{payCfg.bank2Name}</p>
                              <p className="text-xs text-ink-2">Account: <span className="font-semibold text-ink">{payCfg.bank2Account}</span></p>
                              <p className="text-xs text-ink-2">Name: <span className="font-semibold text-ink">{payCfg.bank2AccountName}</span></p>
                            </div>
                          )}
                        </>
                      )}
                      <p className="text-[10px] mt-2 text-ink-3">
                        Amount: ₱{payBalanceModal.balance.toLocaleString()} · Include your order number in the remarks.
                      </p>
                    </div>
                  )}

                  {/* Reference number */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5 text-ink-2">
                      Reference / Transaction Number <span className="text-state-error">*</span>
                    </label>
                    <input
                      value={payBalanceRef}
                      onChange={e => setPayBalanceRef(e.target.value)}
                      placeholder="e.g. 1234567890"
                      className="w-full px-3 py-2.5 text-sm focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-1 bg-paper border border-line text-ink"
                    />
                  </div>

                  {/* Proof upload */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5 text-ink-2">
                      Proof of Payment <span className="text-state-error">*</span>
                    </label>
                    {payBalanceProofPreview ? (
                      <div className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={payBalanceProofPreview} alt="Proof preview" className="w-full rounded-lg object-cover max-h-36" />
                        <button type="button"
                          onClick={() => { setPayBalanceProof(null); setPayBalanceProofPreview(null); }}
                          className="absolute top-2 right-2 p-1 rounded-full bg-ink text-white">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center gap-2 py-5 cursor-pointer rounded-lg transition-colors border-[1.5px] border-dashed border-line bg-paper">
                        <Upload className="w-5 h-5 text-ink-2" />
                        <span className="text-xs text-ink-2">Tap to upload screenshot</span>
                        <input type="file" accept="image/*" className="hidden"
                          onChange={e => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            setPayBalanceProof(f);
                            setPayBalanceProofPreview(URL.createObjectURL(f));
                          }} />
                      </label>
                    )}
                  </div>

                  {payBalanceError && (
                    <p className="text-xs px-3 py-2 rounded bg-state-error/[6%] text-state-error">
                      {payBalanceError}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 pb-5 pt-3 shrink-0 space-y-2 border-t border-line">
              {payBalanceSuccess ? (
                <button
                  onClick={() => { setPayBalanceModal(null); setPayBalanceMethod(null); setPayBalanceRef(""); setPayBalanceProof(null); setPayBalanceProofPreview(null); setPayBalanceError(""); setPayBalanceSuccess(false); }}
                  className="w-full py-3.5 font-black text-sm uppercase tracking-widest bg-ink text-white">
                  Done
                </button>
              ) : (
                <>
                  <button
                    onClick={handlePayBalance}
                    disabled={submittingBalance || !payBalanceMethod || !payBalanceRef.trim() || !payBalanceProof}
                    className="w-full py-3.5 font-black text-sm uppercase tracking-widest transition-opacity disabled:opacity-40 bg-ink text-white">
                    {submittingBalance ? "Submitting…" : "Submit Payment"}
                  </button>
                  <p className="text-[10px] text-center text-ink-3">
                    Admin will review and confirm your payment before shipping.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

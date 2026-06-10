"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BRAND, FONTS } from "@/lib/constants";
import { Package, MapPin, User, LogOut, ChevronRight, Clock, CheckCircle, Truck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

const STATUS_CONFIG = {
  pending:    { icon: Clock,         color: "#8A8580", label: "Pending",    bg: "rgba(138,133,128,0.12)" },
  paid:       { icon: CheckCircle,   color: "#5BB8B4", label: "Paid",       bg: "rgba(91,184,180,0.12)" },
  processing: { icon: Clock,         color: "#D97706", label: "Processing", bg: "rgba(217,119,6,0.12)" },
  shipped:    { icon: Truck,         color: "#3B82F6", label: "Shipped",    bg: "rgba(59,130,246,0.12)" },
  delivered:  { icon: CheckCircle,   color: "#10B981", label: "Delivered",  bg: "rgba(16,185,129,0.12)" },
  cancelled:  { icon: Clock,         color: "#D94F3D", label: "Cancelled",  bg: "rgba(217,79,61,0.12)" },
} as const;

type OrderItem = { product_name: string; size: string; quantity: number; unit_price: number };
type Order = { id: string; order_number: string; created_at: string; status: string; total: number; tracking_number?: string; order_items: OrderItem[] };
type Tab = "orders" | "addresses" | "profile";

export default function AccountPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("orders");
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/login"); return; }
      setUser(user);
      supabase
        .from("orders")
        .select("id, order_number, created_at, status, total, tracking_number, order_items(product_name, size, quantity, unit_price)")
        .eq("customer_email", user.email)
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          setOrders((data as Order[]) ?? []);
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

  if (!user) return null;

  const displayName = user.user_metadata?.full_name || user.email?.split("@")[0] || "User";

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
              {[
                { id: "orders" as Tab, icon: Package, label: "My Orders" },
                { id: "addresses" as Tab, icon: MapPin, label: "Saved Addresses" },
                { id: "profile" as Tab, icon: User, label: "Profile Settings" },
              ].map(item => {
                const Icon = item.icon;
                return (
                  <button key={item.id} onClick={() => setTab(item.id)}
                    className="w-full flex items-center justify-between px-4 py-4 text-sm font-semibold transition-colors"
                    style={{
                      borderBottom: `1px solid ${BRAND.border}`,
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
                  const cfg = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending;
                  const Icon = cfg.icon;
                  const date = new Date(order.created_at).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
                  const STEPS = [
                    { key: "pending",    label: "Placed" },
                    { key: "paid",       label: "Confirmed" },
                    { key: "processing", label: "Processing" },
                    { key: "shipped",    label: "Shipped" },
                    { key: "delivered",  label: "Delivered" },
                  ];
                  const activeIdx = STEPS.findIndex(s => s.key === order.status);
                  return (
                    <div key={order.id} className="p-5 rounded-xl"
                      style={{ background: BRAND.card, border: `1px solid ${BRAND.cardBorder}` }}>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="font-bold text-sm" style={{ color: BRAND.black }}>{order.order_number}</p>
                          <p className="text-xs" style={{ color: BRAND.muted }}>{date}</p>
                        </div>
                        <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full"
                          style={{ background: cfg.bg, color: cfg.color }}>
                          <Icon className="w-3 h-3" />
                          {cfg.label}
                        </span>
                      </div>

                      {/* Status timeline */}
                      {order.status !== "cancelled" && (
                        <div className="flex items-center mb-5 overflow-x-auto pb-1 gap-0">
                          {STEPS.map((step, i) => {
                            const done = activeIdx >= i;
                            const active = activeIdx === i;
                            return (
                              <div key={step.key} className="flex items-center flex-1 min-w-0">
                                <div className="flex flex-col items-center flex-1">
                                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black mb-1 shrink-0"
                                    style={{
                                      background: active ? BRAND.teal : done ? `${BRAND.teal}60` : BRAND.border,
                                      color: done ? "#fff" : BRAND.mutedLight,
                                    }}>
                                    {done && !active ? "✓" : i + 1}
                                  </div>
                                  <p className="text-[9px] font-bold text-center whitespace-nowrap"
                                    style={{ color: done ? BRAND.teal : BRAND.mutedLight }}>
                                    {step.label}
                                  </p>
                                </div>
                                {i < STEPS.length - 1 && (
                                  <div className="h-0.5 flex-1 mx-0.5 mb-4 shrink-0"
                                    style={{ background: activeIdx > i ? BRAND.teal : BRAND.border }} />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {order.order_items?.map((item, i) => (
                        <div key={i} className="flex items-center justify-between py-3"
                          style={{ borderTop: `1px solid ${BRAND.border}` }}>
                          <div>
                            <p className="text-sm font-semibold" style={{ color: BRAND.black }}>{item.product_name}</p>
                            <p className="text-xs" style={{ color: BRAND.muted }}>Size: {item.size} · Qty: {item.quantity}</p>
                          </div>
                          <p className="font-bold text-sm" style={{ color: BRAND.black }}>&#8369;{(item.unit_price * item.quantity).toLocaleString()}</p>
                        </div>
                      ))}
                      <div className="pt-3" style={{ borderTop: `1px solid ${BRAND.border}` }}>
                        <p className="text-sm font-bold mb-1" style={{ color: BRAND.black }}>
                          Total: &#8369;{order.total.toLocaleString()}
                        </p>
                        {order.tracking_number && (
                          <p className="text-xs font-semibold mt-1" style={{ color: BRAND.teal }}>
                            Tracking #: {order.tracking_number}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Addresses tab */}
            {tab === "addresses" && (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-black text-lg" style={{ color: BRAND.black }}>Saved Addresses</h2>
                </div>
                <div className="py-12 text-center">
                  <p className="text-sm" style={{ color: BRAND.muted }}>Addresses are saved automatically from your checkout details.</p>
                </div>
              </div>
            )}

            {/* Profile tab */}
            {tab === "profile" && (
              <div>
                <h2 className="font-black text-lg mb-5" style={{ color: BRAND.black }}>Profile Settings</h2>
                <div className="p-6 rounded-xl" style={{ background: BRAND.card, border: `1px solid ${BRAND.cardBorder}` }}>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>Full Name</label>
                      <input defaultValue={user.user_metadata?.full_name || ""}
                        className="w-full px-4 py-3 text-sm focus:outline-none"
                        style={{ background: BRAND.bg, border: `1px solid ${BRAND.border}`, color: BRAND.black }} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>Email</label>
                      <input defaultValue={user.email || ""} disabled
                        className="w-full px-4 py-3 text-sm"
                        style={{ background: BRAND.border, border: `1px solid ${BRAND.border}`, color: BRAND.muted, cursor: "not-allowed" }} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>Mobile</label>
                      <input defaultValue={user.user_metadata?.mobile || ""}
                        className="w-full px-4 py-3 text-sm focus:outline-none"
                        style={{ background: BRAND.bg, border: `1px solid ${BRAND.border}`, color: BRAND.black }} />
                    </div>
                  </div>
                  <p className="text-xs mt-4" style={{ color: BRAND.mutedLight }}>
                    Logged in as <strong>{displayName}</strong>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

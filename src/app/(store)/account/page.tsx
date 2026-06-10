"use client";

import { useState } from "react";
import { BRAND, FONTS } from "@/lib/constants";
import { Package, MapPin, User, LogOut, ChevronRight, Clock, CheckCircle, Truck } from "lucide-react";

const MOCK_ORDERS = [
  { id: "SND-20250601", date: "June 1, 2025", status: "delivered", items: [{ name: "Nike Air Force 1 '07 White", size: "US 9", qty: 1, price: 5995 }], total: 6145 },
  { id: "SND-20250520", date: "May 20, 2025", status: "shipped", items: [{ name: "Jordan 4 Retro Black Cat", size: "US 8.5", qty: 1, price: 12495 }], total: 12645 },
  { id: "SND-20250510", date: "May 10, 2025", status: "processing", items: [{ name: "Nike Dunk Low Panda", size: "US 9", qty: 1, price: 8995 }], total: 9145 },
];

const STATUS_CONFIG = {
  pending:    { icon: Clock, color: "#8A8580", label: "Pending", bg: "rgba(138,133,128,0.12)" },
  paid:       { icon: CheckCircle, color: "#5BB8B4", label: "Paid", bg: "rgba(91,184,180,0.12)" },
  processing: { icon: Clock, color: "#D97706", label: "Processing", bg: "rgba(217,119,6,0.12)" },
  shipped:    { icon: Truck, color: "#3B82F6", label: "Shipped", bg: "rgba(59,130,246,0.12)" },
  delivered:  { icon: CheckCircle, color: "#10B981", label: "Delivered", bg: "rgba(16,185,129,0.12)" },
  cancelled:  { icon: Clock, color: "#D94F3D", label: "Cancelled", bg: "rgba(217,79,61,0.12)" },
} as const;

type Tab = "orders" | "addresses" | "profile";

export default function AccountPage() {
  const [tab, setTab] = useState<Tab>("orders");
  const [loggedIn] = useState(true);

  if (!loggedIn) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4"
        style={{ background: BRAND.bg, fontFamily: FONTS.body }}>
        <h2 style={{ fontFamily: FONTS.display, fontSize: "2.5rem", color: BRAND.black }}>MY ACCOUNT</h2>
        <p className="text-sm mb-6 mt-2" style={{ color: BRAND.muted }}>Sign in to view your orders and manage your profile.</p>
        <a href="/login" className="px-8 py-4 font-bold text-sm uppercase tracking-widest"
          style={{ background: BRAND.black, color: BRAND.bg }}>Sign In</a>
      </div>
    );
  }

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
          <button className="flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-60"
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
            {tab === "orders" && (
              <div className="space-y-4">
                <h2 className="font-black text-lg mb-4" style={{ color: BRAND.black }}>Order History</h2>
                {MOCK_ORDERS.map(order => {
                  const cfg = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG];
                  const Icon = cfg.icon;
                  return (
                    <div key={order.id} className="p-5 rounded-xl"
                      style={{ background: BRAND.card, border: `1px solid ${BRAND.cardBorder}` }}>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="font-bold text-sm" style={{ color: BRAND.black }}>{order.id}</p>
                          <p className="text-xs" style={{ color: BRAND.muted }}>{order.date}</p>
                        </div>
                        <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full"
                          style={{ background: cfg.bg, color: cfg.color }}>
                          <Icon className="w-3 h-3" />
                          {cfg.label}
                        </span>
                      </div>
                      {order.items.map(item => (
                        <div key={item.name} className="flex items-center justify-between py-3"
                          style={{ borderTop: `1px solid ${BRAND.border}` }}>
                          <div>
                            <p className="text-sm font-semibold" style={{ color: BRAND.black }}>{item.name}</p>
                            <p className="text-xs" style={{ color: BRAND.muted }}>Size: {item.size} · Qty: {item.qty}</p>
                          </div>
                          <p className="font-bold text-sm" style={{ color: BRAND.black }}>₱{item.price.toLocaleString()}</p>
                        </div>
                      ))}
                      <div className="flex items-center justify-between pt-3" style={{ borderTop: `1px solid ${BRAND.border}` }}>
                        <p className="text-sm font-bold" style={{ color: BRAND.black }}>
                          Total: ₱{order.total.toLocaleString()}
                        </p>
                        {order.status === "shipped" && (
                          <button className="text-xs font-bold px-4 py-2 uppercase tracking-wide"
                            style={{ background: `${BRAND.teal}15`, color: BRAND.teal }}>
                            Track Package
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {tab === "addresses" && (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-black text-lg" style={{ color: BRAND.black }}>Saved Addresses</h2>
                  <button className="text-sm font-bold px-4 py-2 uppercase tracking-wide"
                    style={{ background: BRAND.teal, color: "#fff" }}>+ Add New</button>
                </div>
                <div className="p-5 rounded-xl" style={{ background: BRAND.card, border: `1px solid ${BRAND.cardBorder}` }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-sm" style={{ color: BRAND.black }}>Juan Dela Cruz</p>
                        <span className="text-[10px] font-bold px-2 py-0.5"
                          style={{ background: `${BRAND.teal}15`, color: BRAND.teal }}>Default</span>
                      </div>
                      <p className="text-sm" style={{ color: BRAND.muted }}>09XX XXX XXXX</p>
                      <p className="text-sm" style={{ color: BRAND.muted }}>123 Rizal St., Brgy. San Antonio, Taguig, Metro Manila 1630</p>
                    </div>
                    <button className="text-xs font-bold" style={{ color: BRAND.teal }}>Edit</button>
                  </div>
                </div>
              </div>
            )}

            {tab === "profile" && (
              <div>
                <h2 className="font-black text-lg mb-5" style={{ color: BRAND.black }}>Profile Settings</h2>
                <div className="p-6 rounded-xl" style={{ background: BRAND.card, border: `1px solid ${BRAND.cardBorder}` }}>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {[
                      { label: "Full Name", value: "Juan Dela Cruz" },
                      { label: "Email", value: "juan@email.com" },
                      { label: "Mobile", value: "09XX XXX XXXX" },
                    ].map(f => (
                      <div key={f.label}>
                        <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>
                          {f.label}
                        </label>
                        <input defaultValue={f.value}
                          className="w-full px-4 py-3 text-sm focus:outline-none"
                          style={{ background: BRAND.bg, border: `1px solid ${BRAND.border}`, color: BRAND.black }} />
                      </div>
                    ))}
                  </div>
                  <button className="mt-5 px-8 py-3 font-bold text-sm uppercase tracking-widest transition-opacity hover:opacity-80"
                    style={{ background: BRAND.black, color: BRAND.bg }}>
                    Save Changes
                  </button>
                </div>

                {/* Change password */}
                <div className="mt-4 p-6 rounded-xl" style={{ background: BRAND.card, border: `1px solid ${BRAND.cardBorder}` }}>
                  <h3 className="font-bold mb-4" style={{ color: BRAND.black }}>Change Password</h3>
                  <div className="space-y-3">
                    {["Current Password", "New Password", "Confirm New Password"].map(l => (
                      <input key={l} type="password" placeholder={l}
                        className="w-full px-4 py-3 text-sm focus:outline-none"
                        style={{ background: BRAND.bg, border: `1px solid ${BRAND.border}`, color: BRAND.black }} />
                    ))}
                  </div>
                  <button className="mt-4 px-8 py-3 font-bold text-sm uppercase tracking-widest"
                    style={{ background: BRAND.teal, color: "#fff" }}>
                    Update Password
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

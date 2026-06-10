"use client";

import { useState } from "react";
import { BRAND, FONTS } from "@/lib/constants";
import { Save } from "lucide-react";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
      <div className="px-6 py-4" style={{ borderBottom: `1px solid ${BRAND.border}` }}>
        <h2 className="font-black text-sm uppercase tracking-widest" style={{ color: BRAND.black }}>{title}</h2>
      </div>
      <div className="p-6 space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, defaultValue, type = "text", hint }: { label: string; defaultValue?: string; type?: string; hint?: string }) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>{label}</label>
      <input type={type} defaultValue={defaultValue}
        className="w-full px-4 py-3 text-sm focus:outline-none"
        style={{ background: BRAND.bg, border: `1px solid ${BRAND.border}`, color: BRAND.black }} />
      {hint && <p className="text-xs mt-1" style={{ color: BRAND.muted }}>{hint}</p>}
    </div>
  );
}

export default function AdminSettingsPage() {
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div style={{ fontFamily: FONTS.body }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: BRAND.teal }}>Configuration</p>
          <h1 style={{ fontFamily: FONTS.display, fontSize: "2.5rem", letterSpacing: "0.04em", color: BRAND.black }}>SETTINGS</h1>
        </div>
        <button onClick={handleSave}
          className="flex items-center gap-2 px-5 py-3 font-bold text-sm uppercase tracking-wide transition-opacity hover:opacity-80"
          style={{ background: saved ? "#10B981" : BRAND.black, color: BRAND.bg }}>
          <Save className="w-4 h-4" />
          {saved ? "Saved!" : "Save Changes"}
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <Section title="Store Information">
          <Field label="Store Name" defaultValue="Sneak N' Drip" />
          <Field label="Store Email" defaultValue="hello@sneakndrip.ph" type="email" />
          <Field label="Contact Number" defaultValue="+63 917 123 4567" />
          <Field label="Address" defaultValue="Taguig, Metro Manila, Philippines" />
          <Field label="Facebook Page URL" defaultValue="https://facebook.com/sneakndrip" />
          <Field label="Instagram Handle" defaultValue="@sneakndrip" />
          <Field label="TikTok Handle" defaultValue="@sneakndrip" />
        </Section>

        <Section title="Shipping & Fees">
          <Field label="Metro Manila Shipping Fee (₱)" defaultValue="150" type="number" />
          <Field label="Provincial Shipping Fee (₱)" defaultValue="250" type="number" />
          <Field label="Free Shipping Threshold (₱)" defaultValue="3000" type="number"
            hint="Orders above this amount get free shipping" />
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>
              COD Areas
            </label>
            <textarea rows={3} defaultValue="Metro Manila, Cebu City, Davao City"
              className="w-full px-4 py-3 text-sm focus:outline-none resize-none"
              style={{ background: BRAND.bg, border: `1px solid ${BRAND.border}`, color: BRAND.black }} />
            <p className="text-xs mt-1" style={{ color: BRAND.muted }}>Comma-separated cities/regions where COD is available</p>
          </div>
        </Section>

        <Section title="Payment Methods">
          {[
            { label: "GCash Number", defaultValue: "0917 123 4567" },
            { label: "GCash Account Name", defaultValue: "Sneak N Drip" },
            { label: "Maya Number", defaultValue: "0917 123 4567" },
            { label: "Maya Account Name", defaultValue: "Sneak N Drip" },
            { label: "Bank Name", defaultValue: "BDO Unibank" },
            { label: "Bank Account Name", defaultValue: "Sneak N Drip Enterprises" },
            { label: "Bank Account Number", defaultValue: "0094-1234-5678" },
          ].map(f => <Field key={f.label} {...f} />)}
        </Section>

        <Section title="Pre-Order Settings">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>Default Pre-Order Message</label>
            <textarea rows={3}
              defaultValue="Your order will be reserved upon payment of downpayment. Balance is due before release."
              className="w-full px-4 py-3 text-sm focus:outline-none resize-none"
              style={{ background: BRAND.bg, border: `1px solid ${BRAND.border}`, color: BRAND.black }} />
          </div>
          <Field label="Messenger Chat Plugin Page ID" defaultValue="123456789012345"
            hint="Get this from Facebook Page Settings > Messaging" />
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide mb-3" style={{ color: BRAND.black }}>Active Payment Methods</label>
            <div className="space-y-2">
              {["GCash", "Maya", "Bank Transfer", "Cash on Delivery"].map(p => (
                <label key={p} className="flex items-center justify-between cursor-pointer py-2 px-3 rounded-lg"
                  style={{ background: BRAND.bg }}>
                  <span className="text-sm font-medium" style={{ color: BRAND.black }}>{p}</span>
                  <input type="checkbox" defaultChecked className="w-4 h-4" style={{ accentColor: BRAND.teal }} />
                </label>
              ))}
            </div>
          </div>
        </Section>

        <Section title="SEO & Meta">
          <Field label="Meta Title" defaultValue="Sneak N' Drip | Authentic Sneakers Philippines" />
          <Field label="Meta Description" defaultValue="Shop authentic sneakers in the Philippines. On Hand & Pre-Order. Best prices, 100% legit." />
          <Field label="Google Analytics ID" defaultValue="" hint="e.g. G-XXXXXXXXXX" />
          <Field label="Facebook Pixel ID" defaultValue="" />
        </Section>

        <Section title="Admin Access">
          <Field label="Admin Email" defaultValue="admin@sneakndrip.ph" type="email" />
          <Field label="New Password" type="password" hint="Leave blank to keep current password" />
          <Field label="Confirm New Password" type="password" />
        </Section>
      </div>
    </div>
  );
}

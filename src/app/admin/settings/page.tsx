"use client";

import { useState, useEffect, useRef } from "react";
import { BRAND, FONTS } from "@/lib/constants";
import { Save, ToggleLeft, ToggleRight } from "lucide-react";

type SettingsData = Record<string, string>;

const DEFAULTS: SettingsData = {
  store_name: "Sneak N' Drip",
  store_email: "hello@sneakndrip.ph",
  contact_number: "+63 961 177 4119",
  address: "Taguig, Metro Manila, Philippines",
  facebook_url: "https://www.facebook.com/SneakNDrip/",
  instagram_handle: "@sneakndripph",
  tiktok_handle: "@sneakyjuls",
  metro_shipping_fee: "150",
  provincial_shipping_fee: "250",
  free_shipping_threshold: "3000",
  cod_areas: "Metro Manila, Cebu City, Davao City",
  gcash_number: "0961 177 4119",
  gcash_name: "Lorenzo Agalo P. Julio",
  maya_number: "0961 177 4119",
  maya_name: "Lorenzo Agalo P. Julio",
  bank1_name: "Maribank",
  bank1_account_number: "14156569205",
  bank1_account_name: "Lorenzo Agalo P. Julio",
  bank2_name: "BPI",
  bank2_account_number: "0596199188",
  bank2_account_name: "Lorenzo Agalo P. Julio",
  announcement_text: "",
  hero_badge: "New Drops Every Week",
  hero_line1: "STEP INTO",
  hero_line2: "YOUR NEXT",
  hero_line3: "PAIR",
  hero_subtitle: "100% Authentic Sneakers · On Hand & Pre-Order\nShips Philippines-wide. GCash, Maya, Bank Transfer & COD accepted.",
  hero_cta_primary: "Shop Now",
  hero_cta_secondary: "Pre-Orders",
  preorder_message: "Your order will be reserved upon payment of downpayment. Balance is due before release.",
  meta_title: "Sneak N' Drip | Authentic Sneakers Philippines",
  meta_description: "Shop authentic sneakers in the Philippines. On Hand & Pre-Order. Best prices, 100% legit.",
  google_analytics_id: "",
  cod_enabled: "true",
};

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

function Field({ label, settingsKey, settings, onChange, type = "text", hint, multiline }: {
  label: string; settingsKey: string; settings: SettingsData; onChange: (key: string, val: string) => void;
  type?: string; hint?: string; multiline?: boolean;
}) {
  const value = settings[settingsKey] ?? DEFAULTS[settingsKey] ?? "";
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>{label}</label>
      {multiline ? (
        <textarea rows={3} value={value} onChange={e => onChange(settingsKey, e.target.value)}
          className="w-full px-4 py-3 text-sm focus:outline-none resize-none"
          style={{ background: BRAND.bg, border: `1px solid ${BRAND.border}`, color: BRAND.black }} />
      ) : (
        <input type={type} value={value} onChange={e => onChange(settingsKey, e.target.value)}
          className="w-full px-4 py-3 text-sm focus:outline-none"
          style={{ background: BRAND.bg, border: `1px solid ${BRAND.border}`, color: BRAND.black }} />
      )}
      {hint && <p className="text-xs mt-1" style={{ color: BRAND.muted }}>{hint}</p>}
    </div>
  );
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SettingsData>(DEFAULTS);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetch("/api/admin/settings")
      .then(r => r.json())
      .then((data: SettingsData) => {
        if (data && Object.keys(data).length > 0) {
          setSettings(prev => ({ ...DEFAULTS, ...prev, ...data }));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function update(key: string, val: string) {
    setSettings(prev => ({ ...prev, [key]: val }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={{ fontFamily: FONTS.body }}>
        <h1 style={{ fontFamily: FONTS.display, fontSize: "2.5rem", letterSpacing: "0.04em", color: BRAND.black }}>SETTINGS</h1>
        <p className="mt-4 text-sm" style={{ color: BRAND.muted }}>Loading settings…</p>
      </div>
    );
  }

  const fp = (key: string) => ({ label: "", settingsKey: key, settings, onChange: update });

  return (
    <div style={{ fontFamily: FONTS.body }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: BRAND.teal }}>Configuration</p>
          <h1 style={{ fontFamily: FONTS.display, fontSize: "2.5rem", letterSpacing: "0.04em", color: BRAND.black }}>SETTINGS</h1>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-5 py-3 font-bold text-sm uppercase tracking-wide transition-opacity hover:opacity-80 disabled:opacity-60"
          style={{ background: saved ? "#10B981" : BRAND.black, color: BRAND.bg }}>
          <Save className="w-4 h-4" />
          {saving ? "Saving…" : saved ? "Saved!" : "Save Changes"}
        </button>
      </div>

      <div className="space-y-5 mb-5">
        <Section title="Announcement Bar">
          <Field label="Announcement Text" settingsKey="announcement_text" settings={settings} onChange={update}
            hint="Leave blank to use the auto-generated text (free shipping threshold, accepted payments)" />
        </Section>

        <Section title="Homepage Hero">
          <Field label="Badge Text" settingsKey="hero_badge" settings={settings} onChange={update}
            hint="Small pill above the headline (e.g. 'New Drops Every Week')" />
          <div className="grid sm:grid-cols-3 gap-4">
            <Field label="Headline Line 1" settingsKey="hero_line1" settings={settings} onChange={update} />
            <Field label="Headline Line 2 (teal)" settingsKey="hero_line2" settings={settings} onChange={update} />
            <Field label="Headline Line 3" settingsKey="hero_line3" settings={settings} onChange={update} />
          </div>
          <Field label="Subtitle" settingsKey="hero_subtitle" settings={settings} onChange={update} multiline
            hint="Shown below the headline. Use \\n for line breaks." />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Primary CTA Button" settingsKey="hero_cta_primary" settings={settings} onChange={update} />
            <Field label="Secondary CTA Button" settingsKey="hero_cta_secondary" settings={settings} onChange={update} />
          </div>
        </Section>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <Section title="Store Information">
          <Field label="Store Name"          settingsKey="store_name"     settings={settings} onChange={update} />
          <Field label="Store Email"         settingsKey="store_email"    settings={settings} onChange={update} type="email" />
          <Field label="Contact Number"      settingsKey="contact_number" settings={settings} onChange={update} />
          <Field label="Address"             settingsKey="address"        settings={settings} onChange={update} />
          <Field label="Facebook Page URL"   settingsKey="facebook_url"   settings={settings} onChange={update} />
          <Field label="Instagram Handle"    settingsKey="instagram_handle" settings={settings} onChange={update} />
          <Field label="TikTok Handle"       settingsKey="tiktok_handle"  settings={settings} onChange={update} />
        </Section>

        <Section title="Shipping & Fees">
          <Field label="Metro Manila Shipping Fee (&#8369;)" settingsKey="metro_shipping_fee"     settings={settings} onChange={update} type="number" />
          <Field label="Provincial Shipping Fee (&#8369;)"   settingsKey="provincial_shipping_fee" settings={settings} onChange={update} type="number" />
          <Field label="Free Shipping Threshold (&#8369;)"   settingsKey="free_shipping_threshold" settings={settings} onChange={update} type="number"
            hint="Orders above this amount get free shipping" />
          <Field label="COD Areas" settingsKey="cod_areas" settings={settings} onChange={update} multiline
            hint="Comma-separated cities/regions where COD is available" />
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide mb-2" style={{ color: BRAND.black }}>Cash on Delivery (COD)</label>
            <button type="button"
              onClick={() => update("cod_enabled", settings.cod_enabled === "false" ? "true" : "false")}
              className="flex items-center gap-3 transition-opacity hover:opacity-80">
              {settings.cod_enabled !== "false"
                ? <ToggleRight className="w-7 h-7" style={{ color: BRAND.teal }} />
                : <ToggleLeft className="w-7 h-7" style={{ color: BRAND.muted }} />}
              <span className="text-sm font-semibold" style={{ color: settings.cod_enabled !== "false" ? BRAND.teal : BRAND.muted }}>
                {settings.cod_enabled !== "false" ? "COD Enabled" : "COD Disabled"}
              </span>
            </button>
            <p className="text-xs mt-1" style={{ color: BRAND.muted }}>When disabled, COD will not appear at checkout</p>
          </div>
        </Section>

        <Section title="Payment — GCash &amp; Maya">
          <Field label="GCash Number"       settingsKey="gcash_number"  settings={settings} onChange={update} />
          <Field label="GCash Account Name" settingsKey="gcash_name"    settings={settings} onChange={update} />
          <Field label="Maya Number"        settingsKey="maya_number"   settings={settings} onChange={update} />
          <Field label="Maya Account Name"  settingsKey="maya_name"     settings={settings} onChange={update} />
        </Section>

        <Section title="Payment — Bank Transfer">
          <Field label="Bank 1 Name"           settingsKey="bank1_name"           settings={settings} onChange={update} />
          <Field label="Bank 1 Account Number" settingsKey="bank1_account_number" settings={settings} onChange={update} />
          <Field label="Bank 1 Account Name"   settingsKey="bank1_account_name"   settings={settings} onChange={update} />
          <Field label="Bank 2 Name"           settingsKey="bank2_name"           settings={settings} onChange={update} />
          <Field label="Bank 2 Account Number" settingsKey="bank2_account_number" settings={settings} onChange={update} />
          <Field label="Bank 2 Account Name"   settingsKey="bank2_account_name"   settings={settings} onChange={update} />
        </Section>

        <Section title="Pre-Order &amp; Misc">
          <Field label="Default Pre-Order Message" settingsKey="preorder_message" settings={settings} onChange={update} multiline />
        </Section>

        <Section title="SEO &amp; Meta">
          <Field label="Meta Title"         settingsKey="meta_title"         settings={settings} onChange={update} />
          <Field label="Meta Description"   settingsKey="meta_description"   settings={settings} onChange={update} multiline />
          <Field label="Google Analytics ID" settingsKey="google_analytics_id" settings={settings} onChange={update} hint="e.g. G-XXXXXXXXXX" />
        </Section>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { BRAND, FONTS } from "@/lib/constants";
import { Save, ToggleLeft, ToggleRight, Star, Bell, Monitor, MapPin, Truck, CreditCard, Clock, Search, Check } from "lucide-react";

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
  promise_1_icon: "🔐", promise_1_title: "100% Authentic", promise_1_desc: "Every pair is verified authentic. Sourced directly from trusted local and international suppliers. No reps, no fakes — ever.",
  promise_2_icon: "✅", promise_2_title: "Verified Supplier", promise_2_desc: "We work only with verified and trusted sneaker suppliers. Our reputation is built on authenticity.",
  promise_3_icon: "🛡️", promise_3_title: "Secure Checkout", promise_3_desc: "GCash, Maya, Bank Transfer, and Cash on Delivery. All payments are safe, fast, and easy.",
  promise_4_icon: "📦", promise_4_title: "Fast Shipping", promise_4_desc: "Metro Manila: 1–3 days. Provincial: 3–7 days. All orders come with tracking.",
  promise_5_icon: "📅", promise_5_title: "Pre-Order ETA", promise_5_desc: "Every pre-order comes with a firm ETA. We update you every step of the way.",
  promise_6_icon: "💬", promise_6_title: "24/7 Support", promise_6_desc: "Message us on Facebook or Instagram anytime. Real, fast, friendly replies — always.",
  preorder_message: "Your order will be reserved upon payment of downpayment. Balance is due before release.",
  new_arrivals_days: "14",
  meta_title: "Sneak N' Drip | Authentic Sneakers Philippines",
  meta_description: "Shop authentic sneakers in the Philippines. On Hand & Pre-Order. Best prices, 100% legit.",
  google_analytics_id: "",
  cod_enabled: "true",
};

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

const SECTIONS = [
  { id: "why-shop",      title: "Why Shop With Us",  icon: Star },
  { id: "announcement",  title: "Announcement Bar",  icon: Bell },
  { id: "hero",          title: "Homepage Hero",     icon: Monitor },
  { id: "store-info",    title: "Store Information", icon: MapPin },
  { id: "shipping",      title: "Shipping & Fees",   icon: Truck },
  { id: "gcash-maya",    title: "GCash & Maya",      icon: CreditCard },
  { id: "bank-transfer", title: "Bank Transfer",     icon: CreditCard },
  { id: "preorder",      title: "Pre-Order & Misc",  icon: Clock },
  { id: "seo",           title: "SEO & Meta",        icon: Search },
];

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SettingsData>(DEFAULTS);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);
  const [activeSection, setActiveSection] = useState("why-shop");

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

  const active = SECTIONS.find(s => s.id === activeSection)!;

  return (
    <div style={{ fontFamily: FONTS.body }}>
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: BRAND.teal }}>Configuration</p>
        <h1 style={{ fontFamily: FONTS.display, fontSize: "2.5rem", letterSpacing: "0.04em", color: BRAND.black }}>SETTINGS</h1>
        <p className="text-sm mt-1" style={{ color: BRAND.muted }}>Manage your store configuration and content.</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Section list — matches /pages sidebar exactly */}
        <div className="lg:col-span-1">
          <div className="rounded-xl overflow-hidden" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            {SECTIONS.map((s, i) => {
              const Icon = s.icon;
              return (
                <button key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left text-sm transition-colors"
                  style={{
                    borderBottom: i < SECTIONS.length - 1 ? `1px solid ${BRAND.border}` : "none",
                    background: activeSection === s.id ? `${BRAND.teal}10` : "transparent",
                    color: activeSection === s.id ? BRAND.teal : BRAND.black,
                    borderLeft: activeSection === s.id ? `3px solid ${BRAND.teal}` : "3px solid transparent",
                    fontWeight: activeSection === s.id ? 600 : 400,
                  }}>
                  <Icon className="w-3.5 h-3.5 shrink-0 opacity-50" />
                  <span className="truncate text-xs">{s.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content panel — matches /pages editor panel */}
        <div className="lg:col-span-3">
          <div className="rounded-xl overflow-hidden" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            {/* Toolbar / header */}
            <div className="px-5 py-3 flex items-center justify-between gap-3"
              style={{ borderBottom: `1px solid ${BRAND.border}`, background: BRAND.bg }}>
              <div className="flex items-center gap-2">
                <active.icon className="w-3.5 h-3.5 opacity-50" style={{ color: BRAND.black }} />
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: BRAND.black }}>{active.title}</span>
              </div>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-all disabled:opacity-50"
                style={{ background: saved ? "#10B981" : BRAND.teal, color: "#fff" }}>
                {saved ? <Check className="w-3 h-3" /> : <Save className="w-3 h-3" />}
                {saving ? "Saving…" : saved ? "Saved!" : "Save"}
              </button>
            </div>

            {/* Section content */}
            <div className="p-6 space-y-4">

              {activeSection === "why-shop" && (
                <>
                  <p className="text-xs" style={{ color: BRAND.muted }}>Displayed on the homepage. Edit the 6 promise cards shown to customers.</p>
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5, 6].map(n => (
                      <div key={n} className="p-4 rounded-lg space-y-3" style={{ background: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                        <p className="text-xs font-black uppercase tracking-wide" style={{ color: BRAND.muted }}>Card {n}</p>
                        <div className="grid sm:grid-cols-3 gap-3">
                          <Field label={`Icon ${n}`} settingsKey={`promise_${n}_icon`} settings={settings} onChange={update} />
                          <Field label={`Title ${n}`} settingsKey={`promise_${n}_title`} settings={settings} onChange={update} />
                          <Field label={`Description ${n}`} settingsKey={`promise_${n}_desc`} settings={settings} onChange={update} />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {activeSection === "announcement" && (
                <Field label="Announcement Text" settingsKey="announcement_text" settings={settings} onChange={update}
                  hint="Leave blank to hide the bar. Enter text to show it (e.g. 'Free shipping on all orders this weekend!')" />
              )}

              {activeSection === "hero" && (
                <>
                  <Field label="Badge Text" settingsKey="hero_badge" settings={settings} onChange={update}
                    hint="Small pill above the headline (e.g. 'New Drops Every Week')" />
                  <div className="grid sm:grid-cols-3 gap-4">
                    <Field label="Headline Line 1" settingsKey="hero_line1" settings={settings} onChange={update} />
                    <Field label="Headline Line 2 (teal)" settingsKey="hero_line2" settings={settings} onChange={update} />
                    <Field label="Headline Line 3" settingsKey="hero_line3" settings={settings} onChange={update} />
                  </div>
                  <Field label="Subtitle" settingsKey="hero_subtitle" settings={settings} onChange={update} multiline
                    hint="Shown below the headline. Use \n for line breaks." />
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Primary CTA Button" settingsKey="hero_cta_primary" settings={settings} onChange={update} />
                    <Field label="Secondary CTA Button" settingsKey="hero_cta_secondary" settings={settings} onChange={update} />
                  </div>
                </>
              )}

              {activeSection === "store-info" && (
                <>
                  <Field label="Store Name"        settingsKey="store_name"       settings={settings} onChange={update} />
                  <Field label="Store Email"        settingsKey="store_email"      settings={settings} onChange={update} type="email" />
                  <Field label="Contact Number"     settingsKey="contact_number"   settings={settings} onChange={update} />
                  <Field label="Address"            settingsKey="address"          settings={settings} onChange={update} />
                  <Field label="Facebook Page URL"  settingsKey="facebook_url"     settings={settings} onChange={update} />
                  <Field label="Instagram Handle"   settingsKey="instagram_handle" settings={settings} onChange={update} />
                  <Field label="TikTok Handle"      settingsKey="tiktok_handle"    settings={settings} onChange={update} />
                </>
              )}

              {activeSection === "shipping" && (
                <>
                  <Field label="Metro Manila Shipping Fee (₱)" settingsKey="metro_shipping_fee"      settings={settings} onChange={update} type="number" />
                  <Field label="Provincial Shipping Fee (₱)"   settingsKey="provincial_shipping_fee" settings={settings} onChange={update} type="number" />
                  <Field label="Free Shipping Threshold (₱)"   settingsKey="free_shipping_threshold" settings={settings} onChange={update} type="number"
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
                </>
              )}

              {activeSection === "gcash-maya" && (
                <>
                  <Field label="GCash Number"       settingsKey="gcash_number" settings={settings} onChange={update} />
                  <Field label="GCash Account Name" settingsKey="gcash_name"   settings={settings} onChange={update} />
                  <Field label="Maya Number"        settingsKey="maya_number"  settings={settings} onChange={update} />
                  <Field label="Maya Account Name"  settingsKey="maya_name"    settings={settings} onChange={update} />
                </>
              )}

              {activeSection === "bank-transfer" && (
                <>
                  <Field label="Bank 1 Name"           settingsKey="bank1_name"           settings={settings} onChange={update} />
                  <Field label="Bank 1 Account Number" settingsKey="bank1_account_number" settings={settings} onChange={update} />
                  <Field label="Bank 1 Account Name"   settingsKey="bank1_account_name"   settings={settings} onChange={update} />
                  <Field label="Bank 2 Name"           settingsKey="bank2_name"           settings={settings} onChange={update} />
                  <Field label="Bank 2 Account Number" settingsKey="bank2_account_number" settings={settings} onChange={update} />
                  <Field label="Bank 2 Account Name"   settingsKey="bank2_account_name"   settings={settings} onChange={update} />
                </>
              )}

              {activeSection === "preorder" && (
                <>
                  <Field label="Default Pre-Order Message" settingsKey="preorder_message" settings={settings} onChange={update} multiline />
                  <Field label="New Arrivals Window (days)" settingsKey="new_arrivals_days" settings={settings} onChange={update} type="number" hint="Products added within this many days show as 'New' on the homepage and shop. Default: 14 days." />
                </>
              )}

              {activeSection === "seo" && (
                <>
                  <Field label="Meta Title"          settingsKey="meta_title"          settings={settings} onChange={update} />
                  <Field label="Meta Description"    settingsKey="meta_description"    settings={settings} onChange={update} multiline />
                  <Field label="Google Analytics ID" settingsKey="google_analytics_id" settings={settings} onChange={update} hint="e.g. G-XXXXXXXXXX" />
                </>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

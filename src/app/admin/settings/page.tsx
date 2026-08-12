"use client";

import { useState, useEffect, useRef } from "react";
import { Save, ToggleLeft, ToggleRight, Bell, Monitor, MapPin, Truck, CreditCard, Clock, Search, Check, MessageCircle } from "lucide-react";
import toast from "react-hot-toast";
import QRUploadField from "@/components/admin/QRUploadField";

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
  gcash_qr_url: "",
  maya_number: "0961 177 4119",
  maya_name: "Lorenzo Agalo P. Julio",
  maya_qr_url: "",
  bank1_name: "Maribank",
  bank1_account_number: "14156569205",
  bank1_account_name: "Lorenzo Agalo P. Julio",
  bank2_name: "BPI",
  bank2_account_number: "0596199188",
  bank2_account_name: "Lorenzo Agalo P. Julio",
  bank1_qr_url: "",
  bank2_qr_url: "",
  announcement_text: "",
  hero_badge: "New Drops Every Week",
  hero_line1: "STEP INTO",
  hero_line2: "YOUR NEXT",
  hero_line3: "PAIR",
  hero_subtitle: "100% Authentic Sneakers · On Hand & Pre-Order\nShips Philippines-wide. GCash, Maya, Bank Transfer & COD accepted.",
  hero_cta_primary: "Shop Now",
  hero_cta_secondary: "Pre-Orders",
  preorder_message: "Your order will be reserved upon payment of downpayment. Balance is due before release.",
  new_arrivals_days: "14",
  meta_title: "Sneak N' Drip | Authentic Sneakers Philippines",
  meta_description: "Shop authentic sneakers in the Philippines. On Hand & Pre-Order. Best prices, 100% legit.",
  google_analytics_id: "",
  cod_enabled: "true",
  maintenance_mode: "false",
  chat_widget_enabled: "true",
};

function Field({ label, settingsKey, settings, onChange, type = "text", hint, multiline, placeholder }: {
  label: string; settingsKey: string; settings: SettingsData; onChange: (key: string, val: string) => void;
  type?: string; hint?: string; multiline?: boolean; placeholder?: string;
}) {
  const value = settings[settingsKey] ?? DEFAULTS[settingsKey] ?? "";
  return (
    <div>
      <label className="block text-admin-eyebrow text-ink-3 mb-1.5">{label}</label>
      {multiline ? (
        <textarea rows={3} value={value} onChange={e => onChange(settingsKey, e.target.value)}
          placeholder={placeholder}
          className="w-full bg-paper-2 border-0 rounded-md px-3 py-2 text-admin text-ink placeholder:text-ink-3 focus:outline-none focus:ring-1 focus:ring-line-strong resize-none" />
      ) : (
        <input type={type} value={value} onChange={e => onChange(settingsKey, e.target.value)}
          placeholder={placeholder}
          className="w-full bg-paper-2 border-0 rounded-md px-3 py-2 text-admin text-ink placeholder:text-ink-3 focus:outline-none focus:ring-1 focus:ring-line-strong" />
      )}
      {hint && <p className="text-admin-micro text-ink-3 mt-1">{hint}</p>}
    </div>
  );
}

const SECTIONS = [
  { id: "maintenance",   title: "Maintenance Mode",  icon: ToggleLeft },
  { id: "chat-support",  title: "Support Chat",      icon: MessageCircle },
  { id: "announcement",  title: "Announcement Bar",  icon: Bell },
  { id: "hero",          title: "Homepage Hero",     icon: Monitor },
  { id: "store-info",    title: "Store Information", icon: MapPin },
  { id: "shipping",      title: "Shipping & Fees",   icon: Truck },
  { id: "payments",      title: "Payment Methods",   icon: CreditCard },
  { id: "preorder",      title: "Pre-Order & Misc",  icon: Clock },
  { id: "seo",           title: "SEO & Meta",        icon: Search },
];

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SettingsData>(DEFAULTS);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);
  const [activeSection, setActiveSection] = useState("maintenance");

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

  async function toggleChatWidget() {
    const prevVal = settings.chat_widget_enabled;
    const newVal = prevVal === "false" ? "true" : "false";
    setSettings(prev => ({ ...prev, chat_widget_enabled: newVal }));
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_widget_enabled: newVal }),
    });
    if (!res.ok) {
      setSettings(prev => ({ ...prev, chat_widget_enabled: prevVal }));
      toast.error("Couldn't update support chat setting. Try again.");
      return;
    }
    toast.success(newVal === "true" ? "Support chat enabled" : "Support chat disabled");
  }

  async function toggleMaintenance() {
    const prevVal = settings.maintenance_mode;
    const newVal = prevVal === "true" ? "false" : "true";
    setSettings(prev => ({ ...prev, maintenance_mode: newVal }));
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ maintenance_mode: newVal }),
    });
    if (!res.ok) {
      setSettings(prev => ({ ...prev, maintenance_mode: prevVal }));
      toast.error("Couldn't update maintenance mode. Try again.");
      return;
    }
    toast.success(newVal === "true" ? "Maintenance mode ON" : "Maintenance mode OFF");
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
        toast.success("Settings saved");
      } else {
        toast.error("Couldn't save settings. Try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-admin-hero text-ink font-display font-medium tracking-[-0.02em]">Settings</h1>
        <p className="mt-4 text-admin-sm text-ink-3">Loading settings…</p>
      </div>
    );
  }

  const active = SECTIONS.find(s => s.id === activeSection)!;

  return (
    <div>
      <div className="mb-6">
        <p className="text-admin-eyebrow text-ink-3 mb-1">Configuration</p>
        <h1 className="text-admin-hero text-ink font-display font-medium tracking-[-0.02em]">Settings</h1>
        <p className="text-admin text-ink-3 mt-1">Manage your store configuration and content.</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Section list */}
        <div className="lg:col-span-1">
          <div className="bg-paper border border-line rounded-md overflow-hidden">
            {SECTIONS.map(s => {
              const Icon = s.icon;
              return (
                <button key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-left border-b border-line last:border-b-0 transition-colors duration-admin-fast ${
                    activeSection === s.id ? "bg-admin-row-hover border-l-2 border-l-ink text-ink font-medium" : "border-l-2 border-l-transparent text-ink-2 hover:bg-admin-row-hover"
                  }`}>
                  <Icon className="w-3.5 h-3.5 shrink-0 text-ink-3" />
                  <span className="truncate text-admin-sm">{s.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content panel */}
        <div className="lg:col-span-3">
          <div className="bg-paper border border-line rounded-md overflow-hidden">
            {/* Toolbar */}
            <div className="px-5 py-3 flex items-center justify-between gap-3 border-b border-line bg-paper-2">
              <div className="flex items-center gap-2">
                <active.icon className="w-3.5 h-3.5 text-ink-3" />
                <span className="text-admin-eyebrow text-ink-3">{active.title}</span>
              </div>
              <button onClick={handleSave} disabled={saving}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-admin-sm font-medium rounded-md transition-colors duration-admin-fast disabled:opacity-50 ${
                  saved ? "bg-state-onhand text-paper" : "bg-ink text-paper hover:opacity-90"
                }`}>
                {saved ? <Check className="w-3 h-3" /> : <Save className="w-3 h-3" />}
                {saving ? "Saving…" : saved ? "Saved!" : "Save"}
              </button>
            </div>

            {/* Section content */}
            <div className="p-6 space-y-4">

              {activeSection === "maintenance" && (
                <div className="space-y-5">
                  <div className="p-4 rounded-md bg-state-error/5 border border-state-error/20">
                    <p className="text-admin-sm font-semibold text-state-error mb-1">⚠ Warning</p>
                    <p className="text-admin-sm leading-relaxed text-ink-3">
                      When maintenance mode is ON, all store pages show a &quot;We&apos;ll be back soon&quot; message.
                      The admin panel stays accessible. Turn it OFF as soon as your updates are done.
                    </p>
                  </div>
                  <div className="flex items-center justify-between p-5 rounded-md bg-paper-2">
                    <div>
                      <p className="text-admin-sm font-semibold text-ink mb-0.5">Maintenance Mode</p>
                      <p className="text-admin-sm text-ink-3">
                        {settings.maintenance_mode === "true"
                          ? "OFFLINE — Site is currently DOWN for customers"
                          : "LIVE — Site is accessible to customers"}
                      </p>
                    </div>
                    <button type="button"
                      onClick={toggleMaintenance}
                      className={`flex items-center gap-2 px-4 py-2 text-admin-sm font-semibold rounded-md text-paper transition-opacity duration-admin-fast hover:opacity-90 ${
                        settings.maintenance_mode === "true" ? "bg-state-error" : "bg-ink"
                      }`}>
                      {settings.maintenance_mode === "true"
                        ? <><ToggleRight className="w-4 h-4" /> Turn OFF</>
                        : <><ToggleLeft className="w-4 h-4" /> Turn ON</>}
                    </button>
                  </div>
                  <p className="text-admin-sm text-ink-3">
                    The toggle saves instantly — no need to click Save.
                  </p>
                </div>
              )}

              {activeSection === "chat-support" && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between p-5 rounded-md bg-paper-2">
                    <div>
                      <p className="text-admin-sm font-semibold text-ink mb-0.5">Customer support chat</p>
                      <p className="text-admin-sm text-ink-3">
                        When off, the support chat bubble is hidden from all customers site-wide.
                      </p>
                    </div>
                    <button type="button"
                      onClick={toggleChatWidget}
                      className={`flex items-center gap-2 px-4 py-2 text-admin-sm font-semibold rounded-md text-paper shrink-0 transition-opacity duration-admin-fast hover:opacity-90 ${
                        settings.chat_widget_enabled === "false" ? "bg-ink-3" : "bg-ink"
                      }`}>
                      {settings.chat_widget_enabled === "false" ? (
                        <><ToggleLeft className="w-4 h-4" /> Turn ON</>
                      ) : (
                        <><ToggleRight className="w-4 h-4" /> Turn OFF</>
                      )}
                    </button>
                  </div>
                  <p className="text-admin-sm text-ink-3">
                    The toggle saves instantly — no need to click Save.
                  </p>
                </div>
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
                    <Field label="Headline Line 2 (accent)" settingsKey="hero_line2" settings={settings} onChange={update} />
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
                <div className="space-y-4">
                  <Field label="Store Name"        settingsKey="store_name"       settings={settings} onChange={update} />
                  <Field label="Store Email"        settingsKey="store_email"      settings={settings} onChange={update} type="email" />
                  <Field label="Contact Number"     settingsKey="contact_number"   settings={settings} onChange={update} />
                  <Field label="Address"            settingsKey="address"          settings={settings} onChange={update} />
                  <Field label="Facebook Page URL"  settingsKey="facebook_url"     settings={settings} onChange={update} />
                  <Field label="Instagram Handle"   settingsKey="instagram_handle" settings={settings} onChange={update} />
                  <Field label="TikTok Handle"      settingsKey="tiktok_handle"    settings={settings} onChange={update} />
                </div>
              )}

              {activeSection === "shipping" && (
                <div className="space-y-4">
                  <Field label="Metro Manila Shipping Fee (₱)" settingsKey="metro_shipping_fee"      settings={settings} onChange={update} type="number" />
                  <Field label="Provincial Shipping Fee (₱)"   settingsKey="provincial_shipping_fee" settings={settings} onChange={update} type="number" />
                  <Field label="Free Shipping Threshold (₱)"   settingsKey="free_shipping_threshold" settings={settings} onChange={update} type="number"
                    hint="Orders above this amount get free shipping" />
                  <Field label="COD Areas" settingsKey="cod_areas" settings={settings} onChange={update} multiline
                    hint="Comma-separated cities/regions where COD is available" />
                  <div>
                    <label className="block text-admin-eyebrow text-ink-3 mb-2">Cash on Delivery (COD)</label>
                    <button type="button"
                      onClick={() => update("cod_enabled", settings.cod_enabled === "false" ? "true" : "false")}
                      className="flex items-center gap-3 transition-opacity duration-admin-fast hover:opacity-80">
                      {settings.cod_enabled !== "false"
                        ? <ToggleRight className="w-6 h-6 text-ink" />
                        : <ToggleLeft className="w-6 h-6 text-ink-3" />}
                      <span className={`text-admin-sm font-semibold ${settings.cod_enabled !== "false" ? "text-ink" : "text-ink-3"}`}>
                        {settings.cod_enabled !== "false" ? "COD Enabled" : "COD Disabled"}
                      </span>
                    </button>
                    <p className="text-admin-micro text-ink-3 mt-1">When disabled, COD will not appear at checkout</p>
                  </div>
                </div>
              )}

              {activeSection === "payments" && (
                <div className="space-y-6">
                  {/* GCash */}
                  <div className="rounded-md overflow-hidden border border-line">
                    <div className="px-5 py-3 bg-paper-2 border-b border-line">
                      <span className="text-admin-sm font-semibold text-ink">GCash</span>
                    </div>
                    <div className="p-5 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="Number"       settingsKey="gcash_number" settings={settings} onChange={update} />
                        <Field label="Account Name" settingsKey="gcash_name"   settings={settings} onChange={update} />
                      </div>
                      <QRUploadField label="QR Code" value={settings.gcash_qr_url ?? ""} onChange={url => update("gcash_qr_url", url)} />
                    </div>
                  </div>

                  {/* Maya */}
                  <div className="rounded-md overflow-hidden border border-line">
                    <div className="px-5 py-3 bg-paper-2 border-b border-line">
                      <span className="text-admin-sm font-semibold text-ink">Maya</span>
                    </div>
                    <div className="p-5 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="Number"       settingsKey="maya_number" settings={settings} onChange={update} />
                        <Field label="Account Name" settingsKey="maya_name"   settings={settings} onChange={update} />
                      </div>
                      <QRUploadField label="QR Code" value={settings.maya_qr_url ?? ""} onChange={url => update("maya_qr_url", url)} />
                    </div>
                  </div>

                  {/* Bank Transfer */}
                  <div className="rounded-md overflow-hidden border border-line">
                    <div className="px-5 py-3 bg-paper-2 border-b border-line">
                      <span className="text-admin-sm font-semibold text-ink">Bank Transfer</span>
                    </div>
                    <div className="p-5 space-y-4">
                      <p className="text-admin-eyebrow text-ink-3">Bank 1</p>
                      <div className="grid grid-cols-3 gap-4">
                        <Field label="Bank Name"       settingsKey="bank1_name"           settings={settings} onChange={update} />
                        <Field label="Account Number"  settingsKey="bank1_account_number" settings={settings} onChange={update} />
                        <Field label="Account Name"    settingsKey="bank1_account_name"   settings={settings} onChange={update} />
                      </div>
                      <QRUploadField label="Bank 1 QR Code" value={settings.bank1_qr_url ?? ""} onChange={url => update("bank1_qr_url", url)} />
                      <div className="border-t border-line pt-4">
                        <p className="text-admin-eyebrow text-ink-3 mb-4">Bank 2</p>
                        <div className="grid grid-cols-3 gap-4">
                          <Field label="Bank Name"       settingsKey="bank2_name"           settings={settings} onChange={update} />
                          <Field label="Account Number"  settingsKey="bank2_account_number" settings={settings} onChange={update} />
                          <Field label="Account Name"    settingsKey="bank2_account_name"   settings={settings} onChange={update} />
                        </div>
                      </div>
                      <QRUploadField label="Bank 2 QR Code" value={settings.bank2_qr_url ?? ""} onChange={url => update("bank2_qr_url", url)} />
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "preorder" && (
                <div className="space-y-4">
                  <Field label="Default Pre-Order Message" settingsKey="preorder_message" settings={settings} onChange={update} multiline />
                  <Field label="New Arrivals Window (days)" settingsKey="new_arrivals_days" settings={settings} onChange={update} type="number" hint="Products added within this many days show as 'New' on the homepage and shop. Default: 14 days." />
                </div>
              )}

              {activeSection === "seo" && (
                <div className="space-y-4">
                  <Field label="Meta Title"          settingsKey="meta_title"          settings={settings} onChange={update} />
                  <Field label="Meta Description"    settingsKey="meta_description"    settings={settings} onChange={update} multiline />
                  <Field label="Google Analytics ID" settingsKey="google_analytics_id" settings={settings} onChange={update} hint="e.g. G-XXXXXXXXXX" />
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

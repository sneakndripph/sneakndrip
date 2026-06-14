"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { BRAND, FONTS, SNEAKER_SIZES, BRANDS } from "@/lib/constants";
import { ArrowLeft, CheckCircle, ChevronDown, Check } from "lucide-react";
import ImageUploader from "@/components/admin/ImageUploader";
function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now().toString(36);
}

export default function NewProductPage() {
  const [status, setStatus] = useState<"on-hand" | "pre-order">("on-hand");
  const [sizes, setSizes] = useState<{ size: string; stock: number }[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "", brand: "", colorway: "", gender: "Unisex", sku: "", description: "",
    srp: "", dp: "", full: "", cost: "", etaStart: "", etaEnd: "",
  });
  const [visibility, setVisibility] = useState({ published: true, featured: false, trending: false });
  const [brandOpen, setBrandOpen] = useState(false);
  const [genderOpen, setGenderOpen] = useState(false);
  const brandRef = useRef<HTMLDivElement>(null);
  const genderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (brandRef.current && !brandRef.current.contains(e.target as Node)) setBrandOpen(false);
      if (genderRef.current && !genderRef.current.contains(e.target as Node)) setGenderOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  function set(key: string, val: string) { setForm(f => ({ ...f, [key]: val })); }
  function toggleSize(s: string) {
    setSizes(prev => prev.find(x => x.size === s)
      ? prev.filter(x => x.size !== s)
      : [...prev, { size: s, stock: 1 }]);
  }
  function updateStock(s: string, stock: number) {
    setSizes(prev => prev.map(x => x.size === s ? { ...x, stock } : x));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.name || !form.brand || !form.full) { setError("Name, brand and full payment price are required."); return; }
    setSaving(true);
    try {
      const slug = toSlug(form.name);

      // Send everything (including image files) to API route — service role handles uploads + insert
      const fd = new FormData();
      fd.append("product", JSON.stringify({
        name: form.name, slug, brand: form.brand,
        colorway: form.colorway || null, gender: form.gender,
        sku: form.sku || null, description: form.description || null,
        srp_price: Number(form.srp) || Number(form.full),
        downpayment_price: Number(form.dp) || Math.round(Number(form.full) * 0.5),
        full_payment_price: Number(form.full),
        cost_price: form.cost ? Number(form.cost) : null,
        status,
        eta_start: status === "pre-order" && form.etaStart ? form.etaStart : null,
        eta_end: status === "pre-order" && form.etaEnd ? form.etaEnd : null,
        is_published: visibility.published, is_featured: visibility.featured,
        is_trending: visibility.trending, is_new: true,
        images: imageUrls,
      }));
      fd.append("sizes", JSON.stringify(sizes));

      const res = await fetch("/api/admin/products", { method: "POST", body: fd });

      const result = await res.json();
      if (!res.ok) { setError(result.error ?? "Failed to save product"); setSaving(false); return; }

      setSaved(true);
    } catch (err) {
      setError(String(err));
      setSaving(false);
    }
  }

  if (saved) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: `${BRAND.teal}15` }}>
          <CheckCircle className="w-8 h-8" style={{ color: BRAND.teal }} />
        </div>
        <h2 style={{ fontFamily: FONTS.display, fontSize: "2rem", color: BRAND.black }}>PRODUCT SAVED!</h2>
        <p className="mt-2 mb-6 text-sm" style={{ color: BRAND.muted }}>Your product has been added to the store.</p>
        <div className="flex gap-3">
          <Link href="/admin/products" className="px-6 py-3 font-bold text-sm uppercase tracking-wider"
            style={{ background: BRAND.black, color: BRAND.bg }}>Back to Products</Link>
          <button onClick={() => {
            setSaved(false);
            setForm({ name: "", brand: "", colorway: "", gender: "Unisex", sku: "", description: "", srp: "", dp: "", full: "", cost: "", etaStart: "", etaEnd: "" });
            setSizes([]); setImageUrls([]);
          }} className="px-6 py-3 font-bold text-sm uppercase tracking-wider"
            style={{ border: `1.5px solid ${BRAND.border}`, color: BRAND.black }}>Add Another</button>
        </div>
      </div>
    );
  }

  const inputStyle = { background: BRAND.bg, border: `1px solid ${BRAND.border}`, color: BRAND.black };

  return (
    <div style={{ fontFamily: FONTS.body }}>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/products" className="p-2 transition-opacity hover:opacity-60" style={{ color: BRAND.muted }}>
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: BRAND.teal }}>New Product</p>
          <h1 style={{ fontFamily: FONTS.display, fontSize: "2rem", letterSpacing: "0.04em", color: BRAND.black }}>ADD PRODUCT</h1>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 text-sm font-medium rounded"
          style={{ background: `${BRAND.red}12`, color: BRAND.red, border: `1px solid ${BRAND.red}30` }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            {/* Basic info */}
            <div className="p-6 rounded-xl" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <h2 className="font-black mb-5" style={{ color: BRAND.black }}>Product Information</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>Product Name *</label>
                  <input required value={form.name} onChange={e => set("name", e.target.value)}
                    placeholder="Nike Air Force 1 '07 White"
                    className="w-full px-4 py-3 text-sm focus:outline-none" style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>Brand *</label>
                  <div className="relative" ref={brandRef}>
                    <button type="button" onClick={() => setBrandOpen(o => !o)}
                      className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold focus:outline-none"
                      style={{ ...inputStyle, border: `1px solid ${brandOpen ? BRAND.teal : BRAND.border}` }}>
                      <span style={{ color: form.brand ? BRAND.black : BRAND.mutedLight }}>{form.brand || "Select brand…"}</span>
                      <ChevronDown className="w-4 h-4 shrink-0 transition-transform" style={{ color: BRAND.muted, transform: brandOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
                    </button>
                    {brandOpen && (
                      <div className="absolute left-0 right-0 top-full mt-1 z-50 overflow-hidden shadow-lg max-h-52 overflow-y-auto"
                        style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                        {BRANDS.map(b => (
                          <button key={b} type="button"
                            onClick={() => { set("brand", b); setBrandOpen(false); }}
                            className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors hover:opacity-80"
                            style={{
                              background: form.brand === b ? `${BRAND.teal}10` : "transparent",
                              color: form.brand === b ? BRAND.teal : BRAND.black,
                              borderBottom: `1px solid ${BRAND.border}`,
                              fontWeight: form.brand === b ? 700 : 500,
                            }}>
                            {b}
                            {form.brand === b && <Check className="w-3.5 h-3.5 shrink-0" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>Colorway</label>
                  <input value={form.colorway} onChange={e => set("colorway", e.target.value)}
                    placeholder="White / White"
                    className="w-full px-4 py-3 text-sm focus:outline-none" style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>Gender</label>
                  <div className="relative" ref={genderRef}>
                    <button type="button" onClick={() => setGenderOpen(o => !o)}
                      className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold focus:outline-none"
                      style={{ ...inputStyle, border: `1px solid ${genderOpen ? BRAND.teal : BRAND.border}` }}>
                      <span style={{ color: BRAND.black }}>{form.gender}</span>
                      <ChevronDown className="w-4 h-4 shrink-0 transition-transform" style={{ color: BRAND.muted, transform: genderOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
                    </button>
                    {genderOpen && (
                      <div className="absolute left-0 right-0 top-full mt-1 z-50 overflow-hidden shadow-lg"
                        style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                        {["Unisex", "Men", "Women", "Kids"].map(g => (
                          <button key={g} type="button"
                            onClick={() => { set("gender", g); setGenderOpen(false); }}
                            className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors hover:opacity-80"
                            style={{
                              background: form.gender === g ? `${BRAND.teal}10` : "transparent",
                              color: form.gender === g ? BRAND.teal : BRAND.black,
                              borderBottom: `1px solid ${BRAND.border}`,
                              fontWeight: form.gender === g ? 700 : 500,
                            }}>
                            {g}
                            {form.gender === g && <Check className="w-3.5 h-3.5 shrink-0" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>SKU</label>
                  <input value={form.sku} onChange={e => set("sku", e.target.value)}
                    placeholder="NK-AF1-WHT-001"
                    className="w-full px-4 py-3 text-sm focus:outline-none" style={inputStyle} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>Description</label>
                  <textarea rows={3} value={form.description} onChange={e => set("description", e.target.value)}
                    placeholder="Product description…"
                    className="w-full px-4 py-3 text-sm focus:outline-none resize-none" style={inputStyle} />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="p-6 rounded-xl" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <h2 className="font-black mb-5" style={{ color: BRAND.black }}>Pricing</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { label: "SRP Price", placeholder: "10295", key: "srp" },
                  { label: "Downpayment Price", placeholder: "9490", key: "dp" },
                  { label: "Full Payment Price *", placeholder: "9000", key: "full" },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>{f.label}</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: BRAND.muted }}>₱</span>
                      <input type="number" placeholder={f.placeholder}
                        value={form[f.key as keyof typeof form]}
                        onChange={e => set(f.key, e.target.value)}
                        className="w-full pl-7 pr-4 py-3 text-sm focus:outline-none" style={inputStyle} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${BRAND.border}` }}>
                <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.muted }}>
                  Cost Price (internal — used for profit calculation)
                </label>
                <div className="relative max-w-[180px]">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: BRAND.muted }}>₱</span>
                  <input type="number" value={form.cost} onChange={e => set("cost", e.target.value)}
                    placeholder="0"
                    className="w-full pl-7 pr-4 py-3 text-sm focus:outline-none" style={inputStyle} />
                </div>
              </div>
            </div>

            {/* Availability */}
            <div className="p-6 rounded-xl" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <h2 className="font-black mb-5" style={{ color: BRAND.black }}>Availability</h2>
              <div className="grid sm:grid-cols-2 gap-3 mb-4">
                {([
                  { value: "on-hand" as const, label: "On Hand", desc: "Available for immediate shipping" },
                  { value: "pre-order" as const, label: "Pre-Order", desc: "Reserve now, ships later" },
                ]).map(opt => (
                  <button key={opt.value} type="button" onClick={() => setStatus(opt.value)}
                    className="p-4 text-left rounded-xl transition-all"
                    style={{ border: `2px solid ${status === opt.value ? BRAND.teal : BRAND.border}`, background: status === opt.value ? `${BRAND.teal}08` : "transparent" }}>
                    <p className="font-bold text-sm mb-0.5" style={{ color: BRAND.black }}>{opt.label}</p>
                    <p className="text-xs" style={{ color: BRAND.muted }}>{opt.desc}</p>
                  </button>
                ))}
              </div>
              {status === "pre-order" && (
                <div className="grid sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>ETA Start</label>
                    <input type="date" value={form.etaStart} onChange={e => set("etaStart", e.target.value)}
                      className="w-full px-4 py-3 text-sm focus:outline-none" style={inputStyle} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>ETA End</label>
                    <input type="date" value={form.etaEnd} onChange={e => set("etaEnd", e.target.value)}
                      className="w-full px-4 py-3 text-sm focus:outline-none" style={inputStyle} />
                  </div>
                </div>
              )}
            </div>

            {/* Sizes */}
            <div className="p-6 rounded-xl" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <h2 className="font-black mb-2" style={{ color: BRAND.black }}>Sizes & Stock</h2>
              <p className="text-xs mb-4" style={{ color: BRAND.muted }}>Click a size to add it, then set the stock count.</p>
              <div className="flex flex-wrap gap-2 mb-5">
                {SNEAKER_SIZES.map(s => {
                  const added = sizes.find(x => x.size === s);
                  return (
                    <button key={s} type="button" onClick={() => toggleSize(s)}
                      className="px-3 py-2 text-xs font-semibold transition-all"
                      style={{ border: `1.5px solid ${added ? BRAND.teal : BRAND.border}`, background: added ? `${BRAND.teal}15` : "transparent", color: added ? BRAND.teal : BRAND.muted }}>
                      {s}
                    </button>
                  );
                })}
              </div>
              {sizes.length > 0 && (
                <div className="space-y-2">
                  {sizes.map(s => (
                    <div key={s.size} className="flex items-center gap-3">
                      <span className="text-xs font-bold w-14 text-right" style={{ color: BRAND.black }}>{s.size}</span>
                      <input type="number" min="0" value={s.stock}
                        onChange={e => updateStock(s.size, Number(e.target.value))}
                        className="w-20 px-3 py-2 text-sm text-center focus:outline-none" style={inputStyle} />
                      <span className="text-xs" style={{ color: BRAND.muted }}>pairs</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-5">
            <div className="p-6 rounded-xl" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <h2 className="font-black mb-4" style={{ color: BRAND.black }}>Product Images</h2>
              <ImageUploader onChange={setImageUrls} />
            </div>

            <div className="p-6 rounded-xl" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <h2 className="font-black mb-4" style={{ color: BRAND.black }}>Visibility</h2>
              <div className="space-y-3">
                {([["published", "Published"], ["featured", "Featured"], ["trending", "Trending"]] as const).map(([key, label]) => (
                  <label key={key} className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm font-medium" style={{ color: BRAND.black }}>{label}</span>
                    <input type="checkbox" checked={visibility[key]}
                      onChange={e => setVisibility(v => ({ ...v, [key]: e.target.checked }))}
                      className="w-4 h-4" style={{ accentColor: BRAND.teal }} />
                  </label>
                ))}
              </div>
            </div>

            <button type="submit" disabled={saving}
              className="w-full py-4 font-black text-sm uppercase tracking-widest transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: BRAND.black, color: BRAND.bg }}>
              {saving ? "Saving…" : "Save Product"}
            </button>
            <Link href="/admin/products"
              className="flex items-center justify-center w-full py-3 text-sm font-semibold transition-opacity hover:opacity-60"
              style={{ color: BRAND.muted }}>
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { BRAND, FONTS, SNEAKER_SIZES, BRANDS } from "@/lib/constants";
import { Upload, ArrowLeft, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now().toString(36);
}

export default function NewProductPage() {
  const [status, setStatus] = useState<"on-hand" | "pre-order">("on-hand");
  const [sizes, setSizes] = useState<{ size: string; stock: number }[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "", brand: "", colorway: "", gender: "Unisex", sku: "", description: "",
    srp: "", dp: "", full: "", etaStart: "", etaEnd: "",
  });
  const [visibility, setVisibility] = useState({ published: true, featured: false, trending: false });

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
      const supabase = createClient();
      const slug = toSlug(form.name);

      // Upload images to Supabase Storage
      const imageUrls: string[] = [];
      for (const file of images) {
        const ext = file.name.split(".").pop();
        const path = `${slug}/${Date.now()}.${ext}`;
        const { data: upload } = await supabase.storage.from("product-images").upload(path, file, { upsert: true });
        if (upload) {
          const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(upload.path);
          imageUrls.push(publicUrl);
        }
      }

      // Insert product
      const { data: product, error: insertError } = await supabase.from("products").insert({
        name: form.name,
        slug,
        brand: form.brand,
        colorway: form.colorway || null,
        gender: form.gender,
        sku: form.sku || null,
        description: form.description || null,
        srp_price: Number(form.srp) || Number(form.full),
        downpayment_price: Number(form.dp) || Math.round(Number(form.full) * 0.5),
        full_payment_price: Number(form.full),
        status,
        eta_start: status === "pre-order" && form.etaStart ? form.etaStart : null,
        eta_end: status === "pre-order" && form.etaEnd ? form.etaEnd : null,
        is_published: visibility.published,
        is_featured: visibility.featured,
        is_trending: visibility.trending,
        is_new: true,
        images: imageUrls.length ? imageUrls : null,
      }).select("id").single();

      if (insertError) { setError(insertError.message); setSaving(false); return; }

      // Insert sizes
      if (sizes.length > 0 && product) {
        await supabase.from("product_sizes").insert(
          sizes.map(s => ({ product_id: product.id, size: s.size, stock: s.stock }))
        );
      }

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
            setForm({ name: "", brand: "", colorway: "", gender: "Unisex", sku: "", description: "", srp: "", dp: "", full: "", etaStart: "", etaEnd: "" });
            setSizes([]); setImages([]);
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
                  <select required value={form.brand} onChange={e => set("brand", e.target.value)}
                    className="w-full px-4 py-3 text-sm focus:outline-none appearance-none" style={inputStyle}>
                    <option value="">Select brand…</option>
                    {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>Colorway</label>
                  <input value={form.colorway} onChange={e => set("colorway", e.target.value)}
                    placeholder="White / White"
                    className="w-full px-4 py-3 text-sm focus:outline-none" style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>Gender</label>
                  <select value={form.gender} onChange={e => set("gender", e.target.value)}
                    className="w-full px-4 py-3 text-sm focus:outline-none appearance-none" style={inputStyle}>
                    {["Unisex","Men","Women","Kids"].map(g => <option key={g}>{g}</option>)}
                  </select>
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
              <label className="block border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors"
                style={{ borderColor: images.length ? BRAND.teal : BRAND.border }}>
                <input type="file" multiple accept="image/*" className="hidden"
                  onChange={e => setImages(Array.from(e.target.files || []))} />
                <Upload className="w-8 h-8 mx-auto mb-2" style={{ color: BRAND.mutedLight }} />
                <p className="text-sm font-semibold" style={{ color: BRAND.black }}>
                  {images.length > 0 ? `${images.length} image(s) selected` : "Upload product photos"}
                </p>
                <p className="text-xs mt-1" style={{ color: BRAND.muted }}>JPG, PNG — up to 10MB each</p>
              </label>
              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {images.slice(0, 6).map((img, i) => (
                    <div key={i} className="aspect-square rounded-lg flex items-center justify-center text-xs font-bold"
                      style={{ background: BRAND.bg, border: `1px solid ${BRAND.border}`, color: BRAND.muted }}>
                      {img.name.slice(0, 8)}…
                    </div>
                  ))}
                </div>
              )}
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

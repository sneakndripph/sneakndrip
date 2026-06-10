"use client";

import { useState } from "react";
import Link from "next/link";
import { BRAND, FONTS, SNEAKER_SIZES, BRANDS } from "@/lib/constants";
import { Upload, ArrowLeft, Plus, X } from "lucide-react";

export default function NewProductPage() {
  const [status, setStatus] = useState<"on-hand" | "pre-order">("on-hand");
  const [sizes, setSizes] = useState<{ size: string; stock: number }[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [saved, setSaved] = useState(false);

  function toggleSize(s: string) {
    setSizes(prev => prev.find(x => x.size === s)
      ? prev.filter(x => x.size !== s)
      : [...prev, { size: s, stock: 1 }]
    );
  }

  function updateStock(s: string, stock: number) {
    setSizes(prev => prev.map(x => x.size === s ? { ...x, stock } : x));
  }

  if (saved) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: `${BRAND.teal}15` }}>
          <span className="text-3xl">✓</span>
        </div>
        <h2 style={{ fontFamily: FONTS.display, fontSize: "2rem", color: BRAND.black }}>PRODUCT SAVED!</h2>
        <p className="mt-2 mb-6 text-sm" style={{ color: BRAND.muted }}>Your product has been added successfully.</p>
        <div className="flex gap-3">
          <Link href="/admin/products" className="px-6 py-3 font-bold text-sm uppercase tracking-wider"
            style={{ background: BRAND.black, color: BRAND.bg }}>Back to Products</Link>
          <button onClick={() => setSaved(false)} className="px-6 py-3 font-bold text-sm uppercase tracking-wider"
            style={{ border: `1.5px solid ${BRAND.border}`, color: BRAND.black }}>Add Another</button>
        </div>
      </div>
    );
  }

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

      <form onSubmit={e => { e.preventDefault(); setSaved(true); }}>
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main details */}
          <div className="lg:col-span-2 space-y-5">
            {/* Basic info */}
            <div className="p-6 rounded-xl" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <h2 className="font-black mb-5" style={{ color: BRAND.black }}>Product Information</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>Product Name *</label>
                  <input required placeholder="Nike Air Force 1 '07 White"
                    className="w-full px-4 py-3 text-sm focus:outline-none"
                    style={{ background: BRAND.bg, border: `1px solid ${BRAND.border}`, color: BRAND.black }} />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>Brand *</label>
                  <select required className="w-full px-4 py-3 text-sm focus:outline-none appearance-none"
                    style={{ background: BRAND.bg, border: `1px solid ${BRAND.border}`, color: BRAND.black }}>
                    <option value="">Select brand…</option>
                    {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>Colorway</label>
                  <input placeholder="White / White"
                    className="w-full px-4 py-3 text-sm focus:outline-none"
                    style={{ background: BRAND.bg, border: `1px solid ${BRAND.border}`, color: BRAND.black }} />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>Gender</label>
                  <select className="w-full px-4 py-3 text-sm focus:outline-none appearance-none"
                    style={{ background: BRAND.bg, border: `1px solid ${BRAND.border}`, color: BRAND.black }}>
                    {["Unisex","Men","Women","Kids"].map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>SKU</label>
                  <input placeholder="NK-AF1-WHT-001"
                    className="w-full px-4 py-3 text-sm focus:outline-none"
                    style={{ background: BRAND.bg, border: `1px solid ${BRAND.border}`, color: BRAND.black }} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>Description</label>
                  <textarea rows={3} placeholder="Product description…"
                    className="w-full px-4 py-3 text-sm focus:outline-none resize-none"
                    style={{ background: BRAND.bg, border: `1px solid ${BRAND.border}`, color: BRAND.black }} />
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
                  { label: "Full Payment Price", placeholder: "9000", key: "full" },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>
                      {f.label}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: BRAND.muted }}>₱</span>
                      <input type="number" placeholder={f.placeholder}
                        className="w-full pl-7 pr-4 py-3 text-sm focus:outline-none"
                        style={{ background: BRAND.bg, border: `1px solid ${BRAND.border}`, color: BRAND.black }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Status & ETA */}
            <div className="p-6 rounded-xl" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <h2 className="font-black mb-5" style={{ color: BRAND.black }}>Availability</h2>
              <div className="grid sm:grid-cols-2 gap-3 mb-4">
                {[
                  { value: "on-hand" as const, label: "On Hand", desc: "Available for immediate shipping" },
                  { value: "pre-order" as const, label: "Pre-Order", desc: "Reserve now, ships later" },
                ].map(opt => (
                  <button key={opt.value} type="button" onClick={() => setStatus(opt.value)}
                    className="p-4 text-left rounded-xl transition-all"
                    style={{
                      border: `2px solid ${status === opt.value ? BRAND.teal : BRAND.border}`,
                      background: status === opt.value ? `${BRAND.teal}08` : "transparent",
                    }}>
                    <p className="font-bold text-sm mb-0.5" style={{ color: BRAND.black }}>{opt.label}</p>
                    <p className="text-xs" style={{ color: BRAND.muted }}>{opt.desc}</p>
                  </button>
                ))}
              </div>
              {status === "pre-order" && (
                <div className="grid sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>ETA Start</label>
                    <input type="date" className="w-full px-4 py-3 text-sm focus:outline-none"
                      style={{ background: BRAND.bg, border: `1px solid ${BRAND.border}`, color: BRAND.black }} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>ETA End</label>
                    <input type="date" className="w-full px-4 py-3 text-sm focus:outline-none"
                      style={{ background: BRAND.bg, border: `1px solid ${BRAND.border}`, color: BRAND.black }} />
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
                      style={{
                        border: `1.5px solid ${added ? BRAND.teal : BRAND.border}`,
                        background: added ? `${BRAND.teal}15` : "transparent",
                        color: added ? BRAND.teal : BRAND.muted,
                      }}>
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
                        className="w-20 px-3 py-2 text-sm text-center focus:outline-none"
                        style={{ background: BRAND.bg, border: `1px solid ${BRAND.border}`, color: BRAND.black }} />
                      <span className="text-xs" style={{ color: BRAND.muted }}>pairs</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Images + Submit */}
          <div className="space-y-5">
            {/* Images */}
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
                    <div key={i} className="aspect-square rounded-lg flex items-center justify-center text-xs font-bold overflow-hidden"
                      style={{ background: BRAND.bg, border: `1px solid ${BRAND.border}`, color: BRAND.muted }}>
                      {img.name.slice(0, 8)}…
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Settings */}
            <div className="p-6 rounded-xl" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <h2 className="font-black mb-4" style={{ color: BRAND.black }}>Visibility</h2>
              <div className="space-y-3">
                {[["Published", true], ["Featured", false], ["Trending", false]].map(([l, def]) => (
                  <label key={String(l)} className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm font-medium" style={{ color: BRAND.black }}>{String(l)}</span>
                    <input type="checkbox" defaultChecked={!!def} className="w-4 h-4 accent-teal-500" style={{ accentColor: BRAND.teal }} />
                  </label>
                ))}
              </div>
            </div>

            <button type="submit"
              className="w-full py-4 font-black text-sm uppercase tracking-widest transition-opacity hover:opacity-90"
              style={{ background: BRAND.black, color: BRAND.bg }}>
              Save Product
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
